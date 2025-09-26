/**
 * 消不停·万币赢 - 主程序入口
 * 像素级复刻《天天爱消除》
 * 作者：@bjxc010
 */

class GameApp {
    constructor() {
        this.isLoading = true;
        this.currentScreen = 'loading';
        this.gameEngine = null;
        this.screenManager = null;
        this.audioManager = null;
        this.coinSystem = null;

        this.init();
    }

    async init() {
        try {
            console.log('🎮 启动消不停·万币赢...');

            // 显示加载界面
            this.showLoadingScreen();

            // 初始化各个系统
            await this.initializeSystems();

            // 加载游戏资源
            await this.loadGameAssets();

            // 启动游戏
            this.startGame();

        } catch (error) {
            console.error('❌ 游戏启动失败:', error);
            this.showError('游戏启动失败，请刷新页面重试');
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const progressBar = document.getElementById('loading-progress');

        if (loadingScreen && progressBar) {
            loadingScreen.classList.add('active');
            this.updateLoadingProgress(0, '初始化游戏系统...');
        }
    }

    async initializeSystems() {
        console.log('📦 初始化游戏系统...');

        // 初始化屏幕管理器
        if (typeof ScreenManager !== 'undefined') {
            this.screenManager = new ScreenManager();
            this.updateLoadingProgress(20, '加载界面管理系统...');
        }

        // 初始化音频管理器
        if (typeof AudioManager !== 'undefined') {
            this.audioManager = new AudioManager();
            await this.audioManager.init();
            this.updateLoadingProgress(40, '加载音频系统...');
        }

        // 初始化万花币系统
        if (typeof CoinSystem !== 'undefined') {
            this.coinSystem = new CoinSystem();
            await this.coinSystem.init();
            this.updateLoadingProgress(60, '加载经济系统...');
        }

        // 初始化游戏引擎
        if (typeof GameEngine !== 'undefined') {
            this.gameEngine = new GameEngine();
            await this.gameEngine.init();
            this.updateLoadingProgress(80, '加载游戏引擎...');
        }
    }

    async loadGameAssets() {
        console.log('🎨 加载游戏资源...');

        const assets = [
            // 音频文件
            'assets/sounds/bg_music.mp3',
            'assets/sounds/ui_click.wav',
            'assets/sounds/swap.wav',
            'assets/sounds/pop_01.wav',
            'assets/sounds/pop_02.wav',
            'assets/sounds/special_generate.wav',
            'assets/sounds/rocket_launch.wav',
            'assets/sounds/bird_explode.wav',
            'assets/sounds/victory_jingle.wav',
            'assets/sounds/fail_jingle.wav',

            // 图片文件
            'assets/images/characters/yellow-cat.png',
            'assets/images/characters/brown-bear.png',
            'assets/images/characters/pink-rabbit.png',
            'assets/images/characters/purple-cat.png',
            'assets/images/ui/default-avatar.png'
        ];

        const loadPromises = assets.map((asset, index) => {
            return new Promise((resolve, reject) => {
                if (asset.includes('.mp3') || asset.includes('.wav')) {
                    const audio = new Audio();
                    audio.oncanplaythrough = () => {
                        this.updateLoadingProgress(80 + (index / assets.length) * 15, `加载资源 ${index + 1}/${assets.length}`);
                        resolve();
                    };
                    audio.onerror = () => resolve(); // 忽略音频加载错误
                    audio.src = asset;
                } else {
                    const img = new Image();
                    img.onload = () => {
                        this.updateLoadingProgress(80 + (index / assets.length) * 15, `加载资源 ${index + 1}/${assets.length}`);
                        resolve();
                    };
                    img.onerror = () => resolve(); // 忽略图片加载错误
                    img.src = asset;
                }
            });
        });

        await Promise.all(loadPromises);
        this.updateLoadingProgress(95, '准备进入游戏...');
    }

    updateLoadingProgress(percent, message) {
        const progressBar = document.getElementById('loading-progress');
        const loadingText = document.querySelector('.loading-text');

        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }

        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    startGame() {
        console.log('🚀 游戏启动完成!');

        this.updateLoadingProgress(100, '启动完成!');

        setTimeout(() => {
            this.hideLoadingScreen();
            this.showMainMenu();
            this.bindEvents();
            this.isLoading = false;
        }, 1000);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('active');
        }
    }

