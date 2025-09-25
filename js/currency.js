// 万花币管理器
class CurrencyManager {
    constructor() {
        this.coinCount = 0;
        this.dailyBonus = CONFIG.CURRENCY.DAILY_BONUS;
    }

    // 添加万花币
    async addCoins(amount, reason = '') {
        this.coinCount += amount;
        this.updateCoinDisplay();

        // 播放金币音效
        const coinSound = document.getElementById('coin-sound');
        if (coinSound) {
            coinSound.play().catch(e => console.log('无法播放音效:', e));
        }

        // 显示获得金币动画
        this.showCoinAnimation(amount);

        console.log(`获得 ${amount} 万花币: ${reason}`);
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
`;
document.head.appendChild(style);