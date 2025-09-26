/**
 * 关卡选择器
 * 负责管理关卡地图界面和关卡选择
 */

class LevelSelector {
    constructor() {
        this.currentLevel = 1;
        this.maxUnlockedLevel = 1;
        this.levelContainer = null;
        this.levels = [];
        this.starsPerLevel = new Map();
        this.initialized = false;

        console.log('🎯 LevelSelector initialized');
    }

    // 初始化关卡选择器
    initialize() {
        if (this.initialized) return;

        this.levelContainer = document.querySelector('.level-grid');
        if (!this.levelContainer) {
            console.warn('⚠️ Level grid container not found');
            return;
        }

        this.loadLevelData();
        this.createLevelElements();
        this.bindEvents();
        this.initialized = true;

        console.log('✅ Level selector initialized');
    }

    // 加载关卡数据
    loadLevelData() {
        // 从本地存储加载用户进度
        const savedProgress = window.storageManager?.getItem('level_progress', {
            currentLevel: 1,
            maxUnlockedLevel: 1,
            starsPerLevel: {}
        });

        this.currentLevel = savedProgress.currentLevel || 1;
        this.maxUnlockedLevel = savedProgress.maxUnlockedLevel || 1;
        this.starsPerLevel = new Map(Object.entries(savedProgress.starsPerLevel || {}));

        console.log(`📊 Level progress loaded: current=${this.currentLevel}, max=${this.maxUnlockedLevel}`);
    }

    // 保存关卡数据
    saveLevelData() {
        if (!window.storageManager) return;

        const progressData = {
            currentLevel: this.currentLevel,
            maxUnlockedLevel: this.maxUnlockedLevel,
            starsPerLevel: Object.fromEntries(this.starsPerLevel)
        };

        window.storageManager.setItem('level_progress', progressData);
        console.log('💾 Level progress saved');
    }

    // 创建关卡元素
    createLevelElements() {
        if (!this.levelContainer) return;

        // 清空现有内容
        this.levelContainer.innerHTML = '';

        // 生成50个关卡
        for (let i = 1; i <= 50; i++) {
            const levelElement = this.createLevelElement(i);
            this.levelContainer.appendChild(levelElement);
            this.levels.push(levelElement);
        }
    }

    // 创建单个关卡元素
    createLevelElement(levelNumber) {
        const isUnlocked = levelNumber <= this.maxUnlockedLevel;
        const isCurrent = levelNumber === this.currentLevel;
        const stars = this.starsPerLevel.get(levelNumber.toString()) || 0;

        const levelDiv = document.createElement('div');
        levelDiv.className = `level-item ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`;
        levelDiv.dataset.level = levelNumber;

        // 创建星级显示
        const starsHtml = this.createStarsHtml(stars);

        levelDiv.innerHTML = `
            <div class="level-number">${levelNumber}</div>
            <div class="level-stars">${starsHtml}</div>
            ${isUnlocked ? '' : '<div class="level-lock">🔒</div>'}
            ${isCurrent ? '<div class="level-indicator">📍</div>' : ''}
        `;

        // 添加点击事件
        if (isUnlocked) {
            levelDiv.addEventListener('click', () => this.selectLevel(levelNumber));
        }

        return levelDiv;
    }

    // 创建星级HTML
    createStarsHtml(starCount) {
        let starsHtml = '';
        for (let i = 0; i < 3; i++) {
            if (i < starCount) {
                starsHtml += '<span class="star filled">⭐</span>';
            } else {
                starsHtml += '<span class="star empty">☆</span>';
            }
        }
        return starsHtml;
    }

    // 选择关卡
    selectLevel(levelNumber) {
        if (levelNumber > this.maxUnlockedLevel) {
            this.showLockedLevelMessage();
            return;
        }

        this.currentLevel = levelNumber;
        this.updateLevelDisplay();
        this.saveLevelData();

        // 播放音效
        if (window.audioManager) {
            window.audioManager.playClickSound();
        }

        // 触发关卡选择事件
        this.onLevelSelected(levelNumber);

        console.log(`🎯 Level selected: ${levelNumber}`);
    }

    // 更新关卡显示
    updateLevelDisplay() {
        this.levels.forEach((element, index) => {
            const levelNumber = index + 1;
            const isUnlocked = levelNumber <= this.maxUnlockedLevel;
            const isCurrent = levelNumber === this.currentLevel;

            element.className = `level-item ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`;

            // 更新当前关卡指示器
            const indicator = element.querySelector('.level-indicator');
            if (isCurrent && !indicator) {
                const newIndicator = document.createElement('div');
                newIndicator.className = 'level-indicator';
                newIndicator.innerHTML = '📍';
                element.appendChild(newIndicator);
            } else if (!isCurrent && indicator) {
                indicator.remove();
            }
        });
    }

