/**
 * 游戏棋盘类
 * 管理8x8棋盘的元素、状态和逻辑
 */

class GameBoard {
    constructor(rows = 8, cols = 8) {
        this.rows = rows;
        this.cols = cols;
        this.grid = [];
        this.selectedCell = null;
        this.animating = false;

        // 元素类型定义（对应游戏角色）
        this.elementTypes = [
            'yellow-cat',    // 黄豆豆（黄猫）
            'brown-bear',    // 琦琦熊（棕熊）
            'pink-rabbit',   // 果果兔（粉兔）
            'purple-cat',    // 喵星星（紫猫）
            'blue-owl',      // 蓝猫头鹰
            'green-frog'     // 绿青蛙
        ];

        // 特殊元素类型
        this.specialTypes = {
            ROCKET_H: 'rocket-horizontal',    // 横向火箭
            ROCKET_V: 'rocket-vertical',      // 纵向火箭
            BOMB: 'bomb',                     // 炸弹
            RAINBOW: 'rainbow-owl'            // 彩色猫头鹰
        };

        console.log(`🎲 GameBoard created: ${rows}x${cols}`);
        this.initializeGrid();
    }

    // 初始化空网格
    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col] = null;
            }
        }
    }

    // 生成初始棋盘
    async generateInitialBoard() {
        console.log('🎯 Generating initial board...');

        // 随机填充棋盘，确保不会有初始匹配
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                let elementType;
                let attempts = 0;

                do {
                    elementType = this.getRandomElementType();
                    attempts++;

                    // 防止无限循环
                    if (attempts > 50) {
                        elementType = this.elementTypes[0];
                        break;
                    }
                } while (this.wouldCreateMatch(row, col, elementType));

                this.grid[row][col] = this.createElement(elementType, row, col);
            }
        }

        // 确保有可移动的步数
        if (!this.hasValidMoves()) {
            await this.shuffleBoard();
        }

        console.log('✅ Initial board generated');
    }

    // 创建游戏元素
    createElement(type, row, col, isSpecial = false) {
        return {
            type: type,
            row: row,
            col: col,
            id: `${type}-${row}-${col}-${Date.now()}`,
            isSpecial: isSpecial,
            isAnimating: false,
            animationData: null,
            createTime: Date.now()
        };
    }

    // 获取随机元素类型
    getRandomElementType() {
        const randomIndex = Math.floor(Math.random() * this.elementTypes.length);
        return this.elementTypes[randomIndex];
    }

    // 检查放置元素是否会创建匹配
    wouldCreateMatch(row, col, type) {
        // 检查水平方向
        let horizontalCount = 1;

        // 向左检查
        for (let c = col - 1; c >= 0; c--) {
            if (this.grid[row][c] && this.grid[row][c].type === type) {
                horizontalCount++;
            } else {
                break;
            }
        }

        // 向右检查
        for (let c = col + 1; c < this.cols; c++) {
            if (this.grid[row][c] && this.grid[row][c].type === type) {
                horizontalCount++;
            } else {
                break;
            }
        }

        if (horizontalCount >= 3) return true;

        // 检查垂直方向
        let verticalCount = 1;

        // 向上检查
        for (let r = row - 1; r >= 0; r--) {
            if (this.grid[r][col] && this.grid[r][col].type === type) {
                verticalCount++;
            } else {
                break;
            }
        }

        // 向下检查
        for (let r = row + 1; r < this.rows; r++) {
            if (this.grid[r][col] && this.grid[r][col].type === type) {
                verticalCount++;
            } else {
                break;
            }
        }

        return verticalCount >= 3;
    }

    // 检查两个单元格是否相邻
    areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);

        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    // 交换两个单元格
    swapCells(row1, col1, row2, col2) {
        if (!this.isValidPosition(row1, col1) || !this.isValidPosition(row2, col2)) {
            return { success: false, reason: 'Invalid position' };
        }

        if (!this.areAdjacent(row1, col1, row2, col2)) {
            return { success: false, reason: 'Not adjacent' };
        }

        // 执行交换
        const temp = this.grid[row1][col1];
        this.grid[row1][col1] = this.grid[row2][col2];
        this.grid[row2][col2] = temp;

        // 更新元素位置
        if (this.grid[row1][col1]) {
            this.grid[row1][col1].row = row1;
            this.grid[row1][col1].col = col1;
        }
        if (this.grid[row2][col2]) {
            this.grid[row2][col2].row = row2;
            this.grid[row2][col2].col = col2;
        }

        // 检查交换后是否有匹配
        const hasMatches = this.hasMatchAt(row1, col1) || this.hasMatchAt(row2, col2);

        if (!hasMatches) {
            // 如果没有匹配，交换回去
            const temp = this.grid[row1][col1];
            this.grid[row1][col1] = this.grid[row2][col2];
            this.grid[row2][col2] = temp;

            // 恢复位置
            if (this.grid[row1][col1]) {
                this.grid[row1][col1].row = row1;
                this.grid[row1][col1].col = col1;
            }
            if (this.grid[row2][col2]) {
                this.grid[row2][col2].row = row2;
                this.grid[row2][col2].col = col2;
            }

            return { success: false, reason: 'No matches created' };
        }

        return { success: true };
    }

    // 检查指定位置是否有匹配
    hasMatchAt(row, col) {
        if (!this.isValidPosition(row, col) || !this.grid[row][col]) {
            return false;
        }

        const type = this.grid[row][col].type;

        // 检查水平匹配
        let horizontalCount = this.getHorizontalMatchCount(row, col, type);
        if (horizontalCount >= 3) return true;

        // 检查垂直匹配
        let verticalCount = this.getVerticalMatchCount(row, col, type);
        return verticalCount >= 3;
    }

    // 获取水平匹配数量
    getHorizontalMatchCount(row, col, type) {
        let count = 1;

        // 向左计数
        for (let c = col - 1; c >= 0; c--) {
            if (this.grid[row][c] && this.grid[row][c].type === type) {
                count++;
            } else {
                break;
            }
        }

        // 向右计数
        for (let c = col + 1; c < this.cols; c++) {
            if (this.grid[row][c] && this.grid[row][c].type === type) {
                count++;
            } else {
                break;
            }
        }

        return count;
    }

    // 获取垂直匹配数量
    getVerticalMatchCount(row, col, type) {
        let count = 1;

        // 向上计数
        for (let r = row - 1; r >= 0; r--) {
            if (this.grid[r][col] && this.grid[r][col].type === type) {
                count++;
            } else {
                break;
            }
        }

        // 向下计数
        for (let r = row + 1; r < this.rows; r++) {
            if (this.grid[r][col] && this.grid[r][col].type === type) {
                count++;
            } else {
                break;
            }
        }

        return count;
    }

    // 查找所有匹配
    findAllMatches() {
        const matches = [];
        const processed = new Set();

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.grid[row][col] || processed.has(`${row}-${col}`)) {
                    continue;
                }

                const element = this.grid[row][col];
                const type = element.type;

                // 查找水平匹配
                const horizontalMatch = this.findHorizontalMatch(row, col, type);
                if (horizontalMatch.length >= 3) {
                    matches.push({
                        type: type,
                        direction: 'horizontal',
                        cells: horizontalMatch,
                        length: horizontalMatch.length,
                        centerX: (horizontalMatch[0].col + horizontalMatch[horizontalMatch.length - 1].col) / 2,
                        centerY: row
                    });

                    // 标记已处理
                    horizontalMatch.forEach(cell => {
                        processed.add(`${cell.row}-${cell.col}`);
                    });
                }

                // 查找垂直匹配
                if (!processed.has(`${row}-${col}`)) {
                    const verticalMatch = this.findVerticalMatch(row, col, type);
                    if (verticalMatch.length >= 3) {
                        matches.push({
                            type: type,
                            direction: 'vertical',
                            cells: verticalMatch,
                            length: verticalMatch.length,
                            centerX: col,
                            centerY: (verticalMatch[0].row + verticalMatch[verticalMatch.length - 1].row) / 2
                        });

                        // 标记已处理
                        verticalMatch.forEach(cell => {
                            processed.add(`${cell.row}-${cell.col}`);
                        });
                    }
                }
            }
        }

        return matches;
    }

    // 查找水平匹配
    findHorizontalMatch(row, col, type) {
        const match = [{ row, col }];

        // 向左扩展
        for (let c = col - 1; c >= 0; c--) {
            if (this.grid[row][c] && this.grid[row][c].type === type) {
                match.unshift({ row, col: c });
            } else {
                break;
            }
        }

        // 向右扩展
        for (let c = col + 1; c < this.cols; c++) {
            if (this.grid[row][c] && this.grid[row][c].type === type) {
                match.push({ row, col: c });
            } else {
                break;
            }
        }

        return match;
    }

    // 查找垂直匹配
    findVerticalMatch(row, col, type) {
        const match = [{ row, col }];

        // 向上扩展
        for (let r = row - 1; r >= 0; r--) {
            if (this.grid[r][col] && this.grid[r][col].type === type) {
                match.unshift({ row: r, col });
            } else {
                break;
            }
        }

        // 向下扩展
        for (let r = row + 1; r < this.rows; r++) {
            if (this.grid[r][col] && this.grid[r][col].type === type) {
                match.push({ row: r, col });
            } else {
                break;
            }
        }

        return match;
    }

    // 移除匹配的元素
    removeMatches(matches) {
        const removedElements = [];

        matches.forEach(match => {
            match.cells.forEach(cell => {
                if (this.grid[cell.row][cell.col]) {
                    removedElements.push(this.grid[cell.row][cell.col]);
                    this.grid[cell.row][cell.col] = null;
                }
            });
        });

        return removedElements;
    }

    // 检查是否生成特殊元素
    checkForSpecialElements(matches) {
        const specialElements = [];

        matches.forEach(match => {
            let specialType = null;

            if (match.length === 4) {
                // 生成火箭
                specialType = match.direction === 'horizontal' ?
                    this.specialTypes.ROCKET_H : this.specialTypes.ROCKET_V;
            } else if (match.length >= 5) {
                // 生成彩色猫头鹰
                specialType = this.specialTypes.RAINBOW;
            }

            if (specialType) {
                // 在匹配的中心位置生成特殊元素
                const centerCell = match.cells[Math.floor(match.cells.length / 2)];
                specialElements.push({
                    type: specialType,
                    row: centerCell.row,
                    col: centerCell.col,
                    originalType: match.type
                });
            }
        });

        return specialElements;
    }

    // 应用重力效果
    async applyGravity() {
        const fallingElements = [];

        for (let col = 0; col < this.cols; col++) {
            // 从底部向上处理每一列
            let writeIndex = this.rows - 1;

            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    if (row !== writeIndex) {
                        // 移动元素
                        this.grid[writeIndex][col] = this.grid[row][col];
                        this.grid[row][col] = null;

                        // 更新元素位置
                        this.grid[writeIndex][col].row = writeIndex;
                        this.grid[writeIndex][col].col = col;

                        fallingElements.push({
                            element: this.grid[writeIndex][col],
                            fromRow: row,
                            toRow: writeIndex,
                            col: col
                        });
                    }
                    writeIndex--;
                }
            }
        }

        return fallingElements;
    }

    // 生成新元素填充空位
    async generateNewElements() {
        const newElements = [];

        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (this.grid[row][col] === null) {
                    const elementType = this.getRandomElementType();
                    const newElement = this.createElement(elementType, row, col);
                    this.grid[row][col] = newElement;
                    newElements.push(newElement);
                }
            }
        }

        return newElements;
    }

    // 检查是否有有效移动
    hasValidMoves() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // 检查与右邻居的交换
                if (col < this.cols - 1) {
                    if (this.wouldCreateMatchAfterSwap(row, col, row, col + 1)) {
                        return true;
                    }
                }

                // 检查与下邻居的交换
                if (row < this.rows - 1) {
                    if (this.wouldCreateMatchAfterSwap(row, col, row + 1, col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // 检查交换后是否会产生匹配
    wouldCreateMatchAfterSwap(row1, col1, row2, col2) {
        // 临时交换
        const temp = this.grid[row1][col1];
        this.grid[row1][col1] = this.grid[row2][col2];
        this.grid[row2][col2] = temp;

        // 检查是否有匹配
        const hasMatch = this.hasMatchAt(row1, col1) || this.hasMatchAt(row2, col2);

        // 交换回去
        this.grid[row2][col2] = this.grid[row1][col1];
        this.grid[row1][col1] = temp;

        return hasMatch;
    }

    // 洗牌棋盘
    async shuffleBoard() {
        console.log('🔀 Shuffling board...');

        const elements = [];

        // 收集所有元素
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    elements.push(this.grid[row][col].type);
                }
            }
        }

        // 洗牌算法
        for (let i = elements.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [elements[i], elements[j]] = [elements[j], elements[i]];
        }

        // 重新分配元素
        let index = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (index < elements.length) {
                    this.grid[row][col] = this.createElement(elements[index], row, col);
                    index++;
                }
            }
        }

        // 确保洗牌后有可移动的步数
        let attempts = 0;
        while (!this.hasValidMoves() && attempts < 10) {
            await this.shuffleBoard();
            attempts++;
        }
    }

    // 更新动画
    update(deltaTime) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const element = this.grid[row][col];
                if (element && element.isAnimating && element.animationData) {
                    this.updateElementAnimation(element, deltaTime);
                }
            }
        }
    }

    updateElementAnimation(element, deltaTime) {
        const anim = element.animationData;
        anim.elapsed += deltaTime;

        const progress = Math.min(anim.elapsed / anim.duration, 1);
        const eased = this.easeInOutCubic(progress);

        switch (anim.type) {
            case 'fall':
                element.visualY = anim.startY + (anim.endY - anim.startY) * eased;
                break;
            case 'swap':
                element.visualX = anim.startX + (anim.endX - anim.startX) * eased;
                element.visualY = anim.startY + (anim.endY - anim.startY) * eased;
                break;
        }

        if (progress >= 1) {
            element.isAnimating = false;
            element.animationData = null;
            element.visualX = element.col;
            element.visualY = element.row;
        }
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    // 工具方法
    isValidPosition(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    getElement(row, col) {
        if (!this.isValidPosition(row, col)) return null;
        return this.grid[row][col];
    }

    setElement(row, col, element) {
        if (!this.isValidPosition(row, col)) return false;
        this.grid[row][col] = element;
        if (element) {
            element.row = row;
            element.col = col;
        }
        return true;
    }

    // 调试方法
    printBoard() {
        console.log('📋 Current board state:');
        for (let row = 0; row < this.rows; row++) {
            const rowStr = this.grid[row].map(cell =>
                cell ? cell.type.charAt(0).toUpperCase() : '·'
            ).join(' ');
            console.log(`${row}: ${rowStr}`);
        }
    }

    // 获取棋盘统计信息
    getBoardStats() {
        const stats = {
            totalElements: 0,
            elementCounts: {},
            emptySpaces: 0,
            specialElements: 0
        };

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const element = this.grid[row][col];
                if (element) {
                    stats.totalElements++;
                    if (element.isSpecial) {
                        stats.specialElements++;
                    }
                    stats.elementCounts[element.type] = (stats.elementCounts[element.type] || 0) + 1;
                } else {
                    stats.emptySpaces++;
                }
            }
        }

        return stats;
    }
}

// 导出GameBoard类
window.GameBoard = GameBoard;