/**
 * Telegram集成系统
 * 处理Telegram Bot API集成、好友邀请、分享功能
 */

class TelegramIntegration {
    constructor() {
        this.botToken = null;
        this.chatId = null;
        this.userId = null;
        this.userInfo = null;
        this.isConnected = false;

        // Telegram WebApp API
        this.webApp = window.Telegram?.WebApp;
        this.webAppUser = this.webApp?.initDataUnsafe?.user;

        // Bot配置
        this.botConfig = {
            username: 'bjxc010',
            gameUrl: window.location.origin,
            shareTemplate: '🎮 我在万花消消乐通过了第{level}关，得分{score}！快来挑战我吧！\n{gameUrl}',
            inviteTemplate: '🎊 我邀请你玩万花消消乐！通过我的邀请链接注册，我们都能获得奖励！\n{inviteUrl}'
        };

        // 邀请奖励配置
        this.inviteRewards = {
            inviterReward: 100,        // 邀请者奖励100万花币
            inviteeReward: 50,         // 被邀请者奖励50万花币
            friendCompleteReward: 200, // 好友完成10关奖励200万花币
            purchaseCommission: 0.1    // 好友充值10%提成
        };

        // 社交功能状态
        this.friends = new Map();
        this.inviteHistory = [];
        this.shareHistory = [];

        console.log('📱 TelegramIntegration initialized');
        this.init();
    }

    // 初始化Telegram集成
    async init() {
        try {
            // 检查是否在Telegram环境中运行
            this.checkTelegramEnvironment();

            // 初始化WebApp
            if (this.webApp) {
                this.initWebApp();
            }

            // 加载用户数据
            this.loadUserData();

            // 绑定事件
            this.bindEvents();

            console.log('✅ TelegramIntegration initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize TelegramIntegration:', error);
            return false;
        }
    }

    // 检查Telegram环境
    checkTelegramEnvironment() {
        // 检查是否在Telegram内置浏览器中运行
        const userAgent = navigator.userAgent.toLowerCase();
        const isTelegramWebView = userAgent.includes('telegram');

        // 检查Telegram WebApp API是否可用
        const hasWebAppAPI = !!window.Telegram?.WebApp;

        // 检查URL参数中是否有Telegram数据
        const urlParams = new URLSearchParams(window.location.search);
        const hasTelegramParams = urlParams.has('tgWebAppData') || urlParams.has('start');

        this.isInTelegram = isTelegramWebView || hasWebAppAPI || hasTelegramParams;

        console.log('📱 Telegram environment:', {
            isTelegramWebView,
            hasWebAppAPI,
            hasTelegramParams,
            isInTelegram: this.isInTelegram
        });
    }

    // 初始化Telegram WebApp
    initWebApp() {
        if (!this.webApp) return;

        try {
            // 设置WebApp参数
            this.webApp.ready();
            this.webApp.expand();

            // 获取用户信息
            if (this.webAppUser) {
                this.userInfo = {
                    id: this.webAppUser.id,
                    firstName: this.webAppUser.first_name,
                    lastName: this.webAppUser.last_name,
                    username: this.webAppUser.username,
                    languageCode: this.webAppUser.language_code,
                    isPremium: this.webAppUser.is_premium
                };

                this.userId = this.webAppUser.id;
                this.isConnected = true;

                console.log('👤 Telegram user info:', this.userInfo);
            }

            // 设置主按钮
            this.setupMainButton();

            // 设置返回按钮
            this.setupBackButton();

            // 处理邀请链接
            this.handleInviteLink();

        } catch (error) {
            console.error('❌ Failed to initialize WebApp:', error);
        }
    }

    // 设置主按钮
    setupMainButton() {
        if (!this.webApp?.MainButton) return;

        this.webApp.MainButton.setText('分享游戏');
        this.webApp.MainButton.color = '#FF6B9D';
        this.webApp.MainButton.textColor = '#FFFFFF';

        this.webApp.MainButton.onClick(() => {
            this.shareGame();
        });

        // 在特定场景下显示主按钮
        this.showMainButtonWhenAppropriate();
    }

    // 设置返回按钮
    setupBackButton() {
        if (!this.webApp?.BackButton) return;

        this.webApp.BackButton.onClick(() => {
            // 触发游戏内的返回逻辑
            if (window.gameApp && window.gameApp.screenManager) {
                window.gameApp.screenManager.goBack();
            }
        });
    }

    // 处理邀请链接
    handleInviteLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('start');

