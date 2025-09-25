class TelegramIntegration {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.user = null;
        this.isInitialized = false;
        this.initPromise = this.initialize();
    }

    async initialize() {
        if (!this.tg) {
            console.warn('Telegram WebApp not available');
            // 开发环境模拟用户数据
            this.user = {
                id: Date.now(),
                username: 'test_user',
                first_name: '测试用户',
                photo_url: 'images/default-avatar.png',
                language_code: 'zh'
            };
            this.isInitialized = true;
            return;
        }

        try {
            // 初始化Telegram WebApp
            this.tg.ready();
            this.tg.expand();

            // 设置主题 - 检查版本兼容性
            if (this.tg.version >= '6.1') {
                this.tg.setHeaderColor('#667eea');
            }
            if (this.tg.version >= '6.1') {
                this.tg.setBackgroundColor('#667eea');
            }

            // 获取用户信息
            if (this.tg.initDataUnsafe?.user) {
                this.user = this.tg.initDataUnsafe.user;

                // 如果有头像URL，需要通过Bot API获取
                if (this.user.photo_url) {
                    this.user.photo_url = await this.getUserPhoto(this.user.id);
                } else {
                    this.user.photo_url = 'images/default-avatar.png';
                }
            }

            // 设置主按钮
            this.setupMainButton();

            // 设置返回按钮
            this.setupBackButton();

            this.isInitialized = true;
            console.log('Telegram WebApp initialized:', this.user);

        } catch (error) {
            console.error('Failed to initialize Telegram WebApp:', error);
            this.isInitialized = false;
        }
    }

    setupMainButton() {
        if (!this.tg?.MainButton) return;

        this.tg.MainButton.setText('开始游戏');
        this.tg.MainButton.color = '#667eea';
        this.tg.MainButton.textColor = '#ffffff';

        this.tg.MainButton.onClick(() => {
            document.dispatchEvent(new CustomEvent('telegram:mainButtonClick'));
        });
    }

    setupBackButton() {
        // BackButton需要版本6.1+
        if (!this.tg?.BackButton || this.tg.version < '6.1') return;

        this.tg.BackButton.onClick(() => {
            document.dispatchEvent(new CustomEvent('telegram:backButtonClick'));
        });
    }

    showMainButton(text = '开始游戏') {
        if (!this.tg?.MainButton) return;

        this.tg.MainButton.setText(text);
        this.tg.MainButton.show();
    }

    hideMainButton() {
        if (!this.tg?.MainButton) return;
        this.tg.MainButton.hide();
    }

    showBackButton() {
        if (!this.tg?.BackButton || this.tg.version < '6.1') return;
        this.tg.BackButton.show();
    }

    hideBackButton() {
        if (!this.tg?.BackButton || this.tg.version < '6.1') return;
        this.tg.BackButton.hide();
    }

    async getUserPhoto(userId) {
        try {
            // 这里应该通过后端API调用Telegram Bot API获取用户头像
            const response = await fetch(`${CONFIG.API.BASE_URL}/user/photo/${userId}`);
            if (response.ok) {
                const data = await response.json();
                return data.photo_url;
            }
        } catch (error) {
            console.error('Failed to get user photo:', error);
        }
        return 'images/default-avatar.png';
    }

    // 分享功能
    shareGame(score = null, level = null) {
        const shareData = {
            url: CONFIG.TELEGRAM.SHARE_URL,
            text: this.generateShareText(score, level)
        };

        if (this.tg?.shareMessage) {
            this.tg.shareMessage(shareData.text, shareData.url);
        } else {
            // 备用分享方法
            this.fallbackShare(shareData);
        }

        // 记录分享事件
        this.trackShare();
    }

    generateShareText(score, level) {
        let text = `🎮 我在玩【${CONFIG.COPYRIGHT.GAME_NAME}】！`;

        if (score && level) {
            text += `\n🎯 刚刚在第${level}关获得了${score}分！`;
        }

        text += `\n💰 每天都能赚万花币，快来一起玩吧！`;
        text += `\n🎁 使用我的邀请还能获得额外奖励哦~`;

        return text;
    }

    fallbackShare(shareData) {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`;
        window.open(shareUrl, '_blank');
    }

    trackShare() {
        // 发送分享事件到后端
        fetch(`${CONFIG.API.BASE_URL}/user/share`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: this.user?.id,
                timestamp: Date.now()
            })
        }).catch(error => console.error('Failed to track share:', error));
    }

    // 邀请好友
    inviteFriend() {
        const inviteText = `🎮 我发现了一个超好玩的消消乐游戏【${CONFIG.COPYRIGHT.GAME_NAME}】！\n` +
                          `💰 不仅好玩还能赚万花币，提现到支付宝和USDT！\n` +
                          `🎁 用我的邀请链接注册，你我都能获得额外奖励！\n` +
                          `👆 点击开始游戏吧！`;

        if (this.tg?.shareMessage) {
            this.tg.shareMessage(inviteText, CONFIG.TELEGRAM.SHARE_URL);
        } else {
            this.fallbackShare({
                url: CONFIG.TELEGRAM.SHARE_URL,
                text: inviteText
            });
        }
    }

    // 打开Telegram用户页面
    openTelegramUser(username) {
        const telegramUrl = `https://t.me/${username.replace('@', '')}`;
        if (this.tg?.openTelegramLink) {
            this.tg.openTelegramLink(telegramUrl);
        } else {
            window.open(telegramUrl, '_blank');
        }
    }

    // 显示弹窗
    showAlert(message) {
        if (this.tg?.showAlert && this.tg.version >= '6.2') {
            this.tg.showAlert(message);
        } else {
            alert(message);
        }
    }

    // 显示确认框
    showConfirm(message, callback) {
        if (this.tg?.showConfirm && this.tg.version >= '6.2') {
            this.tg.showConfirm(message, callback);
        } else {
            const result = confirm(message);
            callback(result);
        }
    }

    // 触觉反馈
    hapticFeedback(type = 'impact') {
        if (this.tg?.HapticFeedback) {
            switch (type) {
                case 'light':
                    this.tg.HapticFeedback.impactOccurred('light');
                    break;
                case 'medium':
                    this.tg.HapticFeedback.impactOccurred('medium');
                    break;
                case 'heavy':
                    this.tg.HapticFeedback.impactOccurred('heavy');
                    break;
                case 'success':
                    this.tg.HapticFeedback.notificationOccurred('success');
                    break;
                case 'warning':
                    this.tg.HapticFeedback.notificationOccurred('warning');
                    break;
                case 'error':
                    this.tg.HapticFeedback.notificationOccurred('error');
                    break;
                default:
                    this.tg.HapticFeedback.impactOccurred('medium');
            }
        }
    }

    // 关闭WebApp
    close() {
        if (this.tg?.close) {
            this.tg.close();
        } else {
            window.close();
        }
    }

    // 获取用户信息
    getUser() {
        return this.user;
    }

    // 检查是否在Telegram环境中
    isTelegramEnvironment() {
        return !!this.tg;
    }

    // 获取启动参数
    getStartParam() {
        return this.tg?.initDataUnsafe?.start_param || null;
    }

    // 设置云存储数据
    async setCloudStorage(key, value) {
        if (!this.tg?.CloudStorage) return false;

        try {
            return new Promise((resolve) => {
                this.tg.CloudStorage.setItem(key, JSON.stringify(value), (error) => {
                    if (error) {
                        console.error('CloudStorage setItem error:', error);
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error('Failed to set cloud storage:', error);
            return false;
        }
    }

    // 获取云存储数据
    async getCloudStorage(key) {
        if (!this.tg?.CloudStorage) return null;

        try {
            return new Promise((resolve) => {
                this.tg.CloudStorage.getItem(key, (error, value) => {
                    if (error) {
                        console.error('CloudStorage getItem error:', error);
                        resolve(null);
                    } else {
                        try {
                            resolve(value ? JSON.parse(value) : null);
                        } catch (parseError) {
                            console.error('Failed to parse cloud storage data:', parseError);
                            resolve(null);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Failed to get cloud storage:', error);
            return null;
        }
    }
}

// 全局Telegram集成实例
window.telegramApp = new TelegramIntegration();