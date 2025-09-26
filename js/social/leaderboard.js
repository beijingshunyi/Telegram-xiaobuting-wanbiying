/**
 * 全服排行榜系统
 * 管理深度玩家和普通玩家排行榜，月度奖励发放
 */

class LeaderboardSystem {
    constructor() {
        this.coinSystem = null;
        this.telegramIntegration = null;

        // 排行榜数据
        this.leaderboards = {
            deepPlayers: new Map(),
            normalPlayers: new Map()
        };

        // 深度玩家判定标准
        this.deepPlayerCriteria = {
            minLoginDays: 25,      // 当月登录天数 ≥ 25天
            minLevels: 50,         // 完成关卡数 ≥ 50关
            minInvites: 5,         // 分享邀请 ≥ 5位好友
            minAds: 20             // 观看广告次数 ≥ 20次
        };

        // 月度奖励配置
        this.monthlyRewards = {
            deepPlayers: [3500, 3200, 3000, 2800, 2500],      // 前5名奖励
            normalPlayers: [2500, 2300, 2100, 1900, 1700]     // 前5名奖励
        };

        // 积分计算权重
        this.scoreWeights = {
            levelProgress: 0.5,    // 关卡进度分权重50%
            monthlyActive: 0.3,    // 月度活跃分权重30%
            socialShare: 0.2       // 分享邀请分权重20%
        };

        // 用户活动数据
        this.userActivities = new Map();
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();

        // 排行榜更新时间
        this.lastUpdate = Date.now();
        this.updateInterval = 5 * 60 * 1000; // 5分钟更新一次

        console.log('🏆 LeaderboardSystem initialized');
    }

    // 初始化排行榜系统
    async init(coinSystem, telegramIntegration) {
        this.coinSystem = coinSystem;
        this.telegramIntegration = telegramIntegration;

        try {
            // 加载排行榜数据
            this.loadLeaderboardData();

            // 加载用户活动数据
            this.loadUserActivities();

            // 检查是否需要发放月度奖励
            this.checkMonthlyRewards();

            // 绑定UI事件
            this.bindUIEvents();

            // 开始定时更新
            this.startPeriodicUpdates();

            console.log('✅ LeaderboardSystem initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize LeaderboardSystem:', error);
            return false;
        }
    }

    // 加载排行榜数据
    loadLeaderboardData() {
        const savedData = GameHelpers.storage.get(GAME_CONSTANTS.STORAGE_KEYS.LEADERBOARD_DATA, {
            deepPlayers: [],
            normalPlayers: [],
            lastUpdate: 0,
            currentMonth: this.currentMonth,
            currentYear: this.currentYear
        });

        // 检查是否是新的月份，如果是则重置排行榜
        if (savedData.currentMonth !== this.currentMonth || savedData.currentYear !== this.currentYear) {
            console.log('📅 New month detected, resetting leaderboards');
            this.resetMonthlyLeaderboards();
        } else {
            // 加载现有数据
            savedData.deepPlayers.forEach(player => {
                this.leaderboards.deepPlayers.set(player.userId, player);
            });

            savedData.normalPlayers.forEach(player => {
                this.leaderboards.normalPlayers.set(player.userId, player);
            });

            this.lastUpdate = savedData.lastUpdate;
        }

        console.log(`📊 Loaded leaderboards: ${this.leaderboards.deepPlayers.size} deep players, ${this.leaderboards.normalPlayers.size} normal players`);
    }

    // 加载用户活动数据
    loadUserActivities() {
        const savedActivities = GameHelpers.storage.get('user_activities', []);
        savedActivities.forEach(activity => {
            this.userActivities.set(activity.userId, activity);
        });

        console.log(`📈 Loaded ${this.userActivities.size} user activity records`);
    }

    // 保存排行榜数据
    saveLeaderboardData() {
        const dataToSave = {
            deepPlayers: Array.from(this.leaderboards.deepPlayers.values()),
            normalPlayers: Array.from(this.leaderboards.normalPlayers.values()),
            lastUpdate: this.lastUpdate,
            currentMonth: this.currentMonth,
            currentYear: this.currentYear
        };

        GameHelpers.storage.set(GAME_CONSTANTS.STORAGE_KEYS.LEADERBOARD_DATA, dataToSave);
    }

