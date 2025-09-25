// 游戏目标和倒计时系统
class GameObjectives {
    constructor() {
        this.currentObjectives = [];
        this.timeLeft = 0;
        this.timerInterval = null;
        this.stepTimer = null;
        this.stepTimeLimit = 10; // 每步时间限制（秒）
        this.stepTimeLeft = this.stepTimeLimit;
        this.gameStartTime = 0;
        this.isTimerActive = false;
    }

    // 初始化关卡目标
    initLevel(level) {
        this.currentObjectives = this.generateObjectives(level);
        this.timeLeft = this.calculateTimeLimit(level);
        this.stepTimeLeft = this.stepTimeLimit;
        this.gameStartTime = Date.now();

        this.updateObjectiveDisplay();
        this.startTimer();
        this.startStepTimer();
    }

    // 生成关卡目标
    generateObjectives(level) {
        const objectives = [];
        const fruitTypes = Object.keys(FRUIT_DATA).map(key => parseInt(key));

        // 根据关卡难度生成不同目标
        const baseCount = Math.min(15 + level * 2, 30);
        const numObjectives = Math.min(1 + Math.floor(level / 3), 3);

        for (let i = 0; i < numObjectives; i++) {
            const fruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
            const fruitData = FRUIT_DATA[fruitType];

            objectives.push({
                type: 'collect',
                fruitType: fruitType,
                fruitName: fruitData.name,
                fruitEmoji: fruitData.emoji,
                target: Math.floor(baseCount * (0.8 + Math.random() * 0.4)),
                current: 0,
                completed: false
            });
        }

        return objectives;
    }

    // 计算关卡时间限制
    calculateTimeLimit(level) {
        const baseTime = 180; // 3分钟基础时间
        const timeIncrease = Math.min(level * 15, 300); // 每关增加15秒，最多5分钟
        return baseTime + timeIncrease;
    }

