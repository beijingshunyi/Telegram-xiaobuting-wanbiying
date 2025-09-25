// 音效管理器
class AudioManager {
    constructor() {
        this.sounds = {};
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.masterVolume = CONFIG.AUDIO.MASTER_VOLUME;
        this.musicVolume = CONFIG.AUDIO.MUSIC_VOLUME;
        this.soundVolume = CONFIG.AUDIO.SFX_VOLUME;
        this.currentMusic = null;
        this.initialize();
    }

    initialize() {
        // 从本地存储加载音频设置
        this.loadAudioSettings();

        // 初始化所有音频文件
        this.initializeAudioFiles();

        // 设置音量控制
        this.updateVolumes();

        console.log('AudioManager initialized');
    }

    loadAudioSettings() {
        try {
            const settings = localStorage.getItem('audio_settings');
            if (settings) {
                const data = JSON.parse(settings);
                this.musicEnabled = data.musicEnabled !== false;
                this.soundEnabled = data.soundEnabled !== false;
                this.masterVolume = data.masterVolume || CONFIG.AUDIO.MASTER_VOLUME;
                this.musicVolume = data.musicVolume || CONFIG.AUDIO.MUSIC_VOLUME;
                this.soundVolume = data.soundVolume || CONFIG.AUDIO.SFX_VOLUME;
            }
        } catch (error) {
            console.error('Failed to load audio settings:', error);
        }
    }

    saveAudioSettings() {
        try {
            const settings = {
                musicEnabled: this.musicEnabled,
                soundEnabled: this.soundEnabled,
                masterVolume: this.masterVolume,
                musicVolume: this.musicVolume,
                soundVolume: this.soundVolume
            };
            localStorage.setItem('audio_settings', JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save audio settings:', error);
        }
    }

    initializeAudioFiles() {
        // 获取已存在的音频元素
        const backgroundMusic = document.getElementById('background-music');
        const matchSound = document.getElementById('match-sound');
        const coinSound = document.getElementById('coin-sound');
        const buttonSound = document.getElementById('button-sound');

        // 如果音频元素存在，添加到管理器中
        if (backgroundMusic) {
            this.sounds.background = backgroundMusic;
            backgroundMusic.loop = true;
        }
        if (matchSound) this.sounds.match = matchSound;
        if (coinSound) this.sounds.coin = coinSound;
        if (buttonSound) this.sounds.button = buttonSound;

        // 创建其他音效（使用Web Audio API合成）
        this.createSyntheticSounds();

        // 为所有音频添加事件监听器
        Object.values(this.sounds).forEach(audio => {
            if (audio instanceof HTMLAudioElement) {
                audio.addEventListener('error', () => {
                    console.warn('Audio file failed to load:', audio.src);
                });

                // 预加载音频
                audio.preload = 'auto';
            }
        });
    }

    createSyntheticSounds() {
        // 如果Web Audio API可用，创建合成音效
        if (window.AudioContext || window.webkitAudioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

                // 创建合成音效
                this.sounds.levelComplete = this.createTone([523.25, 659.25, 783.99], 0.5, 'square');
                this.sounds.gameOver = this.createTone([246.94, 207.65, 174.61], 0.8, 'sawtooth');
                this.sounds.combo = this.createTone([440, 554.37, 659.25], 0.3, 'triangle');
                this.sounds.shuffle = this.createTone([329.63, 349.23, 369.99], 0.4, 'sine');

            } catch (error) {
                console.warn('Web Audio API not available:', error);
            }
        }
    }

    createTone(frequencies, duration, waveType = 'sine') {
        if (!this.audioContext) return null;

        return () => {
            if (!this.soundEnabled) return;

            const oscillators = [];
            const gainNode = this.audioContext.createGain();
            gainNode.connect(this.audioContext.destination);
            gainNode.gain.setValueAtTime(this.soundVolume * this.masterVolume * 0.3, this.audioContext.currentTime);

            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                oscillator.type = waveType;
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.connect(gainNode);
                oscillator.start(this.audioContext.currentTime + index * 0.1);
                oscillator.stop(this.audioContext.currentTime + duration);
                oscillators.push(oscillator);
            });

