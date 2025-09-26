/**
 * 游戏引擎核心类
 * 负责管理游戏状态、渲染循环和游戏逻辑
 */

class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.board = null;
        this.renderer = null;
        this.inputHandler = null;
        this.effectsManager = null;

        // 游戏状态
        this.isRunning = false;
        this.isPaused = false;
        this.gameState = 'WAITING'; // WAITING, PLAYING, PAUSED, GAME_OVER, LEVEL_COMPLETE

        // 游戏数据
        this.currentLevel = 1;
        this.score = 0;
        this.moves = 25;
        this.maxMoves = 25;
        this.objectives = [];
        this.combo = 0;
        this.maxCombo = 0;

        // 渲染相关
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.fps = 60;
        this.frameCount = 0;

        // 游戏配置
        this.boardSize = 8;
        this.cellSize = 64;
        this.boardWidth = this.boardSize * this.cellSize;
        this.boardHeight = this.boardSize * this.cellSize;

        console.log('🎮 GameEngine initialized');
    }

    async init() {
        console.log('🚀 Initializing GameEngine...');

        try {
            // 获取Canvas元素
            this.canvas = document.getElementById('game-canvas');
            if (!this.canvas) {
                throw new Error('Game canvas not found!');
            }

            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                throw new Error('Failed to get 2D context!');
            }

            // 设置Canvas尺寸
            this.setupCanvas();

            // 初始化游戏组件
            this.board = new GameBoard(this.boardSize, this.boardSize);
            this.renderer = new GameRenderer(this.ctx, this.cellSize);
            this.inputHandler = new InputHandler(this.canvas);
            this.effectsManager = new EffectsManager();

            // 绑定事件
            this.bindEvents();

            // 初始化第一关
            await this.loadLevel(1);

            console.log('✅ GameEngine initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize GameEngine:', error);
            throw error;
        }
    }

    setupCanvas() {
        // 获取实际显示尺寸
        const rect = this.canvas.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;

        // 设置内部分辨率（提高清晰度）
        const scale = window.devicePixelRatio || 1;
        this.canvas.width = displayWidth * scale;
        this.canvas.height = displayHeight * scale;

        // 缩放画布上下文
        this.ctx.scale(scale, scale);

        // 设置CSS尺寸
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';

        // 计算实际单元格大小
        const availableWidth = displayWidth - 40; // 预留边距
        const availableHeight = displayHeight - 40;
        this.cellSize = Math.min(availableWidth / this.boardSize, availableHeight / this.boardSize);
        this.boardWidth = this.boardSize * this.cellSize;
        this.boardHeight = this.boardSize * this.cellSize;

        // 计算棋盘居中偏移
        this.boardOffsetX = (displayWidth - this.boardWidth) / 2;
        this.boardOffsetY = (displayHeight - this.boardHeight) / 2;

        console.log(`📐 Canvas setup: ${displayWidth}x${displayHeight}, cell: ${this.cellSize}px`);
    }

    bindEvents() {
        // 输入事件处理
        this.inputHandler.onCellClick = (row, col) => {
            this.handleCellClick(row, col);
        };

        this.inputHandler.onCellSwipe = (fromRow, fromCol, toRow, toCol) => {
            this.handleCellSwipe(fromRow, fromCol, toRow, toCol);
        };

        // 窗口大小变化
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }

    async loadLevel(levelNumber) {
        console.log(`📚 Loading level ${levelNumber}...`);

        this.currentLevel = levelNumber;
        this.score = 0;
        this.moves = this.maxMoves;
        this.combo = 0;
        this.maxCombo = 0;

        // 根据关卡配置设置目标
        const levelConfig = this.getLevelConfig(levelNumber);
        this.objectives = levelConfig.objectives;
        this.maxMoves = levelConfig.moves;
        this.moves = this.maxMoves;

        // 重新生成棋盘
        await this.board.generateInitialBoard();

        // 确保有可消除的组合
        while (!this.board.hasValidMoves()) {
            await this.board.shuffleBoard();
        }

        // 更新UI
        this.updateUI();

        this.gameState = 'PLAYING';
        console.log(`✅ Level ${levelNumber} loaded`);
    }

    getLevelConfig(levelNumber) {
        // 基础关卡配置（可扩展为从JSON文件加载）
        const baseConfig = {
            moves: 25,
            objectives: [
                {
                    type: 'collect',
                    target: 'yellow-cat',
                    required: 15,
                    current: 0
                }
            ]
        };

        // 根据关卡调整难度
        if (levelNumber > 10) {
            baseConfig.moves = Math.max(20, 30 - Math.floor(levelNumber / 5));
            baseConfig.objectives[0].required = Math.min(30, 10 + levelNumber * 2);
        }

        return baseConfig;
    }

    start() {
        if (this.isRunning) return;

        console.log('▶️ Starting game engine...');
        this.isRunning = true;
        this.isPaused = false;
        this.gameState = 'PLAYING';

        // 开始渲染循环
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;

        console.log('⏸️ Pausing game engine...');
        this.isPaused = true;
        this.gameState = 'PAUSED';
    }

    resume() {
        if (!this.isRunning || !this.isPaused) return;

        console.log('▶️ Resuming game engine...');
        this.isPaused = false;
        this.gameState = 'PLAYING';
        this.lastFrameTime = performance.now();
        this.gameLoop();
    }

    stop() {
        console.log('⏹️ Stopping game engine...');
        this.isRunning = false;
        this.isPaused = false;
        this.gameState = 'WAITING';
    }

    restart() {
        console.log('🔄 Restarting current level...');
        this.stop();
        this.loadLevel(this.currentLevel);
        this.start();
    }

    nextLevel() {
        console.log('➡️ Moving to next level...');
        this.currentLevel++;
        this.loadLevel(this.currentLevel);
    }

    // 主游戏循环
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning || this.isPaused) return;

        // 计算帧时间
        this.deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        this.frameCount++;

        // 更新游戏逻辑
        this.update(this.deltaTime);

        // 渲染游戏
        this.render();

        // 计算FPS（每60帧更新一次）
        if (this.frameCount % 60 === 0) {
            this.fps = Math.round(1000 / this.deltaTime);
        }

        // 继续循环
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // 更新棋盘动画
        if (this.board) {
            this.board.update(deltaTime);
        }

        // 更新特效
        if (this.effectsManager) {
            this.effectsManager.update(deltaTime);
        }

        // 检查游戏结束条件
        this.checkGameEndConditions();
    }

    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景
        this.renderBackground();

        // 绘制棋盘
        if (this.board && this.renderer) {
            this.renderer.renderBoard(
                this.board,
                this.boardOffsetX,
                this.boardOffsetY
            );
        }

        // 绘制特效
        if (this.effectsManager) {
            this.effectsManager.render(this.ctx);
        }

        // 绘制调试信息（开发模式）
        if (this.isDebugMode()) {
            this.renderDebugInfo();
        }
    }

    renderBackground() {
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(
            0, 0,
            this.canvas.width, this.canvas.height
        );
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制棋盘背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(
            this.boardOffsetX - 10,
            this.boardOffsetY - 10,
            this.boardWidth + 20,
            this.boardHeight + 20
        );
    }

    renderDebugInfo() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
        this.ctx.fillText(`State: ${this.gameState}`, 10, 35);
        this.ctx.fillText(`Level: ${this.currentLevel}`, 10, 50);
        this.ctx.fillText(`Score: ${this.score}`, 10, 65);
        this.ctx.fillText(`Moves: ${this.moves}/${this.maxMoves}`, 10, 80);
        this.ctx.fillText(`Combo: ${this.combo}`, 10, 95);
    }

    // 游戏交互处理
    handleCellClick(row, col) {
        if (this.gameState !== 'PLAYING') return;

        console.log(`🎯 Cell clicked: (${row}, ${col})`);
        // TODO: 实现单击选择逻辑
    }

    handleCellSwipe(fromRow, fromCol, toRow, toCol) {
        if (this.gameState !== 'PLAYING' || this.moves <= 0) return;

        console.log(`↔️ Cell swipe: (${fromRow}, ${fromCol}) -> (${toRow}, ${toCol})`);

        // 检查是否是相邻单元格
        if (!this.board.areAdjacent(fromRow, fromCol, toRow, toCol)) {
            console.log('❌ Cells are not adjacent');
            return;
        }

        // 尝试交换
        const swapResult = this.board.swapCells(fromRow, fromCol, toRow, toCol);
        if (swapResult.success) {
            this.moves--;
            this.updateUI();

            // 检查并处理消除
            this.processMatches();
        }
    }

    async processMatches() {
        let totalMatches = 0;
        let currentCombo = 0;

        while (true) {
            // 查找所有匹配
            const matches = this.board.findAllMatches();
            if (matches.length === 0) break;

            totalMatches += matches.length;
            currentCombo++;

            // 处理消除和得分
            this.processMatchesScoring(matches, currentCombo);

            // 移除匹配的元素
            this.board.removeMatches(matches);

            // 应用重力
            await this.board.applyGravity();

            // 生成新元素
            await this.board.generateNewElements();

            // 更新UI
            this.updateUI();

            // 等待动画完成
            await this.sleep(300);
        }

        if (totalMatches > 0) {
            this.combo = Math.max(this.combo, currentCombo);
            this.maxCombo = Math.max(this.maxCombo, currentCombo);

            if (currentCombo >= 3) {
                this.showComboEffect(currentCombo);
            }
        }
    }

    processMatchesScoring(matches, comboMultiplier) {
        matches.forEach(match => {
            const baseScore = match.length * 10;
            const comboScore = baseScore * comboMultiplier;
            this.score += comboScore;

            // 更新目标进度
            this.updateObjectiveProgress(match.type, match.length);

            // 创建得分特效
            this.effectsManager.createScorePopup(
                match.centerX,
                match.centerY,
                comboScore
            );
        });
    }

    updateObjectiveProgress(elementType, count) {
        this.objectives.forEach(objective => {
            if (objective.type === 'collect' && objective.target === elementType) {
                objective.current = Math.min(
                    objective.required,
                    objective.current + count
                );
            }
        });
    }

    checkGameEndConditions() {
        // 检查关卡完成
        const allObjectivesComplete = this.objectives.every(
            obj => obj.current >= obj.required
        );

        if (allObjectivesComplete) {
            this.gameState = 'LEVEL_COMPLETE';
            this.showLevelCompleteScreen();
            return;
        }

        // 检查游戏失败
        if (this.moves <= 0 && !this.board.hasValidMoves()) {
            this.gameState = 'GAME_OVER';
            this.showGameOverScreen();
            return;
        }
    }

    showComboEffect(comboCount) {
        // TODO: 实现连击特效
        console.log(`🔥 COMBO x${comboCount}!`);
    }

    showLevelCompleteScreen() {
        console.log('🎉 Level Complete!');
        // TODO: 显示完成界面
    }

    showGameOverScreen() {
        console.log('💀 Game Over!');
        // TODO: 显示失败界面
    }

    updateUI() {
        // 更新步数显示
        const movesElement = document.getElementById('moves-left');
        if (movesElement) {
            movesElement.textContent = this.moves;
            if (this.moves <= 5) {
                movesElement.classList.add('low');
            } else {
                movesElement.classList.remove('low');
            }
        }

        // 更新分数显示
        const scoreElement = document.getElementById('current-score');
        if (scoreElement) {
            scoreElement.textContent = this.score.toLocaleString();
        }

        // 更新关卡显示
        const levelElement = document.getElementById('game-level');
        if (levelElement) {
            levelElement.textContent = `第 ${this.currentLevel} 关`;
        }

        // 更新目标显示
        this.updateObjectivesDisplay();
    }

    updateObjectivesDisplay() {
        const objectivesContainer = document.getElementById('game-objectives');
        if (!objectivesContainer) return;

        objectivesContainer.innerHTML = '';

        this.objectives.forEach(objective => {
            const objectiveElement = document.createElement('div');
            objectiveElement.className = 'objective-item';

            const icon = document.createElement('div');
            icon.className = 'objective-icon';
            icon.style.backgroundImage = `url('assets/images/characters/${objective.target}.png')`;

            const progress = document.createElement('span');
            progress.className = 'objective-progress';
            progress.textContent = `${objective.current}/${objective.required}`;

            if (objective.current >= objective.required) {
                objectiveElement.classList.add('completed');
            }

            objectiveElement.appendChild(icon);
            objectiveElement.appendChild(progress);
            objectivesContainer.appendChild(objectiveElement);
        });
    }

    addMoves(count) {
        this.moves += count;
        this.updateUI();
        console.log(`➕ Added ${count} moves`);
    }

    saveProgress() {
        const gameData = {
            currentLevel: this.currentLevel,
            score: this.score,
            maxCombo: this.maxCombo,
            timestamp: Date.now()
        };

        localStorage.setItem('game-progress', JSON.stringify(gameData));
        console.log('💾 Game progress saved');
    }

    loadProgress() {
        const saved = localStorage.getItem('game-progress');
        if (saved) {
            try {
                const gameData = JSON.parse(saved);
                this.currentLevel = gameData.currentLevel || 1;
                this.maxCombo = gameData.maxCombo || 0;
                console.log('📂 Game progress loaded');
                return true;
            } catch (error) {
                console.error('❌ Failed to load progress:', error);
            }
        }
        return false;
    }

    // 工具方法
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isDebugMode() {
        return window.location.hostname === 'localhost' ||
               window.location.search.includes('debug=true');
    }

    // 获取游戏状态信息
    getGameInfo() {
        return {
            level: this.currentLevel,
            score: this.score,
            moves: this.moves,
            maxMoves: this.maxMoves,
            combo: this.combo,
            maxCombo: this.maxCombo,
            objectives: this.objectives,
            gameState: this.gameState
        };
    }
}

// 导出GameEngine类
window.GameEngine = GameEngine;