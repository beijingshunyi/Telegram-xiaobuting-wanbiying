class GameApp {
    constructor() {
        this.currentScreen = 'loading';
        this.isInitialized = false;
        this.initialize();
    }

    async initialize() {
        try {
            // 显示加载页面
            this.showScreen('loading');

            // 等待所有系统初始化完成
            await Promise.all([
                window.telegramApp.initPromise,
                window.dbManager.initPromise,
                window.userManager.initPromise
            ]);

            // 等待签到系统和广告系统初始化
            const initPromises = [];

            if (window.checkinSystem && window.checkinSystem.initialize) {
                initPromises.push(window.checkinSystem.initialize());
            } else {
                console.warn('CheckinSystem not available');
            }

            if (window.adsManager && window.adsManager.initialize) {
                initPromises.push(window.adsManager.initialize());
            } else {
                console.warn('AdsManager not available');
            }

            if (initPromises.length > 0) {
                await Promise.all(initPromises);
            }

            // 预加载资源
            await this.preloadResources();

            // 设置事件监听器
            this.setupEventListeners();

            // 初始化游戏引擎
            window.gameEngine = new GameEngine('game-canvas');

            // 显示主菜单
            setTimeout(() => {
                this.showScreen('main-menu');
                this.isInitialized = true;
            }, 2000);

            console.log('GameApp initialized successfully');

        } catch (error) {
            console.error('Failed to initialize GameApp:', error);
            this.showError('初始化失败，请刷新页面重试');
        }
    }

    preloadResources() {
        return new Promise((resolve) => {
            // 现在我们使用emoji替代了图片，所以不需要预加载图片
            // 但我们可以预加载音频文件
            const audioFiles = [
                'audio/match.mp3',
                'audio/coin.mp3',
                'audio/button.mp3'
            ];

            let loadedCount = 0;
            const totalCount = audioFiles.length;

            if (totalCount === 0) {
                resolve();
                return;
            }

            audioFiles.forEach(src => {
                const audio = new Audio();
                audio.oncanplaythrough = audio.onerror = () => {
                    loadedCount++;
                    if (loadedCount === totalCount) {
                        resolve();
                    }
                };
                audio.src = src;
                audio.load();
            });

            // 设置超时，避免音频加载阻塞游戏启动
            setTimeout(() => {
                resolve();
            }, 3000);
        });
    }

    setupEventListeners() {
        // Telegram事件监听
        document.addEventListener('telegram:mainButtonClick', () => {
            this.startGame();
        });

        document.addEventListener('telegram:backButtonClick', () => {
            this.handleBackButton();
        });

        // 用户事件监听
        document.addEventListener('user:loaded', (event) => {
            this.onUserLoaded(event.detail.user);
        });

        document.addEventListener('coins:changed', (event) => {
            this.onCoinsChanged(event.detail);
        });

        // 主菜单按钮事件
        this.setupMainMenuEvents();

        // 游戏界面按钮事件
        this.setupGameScreenEvents();

        // 工具按钮事件
        this.setupToolEvents();

        // 版权链接事件
        this.setupCopyrightEvents();
    }

    setupMainMenuEvents() {
        // 游戏模式按钮
        document.getElementById('classic-mode')?.addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('challenge-mode')?.addEventListener('click', () => {
            window.telegramApp.showAlert('挑战模式即将上线，敬请期待！');
        });

        document.getElementById('adventure-mode')?.addEventListener('click', () => {
            window.telegramApp.showAlert('冒险模式即将上线，敬请期待！');
        });

        // 功能按钮
        document.getElementById('daily-checkin')?.addEventListener('click', () => {
            this.showDailyCheckin();
        });

        document.getElementById('shop-btn')?.addEventListener('click', () => {
            this.showShop();
        });

        document.getElementById('achievements-btn')?.addEventListener('click', () => {
            this.showAchievements();
        });

        document.getElementById('leaderboard-btn')?.addEventListener('click', () => {
            this.showLeaderboard();
        });

        document.getElementById('withdraw-btn')?.addEventListener('click', () => {
            this.showWithdraw();
        });

        const inviteBtn = document.getElementById('invite-friends');
        if (inviteBtn) {
            inviteBtn.setAttribute('data-handled-by-main', 'true');
            inviteBtn.addEventListener('click', () => {
                this.inviteFriends();
            });
        }
    }

    setupGameScreenEvents() {
        document.getElementById('pause-btn')?.addEventListener('click', () => {
            window.gameEngine?.pause();
        });

        document.getElementById('menu-btn')?.addEventListener('click', () => {
            this.backToMenu();
        });
    }

    setupToolEvents() {
        document.getElementById('hammer-tool')?.addEventListener('click', () => {
            this.useTool('hammer');
        });

        document.getElementById('shuffle-tool')?.addEventListener('click', () => {
            this.useTool('shuffle');
        });

        document.getElementById('steps-tool')?.addEventListener('click', () => {
            this.useTool('steps');
        });

        document.getElementById('hint-tool')?.addEventListener('click', () => {
            this.useTool('hint');
        });
    }

    setupCopyrightEvents() {
        // 开发者链接
        document.getElementById('developer-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.telegramApp.openTelegramUser(CONFIG.COPYRIGHT.DEVELOPER);
        });

        document.getElementById('cooperation-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.telegramApp.openTelegramUser(CONFIG.COPYRIGHT.COOPERATION);
        });

        // 所有的版权链接
        document.querySelectorAll('.sponsor-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.telegramApp.openTelegramUser(CONFIG.COPYRIGHT.COOPERATION);
            });
        });
    }

    showScreen(screenName) {
        // 隐藏所有屏幕
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // 显示指定屏幕
        const screen = document.getElementById(`${screenName.replace('-', '-')}`);
        if (screen) {
            screen.classList.remove('hidden');
            this.currentScreen = screenName;

            // 当显示主菜单时启动背景音乐
            if (screenName === 'main-menu' && window.audioManager) {
                setTimeout(() => {
                    window.audioManager.playMusic();
                }, 500);
            }
        }

        // 更新Telegram按钮状态
        this.updateTelegramButtons();
    }

    updateTelegramButtons() {
        switch (this.currentScreen) {
            case 'loading':
                window.telegramApp.hideMainButton();
                window.telegramApp.hideBackButton();
                break;
            case 'main-menu':
                window.telegramApp.showMainButton('开始游戏');
                window.telegramApp.hideBackButton();
                break;
            case 'game-screen':
                window.telegramApp.hideMainButton();
                window.telegramApp.showBackButton();
                break;
            default:
                window.telegramApp.hideMainButton();
                window.telegramApp.showBackButton();
        }
    }

    async startGame() {
        try {
            // 检查每日游戏次数
            if (window.dailyAttemptsManager && !window.dailyAttemptsManager.hasAttempts()) {
                window.dailyAttemptsManager.showInsufficientAttemptsModal();
                return;
            }

            const success = await window.gameEngine?.startGame();
            if (success) {
                // 消耗一次游戏次数
                if (window.dailyAttemptsManager) {
                    await window.dailyAttemptsManager.consumeAttempt();
                }

                // 初始化游戏目标
                if (window.gameObjectives) {
                    const level = window.gameEngine.level || 1;
                    window.gameObjectives.initLevel(level);
                }

                this.showScreen('game-screen');
            } else {
                console.error('游戏启动失败');
                if (window.uiManager) {
                    window.uiManager.showNotification('游戏启动失败，请重试', 'error');
                }
            }
        } catch (error) {
            console.error('启动游戏时出错:', error);
            if (window.uiManager) {
                window.uiManager.showNotification('游戏启动失败，请重试', 'error');
            }
        }
    }

    backToMenu() {
        this.showScreen('main-menu');
        window.gameEngine?.backToMenu();
    }

    handleBackButton() {
        switch (this.currentScreen) {
            case 'game-screen':
                this.backToMenu();
                break;
            default:
                if (this.currentScreen !== 'main-menu') {
                    this.showScreen('main-menu');
                }
                break;
        }
    }

    onUserLoaded(user) {
        console.log('User loaded in GameApp:', user);

        // 更新UI显示
        this.updateUserDisplay(user);

        // 检查成就
        this.checkAchievements();
    }

    updateUserDisplay(user) {
        // 用户信息已经在UserManager中更新
        // 这里可以添加额外的UI更新逻辑
    }

    onCoinsChanged(detail) {
        // 显示金币变化动画
        this.showCoinChangeAnimation(detail.amount, detail.reason);
    }

    showCoinChangeAnimation(amount, reason) {
        const coinElement = document.getElementById('coin-count');
        if (!coinElement) return;

        // 创建浮动提示
        const popup = document.createElement('div');
        popup.className = 'coin-change-popup';
        popup.textContent = `${amount > 0 ? '+' : ''}${amount}`;
        popup.style.color = amount > 0 ? '#00b894' : '#d63031';

        const rect = coinElement.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.left = `${rect.left}px`;
        popup.style.top = `${rect.top - 30}px`;
        popup.style.zIndex = '10000';
        popup.style.animation = 'coinFloat 2s ease-out forwards';

        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 2000);
    }

    async useTool(toolType) {
        if (this.currentScreen !== 'game-screen' || !window.gameEngine) return;

        const user = window.userManager.getCurrentUser();
        if (!user || !user.tools[toolType] || user.tools[toolType] <= 0) {
            window.telegramApp.showAlert(`${CONFIG.TOOLS[toolType.toUpperCase()].name}不足！请前往商店购买。`);
            return;
        }

        let success = false;

        switch (toolType) {
            case 'hammer':
                // 等待用户点击要消除的方块
                window.telegramApp.showAlert('请点击要消除的方块');
                // 这里需要在游戏引擎中实现选择模式
                break;
            case 'shuffle':
                success = await window.gameEngine.useShuffle();
                break;
            case 'steps':
                success = await window.gameEngine.useExtraSteps();
                break;
            case 'hint':
                success = await window.gameEngine.useHint();
                break;
        }

        if (success) {
            window.telegramApp.hapticFeedback('light');
        }
    }

    showDailyCheckin() {
        if (window.checkinSystem) {
            window.checkinSystem.showCheckinModal();
        } else {
            console.warn('签到系统未初始化');
            if (window.uiManager) {
                window.uiManager.showNotification('签到功能正在加载中...', 'info');
            }
        }
    }

    showShop() {
        const content = `
            <div class="shop-modal">
                <h2>🛒 道具商店</h2>
                <div class="shop-container">
                    <div class="shop-tabs">
                        <button class="shop-tab active" data-tab="tools">道具</button>
                        <button class="shop-tab" data-tab="themes">皮肤</button>
                    </div>

                    <div class="shop-content" id="shop-tools">
                        ${this.generateToolsShop()}
                    </div>

                    <div class="shop-content hidden" id="shop-themes">
                        <p style="text-align: center; color: #666; padding: 2rem;">皮肤商店即将上线！</p>
                    </div>
                </div>

                <div class="sponsor-info">
                    <p>本功能由"${CONFIG.COPYRIGHT.SPONSOR}"提供技术支持</p>
                    <p>合作联系：<a href="#" onclick="window.telegramApp.openTelegramUser('${CONFIG.COPYRIGHT.COOPERATION}')" class="sponsor-link">${CONFIG.COPYRIGHT.COOPERATION}</a></p>
                </div>
            </div>
        `;

        try {
            const modal = window.modalManager.show(content, {
                closable: true,
                closeOnBackdrop: true
            });

            // 等待DOM渲染完成后再设置事件监听
            setTimeout(() => {
                // 设置标签切换
                modal.querySelectorAll('.shop-tab').forEach(tab => {
                    tab.addEventListener('click', (e) => {
                        modal.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                        modal.querySelectorAll('.shop-content').forEach(c => c.classList.add('hidden'));

                        e.target.classList.add('active');
                        modal.querySelector(`#shop-${e.target.dataset.tab}`).classList.remove('hidden');
                    });
                });

                // 设置购买按钮
                modal.querySelectorAll('.buy-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const toolType = e.target.dataset.tool;
                        const price = parseInt(e.target.dataset.price);
                        await this.buyTool(toolType, price);
                        window.modalManager.close();
                        // 延迟重新打开以避免冲突
                        setTimeout(() => this.showShop(), 300);
                    });
                });
            }, 100);

        } catch (error) {
            console.error('Failed to show shop modal:', error);
            // 降级到原来的模态框方法
            this.showShopFallback();
        }
    }

    showShopFallback() {
        const modal = this.createModal('道具商店', `
            <div class="shop-container">
                <div class="shop-tabs">
                    <button class="shop-tab active" data-tab="tools">道具</button>
                    <button class="shop-tab" data-tab="themes">皮肤</button>
                </div>

                <div class="shop-content" id="shop-tools">
                    ${this.generateToolsShop()}
                </div>

                <div class="shop-content hidden" id="shop-themes">
                    <p style="text-align: center; color: #666; padding: 2rem;">皮肤商店即将上线！</p>
                </div>
            </div>
        `);

        // 设置标签切换
        modal.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                modal.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                modal.querySelectorAll('.shop-content').forEach(c => c.classList.add('hidden'));

                e.target.classList.add('active');
                modal.querySelector(`#shop-${e.target.dataset.tab}`).classList.remove('hidden');
            });
        });

        // 设置购买按钮
        modal.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const toolType = e.target.dataset.tool;
                const price = parseInt(e.target.dataset.price);
                await this.buyTool(toolType, price);
                modal.remove();
                this.showShopFallback(); // 重新打开商店更新数量
            });
        });
    }

    generateToolsShop() {
        const user = window.userManager.getCurrentUser();
        let html = '';

        Object.entries(CONFIG.TOOLS).forEach(([key, tool]) => {
            const toolType = key.toLowerCase();
            const currentCount = user?.tools[toolType] || 0;

            html += `
                <div class="shop-item">
                    <div class="tool-info">
                        <div class="tool-icon">${tool.icon}</div>
                        <div class="tool-details">
                            <h4>${tool.name}</h4>
                            <p>${tool.description}</p>
                            <div class="tool-count">拥有: ${currentCount}</div>
                        </div>
                    </div>
                    <div class="tool-purchase">
                        <div class="tool-price">
                            <span class="emoji-icon mini-coin">🪙</span>
                            <span>${tool.price}</span>
                        </div>
                        <button class="buy-btn" data-tool="${toolType}" data-price="${tool.price}">
                            购买
                        </button>
                    </div>
                </div>
            `;
        });

        return html;
    }

    async buyTool(toolType, price) {
        const user = window.userManager.getCurrentUser();

        if (user.coins < price) {
            window.telegramApp.showAlert('万花币不足！');
            return;
        }

        const success = await window.userManager.spendCoins(price, `购买${CONFIG.TOOLS[toolType.toUpperCase()].name}`);

        if (success) {
            await window.userManager.addTool(toolType, 1);
            window.telegramApp.showAlert(`成功购买${CONFIG.TOOLS[toolType.toUpperCase()].name}！`);
        }
    }

    showAchievements() {
        const modal = this.createModal('成就系统', `
            <div class="achievements-container">
                <div class="achievements-header">
                    <p>完成成就可获得万花币奖励！</p>
                </div>
                <div class="achievements-list">
                    ${this.generateAchievementsList()}
                </div>
            </div>
        `);
    }

    generateAchievementsList() {
        const user = window.userManager.getCurrentUser();
        let html = '';

        Object.entries(CONFIG.ACHIEVEMENTS).forEach(([key, achievement]) => {
            const completed = user?.achievements?.includes(achievement.id) || false;
            const statusClass = completed ? 'completed' : 'incomplete';

            html += `
                <div class="achievement-item ${statusClass}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <div class="achievement-info">
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                        <div class="achievement-reward">
                            奖励: ${achievement.reward} ${CONFIG.CURRENCY.NAME}
                        </div>
                    </div>
                    <div class="achievement-status">
                        ${completed ? '✅' : '⏳'}
                    </div>
                </div>
            `;
        });

        return html;
    }

    showLeaderboard() {
        const modal = this.createModal('全服排行榜', `
            <div class="leaderboard-container">
                <div class="leaderboard-tabs">
                    <button class="leaderboard-tab active" data-tab="monthly">本月排行</button>
                    <button class="leaderboard-tab" data-tab="weekly">本周排行</button>
                </div>

                <div class="leaderboard-content">
                    <div class="leaderboard-rewards">
                        <h4>🏆 月度奖励</h4>
                        <p>每月最后一天24:00发放奖励</p>
                        <div class="reward-list">
                            <div class="reward-item">🥇 第1名: 5000万花币</div>
                            <div class="reward-item">🥈 第2名: 3000万花币</div>
                            <div class="reward-item">🥉 第3名: 2000万花币</div>
                            <div class="reward-item">4️⃣ 第4名: 1000万花币</div>
                            <div class="reward-item">5️⃣ 第5名: 500万花币</div>
                        </div>
                    </div>

                    <div class="leaderboard-list">
                        <div class="loading-message">
                            <p>正在加载排行榜数据...</p>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    showWithdraw() {
        // Check if we have the proper withdrawal manager
        if (window.withdrawManager && typeof window.withdrawManager.showWithdrawModal === 'function') {
            // Use the dedicated withdrawal manager
            window.withdrawManager.showWithdrawModal();
            return;
        }

        // Fallback to basic modal
        const content = `
            <div class="withdraw-modal">
                <h2>💰 提现中心</h2>
                <div class="withdraw-container">
                    <div class="withdraw-balance">
                        <h3>可提现余额</h3>
                        <div class="balance-display">
                            <span class="emoji-icon coin-icon">🪙</span>
                            <span class="balance-amount">${window.userManager.getCurrentUser()?.coins || 0}</span>
                        </div>
                        <p class="balance-note">= ${((window.userManager.getCurrentUser()?.coins || 0) / 100).toFixed(2)} 元</p>
                    </div>

                    <div class="withdraw-methods">
                        <div class="withdraw-method">
                            <div class="method-info">
                                <h4>💳 支付宝提现</h4>
                                <p>最低提现: ${CONFIG.WITHDRAW.ALIPAY_MIN} 万花币 (${CONFIG.WITHDRAW.ALIPAY_MIN/100}元)</p>
                                <p>手续费: 3% | 到账时间: 1-3个工作日</p>
                            </div>
                            <button class="withdraw-btn" onclick="window.withdrawManager?.showWithdrawForm('alipay')">
                                立即提现
                            </button>
                        </div>

                        <div class="withdraw-method">
                            <div class="method-info">
                                <h4>₿ USDT提现</h4>
                                <p>最低提现: ${CONFIG.WITHDRAW.USDT_MIN_USD} USDT</p>
                                <p>手续费: 3% | 到账时间: 24小时内</p>
                            </div>
                            <button class="withdraw-btn" onclick="window.withdrawManager?.showWithdrawForm('usdt')">
                                立即提现
                            </button>
                        </div>
                    </div>

                    <div class="withdraw-note">
                        <p>⚠️ 为确保提现成功，请填写准确的账户信息</p>
                        <p>🔐 所有提现数据均加密存储，保障资金安全</p>
                    </div>
                </div>

                <div class="sponsor-info">
                    <p>本功能由"${CONFIG.COPYRIGHT.SPONSOR}"提供技术支持</p>
                    <p>合作联系：<a href="#" onclick="window.telegramApp.openTelegramUser('${CONFIG.COPYRIGHT.COOPERATION}')" class="sponsor-link">${CONFIG.COPYRIGHT.COOPERATION}</a></p>
                </div>
            </div>
        `;

        try {
            window.modalManager.show(content, {
                closable: true,
                closeOnBackdrop: true
            });
        } catch (error) {
            console.error('Failed to show withdraw modal:', error);
            // Use fallback createModal
            this.createModal('提现中心', content);
        }
    }

    inviteFriends() {
        try {
            // Use the dedicated social manager if available
            if (window.socialManager && typeof window.socialManager.showInviteModal === 'function') {
                console.log('使用社交管理器显示邀请弹窗');
                window.socialManager.showInviteModal();
            } else {
                console.log('社交管理器不可用，使用简单的Telegram分享');
                // Fallback to simple Telegram share
                window.telegramApp.inviteFriend();
            }
        } catch (error) {
            console.error('邀请好友功能出错:', error);
            // 最终备用方案
            window.telegramApp.inviteFriend();
        }
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-container';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="sponsor-info">
                    <p>本功能由"${CONFIG.COPYRIGHT.SPONSOR}"提供技术支持</p>
                </div>
            </div>
        `;

        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        return modal;
    }

    checkAchievements() {
        // 检查成就逻辑将在achievements.js中实现
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h2>❌ 错误</h2>
            <p>${message}</p>
            <button onclick="location.reload()">刷新页面</button>
        `;

        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
        `;

        document.body.appendChild(errorDiv);
    }
}

