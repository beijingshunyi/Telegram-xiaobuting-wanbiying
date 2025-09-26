// 排行榜管理器
class LeaderboardManager {
    constructor() {
        this.currentType = 'daily';
        this.leaderboardData = {
            daily: [],
            weekly: [],
            monthly: []
        };

        // 延迟初始化，确保DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            // DOM已经加载完成
            this.initialize();
        }
    }

    async initialize() {
        try {
            this.setupEventListeners();
            await this.loadLeaderboards();
            console.log('排行榜系统初始化成功');
        } catch (error) {
            console.error('排行榜系统初始化失败:', error);
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        const leaderboardBtn = document.getElementById('leaderboard-btn');
        if (leaderboardBtn) {
            leaderboardBtn.addEventListener('click', () => {
                console.log('Leaderboard button clicked');
                this.showLeaderboardModal();
            });
            console.log('Leaderboard event listener attached');
        } else {
            console.error('Leaderboard button not found');
        }
    }

    // 加载排行榜数据
    async loadLeaderboards() {
        const types = ['daily', 'weekly', 'monthly'];

        for (const type of types) {
            try {
                const response = await fetch(`${CONFIG.API.BASE_URL}/leaderboard/${type}`);
                if (response.ok) {
                    const data = await response.json();
                    this.leaderboardData[type] = data.leaderboard || [];
                } else {
                    console.error(`获取${type}排行榜失败:`, response.statusText);
                }
            } catch (error) {
                console.error(`加载${type}排行榜失败:`, error);
                // 使用模拟数据
                this.leaderboardData[type] = this.generateMockData(type);
            }
        }
    }

    // 生成模拟数据
    generateMockData(type) {
        const mockPlayers = [
            { username: '游戏高手', first_name: '小明', total_score: 15000, games_played: 25 },
            { username: '消除达人', first_name: '小红', total_score: 12000, games_played: 20 },
            { username: '万花币王', first_name: '小华', total_score: 10000, games_played: 18 },
            { username: '连击专家', first_name: '小李', total_score: 8500, games_played: 15 },
            { username: '挑战者', first_name: '小王', total_score: 7200, games_played: 12 },
        ];

        // 根据类型调整分数
        const multiplier = type === 'monthly' ? 1 : type === 'weekly' ? 0.7 : 0.3;
        return mockPlayers.map(player => ({
            ...player,
            total_score: Math.floor(player.total_score * multiplier),
            games_played: Math.floor(player.games_played * multiplier)
        }));
    }

    // 显示排行榜模态框
    showLeaderboardModal() {
        console.log('showLeaderboardModal called');
        // 使用现有的模态框容器系统
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            console.error('Modal container not found');
            return;
        }
        console.log('Modal container found, showing leaderboard');

        const modalContent = `
            <div class="modal">
                <div class="modal-header">
                    <h2>🎯 排行榜</h2>
                    <button class="modal-close" onclick="document.getElementById('modal-container').style.display='none'; document.getElementById('modal-container').innerHTML='';">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="leaderboard-tabs">
                        <button class="tab-btn ${this.currentType === 'daily' ? 'active' : ''}" data-type="daily">每日</button>
                        <button class="tab-btn ${this.currentType === 'weekly' ? 'active' : ''}" data-type="weekly">每周</button>
                        <button class="tab-btn ${this.currentType === 'monthly' ? 'active' : ''}" data-type="monthly">每月</button>
                    </div>
                    <div class="leaderboard-content">
                        ${this.renderLeaderboard(this.currentType)}
                    </div>
                </div>
            </div>
        `;

        modalContainer.innerHTML = modalContent;
        modalContainer.style.display = 'flex';

        // 设置标签页切换
        const tabBtns = modalContainer.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.switchTab(type, modalContainer);
            });
        });

        // 点击背景关闭
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                modalContainer.style.display = 'none';
                modalContainer.innerHTML = '';
            }
        });
    }

    // 切换标签页
    switchTab(type, modalContainer) {
        this.currentType = type;

        // 更新标签状态
        const tabBtns = modalContainer.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 更新内容
        const content = modalContainer.querySelector('.leaderboard-content');
        if (content) {
            content.innerHTML = this.renderLeaderboard(type);
        }
    }

    // 渲染排行榜
    renderLeaderboard(type) {
        const data = this.leaderboardData[type] || [];

        if (data.length === 0) {
            return `
                <div class="empty-leaderboard">
                    <div class="empty-icon">📊</div>
                    <div class="empty-text">暂无排行数据</div>
                </div>
            `;
        }

        let html = '<div class="leaderboard-list">';

        data.forEach((player, index) => {
            const rank = index + 1;
            let rankIcon = '';
            let rankClass = '';

            if (rank === 1) {
                rankIcon = '🥇';
                rankClass = 'gold';
            } else if (rank === 2) {
                rankIcon = '🥈';
                rankClass = 'silver';
            } else if (rank === 3) {
                rankIcon = '🥉';
                rankClass = 'bronze';
            } else {
                rankIcon = rank;
                rankClass = 'normal';
            }

            // 计算奖励
            const reward = this.getReward(type, rank);
            const rewardText = reward > 0 ? `<div class="reward">🪙${reward}</div>` : '';

            html += `
                <div class="leaderboard-item ${rankClass}">
                    <div class="rank">${rankIcon}</div>
                    <div class="player-info">
                        <div class="player-name">${player.first_name || player.username}</div>
                        <div class="player-stats">
                            <span>总分: ${player.total_score.toLocaleString()}</span>
                            <span>游戏次数: ${player.games_played}</span>
                        </div>
                    </div>
                    ${rewardText}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    // 获取排名奖励
    getReward(type, rank) {
        if (type !== 'monthly') return 0;

        const rewards = CONFIG.LEADERBOARD.MONTHLY_REWARDS;
        return rewards[rank] || 0;
    }

    // 提交分数到排行榜
    async submitScore(score, gameData) {
        try {
            // 这里应该调用API提交分数
            console.log('提交分数到排行榜:', score, gameData);

            // 重新加载排行榜数据
            await this.loadLeaderboards();
        } catch (error) {
            console.error('提交分数失败:', error);
        }
    }

    // 获取用户排名
    getUserRank(type = 'daily') {
        const data = this.leaderboardData[type] || [];
        // 这里需要根据当前用户ID查找排名
        // 暂时返回模拟数据
        return {
            rank: Math.floor(Math.random() * 100) + 1,
            totalPlayers: data.length + Math.floor(Math.random() * 1000)
        };
    }

    // 检查是否有奖励可领取
    checkRewards() {
        const monthlyRank = this.getUserRank('monthly');
        const reward = this.getReward('monthly', monthlyRank.rank);

        if (reward > 0) {
            // 显示奖励通知
            this.showRewardNotification(monthlyRank.rank, reward);
        }
    }

    // 显示奖励通知
    showRewardNotification(rank, reward) {
        if (window.uiManager) {
            window.uiManager.showNotification(
                `恭喜！您在月度排行榜第${rank}名，获得${reward}万花币奖励！`,
                'success',
                5000
            );
        }

        // 发放奖励
        if (window.currencyManager) {
            window.currencyManager.addCoins(reward, `月度排行榜第${rank}名奖励`);
        }
    }
}

// 创建全局实例
window.leaderboardManager = new LeaderboardManager();

// CSS样式
const style = document.createElement('style');
style.textContent = `
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;
    }

    .modal-body {
        padding: 0;
    }
    .leaderboard-tabs {
        display: flex;
        margin-bottom: 20px;
        border-bottom: 1px solid #ddd;
    }

    .tab-btn {
        flex: 1;
        padding: 10px 20px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.3s ease;
    }

    .tab-btn.active {
        background: #007bff;
        color: white;
        border-radius: 5px 5px 0 0;
    }

    .leaderboard-list {
        max-height: 400px;
        overflow-y: auto;
    }

    .leaderboard-item {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 15px;
        margin-bottom: 10px;
        border-radius: 10px;
        transition: all 0.3s ease;
    }

    .leaderboard-item.gold {
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        border: 2px solid #ffd700;
    }

    .leaderboard-item.silver {
        background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
        border: 2px solid #c0c0c0;
    }

    .leaderboard-item.bronze {
        background: linear-gradient(135deg, #cd7f32, #daa520);
        border: 2px solid #cd7f32;
    }

    .leaderboard-item.normal {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border: 2px solid #dee2e6;
    }

    .rank {
        font-size: 24px;
        font-weight: bold;
        min-width: 50px;
        text-align: center;
    }

    .player-info {
        flex: 1;
    }

    .player-name {
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
    }

    .player-stats {
        font-size: 12px;
        color: #666;
        display: flex;
        gap: 15px;
    }

    .reward {
        font-size: 14px;
        font-weight: bold;
        color: #ff6b35;
        background: rgba(255, 107, 53, 0.1);
        padding: 5px 10px;
        border-radius: 15px;
    }

    .empty-leaderboard {
        text-align: center;
        padding: 50px;
        color: #666;
    }

    .empty-icon {
        font-size: 48px;
        margin-bottom: 15px;
    }

    .empty-text {
        font-size: 16px;
    }
`;
document.head.appendChild(style);