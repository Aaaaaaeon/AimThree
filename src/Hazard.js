import * as THREE from 'three';

export class Hazard {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.isActive = false;

        // Visuals - Missile Group
        this.mesh = new THREE.Group();
        
        // Body (Cylinder)
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
        bodyGeo.rotateX(Math.PI / 2); // Point along Z
        const bodyMat = new THREE.MeshBasicMaterial({ color: 0x888888 }); // Grey body
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        this.mesh.add(body);

        // Nose (Cone)
        const noseGeo = new THREE.ConeGeometry(0.5, 1, 8);
        noseGeo.rotateX(Math.PI / 2);
        noseGeo.translate(0, 0, 2); // Move to front
        const noseMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Blue nose
        const nose = new THREE.Mesh(noseGeo, noseMat);
        this.mesh.add(nose);
        
        // Fins (Boxes)
        const finGeo = new THREE.BoxGeometry(0.1, 1.5, 1);
        const finMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        
        const fin1 = new THREE.Mesh(finGeo, finMat);
        fin1.position.z = -1;
        this.mesh.add(fin1);
        
        const fin2 = new THREE.Mesh(finGeo, finMat);
        fin2.rotation.z = Math.PI / 2;
        fin2.position.z = -1;
        this.mesh.add(fin2);
        
        // Engine Glow
        const engineGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const engineMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        this.engine = new THREE.Mesh(engineGeo, engineMat);
        this.engine.position.z = -1.6;
        this.mesh.add(this.engine);

        this.scene.add(this.mesh);
        this.mesh.visible = false;

        // Movement
        this.velocity = new THREE.Vector3();
        this.speed = 2.0;
        this.changeDirTimer = 0;
        
        // Flashing
        this.flashTimer = 0;
    }

    spawn(playerPos, speed = 10.0) { // faster default speed
        this.isActive = true;
        this.speed = speed * 4; // Make them fast!
        this.mesh.visible = true;

        // Spawn at random position far away
        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 10;
        const height = 1 + Math.random() * 6;
        
        const startX = Math.cos(angle) * distance;
        const startZ = Math.sin(angle) * distance;
        
        this.mesh.position.set(startX, height, startZ);

        // Aim at player
        const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
        
        // Add some inaccuracy?
        // dir.x += (Math.random() - 0.5) * 0.2;
        // dir.y += (Math.random() - 0.5) * 0.1;
        // dir.z += (Math.random() - 0.5) * 0.2;
        // dir.normalize();

        this.velocity.copy(dir).multiplyScalar(this.speed);
        
        // Face direction
        this.mesh.lookAt(playerPos);
    }

    despawn() {
        this.mesh.visible = false;
        this.isActive = false;
    }

    update(delta, playerPos) {
        if (!this.isActive) return;

        // Visual Rotation (Spin)
        this.mesh.rotation.z += delta * 10; // Spin fast

        // Engine Pulse
        this.flashTimer += delta * 20;
        if (this.engine) {
            const scale = 1 + Math.sin(this.flashTimer) * 0.3;
            this.engine.scale.set(scale, scale, scale);
        }

        // Move linearly
        this.mesh.position.addScaledVector(this.velocity, delta);

        // Despawn checks (distance)
        if (this.mesh.position.distanceTo(new THREE.Vector3(0,0,0)) > 60) {
            this.despawn();
        }
    }

    checkCollision(playerPos) {
        if (!this.isActive) return false;
        // Box collision approximation (using sphere for simplicity but with larger radius)
        const dist = this.mesh.position.distanceTo(playerPos);

        return dist < 1.0; // Tighter hitbox for missiles
    }
}
