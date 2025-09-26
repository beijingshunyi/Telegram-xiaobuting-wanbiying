/**
 * 输入处理器
 * 处理鼠标、触摸和键盘输入事件
 */

class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.isEnabled = true;
        this.isDragging = false;
        this.startPos = { x: 0, y: 0 };
        this.currentPos = { x: 0, y: 0 };
        this.dragThreshold = 10; // 最小拖拽距离
        this.swipeThreshold = 30; // 滑动阈值
        this.tapDelay = 300; // 点击延迟

        // 触摸状态
        this.touchState = {
            active: false,
            startTime: 0,
            lastTouchTime: 0,
            touchCount: 0
        };

        // 回调函数
        this.onCellClick = null;
        this.onCellSwipe = null;
        this.onCellHover = null;
        this.onGesture = null;

        // 游戏板配置
        this.boardConfig = {
            rows: 8,
            cols: 8,
            cellSize: 64,
            offsetX: 0,
            offsetY: 0
        };

        console.log('🎮 InputHandler initialized');
        this.bindEvents();
    }

    // 绑定输入事件
    bindEvents() {
        if (!this.canvas) {
            console.error('❌ Canvas not available for input binding');
            return;
        }

        // 鼠标事件
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

        // 触摸事件
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this));

        // 防止默认的触摸行为
        this.canvas.addEventListener('touchstart', this.preventDefault);
        this.canvas.addEventListener('touchmove', this.preventDefault);

        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // 右键菜单禁用
        this.canvas.addEventListener('contextmenu', this.preventDefault);

        console.log('🔗 Input events bound successfully');
    }

    // 防止默认行为
    preventDefault(event) {
        event.preventDefault();
    }

    // 更新棋盘配置
    updateBoardConfig(config) {
        this.boardConfig = { ...this.boardConfig, ...config };
        console.log('🎯 Board config updated:', this.boardConfig);
    }

    // 启用/禁用输入处理
    setEnabled(enabled) {
        this.isEnabled = enabled;
        console.log(`🎮 Input handler ${enabled ? 'enabled' : 'disabled'}`);
    }

    // 鼠标按下事件
    handleMouseDown(event) {
        if (!this.isEnabled) return;

        const pos = this.getCanvasPosition(event);
        this.startDrag(pos.x, pos.y);

        // 添加视觉反馈
        this.addTouchFeedback(pos.x, pos.y);
    }

    // 鼠标移动事件
    handleMouseMove(event) {
        if (!this.isEnabled) return;

        const pos = this.getCanvasPosition(event);
        this.updateDrag(pos.x, pos.y);

        // 处理悬停
        if (!this.isDragging) {
            this.handleHover(pos.x, pos.y);
        }
    }

    // 鼠标抬起事件
    handleMouseUp(event) {
        if (!this.isEnabled) return;

        const pos = this.getCanvasPosition(event);
        this.endDrag(pos.x, pos.y);
    }

    // 鼠标离开事件
    handleMouseLeave(event) {
        if (!this.isEnabled) return;

        this.cancelDrag();
    }

    // 触摸开始事件
    handleTouchStart(event) {
        if (!this.isEnabled) return;

        const touches = event.touches;
        if (touches.length === 1) {
            // 单点触摸
            const touch = touches[0];
            const pos = this.getCanvasPosition(touch);

            this.touchState.active = true;
            this.touchState.startTime = Date.now();
            this.touchState.touchCount = 1;

            this.startDrag(pos.x, pos.y);
            this.addTouchFeedback(pos.x, pos.y);

        } else if (touches.length === 2) {
            // 双点触摸（缩放/旋转手势）
            this.handleMultiTouch(event);
        }
    }

    // 触摸移动事件
    handleTouchMove(event) {
        if (!this.isEnabled || !this.touchState.active) return;

        const touches = event.touches;
        if (touches.length === 1) {
            const touch = touches[0];
            const pos = this.getCanvasPosition(touch);
            this.updateDrag(pos.x, pos.y);
        }
    }

    // 触摸结束事件
    handleTouchEnd(event) {
        if (!this.isEnabled) return;

        const now = Date.now();
        const touchDuration = now - this.touchState.startTime;

        // 检查双击
        if (touchDuration < this.tapDelay) {
            const timeSinceLastTouch = now - this.touchState.lastTouchTime;
            if (timeSinceLastTouch < 500) {
                this.handleDoubleTap();
                this.touchState.lastTouchTime = 0;
            } else {
                this.touchState.lastTouchTime = now;
            }
        }

        const touches = event.changedTouches;
        if (touches.length > 0) {
            const touch = touches[0];
            const pos = this.getCanvasPosition(touch);
            this.endDrag(pos.x, pos.y);
        }

        this.touchState.active = false;
        this.touchState.touchCount = 0;
    }

    // 触摸取消事件
    handleTouchCancel(event) {
        if (!this.isEnabled) return;

        this.cancelDrag();
        this.touchState.active = false;
        this.touchState.touchCount = 0;
    }

    // 处理多点触摸
    handleMultiTouch(event) {
        // 暂时禁用多点触摸（避免意外操作）
        this.cancelDrag();

        if (this.onGesture) {
            this.onGesture({
                type: 'multitouch',
                touchCount: event.touches.length
            });
        }
    }

    // 键盘按下事件
    handleKeyDown(event) {
        if (!this.isEnabled) return;

        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.handleDirectionalInput('up');
                event.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.handleDirectionalInput('down');
                event.preventDefault();
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.handleDirectionalInput('left');
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.handleDirectionalInput('right');
                event.preventDefault();
                break;
            case 'Enter':
            case 'Space':
                this.handleConfirm();
                event.preventDefault();
                break;
            case 'Escape':
                this.handleCancel();
                event.preventDefault();
                break;
        }
    }

    // 开始拖拽
    startDrag(x, y) {
        this.isDragging = false; // 初始不算拖拽
        this.startPos = { x, y };
        this.currentPos = { x, y };

        console.log(`👆 Start drag at (${x}, ${y})`);
    }

    // 更新拖拽
    updateDrag(x, y) {
        if (!this.startPos) return;

        this.currentPos = { x, y };

        const distance = this.calculateDistance(this.startPos, this.currentPos);

        // 检查是否开始拖拽
        if (!this.isDragging && distance > this.dragThreshold) {
            this.isDragging = true;
            console.log('🔄 Drag started');
        }

        // 如果正在拖拽，更新视觉反馈
        if (this.isDragging) {
            this.updateDragFeedback();
        }
    }

    // 结束拖拽
    endDrag(x, y) {
        if (!this.startPos) return;

        const endPos = { x, y };
        const distance = this.calculateDistance(this.startPos, endPos);

        if (this.isDragging) {
            // 处理滑动
            this.handleSwipe(this.startPos, endPos, distance);
        } else if (distance < this.dragThreshold) {
            // 处理点击
            this.handleTap(this.startPos);
        }

        // 清理拖拽状态
        this.cleanupDrag();
        console.log(`👆 End drag at (${x}, ${y})`);
    }

    // 取消拖拽
    cancelDrag() {
        if (this.isDragging) {
            console.log('❌ Drag cancelled');
        }
        this.cleanupDrag();
    }

    // 清理拖拽状态
    cleanupDrag() {
        this.isDragging = false;
        this.startPos = null;
        this.currentPos = null;
        this.removeTouchFeedback();
        this.removeDragFeedback();
    }

    // 处理点击
    handleTap(pos) {
        const cellPos = this.screenToBoardPosition(pos.x, pos.y);
        if (this.isValidBoardPosition(cellPos)) {
            console.log(`🎯 Tap on cell (${cellPos.row}, ${cellPos.col})`);

            if (this.onCellClick) {
                this.onCellClick(cellPos.row, cellPos.col);
            }

            // 触觉反馈
            this.triggerHapticFeedback('light');
        }
    }

    // 处理滑动
    handleSwipe(startPos, endPos, distance) {
        if (distance < this.swipeThreshold) return;

        const startCell = this.screenToBoardPosition(startPos.x, startPos.y);
        const endCell = this.screenToBoardPosition(endPos.x, endPos.y);

        if (this.isValidBoardPosition(startCell) && this.isValidBoardPosition(endCell)) {
            // 检查是否为相邻单元格
            if (this.areAdjacentCells(startCell, endCell)) {
                console.log(`↔️ Swipe from (${startCell.row}, ${startCell.col}) to (${endCell.row}, ${endCell.col})`);

                if (this.onCellSwipe) {
                    this.onCellSwipe(startCell.row, startCell.col, endCell.row, endCell.col);
                }

                // 触觉反馈
                this.triggerHapticFeedback('medium');
            }
        }
    }

    // 处理悬停
    handleHover(x, y) {
        const cellPos = this.screenToBoardPosition(x, y);
        if (this.isValidBoardPosition(cellPos) && this.onCellHover) {
            this.onCellHover(cellPos.row, cellPos.col);
        }
    }

    // 处理双击
    handleDoubleTap() {
        console.log('👆👆 Double tap detected');

        if (this.onGesture) {
            this.onGesture({
                type: 'doubletap',
                position: this.startPos
            });
        }

        // 触觉反馈
        this.triggerHapticFeedback('heavy');
    }

    // 处理方向键输入
    handleDirectionalInput(direction) {
        console.log(`⌨️ Directional input: ${direction}`);

        if (this.onGesture) {
            this.onGesture({
                type: 'directional',
                direction: direction
            });
        }
    }

    // 处理确认键
    handleConfirm() {
        console.log('⌨️ Confirm key pressed');

        if (this.onGesture) {
            this.onGesture({
                type: 'confirm'
            });
        }
    }

    // 处理取消键
    handleCancel() {
        console.log('⌨️ Cancel key pressed');

        if (this.onGesture) {
            this.onGesture({
                type: 'cancel'
            });
        }
    }

    // 获取Canvas相对位置
    getCanvasPosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    // 屏幕坐标转棋盘坐标
    screenToBoardPosition(x, y) {
        const boardX = x - this.boardConfig.offsetX;
        const boardY = y - this.boardConfig.offsetY;

        return {
            row: Math.floor(boardY / this.boardConfig.cellSize),
            col: Math.floor(boardX / this.boardConfig.cellSize)
        };
    }

    // 棋盘坐标转屏幕坐标
    boardToScreenPosition(row, col) {
        return {
            x: col * this.boardConfig.cellSize + this.boardConfig.offsetX,
            y: row * this.boardConfig.cellSize + this.boardConfig.offsetY
        };
    }

    // 检查是否为有效的棋盘位置
    isValidBoardPosition(pos) {
        return pos.row >= 0 && pos.row < this.boardConfig.rows &&
               pos.col >= 0 && pos.col < this.boardConfig.cols;
    }

    // 检查两个单元格是否相邻
    areAdjacentCells(cell1, cell2) {
        const rowDiff = Math.abs(cell1.row - cell2.row);
        const colDiff = Math.abs(cell1.col - cell2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    // 计算两点距离
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 添加触摸反馈
    addTouchFeedback(x, y) {
        // 创建触摸反馈效果
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'touch-feedback';
        feedbackElement.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 40px;
            height: 40px;
            margin-left: -20px;
            margin-top: -20px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            pointer-events: none;
            z-index: 10000;
            animation: touchFeedback 0.3s ease-out forwards;
        `;

        document.body.appendChild(feedbackElement);

        // 自动移除
        setTimeout(() => {
            if (feedbackElement.parentNode) {
                feedbackElement.parentNode.removeChild(feedbackElement);
            }
        }, 300);
    }

    // 移除触摸反馈
    removeTouchFeedback() {
        const feedbacks = document.querySelectorAll('.touch-feedback');
        feedbacks.forEach(feedback => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        });
    }

    // 更新拖拽反馈
    updateDragFeedback() {
        // 可以在这里添加拖拽轨迹显示
        console.log('🔄 Update drag feedback');
    }

    // 移除拖拽反馈
    removeDragFeedback() {
        // 清理拖拽相关的视觉效果
        console.log('🧹 Remove drag feedback');
    }

    // 触发触觉反馈
    triggerHapticFeedback(type = 'light') {
        if (navigator.vibrate) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [50]
            };
            navigator.vibrate(patterns[type] || patterns.light);
        }
    }

    // 获取输入状态信息
    getInputState() {
        return {
            isEnabled: this.isEnabled,
            isDragging: this.isDragging,
            touchActive: this.touchState.active,
            touchCount: this.touchState.touchCount,
            startPos: this.startPos,
            currentPos: this.currentPos
        };
    }

    // 销毁输入处理器
    destroy() {
        if (this.canvas) {
            // 移除所有事件监听器
            this.canvas.removeEventListener('mousedown', this.handleMouseDown);
            this.canvas.removeEventListener('mousemove', this.handleMouseMove);
            this.canvas.removeEventListener('mouseup', this.handleMouseUp);
            this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);

            this.canvas.removeEventListener('touchstart', this.handleTouchStart);
            this.canvas.removeEventListener('touchmove', this.handleTouchMove);
            this.canvas.removeEventListener('touchend', this.handleTouchEnd);
            this.canvas.removeEventListener('touchcancel', this.handleTouchCancel);

            this.canvas.removeEventListener('touchstart', this.preventDefault);
            this.canvas.removeEventListener('touchmove', this.preventDefault);
            this.canvas.removeEventListener('contextmenu', this.preventDefault);
        }

        document.removeEventListener('keydown', this.handleKeyDown);

        // 清理状态
        this.cleanupDrag();
        this.onCellClick = null;
        this.onCellSwipe = null;
        this.onCellHover = null;
        this.onGesture = null;

        console.log('🗑️ InputHandler destroyed');
    }
}

// 添加触摸反馈CSS动画
const style = document.createElement('style');
style.textContent = `
@keyframes touchFeedback {
    0% {
        transform: scale(0);
        opacity: 0.8;
    }
    50% {
        transform: scale(1);
        opacity: 0.6;
    }
    100% {
        transform: scale(2);
        opacity: 0;
    }
}
`;
document.head.appendChild(style);

// 导出InputHandler类
window.InputHandler = InputHandler;