            // 淡出效果
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        };
    }

    updateVolumes() {
        Object.entries(this.sounds).forEach(([key, audio]) => {
            if (audio instanceof HTMLAudioElement) {
                if (key === 'background') {
                    audio.volume = this.musicEnabled ? this.musicVolume * this.masterVolume : 0;
                } else {
                    audio.volume = this.soundEnabled ? this.soundVolume * this.masterVolume : 0;
                }
            }
        });
    }

    // 播放音效
    playSound(soundName, volume = 1) {
        if (!this.soundEnabled && soundName !== 'background') return;
        if (!this.musicEnabled && soundName === 'background') return;

        const sound = this.sounds[soundName];
        if (!sound) {
            console.warn(`Sound '${soundName}' not found`);
            return;
        }

        try {
            if (sound instanceof HTMLAudioElement) {
                // HTML Audio Element
                sound.currentTime = 0;
                sound.volume = (soundName === 'background' ? this.musicVolume : this.soundVolume) * this.masterVolume * volume;
                const playPromise = sound.play();

                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn('Failed to play sound:', error);
                    });
                }
            } else if (typeof sound === 'function') {
                // 合成音效函数
                sound();
            }
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    // 播放背景音乐
    playMusic() {
        this.playSound('background');
        this.currentMusic = 'background';
    }

    // 停止背景音乐
    stopMusic() {
        if (this.sounds.background) {
            this.sounds.background.pause();
            this.sounds.background.currentTime = 0;
        }
        this.currentMusic = null;
    }

    // 切换音乐开关
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        this.saveAudioSettings();
        this.updateVolumes();

        if (this.musicEnabled && !this.currentMusic) {
            this.playMusic();
        } else if (!this.musicEnabled) {
            this.stopMusic();
        }

        return this.musicEnabled;
    }

    // 切换音效开关
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.saveAudioSettings();
        this.updateVolumes();
        return this.soundEnabled;
    }

    // 设置主音量
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.saveAudioSettings();
        this.updateVolumes();
    }

    // 设置音乐音量
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.saveAudioSettings();
        this.updateVolumes();
    }

    // 设置音效音量
    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
        this.saveAudioSettings();
        this.updateVolumes();
    }

    // 游戏事件音效
    onMatch(matchCount) {
        if (matchCount >= 5) {
            this.playSound('combo');
        } else {
            this.playSound('match');
        }
    }

    onCoinEarned() {
        this.playSound('coin');
    }

    onButtonClick() {
        this.playSound('button');
    }

    onLevelComplete() {
        this.playSound('levelComplete');
    }

    onGameOver() {
        this.playSound('gameOver');
    }

    onShuffle() {
        this.playSound('shuffle');
    }

    // 创建音频设置界面
    createAudioSettingsModal() {
        const content = `
            <div class="audio-settings">
                <h3>🔊 音效设置</h3>

                <div class="setting-group">
                    <div class="setting-item">
                        <label>背景音乐</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="music-toggle" ${this.musicEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </div>
                    </div>

                    <div class="volume-control">
                        <label>音乐音量</label>
                        <div class="volume-slider">
                            <input type="range" id="music-volume" min="0" max="100" value="${this.musicVolume * 100}">
                            <span class="volume-value">${Math.round(this.musicVolume * 100)}%</span>
                        </div>
                    </div>
                </div>

                <div class="setting-group">
                    <div class="setting-item">
                        <label>游戏音效</label>
                        <div class="toggle-switch">
                            <input type="checkbox" id="sound-toggle" ${this.soundEnabled ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </div>
                    </div>

                    <div class="volume-control">
                        <label>音效音量</label>
                        <div class="volume-slider">
                            <input type="range" id="sound-volume" min="0" max="100" value="${this.soundVolume * 100}">
                            <span class="volume-value">${Math.round(this.soundVolume * 100)}%</span>
                        </div>
                    </div>
                </div>

                <div class="setting-group">
                    <div class="volume-control">
                        <label>主音量</label>
                        <div class="volume-slider">
                            <input type="range" id="master-volume" min="0" max="100" value="${this.masterVolume * 100}">
                            <span class="volume-value">${Math.round(this.masterVolume * 100)}%</span>
                        </div>
                    </div>
                </div>

                <div class="test-buttons">
                    <button class="test-btn" onclick="window.audioManager.playSound('match')">测试音效</button>
                    <button class="test-btn" onclick="window.audioManager.playSound('coin')">测试金币音效</button>
                </div>
            </div>
        `;

        const modal = window.modalManager.show(content, { closable: true });

        // 添加事件监听器
        setTimeout(() => {
            const musicToggle = document.getElementById('music-toggle');
            const soundToggle = document.getElementById('sound-toggle');
            const musicVolume = document.getElementById('music-volume');
            const soundVolume = document.getElementById('sound-volume');
            const masterVolume = document.getElementById('master-volume');

            if (musicToggle) {
                musicToggle.addEventListener('change', (e) => {
                    this.musicEnabled = e.target.checked;
                    this.saveAudioSettings();
                    this.updateVolumes();
                    if (this.musicEnabled) this.playMusic();
                    else this.stopMusic();
                });
            }

            if (soundToggle) {
                soundToggle.addEventListener('change', (e) => {
                    this.soundEnabled = e.target.checked;
                    this.saveAudioSettings();
                    this.updateVolumes();
                });
            }

            if (musicVolume) {
                musicVolume.addEventListener('input', (e) => {
                    this.setMusicVolume(e.target.value / 100);
                    document.querySelector('#music-volume + .volume-value').textContent = e.target.value + '%';
                });
            }

            if (soundVolume) {
                soundVolume.addEventListener('input', (e) => {
                    this.setSoundVolume(e.target.value / 100);
                    document.querySelector('#sound-volume + .volume-value').textContent = e.target.value + '%';
                });
            }

            if (masterVolume) {
                masterVolume.addEventListener('input', (e) => {
                    this.setMasterVolume(e.target.value / 100);
                    document.querySelector('#master-volume + .volume-value').textContent = e.target.value + '%';
                });
            }
        }, 100);

        return modal;
    }

    // 获取音频状态
    getStatus() {
        return {
            musicEnabled: this.musicEnabled,
            soundEnabled: this.soundEnabled,
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            soundVolume: this.soundVolume,
            currentMusic: this.currentMusic
        };
    }
}