// 添加相关CSS样式
const mainStyles = document.createElement('style');
mainStyles.textContent = `
    .coin-change-popup {
        font-weight: bold;
        font-size: 1.2rem;
        pointer-events: none;
        white-space: nowrap;
    }

    @keyframes coinFloat {
        0% {
            opacity: 1;
            transform: translateY(0);
        }
        100% {
            opacity: 0;
            transform: translateY(-40px);
        }
    }

    .shop-container, .achievements-container, .leaderboard-container, .withdraw-container {
        max-width: 100%;
    }

    .shop-tabs, .leaderboard-tabs {
        display: flex;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid #eee;
    }

    .shop-tab, .leaderboard-tab {
        flex: 1;
        padding: 1rem;
        border: none;
        background: none;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .shop-tab.active, .leaderboard-tab.active {
        border-bottom: 2px solid #667eea;
        color: #667eea;
        font-weight: 600;
    }

    .shop-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border: 1px solid #eee;
        border-radius: 8px;
        margin-bottom: 1rem;
    }

    .tool-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
    }

    .tool-icon {
        font-size: 2rem;
    }

    .tool-details h4 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }

    .tool-details p {
        margin: 0 0 0.5rem 0;
        color: #666;
        font-size: 0.9rem;
    }

    .tool-count {
        font-size: 0.8rem;
        color: #888;
    }

    .tool-purchase {
        text-align: right;
    }

    .tool-price {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        justify-content: flex-end;
        margin-bottom: 0.5rem;
    }

    .mini-coin {
        width: 16px;
        height: 16px;
    }

    .buy-btn {
        background: #667eea;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.3s ease;
    }

    .buy-btn:hover {
        background: #5a67d8;
    }

    .achievement-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid #eee;
        border-radius: 8px;
        margin-bottom: 1rem;
    }

    .achievement-item.completed {
        background: #f0f9ff;
        border-color: #bfdbfe;
    }

    .achievement-icon {
        font-size: 2rem;
    }

    .achievement-info {
        flex: 1;
    }

    .achievement-info h4 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }

    .achievement-info p {
        margin: 0 0 0.5rem 0;
        color: #666;
    }

    .achievement-reward {
        font-size: 0.9rem;
        color: #ffa500;
        font-weight: 500;
    }

    .achievement-status {
        font-size: 1.5rem;
    }

    .withdraw-balance {
        text-align: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        border-radius: 12px;
        margin-bottom: 2rem;
    }

    .balance-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin: 1rem 0;
        font-size: 1.5rem;
        font-weight: bold;
    }

    .withdraw-method {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border: 1px solid #eee;
        border-radius: 8px;
        margin-bottom: 1rem;
    }

    .method-info h4 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }

    .method-info p {
        margin: 0.2rem 0;
        color: #666;
        font-size: 0.9rem;
    }

    .withdraw-btn {
        background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
        color: white;
        border: none;
        padding: 0.8rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: transform 0.3s ease;
    }

    .withdraw-btn:hover {
        transform: translateY(-1px);
    }

    .withdraw-note {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 8px;
        padding: 1rem;
        margin-top: 1rem;
    }

    .withdraw-note p {
        margin: 0.3rem 0;
        color: #856404;
        font-size: 0.9rem;
    }

    @media (max-width: 480px) {
        .shop-item, .withdraw-method {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
        }

        .tool-info {
            flex-direction: column;
            text-align: center;
        }

        .tool-purchase {
            text-align: center;
        }
    }
`;

document.head.appendChild(mainStyles);

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.gameApp = new GameApp();
});

// 全局游戏应用实例
window.gameApp = null;