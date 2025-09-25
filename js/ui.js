// UI管理器
class UIManager {
    constructor() {
        this.currentScreen = 'loading';
        this.modals = {};
        this.initialize();
    }

    initialize() {
        this.setupScreenSwitching();
        this.setupModalHandling();
        this.setupButtonSounds();
    }

    // 设置屏幕切换
    setupScreenSwitching() {
        // 隐藏所有屏幕除了loading
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            if (screen.id !== 'loading-screen') {
                screen.classList.add('hidden');
            }
        });
    }

    // 显示屏幕
    showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => {
            if (screen.id === screenId) {
                screen.classList.remove('hidden');
            } else {
                screen.classList.add('hidden');
            }
        });
        this.currentScreen = screenId;
    }

    // 设置模态框处理
    setupModalHandling() {
        // 点击模态框背景关闭
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
        });
    }

    // 显示模态框
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            this.modals[modalId] = true;
        }
    }

    // 关闭模态框
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            delete this.modals[modalId];
        }
    }

    // 关闭顶层模态框
    closeTopModal() {
        const modalIds = Object.keys(this.modals);
        if (modalIds.length > 0) {
            this.closeModal(modalIds[modalIds.length - 1]);
        }
    }

    // 设置按钮音效
    setupButtonSounds() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .btn, .menu-btn, .game-mode-btn')) {
                this.playButtonSound();
            }
        });
    }

    // 播放按钮音效
    playButtonSound() {
        const buttonSound = document.getElementById('button-sound');
        if (buttonSound) {
            buttonSound.currentTime = 0;
            buttonSound.play().catch(e => console.log('无法播放按钮音效:', e));
        }
    }

    // 显示加载动画
    showLoading(message = '加载中...') {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingText = document.querySelector('.loading-text');

        if (loadingScreen && loadingText) {
            loadingText.textContent = message;
            this.showScreen('loading-screen');
        }
    }

    // 显示通知消息
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#44ff44' : '#4444ff'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // 显示确认对话框
    showConfirm(message, onConfirm, onCancel) {
        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal show';
        confirmModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-body">
                    <p>${message}</p>
                    <div class="button-group">
                        <button class="btn btn-secondary" id="confirm-cancel">取消</button>
                        <button class="btn btn-primary" id="confirm-ok">确定</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(confirmModal);

        const okBtn = confirmModal.querySelector('#confirm-ok');
        const cancelBtn = confirmModal.querySelector('#confirm-cancel');

        okBtn.onclick = () => {
            document.body.removeChild(confirmModal);
            if (onConfirm) onConfirm();
        };

        cancelBtn.onclick = () => {
            document.body.removeChild(confirmModal);
            if (onCancel) onCancel();
        };
    }

    // 更新用户信息显示
    updateUserDisplay(user) {
        const username = document.getElementById('username');
        const userLevel = document.getElementById('user-level');
        const userAvatar = document.getElementById('user-avatar');
        const coinCount = document.getElementById('coin-count');

        if (username) username.textContent = user.first_name || user.username || '未知用户';
        if (userLevel) userLevel.textContent = user.level || 1;
        if (userAvatar && user.photo_url) userAvatar.src = user.photo_url;
        if (coinCount) coinCount.textContent = (user.coins || 0).toLocaleString();
    }

    // 更新体力显示
    updateEnergyDisplay(current, max) {
        const energyFill = document.getElementById('energy-fill');
        const energyCount = document.getElementById('energy-count');

        if (energyFill) {
            const percentage = (current / max) * 100;
            energyFill.style.width = percentage + '%';
        }

        if (energyCount) {
            energyCount.textContent = current;
        }
    }
}

// 创建全局实例
window.uiManager = new UIManager();

// CSS样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        justify-content: center;
        align-items: center;
    }

    .modal.show {
        display: flex;
    }

    .button-group {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin-top: 20px;
    }
`;
document.head.appendChild(style);