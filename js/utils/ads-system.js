/**
 * AdMon广告系统集成
 * 管理广告展示、奖励发放和收入统计
 */

class AdsSystem {
    constructor() {
        this.coinSystem = null;
        this.isAdLoaded = false;
        this.isAdPlaying = false;
        this.lastAdTime = 0;

        // AdMon配置
        this.adConfig = {
            publisherId: 'demo_publisher_id',  // 实际部署时需要替换
            appId: 'xiaobutting_wanbiying',
            placementIds: {
                rewardVideo: 'reward_video_main',
                interstitial: 'interstitial_main',
                banner: 'banner_bottom'
            },
            testMode: true  // 开发模式
        };

        // 广告奖励配置
        this.adRewards = {
            rewardVideo: {
                coins: 50,              // 激励视频奖励50万花币
                energy: 5,              // 或者5点体力
                extraMoves: 5,          // 或者5步额外步数
                powerup: 'random'       // 或者随机道具
            },
            interstitial: {
                coins: 10               // 插屏广告奖励10万花币
            }
        };

        // 广告限制配置
        this.adLimits = {
            dailyRewardVideoLimit: 10,  // 每日激励视频限制
            minInterval: 5 * 60 * 1000, // 最小间隔5分钟
            energyAdCooldown: 30 * 60 * 1000, // 体力广告冷却30分钟
            continueAdLimit: 3          // 每关最多3次继续广告
        };

        // 广告观看记录
        this.adWatchHistory = [];
        this.dailyAdCount = 0;
        this.lastAdDate = null;

        // 收入统计
        this.revenueStats = {
            totalImpressions: 0,
            totalClicks: 0,
            totalRevenue: 0,
            dailyRevenue: 0,
            lastRevenueUpdate: Date.now()
        };

        console.log('📺 AdsSystem initialized');
    }

    // 初始化广告系统
    async init(coinSystem) {
        this.coinSystem = coinSystem;

        try {
            // 加载广告SDK
            await this.loadAdSDK();

            // 初始化AdMon
            await this.initAdMon();

            // 加载用户数据
            this.loadAdData();

            // 预加载广告
            this.preloadAds();

            // 绑定事件
            this.bindEvents();

            console.log('✅ AdsSystem initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize AdsSystem:', error);
            // 降级到模拟模式
            this.enableFallbackMode();
            return false;
        }
    }

    // 加载广告SDK
    async loadAdSDK() {
        return new Promise((resolve, reject) => {
            // 检查AdMon SDK是否已加载
            if (window.AdMon) {
                resolve();
                return;
            }

            // 动态加载AdMon SDK
            const script = document.createElement('script');
            script.src = 'https://sdk.admon.com/admon-sdk.min.js';
            script.async = true;

            script.onload = () => {
                console.log('📡 AdMon SDK loaded');
                resolve();
            };

            script.onerror = () => {
                console.error('❌ Failed to load AdMon SDK');
                reject(new Error('AdMon SDK load failed'));
            };

            document.head.appendChild(script);

            // 5秒超时
            setTimeout(() => {
                reject(new Error('AdMon SDK load timeout'));
            }, 5000);
        });
    }

    // 初始化AdMon
    async initAdMon() {
        if (!window.AdMon) {
            throw new Error('AdMon SDK not available');
        }

        // 配置AdMon
        window.AdMon.init({
            publisherId: this.adConfig.publisherId,
            appId: this.adConfig.appId,
            testMode: this.adConfig.testMode,
            debug: window.location.hostname === 'localhost'
        });

        // 设置事件监听
        this.setupAdEventListeners();

        console.log('🎯 AdMon initialized');
    }