    // 保存用户活动数据
    saveUserActivities() {
        const activitiesToSave = Array.from(this.userActivities.values());
        GameHelpers.storage.set('user_activities', activitiesToSave);
    }

    // 记录用户活动
    recordUserActivity(userId, activityType, data = {}) {
        if (!userId) {
            userId = this.getCurrentUserId();
        }

        let userActivity = this.userActivities.get(userId);

        if (!userActivity) {
            userActivity = this.createNewUserActivity(userId);
            this.userActivities.set(userId, userActivity);
        }

        // 更新活动数据
        const today = new Date().toDateString();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // 检查是否是新月份
        if (userActivity.currentMonth !== currentMonth || userActivity.currentYear !== currentYear) {
            userActivity = this.resetMonthlyActivity(userActivity, currentMonth, currentYear);
        }

        // 记录今日登录
        if (!userActivity.loginDays.includes(today)) {
            userActivity.loginDays.push(today);
        }

        // 更新最后活动时间
        userActivity.lastActive = Date.now();

        // 根据活动类型更新数据
        switch (activityType) {
            case 'level_complete':
                userActivity.levelsCompleted++;
                userActivity.totalScore += data.score || 0;
                userActivity.maxCombo = Math.max(userActivity.maxCombo, data.combo || 0);
                break;

            case 'invite_friend':
                userActivity.friendsInvited++;
                break;

            case 'watch_ad':
                userActivity.adsWatched++;
                break;

            case 'share_game':
                userActivity.gamesShared++;
                break;

            case 'daily_checkin':
                userActivity.dailyCheckins++;
                break;
        }

        // 保存数据
        this.saveUserActivities();

        // 更新排行榜
        this.updateUserRanking(userId);

        console.log(`📊 Recorded activity: ${activityType} for user ${userId}`);
    }

    // 创建新用户活动记录
    createNewUserActivity(userId) {
        return {
            userId: userId,
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            loginDays: [],
            levelsCompleted: 0,
            totalScore: 0,
            maxCombo: 0,
            friendsInvited: 0,
            adsWatched: 0,
            gamesShared: 0,
            dailyCheckins: 0,
            lastActive: Date.now(),
            createdAt: Date.now()
        };
    }

    // 重置月度活动数据
    resetMonthlyActivity(userActivity, newMonth, newYear) {
        return {
            ...userActivity,
            currentMonth: newMonth,
            currentYear: newYear,
            loginDays: [],
            levelsCompleted: 0,
            totalScore: 0,
            maxCombo: 0,
            friendsInvited: 0,
            adsWatched: 0,
            gamesShared: 0,
            dailyCheckins: 0
        };
    }

    // 更新用户排名
    updateUserRanking(userId) {
        const userActivity = this.userActivities.get(userId);
        if (!userActivity) return;

        // 计算用户积分
        const userScore = this.calculateUserScore(userActivity);

        // 判断是否为深度玩家
        const isDeepPlayer = this.isDeepPlayer(userActivity);

        // 获取用户信息
        const userInfo = this.getUserInfo(userId);

        const playerData = {
            userId: userId,
            username: userInfo.username || `用户${userId.slice(-4)}`,
            avatar: userInfo.avatar || '/assets/images/ui/default-avatar.png',
            score: userScore,
            level: userActivity.levelsCompleted,
            totalScore: userActivity.totalScore,
            lastActive: userActivity.lastActive,
            isDeepPlayer: isDeepPlayer,
            rankingData: {
                levelProgress: this.calculateLevelProgressScore(userActivity),
                monthlyActive: this.calculateMonthlyActiveScore(userActivity),
                socialShare: this.calculateSocialShareScore(userActivity)
            }
        };

        // 添加到相应的排行榜
        if (isDeepPlayer) {
            this.leaderboards.deepPlayers.set(userId, playerData);
            // 如果用户之前在普通玩家榜中，则移除
            this.leaderboards.normalPlayers.delete(userId);
        } else {
            this.leaderboards.normalPlayers.set(userId, playerData);
        }

        // 限制排行榜大小（只保留前100名）
        this.trimLeaderboards();

        // 保存数据
        this.saveLeaderboardData();

        console.log(`🎯 Updated ranking for user ${userId} (${isDeepPlayer ? 'Deep' : 'Normal'} player, score: ${userScore})`);
    }

