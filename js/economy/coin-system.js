/**
 * 万花币经济系统
 * 管理万花币的获取、消费、存储和统计
 */

class CoinSystem {
    constructor() {
        this.balance = 0;
        this.totalEarned = 0;
        this.totalSpent = 0;
        this.lastUpdate = Date.now();

        // 奖励配置
        this.rewards = {
            dailyCheckin: 100,
            levelComplete: {
                base: 50,
                starBonus: 25,
                comboBonus: 10
            },
            matchBonus: {
                match3: 5,
                match4: 10,
                match5: 25,
                lShape: 30,
                tShape: 35,
                special: 15
            },
            achievementRewards: {
                firstWin: 200,
                combo10: 100,
                specialUse: 50,
                perfectLevel: 300
            },
            adReward: 50,
            inviteReward: 100,
            friendBonus: 200
        };

        // 消费项目配置
        this.costs = {
            powerups: {
                hammer: 100,
                shuffle: 150,
                rainbow: 200,
                extraMoves: 50
            },
            lives: 25,
            hints: 10,
            skip: 300
        };

        // 汇率配置 (基于GAME_CONSTANTS)
        this.exchangeRates = {
            cny: 100,      // 1元 = 100万花币
            usdt: 720      // 1 USDT = 720万花币 (按7.2汇率)
        };

        // 提现限制
        this.withdrawalLimits = {
            minAlipay: 3000,    // 支付宝最低提现3000万花币(30元)
            minUsdt: 720,       // USDT最低提现720万花币(1 USDT)
            dailyLimit: 50000,  // 每日提现限额50000万花币(500元)
            fee: 0.02           // 提现手续费2%
        };

        // 交易记录
        this.transactions = [];
        this.maxTransactionHistory = 1000;

        console.log('💰 CoinSystem initialized');
        this.loadUserData();
    }

    // 初始化用户数据
    async init() {
        console.log('🚀 Initializing CoinSystem...');

        try {
            // 加载存储的数据
            this.loadUserData();

            // 检查每日签到
            this.checkDailyReset();

            // 初始化交易记录
            this.loadTransactionHistory();

            console.log('✅ CoinSystem initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize CoinSystem:', error);
            return false;
        }
    }

    // 加载用户数据
    loadUserData() {
        const savedData = GameHelpers.storage.get(GAME_CONSTANTS.STORAGE_KEYS.COIN_BALANCE, {
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
            lastUpdate: Date.now(),
            lastCheckin: null,
            dailyWithdrawn: 0,
            lastWithdrawalDate: null
        });

        this.balance = savedData.balance || 0;
        this.totalEarned = savedData.totalEarned || 0;
        this.totalSpent = savedData.totalSpent || 0;
        this.lastUpdate = savedData.lastUpdate || Date.now();
        this.lastCheckin = savedData.lastCheckin;
        this.dailyWithdrawn = savedData.dailyWithdrawn || 0;
        this.lastWithdrawalDate = savedData.lastWithdrawalDate;

        console.log(`💾 Loaded user data: ${this.balance} 万花币`);
    }

    // 保存用户数据
    saveUserData() {
        const dataToSave = {
            balance: this.balance,
            totalEarned: this.totalEarned,
            totalSpent: this.totalSpent,
            lastUpdate: Date.now(),
            lastCheckin: this.lastCheckin,
            dailyWithdrawn: this.dailyWithdrawn,
            lastWithdrawalDate: this.lastWithdrawalDate
        };

        GameHelpers.storage.set(GAME_CONSTANTS.STORAGE_KEYS.COIN_BALANCE, dataToSave);
        this.lastUpdate = Date.now();
    }

    // 加载交易记录
    loadTransactionHistory() {
        this.transactions = GameHelpers.storage.get('coin_transactions', []);
        console.log(`📜 Loaded ${this.transactions.length} transaction records`);
    }

    // 保存交易记录
    saveTransactionHistory() {
        // 只保留最近的交易记录
        if (this.transactions.length > this.maxTransactionHistory) {
            this.transactions = this.transactions.slice(-this.maxTransactionHistory);
        }
        GameHelpers.storage.set('coin_transactions', this.transactions);
    }

    // 检查每日重置
    checkDailyReset() {
        const now = new Date();
        const today = now.toDateString();

        if (this.lastWithdrawalDate !== today) {
            this.dailyWithdrawn = 0;
            this.lastWithdrawalDate = today;
            this.saveUserData();
        }
    }

    // 获取当前余额
    getBalance() {
        return this.balance;
    }

