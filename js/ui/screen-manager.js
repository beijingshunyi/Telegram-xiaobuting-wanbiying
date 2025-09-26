/**
 * 屏幕管理器
 * 负责管理游戏各个界面的切换和状态
 */

class ScreenManager {
    constructor() {
        this.screens = new Map();
        this.currentScreen = null;
        this.previousScreen = null;
        this.isTransitioning = false;

        // 屏幕转换动画配置
        this.transitionDuration = 300;
        this.transitionEasing = 'cubic-bezier(0.4, 0.0, 0.2, 1)';

        this.init();
        console.log('🖥️ ScreenManager initialized');
    }

    init() {
        // 注册所有屏幕
        this.registerScreens();

        // 绑定全局事件
        this.bindGlobalEvents();

        // 设置初始屏幕
        this.setInitialScreen();
    }

    // 注册所有游戏屏幕
    registerScreens() {
        const screenIds = [
            'loading-screen',
            'main-menu',
            'level-map',
            'game-screen',
            'withdraw-screen',
            'leaderboard-screen',
            'settings-screen'
        ];

        screenIds.forEach(screenId => {
            const element = document.getElementById(screenId);
            if (element) {
                this.screens.set(screenId, {
                    element: element,
                    id: screenId,
                    isActive: element.classList.contains('active'),
                    enterCallbacks: [],
                    exitCallbacks: [],
                    data: {}
                });
                console.log(`📱 Registered screen: ${screenId}`);
            } else {
                console.warn(`⚠️ Screen element not found: ${screenId}`);
            }
        });
    }

