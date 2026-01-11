import * as THREE from 'three';

export class Target {
    constructor(scene, camera = null) {
        this.scene = scene;
        this.camera = camera;
        this.isActive = false;
        
        // Health system (for campaign mode)
        this.maxHealth = 25;
        this.health = 25;
        
        // Size (for variable size levels)
        this.targetScale = 1.0;
        
        // Ephemeral mode (appear/disappear quickly)
        this.isEphemeral = false;
        this.ephemeralDuration = 1.5; // seconds visible
        this.ephemeralTimer = 0;
        
        // Neon Target (Solid Red unlit for max visibility)
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000
        });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Store reference to this instance in user data for raycasting
        this.mesh.userData.target = this;
        
        // Create health bar
        this.createHealthBar();
        
        // Initially hide
        this.mesh.visible = false;
        this.scene.add(this.mesh);

        // Movement properties for tracking mode
        this.moveSpeed = 2.0;
        this.moveDirection = new THREE.Vector3();
        this.changeDirTimer = 0;
    }

    createHealthBar() {
        // Health bar container (group)
        this.healthBarGroup = new THREE.Group();
        this.healthBarGroup.position.y = 0.8; // Above the target
        
        // Background bar (dark)
        const bgGeometry = new THREE.PlaneGeometry(0.8, 0.1);
        const bgMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x333333,
            side: THREE.DoubleSide
        });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarGroup.add(this.healthBarBg);
        
        // Health bar (green to red based on health)
        const healthGeometry = new THREE.PlaneGeometry(0.76, 0.06);
        const healthMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            side: THREE.DoubleSide
        });
        this.healthBarFill = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBarFill.position.z = 0.01; // Slightly in front
        this.healthBarGroup.add(this.healthBarFill);
        
        // Add to mesh
        this.mesh.add(this.healthBarGroup);
    }

    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        
        // Scale the health bar
        this.healthBarFill.scale.x = Math.max(0.01, healthPercent);
        
        // Offset to keep it left-aligned
        this.healthBarFill.position.x = -0.38 * (1 - healthPercent);
        
        // Color gradient: green -> yellow -> red
        let color;
        if (healthPercent > 0.5) {
            // Green to yellow
            const t = (healthPercent - 0.5) * 2;
            color = new THREE.Color().setHSL(0.1 + t * 0.2, 1, 0.5);
        } else {
            // Yellow to red
            const t = healthPercent * 2;
            color = new THREE.Color().setHSL(t * 0.1, 1, 0.5);
        }
        this.healthBarFill.material.color = color;
    }

    spawn(position) {
        this.mesh.position.copy(position);
        this.mesh.visible = true;
        this.isActive = true;
        this.mesh.material.color.setHex(0xff0000); // Reset color
        this.mesh.material.transparent = false;
        this.mesh.material.opacity = 1;
        
        // Apply scale
        this.mesh.scale.setScalar(this.targetScale);
        
        // Adjust health bar position based on scale
        this.healthBarGroup.position.y = 0.8 * this.targetScale;
        
        // Reset health
        this.health = this.maxHealth;
        this.updateHealthBar();
        
        // Reset ephemeral timer
        this.ephemeralTimer = 0;
        
        // Random initial direction for tracking
        this.setRandomDirection();
    }

    despawn() {
        this.mesh.visible = false;
        this.isActive = false;
    }

    hit() {
        // Visual feedback?
        this.despawn();
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
        
        // Flash effect
        this.mesh.material.color.setHex(0xffffff);
        setTimeout(() => {
            if (this.isActive) {
                this.mesh.material.color.setHex(0xff0000);
            }
        }, 50);
        
        return this.health <= 0;
    }

    takeContinuousDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();
        
        // Glow effect (orange) instead of white flash
        this.mesh.material.color.setHex(0xffaa00);
        
        // Reset color next frame (handled by update loop or simple timer)
        // For continuous, we want it to stay orange as long as being hit
        // We'll rely on the game loop to reset it if not hit, or just timer
        if (this.resetColorTimer) clearTimeout(this.resetColorTimer);
        this.resetColorTimer = setTimeout(() => {
            if (this.isActive) {
                this.mesh.material.color.setHex(0xff0000);
            }
        }, 50);

        return this.health <= 0;
    }

    setRandomDirection() {
        this.moveDirection.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();
    }

    update(delta, mode, camera = null) {
        if (!this.isActive) return;

        // Make health bar face camera
        if (camera || this.camera) {
            const cam = camera || this.camera;
            this.healthBarGroup.quaternion.copy(cam.quaternion);
        }

        // Ephemeral targets disappear after duration
        if (this.isEphemeral) {
            this.ephemeralTimer += delta;
            
            // Fade out effect near end
            const timeLeft = this.ephemeralDuration - this.ephemeralTimer;
            
            // Shrink effect over the last 50% of life or continuously?
            // "Commencent grosse et diminue jusqu'a disparaitre" implies continuous shrinking or at least significant shrinking.
            // Let's do continuously from the start or accelerate. 
            // Better visual: Start full size, hold for a bit, then shrink.
            // Or shrink linearly. Let's try linear shrink from 100% to 0%.
            
            const lifePercent = Math.max(0, timeLeft / this.ephemeralDuration);
            this.mesh.scale.setScalar(this.targetScale * lifePercent);
            this.healthBarGroup.scale.setScalar(lifePercent); // Also shrink health bar

            if (timeLeft < 0.3) {
                const alpha = timeLeft / 0.3;
                this.mesh.material.opacity = alpha;
                this.mesh.material.transparent = true;
            }
            
            if (this.ephemeralTimer >= this.ephemeralDuration) {
                this.despawn();
                return;
            }
        }

        // Move if moveSpeed > 0 (campaign mode uses this)
        const shouldMove = mode === 'tracking' || (mode === 'campaign' && this.moveSpeed > 0);

        if (shouldMove && this.moveSpeed > 0) {
            // Move target
            this.mesh.position.addScaledVector(this.moveDirection, this.moveSpeed * delta);

            // Bounce off boundaries (simple box constraint)
            const range = 8;
            if (this.mesh.position.x > range || this.mesh.position.x < -range) this.moveDirection.x *= -1;
            if (this.mesh.position.y > range || this.mesh.position.y < 1) this.moveDirection.y *= -1; // Floor check
            if (this.mesh.position.z > 0 || this.mesh.position.z < -range*2) this.moveDirection.z *= -1; // Keep in front of player mostly

            // Frequently change direction for erratic movement
            this.changeDirTimer += delta;
            if (this.changeDirTimer > 1.0) {
                this.changeDirTimer = 0;
                // Blend with new random direction
                const newDir = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ).normalize();
                this.moveDirection.lerp(newDir, 0.5).normalize();
            }
        }
    }
}
