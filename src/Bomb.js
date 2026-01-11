import * as THREE from 'three';

/**
 * Bomb entity - if player hits it, level is lost
 * Now ephemeral - disappears after a set time
 */
export class Bomb {
    constructor(scene, camera = null) {
        this.scene = scene;
        this.camera = camera;
        this.isActive = false;
        this.isBomb = true; // Identifier
        
        // Ephemeral system
        this.ephemeralDuration = 2.0; // seconds before despawn
        this.ephemeralTimer = 0;
        
        // Create bomb mesh (dark sphere with warning)
        const geometry = new THREE.SphereGeometry(0.4, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 1
        });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Add pulsing red outline effect
        const outlineGeo = new THREE.SphereGeometry(0.45, 16, 16);
        const outlineMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            transparent: true,
            opacity: 1
        });
        this.outline = new THREE.Mesh(outlineGeo, outlineMat);
        this.mesh.add(this.outline);
        
        // Add skull/warning symbol (simple cross)
        const crossMat = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 1
        });
        const crossGeoH = new THREE.BoxGeometry(0.4, 0.1, 0.02);
        const crossGeoV = new THREE.BoxGeometry(0.1, 0.4, 0.02);
        this.crossH = new THREE.Mesh(crossGeoH, crossMat);
        this.crossV = new THREE.Mesh(crossGeoV, crossMat.clone());
        this.crossH.position.z = 0.4;
        this.crossV.position.z = 0.4;
        this.mesh.add(this.crossH);
        this.mesh.add(this.crossV);
        
        // Store reference to this instance in user data for raycasting
        this.mesh.userData.bomb = this;
        this.mesh.userData.target = this; // For compatibility with raycast checks
        
        // Initially hide
        this.mesh.visible = false;
        this.scene.add(this.mesh);

        // Movement properties
        this.moveSpeed = 0;
        this.moveDirection = new THREE.Vector3();
        this.changeDirTimer = 0;
        
        // Pulse animation
        this.pulseTimer = 0;
    }

    spawn(position) {
        this.mesh.position.copy(position);
        this.mesh.visible = true;
        this.isActive = true;
        this.pulseTimer = 0;
        this.ephemeralTimer = 0;
        
        // Reset opacity
        this.mesh.material.opacity = 1;
        this.outline.material.opacity = 1;
        this.crossH.material.opacity = 1;
        this.crossV.material.opacity = 1;
        
        // Random initial direction
        this.setRandomDirection();
    }

    despawn() {
        this.mesh.visible = false;
        this.isActive = false;
    }

    hit() {
        // Bomb was hit - this triggers level loss
        this.despawn();
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

        // Ephemeral timer - bombs disappear too
        this.ephemeralTimer += delta;
        
        // Fade out near end
        const timeLeft = this.ephemeralDuration - this.ephemeralTimer;
        if (timeLeft < 0.5) {
            const alpha = Math.max(0, timeLeft / 0.5);
            this.mesh.material.opacity = alpha;
            this.outline.material.opacity = alpha;
            this.crossH.material.opacity = alpha;
            this.crossV.material.opacity = alpha;
        }
        
        if (this.ephemeralTimer >= this.ephemeralDuration) {
            this.despawn();
            return;
        }

        // Pulse animation
        this.pulseTimer += delta * 5;
        const scale = 1 + Math.sin(this.pulseTimer) * 0.1;
        this.outline.scale.setScalar(scale);
        
        // Make cross face camera
        if (camera || this.camera) {
            const cam = camera || this.camera;
            // Rotate to face camera
            this.mesh.children.forEach(child => {
                if (child !== this.outline) {
                    child.quaternion.copy(cam.quaternion);
                }
            });
        }

        // Move if moveSpeed > 0
        if (this.moveSpeed > 0) {
            this.mesh.position.addScaledVector(this.moveDirection, this.moveSpeed * delta);

            // Bounce off boundaries
            const range = 8;
            if (this.mesh.position.x > range || this.mesh.position.x < -range) this.moveDirection.x *= -1;
            if (this.mesh.position.y > range || this.mesh.position.y < 1) this.moveDirection.y *= -1;
            if (this.mesh.position.z > 0 || this.mesh.position.z < -range*2) this.moveDirection.z *= -1;

            this.changeDirTimer += delta;
            if (this.changeDirTimer > 1.5) {
                this.changeDirTimer = 0;
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

