/**
 * 匹配检测器
 * 负责检测各种匹配模式：3连、4连、5连、L型、T型
 */

class MatchDetector {
    constructor() {
        // 匹配类型定义
        this.MATCH_TYPES = {
            LINE_3: 'line-3',
            LINE_4: 'line-4',
            LINE_5: 'line-5',
            LINE_6_PLUS: 'line-6+',
            L_SHAPE: 'l-shape',
            T_SHAPE: 't-shape',
            CROSS: 'cross'
        };

        console.log('🔍 MatchDetector initialized');
    }

    // 查找棋盘上所有匹配
    findAllMatches(board) {
        const matches = [];
        const processed = new Set();

        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                const element = board.getElement(row, col);
                if (!element || processed.has(`${row}-${col}`)) {
                    continue;
                }

                // 查找以当前位置为起点的所有匹配
                const cellMatches = this.findMatchesFromCell(board, row, col, processed);
                matches.push(...cellMatches);
            }
        }

        return this.optimizeMatches(matches);
    }

    // 从指定位置查找匹配
    findMatchesFromCell(board, row, col, processed) {
        const element = board.getElement(row, col);
        if (!element) return [];

        const matches = [];
        const type = element.type;

        // 查找水平匹配
        const horizontalMatch = this.findHorizontalMatch(board, row, col, type);
        if (horizontalMatch.length >= 3) {
            const matchInfo = this.analyzeMatch(horizontalMatch, 'horizontal', type);
            matches.push(matchInfo);

            // 标记已处理的单元格
            horizontalMatch.forEach(cell => {
                processed.add(`${cell.row}-${cell.col}`);
            });
        }

        // 查找垂直匹配（如果当前位置未被处理）
        if (!processed.has(`${row}-${col}`)) {
            const verticalMatch = this.findVerticalMatch(board, row, col, type);
            if (verticalMatch.length >= 3) {
                const matchInfo = this.analyzeMatch(verticalMatch, 'vertical', type);
                matches.push(matchInfo);

                // 标记已处理的单元格
                verticalMatch.forEach(cell => {
                    processed.add(`${cell.row}-${cell.col}`);
                });
            }
        }

        return matches;
    }

    // 查找水平匹配
    findHorizontalMatch(board, row, col, type) {
        const match = [{ row, col }];

        // 向左扩展
        for (let c = col - 1; c >= 0; c--) {
            const element = board.getElement(row, c);
            if (element && element.type === type) {
                match.unshift({ row, col: c });
            } else {
                break;
            }
        }

        // 向右扩展
        for (let c = col + 1; c < board.cols; c++) {
            const element = board.getElement(row, c);
            if (element && element.type === type) {
                match.push({ row, col: c });
            } else {
                break;
            }
        }

        return match;
    }

    // 查找垂直匹配
    findVerticalMatch(board, row, col, type) {
        const match = [{ row, col }];

        // 向上扩展
        for (let r = row - 1; r >= 0; r--) {
            const element = board.getElement(r, col);
            if (element && element.type === type) {
                match.unshift({ row: r, col });
            } else {
                break;
            }
        }

        // 向下扩展
        for (let r = row + 1; r < board.rows; r++) {
            const element = board.getElement(r, col);
            if (element && element.type === type) {
                match.push({ row: r, col });
            } else {
                break;
            }
        }

        return match;
    }

    // 分析匹配类型和特性
    analyzeMatch(cells, direction, type) {
        const length = cells.length;
        let matchType;
        let specialElementType = null;

        // 确定匹配类型
        if (length === 3) {
            matchType = this.MATCH_TYPES.LINE_3;
        } else if (length === 4) {
            matchType = this.MATCH_TYPES.LINE_4;
            // 4连生成火箭
            specialElementType = direction === 'horizontal' ? 'rocket-vertical' : 'rocket-horizontal';
        } else if (length === 5) {
            matchType = this.MATCH_TYPES.LINE_5;
            // 5连生成彩色猫头鹰
            specialElementType = 'rainbow-owl';
        } else {
            matchType = this.MATCH_TYPES.LINE_6_PLUS;
            // 6连及以上生成彩色猫头鹰
            specialElementType = 'rainbow-owl';
        }

        // 计算中心位置
        const centerIndex = Math.floor(cells.length / 2);
        const centerCell = cells[centerIndex];

        return {
            cells: cells,
            type: type,
            matchType: matchType,
            direction: direction,
            length: length,
            centerRow: centerCell.row,
            centerCol: centerCell.col,
            specialElement: specialElementType,
            score: this.calculateMatchScore(matchType, length),
            priority: this.getMatchPriority(matchType)
        };
    }

    // 检测L型和T型匹配
    findSpecialShapeMatches(board) {
        const shapeMatches = [];
        const processed = new Set();

        for (let row = 1; row < board.rows - 1; row++) {
            for (let col = 1; col < board.cols - 1; col++) {
                const element = board.getElement(row, col);
                if (!element || processed.has(`${row}-${col}`)) {
                    continue;
                }

                // 检测T型匹配
                const tMatch = this.findTShapeMatch(board, row, col, element.type);
                if (tMatch) {
                    shapeMatches.push(tMatch);
                    tMatch.cells.forEach(cell => {
                        processed.add(`${cell.row}-${cell.col}`);
                    });
                }

                // 检测L型匹配
                if (!processed.has(`${row}-${col}`)) {
                    const lMatch = this.findLShapeMatch(board, row, col, element.type);
                    if (lMatch) {
                        shapeMatches.push(lMatch);
                        lMatch.cells.forEach(cell => {
                            processed.add(`${cell.row}-${cell.col}`);
                        });
                    }
                }
            }
        }

        return shapeMatches;
    }

    // 查找T型匹配
    findTShapeMatch(board, row, col, type) {
        const element = board.getElement(row, col);
        if (!element || element.type !== type) return null;

        // 检查四个方向的T型
        const patterns = [
            // 上T型 (⊥)
            {
                horizontal: [{row: row, col: col-1}, {row: row, col: col}, {row: row, col: col+1}],
                vertical: [{row: row-1, col: col}, {row: row, col: col}]
            },
            // 下T型 (⊤)
            {
                horizontal: [{row: row, col: col-1}, {row: row, col: col}, {row: row, col: col+1}],
                vertical: [{row: row, col: col}, {row: row+1, col: col}]
            },
            // 左T型 (⊣)
            {
                vertical: [{row: row-1, col: col}, {row: row, col: col}, {row: row+1, col: col}],
                horizontal: [{row: row, col: col-1}, {row: row, col: col}]
            },
            // 右T型 (⊢)
            {
                vertical: [{row: row-1, col: col}, {row: row, col: col}, {row: row+1, col: col}],
                horizontal: [{row: row, col: col}, {row: row, col: col+1}]
            }
        ];

        for (const pattern of patterns) {
            if (this.checkPattern(board, pattern, type)) {
                const allCells = [...pattern.horizontal, ...pattern.vertical];
                const uniqueCells = this.removeDuplicateCells(allCells);

                return {
                    cells: uniqueCells,
                    type: type,
                    matchType: this.MATCH_TYPES.T_SHAPE,
                    direction: 'cross',
                    length: uniqueCells.length,
                    centerRow: row,
                    centerCol: col,
                    specialElement: 'rainbow-owl',
                    score: this.calculateMatchScore(this.MATCH_TYPES.T_SHAPE, uniqueCells.length),
                    priority: this.getMatchPriority(this.MATCH_TYPES.T_SHAPE)
                };
            }
        }

        return null;
    }

    // 查找L型匹配
    findLShapeMatch(board, row, col, type) {
        const element = board.getElement(row, col);
        if (!element || element.type !== type) return null;

        // 检查四个角的L型
        const patterns = [
            // 左上角L型 (┐)
            {
                horizontal: [{row: row, col: col-2}, {row: row, col: col-1}, {row: row, col: col}],
                vertical: [{row: row, col: col}, {row: row+1, col: col}, {row: row+2, col: col}]
            },
            // 右上角L型 (┌)
            {
                horizontal: [{row: row, col: col}, {row: row, col: col+1}, {row: row, col: col+2}],
                vertical: [{row: row, col: col}, {row: row+1, col: col}, {row: row+2, col: col}]
            },
            // 左下角L型 (┘)
            {
                horizontal: [{row: row, col: col-2}, {row: row, col: col-1}, {row: row, col: col}],
                vertical: [{row: row-2, col: col}, {row: row-1, col: col}, {row: row, col: col}]
            },
            // 右下角L型 (└)
            {
                horizontal: [{row: row, col: col}, {row: row, col: col+1}, {row: row, col: col+2}],
                vertical: [{row: row-2, col: col}, {row: row-1, col: col}, {row: row, col: col}]
            }
        ];

        for (const pattern of patterns) {
            if (this.checkPattern(board, pattern, type)) {
                const allCells = [...pattern.horizontal, ...pattern.vertical];
                const uniqueCells = this.removeDuplicateCells(allCells);

                return {
                    cells: uniqueCells,
                    type: type,
                    matchType: this.MATCH_TYPES.L_SHAPE,
                    direction: 'cross',
                    length: uniqueCells.length,
                    centerRow: row,
                    centerCol: col,
                    specialElement: 'rainbow-owl',
                    score: this.calculateMatchScore(this.MATCH_TYPES.L_SHAPE, uniqueCells.length),
                    priority: this.getMatchPriority(this.MATCH_TYPES.L_SHAPE)
                };
            }
        }

        return null;
    }

    // 检查模式是否匹配
    checkPattern(board, pattern, type) {
        const allCells = [...pattern.horizontal, ...pattern.vertical];

        for (const cell of allCells) {
            if (cell.row < 0 || cell.row >= board.rows ||
                cell.col < 0 || cell.col >= board.cols) {
                return false;
            }

            const element = board.getElement(cell.row, cell.col);
            if (!element || element.type !== type) {
                return false;
            }
        }

        return true;
    }

    // 移除重复的单元格
    removeDuplicateCells(cells) {
        const seen = new Set();
        return cells.filter(cell => {
            const key = `${cell.row}-${cell.col}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    // 优化匹配结果（合并重叠的匹配）
    optimizeMatches(matches) {
        if (matches.length <= 1) return matches;

        // 按优先级排序
        matches.sort((a, b) => b.priority - a.priority);

        const optimized = [];
        const usedCells = new Set();

        for (const match of matches) {
            // 检查是否与已使用的单元格重叠
            const hasOverlap = match.cells.some(cell =>
                usedCells.has(`${cell.row}-${cell.col}`)
            );

            if (!hasOverlap) {
                optimized.push(match);
                // 标记使用的单元格
                match.cells.forEach(cell => {
                    usedCells.add(`${cell.row}-${cell.col}`);
                });
            }
        }

        return optimized;
    }

    // 计算匹配得分
    calculateMatchScore(matchType, length) {
        const baseScores = {
            [this.MATCH_TYPES.LINE_3]: 100,
            [this.MATCH_TYPES.LINE_4]: 200,
            [this.MATCH_TYPES.LINE_5]: 500,
            [this.MATCH_TYPES.LINE_6_PLUS]: 800,
            [this.MATCH_TYPES.L_SHAPE]: 600,
            [this.MATCH_TYPES.T_SHAPE]: 700,
            [this.MATCH_TYPES.CROSS]: 1000
        };

        const baseScore = baseScores[matchType] || 100;
        const lengthBonus = Math.max(0, length - 3) * 50;

        return baseScore + lengthBonus;
    }

    // 获取匹配优先级
    getMatchPriority(matchType) {
        const priorities = {
            [this.MATCH_TYPES.LINE_3]: 1,
            [this.MATCH_TYPES.LINE_4]: 2,
            [this.MATCH_TYPES.LINE_5]: 4,
            [this.MATCH_TYPES.LINE_6_PLUS]: 5,
            [this.MATCH_TYPES.L_SHAPE]: 3,
            [this.MATCH_TYPES.T_SHAPE]: 3,
            [this.MATCH_TYPES.CROSS]: 6
        };

        return priorities[matchType] || 1;
    }

    // 检查指定位置的匹配潜力
    checkMatchPotential(board, row, col) {
        const element = board.getElement(row, col);
        if (!element) return null;

        const potential = {
            horizontal: 0,
            vertical: 0,
            canFormSpecial: false
        };

        const type = element.type;

        // 检查水平方向潜力
        let left = 0, right = 0;
        for (let c = col - 1; c >= 0; c--) {
            const leftElement = board.getElement(row, c);
            if (leftElement && leftElement.type === type) {
                left++;
            } else {
                break;
            }
        }

        for (let c = col + 1; c < board.cols; c++) {
            const rightElement = board.getElement(row, c);
            if (rightElement && rightElement.type === type) {
                right++;
            } else {
                break;
            }
        }

        potential.horizontal = left + right + 1;

        // 检查垂直方向潜力
        let up = 0, down = 0;
        for (let r = row - 1; r >= 0; r--) {
            const upElement = board.getElement(r, col);
            if (upElement && upElement.type === type) {
                up++;
            } else {
                break;
            }
        }

        for (let r = row + 1; r < board.rows; r++) {
            const downElement = board.getElement(r, col);
            if (downElement && downElement.type === type) {
                down++;
            } else {
                break;
            }
        }

        potential.vertical = up + down + 1;

        // 检查是否能形成特殊形状
        potential.canFormSpecial = potential.horizontal >= 3 && potential.vertical >= 3;

        return potential;
    }

    // 预测交换后的匹配
    predictSwapMatches(board, row1, col1, row2, col2) {
        // 临时交换
        const element1 = board.getElement(row1, col1);
        const element2 = board.getElement(row2, col2);

        board.setElement(row1, col1, element2);
        board.setElement(row2, col2, element1);

        // 查找匹配
        const matches = [];

        // 检查两个位置的匹配
        if (element2) {
            const match1 = this.findMatchesFromCell(board, row1, col1, new Set());
            matches.push(...match1);
        }

        if (element1) {
            const match2 = this.findMatchesFromCell(board, row2, col2, new Set());
            matches.push(...match2);
        }

        // 恢复棋盘
        board.setElement(row1, col1, element1);
        board.setElement(row2, col2, element2);

        return this.optimizeMatches(matches);
    }

    // 检查棋盘是否还有可能的匹配
    hasValidMoves(board) {
        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                // 检查与右邻居的交换
                if (col < board.cols - 1) {
                    const matches = this.predictSwapMatches(board, row, col, row, col + 1);
                    if (matches.length > 0) {
                        return true;
                    }
                }

                // 检查与下邻居的交换
                if (row < board.rows - 1) {
                    const matches = this.predictSwapMatches(board, row, col, row + 1, col);
                    if (matches.length > 0) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // 获取所有可能的移动
    getAllValidMoves(board) {
        const validMoves = [];

        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                // 检查与右邻居的交换
                if (col < board.cols - 1) {
                    const matches = this.predictSwapMatches(board, row, col, row, col + 1);
                    if (matches.length > 0) {
                        validMoves.push({
                            from: { row, col },
                            to: { row, col: col + 1 },
                            matches: matches,
                            score: matches.reduce((sum, match) => sum + match.score, 0)
                        });
                    }
                }

                // 检查与下邻居的交换
                if (row < board.rows - 1) {
                    const matches = this.predictSwapMatches(board, row, col, row + 1, col);
                    if (matches.length > 0) {
                        validMoves.push({
                            from: { row, col },
                            to: { row: row + 1, col },
                            matches: matches,
                            score: matches.reduce((sum, match) => sum + match.score, 0)
                        });
                    }
                }
            }
        }

        // 按得分排序
        validMoves.sort((a, b) => b.score - a.score);

        return validMoves;
    }
}

// 导出MatchDetector类
window.MatchDetector = MatchDetector;