    // 设置广告事件监听
    setupAdEventListeners() {
        if (!window.AdMon) return;

        // 激励视频事件
        window.AdMon.on('rewardVideoLoaded', () => {
            this.isAdLoaded = true;
            console.log('📺 Reward video loaded');
        });

        window.AdMon.on('rewardVideoStarted', () => {
            this.isAdPlaying = true;
            this.recordAdImpression('rewardVideo');
            console.log('▶️ Reward video started');
        });

        window.AdMon.on('rewardVideoCompleted', (rewardInfo) => {
            this.isAdPlaying = false;
            this.handleAdReward('rewardVideo', rewardInfo);
            console.log('✅ Reward video completed');
        });

        window.AdMon.on('rewardVideoFailed', (error) => {
            this.isAdPlaying = false;
            this.handleAdError('rewardVideo', error);
            console.log('❌ Reward video failed:', error);
        });

        // 插屏广告事件
        window.AdMon.on('interstitialLoaded', () => {
            console.log('📱 Interstitial loaded');
        });

        window.AdMon.on('interstitialShown', () => {
            this.recordAdImpression('interstitial');
            console.log('📱 Interstitial shown');
        });

        window.AdMon.on('interstitialClosed', () => {
            console.log('📱 Interstitial closed');
        });
    }

    // 预加载广告
    preloadAds() {
        if (!window.AdMon) return;

        try {
            // 预加载激励视频
            window.AdMon.loadRewardVideo(this.adConfig.placementIds.rewardVideo);

            // 预加载插屏广告
            window.AdMon.loadInterstitial(this.adConfig.placementIds.interstitial);

            console.log('🔄 Ads preloading...');
        } catch (error) {
            console.error('❌ Failed to preload ads:', error);
        }
    }

    // 显示激励视频广告
    async showRewardVideo(rewardType = 'coins') {
        if (this.isAdPlaying) {
            console.log('⏳ Ad already playing');
            return { success: false, reason: 'AD_ALREADY_PLAYING' };
        }

        // 检查广告限制
        const limitCheck = this.checkAdLimits();
        if (!limitCheck.allowed) {
            return { success: false, reason: limitCheck.reason, message: limitCheck.message };
        }

        try {
            if (window.AdMon && this.isAdLoaded) {
                // 真实广告
                const result = await this.displayRealAd('rewardVideo', rewardType);
                return result;
            } else {
                // 模拟广告
                const result = await this.displaySimulatedAd('rewardVideo', rewardType);
                return result;
            }
        } catch (error) {
            console.error('❌ Failed to show reward video:', error);
            return { success: false, reason: 'AD_SHOW_FAILED', message: '广告显示失败' };
        }
    }

    // 显示插屏广告
    async showInterstitial() {
        try {
            if (window.AdMon) {
                window.AdMon.showInterstitial(this.adConfig.placementIds.interstitial);
                return { success: true };
            } else {
                // 模拟插屏广告
                return { success: true };
            }
        } catch (error) {
            console.error('❌ Failed to show interstitial:', error);
            return { success: false };
        }
    }

