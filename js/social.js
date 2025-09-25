// 社交奖励管理器
class SocialManager {
    constructor() {
        this.shareCount = 0;
        this.inviteCount = 0;
        this.dailyShareLimit = CONFIG.SOCIAL.SHARE_DAILY_LIMIT;
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadSocialData();
            this.setupEventListeners();
            console.log('社交系统初始化成功');
        } catch (error) {
            console.error('社交系统初始化失败:', error);
        }
    }

    // 加载社交数据
    async loadSocialData() {
        try {
            const saved = localStorage.getItem('social_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.shareCount = data.shareCount || 0;
                this.inviteCount = data.inviteCount || 0;
            }
        } catch (error) {
            console.error('加载社交数据失败:', error);
        }
    }

    // 保存社交数据
    async saveSocialData() {
        try {
            const data = {
                shareCount: this.shareCount,
                inviteCount: this.inviteCount,
                lastSaveTime: Date.now()
            };
            localStorage.setItem('social_data', JSON.stringify(data));
        } catch (error) {
            console.error('保存社交数据失败:', error);
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        const inviteBtn = document.getElementById('invite-friends');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', () => this.showInviteModal());
        }

        // 监听分享事件
        document.addEventListener('share-game', () => this.handleShare());
    }

    // 显示邀请模态框
    showInviteModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'invite-modal';

        const inviteLink = this.generateInviteLink();
        const inviteCode = this.generateInviteCode();

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>👥 邀请好友</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="invite-stats">
                        <div class="stat-item">
                            <div class="stat-number">${this.inviteCount}</div>
                            <div class="stat-label">已邀请好友</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-number">${CONFIG.SOCIAL.INVITE_REWARD}</div>
                            <div class="stat-label">每人奖励万花币</div>
                        </div>
                    </div>

                    <div class="invite-methods">
                        <div class="method-section">
                            <h4>🔗 邀请链接</h4>
                            <div class="link-container">
                                <input type="text" id="invite-link" value="${inviteLink}" readonly>
                                <button class="copy-btn" onclick="window.socialManager.copyInviteLink()">复制</button>
                            </div>
                        </div>

                        <div class="method-section">
                            <h4>🎯 邀请码</h4>
                            <div class="code-container">
                                <span class="invite-code">${inviteCode}</span>
                                <button class="copy-btn" onclick="window.socialManager.copyInviteCode('${inviteCode}')">复制</button>
                            </div>
                        </div>

                        <div class="share-buttons">
                            <button class="share-btn telegram" onclick="window.socialManager.shareToTelegram()">
                                <span class="share-icon">📱</span>
                                分享到Telegram
                            </button>
                            <button class="share-btn generic" onclick="window.socialManager.shareGeneric()">
                                <span class="share-icon">📤</span>
                                其他分享方式
                            </button>
                        </div>
                    </div>

                    <div class="invite-rules">
                        <h4>📋 邀请规则</h4>
                        <ul>
                            <li>好友需要完成${CONFIG.SOCIAL.INVITE_REQUIREMENT}关才能获得奖励</li>
                            <li>每成功邀请1位好友获得${CONFIG.SOCIAL.INVITE_REWARD}万花币</li>
                            <li>好友每日活跃可获得${CONFIG.SOCIAL.DAILY_ACTIVE_REWARD}万花币</li>
                            <li>邀请越多，奖励越多！</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // 生成邀请链接
    generateInviteLink() {
        const baseUrl = CONFIG.TELEGRAM.SHARE_URL;
        const inviteCode = this.generateInviteCode();
        return `${baseUrl}?startapp=invite_${inviteCode}`;
    }

    // 生成邀请码
    generateInviteCode() {
        const userId = window.userManager?.currentUser?.id || 'guest';
        return `INV${userId}${Date.now().toString(36).toUpperCase()}`.slice(0, 12);
    }

    // 复制邀请链接
    async copyInviteLink() {
        const linkInput = document.getElementById('invite-link');
        try {
            await navigator.clipboard.writeText(linkInput.value);
            window.uiManager.showNotification('邀请链接已复制到剪贴板！', 'success');
        } catch (error) {
            // 降级方案
            linkInput.select();
            document.execCommand('copy');
            window.uiManager.showNotification('邀请链接已复制！', 'success');
        }
    }

    // 复制邀请码
    async copyInviteCode(code) {
        try {
            await navigator.clipboard.writeText(code);
            window.uiManager.showNotification('邀请码已复制到剪贴板！', 'success');
        } catch (error) {
            // 创建临时input元素
            const tempInput = document.createElement('input');
            tempInput.value = code;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            window.uiManager.showNotification('邀请码已复制！', 'success');
        }
    }

    // 分享到Telegram
    shareToTelegram() {
        const inviteLink = this.generateInviteLink();
        const text = `🎮 快来玩"消不停·万币赢"！每天都能赚万花币，还能提现到支付宝和USDT！\\n\\n🎁 使用我的邀请链接，我们都能获得奖励！\\n\\n${inviteLink}`;

        if (window.Telegram && window.Telegram.WebApp) {
            // 在Telegram WebApp中
            window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`);
        } else {
            // 在浏览器中
            const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(text)}`;
            window.open(telegramUrl, '_blank');
        }

        this.recordShare('telegram');
    }

    // 通用分享
    shareGeneric() {
        const inviteLink = this.generateInviteLink();
        const text = `🎮 快来玩"消不停·万币赢"！每天都能赚万花币！\\n\\n${inviteLink}`;

        if (navigator.share) {
            // 使用Web Share API
            navigator.share({
                title: '消不停·万币赢',
                text: text,
                url: inviteLink
            }).then(() => {
                this.recordShare('native');
            }).catch((error) => {
                console.error('分享失败:', error);
                this.copyInviteLink();
            });
        } else {
            // 降级到复制链接
            this.copyInviteLink();
        }
    }

    // 处理分享
    async handleShare() {
        if (this.shareCount >= this.dailyShareLimit) {
            window.uiManager.showNotification('今日分享次数已达上限！', 'warning');
            return;
        }

        try {
            // 调用API记录分享
            const response = await fetch(`${CONFIG.API.BASE_URL}/user/share`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: window.userManager?.currentUser?.id || 1,
                    timestamp: Date.now()
                })
            });

            if (response.ok) {
                const data = await response.json();

                // 增加万花币
                if (window.currencyManager) {
                    await window.currencyManager.addCoins(data.reward, '分享奖励');
                }

                this.shareCount++;
                await this.saveSocialData();

                window.uiManager.showNotification(
                    `分享成功！获得${data.reward}万花币奖励`,
                    'success'
                );
            }
        } catch (error) {
            console.error('分享处理失败:', error);
            // 本地处理
            if (window.currencyManager) {
                await window.currencyManager.addCoins(CONFIG.SOCIAL.SHARE_REWARD, '分享奖励');
            }
            this.shareCount++;
            await this.saveSocialData();
        }
    }

    // 记录分享
    recordShare(platform) {
        // 触发分享事件
        const shareEvent = new CustomEvent('share-game', {
            detail: { platform }
        });
        document.dispatchEvent(shareEvent);
    }

    // 处理邀请
    async processInvite(inviteCode) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}/invite/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inviteCode: inviteCode,
                    newUserId: window.userManager?.currentUser?.id || 1
                })
            });

            if (response.ok) {
                console.log('邀请关系建立成功');
                window.uiManager.showNotification('欢迎加入！邀请关系已建立', 'success');
            }
        } catch (error) {
            console.error('处理邀请失败:', error);
        }
    }

    // 检查邀请奖励
    async checkInviteRewards() {
        try {
            // 这里应该调用API检查是否有新的邀请奖励
            console.log('检查邀请奖励...');
        } catch (error) {
            console.error('检查邀请奖励失败:', error);
        }
    }

    // 获取分享统计
    getShareStats() {
        return {
            today: this.shareCount,
            remaining: Math.max(0, this.dailyShareLimit - this.shareCount)
        };
    }

    // 获取邀请统计
    getInviteStats() {
        return {
            total: this.inviteCount,
            reward: CONFIG.SOCIAL.INVITE_REWARD
        };
    }

    // 重置每日分享计数
    resetDailyShare() {
        this.shareCount = 0;
        this.saveSocialData();
    }
}

