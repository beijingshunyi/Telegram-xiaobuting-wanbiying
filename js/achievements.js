// 成就系统管理器
class AchievementsManager {
    constructor() {
        this.achievements = CONFIG.ACHIEVEMENTS;
        this.userAchievements = new Set();
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadUserAchievements();
            this.setupEventListeners();
            console.log('成就系统初始化成功');
        } catch (error) {
            console.error('成就系统初始化失败:', error);
        }
    }

    // 加载用户成就
    async loadUserAchievements() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.ACHIEVEMENTS);
            if (saved) {
                const achievementList = JSON.parse(saved);
                this.userAchievements = new Set(achievementList);
            }
        } catch (error) {
            console.error('加载成就数据失败:', error);
        }
    }

    // 保存用户成就
    async saveUserAchievements() {
        try {
            const achievementList = Array.from(this.userAchievements);
            localStorage.setItem(CONFIG.STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievementList));
        } catch (error) {
            console.error('保存成就数据失败:', error);
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        const achievementsBtn = document.getElementById('achievements-btn');
        if (achievementsBtn) {
            achievementsBtn.addEventListener('click', () => this.showAchievementsModal());
        }
    }

    // 检查并解锁成就
    async checkAchievement(achievementId, currentValue = 0) {
        // 如果已经解锁，直接返回
        if (this.userAchievements.has(achievementId)) {
            return false;
        }

        const achievement = this.achievements[achievementId.toUpperCase()];
        if (!achievement) {
            return false;
        }

        let shouldUnlock = false;

        // 根据不同类型的成就进行检查
        switch (achievementId.toLowerCase()) {
            case 'first_game':
                shouldUnlock = currentValue >= 1;
                break;
            case 'score_1000':
                shouldUnlock = currentValue >= 1000;
                break;
            case 'level_10':
                shouldUnlock = currentValue >= 10;
                break;
            case 'combo_5':
                shouldUnlock = currentValue >= 5;
                break;
            case 'daily_7':
                shouldUnlock = currentValue >= 7;
                break;
            case 'friend_5':
                shouldUnlock = currentValue >= 5;
                break;
            case 'coin_10000':
                shouldUnlock = currentValue >= 10000;
                break;
            default:
                shouldUnlock = false;
        }

        if (shouldUnlock) {
            await this.unlockAchievement(achievementId);
            return true;
        }

        return false;
    }

    // 解锁成就
    async unlockAchievement(achievementId) {
        const achievement = this.achievements[achievementId.toUpperCase()];
        if (!achievement || this.userAchievements.has(achievementId)) {
            return;
        }

        // 添加到已解锁列表
        this.userAchievements.add(achievementId);
        await this.saveUserAchievements();

        // 给予奖励
        if (window.currencyManager) {
            await window.currencyManager.addCoins(achievement.reward, `成就奖励: ${achievement.name}`);
        }

        // 显示成就解锁通知
        this.showAchievementUnlocked(achievement);

        console.log(`成就解锁: ${achievement.name} (+${achievement.reward}万花币)`);
    }

    // 显示成就解锁通知
    showAchievementUnlocked(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-card">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-title">成就解锁！</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-reward">+${achievement.reward}万花币</div>
                </div>
            </div>
        `;

        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 10000;
            animation: achievementPopup 3s ease-out forwards;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // 显示成就模态框
    showAchievementsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'achievements-modal';

        let achievementsList = '';
        Object.entries(this.achievements).forEach(([key, achievement]) => {
            const isUnlocked = this.userAchievements.has(key.toLowerCase());
            achievementsList += `
                <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-details">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                        <div class="achievement-reward">奖励: ${achievement.reward}万花币</div>
                    </div>
                    ${isUnlocked ? '<div class="achievement-status">✅</div>' : '<div class="achievement-status">🔒</div>'}
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🏆 成就系统</h3>
                    <button class="close-btn" onclick="window.uiManager.closeModal('achievements-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="achievements-list">
                        ${achievementsList}
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

    // 获取成就进度
    getAchievementProgress() {
        const total = Object.keys(this.achievements).length;
        const unlocked = this.userAchievements.size;
        return {
            total,
            unlocked,
            progress: (unlocked / total) * 100
        };
    }

    // 检查是否有新成就可以解锁
    async checkAllAchievements(gameData) {
        if (!gameData) return;

        // 检查各种成就
        await this.checkAchievement('first_game', gameData.gamesPlayed || 0);
        await this.checkAchievement('score_1000', gameData.highScore || 0);
        await this.checkAchievement('level_10', gameData.maxLevel || 0);
        await this.checkAchievement('combo_5', gameData.maxCombo || 0);
        await this.checkAchievement('daily_7', gameData.consecutiveDays || 0);
        await this.checkAchievement('friend_5', gameData.friendsInvited || 0);
        await this.checkAchievement('coin_10000', gameData.totalCoinsEarned || 0);
    }
}

// 创建全局实例
window.achievementsManager = new AchievementsManager();

// CSS样式
const style = document.createElement('style');
style.textContent = `
    @keyframes achievementPopup {
        0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
        }
        20% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0;
        }
    }

    .achievement-card {
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        border-radius: 15px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 15px;
        box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
        border: 2px solid #ffd700;
    }

    .achievement-icon {
        font-size: 48px;
        animation: bounce 2s infinite;
    }

    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
        }
        40% {
            transform: translateY(-10px);
        }
        60% {
            transform: translateY(-5px);
        }
    }

    .achievement-info {
        color: #333;
    }

    .achievement-title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 5px;
    }

    .achievement-name {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 5px;
    }

    .achievement-reward {
        font-size: 14px;
        color: #ff6b35;
        font-weight: bold;
    }

    .achievements-list {
        max-height: 400px;
        overflow-y: auto;
        padding: 10px;
    }

    .achievement-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 10px;
        transition: all 0.3s ease;
    }

    .achievement-item.unlocked {
        background: linear-gradient(135deg, #e8f5e8, #d4edda);
        border: 2px solid #28a745;
    }

    .achievement-item.locked {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border: 2px solid #6c757d;
        opacity: 0.6;
    }

    .achievement-details {
        flex: 1;
    }

    .achievement-status {
        font-size: 24px;
    }
`;
document.head.appendChild(style);