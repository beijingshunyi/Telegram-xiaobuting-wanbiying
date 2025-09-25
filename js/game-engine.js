// 水果方块类型定义
const BLOCK_TYPES = {
    EMPTY: 0,
    APPLE: 1,        // 苹果 (原RED)
    ORANGE: 2,       // 橙子 (原BLUE)
    BANANA: 3,       // 香蕉 (原GREEN)
    GRAPE: 4,        // 葡萄 (原YELLOW)
    STRAWBERRY: 5,   // 草莓 (原PURPLE)
    WATERMELON: 6,   // 西瓜 (原ORANGE)
    // 特殊方块
    HORIZONTAL_STRIPED: 10,
    VERTICAL_STRIPED: 11,
    WRAPPED: 12,
    COLOR_BOMB: 13
};

// 水果表情和颜色映射
const FRUIT_DATA = {
    [BLOCK_TYPES.APPLE]: { emoji: '🍎', color: '#ff6b6b', name: '苹果' },
    [BLOCK_TYPES.ORANGE]: { emoji: '🍊', color: '#ffa726', name: '橙子' },
    [BLOCK_TYPES.BANANA]: { emoji: '🍌', color: '#ffeb3b', name: '香蕉' },
    [BLOCK_TYPES.GRAPE]: { emoji: '🍇', color: '#9c27b0', name: '葡萄' },
    [BLOCK_TYPES.STRAWBERRY]: { emoji: '🍓', color: '#e91e63', name: '草莓' },
    [BLOCK_TYPES.WATERMELON]: { emoji: '🍉', color: '#4caf50', name: '西瓜' }
};

// 保持向后兼容性
const BLOCK_COLORS = {
    [BLOCK_TYPES.APPLE]: FRUIT_DATA[BLOCK_TYPES.APPLE].color,
    [BLOCK_TYPES.ORANGE]: FRUIT_DATA[BLOCK_TYPES.ORANGE].color,
    [BLOCK_TYPES.BANANA]: FRUIT_DATA[BLOCK_TYPES.BANANA].color,
    [BLOCK_TYPES.GRAPE]: FRUIT_DATA[BLOCK_TYPES.GRAPE].color,
    [BLOCK_TYPES.STRAWBERRY]: FRUIT_DATA[BLOCK_TYPES.STRAWBERRY].color,
    [BLOCK_TYPES.WATERMELON]: FRUIT_DATA[BLOCK_TYPES.WATERMELON].color
};