    // 开始游戏计时器
    startTimer() {
        this.isTimerActive = true;
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimeDisplay();

            if (this.timeLeft <= 0) {
                this.onTimeUp();
            } else if (this.timeLeft <= 30) {
                // 时间不足30秒时闪烁警告
                this.showTimeWarning();
            }
        }, 1000);
    }

    // 开始步数计时器
    startStepTimer() {
        this.stepTimer = setInterval(() => {
            this.stepTimeLeft--;
            this.updateStepTimeDisplay();

            if (this.stepTimeLeft <= 0) {
                this.onStepTimeUp();
            }
        }, 1000);
    }

    // 重置步数计时器
    resetStepTimer() {
        this.stepTimeLeft = this.stepTimeLimit;
        this.updateStepTimeDisplay();
    }

    // 停止所有计时器
    stopTimers() {
        this.isTimerActive = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        if (this.stepTimer) {
            clearInterval(this.stepTimer);
            this.stepTimer = null;
        }
    }

    // 更新消除进度
    updateProgress(fruitType, count = 1) {
        let hasUpdate = false;

        this.currentObjectives.forEach(objective => {
            if (objective.type === 'collect' && objective.fruitType === fruitType && !objective.completed) {
                objective.current = Math.min(objective.current + count, objective.target);
                if (objective.current >= objective.target) {
                    objective.completed = true;
                    this.showObjectiveCompleted(objective);
                }
                hasUpdate = true;
            }
        });

        if (hasUpdate) {
            this.updateObjectiveDisplay();
            this.checkLevelCompleted();
        }
    }

    // 检查关卡是否完成
    checkLevelCompleted() {
        const allCompleted = this.currentObjectives.every(obj => obj.completed);
        if (allCompleted) {
            this.onLevelCompleted();
        }
    }

    // 检查是否还有可消除的方块
    checkPossibleMoves(grid) {
        const gridSize = grid.length;

        // 检查水平和垂直相邻位置
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const currentType = grid[row][col];
                if (currentType === BLOCK_TYPES.EMPTY) continue;

                // 检查右侧交换
                if (col < gridSize - 1) {
                    const rightType = grid[row][col + 1];
                    if (this.wouldCreateMatch(grid, row, col, row, col + 1)) {
                        return true;
                    }
                }

                // 检查下方交换
                if (row < gridSize - 1) {
                    const downType = grid[row + 1][col];
                    if (this.wouldCreateMatch(grid, row, col, row + 1, col)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // 检查交换是否会产生匹配
    wouldCreateMatch(grid, row1, col1, row2, col2) {
        // 模拟交换
        const temp = grid[row1][col1];
        grid[row1][col1] = grid[row2][col2];
        grid[row2][col2] = temp;

        // 检查是否有匹配
        const hasMatch = this.checkMatches(grid, row1, col1) || this.checkMatches(grid, row2, col2);

        // 恢复原状
        grid[row2][col2] = grid[row1][col1];
        grid[row1][col1] = temp;

        return hasMatch;
    }

    // 检查指定位置是否有匹配
    checkMatches(grid, row, col) {
        const type = grid[row][col];
        if (type === BLOCK_TYPES.EMPTY) return false;

        // 检查水平匹配
        let horizontalCount = 1;
        // 向左检查
        for (let c = col - 1; c >= 0 && grid[row][c] === type; c--) horizontalCount++;
        // 向右检查
        for (let c = col + 1; c < grid.length && grid[row][c] === type; c++) horizontalCount++;

        if (horizontalCount >= 3) return true;

        // 检查垂直匹配
        let verticalCount = 1;
        // 向上检查
        for (let r = row - 1; r >= 0 && grid[r][col] === type; r--) verticalCount++;
        // 向下检查
        for (let r = row + 1; r < grid.length && grid[r][col] === type; r++) verticalCount++;

        return verticalCount >= 3;
    }

    // 触发自动洗牌
    triggerAutoShuffle() {
        if (window.gameEngine) {
            console.log('没有可消除的方块，自动洗牌...');
            window.gameEngine.shuffleBlocks();

            if (window.uiManager) {
                window.uiManager.showNotification('没有可消除的方块，自动洗牌！', 'info', 2000);
            }
        }
    }

    // 更新目标显示
    updateObjectiveDisplay() {
        const objectiveList = document.getElementById('objective-list');
        if (!objectiveList) return;

        objectiveList.innerHTML = '';

        this.currentObjectives.forEach(objective => {
            const item = document.createElement('div');
            item.className = `objective-item ${objective.completed ? 'completed' : ''}`;

            const progressPercent = Math.floor((objective.current / objective.target) * 100);

            item.innerHTML = `
                <span class="objective-icon">${objective.fruitEmoji}</span>
                <span class="objective-text">消除 ${objective.target} 个${objective.fruitName}</span>
                <span class="objective-progress">${objective.current}/${objective.target}</span>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
            `;

            objectiveList.appendChild(item);
        });
    }

    // 更新时间显示
    updateTimeDisplay() {
        const timeElement = document.getElementById('time-left');
        if (timeElement) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            if (this.timeLeft <= 30) {
                timeElement.parentElement.classList.add('warning');
            }
        }
    }

    // 更新步数计时显示
    updateStepTimeDisplay() {
        // 在游戏界面显示步数倒计时
        const stepTimeElement = document.getElementById('step-time');
        if (stepTimeElement) {
            stepTimeElement.textContent = this.stepTimeLeft;

            if (this.stepTimeLeft <= 3) {
                stepTimeElement.classList.add('urgent');
            } else {
                stepTimeElement.classList.remove('urgent');
            }
        }
    }

    // 显示时间警告
    showTimeWarning() {
        const timeElement = document.getElementById('time-left');
        if (timeElement && this.timeLeft % 2 === 0) {
            timeElement.style.color = '#FF4757';
            timeElement.style.animation = 'pulse 0.5s ease-in-out';
        }
    }

    // 显示目标完成动画
    showObjectiveCompleted(objective) {
        if (window.uiManager) {
            window.uiManager.showNotification(
                `🎉 完成目标：消除${objective.target}个${objective.fruitName}！`,
                'success',
                3000
            );
        }
    }

    // 时间用完
    onTimeUp() {
        this.stopTimers();
        if (window.gameEngine) {
            window.gameEngine.gameOver('时间到！');
        }
    }

    // 步数时间用完
    onStepTimeUp() {
        this.stopTimers();
        if (window.gameEngine) {
            window.gameEngine.gameOver('步数超时！每步需要在10秒内完成');
        }
    }

    // 关卡完成
    onLevelCompleted() {
        this.stopTimers();
        if (window.gameEngine) {
            window.gameEngine.levelCompleted();
        }
    }

    // 获取关卡统计
    getLevelStats() {
        const playTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        return {
            objectives: this.currentObjectives,
            timeLeft: this.timeLeft,
            playTime: playTime,
            completed: this.currentObjectives.every(obj => obj.completed)
        };
    }
}

// 创建全局实例
window.gameObjectives = new GameObjectives();

// CSS样式
const style = document.createElement('style');
style.textContent = `
    .game-objectives {
        background: rgba(255, 255, 255, 0.9);
        border-radius: var(--border-radius-lg);
        padding: 15px;
        margin-bottom: 15px;
        box-shadow: var(--cute-shadow);
    }

    .objective-title {
        font-size: 16px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 10px;
        color: var(--text-primary);
    }

    .objective-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px;
        border-radius: var(--border-radius-md);
        margin-bottom: 5px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .objective-item.completed {
        background: linear-gradient(135deg, #d4edda, #c3e6cb);
        color: #155724;
    }

    .objective-icon {
        font-size: 20px;
        width: 30px;
        text-align: center;
    }

    .objective-text {
        flex: 1;
        font-size: 14px;
        font-weight: 600;
    }

    .objective-progress {
        font-size: 12px;
        font-weight: bold;
        padding: 2px 8px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.1);
    }

    .progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: rgba(0, 0, 0, 0.1);
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #28a745, #20c997);
        transition: width 0.5s ease;
        border-radius: 3px;
    }

    .info-item.warning .info-value {
        color: #FF4757;
        animation: pulse 1s infinite;
    }

    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    .step-timer {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 50%;
        font-size: 18px;
        font-weight: bold;
        min-width: 50px;
        min-height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .step-timer.urgent {
        background: #FF4757;
        animation: shake 0.5s infinite;
    }
`;
document.head.appendChild(style);