    showMainMenu() {
        if (this.screenManager) {
            this.screenManager.showScreen('main-menu');
        } else {
            const mainMenu = document.getElementById('main-menu');
            if (mainMenu) {
                mainMenu.classList.add('active');
                this.currentScreen = 'main-menu';
            }
        }

        // 更新用户信息显示
        this.updateUserInfo();

        // 播放背景音乐
        if (this.audioManager) {
            this.audioManager.playBackgroundMusic();
        }
    }

    updateUserInfo() {
        // 更新万花币显示
        const coinsElement = document.getElementById('user-coins');
        if (coinsElement && this.coinSystem) {
            coinsElement.textContent = this.coinSystem.getCoins().toLocaleString();
        }

        // 更新体力显示
        const energyElement = document.getElementById('user-energy');
        if (energyElement) {
            const energy = localStorage.getItem('user-energy') || '5';
            energyElement.textContent = `${energy}/5`;
        }
    }

    bindEvents() {
        console.log('🔗 绑定事件监听器...');

        // 主菜单按钮事件
        this.bindButton('play-button', () => this.startNewGame());
        this.bindButton('withdraw-button', () => this.showWithdrawScreen());
        this.bindButton('leaderboard-button', () => this.showLeaderboard());
        this.bindButton('settings-button', () => this.showSettings());
        this.bindButton('checkin-button', () => this.dailyCheckin());

        // 返回按钮事件
        this.bindButton('map-back-button', () => this.showMainMenu());
        this.bindButton('withdraw-back-button', () => this.showMainMenu());
        this.bindButton('leaderboard-back-button', () => this.showMainMenu());
        this.bindButton('settings-back-button', () => this.showMainMenu());

        // 游戏内按钮事件
        this.bindButton('pause-button', () => this.pauseGame());
        this.bindButton('resume-button', () => this.resumeGame());
        this.bindButton('restart-button', () => this.restartLevel());
        this.bindButton('quit-button', () => this.quitToMap());

        // 完成界面按钮事件
        this.bindButton('next-level-button', () => this.nextLevel());
        this.bindButton('replay-button', () => this.restartLevel());
        this.bindButton('retry-button', () => this.restartLevel());
        this.bindButton('back-to-map-button', () => this.quitToMap());

        // 广告按钮事件
        this.bindButton('watch-ad-button', () => this.watchAd('powerup'));
        this.bindButton('continue-with-ad', () => this.watchAd('continue'));

        // Telegram集成事件
        this.bindButton('connect-telegram', () => this.connectTelegram());
        this.bindButton('share-game', () => this.shareGame());

        // 全局快捷键
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // 窗口失焦暂停
        window.addEventListener('blur', () => {
            if (this.currentScreen === 'game-screen' && this.gameEngine) {
                this.gameEngine.pause();
            }
        });
    }

