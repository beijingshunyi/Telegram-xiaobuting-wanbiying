// Telegram Bot 集成管理器
class TelegramBotManager {
    constructor() {
        this.botUsername = CONFIG.TELEGRAM.BOT_USERNAME;
        this.gameUrl = CONFIG.TELEGRAM.SHARE_URL;
        this.developerUsername = CONFIG.TELEGRAM.DEVELOPER_USERNAME;
        this.initialize();
    }

    async initialize() {
        try {
            this.setupEventListeners();
            this.setupDeepLinks();
            console.log('Telegram Bot管理器初始化成功');
        } catch (error) {
            console.error('Telegram Bot管理器初始化失败:', error);
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 开发者链接
        const developerLink = document.getElementById('developer-link');
        if (developerLink) {
            developerLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openTelegramUser(this.developerUsername);
            });
            developerLink.href = `https://t.me/${this.developerUsername}`;
        }

        // 合作联系链接
        const cooperationLink = document.getElementById('cooperation-link');
        if (cooperationLink) {
            cooperationLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openTelegramUser(this.developerUsername);
            });
            cooperationLink.href = `https://t.me/${this.developerUsername}`;
        }

        // 监听游戏分享事件
        document.addEventListener('telegram-share', (e) => {
            this.shareGame(e.detail);
        });
    }

    // 设置深度链接处理
    setupDeepLinks() {
        // 检查URL参数中的启动参数
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('tgWebAppStartParam');

        if (startParam) {
            this.handleStartParameter(startParam);
        }

        // 检查Telegram WebApp的启动参数
        if (window.Telegram && window.Telegram.WebApp) {
            const webAppStartParam = window.Telegram.WebApp.initDataUnsafe?.start_parameter;
            if (webAppStartParam) {
                this.handleStartParameter(webAppStartParam);
            }
        }
    }

    // 处理启动参数
    handleStartParameter(param) {
        console.log('处理启动参数:', param);

        if (param.startsWith('invite_')) {
            // 处理邀请链接
            const inviteCode = param.replace('invite_', '');
            this.handleInviteLink(inviteCode);
        } else if (param.startsWith('share_')) {
            // 处理分享链接
            const shareData = param.replace('share_', '');
            this.handleShareLink(shareData);
        } else if (param === 'daily_bonus') {
            // 处理每日奖励链接
            this.handleDailyBonusLink();
        }
    }

    // 处理邀请链接
    async handleInviteLink(inviteCode) {
        console.log('处理邀请码:', inviteCode);

        // 显示邀请欢迎消息
        setTimeout(() => {
            if (window.uiManager) {
                window.uiManager.showNotification('欢迎通过好友邀请加入游戏！', 'success', 3000);
            }
        }, 1000);

        // 处理邀请逻辑
        if (window.socialManager) {
            await window.socialManager.processInvite(inviteCode);
        }
    }

    // 处理分享链接
    handleShareLink(shareData) {
        console.log('处理分享数据:', shareData);

        setTimeout(() => {
            if (window.uiManager) {
                window.uiManager.showNotification('感谢您的分享！', 'success', 2000);
            }
        }, 1000);
    }

    // 处理每日奖励链接
    handleDailyBonusLink() {
        console.log('处理每日奖励链接');

        setTimeout(() => {
            if (window.checkinSystem) {
                window.checkinSystem.showCheckinModal();
            }
        }, 1500);
    }

    // 打开Telegram用户
    openTelegramUser(username) {
        const telegramUrl = `https://t.me/${username}`;

        if (window.Telegram && window.Telegram.WebApp) {
            // 在Telegram WebApp中使用原生方法
            window.Telegram.WebApp.openTelegramLink(telegramUrl);
        } else {
            // 在浏览器中打开新窗口
            window.open(telegramUrl, '_blank');
        }
    }

    // 分享游戏
    shareGame(options = {}) {
        const {
            title = '消不停·万币赢',
            text = '🎮 快来玩消不停·万币赢！每天都能赚万花币，还能提现！',
            url = this.gameUrl,
            type = 'game'
        } = options;

        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            window.open(shareUrl, '_blank');
        }

        // 触发分享事件
        const shareEvent = new CustomEvent('share-game', {
            detail: { type, platform: 'telegram' }
        });
        document.dispatchEvent(shareEvent);
    }

    // 分享高分
    shareHighScore(score, level) {
        const text = `🎯 我在"消不停·万币赢"中达到了${score}分，通过了第${level}关！你也来挑战一下吧！`;

        this.shareGame({
            text: text,
            type: 'highscore'
        });
    }

    // 分享成就
    shareAchievement(achievement) {
        const text = `🏆 我在"消不停·万币赢"中解锁了"${achievement.name}"成就！${achievement.description}`;

        this.shareGame({
            text: text,
            type: 'achievement'
        });
    }

    // 分享邀请
    shareInvite(inviteCode) {
        const inviteUrl = `${this.gameUrl}?startapp=invite_${inviteCode}`;
        const text = `🎁 快来玩"消不停·万币赢"！使用我的邀请链接，我们都能获得奖励！`;

        this.shareGame({
            text: text,
            url: inviteUrl,
            type: 'invite'
        });
    }

    // 发送反馈给开发者
    sendFeedback(message) {
        const feedbackText = `🎮 游戏反馈：${message}`;
        const developerUrl = `https://t.me/${this.developerUsername}?text=${encodeURIComponent(feedbackText)}`;

        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.openTelegramLink(developerUrl);
        } else {
            window.open(developerUrl, '_blank');
        }
    }

    // 加入官方群组
    joinOfficialGroup() {
        // 这里应该是官方群组链接
        const groupUrl = 'https://t.me/xiaobuting_wanbiying_group';

        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.openTelegramLink(groupUrl);
        } else {
            window.open(groupUrl, '_blank');
        }
    }

    // 获取用户Telegram信息
    getTelegramUser() {
        if (window.Telegram && window.Telegram.WebApp) {
            return window.Telegram.WebApp.initDataUnsafe?.user || null;
        }
        return null;
    }

    // 检查是否在Telegram中运行
    isInTelegram() {
        return !!(window.Telegram && window.Telegram.WebApp);
    }

    // 设置主按钮
    setMainButton(text, callback, color = '#2481cc') {
        if (this.isInTelegram()) {
            const mainButton = window.Telegram.WebApp.MainButton;
            if (mainButton) {
                mainButton.text = text;
                mainButton.color = color;
                mainButton.show();

                // 清除之前的事件监听器
                mainButton.offClick();
                mainButton.onClick(callback);
            }
        }
    }

    // 隐藏主按钮
    hideMainButton() {
        if (this.isInTelegram()) {
            const mainButton = window.Telegram.WebApp.MainButton;
            if (mainButton) {
                mainButton.hide();
            }
        }
    }

    // 设置返回按钮
    setBackButton(callback) {
        if (this.isInTelegram()) {
            const backButton = window.Telegram.WebApp.BackButton;
            if (backButton) {
                backButton.show();
                backButton.onClick(callback);
            }
        }
    }

    // 隐藏返回按钮
    hideBackButton() {
        if (this.isInTelegram()) {
            const backButton = window.Telegram.WebApp.BackButton;
            if (backButton) {
                backButton.hide();
            }
        }
    }

    // 发送数据给Bot
    sendData(data) {
        if (this.isInTelegram()) {
            window.Telegram.WebApp.sendData(JSON.stringify(data));
        }
    }

    // 关闭WebApp
    close() {
        if (this.isInTelegram()) {
            window.Telegram.WebApp.close();
        }
    }

    // 扩展WebApp
    expand() {
        if (this.isInTelegram()) {
            window.Telegram.WebApp.expand();
        }
    }

    // 显示确认对话框
    showConfirm(message, callback) {
        if (this.isInTelegram()) {
            window.Telegram.WebApp.showConfirm(message, callback);
        } else {
            // 降级到浏览器确认对话框
            const result = confirm(message);
            callback(result);
        }
    }

    // 显示警告对话框
    showAlert(message, callback) {
        if (this.isInTelegram()) {
            window.Telegram.WebApp.showAlert(message, callback);
        } else {
            // 降级到浏览器警告对话框
            alert(message);
            if (callback) callback();
        }
    }

    // 触发触觉反馈
    hapticFeedback(type = 'light') {
        if (this.isInTelegram()) {
            const haptic = window.Telegram.WebApp.HapticFeedback;
            if (haptic) {
                switch (type) {
                    case 'light':
                        haptic.impactOccurred('light');
                        break;
                    case 'medium':
                        haptic.impactOccurred('medium');
                        break;
                    case 'heavy':
                        haptic.impactOccurred('heavy');
                        break;
                    case 'success':
                        haptic.notificationOccurred('success');
                        break;
                    case 'error':
                        haptic.notificationOccurred('error');
                        break;
                    case 'warning':
                        haptic.notificationOccurred('warning');
                        break;
                }
            }
        }
    }
}

// 创建全局实例
window.telegramBotManager = new TelegramBotManager();

// 导出分享函数供全局使用
window.shareToTelegram = (options) => {
    window.telegramBotManager.shareGame(options);
};

window.shareHighScore = (score, level) => {
    window.telegramBotManager.shareHighScore(score, level);
};

window.shareAchievement = (achievement) => {
    window.telegramBotManager.shareAchievement(achievement);
};