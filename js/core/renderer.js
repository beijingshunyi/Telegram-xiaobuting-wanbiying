/**
 * 游戏渲染器
 * 负责绘制游戏棋盘、元素和UI
 */

class GameRenderer {
    constructor(ctx, cellSize) {
        this.ctx = ctx;
        this.cellSize = cellSize;
        this.boardOffsetX = 0;
        this.boardOffsetY = 0;

        // 元素颜色配置
        this.elementColors = {
            'apple': '#FF6B6B',      // 红苹果
            'banana': '#FFD93D',     // 黄香蕉
            'grape': '#6BCF7F',      // 绿葡萄
            'orange': '#FF8E53',     // 橙子
            'strawberry': '#FF69B4', // 粉草莓
            'pineapple': '#FFA500',  // 菠萝
            'watermelon': '#98FB98', // 西瓜
            'peach': '#FFCCCB'       // 桃子
        };

        // 特殊元素配置
        this.specialElements = {
            'rocket': '#FF4500',     // 火箭
            'bomb': '#8B0000',       // 炸弹
            'rainbow': '#9400D3'     // 彩虹猫头鹰
        };

        // 角色精灵配置
        this.characters = {
            'apple': '🍎',
            'banana': '🍌',
            'grape': '🍇',
            'orange': '🍊',
            'strawberry': '🍓',
            'pineapple': '🍍',
            'watermelon': '🍉',
            'peach': '🍑'
        };

        console.log('🎨 GameRenderer initialized');
    }

    // 设置棋盘偏移
    setBoardOffset(x, y) {
        this.boardOffsetX = x;
        this.boardOffsetY = y;
    }

    // 渲染整个棋盘
    renderBoard(board, offsetX = 0, offsetY = 0) {
        this.setBoardOffset(offsetX, offsetY);

        // 绘制棋盘背景
        this.renderBoardBackground(board);

        // 绘制棋盘网格
        this.renderGrid(board);

        // 绘制游戏元素
        this.renderElements(board);

        // 绘制选中效果
        this.renderSelection(board);

        // 绘制动画效果
        this.renderAnimations(board);
    }

    // 渲染棋盘背景
    renderBoardBackground(board) {
        const boardWidth = board.cols * this.cellSize;
        const boardHeight = board.rows * this.cellSize;

        // 绘制背景渐变
        const gradient = this.ctx.createLinearGradient(
            this.boardOffsetX,
            this.boardOffsetY,
            this.boardOffsetX,
            this.boardOffsetY + boardHeight
        );
        gradient.addColorStop(0, '#F8F9FA');
        gradient.addColorStop(1, '#E9ECEF');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            this.boardOffsetX - 5,
            this.boardOffsetY - 5,
            boardWidth + 10,
            boardHeight + 10
        );

