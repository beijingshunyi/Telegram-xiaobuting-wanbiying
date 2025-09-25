// 每日免费游戏次数系统
class DailyAttemptsManager {
    constructor() {
        this.maxFreeAttempts = 6; // 每日免费次数
        this.currentAttempts = 0;
        this.lastResetDate = null;
        this.bonusAttempts = 0; // 通过广告/分享获得的额外次数

        this.initialize();
    }

    async initialize() {
        try {
            await this.loadDailyData();
            this.checkDailyReset();
            this.updateAttemptsDisplay();
            console.log('每日游戏次数系统初始化成功');
        } catch (error) {
            console.error('每日游戏次数系统初始化失败:', error);
        }
    }

    // 加载每日数据
    async loadDailyData() {
        try {
            const saved = localStorage.getItem('daily_attempts_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.currentAttempts = data.currentAttempts || 0;
                this.bonusAttempts = data.bonusAttempts || 0;
                this.lastResetDate = data.lastResetDate || this.getTodayString();
            } else {
                // 首次使用，给予满次数
                this.currentAttempts = this.maxFreeAttempts;
                this.bonusAttempts = 0;
                this.lastResetDate = this.getTodayString();
                await this.saveDailyData();
            }
        } catch (error) {
            console.error('加载每日数据失败:', error);
            this.resetToDefault();
        }
    }

    // 保存每日数据
    async saveDailyData() {
        try {
            const data = {
                currentAttempts: this.currentAttempts,
                bonusAttempts: this.bonusAttempts,
                lastResetDate: this.lastResetDate,
                lastSaveTime: Date.now()
            };
            localStorage.setItem('daily_attempts_data', JSON.stringify(data));
        } catch (error) {
            console.error('保存每日数据失败:', error);
        }
    }

    // 检查是否需要每日重置
    checkDailyReset() {
        const today = this.getTodayString();
        if (this.lastResetDate !== today) {
            this.resetDailyAttempts();
        }
    }

    // 重置每日次数
    resetDailyAttempts() {
        this.currentAttempts = this.maxFreeAttempts;
        this.bonusAttempts = 0;
        this.lastResetDate = this.getTodayString();
        this.saveDailyData();

        console.log('每日游戏次数已重置');
        if (window.uiManager) {
            window.uiManager.showNotification('🎮 每日游戏次数已重置！', 'success');
        }
    }

    // 获取今日字符串
    getTodayString() {
        const now = new Date();
        return now.getFullYear() + '-' +
               (now.getMonth() + 1).toString().padStart(2, '0') + '-' +
               now.getDate().toString().padStart(2, '0');
    }

    // 检查是否有足够的游戏次数
    hasAttempts() {
        return this.getTotalAttempts() > 0;
    }

    // 获取总次数
    getTotalAttempts() {
        return this.currentAttempts + this.bonusAttempts;
    }

    // 消耗一次游戏次数
    async consumeAttempt() {
        if (!this.hasAttempts()) {
            throw new Error('游戏次数不足');
        }

        if (this.currentAttempts > 0) {
            this.currentAttempts--;
        } else if (this.bonusAttempts > 0) {
            this.bonusAttempts--;
        }

        await this.saveDailyData();
        this.updateAttemptsDisplay();

        console.log(`消耗一次游戏次数，剩余: ${this.getTotalAttempts()}`);
    }

    // 通过观看广告获得次数
    async earnAttemptsFromAd() {
        const rewardAttempts = 2; // 每次广告奖励2次

        try {
            // 这里应该调用广告API
            const adWatched = await this.showRewardedAd();

            if (adWatched) {
                this.bonusAttempts += rewardAttempts;
                await this.saveDailyData();
                this.updateAttemptsDisplay();

                if (window.uiManager) {
                    window.uiManager.showNotification(
                        `🎁 获得 ${rewardAttempts} 次游戏机会！`,
                        'success',
                        3000
                    );
                }

                return true;
            }
        } catch (error) {
            console.error('观看广告获得次数失败:', error);
            if (window.uiManager) {
                window.uiManager.showNotification('广告加载失败，请稍后重试', 'error');
            }
        }

        return false;
    }

