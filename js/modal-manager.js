// 统一模态框管理器
class ModalManager {
    constructor() {
        this.activeModal = null;
        this.modalContainer = null;
        this.initialize();
    }

    initialize() {
        // 确保只有一个模态框容器
        this.modalContainer = document.getElementById('modal-container');
        if (!this.modalContainer) {
            this.modalContainer = document.createElement('div');
            this.modalContainer.id = 'modal-container';
            this.modalContainer.className = 'modal-container';
            document.body.appendChild(this.modalContainer);
        }

        // 添加统一样式
        this.addUnifiedStyles();
    }

    // 显示模态框
    show(content, options = {}) {
        // 关闭现有模态框
        this.close();

        const modal = document.createElement('div');
        modal.className = 'modal';

        // 添加关闭按钮（如果需要）
        if (options.closable !== false) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = () => this.close();
            modal.appendChild(closeBtn);
        }

        // 添加内容
        if (typeof content === 'string') {
            modal.innerHTML += content;
        } else if (content instanceof HTMLElement) {
            modal.appendChild(content);
        }

        this.modalContainer.appendChild(modal);
        this.modalContainer.style.display = 'flex';
        this.activeModal = modal;

        // 添加动画
        setTimeout(() => {
            this.modalContainer.classList.add('show');
            modal.classList.add('show');
        }, 10);

        // 点击背景关闭
        if (options.closeOnBackdrop !== false) {
            this.modalContainer.onclick = (e) => {
                if (e.target === this.modalContainer) {
                    this.close();
                }
            };
        }

        return modal;
    }

    // 关闭模态框
    close() {
        if (!this.activeModal) return;

        this.modalContainer.classList.add('hide');

        setTimeout(() => {
            this.modalContainer.style.display = 'none';
            this.modalContainer.innerHTML = '';
            this.modalContainer.classList.remove('show', 'hide');
            this.activeModal = null;
        }, 300);
    }

    // 检查是否有活跃的模态框
    hasActiveModal() {
        return this.activeModal !== null;
    }

    // 添加统一样式
    addUnifiedStyles() {
        if (document.getElementById('modal-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'modal-manager-styles';
        style.textContent = `
            .modal-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.6);
                display: none;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(2px);
            }

            .modal-container.show {
                opacity: 1;
            }

            .modal-container.hide {
                opacity: 0;
            }

            .modal-container .modal {
                background: white;
                border-radius: 20px;
                padding: 2rem;
                max-width: min(450px, 90vw);
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                transform: scale(0.9);
                transition: transform 0.3s ease;
                position: relative;
                margin: 1rem;
            }

            .modal-container.show .modal {
                transform: scale(1);
            }

            .modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: rgba(0, 0, 0, 0.1);
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.2s ease;
                color: #666;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1;
            }

            .modal-close:hover {
                background: rgba(0, 0, 0, 0.2);
                color: #333;
                transform: scale(1.1);
            }

            /* 移动端适配 */
            @media (max-width: 480px) {
                .modal-container .modal {
                    padding: 1.5rem;
                    margin: 0.5rem;
                    max-height: 90vh;
                    border-radius: 15px;
                }

                .modal-close {
                    top: 0.8rem;
                    right: 0.8rem;
                }
            }

            /* 滚动条样式 */
            .modal::-webkit-scrollbar {
                width: 6px;
            }

            .modal::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }

            .modal::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
            }

            .modal::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
        `;
        document.head.appendChild(style);
    }

    // 替换图片为emoji的工具方法
    static replaceImageWithEmoji(imgElement, fallbackEmoji = '🪙') {
        const emojiSpan = document.createElement('span');
        emojiSpan.textContent = fallbackEmoji;
        emojiSpan.className = 'emoji-icon ' + (imgElement.className || '');
        emojiSpan.style.fontSize = '1.2em';
        emojiSpan.style.display = 'inline-block';

        if (imgElement.parentNode) {
            imgElement.parentNode.replaceChild(emojiSpan, imgElement);
        }

        return emojiSpan;
    }
}

// 创建全局实例
window.modalManager = new ModalManager();