    // 绑定全局事件
    bindGlobalEvents() {
        // 监听浏览器后退按钮
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.screenId) {
                this.showScreen(event.state.screenId, null, false);
            }
        });

        // 监听键盘事件
        document.addEventListener('keydown', (event) => {
            this.handleGlobalKeyPress(event);
        });

        // 监听窗口大小变化
        window.addEventListener('resize', GameHelpers.performance.debounce(() => {
            this.handleResize();
        }, 250));
    }

    // 设置初始屏幕
    setInitialScreen() {
        // 查找当前激活的屏幕
        for (const [screenId, screen] of this.screens) {
            if (screen.isActive) {
                this.currentScreen = screenId;
                break;
            }
        }

        // 如果没有激活的屏幕，默认显示加载屏幕
        if (!this.currentScreen) {
            this.currentScreen = 'loading-screen';
            this.showScreen('loading-screen');
        }

        console.log(`🎯 Initial screen: ${this.currentScreen}`);
    }

    // 显示指定屏幕
    async showScreen(screenId, data = null, addToHistory = true) {
        if (this.isTransitioning) {
            console.log('⏳ Screen transition in progress, ignoring request');
            return false;
        }

        if (!this.screens.has(screenId)) {
            console.error(`❌ Screen not found: ${screenId}`);
            return false;
        }

        if (this.currentScreen === screenId) {
            console.log(`ℹ️ Screen ${screenId} is already active`);
            return true;
        }

        console.log(`🔄 Transitioning to screen: ${screenId}`);
        this.isTransitioning = true;

        try {
            // 执行屏幕切换
            await this.performTransition(screenId, data);

            // 更新历史记录
            if (addToHistory && screenId !== 'loading-screen') {
                this.updateHistory(screenId);
            }

            console.log(`✅ Successfully switched to screen: ${screenId}`);
            return true;

        } catch (error) {
            console.error('❌ Screen transition failed:', error);
            return false;

        } finally {
            this.isTransitioning = false;
        }
    }

    // 执行屏幕转换
    async performTransition(targetScreenId, data) {
        const currentScreenInfo = this.currentScreen ? this.screens.get(this.currentScreen) : null;
        const targetScreenInfo = this.screens.get(targetScreenId);

        // 准备目标屏幕
        if (data) {
            targetScreenInfo.data = { ...targetScreenInfo.data, ...data };
        }

        // 执行退出回调
        if (currentScreenInfo) {
            await this.executeCallbacks(currentScreenInfo.exitCallbacks, currentScreenInfo.data);
        }

        // 执行屏幕切换动画
        await this.animateTransition(currentScreenInfo, targetScreenInfo);

        // 更新当前屏幕状态
        this.previousScreen = this.currentScreen;
        this.currentScreen = targetScreenId;

        // 执行进入回调
        await this.executeCallbacks(targetScreenInfo.enterCallbacks, targetScreenInfo.data);

        // 触发屏幕切换事件
        this.dispatchScreenChangeEvent(targetScreenId, this.previousScreen);
    }

    // 执行转换动画
    async animateTransition(currentScreenInfo, targetScreenInfo) {
        const promises = [];

        // 隐藏当前屏幕
        if (currentScreenInfo) {
            promises.push(this.hideScreen(currentScreenInfo));
        }

        // 显示目标屏幕
        promises.push(this.showScreenElement(targetScreenInfo));

        await Promise.all(promises);
    }

    // 隐藏屏幕元素
    hideScreen(screenInfo) {
        return new Promise(resolve => {
            const element = screenInfo.element;

            element.style.transition = `opacity ${this.transitionDuration}ms ${this.transitionEasing}`;
            element.style.opacity = '0';

            setTimeout(() => {
                element.classList.remove('active');
                element.style.display = 'none';
                element.style.opacity = '';
                element.style.transition = '';
                screenInfo.isActive = false;
                resolve();
            }, this.transitionDuration);
        });
    }

    // 显示屏幕元素
    showScreenElement(screenInfo) {
        return new Promise(resolve => {
            const element = screenInfo.element;

            element.style.opacity = '0';
            element.style.display = 'flex';
            element.classList.add('active');
            screenInfo.isActive = true;

            // 强制重绘
            element.offsetHeight;

            element.style.transition = `opacity ${this.transitionDuration}ms ${this.transitionEasing}`;
            element.style.opacity = '1';

            setTimeout(() => {
                element.style.opacity = '';
                element.style.transition = '';
                resolve();
            }, this.transitionDuration);
        });
    }

    // 执行回调函数
    async executeCallbacks(callbacks, data) {
        for (const callback of callbacks) {
            try {
                await callback(data);
            } catch (error) {
                console.error('❌ Screen callback error:', error);
            }
        }
    }

    // 更新浏览器历史记录
    updateHistory(screenId) {
        const state = { screenId: screenId };
        const title = this.getScreenTitle(screenId);
        const url = `#${screenId}`;

        history.pushState(state, title, url);
    }

    // 获取屏幕标题
    getScreenTitle(screenId) {
        const titles = {
            'main-menu': '主菜单 - 消不停·万币赢',
            'level-map': '关卡地图 - 消不停·万币赢',
            'game-screen': '游戏中 - 消不停·万币赢',
            'withdraw-screen': '提现中心 - 消不停·万币赢',
            'leaderboard-screen': '排行榜 - 消不停·万币赢',
            'settings-screen': '设置 - 消不停·万币赢'
        };
        return titles[screenId] || '消不停·万币赢';
    }

    // 返回上一个屏幕
    goBack() {
        if (this.previousScreen && this.screens.has(this.previousScreen)) {
            this.showScreen(this.previousScreen);
            return true;
        }

        // 如果没有上一个屏幕，返回主菜单
        if (this.currentScreen !== 'main-menu') {
            this.showScreen('main-menu');
            return true;
        }

        return false;
    }

    // 注册屏幕进入回调
    onScreenEnter(screenId, callback) {
        const screen = this.screens.get(screenId);
        if (screen) {
            screen.enterCallbacks.push(callback);
            return true;
        }
        return false;
    }

    // 注册屏幕退出回调
    onScreenExit(screenId, callback) {
        const screen = this.screens.get(screenId);
        if (screen) {
            screen.exitCallbacks.push(callback);
            return true;
        }
        return false;
    }

    // 获取当前屏幕信息
    getCurrentScreen() {
        return this.currentScreen;
    }

    // 获取屏幕数据
    getScreenData(screenId) {
        const screen = this.screens.get(screenId);
        return screen ? screen.data : null;
    }

    // 设置屏幕数据
    setScreenData(screenId, data) {
        const screen = this.screens.get(screenId);
        if (screen) {
            screen.data = { ...screen.data, ...data };
            return true;
        }
        return false;
    }

    // 检查屏幕是否存在
    hasScreen(screenId) {
        return this.screens.has(screenId);
    }

    // 获取所有屏幕列表
    getScreenList() {
        return Array.from(this.screens.keys());
    }

    // 处理全局按键事件
    handleGlobalKeyPress(event) {
        switch (event.code) {
            case 'Escape':
                if (this.currentScreen !== 'main-menu') {
                    event.preventDefault();
                    this.goBack();
                }
                break;

            case 'F11':
                event.preventDefault();
                this.toggleFullscreen();
                break;
        }
    }

    // 处理窗口大小变化
    handleResize() {
        // 通知当前屏幕窗口大小已变化
        this.dispatchCustomEvent('screen-resize', {
            viewport: GameHelpers.device.getViewportSize(),
            orientation: GameHelpers.device.getOrientation()
        });
    }

    // 切换全屏模式
    async toggleFullscreen() {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                console.log('📱 Entered fullscreen mode');
            } else {
                await document.exitFullscreen();
                console.log('📱 Exited fullscreen mode');
            }
        } catch (error) {
            console.error('❌ Fullscreen toggle failed:', error);
        }
    }

    // 触发屏幕切换事件
    dispatchScreenChangeEvent(newScreen, oldScreen) {
        this.dispatchCustomEvent('screen-change', {
            newScreen: newScreen,
            oldScreen: oldScreen,
            timestamp: Date.now()
        });
    }

    // 触发自定义事件
    dispatchCustomEvent(eventType, detail) {
        const event = new CustomEvent(eventType, { detail });
        document.dispatchEvent(event);
    }

    // 预加载屏幕资源
    async preloadScreen(screenId) {
        const screen = this.screens.get(screenId);
        if (!screen) {
            console.error(`❌ Cannot preload unknown screen: ${screenId}`);
            return false;
        }

        console.log(`⏳ Preloading screen: ${screenId}`);

        try {
            // 这里可以添加屏幕特定的预加载逻辑
            // 例如：加载图片、音频、数据等

            console.log(`✅ Screen preloaded: ${screenId}`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to preload screen ${screenId}:`, error);
            return false;
        }
    }

    // 重置屏幕状态
    resetScreen(screenId) {
        const screen = this.screens.get(screenId);
        if (screen) {
            screen.data = {};
            console.log(`🔄 Screen reset: ${screenId}`);
            return true;
        }
        return false;
    }

    // 销毁屏幕管理器
    destroy() {
        // 清理事件监听器
        window.removeEventListener('popstate', this.handlePopState);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('keydown', this.handleGlobalKeyPress);

        // 清理屏幕数据
        this.screens.clear();
        this.currentScreen = null;
        this.previousScreen = null;

        console.log('🗑️ ScreenManager destroyed');
    }

    // 获取调试信息
    getDebugInfo() {
        return {
            currentScreen: this.currentScreen,
            previousScreen: this.previousScreen,
            isTransitioning: this.isTransitioning,
            screenCount: this.screens.size,
            screens: Array.from(this.screens.keys())
        };
    }
}

// 导出ScreenManager类
window.ScreenManager = ScreenManager;