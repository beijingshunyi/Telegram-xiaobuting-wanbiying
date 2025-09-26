/**
 * 特殊元素系统
 * 管理火箭、炸弹、彩色猫头鹰等特殊元素的生成、激活和效果
 */

class SpecialElementsManager {
    constructor() {
        // 特殊元素类型定义
        this.SPECIAL_TYPES = {
            ROCKET_H: 'rocket-horizontal',      // 横向火箭（消除整行）
            ROCKET_V: 'rocket-vertical',        // 纵向火箭（消除整列）
            BOMB: 'bomb',                       // 炸弹（3x3范围爆炸）
            RAINBOW_OWL: 'rainbow-owl'          // 彩色猫头鹰（消除全屏同色）
        };

        // 特殊元素组合效果
        this.COMBO_EFFECTS = {
            ROCKET_ROCKET: 'cross-blast',       // 火箭+火箭 = 十字爆炸
            ROCKET_BOMB: 'line-bomb',           // 火箭+炸弹 = 直线+爆炸
            ROCKET_RAINBOW: 'rainbow-line',     // 火箭+彩虹 = 彩虹直线
            BOMB_BOMB: 'mega-blast',            // 炸弹+炸弹 = 超级爆炸
            BOMB_RAINBOW: 'rainbow-blast',      // 炸弹+彩虹 = 彩虹爆炸
            RAINBOW_RAINBOW: 'clear-all'        // 彩虹+彩虹 = 全屏清除
        };

        console.log('✨ SpecialElementsManager initialized');
    }

    // 根据匹配创建特殊元素
    createSpecialElements(matches, board) {
        const specialElements = [];

        matches.forEach(match => {
            const specialType = this.determineSpecialType(match);
            if (specialType) {
                const specialElement = this.createSpecialElement(
                    specialType,
                    match.centerRow,
                    match.centerCol,
                    match.type
                );
                specialElements.push(specialElement);
            }
        });

        return specialElements;
    }

    // 确定应该创建的特殊元素类型
    determineSpecialType(match) {
        switch (match.matchType) {
            case 'line-4':
                // 4连直线生成火箭
                return match.direction === 'horizontal' ?
                    this.SPECIAL_TYPES.ROCKET_V : this.SPECIAL_TYPES.ROCKET_H;

            case 'line-5':
            case 'line-6+':
                // 5连及以上生成彩色猫头鹰
                return this.SPECIAL_TYPES.RAINBOW_OWL;

            case 'l-shape':
            case 't-shape':
                // L型或T型生成彩色猫头鹰
                return this.SPECIAL_TYPES.RAINBOW_OWL;

            default:
                return null;
        }
    }

    // 创建特殊元素对象
    createSpecialElement(specialType, row, col, originalType = null) {
        return {
            type: specialType,
            row: row,
            col: col,
            originalType: originalType,
            isSpecial: true,
            id: `${specialType}-${row}-${col}-${Date.now()}`,
            createTime: Date.now(),
            isAnimating: false,
            animationData: null,
            power: this.getSpecialElementPower(specialType)
        };
    }

    // 获取特殊元素威力值
    getSpecialElementPower(specialType) {
        const powers = {
            [this.SPECIAL_TYPES.ROCKET_H]: 2,
            [this.SPECIAL_TYPES.ROCKET_V]: 2,
            [this.SPECIAL_TYPES.BOMB]: 3,
            [this.SPECIAL_TYPES.RAINBOW_OWL]: 5
        };
        return powers[specialType] || 1;
    }

    // 激活特殊元素
    activateSpecialElement(element, board, targetRow = null, targetCol = null) {
        console.log(`🚀 Activating special element: ${element.type} at (${element.row}, ${element.col})`);

        const effects = {
            cellsToRemove: [],
            animations: [],
            score: 0,
            specialEffects: []
        };

        switch (element.type) {
            case this.SPECIAL_TYPES.ROCKET_H:
                return this.activateHorizontalRocket(element, board);

            case this.SPECIAL_TYPES.ROCKET_V:
                return this.activateVerticalRocket(element, board);

            case this.SPECIAL_TYPES.BOMB:
                return this.activateBomb(element, board);

            case this.SPECIAL_TYPES.RAINBOW_OWL:
                return this.activateRainbowOwl(element, board, targetRow, targetCol);

            default:
                console.warn(`Unknown special element type: ${element.type}`);
                return effects;
        }
    }

