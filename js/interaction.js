// js/interaction.js - Game Logic, Audio & UI

class InteractionManager {
    constructor() {
        this.clickCount = 0;
        this.isGameActive = false;
        
        this.bgMusic = document.getElementById('bgMusic');
        this.startBtn = document.getElementById('start-btn');
        this.lobbyCard = document.getElementById('lobby-card');
        this.gameHeart = document.getElementById('game-heart');
        this.messageOverlay = document.getElementById('message-overlay');
        
        // Web Audio API for Ethereal Water Drop
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startExperience());
        this.gameHeart.addEventListener('click', () => this.handleHeartClick());
        
        // Global click to reset or close
        window.addEventListener('click', (e) => {
            if (this.clickCount >= 3 && !this.messageOverlay.contains(e.target)) {
                // Potential reset logic
            }
        });
    }

    startExperience() {
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        this.lobbyCard.style.opacity = '0';
        setTimeout(() => this.lobbyCard.style.display = 'none', 1000);
        
        // Play music
        this.bgMusic.play().catch(e => console.log("Music blocked", e));
        
        // Start Three.js animation
        if (window.particleSystem) {
            window.particleSystem.startTime = performance.now();
            window.particleSystem.openCard();
        }

        // Show game heart after card open
        setTimeout(() => {
            this.isGameActive = true;
            this.spawnHeart();
        }, 4000);
    }

    spawnHeart() {
        if (!this.isGameActive) return;
        
        this.gameHeart.classList.remove('hidden');
        this.gameHeart.classList.add('visible');
        
        const x = 100 + Math.random() * (window.innerWidth - 200);
        const y = 100 + Math.random() * (window.innerHeight - 200);
        
        this.gameHeart.style.left = `${x}px`;
        this.gameHeart.style.top = `${y}px`;
    }

    handleHeartClick() {
        this.playWaterDrop();
        this.clickCount++;

        if (this.clickCount < 3) {
            this.spawnHeart();
        } else {
            this.triggerEgg();
        }
    }

    playWaterDrop() {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const verb = this.audioCtx.createConvolver();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.audioCtx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.5);
    }

    triggerEgg() {
        this.isGameActive = false;
        this.gameHeart.classList.add('hidden');
        
        // Background dimming
        const dim = document.createElement('div');
        dim.style.position = 'fixed';
        dim.style.top = '0';
        dim.style.left = '0';
        dim.style.width = '100%';
        dim.style.height = '100%';
        dim.style.backgroundColor = 'black';
        dim.style.opacity = '0';
        dim.style.transition = 'opacity 3s ease';
        dim.style.zIndex = '5';
        dim.style.pointerEvents = 'none';
        document.body.appendChild(dim);
        
        setTimeout(() => dim.style.opacity = '0.8', 100);

        // Morph particles
        if (window.particleSystem) {
            window.particleSystem.morphToRose();
            window.engine.setBloom(2.5, 0.6, 0.1); // Stronger bloom for rose
        }

        // Show message
        setTimeout(() => {
            this.messageOverlay.classList.remove('hidden');
            this.messageOverlay.classList.add('visible');
        }, 3500);
    }
}

window.interactionManager = new InteractionManager();