    // 通过分享获得次数
    async earnAttemptsFromShare() {
        const rewardAttempts = 1; // 每次分享奖励1次
        const maxDailyShares = 3; // 每日最多分享3次获得奖励

        try {
            const sharesUsed = this.getSharesUsedToday();
            if (sharesUsed >= maxDailyShares) {
                if (window.uiManager) {
                    window.uiManager.showNotification('今日分享次数已用完', 'warning');
                }
                return false;
            }

            // 调用分享功能
            if (window.socialManager) {
                await window.socialManager.shareGeneric();
            }

            this.bonusAttempts += rewardAttempts;
            this.incrementSharesUsed();
            await this.saveDailyData();
            this.updateAttemptsDisplay();

            if (window.uiManager) {
                window.uiManager.showNotification(
                    `📤 分享成功！获得 ${rewardAttempts} 次游戏机会！`,
                    'success',
                    3000
                );
            }

            return true;
        } catch (error) {
            console.error('分享获得次数失败:', error);
            if (window.uiManager) {
                window.uiManager.showNotification('分享失败，请稍后重试', 'error');
            }
        }

        return false;
    }

    // 通过邀请好友获得次数
    async earnAttemptsFromInvite(friendsCount) {
        const rewardPerFriend = 3; // 每个好友奖励3次
        const totalReward = friendsCount * rewardPerFriend;

        if (totalReward > 0) {
            this.bonusAttempts += totalReward;
            await this.saveDailyData();
            this.updateAttemptsDisplay();

            if (window.uiManager) {
                window.uiManager.showNotification(
                    `👥 邀请好友成功！获得 ${totalReward} 次游戏机会！`,
                    'success',
                    3000
                );
            }

            return true;
        }

        return false;
    }

    // 显示次数不足弹窗
    showInsufficientAttemptsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'insufficient-attempts-modal';

        const remainingTime = this.getTimeUntilReset();

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎮 游戏次数不足</h3>
                </div>
                <div class="modal-body">
                    <div class="attempts-info">
                        <div class="attempts-icon">🎯</div>
                        <div class="attempts-text">
                            <p>今日免费游戏次数已用完</p>
                            <p class="reset-time">距离重置还有: ${remainingTime}</p>
                        </div>
                    </div>

                    <div class="earn-attempts-options">
                        <h4>获得更多游戏次数:</h4>

                        <button class="earn-btn ad-btn" onclick="window.dailyAttemptsManager.earnAttemptsFromAd()">
                            <div class="earn-icon">📺</div>
                            <div class="earn-info">
                                <div class="earn-title">观看广告</div>
                                <div class="earn-desc">获得2次游戏机会</div>
                            </div>
                        </button>

                        <button class="earn-btn share-btn" onclick="window.dailyAttemptsManager.earnAttemptsFromShare()">
                            <div class="earn-icon">📤</div>
                            <div class="earn-info">
                                <div class="earn-title">分享游戏</div>
                                <div class="earn-desc">获得1次游戏机会 (今日${3 - this.getSharesUsedToday()}次机会)</div>
                            </div>
                        </button>

                        <button class="earn-btn invite-btn" onclick="window.socialManager.showInviteModal()">
                            <div class="earn-icon">👥</div>
                            <div class="earn-info">
                                <div class="earn-title">邀请好友</div>
                                <div class="earn-desc">每邀请1位好友获得3次机会</div>
                            </div>
                        </button>
                    </div>

                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                            稍后再玩
                        </button>
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

