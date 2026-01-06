// SoundManager.js - Procedural sound effects using Web Audio API

export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = true;
        this.volume = 0.5;

        // Initialize on first user interaction
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.volume;
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    toggle(enabled) {
        this.enabled = enabled;
    }

    // Gunshot sound - punchy and satisfying
    playShoot() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Noise burst for the "crack"
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        // Highpass filter for crisp sound
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 1000;

        // Lowpass for body
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(5000, now);
        lowpass.frequency.exponentialRampToValueAtTime(500, now + 0.1);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        noiseSource.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(noiseGain);
        noiseGain.connect(this.masterGain);

        // Low frequency "thump"
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);

        noiseSource.start(now);
        noiseSource.stop(now + 0.1);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // Target hit sound - satisfying "ping" with confirmation feel
    playHit() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // High pitched "ping"
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.05);

        const osc1Gain = ctx.createGain();
        osc1Gain.gain.setValueAtTime(0.3, now);
        osc1Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc1.connect(osc1Gain);
        osc1Gain.connect(this.masterGain);

        // Secondary harmonic
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1320, now);
        osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.03);

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.15, now);
        osc2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc2.connect(osc2Gain);
        osc2Gain.connect(this.masterGain);

        osc1.start(now);
        osc1.stop(now + 0.15);
        osc2.start(now);
        osc2.stop(now + 0.1);
    }

    // Miss sound - subtle "whoosh"
    playMiss() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.3;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(2000, now);
        bandpass.frequency.exponentialRampToValueAtTime(500, now + 0.15);
        bandpass.Q.value = 2;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noiseSource.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(this.masterGain);

        noiseSource.start(now);
        noiseSource.stop(now + 0.15);
    }

    // Game start sound - energizing
    playGameStart() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = freq;

            const gain = ctx.createGain();
            const startTime = now + i * 0.08;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(startTime);
            osc.stop(startTime + 0.25);
        });
    }

    // Game over sound - descending tones
    playGameOver() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const notes = [392, 349.23, 293.66, 261.63]; // G4, F4, D4, C4

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2000;

            const gain = ctx.createGain();
            const startTime = now + i * 0.15;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(startTime);
            osc.stop(startTime + 0.35);
        });
    }

    // UI click sound
    playClick() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Countdown tick sound
    playTick() {
        if (!this.enabled || !this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 800;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.03);
    }
}