    // 激活横向火箭
    activateHorizontalRocket(element, board) {
        const effects = {
            cellsToRemove: [],
            animations: [{
                type: 'rocket-trail',
                direction: 'horizontal',
                row: element.row,
                col: element.col
            }],
            score: 0,
            specialEffects: ['horizontal-explosion']
        };

        // 消除整行
        for (let col = 0; col < board.cols; col++) {
            const targetElement = board.getElement(element.row, col);
            if (targetElement) {
                effects.cellsToRemove.push({
                    row: element.row,
                    col: col,
                    element: targetElement
                });
                effects.score += 20;
            }
        }

        console.log(`🔥 Horizontal rocket cleared ${effects.cellsToRemove.length} elements`);
        return effects;
    }

    // 激活纵向火箭
    activateVerticalRocket(element, board) {
        const effects = {
            cellsToRemove: [],
            animations: [{
                type: 'rocket-trail',
                direction: 'vertical',
                row: element.row,
                col: element.col
            }],
            score: 0,
            specialEffects: ['vertical-explosion']
        };

        // 消除整列
        for (let row = 0; row < board.rows; row++) {
            const targetElement = board.getElement(row, element.col);
            if (targetElement) {
                effects.cellsToRemove.push({
                    row: row,
                    col: element.col,
                    element: targetElement
                });
                effects.score += 20;
            }
        }

        console.log(`🔥 Vertical rocket cleared ${effects.cellsToRemove.length} elements`);
        return effects;
    }

