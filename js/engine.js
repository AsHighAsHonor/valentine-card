// js/engine.js - Three.js Scene Setup & Post-processing

class Engine {
    constructor() {
        this.container = document.getElementById('container');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.composer = null;
        this.bloomPass = null;
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 120;

        // Post-processing: Unreal Bloom
        const renderScene = new THREE.RenderPass(this.scene, this.camera);
        
        this.bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // strength
            0.4, // radius
            0.85 // threshold
        );

        this.composer = new THREE.EffectComposer(this.renderer);
        this.composer.addPass(renderScene);
        this.composer.addPass(this.bloomPass);

        window.addEventListener('resize', () => this.onWindowResize());
        
        this.render();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        requestAnimationFrame(() => this.render());
        
        if (window.particleSystem) {
            window.particleSystem.update();
        }
        
        this.composer.render();
    }

    setBloom(strength = 1.5, radius = 0.4, threshold = 0.85) {
        gsap.to(this.bloomPass, {
            strength: strength,
            radius: radius,
            threshold: threshold,
            duration: 2
        });
    }
}

window.engine = new Engine();