    // 判断是否为深度玩家
    isDeepPlayer(userActivity) {
        const criteria = this.deepPlayerCriteria;
        const meetsCount = [
            userActivity.loginDays.length >= criteria.minLoginDays,
            userActivity.levelsCompleted >= criteria.minLevels,
            userActivity.friendsInvited >= criteria.minInvites,
            userActivity.adsWatched >= criteria.minAds
        ].filter(Boolean).length;

        // 满足其中3项即认定为深度玩家
        return meetsCount >= 3;
    }

    // 计算用户总积分
    calculateUserScore(userActivity) {
        const levelProgressScore = this.calculateLevelProgressScore(userActivity);
        const monthlyActiveScore = this.calculateMonthlyActiveScore(userActivity);
        const socialShareScore = this.calculateSocialShareScore(userActivity);

        return Math.round(
            levelProgressScore * this.scoreWeights.levelProgress +
            monthlyActiveScore * this.scoreWeights.monthlyActive +
            socialShareScore * this.scoreWeights.socialShare
        );
    }

    // 计算关卡进度分
    calculateLevelProgressScore(userActivity) {
        return userActivity.levelsCompleted * 50 + Math.floor(userActivity.totalScore / 10000);
    }

    // 计算月度活跃分
    calculateMonthlyActiveScore(userActivity) {
        return userActivity.loginDays.length * 20 +
               userActivity.dailyCheckins * 10 +
               Math.min(userActivity.adsWatched * 5, 200); // 广告观看最多加200分
    }

    // 计算分享邀请分
    calculateSocialShareScore(userActivity) {
        return userActivity.friendsInvited * 100 +
               userActivity.gamesShared * 10;
    }

    // 限制排行榜大小
    trimLeaderboards() {
        const maxSize = 100;

        // 深度玩家排行榜
        if (this.leaderboards.deepPlayers.size > maxSize) {
            const sortedDeepPlayers = Array.from(this.leaderboards.deepPlayers.values())
                .sort((a, b) => b.score - a.score)
                .slice(0, maxSize);

            this.leaderboards.deepPlayers.clear();
            sortedDeepPlayers.forEach(player => {
                this.leaderboards.deepPlayers.set(player.userId, player);
            });
        }

        // 普通玩家排行榜
        if (this.leaderboards.normalPlayers.size > maxSize) {
            const sortedNormalPlayers = Array.from(this.leaderboards.normalPlayers.values())
                .sort((a, b) => b.score - a.score)
                .slice(0, maxSize);

            this.leaderboards.normalPlayers.clear();
            sortedNormalPlayers.forEach(player => {
                this.leaderboards.normalPlayers.set(player.userId, player);
            });
        }
    }

