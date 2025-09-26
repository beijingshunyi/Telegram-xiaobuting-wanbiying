/**
 * 游戏渲染器
 * 负责将游戏元素渲染到Canvas上
 */

class GameRenderer {
    constructor(ctx, cellSize) {
        this.ctx = ctx;
        this.cellSize = cellSize;
        this.elementSprites = new Map();
        this.specialSprites = new Map();
        this.animatedElements = new Set();

        // 渲染配置
        this.gridLineWidth = 1;
        this.gridLineColor = '#E0E0E0';
        this.selectionColor = '#FFD700';
        this.selectionWidth = 3;
        this.shadowBlur = 5;
        this.shadowColor = 'rgba(0, 0, 0, 0.3)';

        // 动画配置
        this.pulseSpeed = 2;
        this.glowIntensity = 0.8;
        this.sparkleCount = 3;

        console.log('🎨 GameRenderer initialized');
        this.loadSprites();
    }

    // 加载精灵图片
    async loadSprites() {
        const spriteConfigs = [
            // 普通角色元素
            { key: 'yellow-cat', src: GAME_CONSTANTS.IMAGES.CHARACTERS.YELLOW_CAT, color: '#FFD700' },
            { key: 'brown-bear', src: GAME_CONSTANTS.IMAGES.CHARACTERS.BROWN_BEAR, color: '#8B4513' },
            { key: 'pink-rabbit', src: GAME_CONSTANTS.IMAGES.CHARACTERS.PINK_RABBIT, color: '#FF69B4' },
            { key: 'purple-cat', src: GAME_CONSTANTS.IMAGES.CHARACTERS.PURPLE_CAT, color: '#9370DB' },
            { key: 'blue-owl', src: GAME_CONSTANTS.IMAGES.CHARACTERS.BLUE_OWL, color: '#4169E1' },
            { key: 'green-frog', src: GAME_CONSTANTS.IMAGES.CHARACTERS.GREEN_FROG, color: '#32CD32' }
        ];

        const specialConfigs = [
            { key: 'rocket-horizontal', color: '#FF6B9D' },
            { key: 'rocket-vertical', color: '#FF6B9D' },
            { key: 'bomb', color: '#FF4500' },
            { key: 'rainbow-owl', color: 'rainbow' }
        ];

        try {
            // 加载普通元素精灵
            for (const config of spriteConfigs) {
                const sprite = await this.createElementSprite(config);
                this.elementSprites.set(config.key, sprite);
            }

            // 生成特殊元素精灵
            for (const config of specialConfigs) {
                const sprite = this.createSpecialSprite(config);
                this.specialSprites.set(config.key, sprite);
            }

            console.log('✅ All sprites loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load sprites:', error);
            // 使用备用渲染方案
            this.useFallbackRendering = true;
        }
    }

    // 创建元素精灵
    async createElementSprite(config) {
        return new Promise((resolve) => {
            // 由于我们没有实际的图片文件，创建程序化的精灵
            const canvas = document.createElement('canvas');
            canvas.width = this.cellSize;
            canvas.height = this.cellSize;
            const ctx = canvas.getContext('2d');

            // 绘制基础形状
            this.drawElementShape(ctx, config, this.cellSize);

            resolve({
                canvas: canvas,
                color: config.color,
                loaded: true
            });
        });
    }

