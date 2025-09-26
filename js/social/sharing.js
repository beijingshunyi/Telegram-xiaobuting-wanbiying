/**
 * 社交分享管理器
 * 负责处理游戏内容分享到各个平台
 */

class SharingManager {
    constructor() {
        this.gameTitle = '消不停·万币赢';
        this.gameDescription = '像素级复刻天天爱消除，万花币等你来赢！';
        this.gameUrl = window.location.href;
        this.initialized = false;

        console.log('🔗 SharingManager initialized');
    }

    // 初始化分享管理器
    initialize() {
        if (this.initialized) return;

        this.bindEvents();
        this.initialized = true;

        console.log('✅ Sharing manager initialized');
    }

    // 绑定分享事件
    bindEvents() {
        // 分享按钮事件
        document.addEventListener('click', (event) => {
            const target = event.target;

            if (target.matches('.share-telegram')) {
                this.shareToTelegram();
            } else if (target.matches('.share-wechat')) {
                this.shareToWeChat();
            } else if (target.matches('.share-qq')) {
                this.shareToQQ();
            } else if (target.matches('.share-weibo')) {
                this.shareToWeibo();
            } else if (target.matches('.share-link')) {
                this.copyGameLink();
            } else if (target.matches('.share-score')) {
                this.shareScore();
            } else if (target.matches('.share-achievement')) {
                this.shareAchievement(target.dataset.achievement);
            }
        });
    }

    // 分享到Telegram
    shareToTelegram(customMessage = '') {
        try {
            const message = customMessage || this.getDefaultShareMessage();

            // 如果在Telegram WebApp中
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(this.gameUrl)}&text=${encodeURIComponent(message)}`);
            } else {
                // 直接打开Telegram分享链接
                const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(this.gameUrl)}&text=${encodeURIComponent(message)}`;
                window.open(shareUrl, '_blank');
            }