// 创建全局实例
window.socialManager = new SocialManager();

// CSS样式
const style = document.createElement('style');
style.textContent = `
    .invite-stats {
        display: flex;
        justify-content: space-around;
        margin-bottom: 30px;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 15px;
        color: white;
    }

    .stat-item {
        text-align: center;
    }

    .stat-number {
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 5px;
    }

    .stat-label {
        font-size: 14px;
        opacity: 0.8;
    }

    .invite-methods {
        display: flex;
        flex-direction: column;
        gap: 25px;
    }

    .method-section h4 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 16px;
    }

    .link-container, .code-container {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .link-container input {
        flex: 1;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
        background: #f8f9fa;
    }

    .invite-code {
        flex: 1;
        padding: 12px 15px;
        background: #f8f9fa;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        color: #007bff;
    }

    .copy-btn {
        padding: 12px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
    }

    .copy-btn:hover {
        background: #0056b3;
    }

    .share-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 20px;
    }

    .share-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 15px;
        border: none;
        border-radius: 10px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .share-btn.telegram {
        background: linear-gradient(135deg, #0088cc, #0066aa);
        color: white;
    }

    .share-btn.telegram:hover {
        background: linear-gradient(135deg, #0066aa, #004488);
    }

    .share-btn.generic {
        background: linear-gradient(135deg, #28a745, #20a13a);
        color: white;
    }

    .share-btn.generic:hover {
        background: linear-gradient(135deg, #20a13a, #1e7e34);
    }

    .share-icon {
        font-size: 20px;
    }

    .invite-rules {
        margin-top: 30px;
        padding: 20px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 10px;
    }

    .invite-rules h4 {
        margin: 0 0 15px 0;
        color: #856404;
        font-size: 16px;
    }

    .invite-rules ul {
        margin: 0;
        padding-left: 20px;
        color: #856404;
    }

    .invite-rules li {
        margin-bottom: 8px;
        line-height: 1.4;
    }
`;
document.head.appendChild(style);