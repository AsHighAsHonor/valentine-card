// js/particles.js - Heart Shader & Particle Point Clouds

class ParticleSystem {
    constructor() {
        this.scene = window.engine.scene;
        this.particleCount = window.innerWidth < 768 ? 4000 : 7000;
        this.particles = null;
        
        this.states = {
            CARD: 'card',
            OPENING: 'opening',
            FLOATING: 'floating',
            ROSE: 'rose'
        };
        this.currentState = this.states.CARD;
        
        this.mouse = new THREE.Vector2(-100, -100);
        this.targetMouse = new THREE.Vector2(-100, -100);
        
        this.init();
    }

    init() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const sizes = new Float32Array(this.particleCount);
        const phases = new Float32Array(this.particleCount);
        const targets = new Float32Array(this.particleCount * 3);

        const colorGold = new THREE.Color(0xd4af37);
        const colorOrange = new THREE.Color(0xff911e);

        for (let i = 0; i < this.particleCount; i++) {
            // Card layout (Initially a thick slab)
            const x = (Math.random() - 0.5) * 60;
            const y = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 5;

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            targets[i * 3] = x;
            targets[i * 3 + 1] = y;
            targets[i * 3 + 2] = z;

            const mixed = colorGold.clone().lerp(colorOrange, Math.random() * 0.3);
            colors[i * 3] = mixed.r;
            colors[i * 3 + 1] = mixed.g;
            colors[i * 3 + 2] = mixed.b;

            sizes[i] = Math.random() * 2 + 1;
            phases[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('target', new THREE.BufferAttribute(targets, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                uMouse: { value: new THREE.Vector3(0, 0, 0) },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                uniform float time;
                uniform vec3 uMouse;
                attribute float size;
                attribute float phase;
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    
                    // Floating & Flickering
                    float flicker = sin(time * 2.0 + phase) * 0.5 + 0.5;
                    vAlpha = 0.4 + flicker * 0.6;
                    
                    // Fluid Attraction
                    float dist = distance(pos, uMouse);
                    if (dist < 30.0) {
                        float force = (30.0 - dist) / 30.0;
                        pos += normalize(uMouse - pos) * force * 5.0 * sin(time + phase);
                    }
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    // Render Heart Shape
                    vec2 r = gl_PointCoord - vec2(0.5);
                    r.y += 0.1;
                    float x = r.x;
                    float y = r.y;
                    
                    // Heart equation: (x^2 + y^2 - 1)^3 - x^2 * y^3 = 0
                    // Simplified for SDF
                    float a = x*x + y*y - 0.2;
                    float d = a*a*a - x*x*y*y*y;
                    
                    if (d > 0.0) discard;
                    
                    // Golden Shine
                    float shine = pow(1.0 - length(r) * 2.0, 3.0);
                    gl_FragColor = vec4(vColor + vec3(shine * 0.5), vAlpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);

        // Watermark particles
        this.createWatermark();

        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('touchstart', (e) => this.onTouchMove(e));
    }

    createWatermark() {
        // Deep background watermark "BANKWEST"
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1000;
        canvas.height = 200;
        ctx.font = '900 120px Cinzel';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('BANKWEST', 500, 130);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const watermarkPoints = [];
        for (let y = 0; y < canvas.height; y += 8) {
            for (let x = 0; x < canvas.width; x += 8) {
                if (imageData.data[(y * canvas.width + x) * 4] > 128) {
                    watermarkPoints.push({
                        x: (x - 500) * 0.3,
                        y: (100 - y) * 0.3,
                        z: -150
                    });
                }
            }
        }

        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(watermarkPoints.length * 3);
        watermarkPoints.forEach((p, i) => {
            pos[i * 3] = p.x;
            pos[i * 3 + 1] = p.y;
            pos[i * 3 + 2] = p.z;
        });
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xff911e,
            size: 1.5,
            transparent: true,
            opacity: 0.1,
            sizeAttenuation: true
        });
        const watermark = new THREE.Points(geo, mat);
        this.scene.add(watermark);
    }

    onMouseMove(e) {
        this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    onTouchMove(e) {
        if (e.touches.length > 0) {
            this.targetMouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }

    update() {
        const time = performance.now() * 0.001;
        this.particles.material.uniforms.time.value = time;

        // Mouse interpolation
        this.mouse.lerp(this.targetMouse, 0.05);
        
        // Raycast mouse to 3D space
        const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
        vector.unproject(window.engine.camera);
        const dir = vector.sub(window.engine.camera.position).normalize();
        const distance = -window.engine.camera.position.z / dir.z;
        const pos = window.engine.camera.position.clone().add(dir.multiplyScalar(distance));
        
        this.particles.material.uniforms.uMouse.value.copy(pos);

        if (this.currentState === this.states.OPENING) {
            this.applyBendEffect(time);
        }
    }

    openCard() {
        this.currentState = this.states.OPENING;
        
        // Smooth transition to floating state after flip
        setTimeout(() => {
            this.currentState = this.states.FLOATING;
            this.disperseParticles();
        }, 2500);
    }

    applyBendEffect(time) {
        const pos = this.particles.geometry.attributes.position.array;
        const target = this.particles.geometry.attributes.target.array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const tx = target[i * 3];
            // If on left side, rotate and bend
            if (tx < 0) {
                const angle = Math.min(Math.PI, (performance.now() - this.startTime) * 0.0015);
                const radius = 30;
                
                // Bend logic
                const x = tx * Math.cos(angle);
                const z = tx * Math.sin(angle);
                
                pos[i * 3] += (x - pos[i * 3]) * 0.1;
                pos[i * 3 + 2] += (z - pos[i * 3 + 2]) * 0.1;
            }
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    disperseParticles() {
        const pos = this.particles.geometry.attributes.position.array;
        for (let i = 0; i < this.particleCount; i++) {
            gsap.to(this.particles.geometry.attributes.position.array, {
                [i * 3]: (Math.random() - 0.5) * 200,
                [i * 3 + 1]: (Math.random() - 0.5) * 200,
                [i * 3 + 2]: (Math.random() - 0.5) * 100,
                duration: 2.5,
                ease: "power2.out",
                onUpdate: () => {
                    this.particles.geometry.attributes.position.needsUpdate = true;
                }
            });
        }
    }

    morphToRose() {
        this.currentState = this.states.ROSE;
        const count = this.particleCount;
        const rosePoints = [];

        // Golden Royal Rose Model
        for (let i = 0; i < count; i++) {
            const t = Math.random() * Math.PI * 2;
            const p = Math.random() * Math.PI;
            
            let x, y, z;

            if (i < count * 0.7) {
                // Petals
                const r = 50 * Math.pow(Math.sin(p), 0.5) * (1.0 + 0.2 * Math.sin(8.0 * t));
                x = r * Math.sin(p) * Math.cos(t);
                y = r * Math.sin(p) * Math.sin(t) + Math.cos(p) * 30;
                z = r * Math.cos(p);
            } else if (i < count * 0.9) {
                // Stem
                x = (Math.random() - 0.5) * 2;
                y = -p * 25 - 20;
                z = (Math.random() - 0.5) * 2;
            } else {
                // Leaves
                const side = Math.random() > 0.5 ? 1 : -1;
                const leafT = Math.random() * Math.PI;
                x = side * (leafT * 10);
                y = -40 + Math.sin(leafT) * 10;
                z = Math.cos(leafT) * 5;
            }

            rosePoints.push({ x, y, z });
        }

        const pos = this.particles.geometry.attributes.position.array;
        const cols = this.particles.geometry.attributes.color.array;
        
        const roseColor = new THREE.Color(0x8b0000); // Deep Velvet Red
        const goldHighlight = new THREE.Color(0xd4af37);

        for (let i = 0; i < count; i++) {
            const target = rosePoints[i];
            
            gsap.to(this.particles.geometry.attributes.position.array, {
                [i * 3]: target.x,
                [i * 3 + 1]: target.y,
                [i * 3 + 2]: target.z,
                duration: 3,
                ease: "power3.inOut",
                delay: Math.random() * 0.5,
                onUpdate: () => {
                    this.particles.geometry.attributes.position.needsUpdate = true;
                }
            });

            // Color transition
            const finalColor = i < count * 0.7 ? roseColor : goldHighlight;
            gsap.to(this.particles.geometry.attributes.color.array, {
                [i * 3]: finalColor.r,
                [i * 3 + 1]: finalColor.g,
                [i * 3 + 2]: finalColor.b,
                duration: 2,
                onUpdate: () => {
                    this.particles.geometry.attributes.color.needsUpdate = true;
                }
            });
        }
        
        this.particles.geometry.attributes.color.needsUpdate = true;
    }
}

window.particleSystem = new ParticleSystem();