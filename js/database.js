class DatabaseManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.initPromise = this.initialize();
    }

    async initialize() {
        try {
            // 初始化IndexedDB
            await this.initIndexedDB();

            // 检查并确保所有必要的表存在
            await this.ensureTablesExist();

            this.isInitialized = true;
            console.log('Database initialized successfully with tables:', Array.from(this.db.objectStoreNames));
        } catch (error) {
            console.error('Failed to initialize database:', error);
            // 降级到localStorage
            this.isInitialized = true;
            console.log('Falling back to localStorage');
        }
    }

    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('XiaoButingWanBiYing', 2);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 用户数据表
                if (!db.objectStoreNames.contains('users')) {
                    const userStore = db.createObjectStore('users', { keyPath: 'id' });
                    userStore.createIndex('username', 'username', { unique: false });
                    userStore.createIndex('telegramId', 'telegramId', { unique: true });
                }

                // 游戏记录表
                if (!db.objectStoreNames.contains('gameRecords')) {
                    const gameStore = db.createObjectStore('gameRecords', { keyPath: 'id', autoIncrement: true });
                    gameStore.createIndex('userId', 'userId', { unique: false });
                    gameStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // 签到记录表
                if (!db.objectStoreNames.contains('checkinRecords')) {
                    const checkinStore = db.createObjectStore('checkinRecords', { keyPath: 'id', autoIncrement: true });
                    checkinStore.createIndex('userId', 'userId', { unique: false });
                    checkinStore.createIndex('date', 'date', { unique: false });
                }

                // 提现记录表
                if (!db.objectStoreNames.contains('withdrawalRecords')) {
                    const withdrawStore = db.createObjectStore('withdrawalRecords', { keyPath: 'id', autoIncrement: true });
                    withdrawStore.createIndex('userId', 'userId', { unique: false });
                    withdrawStore.createIndex('status', 'status', { unique: false });
                }

                // 邀请关系表
                if (!db.objectStoreNames.contains('inviteRelations')) {
                    const inviteStore = db.createObjectStore('inviteRelations', { keyPath: 'id', autoIncrement: true });
                    inviteStore.createIndex('inviterId', 'inviterId', { unique: false });
                    inviteStore.createIndex('inviteeId', 'inviteeId', { unique: true });
                }

                // 成就记录表
                if (!db.objectStoreNames.contains('achievements')) {
                    const achievementStore = db.createObjectStore('achievements', { keyPath: 'id', autoIncrement: true });
                    achievementStore.createIndex('userId', 'userId', { unique: false });
                    achievementStore.createIndex('achievementId', 'achievementId', { unique: false });
                }

                // 排行榜记录表
                if (!db.objectStoreNames.contains('leaderboard')) {
                    const leaderboardStore = db.createObjectStore('leaderboard', { keyPath: 'id', autoIncrement: true });
                    leaderboardStore.createIndex('userId', 'userId', { unique: false });
                    leaderboardStore.createIndex('period', 'period', { unique: false });
                    leaderboardStore.createIndex('score', 'score', { unique: false });
                }

                // 设置/配置表
                if (!db.objectStoreNames.contains('settings')) {
                    const settingsStore = db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    // 确保所有必要的表存在
    async ensureTablesExist() {
        if (!this.db) return;

        const requiredStores = ['users', 'gameRecords', 'checkinRecords', 'withdrawalRecords', 'inviteRelations', 'achievements', 'leaderboard', 'settings'];
        const existingStores = Array.from(this.db.objectStoreNames);

        for (const storeName of requiredStores) {
            if (!existingStores.includes(storeName)) {
                console.log(`Missing object store: ${storeName}`);
                // 如果缺少表，需要重新初始化数据库
                await this.recreateDatabase();
                break;
            }
        }
    }

    // 重新创建数据库
    async recreateDatabase() {
        if (this.db) {
            this.db.close();
        }

        return new Promise((resolve, reject) => {
            const deleteReq = indexedDB.deleteDatabase('XiaoButingWanBiYing');
            deleteReq.onsuccess = async () => {
                console.log('Database deleted, recreating...');
                try {
                    await this.initIndexedDB();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            deleteReq.onerror = reject;
        });
    }

    // 用户数据操作
    async createUser(userData) {
        const user = {
            id: userData.telegramId || Date.now(),
            telegramId: userData.telegramId,
            username: userData.username || '',
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            photoUrl: userData.photo_url || 'images/default-avatar.png',
            languageCode: userData.language_code || 'zh',
            coins: 0,
            energy: CONFIG.GAME.ENERGY_MAX,
            level: 1,
            experience: 0,
            totalScore: 0,
            gamesPlayed: 0,
            lastLogin: Date.now(),
            lastEnergyUpdate: Date.now(),
            createdAt: Date.now(),
            achievements: [],
            tools: {
                hammer: 0,
                shuffle: 0,
                steps: 0,
                hint: 0
            },
            checkinStreak: 0,
            lastCheckin: null,
            inviteCode: this.generateInviteCode(),
            invitedBy: null
        };

        try {
            if (this.db) {
                await this.addRecord('users', user);
            } else {
                localStorage.setItem(`${CONFIG.STORAGE_KEYS.USER_DATA}_${user.id}`, JSON.stringify(user));
            }
            return user;
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
    }

    async getUser(userId) {
        try {
            if (this.db) {
                return await this.getRecord('users', userId);
            } else {
                const userData = localStorage.getItem(`${CONFIG.STORAGE_KEYS.USER_DATA}_${userId}`);
                return userData ? JSON.parse(userData) : null;
            }
        } catch (error) {
            console.error('Failed to get user:', error);
            return null;
        }
    }

    async updateUser(userId, updates) {
        try {
            const user = await this.getUser(userId);
            if (!user) throw new Error('User not found');

            const updatedUser = { ...user, ...updates, updatedAt: Date.now() };

            if (this.db) {
                await this.updateRecord('users', updatedUser);
            } else {
                localStorage.setItem(`${CONFIG.STORAGE_KEYS.USER_DATA}_${userId}`, JSON.stringify(updatedUser));
            }

            return updatedUser;
        } catch (error) {
            console.error('Failed to update user:', error);
            throw error;
        }
    }

    // 游戏记录操作
    async saveGameRecord(userId, gameData) {
        const record = {
            userId,
            level: gameData.level,
            score: gameData.score,
            moves: gameData.moves,
            coinsEarned: gameData.coinsEarned,
            completed: gameData.completed,
            timestamp: Date.now()
        };

        try {
            if (this.db) {
                await this.addRecord('gameRecords', record);
            } else {
                const records = this.getLocalStorageArray('gameRecords') || [];
                record.id = Date.now();
                records.push(record);
                localStorage.setItem('gameRecords', JSON.stringify(records));
            }
        } catch (error) {
            console.error('Failed to save game record:', error);
        }
    }

    async getUserGameRecords(userId, limit = 50) {
        try {
            if (this.db) {
                return await this.getRecordsByIndex('gameRecords', 'userId', userId, limit);
            } else {
                const records = this.getLocalStorageArray('gameRecords') || [];
                return records
                    .filter(record => record.userId === userId)
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, limit);
            }
        } catch (error) {
            console.error('Failed to get user game records:', error);
            return [];
        }
    }

    // 签到记录操作
    async saveCheckinRecord(userId, reward) {
        const today = new Date().toDateString();
        const record = {
            userId,
            date: today,
            reward,
            timestamp: Date.now()
        };

        try {
            if (this.db) {
                await this.addRecord('checkinRecords', record);
            } else {
                const records = this.getLocalStorageArray('checkinRecords') || [];
                record.id = Date.now();
                records.push(record);
                localStorage.setItem('checkinRecords', JSON.stringify(records));
            }
        } catch (error) {
            console.error('Failed to save checkin record:', error);
        }
    }

    async getLastCheckin(userId) {
        try {
            if (this.db) {
                const records = await this.getRecordsByIndex('checkinRecords', 'userId', userId, 1);
                return records.length > 0 ? records[0] : null;
            } else {
                const records = this.getLocalStorageArray('checkinRecords') || [];
                const userRecords = records
                    .filter(record => record.userId === userId)
                    .sort((a, b) => b.timestamp - a.timestamp);
                return userRecords.length > 0 ? userRecords[0] : null;
            }
        } catch (error) {
            console.error('Failed to get last checkin:', error);
            return null;
        }
    }

    // 提现记录操作
    async saveWithdrawalRecord(userId, withdrawalData) {
        const record = {
            userId,
            type: withdrawalData.type, // 'alipay' or 'usdt'
            amount: withdrawalData.amount,
            fee: withdrawalData.fee,
            finalAmount: withdrawalData.finalAmount,
            account: withdrawalData.account,
            realName: withdrawalData.realName,
            status: 'pending',
            timestamp: Date.now()
        };

        try {
            if (this.db) {
                await this.addRecord('withdrawalRecords', record);
            } else {
                const records = this.getLocalStorageArray('withdrawalRecords') || [];
                record.id = Date.now();
                records.push(record);
                localStorage.setItem('withdrawalRecords', JSON.stringify(records));
            }
            return record;
        } catch (error) {
            console.error('Failed to save withdrawal record:', error);
            throw error;
        }
    }

    // 邀请关系操作
    async createInviteRelation(inviterId, inviteeId, inviteCode) {
        const relation = {
            inviterId,
            inviteeId,
            inviteCode,
            timestamp: Date.now(),
            rewardClaimed: false
        };

        try {
            if (this.db) {
                await this.addRecord('inviteRelations', relation);
            } else {
                const relations = this.getLocalStorageArray('inviteRelations') || [];
                relation.id = Date.now();
                relations.push(relation);
                localStorage.setItem('inviteRelations', JSON.stringify(relations));
            }
        } catch (error) {
            console.error('Failed to create invite relation:', error);
        }
    }

    // 通用IndexedDB操作
    addRecord(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getRecord(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    updateRecord(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getRecordsByIndex(storeName, indexName, value, limit = 50) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value, limit);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 本地存储辅助方法
    getLocalStorageArray(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error(`Failed to get localStorage array for key ${key}:`, error);
            return [];
        }
    }

    // 生成邀请码
    generateInviteCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // 数据统计
    async getUserStats(userId) {
        try {
            const user = await this.getUser(userId);
            const gameRecords = await this.getUserGameRecords(userId);

            const stats = {
                totalGames: gameRecords.length,
                totalScore: gameRecords.reduce((sum, record) => sum + record.score, 0),
                averageScore: 0,
                bestScore: 0,
                totalCoinsEarned: gameRecords.reduce((sum, record) => sum + record.coinsEarned, 0),
                completedLevels: gameRecords.filter(record => record.completed).length,
                currentStreak: user?.checkinStreak || 0,
                accountAge: user ? Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)) : 0
            };

            if (stats.totalGames > 0) {
                stats.averageScore = Math.floor(stats.totalScore / stats.totalGames);
                stats.bestScore = Math.max(...gameRecords.map(record => record.score));
            }

            return stats;
        } catch (error) {
            console.error('Failed to get user stats:', error);
            return {};
        }
    }

    // 清理过期数据
    async cleanupExpiredData() {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        try {
            if (this.db) {
                // 清理30天前的游戏记录
                const transaction = this.db.transaction(['gameRecords'], 'readwrite');
                const store = transaction.objectStore('gameRecords');
                const index = store.index('timestamp');
                const range = IDBKeyRange.upperBound(thirtyDaysAgo);

                index.openCursor(range).onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    }
                };
            }
        } catch (error) {
            console.error('Failed to cleanup expired data:', error);
        }
    }
}

// 全局数据库管理器实例
window.dbManager = new DatabaseManager();