    // 获取距离重置的时间
    getTimeUntilReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const timeDiff = tomorrow.getTime() - now.getTime();
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}小时${minutes}分钟`;
    }

    // 获取今日已使用的分享次数
    getSharesUsedToday() {
        const key = `shares_used_${this.getTodayString()}`;
        return parseInt(localStorage.getItem(key) || '0');
    }

    // 增加分享使用次数
    incrementSharesUsed() {
        const key = `shares_used_${this.getTodayString()}`;
        const used = this.getSharesUsedToday() + 1;
        localStorage.setItem(key, used.toString());
    }

    // 更新次数显示
    updateAttemptsDisplay() {
        const totalAttempts = this.getTotalAttempts();

        // 更新主界面显示
        const attemptsElement = document.getElementById('daily-attempts');
        if (attemptsElement) {
            attemptsElement.textContent = totalAttempts;
        }

        // 更新游戏按钮状态
        const gameButtons = document.querySelectorAll('.game-mode-btn');
        gameButtons.forEach(button => {
            if (totalAttempts <= 0) {
                button.classList.add('disabled');
                button.style.opacity = '0.6';
            } else {
                button.classList.remove('disabled');
                button.style.opacity = '1';
            }
        });

        // 如果次数不足，显示警告徽章
        const warningBadge = document.getElementById('attempts-warning');
        if (warningBadge) {
            if (totalAttempts <= 0) {
                warningBadge.style.display = 'block';
            } else {
                warningBadge.style.display = 'none';
            }
        }
    }

    // 模拟广告观看
    async showRewardedAd() {
        return new Promise((resolve) => {
            // 这里应该调用真实的广告SDK
            if (window.adsManager && window.adsManager.isAdMobLoaded) {
                // 调用AdMob激励广告
                console.log('显示激励广告...');
                // 模拟广告观看
                setTimeout(() => resolve(true), 2000);
            } else {
                // 降级方案：确认对话框
                const confirmed = confirm('观看广告获得2次游戏机会？\n（这是模拟广告）');
                setTimeout(() => resolve(confirmed), 500);
            }
        });
    }

    // 重置为默认值
    resetToDefault() {
        this.currentAttempts = this.maxFreeAttempts;
        this.bonusAttempts = 0;
        this.lastResetDate = this.getTodayString();
    }

    // 获取系统状态
    getStatus() {
        return {
            totalAttempts: this.getTotalAttempts(),
            freeAttempts: this.currentAttempts,
            bonusAttempts: this.bonusAttempts,
            maxFreeAttempts: this.maxFreeAttempts,
            lastResetDate: this.lastResetDate,
            sharesUsedToday: this.getSharesUsedToday(),
            timeUntilReset: this.getTimeUntilReset()
        };
    }
}

// 创建全局实例
window.dailyAttemptsManager = new DailyAttemptsManager();

// CSS样式
const style = document.createElement('style');
style.textContent = `
    .attempts-info {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: var(--border-radius-lg);
        color: white;
        margin-bottom: 20px;
    }

    .attempts-icon {
        font-size: 48px;
    }

    .attempts-text {
        flex: 1;
    }

    .reset-time {
        font-size: 14px;
        opacity: 0.9;
        margin-top: 5px;
    }

    .earn-attempts-options {
        margin-bottom: 20px;
    }

    .earn-attempts-options h4 {
        margin: 0 0 15px 0;
        color: var(--text-primary);
        font-size: 16px;
    }

    .earn-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        margin-bottom: 10px;
        border: 2px solid #e9ecef;
        border-radius: var(--border-radius-lg);
        background: white;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .earn-btn:hover {
        border-color: var(--cute-gradient);
        transform: translateY(-2px);
        box-shadow: var(--hover-shadow);
    }

    .earn-icon {
        font-size: 32px;
        width: 50px;
        text-align: center;
    }

    .earn-info {
        flex: 1;
        text-align: left;
    }

    .earn-title {
        font-size: 16px;
        font-weight: bold;
        color: var(--text-primary);
        margin-bottom: 3px;
    }

    .earn-desc {
        font-size: 14px;
        color: var(--text-secondary);
    }

    .game-mode-btn.disabled {
        pointer-events: none;
        filter: grayscale(0.5);
    }

    .attempts-display {
        background: rgba(255, 215, 0, 0.2);
        border: 2px solid #FFD700;
        border-radius: var(--border-radius-md);
        padding: 8px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-white);
        font-weight: 600;
        margin-bottom: 10px;
    }

    .attempts-display::before {
        content: '🎮';
        font-size: 18px;
    }

    #attempts-warning {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #FF4757;
        color: white;
        font-size: 10px;
        font-weight: bold;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        display: none;
        align-items: center;
        justify-content: center;
        animation: pulse 1s infinite;
    }
`;
document.head.appendChild(style);