            this.trackShare('telegram');
            console.log('📱 Shared to Telegram');

        } catch (error) {
            console.error('❌ Failed to share to Telegram:', error);
            this.fallbackShare();
        }
    }

    // 分享到微信
    shareToWeChat() {
        try {
            // 检查是否在微信内
            if (this.isWeChat()) {
                this.showWeChatShareGuide();
            } else {
                // 复制链接并提示用户
                this.copyGameLink();
                if (window.modalManager) {
                    window.modalManager.showAlert({
                        title: '分享到微信',
                        message: '链接已复制到剪贴板，请打开微信粘贴分享！'
                    });
                }
            }

            this.trackShare('wechat');
            console.log('💬 Shared to WeChat');

        } catch (error) {
            console.error('❌ Failed to share to WeChat:', error);
            this.fallbackShare();
        }
    }

    // 分享到QQ
    shareToQQ() {
        try {
            const message = this.getDefaultShareMessage();
            const shareUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(this.gameUrl)}&title=${encodeURIComponent(this.gameTitle)}&summary=${encodeURIComponent(message)}`;

            window.open(shareUrl, '_blank', 'width=600,height=400');
            this.trackShare('qq');
            console.log('🐧 Shared to QQ');

        } catch (error) {
            console.error('❌ Failed to share to QQ:', error);
            this.fallbackShare();
        }
    }

    // 分享到微博
    shareToWeibo() {
        try {
            const message = this.getDefaultShareMessage();
            const shareUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(this.gameUrl)}&title=${encodeURIComponent(message)}`;

            window.open(shareUrl, '_blank', 'width=600,height=400');
            this.trackShare('weibo');
            console.log('📰 Shared to Weibo');

        } catch (error) {
            console.error('❌ Failed to share to Weibo:', error);
            this.fallbackShare();
        }
    }

    // 复制游戏链接
    copyGameLink() {
        try {
            // 尝试使用现代API
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(this.gameUrl).then(() => {
                    this.showCopySuccess();
                }).catch(() => {
                    this.fallbackCopy();
                });
            } else {
                this.fallbackCopy();
            }

            this.trackShare('copy_link');

        } catch (error) {
            console.error('❌ Failed to copy link:', error);
            this.showCopyError();
        }
    }

    // 降级复制方法
    fallbackCopy() {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = this.gameUrl;
            textArea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
            document.body.appendChild(textArea);
            textArea.select();
            textArea.setSelectionRange(0, 99999);

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                this.showCopySuccess();
            } else {
                this.showCopyError();
            }

        } catch (error) {
            console.error('❌ Fallback copy failed:', error);
            this.showCopyError();
        }
    }

    // 分享分数
    shareScore() {
        try {
            const gameInfo = window.gameEngine?.getGameInfo() || {};
            const score = gameInfo.score || 0;
            const level = gameInfo.level || 1;
            const combo = gameInfo.maxCombo || 0;

            const message = `🎮 我在《${this.gameTitle}》中获得了 ${score} 分！\n` +
                          `🎯 当前关卡：第 ${level} 关\n` +
                          `🔥 最高连击：${combo} 连击\n` +
                          `💰 快来一起赚万花币吧！\n${this.gameUrl}`;

            // 根据平台选择分享方式
            if (window.Telegram?.WebApp) {
                this.shareToTelegram(message);
            } else {
                this.showShareOptions(message);
            }

            this.trackShare('score');
            console.log('🎯 Score shared');

        } catch (error) {
            console.error('❌ Failed to share score:', error);
        }
    }

    // 分享成就
    shareAchievement(achievement) {
        try {
            const achievements = {
                'first_win': '🏆 获得了第一次胜利',
                'combo_master': '🔥 连击大师',
                'coin_collector': '💰 万花币收集者',
                'level_complete': '🎯 关卡完成',
                'daily_player': '📅 每日玩家',
                'social_star': '⭐ 社交明星'
            };

            const achievementText = achievements[achievement] || '🎉 完成了新成就';
            const message = `🎮 我在《${this.gameTitle}》中${achievementText}！\n` +
                          `💰 快来一起赚万花币吧！\n${this.gameUrl}`;

            if (window.Telegram?.WebApp) {
                this.shareToTelegram(message);
            } else {
                this.showShareOptions(message);
            }

            this.trackShare('achievement');
            console.log(`🏆 Achievement shared: ${achievement}`);

        } catch (error) {
            console.error('❌ Failed to share achievement:', error);
        }
    }

    // 显示分享选项
    showShareOptions(customMessage = '') {
        if (!window.modalManager) {
            this.fallbackShare();
            return;
        }

        const message = customMessage || this.getDefaultShareMessage();

        window.modalManager.showAlert({
            title: '选择分享方式',
            message: `
                <div class="share-options">
                    <button class="btn share-telegram">📱 Telegram</button>
                    <button class="btn share-wechat">💬 微信</button>
                    <button class="btn share-qq">🐧 QQ</button>
                    <button class="btn share-weibo">📰 微博</button>
                    <button class="btn share-link">🔗 复制链接</button>
                </div>
                <div class="share-preview">
                    <p>${message}</p>
                </div>
            `,
            buttonText: '取消'
        });
    }

    // 显示微信分享指引
    showWeChatShareGuide() {
        if (window.modalManager) {
            window.modalManager.showAlert({
                title: '微信分享',
                message: '点击右上角的"..."按钮，选择"发送给朋友"或"分享到朋友圈"即可分享游戏！',
                buttonText: '知道了'
            });
        }
    }

    // 获取默认分享消息
    getDefaultShareMessage() {
        const coinBalance = window.coinSystem?.getBalance() || 0;
        return `🎮 发现了一个超好玩的消除游戏《${this.gameTitle}》！\n` +
               `💰 我已经赚了 ${coinBalance} 万花币\n` +
               `🎯 像素级复刻天天爱消除，支持提现到支付宝/USDT\n` +
               `🚀 快来一起玩吧！`;
    }

    // 降级分享方法
    fallbackShare() {
        this.copyGameLink();

        if (window.modalManager) {
            window.modalManager.showAlert({
                title: '分享游戏',
                message: '游戏链接已复制到剪贴板，请粘贴到您想分享的平台！',
                buttonText: '知道了'
            });
        }
    }

    // 显示复制成功
    showCopySuccess() {
        if (window.modalManager) {
            window.modalManager.showAlert({
                title: '复制成功',
                message: '游戏链接已复制到剪贴板！',
                buttonText: '好的'
            });
        }

        if (window.audioManager) {
            window.audioManager.playSuccessSound();
        }
    }

    // 显示复制错误
    showCopyError() {
        if (window.modalManager) {
            window.modalManager.showAlert({
                title: '复制失败',
                message: `请手动复制以下链接：\n${this.gameUrl}`,
                buttonText: '知道了'
            });
        }

        if (window.audioManager) {
            window.audioManager.playErrorSound();
        }
    }

    // 检查是否在微信中
    isWeChat() {
        return /micromessenger/i.test(navigator.userAgent);
    }

    // 检查是否在QQ中
    isQQ() {
        return /qq\//i.test(navigator.userAgent);
    }

    // 检查是否在微博中
    isWeibo() {
        return /weibo/i.test(navigator.userAgent);
    }

    // 分享统计
    trackShare(platform) {
        try {
            // 记录分享统计
            const shareData = window.storageManager?.getItem('share_stats', {}) || {};
            shareData[platform] = (shareData[platform] || 0) + 1;
            shareData.total = (shareData.total || 0) + 1;
            shareData.lastShare = Date.now();

            window.storageManager?.setItem('share_stats', shareData);

            // 分享奖励
            if (window.coinSystem && shareData.total <= 10) {
                const reward = 50; // 前10次分享每次奖励50万花币
                window.coinSystem.earnCoins(reward, '分享游戏奖励');

                if (window.modalManager) {
                    window.modalManager.showAlert({
                        title: '分享奖励',
                        message: `感谢分享游戏！获得 ${reward} 万花币奖励！`,
                        buttonText: '太棒了'
                    });
                }
            }

            console.log(`📊 Share tracked: ${platform}, total: ${shareData.total}`);

        } catch (error) {
            console.error('❌ Failed to track share:', error);
        }
    }

    // 获取分享统计
    getShareStats() {
        return window.storageManager?.getItem('share_stats', {}) || {};
    }

    // 生成邀请链接
    generateInviteLink(userId) {
        const baseUrl = this.gameUrl.split('?')[0];
        return `${baseUrl}?invite=${userId}&utm_source=invite&utm_medium=social`;
    }

    // 分享邀请
    shareInvite() {
        try {
            const userId = window.coinSystem?.getUserId() || 'anonymous';
            const inviteUrl = this.generateInviteLink(userId);

            const message = `🎮 我正在玩《${this.gameTitle}》赚万花币！\n` +
                          `💰 通过我的邀请链接注册，我们都能获得奖励万花币！\n` +
                          `🎯 像素级复刻天天爱消除，支持提现到支付宝/USDT\n` +
                          `🔗 点击链接立即开始：${inviteUrl}`;

            if (window.Telegram?.WebApp) {
                this.shareToTelegram(message);
            } else {
                // 复制邀请链接
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(inviteUrl);
                }

                this.showShareOptions(message);
            }

            this.trackShare('invite');
            console.log('🎁 Invite shared');

        } catch (error) {
            console.error('❌ Failed to share invite:', error);
        }
    }

    // 处理邀请链接
    handleInviteLink() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const inviteUserId = urlParams.get('invite');

            if (inviteUserId && window.coinSystem) {
                // 给邀请者奖励
                const inviteData = window.storageManager?.getItem('invite_data', {
                    invitedBy: null,
                    inviteCount: 0,
                    hasReceivedInviteReward: false
                }) || {};

                if (!inviteData.hasReceivedInviteReward) {
                    inviteData.invitedBy = inviteUserId;
                    inviteData.hasReceivedInviteReward = true;

                    // 新用户奖励
                    window.coinSystem.earnCoins(100, '邀请新用户奖励');

                    window.storageManager?.setItem('invite_data', inviteData);

                    console.log(`🎁 Invite reward processed for user: ${inviteUserId}`);
                }
            }

        } catch (error) {
            console.error('❌ Failed to handle invite link:', error);
        }
    }
}

// 创建全局实例
window.sharingManager = new SharingManager();

// 页面加载时处理邀请链接
document.addEventListener('DOMContentLoaded', () => {
    window.sharingManager.initialize();
    window.sharingManager.handleInviteLink();
});

console.log('🔗 Sharing utilities loaded');