    // 获取格式化余额
    getFormattedBalance() {
        return this.balance.toLocaleString();
    }

    // 添加万花币
    addCoins(amount, reason = '未知', metadata = {}) {
        if (amount <= 0) {
            console.warn('⚠️ Invalid coin amount:', amount);
            return false;
        }

        const previousBalance = this.balance;
        this.balance += amount;
        this.totalEarned += amount;

        // 记录交易
        this.recordTransaction('earn', amount, reason, metadata);

        // 保存数据
        this.saveUserData();

        // 触发事件
        this.dispatchCoinEvent('coins-added', {
            amount: amount,
            reason: reason,
            previousBalance: previousBalance,
            newBalance: this.balance,
            metadata: metadata
        });

        console.log(`💰 Added ${amount} coins (${reason}). New balance: ${this.balance}`);
        return true;
    }

    // 扣除万花币
    spendCoins(amount, reason = '消费', metadata = {}) {
        if (amount <= 0) {
            console.warn('⚠️ Invalid spend amount:', amount);
            return false;
        }

        if (this.balance < amount) {
            console.warn('⚠️ Insufficient coins:', { required: amount, available: this.balance });
            return false;
        }

        const previousBalance = this.balance;
        this.balance -= amount;
        this.totalSpent += amount;

        // 记录交易
        this.recordTransaction('spend', amount, reason, metadata);

        // 保存数据
        this.saveUserData();

        // 触发事件
        this.dispatchCoinEvent('coins-spent', {
            amount: amount,
            reason: reason,
            previousBalance: previousBalance,
            newBalance: this.balance,
            metadata: metadata
        });

        console.log(`💸 Spent ${amount} coins (${reason}). New balance: ${this.balance}`);
        return true;
    }

    // 检查是否有足够的万花币
    hasEnoughCoins(amount) {
        return this.balance >= amount;
    }

    // 记录交易
    recordTransaction(type, amount, reason, metadata = {}) {
        const transaction = {
            id: GameHelpers.string.random(8),
            type: type, // 'earn' or 'spend' or 'withdraw'
            amount: amount,
            reason: reason,
            metadata: metadata,
            timestamp: Date.now(),
            balanceAfter: this.balance
        };

        this.transactions.unshift(transaction);

        // 异步保存交易记录
        setTimeout(() => this.saveTransactionHistory(), 100);

        return transaction;
    }

    // 每日签到
    dailyCheckin() {
        const today = new Date().toDateString();

        if (this.lastCheckin === today) {
            return {
                success: false,
                message: '今天已经签到过了！',
                alreadyCheckedIn: true
            };
        }

        const reward = this.rewards.dailyCheckin;
        this.addCoins(reward, '每日签到');
        this.lastCheckin = today;
        this.saveUserData();

        return {
            success: true,
            message: `签到成功！获得 ${reward} 万花币`,
            reward: reward,
            newBalance: this.balance
        };
    }

    // 关卡完成奖励
    levelCompleteReward(levelData) {
        const { level, stars, score, combo, isFirstTime } = levelData;

        let totalReward = this.rewards.levelComplete.base;

        // 星级奖励
        totalReward += stars * this.rewards.levelComplete.starBonus;

        // 连击奖励
        if (combo >= 5) {
            totalReward += Math.floor(combo / 5) * this.rewards.levelComplete.comboBonus;
        }

        // 首次通关奖励
        if (isFirstTime) {
            totalReward += this.rewards.achievementRewards.firstWin;
        }

        // 完美通关奖励（3星 + 高分）
        if (stars === 3 && score > levelData.targetScore * 1.5) {
            totalReward += this.rewards.achievementRewards.perfectLevel;
        }

        this.addCoins(totalReward, `通关第${level}关`, {
            level: level,
            stars: stars,
            score: score,
            combo: combo,
            isFirstTime: isFirstTime
        });

        return {
            totalReward: totalReward,
            breakdown: {
                base: this.rewards.levelComplete.base,
                stars: stars * this.rewards.levelComplete.starBonus,
                combo: combo >= 5 ? Math.floor(combo / 5) * this.rewards.levelComplete.comboBonus : 0,
                firstTime: isFirstTime ? this.rewards.achievementRewards.firstWin : 0,
                perfect: (stars === 3 && score > levelData.targetScore * 1.5) ? this.rewards.achievementRewards.perfectLevel : 0
            }
        };
    }