    // 绘制元素形状（程序化生成）
    drawElementShape(ctx, config, size) {
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.35;

        // 清空画布
        ctx.clearRect(0, 0, size, size);

        // 绘制阴影
        ctx.shadowBlur = this.shadowBlur;
        ctx.shadowColor = this.shadowColor;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // 根据元素类型绘制不同形状
        switch (config.key) {
            case 'yellow-cat':
                this.drawCat(ctx, centerX, centerY, radius, config.color);
                break;
            case 'brown-bear':
                this.drawBear(ctx, centerX, centerY, radius, config.color);
                break;
            case 'pink-rabbit':
                this.drawRabbit(ctx, centerX, centerY, radius, config.color);
                break;
            case 'purple-cat':
                this.drawCat(ctx, centerX, centerY, radius, config.color);
                break;
            case 'blue-owl':
                this.drawOwl(ctx, centerX, centerY, radius, config.color);
                break;
            case 'green-frog':
                this.drawFrog(ctx, centerX, centerY, radius, config.color);
                break;
        }

        // 重置阴影
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    // 绘制猫咪形状
    drawCat(ctx, x, y, radius, color) {
        // 主体
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 耳朵
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.7, y - radius * 0.5);
        ctx.lineTo(x - radius * 0.3, y - radius * 0.9);
        ctx.lineTo(x - radius * 0.1, y - radius * 0.5);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + radius * 0.1, y - radius * 0.5);
        ctx.lineTo(x + radius * 0.3, y - radius * 0.9);
        ctx.lineTo(x + radius * 0.7, y - radius * 0.5);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - radius * 0.25, y - radius * 0.1, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.25, y - radius * 0.1, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 嘴巴
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y + radius * 0.2, radius * 0.2, 0, Math.PI);
        ctx.stroke();
    }

    // 绘制熊形状
    drawBear(ctx, x, y, radius, color) {
        // 主体
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 耳朵（圆形）
        ctx.beginPath();
        ctx.arc(x - radius * 0.6, y - radius * 0.6, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.6, y - radius * 0.6, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - radius * 0.25, y - radius * 0.1, radius * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.25, y - radius * 0.1, radius * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // 鼻子
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x, y + radius * 0.1, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    // 绘制兔子形状
    drawRabbit(ctx, x, y, radius, color) {
        // 主体
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 长耳朵
        ctx.beginPath();
        ctx.ellipse(x - radius * 0.4, y - radius * 0.8, radius * 0.15, radius * 0.5, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + radius * 0.4, y - radius * 0.8, radius * 0.15, radius * 0.5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - radius * 0.25, y - radius * 0.1, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.25, y - radius * 0.1, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 嘴巴（三瓣嘴）
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + radius * 0.1);
        ctx.lineTo(x - radius * 0.1, y + radius * 0.25);
        ctx.moveTo(x, y + radius * 0.1);
        ctx.lineTo(x + radius * 0.1, y + radius * 0.25);
        ctx.stroke();
    }

    // 绘制猫头鹰形状
    drawOwl(ctx, x, y, radius, color) {
        // 主体
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 大眼睛
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x - radius * 0.25, y - radius * 0.1, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.25, y - radius * 0.1, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 眼珠
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - radius * 0.25, y - radius * 0.1, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.25, y - radius * 0.1, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 喙
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.moveTo(x, y + radius * 0.1);
        ctx.lineTo(x - radius * 0.1, y + radius * 0.3);
        ctx.lineTo(x + radius * 0.1, y + radius * 0.3);
        ctx.closePath();
        ctx.fill();
    }

    // 绘制青蛙形状
    drawFrog(ctx, x, y, radius, color) {
        // 主体
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 凸眼睛
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.3, y - radius * 0.3, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // 眼珠
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.3, y - radius * 0.3, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // 嘴巴
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y + radius * 0.2, radius * 0.3, 0, Math.PI);
        ctx.stroke();
    }

    // 创建特殊元素精灵
    createSpecialSprite(config) {
        const canvas = document.createElement('canvas');
        canvas.width = this.cellSize;
        canvas.height = this.cellSize;
        const ctx = canvas.getContext('2d');

        this.drawSpecialElement(ctx, config, this.cellSize);

        return {
            canvas: canvas,
            color: config.color,
            special: true
        };
    }

    // 绘制特殊元素
    drawSpecialElement(ctx, config, size) {
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.35;

        // 清空画布
        ctx.clearRect(0, 0, size, size);

        // 绘制发光效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = config.color === 'rainbow' ? '#FFD700' : config.color;

        switch (config.key) {
            case 'rocket-horizontal':
                this.drawRocket(ctx, centerX, centerY, radius, config.color, true);
                break;
            case 'rocket-vertical':
                this.drawRocket(ctx, centerX, centerY, radius, config.color, false);
                break;
            case 'bomb':
                this.drawBomb(ctx, centerX, centerY, radius, config.color);
                break;
            case 'rainbow-owl':
                this.drawRainbowOwl(ctx, centerX, centerY, radius);
                break;
        }

        ctx.shadowBlur = 0;
    }

    // 绘制火箭
    drawRocket(ctx, x, y, radius, color, isHorizontal) {
        ctx.save();

        if (isHorizontal) {
            ctx.rotate(Math.PI / 2);
            [x, y] = [-y, x];
        }

        // 火箭主体
        const gradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, '#FF1493');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x - radius * 0.3, y + radius * 0.5);
        ctx.lineTo(x, y + radius * 0.8);
        ctx.lineTo(x + radius * 0.3, y + radius * 0.5);
        ctx.closePath();
        ctx.fill();

        // 箭头
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x - radius * 0.2, y - radius * 0.5);
        ctx.lineTo(x + radius * 0.2, y - radius * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // 绘制炸弹
    drawBomb(ctx, x, y, radius, color) {
        // 炸弹主体
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 导火索
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + radius * 0.7, y - radius * 0.7);
        ctx.lineTo(x + radius * 1.2, y - radius * 1.2);
        ctx.stroke();

        // 火花
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + radius * 1.2, y - radius * 1.2, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // 绘制彩虹猫头鹰
    drawRainbowOwl(ctx, x, y, radius) {
        // 创建彩虹渐变
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.2, '#FF6B9D');
        gradient.addColorStop(0.4, '#4ECDC4');
        gradient.addColorStop(0.6, '#9B59B6');
        gradient.addColorStop(0.8, '#FF6B9D');
        gradient.addColorStop(1, '#FFD700');

        // 主体
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 大眼睛
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x - radius * 0.25, y - radius * 0.1, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + radius * 0.25, y - radius * 0.1, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 闪烁星星眼
        const time = Date.now() * 0.01;
        const starSize = radius * 0.15 * (1 + Math.sin(time) * 0.2);
        this.drawStar(ctx, x - radius * 0.25, y - radius * 0.1, starSize, '#FFD700');
        this.drawStar(ctx, x + radius * 0.25, y - radius * 0.1, starSize, '#FFD700');
    }

    // 绘制星星
    drawStar(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const x1 = x + Math.cos(angle) * size;
            const y1 = y + Math.sin(angle) * size;
            const x2 = x + Math.cos(angle + Math.PI / 5) * size * 0.5;
            const y2 = y + Math.sin(angle + Math.PI / 5) * size * 0.5;

            if (i === 0) {
                ctx.moveTo(x1, y1);
            } else {
                ctx.lineTo(x1, y1);
            }
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();
    }

    // 渲染整个游戏板
    renderBoard(board, offsetX, offsetY) {
        if (!board) return;

        // 清空绘制区域
        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);

        // 绘制背景网格
        this.renderGrid(board.rows, board.cols);

        // 绘制所有元素
        this.renderElements(board);

        // 绘制选择高亮
        if (board.selectedCell) {
            this.renderSelection(board.selectedCell.row, board.selectedCell.col);
        }

        this.ctx.restore();
    }

    // 渲染背景网格
    renderGrid(rows, cols) {
        this.ctx.strokeStyle = this.gridLineColor;
        this.ctx.lineWidth = this.gridLineWidth;

        // 绘制垂直线
        for (let col = 0; col <= cols; col++) {
            const x = col * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, rows * this.cellSize);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let row = 0; row <= rows; row++) {
            const y = row * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(cols * this.cellSize, y);
            this.ctx.stroke();
        }
    }

    // 渲染所有元素
    renderElements(board) {
        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                const element = board.getElement(row, col);
                if (element) {
                    this.renderElement(element, row, col);
                }
            }
        }
    }

    // 渲染单个元素
    renderElement(element, row, col) {
        const x = col * this.cellSize;
        const y = row * this.cellSize;

        // 使用动画位置（如果存在）
        const renderX = element.visualX !== undefined ? element.visualX * this.cellSize : x;
        const renderY = element.visualY !== undefined ? element.visualY * this.cellSize : y;

        // 获取精灵
        const sprite = element.isSpecial ?
            this.specialSprites.get(element.type) :
            this.elementSprites.get(element.type);

        if (sprite && sprite.canvas) {
            // 应用元素特效
            this.applyElementEffects(element);

            // 绘制精灵
            this.ctx.drawImage(
                sprite.canvas,
                renderX,
                renderY,
                this.cellSize,
                this.cellSize
            );

            // 重置特效
            this.resetEffects();
        } else {
            // 备用渲染方案
            this.renderFallbackElement(element, renderX, renderY);
        }

        // 绘制特殊标记
        if (element.isSpecial) {
            this.renderSpecialMarker(renderX, renderY);
        }
    }

    // 应用元素特效
    applyElementEffects(element) {
        if (element.isAnimating) {
            // 动画缩放
            const scale = element.animationData?.scale || 1;
            const centerX = element.visualX * this.cellSize + this.cellSize / 2;
            const centerY = element.visualY * this.cellSize + this.cellSize / 2;

            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(scale, scale);
            this.ctx.translate(-centerX, -centerY);
        }

        if (element.isSpecial) {
            // 特殊元素发光
            const time = Date.now() * 0.005;
            const glowIntensity = (Math.sin(time) + 1) * 0.5 * this.glowIntensity;

            this.ctx.shadowBlur = 10 + glowIntensity * 10;
            this.ctx.shadowColor = this.getElementGlowColor(element.type);
        }
    }

    // 重置特效
    resetEffects() {
        this.ctx.restore();
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
    }

    // 获取元素发光颜色
    getElementGlowColor(type) {
        const glowColors = {
            'rocket-horizontal': '#FF6B9D',
            'rocket-vertical': '#FF6B9D',
            'bomb': '#FF4500',
            'rainbow-owl': '#FFD700'
        };
        return glowColors[type] || '#FFFFFF';
    }

    // 备用元素渲染
    renderFallbackElement(element, x, y) {
        const colors = {
            'yellow-cat': '#FFD700',
            'brown-bear': '#8B4513',
            'pink-rabbit': '#FF69B4',
            'purple-cat': '#9370DB',
            'blue-owl': '#4169E1',
            'green-frog': '#32CD32'
        };

        const color = colors[element.type] || '#CCCCCC';

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.cellSize / 2,
            y + this.cellSize / 2,
            this.cellSize * 0.35,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // 绘制类型标识
        this.ctx.fillStyle = '#000';
        this.ctx.font = `${this.cellSize * 0.2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(
            element.type.charAt(0).toUpperCase(),
            x + this.cellSize / 2,
            y + this.cellSize / 2
        );
    }

    // 渲染选择高亮
    renderSelection(row, col) {
        const x = col * this.cellSize;
        const y = row * this.cellSize;

        this.ctx.strokeStyle = this.selectionColor;
        this.ctx.lineWidth = this.selectionWidth;
        this.ctx.setLineDash([5, 5]);

        this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);

        // 重置线条样式
        this.ctx.setLineDash([]);
        this.ctx.lineWidth = 1;
    }

    // 渲染特殊元素标记
    renderSpecialMarker(x, y) {
        const time = Date.now() * 0.01;
        const sparkleSize = 3 + Math.sin(time) * 2;

        // 绘制闪烁星星
        for (let i = 0; i < this.sparkleCount; i++) {
            const angle = (time + i * Math.PI * 2 / this.sparkleCount) * 0.5;
            const sparkleX = x + this.cellSize / 2 + Math.cos(angle) * this.cellSize * 0.4;
            const sparkleY = y + this.cellSize / 2 + Math.sin(angle) * this.cellSize * 0.4;

            this.drawSparkle(sparkleX, sparkleY, sparkleSize);
        }
    }

    // 绘制闪烁效果
    drawSparkle(x, y, size) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = '#FFD700';

        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
    }

    // 渲染匹配高亮
    renderMatchHighlight(matches) {
        matches.forEach(match => {
            match.cells.forEach(cell => {
                const x = cell.col * this.cellSize;
                const y = cell.row * this.cellSize;

                // 闪烁效果
                const time = Date.now() * 0.01;
                const opacity = (Math.sin(time * 3) + 1) * 0.3 + 0.2;

                this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
            });
        });
    }

    // 更新动画
    update(deltaTime) {
        // 更新动画元素
        this.animatedElements.forEach(element => {
            if (element.animationData) {
                element.animationData.elapsed += deltaTime;
                // 更新动画逻辑...
            }
        });
    }

    // 获取渲染统计信息
    getRenderStats() {
        return {
            spritesLoaded: this.elementSprites.size + this.specialSprites.size,
            animatedElements: this.animatedElements.size,
            cellSize: this.cellSize,
            useFallback: this.useFallbackRendering || false
        };
    }
}

// 导出GameRenderer类
window.GameRenderer = GameRenderer;