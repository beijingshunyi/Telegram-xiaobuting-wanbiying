// 万花币管理器
class CurrencyManager {
    constructor() {
        this.coinCount = 0;
        this.dailyBonus = CONFIG.CURRENCY.DAILY_BONUS;
        this.monthlyEarnings = 0;
        this.lastMonthlyReset = null;
        this.userType = 'regular'; // regular or vip
        this.consecutiveLoginDays = 0;

        this.initialize();
    }

    async initialize() {
        await this.loadMonthlyData();
        this.checkMonthlyReset();
        this.updateUserType();
    }

    // 加载月度数据
    async loadMonthlyData() {
        try {
            const savedData = localStorage.getItem('monthly_earnings_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.monthlyEarnings = data.monthlyEarnings || 0;
                this.lastMonthlyReset = data.lastMonthlyReset || this.getCurrentMonth();
                this.consecutiveLoginDays = data.consecutiveLoginDays || 0;
            } else {
                this.resetMonthlyData();
            }
        } catch (error) {
            console.error('加载月度数据失败:', error);
            this.resetMonthlyData();
        }
    }

    // 保存月度数据
    async saveMonthlyData() {
        try {
            const data = {
                monthlyEarnings: this.monthlyEarnings,
                lastMonthlyReset: this.lastMonthlyReset,
                consecutiveLoginDays: this.consecutiveLoginDays,
                lastSaveTime: Date.now()
            };
            localStorage.setItem('monthly_earnings_data', JSON.stringify(data));
        } catch (error) {
            console.error('保存月度数据失败:', error);
        }
    }

    // 检查月度重置
    checkMonthlyReset() {
        const currentMonth = this.getCurrentMonth();
        if (this.lastMonthlyReset !== currentMonth) {
            this.resetMonthlyData();
        }
    }