        // 绘制边框
        this.ctx.strokeStyle = '#DEE2E6';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.boardOffsetX - 5,
            this.boardOffsetY - 5,
            boardWidth + 10,
            boardHeight + 10
        );
    }

    // 渲染网格
    renderGrid(board) {
        this.ctx.strokeStyle = '#E9ECEF';
        this.ctx.lineWidth = 1;

        // 垂直线
        for (let col = 0; col <= board.cols; col++) {
            const x = this.boardOffsetX + col * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.boardOffsetY);
            this.ctx.lineTo(x, this.boardOffsetY + board.rows * this.cellSize);
            this.ctx.stroke();
        }

        // 水平线
        for (let row = 0; row <= board.rows; row++) {
            const y = this.boardOffsetY + row * this.cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(this.boardOffsetX, y);
            this.ctx.lineTo(this.boardOffsetX + board.cols * this.cellSize, y);
            this.ctx.stroke();
        }
    }

    // 渲染游戏元素
    renderElements(board) {
        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                const element = board.getElement(row, col);
                if (element && element.type !== 'empty') {
                    this.renderElement(element, row, col);
                }
            }
        }
    }

    // 渲染单个元素
    renderElement(element, row, col) {
        const x = this.boardOffsetX + col * this.cellSize;
        const y = this.boardOffsetY + row * this.cellSize;
        const centerX = x + this.cellSize / 2;
        const centerY = y + this.cellSize / 2;

        this.ctx.save();

        // 应用元素动画变换
        if (element.animationScale) {
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(element.animationScale, element.animationScale);
            this.ctx.translate(-centerX, -centerY);
        }

        if (element.animationAlpha !== undefined) {
            this.ctx.globalAlpha = element.animationAlpha;
        }

        // 绘制元素背景
        this.renderElementBackground(x, y, element);

        // 绘制元素内容
        if (element.isSpecial) {
            this.renderSpecialElement(centerX, centerY, element);
        } else {
            this.renderNormalElement(centerX, centerY, element);
        }

        // 绘制元素效果
        this.renderElementEffects(centerX, centerY, element);

        this.ctx.restore();
    }

    // 渲染元素背景
    renderElementBackground(x, y, element) {
        const padding = 2;
        const size = this.cellSize - padding * 2;

        // 基础背景色
        let bgColor = this.elementColors[element.type] || '#CCCCCC';

        if (element.isSpecial) {
            bgColor = this.specialElements[element.specialType] || bgColor;
        }

        // 绘制圆形背景
        this.ctx.fillStyle = bgColor;
        this.ctx.beginPath();
        this.ctx.arc(
            x + this.cellSize / 2,
            y + this.cellSize / 2,
            size / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // 添加光泽效果
        const gradient = this.ctx.createRadialGradient(
            x + this.cellSize / 2 - size / 6,
            y + this.cellSize / 2 - size / 6,
            0,
            x + this.cellSize / 2,
            y + this.cellSize / 2,
            size / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // 绘制边框
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    // 渲染普通元素
    renderNormalElement(centerX, centerY, element) {
        const emoji = this.characters[element.type] || '❓';

        this.ctx.font = `${this.cellSize * 0.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji, centerX, centerY);
    }

    // 渲染特殊元素
    renderSpecialElement(centerX, centerY, element) {
        const size = this.cellSize * 0.6;

        switch (element.specialType) {
            case 'rocket':
                this.renderRocket(centerX, centerY, size, element.direction);
                break;
            case 'bomb':
                this.renderBomb(centerX, centerY, size);
                break;
            case 'rainbow':
                this.renderRainbow(centerX, centerY, size);
                break;
            default:
                this.renderNormalElement(centerX, centerY, element);
        }
    }

    // 渲染火箭
    renderRocket(centerX, centerY, size, direction = 'horizontal') {
        this.ctx.save();

        if (direction === 'vertical') {
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(Math.PI / 2);
            this.ctx.translate(-centerX, -centerY);
        }

        // 火箭主体
        this.ctx.fillStyle = '#FF4500';
        this.ctx.fillRect(centerX - size/2, centerY - size/6, size, size/3);

        // 火箭头
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + size/2, centerY);
        this.ctx.lineTo(centerX + size/3, centerY - size/6);
        this.ctx.lineTo(centerX + size/3, centerY + size/6);
        this.ctx.closePath();
        this.ctx.fill();

        // 火箭尾焰
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - size/2, centerY - size/8);
        this.ctx.lineTo(centerX - size/1.5, centerY);
        this.ctx.lineTo(centerX - size/2, centerY + size/8);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    // 渲染炸弹
    renderBomb(centerX, centerY, size) {
        // 炸弹主体
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY + size/8, size/2, 0, Math.PI * 2);
        this.ctx.fill();

        // 炸弹引信
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - size/6, centerY - size/4);
        this.ctx.lineTo(centerX - size/3, centerY - size/2);
        this.ctx.stroke();

        // 火花效果
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(centerX - size/3, centerY - size/2, size/12, 0, Math.PI * 2);
        this.ctx.fill();

        // 光泽
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX - size/6, centerY, size/6, 0, Math.PI * 2);
        this.ctx.fill();
    }

    // 渲染彩虹元素
    renderRainbow(centerX, centerY, size) {
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        const time = Date.now() / 1000;

        // 绘制彩虹圆环
        for (let i = 0; i < colors.length; i++) {
            const radius = (size / 2) * (0.4 + i * 0.1);
            const alpha = 0.8 + Math.sin(time * 2 + i) * 0.2;

            this.ctx.globalAlpha = alpha;
            this.ctx.strokeStyle = colors[i];
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // 中心星星
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = '#FFD700';
        this.drawStar(centerX, centerY, size/4, 5);
    }

    // 绘制星形
    drawStar(centerX, centerY, radius, points) {
        const outerRadius = radius;
        const innerRadius = radius * 0.5;
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / points;

        this.ctx.beginPath();
        this.ctx.moveTo(centerX, centerY - outerRadius);

        for (let i = 0; i < points; i++) {
            let x = centerX + Math.cos(rot) * outerRadius;
            let y = centerY + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = centerX + Math.cos(rot) * innerRadius;
            y = centerY + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }

        this.ctx.lineTo(centerX, centerY - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    // 渲染元素效果
    renderElementEffects(centerX, centerY, element) {
        // 选中发光效果
        if (element.selected) {
            this.ctx.save();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#FFD700';
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, this.cellSize / 2 - 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    // 渲染选中效果
    renderSelection(board) {
        if (!board.selectedElement) return;

        const { row, col } = board.selectedElement;
        const x = this.boardOffsetX + col * this.cellSize;
        const y = this.boardOffsetY + row * this.cellSize;

        // 绘制选中框
        this.ctx.save();
        this.ctx.strokeStyle = '#007BFF';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);

        const time = Date.now() / 100;
        this.ctx.lineDashOffset = time % 10;

        this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
        this.ctx.restore();
    }

    // 渲染动画效果
    renderAnimations(board) {
        // 这里可以添加额外的动画效果
    }

    // 获取单元格位置
    getCellFromPosition(x, y) {
        const col = Math.floor((x - this.boardOffsetX) / this.cellSize);
        const row = Math.floor((y - this.boardOffsetY) / this.cellSize);
        return { row, col };
    }

    // 检查位置是否在棋盘内
    isValidPosition(x, y, boardRows, boardCols) {
        const { row, col } = this.getCellFromPosition(x, y);
        return row >= 0 && row < boardRows && col >= 0 && col < boardCols;
    }

    // 更新单元格大小
    updateCellSize(newCellSize) {
        this.cellSize = newCellSize;
    }

    // 清除画布
    clear() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}

// 导出渲染器类
window.GameRenderer = GameRenderer;
console.log('🎨 Game renderer loaded');