    // 显示真实广告
    displayRealAd(adType, rewardType) {
        return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                resolve({ success: false, reason: 'AD_TIMEOUT', message: '广告加载超时' });
            }, 10000);

            // 临时存储奖励类型
            this.pendingRewardType = rewardType;

            // 显示广告
            window.AdMon.showRewardVideo(this.adConfig.placementIds.rewardVideo);

            // 监听广告完成事件
            const onCompleted = () => {
                clearTimeout(timeoutId);
                window.AdMon.off('rewardVideoCompleted', onCompleted);
                window.AdMon.off('rewardVideoFailed', onFailed);
                resolve({ success: true, rewardType: rewardType });
            };

            const onFailed = () => {
                clearTimeout(timeoutId);
                window.AdMon.off('rewardVideoCompleted', onCompleted);
                window.AdMon.off('rewardVideoFailed', onFailed);
                resolve({ success: false, reason: 'AD_FAILED', message: '广告播放失败' });
            };

            window.AdMon.once('rewardVideoCompleted', onCompleted);
            window.AdMon.once('rewardVideoFailed', onFailed);
        });
    }

    // 显示模拟广告
    displaySimulatedAd(adType, rewardType) {
        return new Promise((resolve) => {
            console.log('🎬 Showing simulated ad...');

            // 显示模拟广告界面
            this.showSimulatedAdOverlay(adType, () => {
                // 模拟广告完成
                this.handleAdReward(adType, { rewardType: rewardType });
                resolve({ success: true, rewardType: rewardType });
            });
        });
    }

    // 显示模拟广告覆盖层
    showSimulatedAdOverlay(adType, onComplete) {
        const overlay = document.createElement('div');
        overlay.className = 'ad-overlay';
        overlay.innerHTML = `
            <div class="ad-container">
                <div class="ad-header">
                    <span class="ad-label">广告</span>
                    <button class="ad-close" disabled>✕</button>
                </div>
                <div class="ad-content">
                    <div class="ad-video">
                        <div class="ad-placeholder">
                            <h3>📺 模拟广告内容</h3>
                            <p>这是开发模式下的模拟广告</p>
                            <div class="ad-progress">
                                <div class="ad-progress-bar"></div>
                            </div>
                            <p class="ad-timer">还需观看 <span id="ad-countdown">30</span> 秒</p>
                        </div>
                    </div>
                </div>
                <div class="ad-footer">
                    <button class="ad-reward-btn" disabled>获得奖励</button>
                </div>
            </div>
        `;

        // 添加样式
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        document.body.appendChild(overlay);

        // 模拟30秒广告时长
        let countdown = 30;
        const countdownElement = overlay.querySelector('#ad-countdown');
        const progressBar = overlay.querySelector('.ad-progress-bar');
        const closeButton = overlay.querySelector('.ad-close');
        const rewardButton = overlay.querySelector('.ad-reward-btn');

        const timer = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            progressBar.style.width = `${(30 - countdown) / 30 * 100}%`;

            if (countdown <= 0) {
                clearInterval(timer);
                closeButton.disabled = false;
                rewardButton.disabled = false;
                rewardButton.textContent = '点击获得奖励';
                countdownElement.textContent = '0';
                progressBar.style.width = '100%';
            }
        }, 1000);

        // 绑定事件
        closeButton.addEventListener('click', () => {
            if (!closeButton.disabled) {
                clearInterval(timer);
                document.body.removeChild(overlay);
                onComplete();
            }
        });

        rewardButton.addEventListener('click', () => {
            if (!rewardButton.disabled) {
                clearInterval(timer);
                document.body.removeChild(overlay);
                onComplete();
            }
        });
    }

    // 检查广告限制
    checkAdLimits() {
        const now = Date.now();
        const today = new Date().toDateString();

        // 检查日期变更
        if (this.lastAdDate !== today) {
            this.dailyAdCount = 0;
            this.lastAdDate = today;
        }

        // 检查每日限制
        if (this.dailyAdCount >= this.adLimits.dailyRewardVideoLimit) {
            return {
                allowed: false,
                reason: 'DAILY_LIMIT_REACHED',
                message: `今日广告观看次数已用完 (${this.adLimits.dailyRewardVideoLimit}次)`
            };
        }

        // 检查时间间隔
        if (now - this.lastAdTime < this.adLimits.minInterval) {
            const remaining = Math.ceil((this.adLimits.minInterval - (now - this.lastAdTime)) / 60000);
            return {
                allowed: false,
                reason: 'COOLDOWN_ACTIVE',
                message: `请等待 ${remaining} 分钟后再观看广告`
            };
        }

        return { allowed: true };
    }

    // 处理广告奖励
    handleAdReward(adType, rewardInfo) {
        const rewardType = rewardInfo.rewardType || this.pendingRewardType || 'coins';
        let reward = null;

        console.log(`🎁 Processing ad reward: ${adType} - ${rewardType}`);

        switch (rewardType) {
            case 'coins':
                reward = this.grantCoinReward();
                break;
            case 'energy':
                reward = this.grantEnergyReward();
                break;
            case 'extra-moves':
                reward = this.grantExtraMovesReward();
                break;
            case 'powerup':
                reward = this.grantPowerupReward();
                break;
            default:
                reward = this.grantCoinReward();
        }

        // 记录广告观看
        this.recordAdWatch(adType, rewardType, reward);

        // 更新限制计数
        this.updateAdLimits();

        // 显示奖励消息
        this.showRewardMessage(reward);

        // 预加载下一个广告
        setTimeout(() => this.preloadAds(), 1000);

        return reward;
    }

    // 发放万花币奖励
    grantCoinReward() {
        const amount = this.adRewards.rewardVideo.coins;
        if (this.coinSystem) {
            this.coinSystem.addCoins(amount, '观看广告奖励', { adType: 'rewardVideo' });
        }

        return {
            type: 'coins',
            amount: amount,
            message: `获得 ${amount} 万花币！`
        };
    }

    // 发放体力奖励
    grantEnergyReward() {
        const amount = this.adRewards.rewardVideo.energy;

        // 通过游戏系统发放体力
        if (window.gameApp?.energySystem) {
            window.gameApp.energySystem.addEnergy(amount, '广告奖励');
        }

        return {
            type: 'energy',
            amount: amount,
            message: `获得 ${amount} 点体力！`
        };
    }

    // 发放额外步数奖励
    grantExtraMovesReward() {
        const amount = this.adRewards.rewardVideo.extraMoves;

        // 通过游戏引擎发放额外步数
        if (window.gameApp?.gameEngine) {
            window.gameApp.gameEngine.addMoves(amount);
        }

        return {
            type: 'extra-moves',
            amount: amount,
            message: `获得 ${amount} 步额外步数！`
        };
    }

    // 发放道具奖励
    grantPowerupReward() {
        const powerups = ['hammer', 'shuffle', 'rainbow'];
        const randomPowerup = GameHelpers.array.randomElement(powerups);

        // 通过游戏系统发放道具
        if (window.gameApp?.inventorySystem) {
            window.gameApp.inventorySystem.addPowerup(randomPowerup, 1);
        }

        return {
            type: 'powerup',
            item: randomPowerup,
            amount: 1,
            message: `获得道具：${randomPowerup}！`
        };
    }

    // 记录广告观看
    recordAdWatch(adType, rewardType, reward) {
        const record = {
            id: GameHelpers.string.random(8),
            adType: adType,
            rewardType: rewardType,
            reward: reward,
            timestamp: Date.now(),
            date: new Date().toDateString()
        };

        this.adWatchHistory.unshift(record);

        // 只保留最近100条记录
        if (this.adWatchHistory.length > 100) {
            this.adWatchHistory = this.adWatchHistory.slice(0, 100);
        }

        this.saveAdData();
    }

    // 记录广告展示
    recordAdImpression(adType) {
        this.revenueStats.totalImpressions++;

        // 模拟收入计算（实际应该从AdMon获取）
        const estimatedRevenue = this.calculateEstimatedRevenue(adType);
        this.revenueStats.totalRevenue += estimatedRevenue;
        this.revenueStats.dailyRevenue += estimatedRevenue;

        this.saveAdData();
    }

    // 计算预估收入
    calculateEstimatedRevenue(adType) {
        // 模拟的eCPM值（实际应该从AdMon获取）
        const eCPM = {
            rewardVideo: 5.0,  // $5 per 1000 impressions
            interstitial: 3.0  // $3 per 1000 impressions
        };

        return (eCPM[adType] || 1.0) / 1000; // 转换为单次展示收入
    }

    // 更新广告限制计数
    updateAdLimits() {
        this.dailyAdCount++;
        this.lastAdTime = Date.now();
    }

    // 处理广告错误
    handleAdError(adType, error) {
        console.error(`❌ Ad error (${adType}):`, error);

        // 记录错误
        this.recordAdError(adType, error);

        // 尝试重新加载广告
        setTimeout(() => {
            this.preloadAds();
        }, 5000);
    }

    // 记录广告错误
    recordAdError(adType, error) {
        const errorRecord = {
            adType: adType,
            error: error.toString(),
            timestamp: Date.now()
        };

        const errors = GameHelpers.storage.get('ad_errors', []);
        errors.unshift(errorRecord);

        // 只保留最近50条错误记录
        if (errors.length > 50) {
            errors.splice(50);
        }

        GameHelpers.storage.set('ad_errors', errors);
    }

    // 显示奖励消息
    showRewardMessage(reward) {
        if (window.gameApp?.showMessage) {
            window.gameApp.showMessage(reward.message);
        } else {
            console.log('🎁 Reward message:', reward.message);
        }
    }

    // 绑定事件
    bindEvents() {
        // 观看广告按钮
        const adButtons = document.querySelectorAll('[data-ad-type]');
        adButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const adType = e.target.dataset.adType;
                const rewardType = e.target.dataset.rewardType || 'coins';
                this.showRewardVideo(rewardType);
            });
        });

        // 继续游戏广告按钮
        const continueBtn = document.getElementById('continue-with-ad');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                this.showRewardVideo('extra-moves');
            });
        }

        // 体力广告按钮
        const energyBtn = document.getElementById('energy-ad-btn');
        if (energyBtn) {
            energyBtn.addEventListener('click', () => {
                this.showRewardVideo('energy');
            });
        }
    }

    // 启用降级模式
    enableFallbackMode() {
        console.log('⚠️ Ads system running in fallback mode');
        this.fallbackMode = true;

        // 在降级模式下，所有广告都使用模拟版本
        this.isAdLoaded = true;
    }

    // 加载广告数据
    loadAdData() {
        const savedData = GameHelpers.storage.get('ads_data', {
            adWatchHistory: [],
            dailyAdCount: 0,
            lastAdDate: null,
            lastAdTime: 0,
            revenueStats: {
                totalImpressions: 0,
                totalClicks: 0,
                totalRevenue: 0,
                dailyRevenue: 0,
                lastRevenueUpdate: Date.now()
            }
        });

        this.adWatchHistory = savedData.adWatchHistory || [];
        this.dailyAdCount = savedData.dailyAdCount || 0;
        this.lastAdDate = savedData.lastAdDate;
        this.lastAdTime = savedData.lastAdTime || 0;
        this.revenueStats = { ...this.revenueStats, ...savedData.revenueStats };

        // 检查日期变更
        const today = new Date().toDateString();
        if (this.lastAdDate !== today) {
            this.dailyAdCount = 0;
            this.revenueStats.dailyRevenue = 0;
        }

        console.log(`💾 Loaded ads data: ${this.adWatchHistory.length} watch records, ${this.dailyAdCount} today`);
    }

    // 保存广告数据
    saveAdData() {
        const dataToSave = {
            adWatchHistory: this.adWatchHistory,
            dailyAdCount: this.dailyAdCount,
            lastAdDate: this.lastAdDate,
            lastAdTime: this.lastAdTime,
            revenueStats: this.revenueStats
        };

        GameHelpers.storage.set('ads_data', dataToSave);
    }

    // 获取广告观看历史
    getAdWatchHistory(limit = 20) {
        return this.adWatchHistory.slice(0, limit);
    }

    // 获取今日广告统计
    getTodayStats() {
        const today = new Date().toDateString();
        const todayRecords = this.adWatchHistory.filter(record => record.date === today);

        return {
            watchCount: todayRecords.length,
            remainingCount: Math.max(0, this.adLimits.dailyRewardVideoLimit - this.dailyAdCount),
            coinsEarned: todayRecords
                .filter(record => record.reward?.type === 'coins')
                .reduce((sum, record) => sum + record.reward.amount, 0),
            lastWatchTime: this.lastAdTime
        };
    }

    // 获取收入统计
    getRevenueStats() {
        return { ...this.revenueStats };
    }

    // 检查是否可以观看广告
    canWatchAd() {
        const limitCheck = this.checkAdLimits();
        return limitCheck.allowed;
    }

    // 获取下次可观看时间
    getNextAvailableTime() {
        if (this.dailyAdCount >= this.adLimits.dailyRewardVideoLimit) {
            // 返回明天0点
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return tomorrow.getTime();
        }

        return this.lastAdTime + this.adLimits.minInterval;
    }

    // 获取调试信息
    getDebugInfo() {
        return {
            isInitialized: !!this.coinSystem,
            isAdLoaded: this.isAdLoaded,
            isAdPlaying: this.isAdPlaying,
            fallbackMode: this.fallbackMode,
            dailyAdCount: this.dailyAdCount,
            canWatchAd: this.canWatchAd(),
            nextAvailableTime: new Date(this.getNextAvailableTime()).toLocaleString(),
            revenueStats: this.revenueStats,
            watchHistoryCount: this.adWatchHistory.length
        };
    }
}

// 导出AdsSystem类
window.AdsSystem = AdsSystem;