    // 获取当前月份字符串
    getCurrentMonth() {
        const now = new Date();
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    // 重置月度数据
    resetMonthlyData() {
        this.monthlyEarnings = 0;
        this.lastMonthlyReset = this.getCurrentMonth();
        this.saveMonthlyData();
        console.log('月度数据已重置');
    }

    // 更新用户类型
    updateUserType() {
        if (this.consecutiveLoginDays >= CONFIG.CURRENCY.MONTHLY_LIMITS.VIP_THRESHOLD) {
            this.userType = 'vip';
        } else {
            this.userType = 'regular';
        }
    }

    // 获取月度限制
    getMonthlyLimit() {
        return this.userType === 'vip'
            ? CONFIG.CURRENCY.MONTHLY_LIMITS.VIP_USER
            : CONFIG.CURRENCY.MONTHLY_LIMITS.REGULAR_USER;
    }

    // 检查是否可以获得万花币
    canEarnCoins(amount) {
        const monthlyLimit = this.getMonthlyLimit();
        return (this.monthlyEarnings + amount) <= monthlyLimit;
    }

    // 获取剩余可获得的万花币
    getRemainingMonthlyCoins() {
        const monthlyLimit = this.getMonthlyLimit();
        return Math.max(0, monthlyLimit - this.monthlyEarnings);
    }

    // 添加万花币
    async addCoins(amount, reason = '') {
        // 应用月度限制
        const actualAmount = Math.min(amount, this.getRemainingMonthlyCoins());

        if (actualAmount <= 0) {
            console.log(`月度限制：无法获得 ${amount} 万花币 (${reason})`);
            this.showMonthlyLimitNotification();
            return actualAmount;
        }

        // 如果实际获得的少于请求的，显示限制提示
        if (actualAmount < amount) {
            this.showPartialLimitNotification(actualAmount, amount);
        }

        this.coinCount += actualAmount;
        this.monthlyEarnings += actualAmount;
        await this.saveMonthlyData();
        this.updateCoinDisplay();

        // 播放金币音效
        const coinSound = document.getElementById('coin-sound');
        if (coinSound) {
            coinSound.play().catch(e => console.log('无法播放音效:', e));
        }

        // 显示获得金币动画
        this.showCoinAnimation(actualAmount);

        console.log(`获得 ${actualAmount} 万花币: ${reason} (月度总计: ${this.monthlyEarnings}/${this.getMonthlyLimit()})`);
        return actualAmount;
    }

    // 显示月度限制通知
    showMonthlyLimitNotification() {
        const userTypeName = this.userType === 'vip' ? '资深用户' : '普通用户';
        const message = `🚫 本月${userTypeName}万花币已达上限 ${this.getMonthlyLimit()}枚`;

        if (window.uiManager) {
            window.uiManager.showNotification(message, 'warning', 3000);
        } else {
            console.warn(message);
        }
    }

    // 显示部分限制通知
    showPartialLimitNotification(actualAmount, requestedAmount) {
        const message = `⚠️ 受月度限制影响，仅获得 ${actualAmount} 万花币 (原本 ${requestedAmount})`;

        if (window.uiManager) {
            window.uiManager.showNotification(message, 'info', 3000);
        }
    }

    // 扣除万花币
    async spendCoins(amount, reason = '') {
        if (this.coinCount < amount) {
            throw new Error('万花币不足');
        }

        this.coinCount -= amount;
        this.updateCoinDisplay();
        console.log(`消费 ${amount} 万花币: ${reason}`);
    }

    // 更新币数显示
    updateCoinDisplay() {
        const coinCountElement = document.getElementById('coin-count');
        if (coinCountElement) {
            coinCountElement.textContent = this.coinCount.toLocaleString();
        }
    }

    // 显示获得金币动画
    showCoinAnimation(amount) {
        const coinElement = document.getElementById('coin-count');
        if (!coinElement) return;

        const animation = document.createElement('div');
        animation.className = 'coin-animation';
        animation.textContent = `+${amount}`;
        animation.style.cssText = `
            position: absolute;
            color: #ffd700;
            font-weight: bold;
            font-size: 16px;
            pointer-events: none;
            z-index: 1000;
            animation: coinFloat 2s ease-out forwards;
        `;

        const rect = coinElement.getBoundingClientRect();
        animation.style.left = rect.left + 'px';
        animation.style.top = rect.top + 'px';

        document.body.appendChild(animation);

        setTimeout(() => {
            if (animation.parentNode) {
                animation.parentNode.removeChild(animation);
            }
        }, 2000);
    }

    // 获取当前万花币数量
    getBalance() {
        return this.coinCount;
    }

    // 设置万花币数量
    setBalance(amount) {
        this.coinCount = Math.max(0, amount);
        this.updateCoinDisplay();
    }

    // 检查是否有足够的万花币
    hasEnough(amount) {
        return this.coinCount >= amount;
    }

    // 更新连续登录天数
    updateConsecutiveLoginDays(days) {
        this.consecutiveLoginDays = days;
        this.updateUserType();
        this.saveMonthlyData();
    }

    // 获取用户状态信息
    getUserStatus() {
        return {
            coinCount: this.coinCount,
            monthlyEarnings: this.monthlyEarnings,
            monthlyLimit: this.getMonthlyLimit(),
            remainingCoins: this.getRemainingMonthlyCoins(),
            userType: this.userType,
            consecutiveLoginDays: this.consecutiveLoginDays,
            vipThreshold: CONFIG.CURRENCY.MONTHLY_LIMITS.VIP_THRESHOLD
        };
    }

    // 应用平衡调整的奖励计算
    calculateBalancedReward(baseAmount, source) {
        const sourceWeights = CONFIG.CURRENCY.EARNING_SOURCES;
        let multiplier = 1;

        switch (source) {
            case 'signin':
                multiplier = sourceWeights.DAILY_SIGNIN;
                break;
            case 'game':
                multiplier = sourceWeights.GAME_REWARDS;
                break;
            case 'achievement':
                multiplier = sourceWeights.ACHIEVEMENTS;
                break;
            case 'social':
                multiplier = sourceWeights.SOCIAL;
                break;
            default:
                multiplier = 1;
        }

        // 应用VIP用户倍数
        if (this.userType === 'vip' && source === 'signin') {
            multiplier *= CONFIG.CURRENCY.DAILY_BONUS.VIP_MULTIPLIER;
        }

        return Math.floor(baseAmount * multiplier);
    }

    // 显示月度统计模态框
    showMonthlyStatsModal() {
        const stats = this.getUserStatus();
        const progressPercent = (stats.monthlyEarnings / stats.monthlyLimit) * 100;

        const content = `
            <div class="modal-header">
                <h2>💰 万花币月度统计</h2>
            </div>
                <div class="modal-body">
                    <div class="stats-container">
                        <div class="user-type-info">
                            <h3>${stats.userType === 'vip' ? '🌟 资深用户' : '👤 普通用户'}</h3>
                            <p>${stats.userType === 'vip'
                                ? '连续登录30天以上，享受专属福利！'
                                : `连续登录${stats.vipThreshold}天可成为资深用户`}</p>
                        </div>

                        <div class="progress-section">
                            <div class="progress-header">
                                <span>本月已获得: ${stats.monthlyEarnings.toLocaleString()} 万花币</span>
                                <span>上限: ${stats.monthlyLimit.toLocaleString()} 万花币</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <div class="remaining-info">
                                <p>剩余可获得: <strong>${stats.remainingCoins.toLocaleString()} 万花币</strong></p>
                            </div>
                        </div>

                        <div class="earning-sources">
                            <h4>万花币来源分配:</h4>
                            <div class="sources-grid">
                                <div class="source-item">
                                    <span class="source-icon">📅</span>
                                    <span class="source-name">每日签到</span>
                                    <span class="source-weight">${(CONFIG.CURRENCY.EARNING_SOURCES.DAILY_SIGNIN * 100)}%</span>
                                </div>
                                <div class="source-item">
                                    <span class="source-icon">🎮</span>
                                    <span class="source-name">游戏奖励</span>
                                    <span class="source-weight">${(CONFIG.CURRENCY.EARNING_SOURCES.GAME_REWARDS * 100)}%</span>
                                </div>
                                <div class="source-item">
                                    <span class="source-icon">🏆</span>
                                    <span class="source-name">成就系统</span>
                                    <span class="source-weight">${(CONFIG.CURRENCY.EARNING_SOURCES.ACHIEVEMENTS * 100)}%</span>
                                </div>
                                <div class="source-item">
                                    <span class="source-icon">👥</span>
                                    <span class="source-name">社交活动</span>
                                    <span class="source-weight">${(CONFIG.CURRENCY.EARNING_SOURCES.SOCIAL * 100)}%</span>
                                </div>
                            </div>
                        </div>

                        <div class="tips-section">
                            <h4>💡 获币小贴士:</h4>
                            <ul>
                                <li>每日签到是主要来源，坚持签到最重要</li>
                                <li>连续登录${stats.vipThreshold}天成为资深用户，享受更高奖励</li>
                                <li>完成游戏成就可获得额外奖励</li>
                                <li>邀请好友参与社交活动也能获得万花币</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return window.modalManager.show(content, { closable: true, closeOnBackdrop: true });
    }
}

// 创建全局实例
window.currencyManager = new CurrencyManager();

// CSS动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes coinFloat {
        0% {
            transform: translateY(0);
            opacity: 1;
        }
        100% {
            transform: translateY(-50px);
            opacity: 0;
        }
    }

    .stats-container {
        padding: 1rem;
    }

    .user-type-info {
        text-align: center;
        padding: 1rem;
        border-radius: var(--border-radius-lg);
        margin-bottom: 1.5rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .progress-section {
        margin-bottom: 1.5rem;
    }

    .progress-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        color: #666;
    }

    .progress-bar {
        width: 100%;
        height: 20px;
        background: #f1f3f4;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        transition: width 0.3s ease;
    }

    .remaining-info {
        text-align: center;
        color: #333;
    }

    .earning-sources {
        margin-bottom: 1.5rem;
    }

    .earning-sources h4 {
        margin-bottom: 1rem;
        color: #333;
    }

    .sources-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
    }

    .source-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.8rem;
        background: #f8f9fa;
        border-radius: var(--border-radius-md);
        border: 2px solid #e9ecef;
    }

    .source-icon {
        font-size: 1.2rem;
    }

    .source-name {
        flex: 1;
        font-size: 0.9rem;
        color: #333;
    }

    .source-weight {
        font-weight: bold;
        color: #667eea;
    }

    .tips-section {
        background: #e8f4f8;
        padding: 1rem;
        border-radius: var(--border-radius-lg);
    }

    .tips-section h4 {
        margin-bottom: 0.8rem;
        color: #2d3436;
    }

    .tips-section ul {
        margin: 0;
        padding-left: 1.2rem;
        color: #636e72;
    }

    .tips-section li {
        margin-bottom: 0.3rem;
        line-height: 1.4;
    }

    @media (max-width: 480px) {
        .sources-grid {
            grid-template-columns: 1fr;
        }

        .progress-header {
            flex-direction: column;
            gap: 0.3rem;
        }
    }
`;
document.head.appendChild(style);