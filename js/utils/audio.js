/**
 * 音频管理工具类
 * 负责背景音乐和音效的播放控制
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;

        this.musicVolume = 0.6;
        this.sfxVolume = 0.8;
        this.musicEnabled = true;
        this.sfxEnabled = true;

        this.currentMusic = null;
        this.musicLoop = null;

        this.sounds = new Map();
        this.initialized = false;

        console.log('🔊 AudioManager initialized');
    }

    // 初始化音频系统
    async initialize() {
        if (this.initialized) return true;

        try {
            // 创建音频上下文
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // 创建增益节点
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();

            // 连接音频图
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);

            // 设置初始音量
            this.musicGain.gain.value = this.musicVolume;
            this.sfxGain.gain.value = this.sfxVolume;

            // 加载默认音效
            await this.loadDefaultSounds();

            this.initialized = true;
            console.log('✅ Audio system initialized');

            return true;
        } catch (error) {
            console.warn('⚠️ Audio initialization failed, running in silent mode:', error);
            this.initialized = false;
            return false;
        }
    }

    // 加载默认音效
    async loadDefaultSounds() {
        const soundDefinitions = {
            'click': { frequency: 800, duration: 0.1, type: 'sine' },
            'match': { frequency: 440, duration: 0.2, type: 'sine' },
            'combo': { frequency: 660, duration: 0.3, type: 'triangle' },
            'coin': { frequency: 800, duration: 0.15, type: 'square' },
            'error': { frequency: 200, duration: 0.3, type: 'sawtooth' },
            'success': { frequency: 1000, duration: 0.5, type: 'sine' },
            'powerup': { frequency: 1200, duration: 0.4, type: 'triangle' },
            'explosion': { frequency: 150, duration: 0.6, type: 'sawtooth' }
        };

        for (const [name, config] of Object.entries(soundDefinitions)) {
            this.sounds.set(name, config);
        }
    }

    // 生成音调
    generateTone(frequency, duration, type = 'sine', volume = 1) {
        if (!this.initialized || !this.sfxEnabled) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.sfxGain);

            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;

            // 设置音量包络
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);

        } catch (error) {
            console.warn('⚠️ Failed to generate tone:', error);
        }
    }

    // 播放音效
    playSound(soundName, volume = 1) {
        if (!this.initialized || !this.sfxEnabled) return;

        const soundConfig = this.sounds.get(soundName);
        if (!soundConfig) {
            console.warn(`Sound "${soundName}" not found`);
            return;
        }

        this.generateTone(
            soundConfig.frequency,
            soundConfig.duration,
            soundConfig.type,
            volume
        );
    }

    // 播放点击音效
    playClickSound() {
        this.playSound('click', 0.5);
    }

    // 播放消除音效
    playMatchSound(intensity = 1) {
        if (intensity > 3) {
            this.playSound('combo', Math.min(intensity * 0.2, 1));
        } else {
            this.playSound('match', 0.7);
        }
    }

    // 播放金币音效
    playCoinSound() {
        this.playSound('coin', 0.6);
    }

    // 播放错误音效
    playErrorSound() {
        this.playSound('error', 0.4);
    }

    // 播放成功音效
    playSuccessSound() {
        this.playSound('success', 0.8);
    }

    // 播放道具音效
    playPowerupSound() {
        this.playSound('powerup', 0.7);
    }

    // 播放爆炸音效
    playExplosionSound() {
        this.playSound('explosion', 0.5);
    }

    // 开始播放背景音乐（简单的循环音调）
    startBackgroundMusic() {
        if (!this.initialized || !this.musicEnabled || this.currentMusic) return;

        try {
            const playMelody = () => {
                const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
                let noteIndex = 0;

                const playNextNote = () => {
                    if (!this.musicEnabled || !this.currentMusic) return;

                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(this.musicGain);

                    oscillator.frequency.setValueAtTime(notes[noteIndex], this.audioContext.currentTime);
                    oscillator.type = 'triangle';

                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);

                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.8);

                    noteIndex = (noteIndex + 1) % notes.length;

                    this.musicLoop = setTimeout(playNextNote, 1000);
                };

                playNextNote();
            };

            this.currentMusic = true;
            playMelody();
            console.log('🎵 Background music started');

        } catch (error) {
            console.warn('⚠️ Failed to start background music:', error);
        }
    }

    // 停止背景音乐
    stopBackgroundMusic() {
        if (this.musicLoop) {
            clearTimeout(this.musicLoop);
            this.musicLoop = null;
        }
        this.currentMusic = null;
        console.log('🎵 Background music stopped');
    }

    // 设置主音量
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    // 设置音乐音量
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicVolume;
        }
    }

    // 设置音效音量
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxVolume;
        }
    }

    // 启用/禁用音乐
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopBackgroundMusic();
        } else if (this.initialized) {
            this.startBackgroundMusic();
        }
    }

    // 启用/禁用音效
    setSfxEnabled(enabled) {
        this.sfxEnabled = enabled;
    }

    // 全部静音
    muteAll() {
        this.setMusicEnabled(false);
        this.setSfxEnabled(false);
    }

    // 取消静音
    unmuteAll() {
        this.setMusicEnabled(true);
        this.setSfxEnabled(true);
    }

    // 获取音频状态
    getAudioState() {
        return {
            initialized: this.initialized,
            musicEnabled: this.musicEnabled,
            sfxEnabled: this.sfxEnabled,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isPlayingMusic: !!this.currentMusic
        };
    }

    // 恢复音频上下文（处理浏览器自动播放策略）
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().then(() => {
                console.log('🔊 Audio context resumed');
            });
        }
    }

    // 清理资源
    destroy() {
        this.stopBackgroundMusic();

        if (this.audioContext) {
            this.audioContext.close();
        }

        this.sounds.clear();
        this.initialized = false;
        console.log('🔊 AudioManager destroyed');
    }
}

// 创建全局实例
window.audioManager = new AudioManager();

// 用户首次交互时初始化音频
document.addEventListener('click', () => {
    if (!window.audioManager.initialized) {
        window.audioManager.initialize();
    } else {
        window.audioManager.resume();
    }
}, { once: true });

console.log('🔊 Audio utilities loaded');