    // 获取排行榜数据
    getLeaderboard(type = 'deepPlayers', limit = 50) {
        const leaderboard = this.leaderboards[type];
        if (!leaderboard) return [];

        return Array.from(leaderboard.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((player, index) => ({
                ...player,
                rank: index + 1
            }));
    }

    // 获取用户排名
    getUserRank(userId, type = null) {
        // 如果不指定类型，自动检测用户属于哪个排行榜
        if (!type) {
            if (this.leaderboards.deepPlayers.has(userId)) {
                type = 'deepPlayers';
            } else if (this.leaderboards.normalPlayers.has(userId)) {
                type = 'normalPlayers';
            } else {
                return null;
            }
        }

        const leaderboard = this.getLeaderboard(type, 1000);
        const userIndex = leaderboard.findIndex(player => player.userId === userId);

        if (userIndex !== -1) {
            return {
                rank: userIndex + 1,
                type: type,
                player: leaderboard[userIndex],
                totalPlayers: this.leaderboards[type].size
            };
        }

        return null;
    }

    // 检查月度奖励
    checkMonthlyRewards() {
        const now = new Date();
        const isLastDayOfMonth = this.isLastDayOfMonth(now);

        if (isLastDayOfMonth && now.getHours() === 0) {
            console.log('🎁 Last day of month detected, preparing rewards...');
            this.distributeMonthlyRewards();
        }
    }

    // 判断是否为月底最后一天
    isLastDayOfMonth(date) {
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        return date.getDate() === lastDay;
    }

    // 发放月度奖励
    distributeMonthlyRewards() {
        console.log('🎊 Distributing monthly rewards...');

        // 获取排行榜前5名
        const topDeepPlayers = this.getLeaderboard('deepPlayers', 5);
        const topNormalPlayers = this.getLeaderboard('normalPlayers', 5);

        // 发放深度玩家奖励
        topDeepPlayers.forEach((player, index) => {
            const reward = this.monthlyRewards.deepPlayers[index] || 0;
            if (reward > 0) {
                this.awardMonthlyPrize(player.userId, reward, `深度玩家月度第${index + 1}名奖励`);
            }
        });

        // 发放普通玩家奖励
        topNormalPlayers.forEach((player, index) => {
            const reward = this.monthlyRewards.normalPlayers[index] || 0;
            if (reward > 0) {
                this.awardMonthlyPrize(player.userId, reward, `普通玩家月度第${index + 1}名奖励`);
            }
        });

        // 重置月度排行榜
        this.resetMonthlyLeaderboards();

        console.log('✅ Monthly rewards distributed successfully');
    }

    // 发放月度奖金
    awardMonthlyPrize(userId, amount, reason) {
        if (this.coinSystem) {
            this.coinSystem.addCoins(amount, reason, {
                type: 'monthly_reward',
                userId: userId,
                month: this.currentMonth,
                year: this.currentYear
            });

            console.log(`🏆 Awarded ${amount} coins to user ${userId} for ${reason}`);
        }

        // 记录奖励发放
        this.recordRewardDistribution(userId, amount, reason);
    }

    // 记录奖励发放
    recordRewardDistribution(userId, amount, reason) {
        const rewardRecord = {
            userId: userId,
            amount: amount,
            reason: reason,
            timestamp: Date.now(),
            month: this.currentMonth,
            year: this.currentYear
        };

        const rewardHistory = GameHelpers.storage.get('monthly_reward_history', []);
        rewardHistory.push(rewardRecord);

        // 只保留最近12个月的记录
        const twelveMonthsAgo = Date.now() - (12 * 30 * 24 * 60 * 60 * 1000);
        const filteredHistory = rewardHistory.filter(record => record.timestamp > twelveMonthsAgo);

        GameHelpers.storage.set('monthly_reward_history', filteredHistory);
    }

    // 重置月度排行榜
    resetMonthlyLeaderboards() {
        this.leaderboards.deepPlayers.clear();
        this.leaderboards.normalPlayers.clear();

        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();

        this.saveLeaderboardData();

        console.log('🔄 Monthly leaderboards reset');
    }

    // 开始定期更新
    startPeriodicUpdates() {
        setInterval(() => {
            this.updateLeaderboards();
        }, this.updateInterval);

        console.log(`⏰ Started periodic updates every ${this.updateInterval / 1000} seconds`);
    }

    // 更新排行榜
    updateLeaderboards() {
        const now = Date.now();

        // 检查是否需要更新
        if (now - this.lastUpdate < this.updateInterval) {
            return;
        }

        // 重新计算所有用户的积分
        this.userActivities.forEach((activity, userId) => {
            this.updateUserRanking(userId);
        });

        this.lastUpdate = now;
        console.log('📊 Leaderboards updated');
    }

    // 绑定UI事件
    bindUIEvents() {
        // 排行榜标签切换
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabType = e.target.dataset.tab;
                this.switchLeaderboardTab(tabType);
            });
        });

        // 刷新排行榜按钮
        const refreshButton = document.getElementById('refresh-leaderboard');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refreshLeaderboardDisplay();
            });
        }
    }

    // 切换排行榜标签
    switchLeaderboardTab(tabType) {
        // 更新标签状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');

        // 更新排行榜显示
        this.updateLeaderboardDisplay(tabType);
    }

    // 更新排行榜显示
    updateLeaderboardDisplay(type = 'deepPlayers') {
        const leaderboardData = this.getLeaderboard(type, 50);
        const listContainer = document.getElementById('ranking-list');

        if (!listContainer) return;

        // 生成排行榜HTML
        const html = this.generateLeaderboardHTML(leaderboardData);
        listContainer.innerHTML = html;

        // 更新奖励显示
        this.updateRewardTiersDisplay(type);
    }

    // 生成排行榜HTML
    generateLeaderboardHTML(players) {
        if (players.length === 0) {
            return '<div class="no-data">暂无排行数据</div>';
        }

        return players.map(player => `
            <div class="ranking-item ${player.rank <= 3 ? 'top-3' : ''}">
                <div class="ranking-position">${player.rank}</div>
                <img src="${player.avatar}" alt="头像" class="ranking-avatar">
                <div class="ranking-info">
                    <div class="ranking-name">${player.username}</div>
                    <div class="ranking-level">第${player.level}关 • ${GameHelpers.time.friendly(player.lastActive)}</div>
                </div>
                <div class="ranking-score">${player.score.toLocaleString()}</div>
            </div>
        `).join('');
    }

    // 更新奖励等级显示
    updateRewardTiersDisplay(type) {
        const rewardTiersContainer = document.getElementById('reward-tiers');
        if (!rewardTiersContainer) return;

        const rewards = this.monthlyRewards[type] || [];

        const html = rewards.map((reward, index) => `
            <div class="reward-tier">
                <span class="tier-position">第${index + 1}名</span>
                <span class="tier-reward">${reward.toLocaleString()} 万花币</span>
            </div>
        `).join('');

        rewardTiersContainer.innerHTML = html;
    }

    // 刷新排行榜显示
    refreshLeaderboardDisplay() {
        this.updateLeaderboards();

        const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'deepPlayers';
        this.updateLeaderboardDisplay(activeTab);

        this.showMessage('排行榜已刷新');
    }

    // 获取当前用户ID
    getCurrentUserId() {
        if (this.telegramIntegration && this.telegramIntegration.userId) {
            return this.telegramIntegration.userId;
        }

        // 备用方案：生成或获取本地用户ID
        let userId = GameHelpers.storage.get('local_user_id');
        if (!userId) {
            userId = 'local_' + GameHelpers.string.random(8) + '_' + Date.now();
            GameHelpers.storage.set('local_user_id', userId);
        }

        return userId;
    }

    // 获取用户信息
    getUserInfo(userId) {
        // 尝试从Telegram获取用户信息
        if (this.telegramIntegration) {
            const friends = this.telegramIntegration.getFriends();
            const friend = friends.find(f => f.id === userId);
            if (friend) {
                return {
                    username: friend.username || friend.first_name,
                    avatar: friend.photo_url || '/assets/images/ui/default-avatar.png'
                };
            }
        }

        // 默认用户信息
        return {
            username: `玩家${userId.slice(-4)}`,
            avatar: '/assets/images/ui/default-avatar.png'
        };
    }

    // 显示消息
    showMessage(message) {
        console.log('📢 Leaderboard message:', message);
        // 可以集成到游戏的消息系统中
    }

    // 获取统计信息
    getStatistics() {
        return {
            deepPlayersCount: this.leaderboards.deepPlayers.size,
            normalPlayersCount: this.leaderboards.normalPlayers.size,
            totalActivePlayers: this.userActivities.size,
            lastUpdate: new Date(this.lastUpdate).toLocaleString(),
            currentMonth: this.currentMonth,
            currentYear: this.currentYear,
            rewardsDistributed: this.getRewardStatistics()
        };
    }

    // 获取奖励统计
    getRewardStatistics() {
        const rewardHistory = GameHelpers.storage.get('monthly_reward_history', []);
        const thisMonth = rewardHistory.filter(record =>
            record.month === this.currentMonth && record.year === this.currentYear
        );

        return {
            thisMonth: thisMonth.length,
            totalAmount: thisMonth.reduce((sum, record) => sum + record.amount, 0),
            allTime: rewardHistory.length
        };
    }

    // 获取调试信息
    getDebugInfo() {
        return {
            leaderboards: {
                deepPlayers: this.leaderboards.deepPlayers.size,
                normalPlayers: this.leaderboards.normalPlayers.size
            },
            activities: this.userActivities.size,
            lastUpdate: new Date(this.lastUpdate).toLocaleString(),
            updateInterval: this.updateInterval,
            currentPeriod: `${this.currentYear}-${this.currentMonth + 1}`,
            criteria: this.deepPlayerCriteria,
            rewards: this.monthlyRewards
        };
    }
}

// 导出LeaderboardSystem类
window.LeaderboardSystem = LeaderboardSystem;