class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.grid = [];
        this.gridSize = CONFIG.GAME.GRID_SIZE;
        this.cellSize = CONFIG.GAME.CELL_SIZE;
        this.score = 0;
        this.level = 1;
        this.moves = CONFIG.GAME.INITIAL_MOVES;
        this.targetScore = 1000;
        this.timeLeft = 60; // 60秒倒计时
        this.maxTimePerMove = 10; // 每步最多10秒
        this.currentMoveStartTime = null;
        this.gameTimer = null;
        this.moveTimer = null;
        this.isAnimating = false;
        this.selectedCell = null;
        this.combo = 0;
        this.particles = [];
        this.gameState = 'waiting'; // waiting, playing, paused, completed, gameover
        this.objectives = {}; // 游戏目标

        this.setupCanvas();
        this.setupEventListeners();
        this.initializeGrid();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();

        // 获取设备像素比，解决模糊问题
        const devicePixelRatio = window.devicePixelRatio || 1;

        // 优化画布大小，确保游戏板完整显示
        const containerWidth = Math.min(containerRect.width - 40, 400);
        const containerHeight = Math.min(containerRect.height - 40, 600);

        // 确保画布是正方形且足够大
        const canvasSize = Math.max(320, Math.min(containerWidth, containerHeight * 0.8));

        // 设置实际显示大小
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';

        // 设置实际像素大小（考虑设备像素比）
        this.canvas.width = canvasSize * devicePixelRatio;
        this.canvas.height = canvasSize * devicePixelRatio;

        // 缩放画布上下文以适应设备像素比
        this.ctx.scale(devicePixelRatio, devicePixelRatio);

        // 计算合适的格子大小，确保8x8网格完整显示
        this.cellSize = Math.floor(canvasSize / this.gridSize);

        // 设置画布样式
        this.canvas.style.cursor = 'pointer';
        this.canvas.style.borderRadius = '15px';
        this.canvas.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
        this.canvas.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';

        // 启用更好的渲染
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    setupEventListeners() {
        // 鼠标/触摸事件
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

        // 鼠标滑动支持
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // 触摸状态管理
        this.touchState = {
            isActive: false,
            startX: 0,
            startY: 0,
            startRow: -1,
            startCol: -1,
            currentPath: [],
            minSwipeDistance: 20,
            isMouseDown: false
        };

        // 窗口大小变化
        window.addEventListener('resize', this.setupCanvas.bind(this));
    }

    handleClick(event) {
        if (this.gameState !== 'playing' || this.isAnimating) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.processClick(x, y);
    }

    handleTouchStart(event) {
        event.preventDefault();
        if (this.gameState !== 'playing' || this.isAnimating) return;

        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // 初始化触摸状态
        this.touchState.isActive = true;
        this.touchState.startX = x;
        this.touchState.startY = y;
        this.touchState.startRow = Math.floor(y / this.cellSize);
        this.touchState.startCol = Math.floor(x / this.cellSize);
        this.touchState.currentPath = [{ row: this.touchState.startRow, col: this.touchState.startCol }];

        // 播放按钮音效和触觉反馈
        this.playSound('button');
        window.telegramApp.hapticFeedback('light');
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (!this.touchState.isActive || this.gameState !== 'playing' || this.isAnimating) return;

        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const currentRow = Math.floor(y / this.cellSize);
        const currentCol = Math.floor(x / this.cellSize);

        // 检查是否移动到了新的格子
        if (currentRow >= 0 && currentRow < this.gridSize &&
            currentCol >= 0 && currentCol < this.gridSize) {

            const lastPath = this.touchState.currentPath[this.touchState.currentPath.length - 1];

            if (lastPath.row !== currentRow || lastPath.col !== currentCol) {
                // 检查是否与起始格子相邻或是同一类型
                if (this.canAddToPath(currentRow, currentCol)) {
                    this.touchState.currentPath.push({ row: currentRow, col: currentCol });

                    // 轻微触觉反馈
                    window.telegramApp.hapticFeedback('light');
                }
            }
        }

        this.render();
    }

    handleTouchEnd(event) {
        event.preventDefault();
        if (!this.touchState.isActive) return;

        this.processTouchPath();
        this.resetTouchState();
    }

    handleMouseDown(event) {
        if (this.gameState !== 'playing' || this.isAnimating) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 初始化鼠标状态
        this.touchState.isMouseDown = true;
        this.touchState.startX = x;
        this.touchState.startY = y;
        this.touchState.startRow = Math.floor(y / this.cellSize);
        this.touchState.startCol = Math.floor(x / this.cellSize);
        this.touchState.currentPath = [{ row: this.touchState.startRow, col: this.touchState.startCol }];

        // 播放按钮音效
        this.playSound('button');
    }

    handleMouseMove(event) {
        if (!this.touchState.isMouseDown || this.gameState !== 'playing' || this.isAnimating) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const currentRow = Math.floor(y / this.cellSize);
        const currentCol = Math.floor(x / this.cellSize);

        // 检查是否移动到了新的格子
        if (currentRow >= 0 && currentRow < this.gridSize &&
            currentCol >= 0 && currentCol < this.gridSize) {

            const lastPath = this.touchState.currentPath[this.touchState.currentPath.length - 1];

            if (lastPath.row !== currentRow || lastPath.col !== currentCol) {
                // 检查是否与起始格子相邻或是同一类型
                if (this.canAddToPath(currentRow, currentCol)) {
                    this.touchState.currentPath.push({ row: currentRow, col: currentCol });
                }
            }
        }

        this.render();
    }

    handleMouseUp(event) {
        if (!this.touchState.isMouseDown) return;

        this.processTouchPath();
        this.resetTouchState();
    }

    processClick(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);

        if (col < 0 || col >= this.gridSize || row < 0 || row >= this.gridSize) {
            return;
        }

        if (this.selectedCell) {
            if (this.selectedCell.row === row && this.selectedCell.col === col) {
                // 取消选择
                this.selectedCell = null;
            } else if (this.isAdjacent(this.selectedCell, { row, col })) {
                // 尝试交换
                this.swapBlocks(this.selectedCell, { row, col });
                this.selectedCell = null;
            } else {
                // 选择新的方块
                this.selectedCell = { row, col };
            }
        } else {
            this.selectedCell = { row, col };
        }

        // 播放按钮音效
        this.playSound('button');

        // 触觉反馈
        window.telegramApp.hapticFeedback('light');

        this.render();
    }

    isAdjacent(cell1, cell2) {
        const rowDiff = Math.abs(cell1.row - cell2.row);
        const colDiff = Math.abs(cell1.col - cell2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    // 检查是否可以添加到路径中
    canAddToPath(row, col) {
        if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
            return false;
        }

        const path = this.touchState.currentPath;
        if (path.length === 0) return true;

        const startCell = path[0];
        const currentCell = { row, col };

        // 检查是否已经在路径中
        const alreadyInPath = path.some(cell => cell.row === row && cell.col === col);
        if (alreadyInPath) return false;

        // 检查是否与起始方块是同一类型
        if (this.grid[startCell.row][startCell.col] !== this.grid[row][col]) {
            return false;
        }

        // 检查是否与路径中的最后一个方块相邻
        const lastCell = path[path.length - 1];
        return this.isAdjacent(lastCell, currentCell);
    }

    // 处理触摸路径
    async processTouchPath() {
        const path = this.touchState.currentPath;

        if (path.length < 3) {
            // 路径太短，不能消除
            return;
        }

        // 检查路径中的所有方块是否为同一类型
        const startType = this.grid[path[0].row][path[0].col];
        const allSameType = path.every(cell => this.grid[cell.row][cell.col] === startType);

        if (!allSameType) {
            return;
        }

        this.isAnimating = true;

        // 减少移动次数
        this.moves--;
        this.resetMoveTimer();
        this.updateGameUI();

        // 计算得分
        const baseScore = this.calculateMatchScore(path);
        const comboMultiplier = Math.pow(CONFIG.BALANCE.COMBO_MULTIPLIER, this.combo);
        const finalScore = Math.floor(baseScore * comboMultiplier);

        this.score += finalScore;

        // 计算万花币奖励
        const coinReward = this.calculateCoinReward(path);
        if (coinReward > 0) {
            await window.userManager.addCoins(coinReward, '滑动消除奖励');
        }

        // 显示得分弹窗
        this.showScorePopup(finalScore, path[0].row, path[0].col);

        // 更新目标进度并清除方块
        path.forEach(cell => {
            if (this.objectives[startType]) {
                this.objectives[startType].current++;
            }

            // 同时更新游戏目标系统
            if (window.gameObjectives) {
                window.gameObjectives.updateProgress(startType, 1);
            }

            this.grid[cell.row][cell.col] = BLOCK_TYPES.EMPTY;
            this.createParticles(cell.col * this.cellSize + this.cellSize / 2,
                               cell.row * this.cellSize + this.cellSize / 2);
        });

        // 播放消除音效和触觉反馈（基于匹配数量）
        if (window.audioManager) {
            window.audioManager.onMatch(removedCells.length);
        } else {
            this.playSound('match');
        }
        window.telegramApp.hapticFeedback('medium');

        this.render();
        await this.sleep(300);

        // 下落方块
        await this.dropBlocks();

        // 填充新方块
        this.fillEmptySpaces();

        this.render();
        await this.sleep(300);

        // 处理连锁匹配
        await this.processMatches();

        // 检查游戏结束条件
        this.checkGameEnd();

        this.isAnimating = false;
    }

    // 重置触摸状态
    resetTouchState() {
        this.touchState.isActive = false;
        this.touchState.isMouseDown = false;
        this.touchState.startX = 0;
        this.touchState.startY = 0;
        this.touchState.startRow = -1;
        this.touchState.startCol = -1;
        this.touchState.currentPath = [];
        this.render();
    }

    async swapBlocks(cell1, cell2) {
        if (this.isAnimating) return;

        this.isAnimating = true;

        // 交换方块
        const temp = this.grid[cell1.row][cell1.col];
        this.grid[cell1.row][cell1.col] = this.grid[cell2.row][cell2.col];
        this.grid[cell2.row][cell2.col] = temp;

        // 检查是否有匹配
        const matches = this.findMatches();

        if (matches.length > 0) {
            // 有效移动
            this.moves--;
            this.resetMoveTimer(); // 重置移动计时器
            this.updateGameUI();

            // 处理匹配
            await this.processMatches();

            // 检查游戏结束条件
            this.checkGameEnd();
        } else {
            // 无效移动，交换回去
            const temp = this.grid[cell1.row][cell1.col];
            this.grid[cell1.row][cell1.col] = this.grid[cell2.row][cell2.col];
            this.grid[cell2.row][cell2.col] = temp;

            // 检查是否需要自动洗牌
            await this.checkAutoShuffle();
        }

        this.isAnimating = false;
        this.render();
    }

    findMatches() {
        const matches = [];
        const visited = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(false));

        // 检查水平匹配
        for (let row = 0; row < this.gridSize; row++) {
            let count = 1;
            let currentType = this.grid[row][0];

            for (let col = 1; col < this.gridSize; col++) {
                if (this.grid[row][col] === currentType && currentType !== BLOCK_TYPES.EMPTY) {
                    count++;
                } else {
                    if (count >= CONFIG.GAME.MATCH_MIN_COUNT) {
                        for (let i = col - count; i < col; i++) {
                            if (!visited[row][i]) {
                                matches.push({ row, col: i, type: currentType });
                                visited[row][i] = true;
                            }
                        }
                    }
                    count = 1;
                    currentType = this.grid[row][col];
                }
            }

            // 检查行末
            if (count >= CONFIG.GAME.MATCH_MIN_COUNT) {
                for (let i = this.gridSize - count; i < this.gridSize; i++) {
                    if (!visited[row][i]) {
                        matches.push({ row, col: i, type: currentType });
                        visited[row][i] = true;
                    }
                }
            }
        }

        // 检查垂直匹配
        for (let col = 0; col < this.gridSize; col++) {
            let count = 1;
            let currentType = this.grid[0][col];

            for (let row = 1; row < this.gridSize; row++) {
                if (this.grid[row][col] === currentType && currentType !== BLOCK_TYPES.EMPTY) {
                    count++;
                } else {
                    if (count >= CONFIG.GAME.MATCH_MIN_COUNT) {
                        for (let i = row - count; i < row; i++) {
                            if (!visited[i][col]) {
                                matches.push({ row: i, col, type: currentType });
                                visited[i][col] = true;
                            }
                        }
                    }
                    count = 1;
                    currentType = this.grid[row][col];
                }
            }

            // 检查列末
            if (count >= CONFIG.GAME.MATCH_MIN_COUNT) {
                for (let i = this.gridSize - count; i < this.gridSize; i++) {
                    if (!visited[i][col]) {
                        matches.push({ row: i, col, type: currentType });
                        visited[i][col] = true;
                    }
                }
            }
        }

        return matches;
    }

    async processMatches() {
        let totalMatches = 0;

        while (true) {
            const matches = this.findMatches();
            if (matches.length === 0) break;

            totalMatches += matches.length;
            this.combo++;

            // 计算得分
            const baseScore = this.calculateMatchScore(matches);
            const comboMultiplier = Math.pow(CONFIG.BALANCE.COMBO_MULTIPLIER, this.combo - 1);
            const finalScore = Math.floor(baseScore * comboMultiplier);

            this.score += finalScore;

            // 计算万花币奖励
            const coinReward = this.calculateCoinReward(matches);
            if (coinReward > 0) {
                await window.userManager.addCoins(coinReward, '消除方块奖励');
            }

            // 显示得分弹窗
            this.showScorePopup(finalScore, matches[0].row, matches[0].col);

            // 消除匹配的方块并更新目标
            matches.forEach(match => {
                // 更新目标进度
                if (this.objectives[match.type]) {
                    this.objectives[match.type].current++;
                }

                // 同时更新游戏目标系统
                if (window.gameObjectives) {
                    window.gameObjectives.updateProgress(match.type, 1);
                }

                this.grid[match.row][match.col] = BLOCK_TYPES.EMPTY;
                this.createParticles(match.col * this.cellSize + this.cellSize / 2,
                                   match.row * this.cellSize + this.cellSize / 2);
            });

            // 播放消除音效（基于匹配数量）
            if (window.audioManager) {
                window.audioManager.onMatch(matches.length);
            } else {
                this.playSound('match');
            }

            // 触觉反馈
            window.telegramApp.hapticFeedback('medium');

            this.render();
            await this.sleep(300);

            // 下落方块
            await this.dropBlocks();

            // 填充新方块
            this.fillEmptySpaces();

            this.render();
            await this.sleep(300);
        }

        // 重置连击
        if (totalMatches > 0) {
            if (this.combo > 1) {
                this.showComboIndicator(this.combo);
            }
            this.combo = 0;
            this.updateGameUI();
        }
    }

    calculateMatchScore(matches) {
        let score = 0;
        const matchCount = matches.length;

        if (matchCount >= 3 && matchCount <= 6) {
            score = CONFIG.BALANCE.SCORE_MULTIPLIERS[matchCount] || CONFIG.BALANCE.SCORE_MULTIPLIERS[3];
        } else {
            score = CONFIG.BALANCE.SCORE_MULTIPLIERS[6] * Math.floor(matchCount / 3);
        }

        return score;
    }

    calculateCoinReward(matches) {
        const matchCount = matches.length;

        if (matchCount >= 3) {
            return CONFIG.CURRENCY.MATCH_REWARDS[matchCount] || CONFIG.CURRENCY.MATCH_REWARDS[3];
        }

        return 0;
    }

    async dropBlocks() {
        let moved = true;

        while (moved) {
            moved = false;

            for (let col = 0; col < this.gridSize; col++) {
                for (let row = this.gridSize - 2; row >= 0; row--) {
                    if (this.grid[row][col] !== BLOCK_TYPES.EMPTY &&
                        this.grid[row + 1][col] === BLOCK_TYPES.EMPTY) {

                        // 向下移动方块
                        this.grid[row + 1][col] = this.grid[row][col];
                        this.grid[row][col] = BLOCK_TYPES.EMPTY;
                        moved = true;
                    }
                }
            }

            if (moved) {
                this.render();
                await this.sleep(100);
            }
        }
    }

    fillEmptySpaces() {
        for (let col = 0; col < this.gridSize; col++) {
            for (let row = 0; row < this.gridSize; row++) {
                if (this.grid[row][col] === BLOCK_TYPES.EMPTY) {
                    this.grid[row][col] = this.getRandomBlockType();
                }
            }
        }
    }

    getRandomBlockType() {
        const normalTypes = [
            BLOCK_TYPES.APPLE,
            BLOCK_TYPES.ORANGE,
            BLOCK_TYPES.BANANA,
            BLOCK_TYPES.GRAPE,
            BLOCK_TYPES.STRAWBERRY,
            BLOCK_TYPES.WATERMELON
        ];

        return normalTypes[Math.floor(Math.random() * normalTypes.length)];
    }

    initializeGrid() {
        this.grid = [];

        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = this.getRandomBlockType();
            }
        }

        // 确保初始状态没有匹配
        this.removeInitialMatches();
    }

    removeInitialMatches() {
        let hasMatches = true;
        let attempts = 0;
        const maxAttempts = 100;

        while (hasMatches && attempts < maxAttempts) {
            hasMatches = false;
            const matches = this.findMatches();

            if (matches.length > 0) {
                hasMatches = true;
                matches.forEach(match => {
                    this.grid[match.row][match.col] = this.getRandomBlockType();
                });
            }

            attempts++;
        }
    }

    render() {
        // 获取实际画布尺寸
        const canvasSize = Math.min(this.canvas.width / (window.devicePixelRatio || 1),
                                   this.canvas.height / (window.devicePixelRatio || 1));

        // 清空画布
        this.ctx.clearRect(0, 0, canvasSize, canvasSize);

        // 绘制背景
        this.drawBackground();

        // 绘制网格
        this.drawGrid();

        // 绘制方块
        this.drawBlocks();

        // 绘制选中效果
        if (this.selectedCell) {
            this.drawSelection();
        }

        // 绘制触摸路径
        if (this.touchState.currentPath && this.touchState.currentPath.length > 0) {
            this.drawTouchPath();
        }

        // 绘制粒子效果
        this.updateAndDrawParticles();
    }

    drawBackground() {
        const canvasSize = this.cellSize * this.gridSize;
        const gradient = this.ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, canvasSize, canvasSize);
    }

    drawGrid() {
        this.ctx.strokeStyle = '#dee2e6';
        this.ctx.lineWidth = 1;
        const gridSize = this.cellSize * this.gridSize;

        for (let row = 0; row <= this.gridSize; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.cellSize);
            this.ctx.lineTo(gridSize, row * this.cellSize);
            this.ctx.stroke();
        }

        for (let col = 0; col <= this.gridSize; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.cellSize, 0);
            this.ctx.lineTo(col * this.cellSize, gridSize);
            this.ctx.stroke();
        }
    }

    drawBlocks() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const blockType = this.grid[row][col];
                if (blockType !== BLOCK_TYPES.EMPTY) {
                    this.drawBlock(row, col, blockType);
                }
            }
        }
    }

    drawBlock(row, col, blockType) {
        const x = col * this.cellSize;
        const y = row * this.cellSize;
        const padding = 3;
        const size = this.cellSize - padding * 2;

        // 绘制Q版圆形背景
        const centerX = x + this.cellSize / 2;
        const centerY = y + this.cellSize / 2;
        const radius = size / 2;

        // 渐变背景
        const gradient = this.ctx.createRadialGradient(
            centerX - radius * 0.3, centerY - radius * 0.3, 0,
            centerX, centerY, radius
        );

        const fruitColor = BLOCK_COLORS[blockType] || '#ccc';
        gradient.addColorStop(0, this.lightenColor(fruitColor, 40));
        gradient.addColorStop(1, fruitColor);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 添加光泽效果
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();

        // 绘制水果表情
        this.drawFruitEmoji(centerX, centerY, blockType);
    }

    // 绘制水果表情
    drawFruitEmoji(centerX, centerY, blockType) {
        const fruitData = FRUIT_DATA[blockType];
        if (!fruitData) return;

        const fontSize = Math.max(20, this.cellSize * 0.6);
        this.ctx.font = `${fontSize}px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = 'black';

        // 绘制水果表情
        this.ctx.fillText(fruitData.emoji, centerX, centerY);
    }

    // 颜色处理工具方法
    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    drawBlockPattern(x, y, blockType) {
        const centerX = x + this.cellSize / 2;
        const centerY = y + this.cellSize / 2;
        const radius = Math.max(1, this.cellSize / 6); // 确保半径不为负

        this.ctx.fillStyle = '#fff';
        this.ctx.globalAlpha = 0.8;

        switch (blockType) {
            case BLOCK_TYPES.RED:
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            case BLOCK_TYPES.BLUE:
                this.ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
                break;

            case BLOCK_TYPES.GREEN:
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - radius);
                this.ctx.lineTo(centerX - radius, centerY + radius);
                this.ctx.lineTo(centerX + radius, centerY + radius);
                this.ctx.closePath();
                this.ctx.fill();
                break;

            case BLOCK_TYPES.YELLOW:
                this.drawStar(centerX, centerY, radius);
                break;

            case BLOCK_TYPES.PURPLE:
                this.drawDiamond(centerX, centerY, radius);
                break;

            case BLOCK_TYPES.ORANGE:
                this.drawHeart(centerX, centerY, radius);
                break;
        }

        this.ctx.globalAlpha = 1.0;
    }

    drawStar(x, y, radius) {
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const outerRadius = radius;
            const innerRadius = radius * 0.4;

            const outerX = x + Math.cos(angle) * outerRadius;
            const outerY = y + Math.sin(angle) * outerRadius;

            const innerAngle = angle + Math.PI / 5;
            const innerX = x + Math.cos(innerAngle) * innerRadius;
            const innerY = y + Math.sin(innerAngle) * innerRadius;

            if (i === 0) {
                this.ctx.moveTo(outerX, outerY);
            } else {
                this.ctx.lineTo(outerX, outerY);
            }
            this.ctx.lineTo(innerX, innerY);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawDiamond(x, y, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - radius);
        this.ctx.lineTo(x + radius, y);
        this.ctx.lineTo(x, y + radius);
        this.ctx.lineTo(x - radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawHeart(x, y, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + radius * 0.3);
        this.ctx.bezierCurveTo(x - radius, y - radius * 0.5, x - radius * 0.5, y - radius, x, y - radius * 0.3);
        this.ctx.bezierCurveTo(x + radius * 0.5, y - radius, x + radius, y - radius * 0.5, x, y + radius * 0.3);
        this.ctx.fill();
    }

    drawSelection() {
        if (!this.selectedCell) return;

        const x = this.selectedCell.col * this.cellSize;
        const y = this.selectedCell.row * this.cellSize;

        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
        this.ctx.setLineDash([]);
    }

    drawTouchPath() {
        const path = this.touchState.currentPath;
        if (!path || path.length === 0) return;

        // 绘制路径连接线
        if (path.length > 1) {
            this.ctx.strokeStyle = '#4ecdc4';
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.setLineDash([]);

            this.ctx.beginPath();
            const firstCell = path[0];
            const firstX = firstCell.col * this.cellSize + this.cellSize / 2;
            const firstY = firstCell.row * this.cellSize + this.cellSize / 2;
            this.ctx.moveTo(firstX, firstY);

            for (let i = 1; i < path.length; i++) {
                const cell = path[i];
                const x = cell.col * this.cellSize + this.cellSize / 2;
                const y = cell.row * this.cellSize + this.cellSize / 2;
                this.ctx.lineTo(x, y);
            }
            this.ctx.stroke();
        }

        // 高亮路径中的方块
        path.forEach((cell, index) => {
            const x = cell.col * this.cellSize;
            const y = cell.row * this.cellSize;

            // 不同的高亮效果
            if (index === 0) {
                // 起始方块 - 绿色边框
                this.ctx.strokeStyle = '#48c78e';
                this.ctx.lineWidth = 4;
                this.ctx.setLineDash([]);
                this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
            } else {
                // 路径方块 - 蓝色边框
                this.ctx.strokeStyle = '#4ecdc4';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([]);
                this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
            }

            // 添加半透明覆盖层
            this.ctx.fillStyle = index === 0 ? 'rgba(72, 199, 142, 0.2)' : 'rgba(78, 205, 196, 0.2)';
            this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
        });
    }

    createParticles(x, y) {
        const particleCount = 8;
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#ffa726', '#ab47bc', '#ff7043'];

        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                decay: 0.02,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    updateAndDrawParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            particle.vy += 0.2; // 重力效果

            if (particle.life > 0) {
                this.ctx.globalAlpha = particle.life;
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
                this.ctx.globalAlpha = 1.0;
                return true;
            }
            return false;
        });
    }

    showScorePopup(score, row, col) {
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${score}`;

        const rect = this.canvas.getBoundingClientRect();
        const x = rect.left + col * this.cellSize + this.cellSize / 2;
        const y = rect.top + row * this.cellSize + this.cellSize / 2;

        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;

        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 1500);
    }

    showComboIndicator(combo) {
        const indicator = document.createElement('div');
        indicator.className = 'combo-indicator';
        indicator.textContent = `${combo}x 连击!`;

        const rect = this.canvas.getBoundingClientRect();
        indicator.style.left = `${rect.left + this.canvas.width / 2}px`;
        indicator.style.top = `${rect.top + this.canvas.height * 0.2}px`;

        document.body.appendChild(indicator);

        setTimeout(() => indicator.remove(), 800);
    }

    playSound(soundType) {
        try {
            if (window.audioManager) {
                // 映射游戏引擎的音效名称到AudioManager的方法
                switch(soundType) {
                    case 'match':
                        window.audioManager.onMatch(1);
                        break;
                    case 'button':
                        window.audioManager.onButtonClick();
                        break;
                    case 'level-complete':
                        window.audioManager.onLevelComplete();
                        break;
                    case 'game-over':
                        window.audioManager.onGameOver();
                        break;
                    case 'shuffle':
                        window.audioManager.onShuffle();
                        break;
                    case 'coin':
                        window.audioManager.onCoinEarned();
                        break;
                    default:
                        // 尝试直接播放音效
                        window.audioManager.playSound(soundType);
                        break;
                }
            } else {
                // 备用方案：直接使用HTML音频元素
                const audio = document.getElementById(`${soundType}-sound`);
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(() => {});
                }
            }
        } catch (error) {
            console.warn('Failed to play sound:', soundType, error);
        }
    }

    updateGameUI() {
        document.getElementById('game-score').textContent = this.score;
        document.getElementById('game-level').textContent = this.level;
        document.getElementById('moves-left').textContent = this.moves;
        document.getElementById('time-left').textContent = this.timeLeft;

        // 更新游戏目标进度
        this.updateObjectivesUI();

        // 时间警告
        if (this.timeLeft <= 10) {
            document.getElementById('time-left').style.color = '#ff4757';
            document.getElementById('time-left').style.animation = 'blink 1s infinite';
        } else {
            document.getElementById('time-left').style.color = '#333';
            document.getElementById('time-left').style.animation = 'none';
        }
    }

    updateObjectivesUI() {
        const objectiveList = document.getElementById('objective-list');
        if (!objectiveList) return;

        let html = '';
        Object.entries(this.objectives).forEach(([fruitType, data]) => {
            const fruitData = FRUIT_DATA[parseInt(fruitType)];
            if (fruitData) {
                const progress = data.current;
                const target = data.target;
                const completed = progress >= target;

                html += `
                    <div class="objective-item ${completed ? 'completed' : ''}">
                        <span class="objective-icon">${fruitData.emoji}</span>
                        <span class="objective-text">消除 ${target} 个${fruitData.name}</span>
                        <span class="objective-progress">${Math.min(progress, target)}/${target}</span>
                    </div>
                `;
            }
        });

        objectiveList.innerHTML = html;
    }

    checkGameEnd() {
        // 检查时间是否用完
        if (this.timeLeft <= 0) {
            this.gameState = 'gameover';
            this.onGameOver();
            return;
        }

        // 检查步数是否用完
        if (this.moves <= 0) {
            if (this.checkObjectivesCompleted()) {
                this.gameState = 'completed';
                this.onLevelComplete();
            } else {
                this.gameState = 'gameover';
                this.onGameOver();
            }
            return;
        }

        // 检查目标是否完成
        if (this.checkObjectivesCompleted() || (window.gameObjectives && window.gameObjectives.currentObjectives.every(obj => obj.completed))) {
            this.gameState = 'completed';
            this.onLevelComplete();
        }
    }

    checkObjectivesCompleted() {
        return Object.values(this.objectives).every(objective =>
            objective.current >= objective.target
        );
    }

    async onLevelComplete() {
        // 计算奖励
        const baseReward = this.level * 50;
        const scoreBonus = Math.floor(this.score / 1000) * 10;
        const movesBonus = this.moves * 5;
        const totalReward = baseReward + scoreBonus + movesBonus;

        // 给用户奖励
        await window.userManager.addCoins(totalReward, `完成第${this.level}关奖励`);
        await window.userManager.addExperience(this.level * 100);
        await window.userManager.updateTotalScore(this.score);

        // 保存游戏记录
        await window.dbManager.saveGameRecord(window.userManager.getCurrentUser().id, {
            level: this.level,
            score: this.score,
            moves: this.moves,
            coinsEarned: totalReward,
            completed: true
        });

        // 显示完成界面
        this.showLevelCompleteScreen(totalReward);

        // 播放完成音效
        this.playSound('level-complete');

        // 触觉反馈
        window.telegramApp.hapticFeedback('success');
    }

    async onGameOver() {
        // 保存游戏记录
        await window.dbManager.saveGameRecord(window.userManager.getCurrentUser().id, {
            level: this.level,
            score: this.score,
            moves: 0,
            coinsEarned: 0,
            completed: false
        });

        // 显示游戏结束界面
        this.showGameOverScreen();

        // 播放游戏结束音效
        this.playSound('game-over');

        // 触觉反馈
        window.telegramApp.hapticFeedback('error');
    }

    showLevelCompleteScreen(reward) {
        const modal = document.createElement('div');
        modal.className = 'level-complete';
        modal.innerHTML = `
            <h3>🎉 关卡完成！</h3>
            <div class="star-rating">
                <span class="star active">⭐</span>
                <span class="star active">⭐</span>
                <span class="star active">⭐</span>
            </div>
            <div class="level-stats">
                <div>得分: ${this.score}</div>
                <div>剩余步数: ${this.moves}</div>
                <div>奖励: ${reward} ${CONFIG.CURRENCY.NAME}</div>
            </div>
            <div class="reward-info">
                <p>恭喜通过第 ${this.level} 关！</p>
            </div>
            <button onclick="window.gameEngine.nextLevel()">下一关</button>
            <button onclick="window.gameEngine.backToMenu()">返回菜单</button>
        `;

        document.getElementById('game-canvas-container').appendChild(modal);
    }

    showGameOverScreen() {
        const modal = document.createElement('div');
        modal.className = 'game-over';
        modal.innerHTML = `
            <h3>💔 游戏结束</h3>
            <div class="level-stats">
                <div>最终得分: ${this.score}</div>
                <div>目标得分: ${this.targetScore}</div>
                <div>达成率: ${Math.floor((this.score / this.targetScore) * 100)}%</div>
            </div>
            <button onclick="window.gameEngine.restartLevel()">重新开始</button>
            <button onclick="window.gameEngine.backToMenu()">返回菜单</button>
        `;

        document.getElementById('game-canvas-container').appendChild(modal);
    }

    showTimeUpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-container time-up-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>⏰ 时间到！</h2>
                </div>
                <div class="modal-body">
                    <div class="time-up-content">
                        <div class="time-up-icon">⏰</div>
                        <h3>游戏结束</h3>
                        <p>很遗憾，时间用完了！</p>
                        <div class="final-stats">
                            <div class="stat-item">
                                <span class="stat-label">最终得分：</span>
                                <span class="stat-value">${this.score.toLocaleString()}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">目标达成：</span>
                                <span class="stat-value">${Math.floor((this.score / this.targetScore) * 100)}%</span>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-primary" onclick="window.gameEngine.restartLevel(); this.parentElement.parentElement.parentElement.parentElement.remove()">
                                🔄 重新开始
                            </button>
                            <button class="btn btn-secondary" onclick="window.gameEngine.backToMenu(); this.parentElement.parentElement.parentElement.parentElement.remove()">
                                🏠 返回菜单
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        // 播放游戏结束音效
        this.playSound('game-over');

        // 触觉反馈
        if (window.telegramApp) {
            window.telegramApp.hapticFeedback('error');
        }
    }

    nextLevel() {
        this.level++;
        this.targetScore = Math.floor(this.targetScore * CONFIG.BALANCE.LEVEL_DIFFICULTY_INCREASE);
        this.startGame();
        this.clearModals();
    }

    restartLevel() {
        this.startGame();
        this.clearModals();
    }

    backToMenu() {
        this.gameState = 'waiting';
        this.clearModals();
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
    }

    clearModals() {
        const modals = document.querySelectorAll('.level-complete, .game-over, .pause-menu');
        modals.forEach(modal => modal.remove());
    }

    async startGame() {
        // 检查体力
        if (!window.userManager.hasEnoughEnergy()) {
            if (window.uiManager) {
                window.uiManager.showNotification('体力不足，请等待恢复或观看广告获取体力！', 'warning');
            } else {
                console.warn('体力不足');
            }
            return false;
        }

        // 消耗体力
        await window.userManager.consumeEnergy();

        // 重置游戏状态
        this.score = 0;
        this.moves = CONFIG.GAME.INITIAL_MOVES;
        this.timeLeft = 60; // 重置时间
        this.combo = 0;
        this.selectedCell = null;
        this.particles = [];
        this.gameState = 'playing';

        // 初始化游戏目标系统
        if (window.gameObjectives) {
            window.gameObjectives.initLevel(this.level);
        }

        // 初始化游戏目标
        this.initializeObjectives();

        // 初始化游戏网格
        this.initializeGrid();

        // 开始计时器
        this.startTimers();

        // 更新UI
        this.updateGameUI();

        // 开始渲染循环
        this.gameLoop();

        return true;
    }

    initializeObjectives() {
        // 根据关卡生成随机目标
        const fruitTypes = [
            BLOCK_TYPES.APPLE,
            BLOCK_TYPES.ORANGE,
            BLOCK_TYPES.BANANA,
            BLOCK_TYPES.GRAPE,
            BLOCK_TYPES.STRAWBERRY,
            BLOCK_TYPES.WATERMELON
        ];

        this.objectives = {};

        // 选择2-3个水果作为目标
        const targetCount = 2 + Math.floor(Math.random() * 2); // 2或3个目标
        const selectedFruits = [];

        for (let i = 0; i < targetCount; i++) {
            let fruitType;
            do {
                fruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
            } while (selectedFruits.includes(fruitType));

            selectedFruits.push(fruitType);

            // 目标数量根据关卡增加
            const baseTarget = 10 + this.level * 2;
            const targetAmount = baseTarget + Math.floor(Math.random() * 5);

            this.objectives[fruitType] = {
                target: targetAmount,
                current: 0
            };
        }
    }

    startTimers() {
        // 清除已有的计时器
        this.stopTimers();

        // 总游戏时间倒计时
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            // 确保时间不会变成负数
            if (this.timeLeft < 0) {
                this.timeLeft = 0;
            }
            this.updateGameUI();

            // 时间归零立即结束游戏
            if (this.timeLeft <= 0) {
                this.stopTimers(); // 停止所有计时器
                this.gameState = 'gameover';
                this.showTimeUpModal(); // 显示时间到弹窗
                return;
            }
        }, 1000);

        // 开始第一步的计时
        this.startMoveTimer();
    }

    startMoveTimer() {
        this.currentMoveStartTime = Date.now();

        this.moveTimer = setTimeout(() => {
            if (this.gameState === 'playing') {
                // 超时扣分
                this.score = Math.max(0, this.score - 50);
                this.updateGameUI();

                // 继续下一步
                this.startMoveTimer();
            }
        }, this.maxTimePerMove * 1000);
    }

    resetMoveTimer() {
        if (this.moveTimer) {
            clearTimeout(this.moveTimer);
        }

        if (this.gameState === 'playing') {
            this.startMoveTimer();
        }
    }

    stopTimers() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }

        if (this.moveTimer) {
            clearTimeout(this.moveTimer);
            this.moveTimer = null;
        }
    }

    gameLoop() {
        if (this.gameState === 'playing') {
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    pause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.stopTimers(); // 停止所有计时器
            this.showPauseMenu();
        }
    }

    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.startTimers(); // 恢复计时器
            this.clearModals();
            this.gameLoop();
        }
    }

    showPauseMenu() {
        const modal = document.createElement('div');
        modal.className = 'pause-menu';
        modal.innerHTML = `
            <h3>游戏暂停</h3>
            <button onclick="window.gameEngine.resume()">继续游戏</button>
            <button onclick="window.gameEngine.restartLevel()">重新开始</button>
            <button onclick="window.gameEngine.backToMenu()">返回菜单</button>
        `;

        document.getElementById('game-canvas-container').appendChild(modal);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 道具使用方法
    async useHammer(row, col) {
        if (!await window.userManager.useTool('hammer')) {
            return false;
        }

        this.grid[row][col] = BLOCK_TYPES.EMPTY;
        this.createParticles(col * this.cellSize + this.cellSize / 2,
                           row * this.cellSize + this.cellSize / 2);

        await this.dropBlocks();
        this.fillEmptySpaces();
        await this.processMatches();

        return true;
    }

    async useShuffle() {
        if (!await window.userManager.useTool('shuffle')) {
            return false;
        }

        // 重新洗牌
        this.initializeGrid();
        this.render();

        return true;
    }

    async useExtraSteps() {
        if (!await window.userManager.useTool('steps')) {
            return false;
        }

        this.moves += 5;
        this.updateGameUI();

        return true;
    }

    async useHint() {
        if (!await window.userManager.useTool('hint')) {
            return false;
        }

        // 简单的提示实现：高亮一个可能的移动
        const hint = this.findPossibleMove();
        if (hint) {
            // 高亮提示
            this.selectedCell = hint.from;
            setTimeout(() => {
                this.selectedCell = hint.to;
                setTimeout(() => {
                    this.selectedCell = null;
                    this.render();
                }, 1000);
                this.render();
            }, 1000);
            this.render();
        }

        return true;
    }

    findPossibleMove() {
        // 简化的可能移动查找算法
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 1; col++) {
                // 尝试水平交换
                const temp = this.grid[row][col];
                this.grid[row][col] = this.grid[row][col + 1];
                this.grid[row][col + 1] = temp;

                if (this.findMatches().length > 0) {
                    // 恢复交换
                    this.grid[row][col + 1] = this.grid[row][col];
                    this.grid[row][col] = temp;

                    return {
                        from: { row, col },
                        to: { row, col: col + 1 }
                    };
                }

                // 恢复交换
                this.grid[row][col + 1] = this.grid[row][col];
                this.grid[row][col] = temp;
            }
        }

        for (let row = 0; row < this.gridSize - 1; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // 尝试垂直交换
                const temp = this.grid[row][col];
                this.grid[row][col] = this.grid[row + 1][col];
                this.grid[row + 1][col] = temp;

                if (this.findMatches().length > 0) {
                    // 恢复交换
                    this.grid[row + 1][col] = this.grid[row][col];
                    this.grid[row][col] = temp;

                    return {
                        from: { row, col },
                        to: { row: row + 1, col }
                    };
                }

                // 恢复交换
                this.grid[row + 1][col] = this.grid[row][col];
                this.grid[row][col] = temp;
            }
        }

        return null;
    }

    async checkAutoShuffle() {
        // 检查是否还有可能的移动
        const possibleMoves = this.findAllPossibleMoves();

        if (possibleMoves.length === 0) {
            // 没有可能的移动，自动洗牌
            await this.autoShuffle();
        }
    }

    findAllPossibleMoves() {
        const possibleMoves = [];

        // 检查所有可能的水平交换
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize - 1; col++) {
                if (this.canMakeValidMove(row, col, row, col + 1)) {
                    possibleMoves.push({
                        from: { row, col },
                        to: { row, col: col + 1 }
                    });
                }
            }
        }

        // 检查所有可能的垂直交换
        for (let row = 0; row < this.gridSize - 1; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.canMakeValidMove(row, col, row + 1, col)) {
                    possibleMoves.push({
                        from: { row, col },
                        to: { row: row + 1, col }
                    });
                }
            }
        }

        return possibleMoves;
    }

    canMakeValidMove(row1, col1, row2, col2) {
        // 临时交换
        const temp = this.grid[row1][col1];
        this.grid[row1][col1] = this.grid[row2][col2];
        this.grid[row2][col2] = temp;

        // 检查是否有匹配
        const hasMatch = this.findMatches().length > 0;

        // 恢复交换
        this.grid[row2][col2] = this.grid[row1][col1];
        this.grid[row1][col1] = temp;

        return hasMatch;
    }

    async autoShuffle() {
        console.log('自动洗牌...');

        // 显示洗牌提示
        this.showShuffleNotification();

        // 等待一秒让用户看到提示
        await this.sleep(1000);

        // 执行洗牌
        this.shuffleGrid();

        // 确保洗牌后有可能的移动
        let attempts = 0;
        while (this.findAllPossibleMoves().length === 0 && attempts < 10) {
            this.shuffleGrid();
            attempts++;
        }

        // 重新渲染
        this.render();

        // 播放洗牌音效
        this.playSound('shuffle');
    }

    shuffleGrid() {
        // 获取所有非空方块
        const blocks = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] !== BLOCK_TYPES.EMPTY) {
                    blocks.push(this.grid[row][col]);
                }
            }
        }

        // Fisher-Yates洗牌算法
        for (let i = blocks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
        }

        // 将洗牌后的方块重新放回网格
        let blockIndex = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] !== BLOCK_TYPES.EMPTY) {
                    this.grid[row][col] = blocks[blockIndex++];
                }
            }
        }

        // 移除初始匹配
        this.removeInitialMatches();
    }

    showShuffleNotification() {
        const notification = document.createElement('div');
        notification.className = 'shuffle-notification';
        notification.textContent = '🔄 自动洗牌中...';

        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 15px;
            font-size: 1.2rem;
            font-weight: 600;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: fadeInOut 1s ease-in-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 1000);
    }
}

// 全局游戏引擎实例
window.gameEngine = null;