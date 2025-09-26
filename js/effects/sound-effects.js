class SoundEffectsManager {
    constructor() {
        this.sounds = new Map();
        this.audioContext = null;
        this.masterVolume = 1;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.initialized = false;
        this.soundQueue = [];
    }

    async initialize() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);

            await this.loadSounds();
            this.initialized = true;
            console.log('🔊 Sound system initialized');
        } catch (error) {
            console.warn('⚠️ Sound initialization failed, using silent mode:', error);
            this.initialized = true;
        }
    }

    async loadSounds() {
        const soundDefinitions = {
            'match_normal': {
                type: 'tone',
                frequency: 440,
                duration: 0.1
            },
            'match_special': {
                type: 'tone',
                frequency: 660,
                duration: 0.15
            },
            'combo': {
                type: 'chord',
                frequencies: [440, 554, 659],
                duration: 0.2
            },
            'rocket': {
                type: 'sweep',
                startFreq: 200,
                endFreq: 800,
                duration: 0.3
            },
            'bomb': {
                type: 'explosion',
                frequency: 80,
                duration: 0.4
            },
            'rainbow': {
                type: 'arpeggio',
                frequencies: [261, 294, 329, 349, 392, 440, 493],
                duration: 0.5
            },
            'coin': {
                type: 'tone',
                frequency: 800,
                duration: 0.1
            },
            'level_complete': {
                type: 'victory',
                frequencies: [523, 659, 784, 1047],
                duration: 1.0
            },
            'game_over': {
                type: 'descend',
                startFreq: 400,
                endFreq: 200,
                duration: 1.0
            },
            'button_click': {
                type: 'tone',
                frequency: 1000,
                duration: 0.05
            },
            'error': {
                type: 'buzz',
                frequency: 150,
                duration: 0.2
            },
            'powerup': {
                type: 'ascend',
                startFreq: 400,
                endFreq: 1200,
                duration: 0.3
            },
            'swap': {
                type: 'tone',
                frequency: 300,
                duration: 0.08
            }
        };

        for (const [name, definition] of Object.entries(soundDefinitions)) {
            this.sounds.set(name, definition);
        }
    }

    playSound(soundName, volume = 1, delay = 0) {
        if (!this.soundEnabled || !this.initialized || !this.audioContext) {
            return;
        }

        const soundDef = this.sounds.get(soundName);
        if (!soundDef) {
            console.warn(`Sound "${soundName}" not found`);
            return;
        }

        const actualVolume = this.masterVolume * volume * 0.3;

        if (delay > 0) {
            setTimeout(() => {
                this.generateSound(soundDef, actualVolume);
            }, delay);
        } else {
            this.generateSound(soundDef, actualVolume);
        }
    }

    generateSound(soundDef, volume) {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.masterGainNode);

        switch (soundDef.type) {
            case 'tone':
                this.createTone(soundDef, gainNode, now, volume);
                break;
            case 'chord':
                this.createChord(soundDef, gainNode, now, volume);
                break;
            case 'sweep':
                this.createSweep(soundDef, gainNode, now, volume);
                break;
            case 'explosion':
                this.createExplosion(soundDef, gainNode, now, volume);
                break;
            case 'arpeggio':
                this.createArpeggio(soundDef, gainNode, now, volume);
                break;
            case 'victory':
                this.createVictory(soundDef, gainNode, now, volume);
                break;
            case 'descend':
                this.createDescend(soundDef, gainNode, now, volume);
                break;
            case 'buzz':
                this.createBuzz(soundDef, gainNode, now, volume);
                break;
            case 'ascend':
                this.createAscend(soundDef, gainNode, now, volume);
                break;
        }
    }

    createTone(soundDef, gainNode, startTime, volume) {
        const oscillator = this.audioContext.createOscillator();
        oscillator.connect(gainNode);
        oscillator.frequency.setValueAtTime(soundDef.frequency, startTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + soundDef.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + soundDef.duration);
    }

    createChord(soundDef, gainNode, startTime, volume) {
        soundDef.frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const chordGain = this.audioContext.createGain();

            oscillator.connect(chordGain);
            chordGain.connect(gainNode);

            oscillator.frequency.setValueAtTime(freq, startTime);
            oscillator.type = 'sine';

            const noteVolume = volume / soundDef.frequencies.length;
            chordGain.gain.setValueAtTime(0, startTime);
            chordGain.gain.linearRampToValueAtTime(noteVolume, startTime + 0.01);
            chordGain.gain.exponentialRampToValueAtTime(0.001, startTime + soundDef.duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + soundDef.duration);
        });
    }

    createSweep(soundDef, gainNode, startTime, volume) {
        const oscillator = this.audioContext.createOscillator();
        oscillator.connect(gainNode);
        oscillator.type = 'sawtooth';

        oscillator.frequency.setValueAtTime(soundDef.startFreq, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(soundDef.endFreq, startTime + soundDef.duration);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + soundDef.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + soundDef.duration);
    }

    createExplosion(soundDef, gainNode, startTime, volume) {
        const noiseBuffer = this.createNoiseBuffer(0.1);
        const source = this.audioContext.createBufferSource();
        const filter = this.audioContext.createBiquadFilter();

        source.buffer = noiseBuffer;
        source.connect(filter);
        filter.connect(gainNode);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, startTime);
        filter.frequency.exponentialRampToValueAtTime(50, startTime + soundDef.duration);

        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + soundDef.duration);

        source.start(startTime);
        source.stop(startTime + soundDef.duration);
    }

    createArpeggio(soundDef, gainNode, startTime, volume) {
        const noteGap = soundDef.duration / soundDef.frequencies.length;

        soundDef.frequencies.forEach((freq, index) => {
            const noteStart = startTime + (index * noteGap);
            const oscillator = this.audioContext.createOscillator();
            const noteGain = this.audioContext.createGain();

            oscillator.connect(noteGain);
            noteGain.connect(gainNode);

            oscillator.frequency.setValueAtTime(freq, noteStart);
            oscillator.type = 'triangle';

            noteGain.gain.setValueAtTime(0, noteStart);
            noteGain.gain.linearRampToValueAtTime(volume, noteStart + 0.01);
            noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteGap);

            oscillator.start(noteStart);
            oscillator.stop(noteStart + noteGap);
        });
    }

    createVictory(soundDef, gainNode, startTime, volume) {
        soundDef.frequencies.forEach((freq, index) => {
            const noteStart = startTime + (index * 0.15);
            const oscillator = this.audioContext.createOscillator();
            const noteGain = this.audioContext.createGain();

            oscillator.connect(noteGain);
            noteGain.connect(gainNode);

            oscillator.frequency.setValueAtTime(freq, noteStart);
            oscillator.type = 'triangle';

            noteGain.gain.setValueAtTime(0, noteStart);
            noteGain.gain.linearRampToValueAtTime(volume, noteStart + 0.05);
            noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

            oscillator.start(noteStart);
            oscillator.stop(noteStart + 0.4);
        });
    }

    createDescend(soundDef, gainNode, startTime, volume) {
        const oscillator = this.audioContext.createOscillator();
        oscillator.connect(gainNode);
        oscillator.type = 'sine';

        oscillator.frequency.setValueAtTime(soundDef.startFreq, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(soundDef.endFreq, startTime + soundDef.duration);

        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.5, startTime + soundDef.duration * 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + soundDef.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + soundDef.duration);
    }

    createBuzz(soundDef, gainNode, startTime, volume) {
        const oscillator = this.audioContext.createOscillator();
        oscillator.connect(gainNode);
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(soundDef.frequency, startTime);

        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + soundDef.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + soundDef.duration);
    }

    createAscend(soundDef, gainNode, startTime, volume) {
        const oscillator = this.audioContext.createOscillator();
        oscillator.connect(gainNode);
        oscillator.type = 'triangle';

        oscillator.frequency.setValueAtTime(soundDef.startFreq, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(soundDef.endFreq, startTime + soundDef.duration);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + soundDef.duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + soundDef.duration);
    }

    createNoiseBuffer(duration) {
        const sampleRate = this.audioContext.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        return buffer;
    }

    playMatchSound(matchType = 'normal', elementCount = 3) {
        if (elementCount >= 5) {
            this.playSound('match_special');
        } else {
            this.playSound('match_normal');
        }
    }

    playComboSound(comboCount) {
        if (comboCount >= 5) {
            this.playSound('rainbow', 0.8);
        } else {
            this.playSound('combo', 0.6);
        }
    }

    playSpecialElementSound(elementType) {
        switch (elementType) {
            case 'rocket':
                this.playSound('rocket');
                break;
            case 'bomb':
                this.playSound('bomb');
                break;
            case 'rainbow':
                this.playSound('rainbow');
                break;
            default:
                this.playSound('powerup');
        }
    }

    playCoinSound(amount) {
        if (amount >= 1000) {
            this.playSound('coin', 1.0);
            this.playSound('coin', 0.8, 100);
            this.playSound('coin', 0.6, 200);
        } else if (amount >= 100) {
            this.playSound('coin', 1.0);
            this.playSound('coin', 0.7, 80);
        } else {
            this.playSound('coin', 0.8);
        }
    }

    playUISound(action) {
        switch (action) {
            case 'click':
                this.playSound('button_click');
                break;
            case 'error':
                this.playSound('error');
                break;
            case 'swap':
                this.playSound('swap');
                break;
            default:
                this.playSound('button_click', 0.5);
        }
    }

    playGameStateSound(state) {
        switch (state) {
            case 'level_complete':
                this.playSound('level_complete');
                break;
            case 'game_over':
                this.playSound('game_over');
                break;
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGainNode) {
            this.masterGainNode.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
    }

    mute() {
        this.setSoundEnabled(false);
        this.setMusicEnabled(false);
    }

    unmute() {
        this.setSoundEnabled(true);
        this.setMusicEnabled(true);
    }

    cleanup() {
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
    }
}

window.SoundEffectsManager = SoundEffectsManager;