    // 匹配奖励
    matchReward(matchData) {
        const { matchType, length, isSpecial } = matchData;
        let reward = 0;

        switch (matchType) {
            case 'line-3':
                reward = this.rewards.matchBonus.match3;
                break;
            case 'line-4':
                reward = this.rewards.matchBonus.match4;
                break;
            case 'line-5':
            case 'line-6+':
                reward = this.rewards.matchBonus.match5;
                break;
            case 'l-shape':
                reward = this.rewards.matchBonus.lShape;
                break;
            case 't-shape':
                reward = this.rewards.matchBonus.tShape;
                break;
        }

        // 特殊元素使用奖励
        if (isSpecial) {
            reward += this.rewards.matchBonus.special;
        }

        // 长度奖励
        if (length > 5) {
            reward += (length - 5) * 5;
        }

        if (reward > 0) {
            this.addCoins(reward, `${matchType}消除`, matchData);
        }

        return reward;
    }

    // 观看广告奖励
    adReward(adType = 'general') {
        const reward = this.rewards.adReward;
        this.addCoins(reward, '观看广告', { adType: adType });

        return {
            reward: reward,
            newBalance: this.balance
        };
    }

    // 邀请好友奖励
    inviteReward(friendData) {
        const { friendId, friendLevel } = friendData;
        let reward = this.rewards.inviteReward;

        // 好友等级奖励
        if (friendLevel >= 10) {
            reward += this.rewards.friendBonus;
        }

        this.addCoins(reward, '邀请好友奖励', {
            friendId: friendId,
            friendLevel: friendLevel
        });

        return {
            reward: reward,
            friendLevel: friendLevel,
            newBalance: this.balance
        };
    }

    // 购买道具
    buyPowerup(powerupType) {
        const cost = this.costs.powerups[powerupType];

        if (!cost) {
            return {
                success: false,
                message: '未知的道具类型'
            };
        }

        if (!this.hasEnoughCoins(cost)) {
            return {
                success: false,
                message: '万花币不足',
                required: cost,
                available: this.balance
            };
        }

        if (this.spendCoins(cost, `购买${powerupType}道具`, { powerupType: powerupType })) {
            return {
                success: true,
                message: `成功购买${powerupType}道具`,
                cost: cost,
                newBalance: this.balance
            };
        }

        return {
            success: false,
            message: '购买失败'
        };
    }

    // 购买体力
    buyLives(count = 1) {
        const cost = this.costs.lives * count;

        if (!this.hasEnoughCoins(cost)) {
            return {
                success: false,
                message: '万花币不足',
                required: cost,
                available: this.balance
            };
        }

        if (this.spendCoins(cost, `购买${count}点体力`, { livesCount: count })) {
            return {
                success: true,
                message: `成功购买${count}点体力`,
                cost: cost,
                livesCount: count,
                newBalance: this.balance
            };
        }

        return {
            success: false,
            message: '购买失败'
        };
    }

    // 提现前检查
    checkWithdrawal(amount, method) {
        this.checkDailyReset();

        const minAmount = method === 'alipay' ? this.withdrawalLimits.minAlipay : this.withdrawalLimits.minUsdt;

        if (amount < minAmount) {
            return {
                valid: false,
                reason: 'AMOUNT_TOO_LOW',
                message: `最低提现${minAmount}万花币`,
                minAmount: minAmount
            };
        }

        if (amount > this.balance) {
            return {
                valid: false,
                reason: 'INSUFFICIENT_BALANCE',
                message: '余额不足',
                available: this.balance
            };
        }

        if (this.dailyWithdrawn + amount > this.withdrawalLimits.dailyLimit) {
            return {
                valid: false,
                reason: 'DAILY_LIMIT_EXCEEDED',
                message: '超出每日提现限额',
                dailyLimit: this.withdrawalLimits.dailyLimit,
                alreadyWithdrawn: this.dailyWithdrawn
            };
        }

        return {
            valid: true,
            fee: Math.floor(amount * this.withdrawalLimits.fee),
            actualAmount: amount - Math.floor(amount * this.withdrawalLimits.fee)
        };
    }