// 创建全局音效管理器实例
window.audioManager = new AudioManager();

// 添加音效设置的CSS样式
const audioStyles = document.createElement('style');
audioStyles.textContent = `
    .audio-settings {
        padding: 1rem;
        max-width: 400px;
    }

    .audio-settings h3 {
        text-align: center;
        margin-bottom: 1.5rem;
        color: #333;
    }

    .setting-group {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 10px;
    }

    .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .setting-item label {
        font-weight: 600;
        color: #333;
    }

    .toggle-switch {
        position: relative;
        width: 50px;
        height: 25px;
    }

    .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #ccc;
        border-radius: 25px;
        transition: 0.3s;
    }

    .toggle-slider:before {
        position: absolute;
        content: "";
        height: 19px;
        width: 19px;
        left: 3px;
        bottom: 3px;
        background: white;
        border-radius: 50%;
        transition: 0.3s;
    }

    .toggle-switch input:checked + .toggle-slider {
        background: #667eea;
    }

    .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(25px);
    }

    .volume-control {
        margin-top: 0.8rem;
    }

    .volume-control label {
        display: block;
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 0.5rem;
    }

    .volume-slider {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .volume-slider input[type="range"] {
        flex: 1;
        height: 5px;
        border-radius: 3px;
        background: #ddd;
        outline: none;
        -webkit-appearance: none;
    }

    .volume-slider input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #667eea;
        cursor: pointer;
    }

    .volume-value {
        font-size: 0.9rem;
        font-weight: 600;
        color: #667eea;
        min-width: 40px;
        text-align: right;
    }

    .test-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 1.5rem;
    }

    .test-btn {
        padding: 0.6rem 1rem;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.3s ease;
    }

    .test-btn:hover {
        background: #5a67d8;
    }
`;
document.head.appendChild(audioStyles);