    // 激活炸弹
    activateBomb(element, board) {
        const effects = {
            cellsToRemove: [],
            animations: [{
                type: 'bomb-explosion',
                row: element.row,
                col: element.col,
                radius: 1
            }],
            score: 0,
            specialEffects: ['bomb-blast']
        };

        // 3x3范围爆炸
        for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
            for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
                const targetRow = element.row + deltaRow;
                const targetCol = element.col + deltaCol;

                if (board.isValidPosition(targetRow, targetCol)) {
                    const targetElement = board.getElement(targetRow, targetCol);
                    if (targetElement) {
                        effects.cellsToRemove.push({
                            row: targetRow,
                            col: targetCol,
                            element: targetElement
                        });
                        effects.score += 15;
                    }
                }
            }
        }

        console.log(`💥 Bomb cleared ${effects.cellsToRemove.length} elements`);
        return effects;
    }

    // 激活彩色猫头鹰
    activateRainbowOwl(element, board, targetRow = null, targetCol = null) {
        const effects = {
            cellsToRemove: [],
            animations: [{
                type: 'rainbow-explosion',
                row: element.row,
                col: element.col
            }],
            score: 0,
            specialEffects: ['rainbow-blast']
        };

        let targetType = null;

        if (targetRow !== null && targetCol !== null) {
            // 如果指定了目标，消除该类型的所有元素
            const targetElement = board.getElement(targetRow, targetCol);
            if (targetElement && !targetElement.isSpecial) {
                targetType = targetElement.type;
            }
        }

        if (!targetType) {
            // 如果没有指定目标，随机选择一种普通元素类型
            const elementTypes = this.getAvailableElementTypes(board);
            if (elementTypes.length > 0) {
                targetType = elementTypes[Math.floor(Math.random() * elementTypes.length)];
            }
        }

        if (targetType) {
            // 消除棋盘上所有该类型的元素
            for (let row = 0; row < board.rows; row++) {
                for (let col = 0; col < board.cols; col++) {
                    const targetElement = board.getElement(row, col);
                    if (targetElement && targetElement.type === targetType) {
                        effects.cellsToRemove.push({
                            row: row,
                            col: col,
                            element: targetElement
                        });
                        effects.score += 25;

                        // 添加飞向彩虹猫头鹰的动画
                        effects.animations.push({
                            type: 'element-fly',
                            fromRow: row,
                            fromCol: col,
                            toRow: element.row,
                            toCol: element.col,
                            elementType: targetType
                        });
                    }
                }
            }
        }

        console.log(`🌈 Rainbow owl cleared ${effects.cellsToRemove.length} ${targetType} elements`);
        return effects;
    }

    // 获取棋盘上可用的普通元素类型
    getAvailableElementTypes(board) {
        const types = new Set();

        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                const element = board.getElement(row, col);
                if (element && !element.isSpecial) {
                    types.add(element.type);
                }
            }
        }

        return Array.from(types);
    }

    // 检测特殊元素组合
    detectSpecialCombination(element1, element2) {
        const type1 = element1.type;
        const type2 = element2.type;

        // 标准化组合（保证顺序一致）
        const combo = this.normalizeCombo(type1, type2);

        switch (combo) {
            case `${this.SPECIAL_TYPES.ROCKET_H}-${this.SPECIAL_TYPES.ROCKET_H}`:
            case `${this.SPECIAL_TYPES.ROCKET_V}-${this.SPECIAL_TYPES.ROCKET_V}`:
            case `${this.SPECIAL_TYPES.ROCKET_H}-${this.SPECIAL_TYPES.ROCKET_V}`:
                return this.COMBO_EFFECTS.ROCKET_ROCKET;

            case `${this.SPECIAL_TYPES.ROCKET_H}-${this.SPECIAL_TYPES.BOMB}`:
            case `${this.SPECIAL_TYPES.ROCKET_V}-${this.SPECIAL_TYPES.BOMB}`:
                return this.COMBO_EFFECTS.ROCKET_BOMB;

            case `${this.SPECIAL_TYPES.ROCKET_H}-${this.SPECIAL_TYPES.RAINBOW_OWL}`:
            case `${this.SPECIAL_TYPES.ROCKET_V}-${this.SPECIAL_TYPES.RAINBOW_OWL}`:
                return this.COMBO_EFFECTS.ROCKET_RAINBOW;

            case `${this.SPECIAL_TYPES.BOMB}-${this.SPECIAL_TYPES.BOMB}`:
                return this.COMBO_EFFECTS.BOMB_BOMB;

            case `${this.SPECIAL_TYPES.BOMB}-${this.SPECIAL_TYPES.RAINBOW_OWL}`:
                return this.COMBO_EFFECTS.BOMB_RAINBOW;

            case `${this.SPECIAL_TYPES.RAINBOW_OWL}-${this.SPECIAL_TYPES.RAINBOW_OWL}`:
                return this.COMBO_EFFECTS.RAINBOW_RAINBOW;

            default:
                return null;
        }
    }

    // 标准化组合名称
    normalizeCombo(type1, type2) {
        return [type1, type2].sort().join('-');
    }

    // 执行特殊组合效果
    executeSpecialCombo(comboType, element1, element2, board) {
        console.log(`💫 Executing special combo: ${comboType}`);

        const effects = {
            cellsToRemove: [],
            animations: [],
            score: 0,
            specialEffects: []
        };

        switch (comboType) {
            case this.COMBO_EFFECTS.ROCKET_ROCKET:
                return this.executeCrossBlast(element1, element2, board);

            case this.COMBO_EFFECTS.ROCKET_BOMB:
                return this.executeLineBomb(element1, element2, board);

            case this.COMBO_EFFECTS.ROCKET_RAINBOW:
                return this.executeRainbowLine(element1, element2, board);

            case this.COMBO_EFFECTS.BOMB_BOMB:
                return this.executeMegaBlast(element1, element2, board);

            case this.COMBO_EFFECTS.BOMB_RAINBOW:
                return this.executeRainbowBlast(element1, element2, board);

            case this.COMBO_EFFECTS.RAINBOW_RAINBOW:
                return this.executeClearAll(element1, element2, board);

            default:
                return effects;
        }
    }

    // 十字爆炸（两个火箭组合）
    executeCrossBlast(element1, element2, board) {
        const effects = {
            cellsToRemove: [],
            animations: [{
                type: 'cross-explosion',
                row: element1.row,
                col: element1.col
            }],
            score: 0,
            specialEffects: ['mega-cross-blast']
        };

        // 消除十字形区域
        const centerRow = element1.row;
        const centerCol = element1.col;

        // 消除整行
        for (let col = 0; col < board.cols; col++) {
            const element = board.getElement(centerRow, col);
            if (element) {
                effects.cellsToRemove.push({
                    row: centerRow,
                    col: col,
                    element: element
                });
                effects.score += 30;
            }
        }

        // 消除整列
        for (let row = 0; row < board.rows; row++) {
            if (row !== centerRow) { // 避免重复计算中心点
                const element = board.getElement(row, centerCol);
                if (element) {
                    effects.cellsToRemove.push({
                        row: row,
                        col: centerCol,
                        element: element
                    });
                    effects.score += 30;
                }
            }
        }

        return effects;
    }

    // 直线炸弹（火箭+炸弹组合）
    executeLineBomb(element1, element2, board) {
        const effects = {
            cellsToRemove: [],
            animations: [],
            score: 0,
            specialEffects: ['line-bomb-blast']
        };

        // 找出火箭元素
        const rocketElement = element1.type.includes('rocket') ? element1 : element2;
        const isHorizontal = rocketElement.type === this.SPECIAL_TYPES.ROCKET_H;

        if (isHorizontal) {
            // 水平方向，每个位置都产生3x3爆炸
            for (let col = 0; col < board.cols; col++) {
                const bombEffects = this.createBombExplosion(element1.row, col, board);
                effects.cellsToRemove.push(...bombEffects.cellsToRemove);
                effects.score += bombEffects.score;
            }
        } else {
            // 垂直方向，每个位置都产生3x3爆炸
            for (let row = 0; row < board.rows; row++) {
                const bombEffects = this.createBombExplosion(row, element1.col, board);
                effects.cellsToRemove.push(...bombEffects.cellsToRemove);
                effects.score += bombEffects.score;
            }
        }

        return effects;
    }

    // 彩虹直线（火箭+彩虹组合）
    executeRainbowLine(element1, element2, board) {
        const effects = {
            cellsToRemove: [],
            animations: [{
                type: 'rainbow-line',
                row: element1.row,
                col: element1.col
            }],
            score: 0,
            specialEffects: ['rainbow-line-blast']
        };

        // 随机选择3种元素类型，分别用火箭消除
        const elementTypes = this.getAvailableElementTypes(board);
        const selectedTypes = elementTypes.slice(0, Math.min(3, elementTypes.length));

        selectedTypes.forEach(type => {
            for (let row = 0; row < board.rows; row++) {
                for (let col = 0; col < board.cols; col++) {
                    const element = board.getElement(row, col);
                    if (element && element.type === type) {
                        effects.cellsToRemove.push({
                            row: row,
                            col: col,
                            element: element
                        });
                        effects.score += 40;
                    }
                }
            }
        });

        return effects;
    }

    // 超级爆炸（两个炸弹组合）
    executeMegaBlast(element1, element2, board) {
        const effects = {
            cellsToRemove: [],
            animations: [{
                type: 'mega-explosion',
                row: element1.row,
                col: element1.col,
                radius: 2
            }],
            score: 0,
            specialEffects: ['mega-blast']
        };

        // 5x5范围爆炸
        for (let deltaRow = -2; deltaRow <= 2; deltaRow++) {
            for (let deltaCol = -2; deltaCol <= 2; deltaCol++) {
                const targetRow = element1.row + deltaRow;
                const targetCol = element1.col + deltaCol;

                if (board.isValidPosition(targetRow, targetCol)) {
                    const element = board.getElement(targetRow, targetCol);
                    if (element) {
                        effects.cellsToRemove.push({
                            row: targetRow,
                            col: targetCol,
                            element: element
                        });
                        effects.score += 25;
                    }
                }
            }
        }

        return effects;
    }

    // 彩虹爆炸（炸弹+彩虹组合）
    executeRainbowBlast(element1, element2, board) {
        const effects = {
            cellsToRemove: [],
            animations: [],
            score: 0,
            specialEffects: ['rainbow-blast']
        };

        // 为每种元素类型在随机位置产生爆炸
        const elementTypes = this.getAvailableElementTypes(board);

        elementTypes.forEach(type => {
            // 找到该类型的所有元素位置
            const positions = [];
            for (let row = 0; row < board.rows; row++) {
                for (let col = 0; col < board.cols; col++) {
                    const element = board.getElement(row, col);
                    if (element && element.type === type) {
                        positions.push({ row, col });
                    }
                }
            }

            // 在每个位置产生小范围爆炸
            positions.forEach(pos => {
                const bombEffects = this.createBombExplosion(pos.row, pos.col, board, 1);
                effects.cellsToRemove.push(...bombEffects.cellsToRemove);
                effects.score += bombEffects.score;
            });
        });

        return effects;
    }

    // 全屏清除（两个彩虹组合）
    executeClearAll(element1, element2, board) {
        const effects = {
            cellsToRemove: [],
            animations: [{
                type: 'clear-all',
                row: element1.row,
                col: element1.col
            }],
            score: 0,
            specialEffects: ['clear-all-blast']
        };

        // 清除所有普通元素
        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                const element = board.getElement(row, col);
                if (element && !element.isSpecial) {
                    effects.cellsToRemove.push({
                        row: row,
                        col: col,
                        element: element
                    });
                    effects.score += 50;
                }
            }
        }

        console.log(`🌟 Clear All activated! Cleared ${effects.cellsToRemove.length} elements`);
        return effects;
    }

    // 创建炸弹爆炸效果
    createBombExplosion(centerRow, centerCol, board, radius = 1) {
        const effects = {
            cellsToRemove: [],
            score: 0
        };

        for (let deltaRow = -radius; deltaRow <= radius; deltaRow++) {
            for (let deltaCol = -radius; deltaCol <= radius; deltaCol++) {
                const targetRow = centerRow + deltaRow;
                const targetCol = centerCol + deltaCol;

                if (board.isValidPosition(targetRow, targetCol)) {
                    const element = board.getElement(targetRow, targetCol);
                    if (element) {
                        effects.cellsToRemove.push({
                            row: targetRow,
                            col: targetCol,
                            element: element
                        });
                        effects.score += 15;
                    }
                }
            }
        }

        return effects;
    }

    // 检查元素是否为特殊元素
    isSpecialElement(element) {
        if (!element) return false;
        return Object.values(this.SPECIAL_TYPES).includes(element.type);
    }

    // 获取特殊元素描述
    getSpecialElementDescription(type) {
        const descriptions = {
            [this.SPECIAL_TYPES.ROCKET_H]: '横向火箭：消除整行',
            [this.SPECIAL_TYPES.ROCKET_V]: '纵向火箭：消除整列',
            [this.SPECIAL_TYPES.BOMB]: '炸弹：3x3范围爆炸',
            [this.SPECIAL_TYPES.RAINBOW_OWL]: '彩色猫头鹰：消除全屏同色元素'
        };
        return descriptions[type] || '未知特殊元素';
    }

    // 获取特殊组合描述
    getComboDescription(comboType) {
        const descriptions = {
            [this.COMBO_EFFECTS.ROCKET_ROCKET]: '火箭组合：十字爆炸',
            [this.COMBO_EFFECTS.ROCKET_BOMB]: '火箭炸弹：直线爆炸',
            [this.COMBO_EFFECTS.ROCKET_RAINBOW]: '彩虹火箭：多色直线清除',
            [this.COMBO_EFFECTS.BOMB_BOMB]: '双重炸弹：超级爆炸',
            [this.COMBO_EFFECTS.BOMB_RAINBOW]: '彩虹炸弹：全屏爆炸',
            [this.COMBO_EFFECTS.RAINBOW_RAINBOW]: '双重彩虹：全屏清除'
        };
        return descriptions[comboType] || '未知组合';
    }
}

// 导出SpecialElementsManager类
window.SpecialElementsManager = SpecialElementsManager;