    // 执行提现（仅记录，实际提现需要后端处理）
    requestWithdrawal(amount, method, accountInfo) {
        const checkResult = this.checkWithdrawal(amount, method);

        if (!checkResult.valid) {
            return {
                success: false,
                reason: checkResult.reason,
                message: checkResult.message,
                data: checkResult
            };
        }

        const withdrawalData = {
            id: GameHelpers.string.random(12),
            amount: amount,
            fee: checkResult.fee,
            actualAmount: checkResult.actualAmount,
            method: method,
            accountInfo: accountInfo,
            status: 'pending',
            requestTime: Date.now(),
            userId: this.getUserId()
        };

        // 暂时冻结资金
        if (this.spendCoins(amount, '提现申请', withdrawalData)) {
            // 更新每日提现额度
            this.dailyWithdrawn += amount;
            this.saveUserData();

            // 记录提现申请
            this.recordTransaction('withdraw', amount, '提现申请', withdrawalData);

            return {
                success: true,
                message: '提现申请已提交',
                withdrawalId: withdrawalData.id,
                data: withdrawalData
            };
        }

        return {
            success: false,
            message: '提现申请失败'
        };
    }

    // 获取用户ID（简单实现）
    getUserId() {
        let userId = GameHelpers.storage.get('user_id');
        if (!userId) {
            userId = 'user_' + GameHelpers.string.random(8) + '_' + Date.now();
            GameHelpers.storage.set('user_id', userId);
        }
        return userId;
    }

    // 计算提现手续费
    calculateWithdrawalFee(amount) {
        return Math.floor(amount * this.withdrawalLimits.fee);
    }

    // 计算实际到账金额
    calculateActualWithdrawal(amount) {
        const fee = this.calculateWithdrawalFee(amount);
        return amount - fee;
    }

    // 万花币转换为人民币
    coinsToCNY(coins) {
        return coins / this.exchangeRates.cny;
    }

    // 万花币转换为USDT
    coinsToUSDT(coins) {
        return coins / this.exchangeRates.usdt;
    }

    // 人民币转换为万花币
    cnyToCoins(cny) {
        return cny * this.exchangeRates.cny;
    }

    // USDT转换为万花币
    usdtToCoins(usdt) {
        return usdt * this.exchangeRates.usdt;
    }

    // 获取交易历史
    getTransactionHistory(limit = 50, type = null) {
        let transactions = [...this.transactions];

        if (type) {
            transactions = transactions.filter(t => t.type === type);
        }

        return transactions.slice(0, limit);
    }

    // 获取统计信息
    getStatistics() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;
        const oneMonth = 30 * oneDay;

        // 最近的交易统计
        const recentTransactions = this.transactions.filter(t =>
            now - t.timestamp < oneMonth
        );

        const dailyTransactions = this.transactions.filter(t =>
            now - t.timestamp < oneDay
        );

        const weeklyTransactions = this.transactions.filter(t =>
            now - t.timestamp < oneWeek
        );

        return {
            currentBalance: this.balance,
            totalEarned: this.totalEarned,
            totalSpent: this.totalSpent,
            netGain: this.totalEarned - this.totalSpent,
            transactionCount: this.transactions.length,
            dailyActivity: {
                transactions: dailyTransactions.length,
                earned: dailyTransactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0),
                spent: dailyTransactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0)
            },
            weeklyActivity: {
                transactions: weeklyTransactions.length,
                earned: weeklyTransactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0),
                spent: weeklyTransactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0)
            },
            monthlyActivity: {
                transactions: recentTransactions.length,
                earned: recentTransactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0),
                spent: recentTransactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + t.amount, 0)
            }
        };
    }

    // 触发万花币事件
    dispatchCoinEvent(eventType, data) {
        const event = new CustomEvent(eventType, {
            detail: {
                timestamp: Date.now(),
                ...data
            }
        });
        document.dispatchEvent(event);
    }

    // 重置用户数据（仅用于测试）
    resetUserData() {
        if (window.location.hostname !== 'localhost') {
            console.warn('⚠️ Reset only allowed in development');
            return false;
        }

        this.balance = 0;
        this.totalEarned = 0;
        this.totalSpent = 0;
        this.transactions = [];
        this.lastCheckin = null;
        this.dailyWithdrawn = 0;

        this.saveUserData();
        this.saveTransactionHistory();

        console.log('🔄 User data reset');
        return true;
    }

    // 获取调试信息
    getDebugInfo() {
        return {
            balance: this.balance,
            totalEarned: this.totalEarned,
            totalSpent: this.totalSpent,
            transactionCount: this.transactions.length,
            lastUpdate: new Date(this.lastUpdate).toLocaleString(),
            lastCheckin: this.lastCheckin,
            dailyWithdrawn: this.dailyWithdrawn,
            exchangeRates: this.exchangeRates,
            withdrawalLimits: this.withdrawalLimits
        };
    }
}

// 导出CoinSystem类
window.CoinSystem = CoinSystem;