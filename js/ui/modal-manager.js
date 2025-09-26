/**
 * 模态弹窗管理器
 * 负责管理游戏中的各种弹窗和对话框
 */

class ModalManager {
    constructor() {
        this.activeModals = [];
        this.modalContainer = null;
        this.overlay = null;
        this.zIndexBase = 1000;
        this.initialized = false;

        console.log('📋 ModalManager initialized');
    }

    // 初始化模态管理器
    initialize() {
        if (this.initialized) return;

        this.createModalContainer();
        this.createOverlay();
        this.bindEvents();
        this.initialized = true;

        console.log('✅ Modal manager initialized');
    }

    // 创建模态容器
    createModalContainer() {
        this.modalContainer = document.createElement('div');
        this.modalContainer.id = 'modal-container';
        this.modalContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: ${this.zIndexBase};
        `;
        document.body.appendChild(this.modalContainer);
    }

    // 创建背景遮罩
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'modal-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            pointer-events: none;
            z-index: ${this.zIndexBase - 1};
        `;
        document.body.appendChild(this.overlay);
    }

    // 绑定事件
    bindEvents() {
        // ESC键关闭模态
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModals.length > 0) {
                this.closeTopModal();
            }
        });

        // 点击遮罩关闭模态
        this.overlay.addEventListener('click', () => {
            if (this.activeModals.length > 0) {
                const topModal = this.activeModals[this.activeModals.length - 1];
                if (topModal.closeOnOverlayClick) {
                    this.closeModal(topModal.id);
                }
            }
        });
    }

    // 显示确认对话框
    showConfirm(options) {
        const {
            title = '确认',
            message = '',
            confirmText = '确定',
            cancelText = '取消',
            onConfirm = () => {},
            onCancel = () => {}
        } = options;

        const modalId = 'confirm_' + Date.now();

        const modal = this.createModal({
            id: modalId,
            className: 'confirm-modal',
            closeOnOverlayClick: false,
            content: `
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">${cancelText}</button>
                    <button class="btn btn-primary" data-action="confirm">${confirmText}</button>
                </div>
            `
        });

        // 绑定按钮事件
        const confirmBtn = modal.querySelector('[data-action="confirm"]');
        const cancelBtn = modal.querySelector('[data-action="cancel"]');

        confirmBtn.addEventListener('click', () => {
            this.closeModal(modalId);
            onConfirm();
        });

        cancelBtn.addEventListener('click', () => {
            this.closeModal(modalId);
            onCancel();
        });

        this.showModal(modalId);
        return modalId;
    }

    // 显示警告对话框
    showAlert(options) {
        const {
            title = '提示',
            message = '',
            buttonText = '确定',
            onClose = () => {}
        } = options;

        const modalId = 'alert_' + Date.now();

        const modal = this.createModal({
            id: modalId,
            className: 'alert-modal',
            closeOnOverlayClick: true,
            content: `
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" data-action="close">${buttonText}</button>
                </div>
            `
        });

        // 绑定关闭按钮
        const closeBtn = modal.querySelector('[data-action="close"]');
        closeBtn.addEventListener('click', () => {
            this.closeModal(modalId);
            onClose();
        });

        this.showModal(modalId);
        return modalId;
    }

    // 显示loading对话框
    showLoading(options) {
        const {
            title = '加载中...',
            message = '请稍候',
            showSpinner = true
        } = options;

        const modalId = 'loading_' + Date.now();

        const spinnerHtml = showSpinner ? `
            <div class="spinner">
                <div class="spinner-circle"></div>
            </div>
        ` : '';

        const modal = this.createModal({
            id: modalId,
            className: 'loading-modal',
            closeOnOverlayClick: false,
            content: `
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    ${spinnerHtml}
                    <p>${message}</p>
                </div>
            `
        });

        this.showModal(modalId);
        return modalId;
    }

    // 显示输入对话框
    showPrompt(options) {
        const {
            title = '输入',
            message = '',
            placeholder = '',
            defaultValue = '',
            inputType = 'text',
            confirmText = '确定',
            cancelText = '取消',
            onConfirm = () => {},
            onCancel = () => {}
        } = options;

        const modalId = 'prompt_' + Date.now();

        const modal = this.createModal({
            id: modalId,
            className: 'prompt-modal',
            closeOnOverlayClick: false,
            content: `
                <div class="modal-header">
                    <h3>${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                    <input type="${inputType}" id="${modalId}_input" class="form-input"
                           placeholder="${placeholder}" value="${defaultValue}">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">${cancelText}</button>
                    <button class="btn btn-primary" data-action="confirm">${confirmText}</button>
                </div>
            `
        });

        const input = modal.querySelector(`#${modalId}_input`);
        const confirmBtn = modal.querySelector('[data-action="confirm"]');
        const cancelBtn = modal.querySelector('[data-action="cancel"]');

        // 焦点到输入框
        setTimeout(() => {
            input.focus();
            input.select();
        }, 100);

        // 回车确认
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                confirmBtn.click();
            }
        });

        confirmBtn.addEventListener('click', () => {
            const value = input.value;
            this.closeModal(modalId);
            onConfirm(value);
        });

        cancelBtn.addEventListener('click', () => {
            this.closeModal(modalId);
            onCancel();
        });

        this.showModal(modalId);
        return modalId;
    }

    // 创建自定义模态
    createModal(options) {
        const {
            id,
            className = '',
            closeOnOverlayClick = true,
            content = '',
            width = 'auto',
            height = 'auto'
        } = options;

        const modal = document.createElement('div');
        modal.id = id;
        modal.className = `modal ${className}`;
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.7);
            width: ${width};
            height: ${height};
            max-width: 90vw;
            max-height: 90vh;
            background: white;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            pointer-events: auto;
            overflow: hidden;
            z-index: ${this.zIndexBase + this.activeModals.length + 1};
        `;

        modal.innerHTML = content;

        // 添加关闭按钮（如果没有自定义关闭按钮）
        if (!modal.querySelector('[data-action="close"]') && !modal.querySelector('.modal-footer')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                position: absolute;
                top: 10px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            `;
            closeBtn.addEventListener('click', () => this.closeModal(id));
            modal.appendChild(closeBtn);
        }

        this.modalContainer.appendChild(modal);

        // 保存模态信息
        this.activeModals.push({
            id,
            element: modal,
            closeOnOverlayClick
        });

        return modal;
    }

    // 显示模态
    showModal(id) {
        const modalInfo = this.activeModals.find(m => m.id === id);
        if (!modalInfo) return;

        // 显示遮罩
        this.overlay.style.visibility = 'visible';
        this.overlay.style.opacity = '1';
        this.overlay.style.pointerEvents = 'auto';

        // 显示模态
        const modal = modalInfo.element;
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.transform = 'translate(-50%, -50%) scale(1)';

        // 触发音效
        if (window.audioManager) {
            window.audioManager.playClickSound();
        }

        console.log(`📋 Modal shown: ${id}`);
    }

    // 关闭模态
    closeModal(id) {
        const modalIndex = this.activeModals.findIndex(m => m.id === id);
        if (modalIndex === -1) return;

        const modalInfo = this.activeModals[modalIndex];
        const modal = modalInfo.element;

        // 隐藏模态
        modal.style.opacity = '0';
        modal.style.transform = 'translate(-50%, -50%) scale(0.7)';
        modal.style.visibility = 'hidden';

        // 从数组中移除
        this.activeModals.splice(modalIndex, 1);

        // 如果没有其他模态，隐藏遮罩
        if (this.activeModals.length === 0) {
            this.overlay.style.opacity = '0';
            this.overlay.style.visibility = 'hidden';
            this.overlay.style.pointerEvents = 'none';
        }

        // 延迟移除DOM元素
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);

        console.log(`📋 Modal closed: ${id}`);
    }

    // 关闭顶层模态
    closeTopModal() {
        if (this.activeModals.length > 0) {
            const topModal = this.activeModals[this.activeModals.length - 1];
            this.closeModal(topModal.id);
        }
    }

    // 关闭所有模态
    closeAllModals() {
        while (this.activeModals.length > 0) {
            this.closeTopModal();
        }
    }

    // 检查模态是否打开
    isModalOpen(id) {
        return this.activeModals.some(m => m.id === id);
    }

    // 获取活动模态数量
    getActiveModalCount() {
        return this.activeModals.length;
    }
}

// 创建全局实例
window.modalManager = new ModalManager();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.modalManager.initialize();
});

console.log('📋 Modal utilities loaded');