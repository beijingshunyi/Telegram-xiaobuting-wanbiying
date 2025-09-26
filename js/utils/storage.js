/**
 * 本地存储管理工具类
 * 负责游戏数据的保存和读取
 */

class StorageManager {
    constructor() {
        this.prefix = 'xiaobuting_game_';
        this.version = '1.0.0';
        console.log('💾 StorageManager initialized');
    }

    // 保存数据
    setItem(key, value) {
        try {
            const fullKey = this.prefix + key;
            const data = {
                value: value,
                timestamp: Date.now(),
                version: this.version
            };
            localStorage.setItem(fullKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('❌ Failed to save to localStorage:', error);
            return false;
        }
    }

    // 读取数据
    getItem(key, defaultValue = null) {
        try {
            const fullKey = this.prefix + key;
            const stored = localStorage.getItem(fullKey);

            if (!stored) {
                return defaultValue;
            }

            const data = JSON.parse(stored);
            return data.value !== undefined ? data.value : defaultValue;
        } catch (error) {
            console.error('❌ Failed to read from localStorage:', error);
            return defaultValue;
        }
    }

    // 删除数据
    removeItem(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('❌ Failed to remove from localStorage:', error);
            return false;
        }
    }

    // 清空所有游戏数据
    clear() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('❌ Failed to clear localStorage:', error);
            return false;
        }
    }

    // 获取所有游戏数据的键
    getAllKeys() {
        try {
            return Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .map(key => key.replace(this.prefix, ''));
        } catch (error) {
            console.error('❌ Failed to get keys from localStorage:', error);
            return [];
        }
    }

    // 获取存储使用情况
    getStorageInfo() {
        try {
            let totalSize = 0;
            let gameSize = 0;
            let gameKeys = 0;

            for (let key in localStorage) {
                const value = localStorage.getItem(key);
                const size = new Blob([value]).size;
                totalSize += size;

                if (key.startsWith(this.prefix)) {
                    gameSize += size;
                    gameKeys++;
                }
            }

            return {
                totalSize: totalSize,
                gameSize: gameSize,
                gameKeys: gameKeys,
                maxSize: 5 * 1024 * 1024, // 大多数浏览器限制约5MB
                usage: (gameSize / (5 * 1024 * 1024)) * 100
            };
        } catch (error) {
            console.error('❌ Failed to get storage info:', error);
            return null;
        }
    }

    // 检查localStorage是否可用
    isAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('⚠️ localStorage not available:', error);
            return false;
        }
    }

    // 导出游戏数据
    exportGameData() {
        try {
            const gameData = {};
            this.getAllKeys().forEach(key => {
                gameData[key] = this.getItem(key);
            });

            return {
                data: gameData,
                timestamp: Date.now(),
                version: this.version
            };
        } catch (error) {
            console.error('❌ Failed to export game data:', error);
            return null;
        }
    }

    // 导入游戏数据
    importGameData(exportedData) {
        try {
            if (!exportedData || !exportedData.data) {
                throw new Error('Invalid data format');
            }

            // 清空现有数据
            this.clear();

            // 导入新数据
            Object.entries(exportedData.data).forEach(([key, value]) => {
                this.setItem(key, value);
            });

            console.log('✅ Game data imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to import game data:', error);
            return false;
        }
    }

    // 自动备份
    createBackup() {
        try {
            const backup = this.exportGameData();
            if (backup) {
                this.setItem('_backup_' + Date.now(), backup);

                // 只保留最近5个备份
                const backupKeys = this.getAllKeys()
                    .filter(key => key.startsWith('_backup_'))
                    .sort()
                    .reverse();

                if (backupKeys.length > 5) {
                    backupKeys.slice(5).forEach(key => {
                        this.removeItem(key);
                    });
                }

                console.log('💾 Game data backup created');
                return true;
            }
        } catch (error) {
            console.error('❌ Failed to create backup:', error);
        }
        return false;
    }

    // 恢复最近备份
    restoreLatestBackup() {
        try {
            const backupKeys = this.getAllKeys()
                .filter(key => key.startsWith('_backup_'))
                .sort()
                .reverse();

            if (backupKeys.length > 0) {
                const latestBackup = this.getItem(backupKeys[0]);
                if (this.importGameData(latestBackup)) {
                    console.log('✅ Game data restored from backup');
                    return true;
                }
            }
        } catch (error) {
            console.error('❌ Failed to restore backup:', error);
        }
        return false;
    }
}

// 创建全局实例
window.storageManager = new StorageManager();
console.log('💾 Storage utilities loaded');