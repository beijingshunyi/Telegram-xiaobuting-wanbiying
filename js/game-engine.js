// 方块类型定义
const BLOCK_TYPES = {
    EMPTY: 0,
    RED: 1,
    BLUE: 2,
    GREEN: 3,
    YELLOW: 4,
    PURPLE: 5,
    ORANGE: 6,
    // 特殊方块
    HORIZONTAL_STRIPED: 10,
    VERTICAL_STRIPED: 11,
    WRAPPED: 12,
    COLOR_BOMB: 13
};

// 方块颜色映射
const BLOCK_COLORS = {
    [BLOCK_TYPES.RED]: '#FF6B6B',
    [BLOCK_TYPES.BLUE]: '#4ECDC4',
    [BLOCK_TYPES.GREEN]: '#45B7D1',
    [BLOCK_TYPES.YELLOW]: '#FFA726',
    [BLOCK_TYPES.PURPLE]: '#AB47BC',
    [BLOCK_TYPES.ORANGE]: '#FF7043'
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
        this.isAnimating = false;
        this.selectedCell = null;
        this.combo = 0;
        this.particles = [];
        this.gameState = 'waiting'; // waiting, playing, paused, completed, gameover

        this.setupCanvas();
        this.setupEventListeners();
        this.initializeGrid();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();

        // 根据容器大小调整画布
        const maxSize = Math.min(containerRect.width - 40, containerRect.height - 40);
        this.canvas.width = maxSize;
        this.canvas.height = maxSize;

        this.cellSize = maxSize / this.gridSize;

        // 设置画布样式
        this.canvas.style.cursor = 'pointer';
        this.canvas.style.borderRadius = '15px';
    }

    setupEventListeners() {
        // 鼠标/触摸事件
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });

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

        this.processClick(x, y);
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

            // 消除匹配的方块
            matches.forEach(match => {
                this.grid[match.row][match.col] = BLOCK_TYPES.EMPTY;
                this.createParticles(match.col * this.cellSize + this.cellSize / 2,
                                   match.row * this.cellSize + this.cellSize / 2);
            });

            // 播放消除音效
            this.playSound('match');

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
            BLOCK_TYPES.RED,
            BLOCK_TYPES.BLUE,
            BLOCK_TYPES.GREEN,
            BLOCK_TYPES.YELLOW,
            BLOCK_TYPES.PURPLE,
            BLOCK_TYPES.ORANGE
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
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

        // 绘制粒子效果
        this.updateAndDrawParticles();
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = '#dee2e6';
        this.ctx.lineWidth = 1;

        for (let row = 0; row <= this.gridSize; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.cellSize);
            this.ctx.lineTo(this.canvas.width, row * this.cellSize);
            this.ctx.stroke();
        }

        for (let col = 0; col <= this.gridSize; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.cellSize, 0);
            this.ctx.lineTo(col * this.cellSize, this.canvas.height);
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
        const padding = 2;

        // 绘制方块背景
        this.ctx.fillStyle = BLOCK_COLORS[blockType] || '#ccc';
        this.ctx.fillRect(x + padding, y + padding,
                         this.cellSize - padding * 2, this.cellSize - padding * 2);

        // 绘制方块边框
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x + padding, y + padding,
                           this.cellSize - padding * 2, this.cellSize - padding * 2);

        // 绘制方块图案
        this.drawBlockPattern(x, y, blockType);
    }

    drawBlockPattern(x, y, blockType) {
        const centerX = x + this.cellSize / 2;
        const centerY = y + this.cellSize / 2;
        const radius = this.cellSize / 6;

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
            const audio = document.getElementById(`${soundType}-sound`);
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(() => {});
            }
        } catch (error) {
            // 忽略音效播放错误
        }
    }

    updateGameUI() {
        document.getElementById('game-score').textContent = this.score;
        document.getElementById('game-level').textContent = this.level;
        document.getElementById('moves-left').textContent = this.moves;
    }

    checkGameEnd() {
        if (this.moves <= 0) {
            if (this.score >= this.targetScore) {
                this.gameState = 'completed';
                this.onLevelComplete();
            } else {
                this.gameState = 'gameover';
                this.onGameOver();
            }
        }
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
            window.telegramApp.showAlert('体力不足，请等待恢复或观看广告获取体力！');
            return false;
        }

        // 消耗体力
        await window.userManager.consumeEnergy();

        // 重置游戏状态
        this.score = 0;
        this.moves = CONFIG.GAME.INITIAL_MOVES;
        this.combo = 0;
        this.selectedCell = null;
        this.particles = [];
        this.gameState = 'playing';

        // 初始化游戏网格
        this.initializeGrid();

        // 更新UI
        this.updateGameUI();

        // 开始渲染循环
        this.gameLoop();

        return true;
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
            this.showPauseMenu();
        }
    }

    resume() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
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
}

// 全局游戏引擎实例
window.gameEngine = null;