import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Target } from './Target.js';
import { Weapon } from './Weapon.js';
import { SoundManager } from './SoundManager.js';

export class Game {
    constructor(container) {
        this.container = container;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Game State
        this.score = 0;
        this.gameMode = 'static'; // 'static', 'tracking', or 'parkour'
        this.targets = [];
        this.lastSpawnTime = 0;

        // Parkour Mode State
        this.parkourPlatforms = [];
        this.goalPlatform = null;
        this.parkourStartTime = 0;
        this.startPlatformY = 2;

        // GLB Model Loader
        this.gltfLoader = new GLTFLoader();
        this.platformModel = null; // Will hold loaded platform model
        this.goalModel = null; // Will hold loaded goal model

        // UI Elements
        this.scoreEl = document.getElementById('score');
        this.timeEl = document.getElementById('timer');
        this.hitsEl = document.getElementById('hits');
        this.menuEl = document.getElementById('main-menu');
        this.pauseEl = document.getElementById('pause-menu');
        this.settingsEl = document.getElementById('settings-menu');
        this.endScreenEl = document.getElementById('end-screen');
        this.hudEl = document.getElementById('hud');
        this.crosshairEl = document.getElementById('crosshair');
        this.heightEl = document.getElementById('height');
        this.sensSlider = document.getElementById('sens-slider');
        this.sensValue = document.getElementById('sens-value');

        // Stats Elements
        this.finalScoreEl = document.getElementById('final-score');
        this.finalAccuracyEl = document.getElementById('final-accuracy');
        this.finalHitsEl = document.getElementById('final-hits');
        this.finalMissesEl = document.getElementById('final-misses');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.FogExp2(0x050510, 0.035);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        this.camera.position.y = 1.6;

        // Raycaster
        this.raycaster = new THREE.Raycaster();
        this.center = new THREE.Vector2(0, 0);

        // Optimized Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap pixel ratio for performance
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.container.appendChild(this.renderer.domElement);

        // Optimized Post-Processing
        const renderScene = new RenderPass(this.scene, this.camera);

        // Reduced resolution for Bloom to improve performance
        const bloomResolution = new THREE.Vector2(this.width / 2, this.height / 2);
        const bloomPass = new UnrealBloomPass(bloomResolution, 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.2; // Higher threshold to avoid blooming everything
        bloomPass.strength = 0.3; // Much lower strength (was 1.5+)
        bloomPass.radius = 0.5;

        const outputPass = new OutputPass();

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(bloomPass);
        this.composer.addPass(outputPass);

        // Controls
        this.controls = new PointerLockControls(this.camera, document.body);

        // Weapon
        this.weapon = new Weapon(this.camera);
        this.camera.add(this.weapon);
        this.scene.add(this.camera); // Add camera to scene so weapon children renders

        // Game State
        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false;
        this.sensitivity = 1.0;
        this.gameDuration = 60; // Default
        this.timeLeft = 60;
        this.canJump = false;

        // Stats
        this.shotsFired = 0;
        this.shotsHit = 0;

        // Move state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isSprinting = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // Clock
        this.clock = new THREE.Clock();

        // Environment
        this.createEnvironment();

        // Event Listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        document.addEventListener('mousedown', this.onMouseDown.bind(this));

        // --- Menu Listeners ---
        // Main Menu
        document.getElementById('btn-static').addEventListener('click', () => this.startGame('static'));
        document.getElementById('btn-tracking').addEventListener('click', () => this.startGame('tracking'));
        document.getElementById('btn-parkour').addEventListener('click', () => this.startGame('parkour'));
        document.getElementById('btn-settings-main').addEventListener('click', () => this.openSettings('main'));
        document.getElementById('btn-restart').addEventListener('click', () => this.quitToMain());
        document.getElementById('btn-retry').addEventListener('click', () => this.retryGame()); // Retry Listener

        // Pause Menu
        document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
        document.getElementById('btn-settings-pause').addEventListener('click', () => this.openSettings('pause'));
        document.getElementById('btn-quit').addEventListener('click', () => this.quitToMain());

        // Settings Menu
        document.getElementById('btn-back').addEventListener('click', () => this.closeSettings());

        // Sensitivity
        this.sensSlider.addEventListener('input', (e) => {
            this.sensitivity = parseFloat(e.target.value);
            this.sensValue.textContent = this.sensitivity.toFixed(1);
            this.controls.pointerSpeed = this.sensitivity;
        });

        // Crosshair Selector
        document.querySelectorAll('.crosshair-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const style = e.target.dataset.style; // dot, cross, circle
                this.setCrosshair(style);
                // Visual update active class
                document.querySelectorAll('.crosshair-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Duration Selector
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.gameDuration = parseInt(e.target.dataset.time);
                document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Stop propagation on menus to prevent shooting/locking when clicking UI
        [this.menuEl, this.pauseEl, this.settingsEl, this.endScreenEl].forEach(el => {
            el.addEventListener('mousedown', (e) => e.stopPropagation());
            el.addEventListener('click', (e) => e.stopPropagation());
        });

        // Unlock handling (Pause trigger)
        this.controls.addEventListener('unlock', () => {
            if (this.isPlaying && !this.isPaused && !this.isGameOver) {
                this.pauseGame();
            }
        });

        // Default Crosshair
        this.setCrosshair('dot');

        // Sound Manager
        this.soundManager = new SoundManager();
    }

    startGame(mode) {
        this.gameMode = mode;
        this.isPlaying = true;
        this.isPaused = false;
        this.isGameOver = false; // Ensure game over is cleared

        this.menuEl.style.display = 'none';
        this.pauseEl.style.display = 'none';
        this.settingsEl.style.display = 'none';
        this.endScreenEl.style.display = 'none';
        this.endScreenEl.classList.remove('parkour-win');

        this.hudEl.style.display = 'flex';
        this.crosshairEl.style.display = 'block';

        // Parkour mode specific UI
        if (mode === 'parkour') {
            this.scoreEl.style.display = 'none';
            this.hitsEl.style.display = 'none';
            this.heightEl.style.display = 'block';
            this.timeEl.textContent = 'Time: 0s';
        } else {
            this.scoreEl.style.display = 'block';
            this.hitsEl.style.display = 'block';
            this.heightEl.style.display = 'none';
        }

        this.resetGame();
        this.clock.start(); // Restart the clock for new game
        this.controls.lock();

        // Initialize and play sound
        this.soundManager.init();
        this.soundManager.playGameStart();
    }

    retryGame() {
        this.startGame(this.gameMode);
    }

    resetGame() {
        this.score = 0;
        this.timeLeft = this.gameDuration;
        this.shotsFired = 0;
        this.shotsHit = 0;
        this.updateHUD();

        if (this.gameMode === 'parkour') {
            // Clear previous parkour level
            this.clearParkourLevel();
            // Create new parkour level
            this.createParkourLevel();
            // Position player on top of start platform (platform Y + platform half-height + player height)
            this.camera.position.set(0, this.startPlatformY + 0.25 + 1.6, 0);
            this.velocity.set(0, 0, 0);
            this.parkourStartTime = Date.now();
        } else {
            this.targets.forEach(t => t.despawn());
            this.spawnTarget();
            this.camera.position.set(0, 1.6, 0);
            this.velocity.set(0, 0, 0);
        }
    }

    endGame() {
        this.isPlaying = false;
        this.isGameOver = true;
        this.controls.unlock();
        this.clock.stop(); // Stop delta

        // Play game over sound
        this.soundManager.playGameOver();

        this.hudEl.style.display = 'none';
        this.crosshairEl.style.display = 'none';
        this.endScreenEl.style.display = 'flex';

        // Update Stats UI
        this.finalScoreEl.textContent = Math.floor(this.score);
        this.finalHitsEl.textContent = this.shotsHit;
        this.finalMissesEl.textContent = this.shotsFired - this.shotsHit;

        const acc = this.shotsFired > 0 ? (this.shotsHit / this.shotsFired * 100).toFixed(1) : 0;
        this.finalAccuracyEl.textContent = `${acc}%`;
    }

    updateHUD() {
        if (this.scoreEl) this.scoreEl.textContent = `Score: ${Math.floor(this.score)}`;
        if (this.timeEl) this.timeEl.textContent = `Time: ${Math.ceil(this.timeLeft)}s`;
        if (this.hitsEl) this.hitsEl.textContent = `Hits: ${this.shotsHit}`;
    }

    pauseGame() {
        this.isPaused = true;
        this.pauseEl.style.display = 'flex';
        // HTML overlay handles mouse interactions now
    }

    resumeGame() {
        this.isPaused = false;
        this.pauseEl.style.display = 'none';
        this.controls.lock();
    }

    quitToMain() {
        this.isPlaying = false;
        this.isPaused = false;
        this.isGameOver = false; // Reset game over state

        // Clear parkour level if coming from parkour mode
        this.clearParkourLevel();

        this.pauseEl.style.display = 'none';
        this.hudEl.style.display = 'none';
        this.crosshairEl.style.display = 'none';
        this.endScreenEl.style.display = 'none';
        this.endScreenEl.classList.remove('parkour-win');
        this.menuEl.style.display = 'flex'; // Show Main Menu

        // Reset camera for menu view
        this.startMenuAnimation();
    }

    openSettings(source) {
        this.previousMenu = source; // 'main' or 'pause'
        this.menuEl.style.display = 'none';
        this.pauseEl.style.display = 'none';
        this.settingsEl.style.display = 'flex';
    }

    closeSettings() {
        this.settingsEl.style.display = 'none';
        if (this.previousMenu === 'main') {
            this.menuEl.style.display = 'flex';
        } else {
            this.pauseEl.style.display = 'flex';
        }
    }

    setCrosshair(style) {
        // defined in style.css: .crosshair-dot, .crosshair-cross, .crosshair-circle
        this.crosshairEl.className = `crosshair-${style}`;
    }

    // Load GLB models for platforms
    async loadPlatformModels() {
        try {
            // Load platform model
            const platformGltf = await this.gltfLoader.loadAsync('/models/platform.glb');
            this.platformModel = platformGltf.scene;
            console.log('Platform model loaded successfully');
        } catch (e) {
            console.log('No platform.glb found, using default box geometry');
            this.platformModel = null;
        }

        try {
            // Load goal platform model
            const goalGltf = await this.gltfLoader.loadAsync('/models/goal.glb');
            this.goalModel = goalGltf.scene;
            console.log('Goal model loaded successfully');
        } catch (e) {
            console.log('No goal.glb found, using default box geometry');
            this.goalModel = null;
        }
    }

    // Create a platform instance (uses GLB if loaded, otherwise box)
    createPlatformMesh(width, depth, isGoal = false) {
        const model = isGoal ? this.goalModel : this.platformModel;

        if (model) {
            // Clone the loaded model
            const clone = model.clone();

            // Base scale factor - ADJUST THIS if your model is too big/small
            // 0.1 = 10% of original size, 0.01 = 1% of original size, etc.
            const baseScale = 0.1;

            // Scale to match desired size
            clone.scale.set(width * baseScale, baseScale, depth * baseScale);
            return clone;
        } else {
            // Fallback to box geometry
            const geo = new THREE.BoxGeometry(width, 0.5, depth);
            const mat = isGoal
                ? new THREE.MeshStandardMaterial({
                    color: 0x00ff88,
                    emissive: 0x00ff88,
                    emissiveIntensity: 0.5,
                    roughness: 0.2,
                    metalness: 0.8
                })
                : new THREE.MeshStandardMaterial({
                    color: 0x111122,
                    roughness: 0.3,
                    metalness: 0.7
                });
            const mesh = new THREE.Mesh(geo, mat);

            // Add edges
            const edgeColor = isGoal ? 0x00ff88 : 0x00ffff;
            const edges = new THREE.LineSegments(
                new THREE.EdgesGeometry(geo),
                new THREE.MeshBasicMaterial({ color: edgeColor })
            );
            mesh.add(edges);

            return mesh;
        }
    }

    createParkourLevel() {
        const platformCount = 20;
        const maxHeight = 25; // Reduced from 50 - more horizontal
        const heightStep = maxHeight / platformCount; // ~1.25 units per platform

        // Start platform (larger)
        const startPlatform = this.createPlatformMesh(6, 6, false);
        startPlatform.position.set(0, this.startPlatformY, 0);
        startPlatform.userData.isPlatform = true;
        startPlatform.userData.platformBounds = { width: 6, depth: 6 };
        this.scene.add(startPlatform);
        this.parkourPlatforms.push(startPlatform);

        // Generate ascending platforms in spiral pattern
        let angle = 0;
        for (let i = 1; i <= platformCount; i++) {
            // Larger platforms - minimum size 2.5
            const sizeFactor = Math.max(0.6, 1 - (i / platformCount) * 0.4);
            const width = 3 * sizeFactor + 1.5;
            const depth = 3 * sizeFactor + 1.5;

            const platform = this.createPlatformMesh(width, depth, false);

            // More spread out horizontally
            const radius = 5 + Math.random() * 4;
            angle += (Math.PI / 5) + (Math.random() * Math.PI / 6); // Smaller angle increments
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = this.startPlatformY + (i * heightStep);

            platform.position.set(x, y, z);
            platform.userData.isPlatform = true;
            platform.userData.platformBounds = { width, depth };

            this.scene.add(platform);
            this.parkourPlatforms.push(platform);
        }

        // Goal platform at the top
        this.goalPlatform = this.createPlatformMesh(5, 5, true);

        // Position goal above the last platform
        const lastPlatform = this.parkourPlatforms[this.parkourPlatforms.length - 1];
        const goalY = lastPlatform.position.y + heightStep;
        this.goalPlatform.position.set(0, goalY, 0);
        this.goalPlatform.userData.isGoal = true;
        this.goalPlatform.userData.platformBounds = { width: 5, depth: 5 };

        // Add pulsing glow effect marker (only if using box geometry fallback)
        if (!this.goalModel) {
            const glowGeo = new THREE.RingGeometry(2, 2.5, 32);
            const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide });
            const glowRing = new THREE.Mesh(glowGeo, glowMat);
            glowRing.rotation.x = -Math.PI / 2;
            glowRing.position.y = 0.3;
            this.goalPlatform.add(glowRing);
        }

        this.scene.add(this.goalPlatform);
    }

    clearParkourLevel() {
        // Remove all parkour platforms from scene
        this.parkourPlatforms.forEach(platform => {
            this.scene.remove(platform);
            // Only dispose geometry if it's a mesh (not a GLB group)
            if (platform.geometry) {
                platform.geometry.dispose();
            }
        });
        this.parkourPlatforms = [];

        // Remove goal platform
        if (this.goalPlatform) {
            this.scene.remove(this.goalPlatform);
            if (this.goalPlatform.geometry) {
                this.goalPlatform.geometry.dispose();
            }
            this.goalPlatform = null;
        }
    }

    winParkour() {
        this.isPlaying = false;
        this.isGameOver = true;
        this.controls.unlock();
        this.clock.stop();

        const completionTime = Math.floor((Date.now() - this.parkourStartTime) / 1000);

        this.hudEl.style.display = 'none';
        this.crosshairEl.style.display = 'none';
        this.endScreenEl.style.display = 'flex';
        this.endScreenEl.classList.add('parkour-win');

        // Update stats for parkour win
        this.finalScoreEl.textContent = `${completionTime}s`;
        this.finalAccuracyEl.textContent = 'COMPLETE';
        this.finalHitsEl.textContent = '-';
        this.finalMissesEl.textContent = '-';

        // Update labels temporarily
        document.querySelector('.stat-item:first-child').innerHTML = `TIME <span id="final-score">${completionTime}s</span>`;

        this.soundManager.playGameOver(); // Could add a win sound instead
    }

    startMenuAnimation() {
        // ensuring checks are done in animate()
    }

    createEnvironment() {
        // Neon Grid Floor
        const gridHelper = new THREE.GridHelper(100, 100, 0xff00ff, 0x00ffff);
        gridHelper.position.y = 0;
        this.scene.add(gridHelper);

        // Ceiling Grid (Mirroring Floor)
        const ceilingGrid = new THREE.GridHelper(100, 100, 0x550055, 0x005555);
        ceilingGrid.position.y = 20;
        this.scene.add(ceilingGrid);

        const floorGeometry = new THREE.PlaneGeometry(200, 200);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x050510,
            roughness: 0.1,
            metalness: 0.5
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.1;
        this.scene.add(floor);

        // Visible Walls (Vertical Grids)
        const wallColor = 0x00ffff;
        const wallSize = 40;
        const wallDivs = 10;
        const limit = 20;

        // Walls
        const wallN = new THREE.GridHelper(wallSize, wallDivs, wallColor, wallColor);
        wallN.rotation.x = Math.PI / 2;
        wallN.position.set(0, wallSize / 4, -limit);
        this.scene.add(wallN);

        const wallS = new THREE.GridHelper(wallSize, wallDivs, wallColor, wallColor);
        wallS.rotation.x = Math.PI / 2;
        wallS.position.set(0, wallSize / 4, limit);
        this.scene.add(wallS);

        const wallE = new THREE.GridHelper(wallSize, wallDivs, wallColor, wallColor);
        wallE.rotation.x = Math.PI / 2;
        wallE.rotation.z = Math.PI / 2;
        wallE.position.set(limit, wallSize / 4, 0);
        this.scene.add(wallE);

        const wallW = new THREE.GridHelper(wallSize, wallDivs, wallColor, wallColor);
        wallW.rotation.x = Math.PI / 2;
        wallW.rotation.z = Math.PI / 2;
        wallW.position.set(-limit, wallSize / 4, 0);
        this.scene.add(wallW);

        // Procedural Decoration: Neon Pillars
        const pillarGeo = new THREE.BoxGeometry(1, 15, 1);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });
        const pillarEdgeMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });

        for (let i = 0; i < 20; i++) {
            const pillar = new THREE.Group();
            const body = new THREE.Mesh(pillarGeo, pillarMat);

            // Wireframe edge effect
            const edges = new THREE.EdgesGeometry(pillarGeo);
            const line = new THREE.LineSegments(edges, pillarEdgeMat);

            pillar.add(body);
            pillar.add(line);

            // Random position outside arena
            const angle = Math.random() * Math.PI * 2;
            const radius = 25 + Math.random() * 20;
            pillar.position.set(Math.cos(angle) * radius, 7.5, Math.sin(angle) * radius);
            this.scene.add(pillar);
        }

        // Procedural Decoration: Floating Shapes
        this.floatingShapes = [];
        const shapeGeos = [
            new THREE.IcosahedronGeometry(1, 0),
            new THREE.TorusGeometry(1, 0.3, 16, 100),
            new THREE.OctahedronGeometry(1)
        ];
        const shapeMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00aaaa,
            emissiveIntensity: 0.5,
            wireframe: true
        });

        for (let i = 0; i < 15; i++) {
            const geo = shapeGeos[Math.floor(Math.random() * shapeGeos.length)];
            const mesh = new THREE.Mesh(geo, shapeMat);

            mesh.position.set(
                (Math.random() - 0.5) * 80,
                10 + Math.random() * 10,
                (Math.random() - 0.5) * 80
            );

            this.scene.add(mesh);
            this.floatingShapes.push({ mesh, speed: (Math.random() * 0.5) + 0.1 });
        }


        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambientLight);

        const light1 = new THREE.PointLight(0xff00ff, 2, 80);
        light1.position.set(20, 20, -20);
        this.scene.add(light1);

        const light2 = new THREE.PointLight(0x00ffff, 2, 80);
        light2.position.set(-20, 20, 20);
        this.scene.add(light2);
    }

    spawnTarget() {
        let target = this.targets.find(t => !t.isActive);
        if (!target) {
            target = new Target(this.scene);
            this.targets.push(target);
        }

        const x = (Math.random() - 0.5) * 15;
        const y = 1 + Math.random() * 4;
        const z = -5 - Math.random() * 15;

        target.spawn(new THREE.Vector3(x, y, z));
    }

    createBulletTracer() {
        // Get camera direction
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        // Start position (slightly in front of camera to simulate muzzle)
        const start = this.camera.position.clone();
        start.add(direction.clone().multiplyScalar(0.5));

        // End position (50 units in front)
        const end = start.clone().add(direction.multiplyScalar(50));

        // Create tracer line
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });
        const tracer = new THREE.Line(geometry, material);
        this.scene.add(tracer);

        // Fade out and remove
        let opacity = 0.8;
        const fadeInterval = setInterval(() => {
            opacity -= 0.2;
            material.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                this.scene.remove(tracer);
                geometry.dispose();
                material.dispose();
            }
        }, 20);
    }


    updateScoreUI() {
        this.scoreEl.textContent = `Score: ${Math.floor(this.score)}`;
    }

    setMode(mode) {
        this.gameMode = mode;
        this.modeEl.textContent = `Mode: ${mode === 'static' ? 'Static (Reflex)' : 'Tracking'}`;
        this.resetGame();
    }

    onMouseDown() {
        if (!this.controls.isLocked) return;
        if (this.isPaused || this.isGameOver) return;

        // Weapon Recoil
        this.weapon.shoot();
        this.shotsFired++;

        // Create bullet tracer effect
        this.createBulletTracer();

        // Play shoot sound
        this.soundManager.playShoot();

        if (this.gameMode === 'static') {
            this.raycaster.setFromCamera(this.center, this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children);

            for (let i = 0; i < intersects.length; i++) {
                if (intersects[i].object.userData.target && intersects[i].object.userData.target.isActive) {
                    intersects[i].object.userData.target.hit();
                    this.score += 100;
                    this.shotsHit++;
                    this.updateHUD();
                    this.spawnTarget();
                    this.soundManager.playHit(); // Play hit sound
                    break;
                }
            }
        }
    }

    onKeyDown(event) {
        // Allow ESC to trigger default unlock which we handle
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': this.moveForward = true; break;
            case 'ArrowLeft': case 'KeyA': this.moveLeft = true; break;
            case 'ArrowDown': case 'KeyS': this.moveBackward = true; break;
            case 'ArrowRight': case 'KeyD': this.moveRight = true; break;
            case 'ShiftLeft': this.isSprinting = true; break;
            case 'Space':
                if (this.canJump === true) {
                    this.velocity.y += 10; // Jump force
                    this.canJump = false;
                }
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': this.moveForward = false; break;
            case 'ArrowLeft': case 'KeyA': this.moveLeft = false; break;
            case 'ArrowDown': case 'KeyS': this.moveBackward = false; break;
            case 'ArrowRight': case 'KeyD': this.moveRight = false; break;
            case 'ShiftLeft': this.isSprinting = false; break;
        }
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
        this.composer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const delta = this.clock.getDelta();

        // While paused, we might still want to render (frozen) or continue menu background
        if (this.isPaused) {
            this.composer.render();
            return;
        }

        if (this.isGameOver) {
            this.composer.render();
            return;
        }

        if (!this.isPlaying) {
            const time = Date.now() * 0.0005;
            this.camera.position.x = Math.cos(time) * 10;
            this.camera.position.z = Math.sin(time) * 10;
            this.camera.lookAt(0, 0, 0);

            this.composer.render();
            return;
        }

        // Timer Logic
        this.timeLeft -= delta;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.updateHUD();
            this.endGame();
            return;
        }

        // Update HUD periodically (every frame is fine for now)
        this.updateHUD();

        // Decoration Animation
        if (this.floatingShapes) {
            const time = Date.now() * 0.001;
            this.floatingShapes.forEach(item => {
                item.mesh.rotation.x += item.speed * delta;
                item.mesh.rotation.y += item.speed * delta;
                item.mesh.position.y += Math.sin(time + item.mesh.position.x) * 0.02;
            });
        }

        // Weapon Animation
        this.weapon.update(delta);

        // Movement Logic
        if (this.controls.isLocked) {
            // Deceleration (Friction)
            this.velocity.x -= this.velocity.x * 25.0 * delta;
            this.velocity.z -= this.velocity.z * 25.0 * delta;

            // Gravity
            this.velocity.y -= 9.8 * 3.0 * delta; // 3.0 multiplier for snappier fall

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            const baseAcceleration = 320.0;
            const acceleration = this.isSprinting ? baseAcceleration * 1.6 : baseAcceleration;
            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * acceleration * delta;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * acceleration * delta;

            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);

            // Y Movement (Jump/Gravity)
            this.camera.position.y += this.velocity.y * delta;

            // Ground Check / Platform Collision
            if (this.gameMode === 'parkour') {
                // Check platform collisions for parkour mode
                const playerX = this.camera.position.x;
                const playerY = this.camera.position.y - 1.6; // Feet position
                const playerZ = this.camera.position.z;
                let onPlatform = false;

                // Check all platforms
                const allPlatforms = [...this.parkourPlatforms];
                if (this.goalPlatform) allPlatforms.push(this.goalPlatform);

                for (const platform of allPlatforms) {
                    const px = platform.position.x;
                    const py = platform.position.y;
                    const pz = platform.position.z;
                    const bounds = platform.userData.platformBounds;
                    const halfW = bounds.width / 2;
                    const halfD = bounds.depth / 2;
                    const platformTop = py + 0.25; // Platform center + half height (0.5/2)

                    // Check if player is within platform XZ bounds
                    const withinX = playerX >= px - halfW && playerX <= px + halfW;
                    const withinZ = playerZ >= pz - halfD && playerZ <= pz + halfD;

                    // Only snap when player feet are AT or BELOW platform top (landing on it)
                    // This prevents the "teleport" effect when approaching from above
                    const landedOnPlatform = playerY <= platformTop && playerY >= platformTop - 1.0;
                    const fallingOnto = this.velocity.y <= 0;

                    if (withinX && withinZ && landedOnPlatform && fallingOnto) {
                        this.velocity.y = 0;
                        this.camera.position.y = platformTop + 1.6; // Platform top + player height
                        this.canJump = true;
                        onPlatform = true;

                        // Check if landed on goal
                        if (platform.userData.isGoal) {
                            this.winParkour();
                            return;
                        }
                        break;
                    }
                }

                // Fell too far - respawn
                if (this.camera.position.y < -10) {
                    this.camera.position.set(0, this.startPlatformY + 0.25 + 1.6, 0);
                    this.velocity.set(0, 0, 0);
                }

                // Update height display
                if (this.heightEl) {
                    const height = Math.max(0, Math.floor(this.camera.position.y - this.startPlatformY));
                    this.heightEl.textContent = `Height: ${height}m`;
                }
            } else {
                // Normal ground check for other modes
                if (this.camera.position.y < 1.6) {
                    this.velocity.y = 0;
                    this.camera.position.y = 1.6;
                    this.canJump = true;
                }
            }

            // Arena Boundaries Check (skip for parkour - no boundaries)
            if (this.gameMode !== 'parkour') {
                const limit = 19;
                if (this.camera.position.x > limit) this.camera.position.x = limit;
                if (this.camera.position.x < -limit) this.camera.position.x = -limit;
                if (this.camera.position.z > limit) this.camera.position.z = limit;
                if (this.camera.position.z < -limit) this.camera.position.z = -limit;
            }
        }

        // Parkour mode: update elapsed time
        if (this.gameMode === 'parkour') {
            const elapsed = Math.floor((Date.now() - this.parkourStartTime) / 1000);
            if (this.timeEl) this.timeEl.textContent = `Time: ${elapsed}s`;
        }

        // Game Mode Logic
        if (this.controls.isLocked) {
            this.targets.forEach(t => t.update(delta, this.gameMode));

            if (this.gameMode === 'tracking') {
                this.raycaster.setFromCamera(this.center, this.camera);
                const intersects = this.raycaster.intersectObjects(this.scene.children);
                let hittingTarget = false;
                for (let i = 0; i < intersects.length; i++) {
                    if (intersects[i].object.userData.target && intersects[i].object.userData.target.isActive) {
                        hittingTarget = true;
                        break;
                    }
                }

                if (hittingTarget) {
                    this.score += 100 * delta;
                }
            }
        }

        this.composer.render();
    }

    async start() {
        // Preload platform models
        await this.loadPlatformModels();

        this.animate();
        console.log("Game started");
    }
}
