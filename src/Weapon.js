import * as THREE from 'three';

export class Weapon extends THREE.Group {
    constructor(camera) {
        super();
        this.camera = camera;

        // Weapon Group Container
        this.position.set(0.3, -0.3, -0.5);
        
        // Procedural Gun Construction
        const materialBlack = new THREE.MeshStandardMaterial({ 
            color: 0x111111, 
            roughness: 0.2, 
            metalness: 0.8 
        });
        const materialNeon = new THREE.MeshStandardMaterial({ 
            color: 0x00ffff, 
            emissive: 0x00ffff,
            emissiveIntensity: 2,
        });

        // Main Body
        const bodyGeo = new THREE.BoxGeometry(0.1, 0.15, 0.4);
        const body = new THREE.Mesh(bodyGeo, materialBlack);
        this.add(body);

        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 16);
        barrelGeo.rotateX(Math.PI / 2);
        const barrel = new THREE.Mesh(barrelGeo, materialBlack);
        barrel.position.set(0, 0.05, -0.2);
        this.add(barrel);

        // Neon Strips (Sci-Fi Look)
        const stripGeo = new THREE.BoxGeometry(0.11, 0.02, 0.3);
        const strip = new THREE.Mesh(stripGeo, materialNeon);
        strip.position.set(0, 0.09, 0);
        this.add(strip);

        // Muzzle Flash Light
        this.flash = new THREE.PointLight(0x00ffff, 0, 5);
        this.flash.position.set(0, 0.05, -0.5);
        this.add(this.flash);

        // Animation state
        this.recoilTimer = 0;
        this.isRecoiling = false;
    }

    shoot() {
        // Trigger Recoil
        this.recoilTimer = 0;
        this.isRecoiling = true;

        // Trigger Flash
        this.flash.intensity = 5;
        setTimeout(() => {
            this.flash.intensity = 0;
        }, 50);
    }

    update(delta) {
        // Recoil Animation
        if (this.isRecoiling) {
            this.recoilTimer += delta * 10;
            if (this.recoilTimer > Math.PI) {
                this.recoilTimer = 0;
                this.isRecoiling = false;
                this.position.z = -0.5; // Reset
            } else {
                // Kick back
                this.position.z = -0.5 + Math.sin(this.recoilTimer) * 0.1;
            }
        }
    }
}