    bindButton(id, callback) {
        const button = document.getElementById(id);
        if (button && callback) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.audioManager) {
                    this.audioManager.playSound('ui_click');
                }
                callback();
            });
        }
    }

    // 游戏流程方法
    startNewGame() {
        console.log('🎯 开始新游戏');
        if (this.screenManager) {
            this.screenManager.showScreen('level-map');
        }
        this.currentScreen = 'level-map';
        // TODO: 实现关卡地图
    }

    showWithdrawScreen() {
        console.log('💰 显示提现界面');
        if (this.screenManager) {
            this.screenManager.showScreen('withdraw-screen');
        }
        this.currentScreen = 'withdraw-screen';
        this.updateUserInfo();
    }

    showLeaderboard() {
        console.log('🏆 显示排行榜');
        if (this.screenManager) {
            this.screenManager.showScreen('leaderboard-screen');
        }
        this.currentScreen = 'leaderboard-screen';
    }

    showSettings() {
        console.log('⚙️ 显示设置');
        if (this.screenManager) {
            this.screenManager.showScreen('settings-screen');
        }
        this.currentScreen = 'settings-screen';
    }

    dailyCheckin() {
        console.log('📅 每日签到');
        const today = new Date().toDateString();
        const lastCheckin = localStorage.getItem('last-checkin');

        if (lastCheckin !== today) {
            if (this.coinSystem) {
                this.coinSystem.addCoins(100, '每日签到奖励');
            }
            localStorage.setItem('last-checkin', today);
            this.updateUserInfo();
            this.showMessage('签到成功！获得100万花币');
        } else {
            this.showMessage('今天已经签到过了！');
        }
    }

    pauseGame() {
        console.log('⏸️ 暂停游戏');
        if (this.gameEngine) {
            this.gameEngine.pause();
        }
        this.showModal('pause-menu');
    }

    resumeGame() {
        console.log('▶️ 恢复游戏');
        if (this.gameEngine) {
            this.gameEngine.resume();
        }
        this.hideModal('pause-menu');
    }

    restartLevel() {
        console.log('🔄 重新开始关卡');
        if (this.gameEngine) {
            this.gameEngine.restart();
        }
        this.hideAllModals();
    }

    quitToMap() {
        console.log('🗺️ 返回地图');
        if (this.gameEngine) {
            this.gameEngine.stop();
        }
        this.showMainMenu();
        this.hideAllModals();
    }

    nextLevel() {
        console.log('➡️ 下一关');
        if (this.gameEngine) {
            this.gameEngine.nextLevel();
        }
        this.hideAllModals();
    }

    watchAd(type) {
        console.log('📺 观看广告:', type);
        // TODO: 集成AdMon广告系统

        // 模拟广告观看完成
        setTimeout(() => {
            switch (type) {
                case 'powerup':
                    this.showMessage('获得随机道具！');
                    break;
                case 'continue':
                    if (this.gameEngine) {
                        this.gameEngine.addMoves(5);
                    }
                    this.hideModal('level-failed');
                    this.showMessage('获得5步额外步数！');
                    break;
            }
        }, 3000);
    }

    connectTelegram() {
        console.log('📱 连接Telegram');
        // TODO: 实现Telegram集成
        this.showMessage('Telegram连接功能即将上线！');
    }

    shareGame() {
        console.log('🔗 分享游戏');
        if (navigator.share) {
            navigator.share({
                title: '消不停·万币赢',
                text: '来玩这个超好玩的消除游戏，还能赚万花币！',
                url: window.location.href
            });
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showMessage('游戏链接已复制到剪贴板！');
            });
        }
    }

    handleKeyPress(e) {
        switch (e.code) {
            case 'Escape':
                if (this.currentScreen === 'game-screen') {
                    this.pauseGame();
                }
                break;
            case 'Space':
                if (this.currentScreen === 'game-screen') {
                    e.preventDefault();
                    this.pauseGame();
                }
                break;
        }
    }

    // 工具方法
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    hideAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => modal.classList.remove('active'));
    }

    showMessage(message) {
        // 简单的消息提示（后续可以改为更美观的Toast）
        alert(message);
    }

    showError(message) {
        console.error('❌', message);
        this.showMessage('错误: ' + message);
    }
}

// 页面加载完成后启动游戏
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 消不停·万币赢 - 像素级复刻《天天爱消除》');
    console.log('💰 集成万花币经济系统 - 支持提现到支付宝/USDT');
    console.log('👨‍💻 由 @bjxc010 开发 - 北京修车【万花楼】赞助');

    // 启动游戏应用
    window.gameApp = new GameApp();
});

// 处理页面卸载
window.addEventListener('beforeunload', () => {
    if (window.gameApp && window.gameApp.gameEngine) {
        window.gameApp.gameEngine.saveProgress();
    }
});

// 错误处理
window.addEventListener('error', (e) => {
    console.error('🚫 全局错误:', e.error);
    if (window.gameApp) {
        window.gameApp.showError('游戏运行出错：' + e.error.message);
    }
});

// 导出全局游戏应用实例
window.GameApp = GameApp;