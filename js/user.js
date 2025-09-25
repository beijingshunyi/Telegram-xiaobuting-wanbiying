class UserManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.energyTimer = null;
        this.initPromise = this.initialize();
    }

    async initialize() {
        try {
            // 等待Telegram和数据库初始化完成
            await Promise.all([
                window.telegramApp.initPromise,
                window.dbManager.initPromise
            ]);

            // 获取或创建用户
            await this.loadOrCreateUser();

            // 启动体力恢复定时器
            this.startEnergyTimer();

            this.isInitialized = true;
            console.log('UserManager initialized successfully');

            // 触发用户加载完成事件
            document.dispatchEvent(new CustomEvent('user:loaded', {
                detail: { user: this.currentUser }
            }));

        } catch (error) {
            console.error('Failed to initialize UserManager:', error);
            this.isInitialized = false;
        }
    }

    async loadOrCreateUser() {
        let telegramUser = window.telegramApp.getUser();

        // 如果没有Telegram用户数据，创建默认用户
        if (!telegramUser) {
            console.warn('No Telegram user data available, using guest user');
            telegramUser = {
                id: 'guest_' + Date.now(),
                username: 'guest_user',
                first_name: '游客用户',
                photo_url: 'images/default-avatar.png',
                language_code: 'zh'
            };
        }

        // 尝试从数据库加载用户
        let user = await window.dbManager.getUser(telegramUser.id);

        if (!user) {
            // 创建新用户
            user = await window.dbManager.createUser(telegramUser);
            console.log('Created new user:', user);

            // 检查是否有邀请码
            const startParam = window.telegramApp.getStartParam();
            if (startParam && startParam.startsWith('invite_')) {
                await this.processInviteCode(startParam.replace('invite_', ''), user.id);
            }
        } else {
            // 更新用户登录时间和Telegram信息
            user = await window.dbManager.updateUser(user.id, {
                lastLogin: Date.now(),
                username: telegramUser.username || user.username,
                firstName: telegramUser.first_name || user.firstName,
                photoUrl: telegramUser.photo_url || user.photoUrl
            });
        }

        // 恢复体力
        user = await this.recoverEnergy(user);

        this.currentUser = user;
        this.updateUI();
    }

    async recoverEnergy(user) {
        const now = Date.now();
        const timeDiff = now - user.lastEnergyUpdate;
        const energyToRecover = Math.floor(timeDiff / CONFIG.GAME.ENERGY_RECOVERY_TIME);

        if (energyToRecover > 0 && user.energy < CONFIG.GAME.ENERGY_MAX) {
            const newEnergy = Math.min(user.energy + energyToRecover, CONFIG.GAME.ENERGY_MAX);
            return await window.dbManager.updateUser(user.id, {
                energy: newEnergy,
                lastEnergyUpdate: now
            });
        }

        return user;
    }

    startEnergyTimer() {
        // 清除已存在的定时器
        if (this.energyTimer) {
            clearInterval(this.energyTimer);
        }

        // 每分钟检查一次体力恢复
        this.energyTimer = setInterval(async () => {
            if (this.currentUser && this.currentUser.energy < CONFIG.GAME.ENERGY_MAX) {
                this.currentUser = await this.recoverEnergy(this.currentUser);
                this.updateUI();
            }
        }, 60000); // 每60秒检查一次
    }

    async processInviteCode(inviteCode, newUserId) {
        try {
            // 这里应该通过API验证邀请码并处理邀请关系
            const response = await fetch(`${CONFIG.API.BASE_URL}/invite/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode, newUserId })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log('Invite code processed successfully:', result);
                }
            }
        } catch (error) {
            console.error('Failed to process invite code:', error);
        }
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 添加万花币
    async addCoins(amount, reason = '') {
        if (!this.currentUser) return false;

        try {
            const newCoins = this.currentUser.coins + amount;
            this.currentUser = await window.dbManager.updateUser(this.currentUser.id, {
                coins: newCoins
            });

            this.updateUI();

            // 播放金币音效
            this.playCoinSound();

            // 触发金币变化事件
            document.dispatchEvent(new CustomEvent('coins:changed', {
                detail: {
                    amount,
                    newTotal: newCoins,
                    reason
                }
            }));

            console.log(`Added ${amount} coins. New total: ${newCoins}. Reason: ${reason}`);
            return true;

        } catch (error) {
            console.error('Failed to add coins:', error);
            return false;
        }
    }

    // 扣除万花币
    async spendCoins(amount, reason = '') {
        if (!this.currentUser || this.currentUser.coins < amount) {
            return false;
        }

        try {
            const newCoins = this.currentUser.coins - amount;
            this.currentUser = await window.dbManager.updateUser(this.currentUser.id, {
                coins: newCoins
            });

            this.updateUI();

            // 触发金币变化事件
            document.dispatchEvent(new CustomEvent('coins:changed', {
                detail: {
                    amount: -amount,
                    newTotal: newCoins,
                    reason
                }
            }));

            console.log(`Spent ${amount} coins. New total: ${newCoins}. Reason: ${reason}`);
            return true;

        } catch (error) {
            console.error('Failed to spend coins:', error);
            return false;
        }
    }

    // 消耗体力
    async consumeEnergy(amount = CONFIG.GAME.ENERGY_COST_PER_GAME) {
        if (!this.currentUser || this.currentUser.energy < amount) {
            return false;
        }

        try {
            const newEnergy = this.currentUser.energy - amount;
            this.currentUser = await window.dbManager.updateUser(this.currentUser.id, {
                energy: newEnergy,
                lastEnergyUpdate: Date.now()
            });

            this.updateUI();
            return true;

        } catch (error) {
            console.error('Failed to consume energy:', error);
            return false;
        }
    }

    // 增加经验值
    async addExperience(exp) {
        if (!this.currentUser) return false;

        try {
            const currentExp = this.currentUser.experience + exp;
            const requiredExp = this.getRequiredExperience(this.currentUser.level);

            let newLevel = this.currentUser.level;
            let remainingExp = currentExp;

            // 检查是否升级
            while (remainingExp >= this.getRequiredExperience(newLevel)) {
                remainingExp -= this.getRequiredExperience(newLevel);
                newLevel++;
            }

            // 升级奖励
            if (newLevel > this.currentUser.level) {
                const levelDiff = newLevel - this.currentUser.level;
                const coinReward = levelDiff * 100; // 每升一级奖励100万花币

                this.currentUser = await window.dbManager.updateUser(this.currentUser.id, {
                    level: newLevel,
                    experience: remainingExp,
                    coins: this.currentUser.coins + coinReward
                });

                // 显示升级提示
                this.showLevelUpNotification(newLevel, coinReward);
            } else {
                this.currentUser = await window.dbManager.updateUser(this.currentUser.id, {
                    experience: remainingExp
                });
            }

            this.updateUI();
            return true;

        } catch (error) {
            console.error('Failed to add experience:', error);
            return false;
        }
    }

    // 获取升级所需经验值
    getRequiredExperience(level) {
        return level * 1000; // 每级需要1000 * 等级的经验值
    }

    // 添加道具
    async addTool(toolType, count = 1) {
        if (!this.currentUser) return false;

        try {
            const tools = { ...this.currentUser.tools };
            tools[toolType] = (tools[toolType] || 0) + count;

            this.currentUser = await window.dbManager.updateUser(this.currentUser.id, {
                tools
            });

            this.updateUI();
            return true;

        } catch (error) {
            console.error('Failed to add tool:', error);
            return false;
        }
    }

    // 使用道具
    async useTool(toolType) {
        if (!this.currentUser || !this.currentUser.tools[toolType] || this.currentUser.tools[toolType] <= 0) {
            return false;
        }

        try {
            const tools = { ...this.currentUser.tools };
            tools[toolType]--;

            this.currentUser = await window.dbManager.updateUser(this.currentUser.id, {
                tools
            });

            this.updateUI();
            return true;

        } catch (error) {
            console.error('Failed to use tool:', error);
            return false;
        }
    }

    // 更新总分
    async updateTotalScore(score) {
        if (!this.currentUser) return false;

        try {
            const newTotalScore = Math.max(this.currentUser.totalScore, score);
            this.currentUser = await window.dbManager.updateUser(this.currentUser.id, {
                totalScore: newTotalScore,
                gamesPlayed: this.currentUser.gamesPlayed + 1
            });

            return true;
        } catch (error) {
            console.error('Failed to update total score:', error);
            return false;
        }
    }

    // 更新UI
    updateUI() {
        if (!this.currentUser) return;

        // 更新用户信息
        const usernameEl = document.getElementById('username');
        const userLevelEl = document.getElementById('user-level');
        const userAvatarEl = document.getElementById('user-avatar');
        const coinCountEl = document.getElementById('coin-count');
        const energyCountEl = document.getElementById('energy-count');
        const energyFillEl = document.getElementById('energy-fill');

        if (usernameEl) {
            usernameEl.textContent = this.currentUser.firstName || this.currentUser.username || '玩家';
        }

        if (userLevelEl) {
            userLevelEl.textContent = this.currentUser.level;
        }

        if (userAvatarEl) {
            userAvatarEl.src = this.currentUser.photoUrl || 'images/default-avatar.png';
        }

        if (coinCountEl) {
            coinCountEl.textContent = this.formatNumber(this.currentUser.coins);
        }

        if (energyCountEl) {
            energyCountEl.textContent = this.currentUser.energy;
        }

        if (energyFillEl) {
            const energyPercent = (this.currentUser.energy / CONFIG.GAME.ENERGY_MAX) * 100;
            energyFillEl.style.width = `${energyPercent}%`;
        }

        // 更新道具数量
        Object.keys(CONFIG.TOOLS).forEach(toolType => {
            const countEl = document.getElementById(`${toolType.toLowerCase()}-count`);
            if (countEl) {
                countEl.textContent = this.currentUser.tools[toolType] || 0;
            }
        });
    }

    // 格式化数字显示
    formatNumber(num) {
        if (num >= 10000) {
            return (num / 10000).toFixed(1) + '万';
        }
        return num.toString();
    }

    // 播放金币音效
    playCoinSound() {
        try {
            const audio = document.getElementById('coin-sound');
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(() => {}); // 忽略播放失败
            }
        } catch (error) {
            // 忽略音效播放错误
        }
    }

    // 显示升级通知
    showLevelUpNotification(newLevel, coinReward) {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <h3>🎉 恭喜升级！</h3>
                <p>您已升到 <strong>${newLevel}</strong> 级！</p>
                <p>获得奖励：<span style="color: #ffa500">${coinReward} ${CONFIG.CURRENCY.NAME}</span></p>
            </div>
        `;

        document.body.appendChild(notification);

        // 添加动画样式
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            animation: levelUpShow 0.5s ease;
        `;

        // 3秒后移除通知
        setTimeout(() => {
            notification.style.animation = 'levelUpHide 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // 触觉反馈
        window.telegramApp.hapticFeedback('success');
    }

    // 获取用户统计数据
    async getUserStats() {
        if (!this.currentUser) return null;
        return await window.dbManager.getUserStats(this.currentUser.id);
    }

    // 获取邀请码
    getInviteCode() {
        return this.currentUser?.inviteCode || '';
    }

    // 检查体力是否足够
    hasEnoughEnergy(required = CONFIG.GAME.ENERGY_COST_PER_GAME) {
        return this.currentUser && this.currentUser.energy >= required;
    }

    // 获取下次体力恢复时间
    getNextEnergyRecoveryTime() {
        if (!this.currentUser || this.currentUser.energy >= CONFIG.GAME.ENERGY_MAX) {
            return null;
        }

        const timeSinceLastUpdate = Date.now() - this.currentUser.lastEnergyUpdate;
        const timeToNextRecovery = CONFIG.GAME.ENERGY_RECOVERY_TIME - (timeSinceLastUpdate % CONFIG.GAME.ENERGY_RECOVERY_TIME);

        return timeToNextRecovery;
    }

    // 销毁定时器
    destroy() {
        if (this.energyTimer) {
            clearInterval(this.energyTimer);
            this.energyTimer = null;
        }
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes levelUpShow {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes levelUpHide {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(style);

// 全局用户管理器实例
window.userManager = new UserManager();