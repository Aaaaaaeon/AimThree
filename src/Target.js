import * as THREE from 'three';

export class Target {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        
        // Neon Target (Solid Red unlit for max visibility)
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000
        });
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Store reference to this instance in user data for raycasting
        this.mesh.userData.target = this;
        
        // Initially hide
        this.mesh.visible = false;
        this.scene.add(this.mesh);

        // Movement properties for tracking mode
        this.moveSpeed = 2.0;
        this.moveDirection = new THREE.Vector3();
        this.changeDirTimer = 0;
    }

    spawn(position) {
        this.mesh.position.copy(position);
        this.mesh.visible = true;
        this.isActive = true;
        this.mesh.material.color.setHex(0xff0000); // Reset color
        
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

    setRandomDirection() {
        this.moveDirection.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        ).normalize();
    }

    update(delta, mode) {
        if (!this.isActive) return;

        if (mode === 'tracking') {
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