    // 完成关卡
    completeLevel(levelNumber, stars = 3) {
        const currentStars = this.starsPerLevel.get(levelNumber.toString()) || 0;

        // 更新星级（取最高分）
        this.starsPerLevel.set(levelNumber.toString(), Math.max(currentStars, stars));

        // 解锁下一关
        if (levelNumber === this.maxUnlockedLevel && levelNumber < 50) {
            this.maxUnlockedLevel = levelNumber + 1;
        }

        // 自动移动到下一关
        if (levelNumber < 50) {
            this.currentLevel = levelNumber + 1;
        }

        this.updateLevelDisplay();
        this.saveLevelData();

        // 重新创建关卡元素以更新星级
        const levelElement = this.levels[levelNumber - 1];
        const newElement = this.createLevelElement(levelNumber);
        levelElement.parentNode.replaceChild(newElement, levelElement);
        this.levels[levelNumber - 1] = newElement;

        console.log(`🎉 Level ${levelNumber} completed with ${stars} stars`);
    }

    // 显示锁定关卡提示
    showLockedLevelMessage() {
        if (window.modalManager) {
            window.modalManager.showAlert({
                title: '关卡未解锁',
                message: '请先完成前面的关卡！',
                buttonText: '知道了'
            });
        }

        if (window.audioManager) {
            window.audioManager.playErrorSound();
        }
    }

    // 获取关卡配置
    getLevelConfig(levelNumber) {
        const baseConfig = {
            moves: 25,
            objectives: [
                { type: 'collect', element: 'apple', required: 15, current: 0 },
                { type: 'collect', element: 'banana', required: 12, current: 0 }
            ],
            specialElements: ['rocket', 'bomb'],
            difficulty: 'normal'
        };

        // 根据关卡调整难度
        if (levelNumber <= 10) {
            // 简单关卡
            baseConfig.moves = 30;
            baseConfig.objectives[0].required = Math.min(10, 5 + levelNumber);
            baseConfig.objectives[1].required = Math.min(8, 3 + levelNumber);
        } else if (levelNumber <= 20) {
            // 中等关卡
            baseConfig.moves = 25;
            baseConfig.objectives[0].required = Math.min(20, 10 + levelNumber);
            baseConfig.objectives[1].required = Math.min(15, 8 + levelNumber);
        } else if (levelNumber <= 30) {
            // 困难关卡
            baseConfig.moves = 22;
            baseConfig.objectives[0].required = Math.min(25, 15 + levelNumber);
            baseConfig.objectives[1].required = Math.min(20, 10 + levelNumber);
            baseConfig.difficulty = 'hard';
        } else {
            // 专家关卡
            baseConfig.moves = 20;
            baseConfig.objectives[0].required = Math.min(30, 20 + levelNumber);
            baseConfig.objectives[1].required = Math.min(25, 15 + levelNumber);
            baseConfig.difficulty = 'expert';
            baseConfig.specialElements.push('rainbow');
        }

        return baseConfig;
    }

    // 获取总星数
    getTotalStars() {
        let total = 0;
        for (const stars of this.starsPerLevel.values()) {
            total += parseInt(stars) || 0;
        }
        return total;
    }

    // 获取完成关卡数
    getCompletedLevels() {
        return this.starsPerLevel.size;
    }

    // 重置进度
    resetProgress() {
        this.currentLevel = 1;
        this.maxUnlockedLevel = 1;
        this.starsPerLevel.clear();
        this.updateLevelDisplay();
        this.saveLevelData();

        console.log('🔄 Level progress reset');
    }

    // 解锁所有关卡（调试用）
    unlockAllLevels() {
        this.maxUnlockedLevel = 50;
        this.updateLevelDisplay();
        this.saveLevelData();

        console.log('🔓 All levels unlocked');
    }

    // 绑定事件
    bindEvents() {
        // 监听关卡完成事件
        document.addEventListener('levelComplete', (event) => {
            const { level, stars } = event.detail;
            this.completeLevel(level, stars);
        });

        // 监听重置按钮
        const resetBtn = document.querySelector('.reset-progress-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (window.modalManager) {
                    window.modalManager.showConfirm({
                        title: '重置进度',
                        message: '确定要重置所有关卡进度吗？此操作不可恢复！',
                        onConfirm: () => this.resetProgress()
                    });
                }
            });
        }
    }

    // 关卡选择回调（由外部设置）
    onLevelSelected(levelNumber) {
        // 默认空实现，由外部覆盖
        console.log(`Level ${levelNumber} selected`);
    }

    // 获取当前关卡
    getCurrentLevel() {
        return this.currentLevel;
    }

    // 获取最大解锁关卡
    getMaxUnlockedLevel() {
        return this.maxUnlockedLevel;
    }

    // 检查关卡是否解锁
    isLevelUnlocked(levelNumber) {
        return levelNumber <= this.maxUnlockedLevel;
    }

    // 获取关卡星级
    getLevelStars(levelNumber) {
        return parseInt(this.starsPerLevel.get(levelNumber.toString())) || 0;
    }
}

// 创建全局实例
window.levelSelector = new LevelSelector();

console.log('🎯 Level selector utilities loaded');