        if (startParam && startParam.startsWith('invite_')) {
            const inviterId = startParam.replace('invite_', '');
            this.processInviteCode(inviterId);
        }
    }

    // 处理邀请码
    async processInviteCode(inviterId) {
        if (!inviterId || inviterId === this.userId) {
            console.log('🚫 Invalid or self-invite code');
            return;
        }

        // 检查是否已经处理过这个邀请
        const existingInvite = this.inviteHistory.find(invite => invite.inviterId === inviterId);
        if (existingInvite) {
            console.log('🚫 Invite already processed');
            return;
        }

        try {
            // 记录邀请关系
            const inviteRecord = {
                id: GameHelpers.string.random(8),
                inviterId: inviterId,
                inviteeId: this.userId,
                timestamp: Date.now(),
                status: 'pending',
                rewards: {
                    inviterReward: this.inviteRewards.inviterReward,
                    inviteeReward: this.inviteRewards.inviteeReward
                }
            };

            this.inviteHistory.push(inviteRecord);
            this.saveInviteData();

            // 发放被邀请者奖励
            if (window.gameApp?.coinSystem) {
                window.gameApp.coinSystem.addCoins(
                    this.inviteRewards.inviteeReward,
                    '邀请奖励',
                    { inviteId: inviteRecord.id, inviterId: inviterId }
                );
            }

            // 通知邀请者（通过Bot API）
            await this.notifyInviteSuccess(inviterId, this.userInfo);

            this.showMessage('🎊 欢迎通过邀请加入！已获得50万花币奖励！');

        } catch (error) {
            console.error('❌ Failed to process invite code:', error);
        }
    }

    // 通知邀请成功
    async notifyInviteSuccess(inviterId, inviteeInfo) {
        // 这里应该调用后端API来通知邀请者
        // 暂时记录到本地存储，实际部署时需要后端处理

        const notification = {
            type: 'invite_success',
            inviterId: inviterId,
            inviteeInfo: inviteeInfo,
            timestamp: Date.now(),
            reward: this.inviteRewards.inviterReward
        };

        // 保存通知（实际应该发送到后端）
        const notifications = GameHelpers.storage.get('pending_notifications', []);
        notifications.push(notification);
        GameHelpers.storage.set('pending_notifications', notifications);

        console.log('📬 Invite success notification queued');
    }

    // 生成邀请链接
    generateInviteLink() {
        if (!this.userId) {
            console.error('❌ User ID not available');
            return null;
        }

        const inviteCode = `invite_${this.userId}`;
        const inviteUrl = `${this.botConfig.gameUrl}?start=${inviteCode}`;

        return {
            code: inviteCode,
            url: inviteUrl,
            shortUrl: `t.me/${this.botConfig.username}?start=${inviteCode}`
        };
    }

    // 邀请好友
    async inviteFriend() {
        if (!this.isConnected) {
            this.showMessage('请先连接Telegram账号');
            return false;
        }

        const inviteLink = this.generateInviteLink();
        if (!inviteLink) {
            this.showMessage('生成邀请链接失败');
            return false;
        }

        const inviteMessage = GameHelpers.string.format(
            this.botConfig.inviteTemplate,
            {
                inviteUrl: inviteLink.url,
                gameUrl: this.botConfig.gameUrl
            }
        );

        try {
            if (this.webApp) {
                // 使用Telegram WebApp分享
                this.webApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink.url)}&text=${encodeURIComponent(inviteMessage)}`);
            } else {
                // 使用Web Share API
                if (navigator.share) {
                    await navigator.share({
                        title: '万花消消乐邀请',
                        text: inviteMessage,
                        url: inviteLink.url
                    });
                } else {
                    // 复制到剪贴板
                    await this.copyToClipboard(inviteMessage);
                    this.showMessage('邀请信息已复制到剪贴板');
                }
            }

            // 记录分享历史
            this.recordShareAction('invite', inviteLink);
            return true;

        } catch (error) {
            console.error('❌ Failed to share invite:', error);
            this.showMessage('分享邀请失败');
            return false;
        }
    }

    // 分享游戏成就
    async shareGameAchievement(achievementData) {
        const { level, score, stars } = achievementData;

        const shareMessage = GameHelpers.string.format(
            this.botConfig.shareTemplate,
            {
                level: level,
                score: score.toLocaleString(),
                gameUrl: this.botConfig.gameUrl
            }
        );

        const shareData = {
            title: `万花消消乐 - 第${level}关`,
            text: shareMessage,
            url: this.botConfig.gameUrl
        };

        try {
            if (this.webApp) {
                // 显示主按钮用于分享
                this.webApp.MainButton.setText('分享成就');
                this.webApp.MainButton.show();

                // 临时修改主按钮行为
                this.webApp.MainButton.offClick();
                this.webApp.MainButton.onClick(() => {
                    this.webApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(this.botConfig.gameUrl)}&text=${encodeURIComponent(shareMessage)}`);
                    this.webApp.MainButton.hide();
                    this.setupMainButton(); // 恢复默认行为
                });

            } else if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await this.copyToClipboard(shareMessage);
                this.showMessage('成就信息已复制到剪贴板');
            }

            // 记录分享历史
            this.recordShareAction('achievement', achievementData);

            // 分享奖励
            if (window.gameApp?.coinSystem) {
                window.gameApp.coinSystem.addCoins(25, '分享成就奖励');
            }

            return true;

        } catch (error) {
            console.error('❌ Failed to share achievement:', error);
            this.showMessage('分享失败');
            return false;
        }
    }

    // 分享游戏
    async shareGame() {
        const shareMessage = `🎮 发现了一个超好玩的消除游戏！\n💰 还能赚万花币提现真钱！\n🎯 快来挑战吧：${this.botConfig.gameUrl}`;

        try {
            if (this.webApp) {
                this.webApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(this.botConfig.gameUrl)}&text=${encodeURIComponent(shareMessage)}`);
            } else if (navigator.share) {
                await navigator.share({
                    title: '万花消消乐',
                    text: shareMessage,
                    url: this.botConfig.gameUrl
                });
            } else {
                await this.copyToClipboard(shareMessage);
                this.showMessage('游戏链接已复制到剪贴板');
            }

            // 分享奖励
            if (window.gameApp?.coinSystem) {
                window.gameApp.coinSystem.addCoins(15, '分享游戏奖励');
            }

            this.recordShareAction('game', {});
            return true;

        } catch (error) {
            console.error('❌ Failed to share game:', error);
            return false;
        }
    }

    // 连接Telegram账号
    async connectTelegram() {
        if (this.isConnected) {
            this.showMessage('Telegram账号已连接');
            return true;
        }

        try {
            if (this.isInTelegram) {
                // 在Telegram环境中，尝试获取用户信息
                this.checkTelegramAuth();
            } else {
                // 不在Telegram环境中，提供连接指引
                this.showTelegramConnectGuide();
            }

        } catch (error) {
            console.error('❌ Failed to connect Telegram:', error);
            this.showMessage('连接Telegram失败');
            return false;
        }
    }

    // 检查Telegram授权
    checkTelegramAuth() {
        const urlParams = new URLSearchParams(window.location.search);
        const tgData = urlParams.get('tgWebAppData');

        if (tgData) {
            // 解析Telegram数据
            try {
                const userData = this.parseTelegramData(tgData);
                if (userData) {
                    this.userInfo = userData;
                    this.userId = userData.id;
                    this.isConnected = true;
                    this.saveUserData();
                    this.showMessage('✅ Telegram账号连接成功！');
                    return true;
                }
            } catch (error) {
                console.error('❌ Failed to parse Telegram data:', error);
            }
        }

        this.showMessage('❌ 无法获取Telegram用户信息');
        return false;
    }

    // 解析Telegram数据
    parseTelegramData(tgData) {
        try {
            // 简化的解析逻辑（实际应用中需要验证签名）
            const decoded = decodeURIComponent(tgData);
            const params = new URLSearchParams(decoded);
            const userStr = params.get('user');

            if (userStr) {
                return JSON.parse(userStr);
            }
        } catch (error) {
            console.error('❌ Failed to parse Telegram data:', error);
        }

        return null;
    }

    // 显示Telegram连接指引
    showTelegramConnectGuide() {
        const message = `
要连接Telegram账号，请：

1. 在Telegram中搜索 @${this.botConfig.username}
2. 点击"开始游戏"按钮
3. 或者直接访问：t.me/${this.botConfig.username}

连接后可以享受更多功能：
• 邀请好友获得奖励
• 参与排行榜竞赛
• 获得专属优惠
        `;

        if (confirm(message + '\n\n是否现在打开Telegram？')) {
            window.open(`https://t.me/${this.botConfig.username}`, '_blank');
        }
    }

    // 记录分享行为
    recordShareAction(type, data) {
        const shareRecord = {
            id: GameHelpers.string.random(8),
            type: type,
            data: data,
            timestamp: Date.now(),
            userId: this.userId
        };

        this.shareHistory.unshift(shareRecord);

        // 只保留最近100条记录
        if (this.shareHistory.length > 100) {
            this.shareHistory = this.shareHistory.slice(0, 100);
        }

        this.saveShareData();
    }

    // 显示主按钮（适当时机）
    showMainButtonWhenAppropriate() {
        // 监听游戏状态变化
        document.addEventListener('screen-change', (event) => {
            const { newScreen } = event.detail;

            if (newScreen === 'level-complete' || newScreen === 'main-menu') {
                if (this.webApp?.MainButton) {
                    this.webApp.MainButton.show();
                }
            } else {
                if (this.webApp?.MainButton) {
                    this.webApp.MainButton.hide();
                }
            }
        });
    }

    // 绑定事件
    bindEvents() {
        // 连接Telegram按钮
        const connectBtn = document.getElementById('connect-telegram');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => {
                this.connectTelegram();
            });
        }

        // 分享游戏按钮
        const shareBtn = document.getElementById('share-game');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareGame();
            });
        }

        // 邀请好友按钮
        const inviteBtn = document.getElementById('invite-friends');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', () => {
                this.inviteFriend();
            });
        }

        // 监听关卡完成事件
        document.addEventListener('level-complete', (event) => {
            const levelData = event.detail;
            // 自动提示分享成就
            setTimeout(() => {
                if (confirm('恭喜通关！是否分享你的成就到Telegram？')) {
                    this.shareGameAchievement(levelData);
                }
            }, 2000);
        });
    }

    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
            } else {
                // 备用方法
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            return true;
        } catch (error) {
            console.error('❌ Failed to copy to clipboard:', error);
            return false;
        }
    }

    // 加载用户数据
    loadUserData() {
        const savedData = GameHelpers.storage.get(GAME_CONSTANTS.STORAGE_KEYS.TELEGRAM_DATA, {});

        if (savedData.userInfo) {
            this.userInfo = savedData.userInfo;
            this.userId = savedData.userInfo.id;
            this.isConnected = true;
        }

        if (savedData.friends) {
            savedData.friends.forEach(friend => {
                this.friends.set(friend.id, friend);
            });
        }

        this.inviteHistory = savedData.inviteHistory || [];
        this.shareHistory = savedData.shareHistory || [];
    }

    // 保存用户数据
    saveUserData() {
        const dataToSave = {
            userInfo: this.userInfo,
            friends: Array.from(this.friends.values()),
            inviteHistory: this.inviteHistory,
            shareHistory: this.shareHistory,
            lastUpdate: Date.now()
        };

        GameHelpers.storage.set(GAME_CONSTANTS.STORAGE_KEYS.TELEGRAM_DATA, dataToSave);
    }

    // 保存邀请数据
    saveInviteData() {
        this.saveUserData();
    }

    // 保存分享数据
    saveShareData() {
        this.saveUserData();
    }

    // 显示消息
    showMessage(message) {
        if (this.webApp?.showAlert) {
            this.webApp.showAlert(message);
        } else {
            console.log('📱 Telegram message:', message);
            // 可以替换为游戏内的消息显示系统
            if (window.gameApp?.showMessage) {
                window.gameApp.showMessage(message);
            } else {
                alert(message);
            }
        }
    }

    // 获取用户信息
    getUserInfo() {
        return this.userInfo;
    }

    // 获取好友列表
    getFriends() {
        return Array.from(this.friends.values());
    }

    // 获取邀请历史
    getInviteHistory() {
        return [...this.inviteHistory];
    }

    // 获取分享历史
    getShareHistory() {
        return [...this.shareHistory];
    }

    // 获取连接状态
    isConnectedToTelegram() {
        return this.isConnected;
    }

    // 获取统计信息
    getStatistics() {
        return {
            isConnected: this.isConnected,
            userInfo: this.userInfo,
            friendsCount: this.friends.size,
            totalInvites: this.inviteHistory.length,
            totalShares: this.shareHistory.length,
            successfulInvites: this.inviteHistory.filter(invite => invite.status === 'completed').length
        };
    }

    // 获取调试信息
    getDebugInfo() {
        return {
            isInTelegram: this.isInTelegram,
            isConnected: this.isConnected,
            hasWebApp: !!this.webApp,
            userId: this.userId,
            userInfo: this.userInfo,
            friendsCount: this.friends.size,
            inviteHistoryCount: this.inviteHistory.length,
            shareHistoryCount: this.shareHistory.length
        };
    }
}

// 导出TelegramIntegration类
window.TelegramIntegration = TelegramIntegration;