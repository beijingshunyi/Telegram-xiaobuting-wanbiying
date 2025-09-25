class AdsManager {
    constructor() {
        this.isAdMobLoaded = false;
        this.bannerAd = null;
        this.rewardedAd = null;
        this.manualAds = [];
        this.adQueue = [];
        this.isShowingAd = false;
        this.dailyAdCount = 0;
        this.maxDailyAds = 10;
        this.lastAdDate = null;

        this.initialize();
    }

    async initialize() {
        // 初始化AdMob
        await this.initializeAdMob();

        // 加载手动广告
        await this.loadManualAds();

        // 初始化横幅广告
        this.initializeBannerAd();

        // 检查每日广告计数
        this.checkDailyAdReset();

        // 强制显示横幅广告 - 确保广告能够显示
        setTimeout(() => {
            this.forceShowBannerAd();
        }, 1000);

        console.log('AdsManager initialized');
    }

    // 强制显示横幅广告
    forceShowBannerAd() {
        const bannerContainer = document.getElementById('banner-ad');
        if (bannerContainer && this.manualAds.length > 0) {
            // 清除现有内容
            bannerContainer.innerHTML = '';
            // 重新显示手动广告
            this.showManualBannerAd();
            console.log('Banner ad force displayed');
        }
    }

    async initializeAdMob() {
        try {
            // 检查AdMob SDK是否已加载
            if (typeof window.adsbygoogle !== 'undefined') {
                this.isAdMobLoaded = true;
                console.log('AdMob SDK loaded successfully');
            } else {
                console.warn('AdMob SDK not loaded');
                this.isAdMobLoaded = false;
            }
        } catch (error) {
            console.error('Failed to initialize AdMob:', error);
            this.isAdMobLoaded = false;
        }
    }

    async loadManualAds() {
        // 从服务器加载手动广告配置
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}/ads/manual`);
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    this.manualAds = await response.json();
                } else {
                    console.warn('API返回非JSON响应，使用默认广告');
                    this.manualAds = this.getDefaultManualAds();
                }
            } else {
                console.warn(`API请求失败: ${response.status} ${response.statusText}`);
                this.manualAds = this.getDefaultManualAds();
            }
        } catch (error) {
            console.error('Failed to load manual ads:', error);
            this.manualAds = this.getDefaultManualAds();
        }
    }

    getDefaultManualAds() {
        return [
            {
                id: 'default_1',
                type: 'image',
                title: '消不停·万必赢',
                description: '本游戏由"北京修车【万花楼】"赞助，开发@bjxc010 合作联系@bjxc010',
                imageUrl: 'images/ads/car-repair-ad.jpg',
                linkUrl: 'https://t.me/bjxc010',
                sponsor: CONFIG.COPYRIGHT.SPONSOR,
                active: true,
                weight: 10
            },
            {
                id: 'default_2',
                type: 'social',
                title: '邀请好友，共享收益',
                description: '邀请朋友一起玩游戏，获得额外万花币奖励！由 消不停·万币赢 提供',
                action: 'telegram_contact',
                contact: '@bjxc010',
                sponsor: CONFIG.COPYRIGHT.GAME_NAME,
                active: true,
                weight: 8
            }
        ];
    }

    initializeBannerAd() {
        if (!this.isAdMobLoaded) {
            this.showManualBannerAd();
            return;
        }

        try {
            // 初始化AdMob横幅广告
            const bannerContainer = document.getElementById('banner-ad');
            if (bannerContainer) {
                const adElement = bannerContainer.querySelector('.adsbygoogle');
                if (adElement && window.adsbygoogle) {
                    window.adsbygoogle.push({});
                }
            }
        } catch (error) {
            console.error('Failed to initialize banner ad:', error);
            this.showManualBannerAd();
        }
    }

    showManualBannerAd() {
        const bannerContainer = document.getElementById('banner-ad');
        if (!bannerContainer || this.manualAds.length === 0) return;

        const ad = this.selectRandomAd();
        if (!ad) return;

        // 专为社交广告优化显示
        if (ad.type === 'social') {
            bannerContainer.innerHTML = `
                <div class="manual-banner-ad social-banner" onclick="window.adsManager.onAdClick('${ad.id}')">
                    <div class="social-banner-content">
                        <div class="social-icon">👥</div>
                        <div class="social-text">
                            <h4>${ad.title}</h4>
                            <p>${ad.description}</p>
                            <div class="contact-info">
                                <span class="contact-link">${ad.contact}</span>
                                <button class="quick-contact-btn">立即联系</button>
                            </div>
                            <span class="ad-sponsor">由 ${ad.sponsor} 提供</span>
                        </div>
                    </div>
                    <div class="ad-badge">广告</div>
                </div>
            `;
        } else {
            bannerContainer.innerHTML = `
                <div class="manual-banner-ad" onclick="window.adsManager.onAdClick('${ad.id}')">
                    <div class="ad-content">
                        <div class="ad-image">
                            <img src="${ad.imageUrl || ad.thumbnailUrl}" alt="${ad.title}" onerror="this.style.display='none'">
                        </div>
                        <div class="ad-text">
                            <h4>${ad.title}</h4>
                            <p>${ad.description}</p>
                            <span class="ad-sponsor">由 ${ad.sponsor} 提供</span>
                        </div>
                    </div>
                    <div class="ad-badge">广告</div>
                </div>
            `;
        }
    }

    selectRandomAd() {
        const activeAds = this.manualAds.filter(ad => ad.active);
        if (activeAds.length === 0) return null;

        // 根据权重选择广告
        const totalWeight = activeAds.reduce((sum, ad) => sum + ad.weight, 0);
        let random = Math.random() * totalWeight;

        for (const ad of activeAds) {
            random -= ad.weight;
            if (random <= 0) {
                return ad;
            }
        }

        return activeAds[0];
    }

    async showRewardedAd() {
        if (this.isShowingAd) {
            return false;
        }

        // 检查每日广告限制
        if (!this.canWatchAd()) {
            window.telegramApp.showAlert('今日观看广告次数已达上限！');
            return false;
        }

        this.isShowingAd = true;

        try {
            let result = false;

            // 优先使用AdMob激励广告
            if (this.isAdMobLoaded) {
                result = await this.showAdMobRewardedAd();
            }

            // 如果AdMob失败，显示手动广告
            if (!result) {
                result = await this.showManualRewardedAd();
            }

            if (result) {
                this.incrementDailyAdCount();
            }

            return result;

        } finally {
            this.isShowingAd = false;
        }
    }

    async showAdMobRewardedAd() {
        return new Promise((resolve) => {
            try {
                // 这里应该集成真正的AdMob激励广告
                // 由于这是演示代码，我们模拟广告加载和显示

                console.log('Loading AdMob rewarded ad...');

                // 模拟广告加载延迟
                setTimeout(() => {
                    // 模拟80%的成功率
                    const success = Math.random() > 0.2;

                    if (success) {
                        console.log('AdMob rewarded ad completed');
                        resolve(true);
                    } else {
                        console.log('AdMob rewarded ad failed');
                        resolve(false);
                    }
                }, 1000);

            } catch (error) {
                console.error('AdMob rewarded ad error:', error);
                resolve(false);
            }
        });
    }

    async showManualRewardedAd() {
        return new Promise((resolve) => {
            const ad = this.selectRandomAd();
            if (!ad) {
                resolve(false);
                return;
            }

            // 创建手动激励广告模态框
            const modal = this.createRewardedAdModal(ad);
            document.body.appendChild(modal);

            // 设置回调
            modal.addEventListener('adCompleted', () => {
                resolve(true);
                modal.remove();
            });

            modal.addEventListener('adCancelled', () => {
                resolve(false);
                modal.remove();
            });

            // 显示模态框
            setTimeout(() => modal.classList.add('show'), 10);
        });
    }

    createRewardedAdModal(ad) {
        const modal = document.createElement('div');
        modal.className = 'modal-container rewarded-ad-modal';

        modal.innerHTML = `
            <div class="modal rewarded-ad">
                <div class="ad-header">
                    <h3>观看广告获得奖励</h3>
                    <p>观看完整广告可获得 <strong>${CONFIG.ADMOB.REWARD_AMOUNT} ${CONFIG.CURRENCY.NAME}</strong></p>
                </div>

                <div class="ad-content-wrapper">
                    ${ad.type === 'video' ? this.createVideoAd(ad) : ad.type === 'social' ? this.createSocialAd(ad) : this.createImageAd(ad)}
                </div>

                <div class="ad-controls">
                    <div class="ad-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="ad-progress"></div>
                        </div>
                        <span class="progress-text">广告播放中... <span id="countdown">15</span>s</span>
                    </div>

                    <div class="ad-buttons" id="ad-buttons" style="display: none;">
                        <button class="ad-btn secondary" onclick="this.closest('.modal-container').dispatchEvent(new Event('adCancelled'))">
                            跳过
                        </button>
                        <button class="ad-btn primary" onclick="this.closest('.modal-container').dispatchEvent(new Event('adCompleted'))">
                            获得奖励
                        </button>
                    </div>
                </div>

                <div class="ad-footer">
                    <div class="ad-sponsor-info">
                        <span class="ad-badge">广告</span>
                        <span>由 ${ad.sponsor} 赞助</span>
                    </div>
                </div>
            </div>
        `;

        // 启动广告倒计时
        this.startAdCountdown(modal, 15);

        return modal;
    }

    createVideoAd(ad) {
        return `
            <div class="video-ad" onclick="window.adsManager.onAdClick('${ad.id}')">
                <video autoplay muted loop poster="${ad.thumbnailUrl}">
                    <source src="${ad.videoUrl}" type="video/mp4">
                    <img src="${ad.thumbnailUrl}" alt="${ad.title}">
                </video>
                <div class="video-overlay">
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                </div>
            </div>
        `;
    }

    createImageAd(ad) {
        return `
            <div class="image-ad" onclick="window.adsManager.onAdClick('${ad.id}')">
                <img src="${ad.imageUrl}" alt="${ad.title}">
                <div class="image-overlay">
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                </div>
            </div>
        `;
    }

    createSocialAd(ad) {
        return `
            <div class="social-ad" onclick="window.adsManager.onAdClick('${ad.id}')">
                <div class="social-content">
                    <div class="social-icon">👥</div>
                    <h4>${ad.title}</h4>
                    <p>${ad.description}</p>
                    <div class="contact-info">
                        <span class="contact-label">联系：</span>
                        <span class="contact-link">${ad.contact}</span>
                    </div>
                    <button class="contact-btn">立即联系</button>
                </div>
            </div>
        `;
    }

    startAdCountdown(modal, duration) {
        let timeLeft = duration;
        const progressFill = modal.querySelector('#ad-progress');
        const countdownEl = modal.querySelector('#countdown');
        const buttonsEl = modal.querySelector('#ad-buttons');

        const timer = setInterval(() => {
            timeLeft--;
            countdownEl.textContent = timeLeft;

            // 更新进度条
            const progress = ((duration - timeLeft) / duration) * 100;
            progressFill.style.width = `${progress}%`;

            if (timeLeft <= 0) {
                clearInterval(timer);

                // 显示按钮
                modal.querySelector('.ad-progress').style.display = 'none';
                buttonsEl.style.display = 'flex';
            }
        }, 1000);
    }

    onAdClick(adId) {
        const ad = this.manualAds.find(a => a.id === adId);
        if (!ad) return;

        // 记录广告点击
        this.trackAdClick(adId);

        // 处理不同类型的广告点击
        if (ad.type === 'social' && ad.action === 'telegram_contact') {
            // 社交广告跳转到Telegram用户
            window.telegramApp.openTelegramUser(ad.contact);
        } else if (ad.linkUrl) {
            // 普通链接跳转
            if (ad.linkUrl.startsWith('https://t.me/')) {
                window.telegramApp.openTelegramUser(ad.linkUrl.split('/').pop());
            } else {
                window.open(ad.linkUrl, '_blank');
            }
        }
    }

    trackAdClick(adId) {
        try {
            // 发送广告点击统计到后端
            fetch(`${CONFIG.API.BASE_URL}/ads/click`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adId,
                    userId: window.userManager.getCurrentUser()?.id,
                    timestamp: Date.now()
                })
            }).catch(console.error);
        } catch (error) {
            console.error('Failed to track ad click:', error);
        }
    }

    canWatchAd() {
        const today = new Date().toDateString();

        if (this.lastAdDate !== today) {
            this.dailyAdCount = 0;
            this.lastAdDate = today;
        }

        return this.dailyAdCount < this.maxDailyAds;
    }

    incrementDailyAdCount() {
        this.dailyAdCount++;

        // 保存到本地存储
        localStorage.setItem('dailyAdCount', JSON.stringify({
            count: this.dailyAdCount,
            date: this.lastAdDate
        }));
    }

    checkDailyAdReset() {
        try {
            const saved = localStorage.getItem('dailyAdCount');
            if (saved) {
                const data = JSON.parse(saved);
                const today = new Date().toDateString();

                if (data.date === today) {
                    this.dailyAdCount = data.count || 0;
                    this.lastAdDate = data.date;
                } else {
                    this.dailyAdCount = 0;
                    this.lastAdDate = today;
                }
            }
        } catch (error) {
            console.error('Failed to check daily ad reset:', error);
        }
    }

    // 显示间隙广告
    async showInterstitialAd() {
        if (this.isShowingAd) return false;

        this.isShowingAd = true;

        try {
            // 30%的概率显示间隙广告
            if (Math.random() > 0.7) {
                const ad = this.selectRandomAd();
                if (ad) {
                    await this.showManualInterstitialAd(ad);
                }
            }
        } finally {
            this.isShowingAd = false;
        }
    }

    async showManualInterstitialAd(ad) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal-container interstitial-ad-modal';

            modal.innerHTML = `
                <div class="modal interstitial-ad">
                    <button class="modal-close" onclick="this.closest('.modal-container').remove(); this.resolve?.()">&times;</button>

                    <div class="ad-content-wrapper">
                        ${ad.type === 'video' ? this.createVideoAd(ad) : ad.type === 'social' ? this.createSocialAd(ad) : this.createImageAd(ad)}
                    </div>

                    <div class="ad-footer">
                        <div class="ad-sponsor-info">
                            <span class="ad-badge">广告</span>
                            <span>由 ${ad.sponsor} 赞助</span>
                        </div>
                        <button class="ad-btn primary" onclick="this.closest('.modal-container').remove()">
                            继续游戏
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            modal.resolve = resolve;

            setTimeout(() => {
                modal.classList.add('show');
                // 3秒后自动关闭
                setTimeout(() => {
                    modal.remove();
                    resolve();
                }, 3000);
            }, 10);
        });
    }

    // 获取广告统计
    getAdStats() {
        return {
            dailyCount: this.dailyAdCount,
            remainingAds: this.maxDailyAds - this.dailyAdCount,
            lastAdDate: this.lastAdDate
        };
    }

    // 管理员功能：重置用户广告次数
    resetDailyAdCount() {
        this.dailyAdCount = 0;
        localStorage.removeItem('dailyAdCount');
    }

    // 预加载广告资源
    preloadAdResources() {
        this.manualAds.forEach(ad => {
            if (ad.imageUrl) {
                const img = new Image();
                img.src = ad.imageUrl;
            }
            if (ad.thumbnailUrl) {
                const img = new Image();
                img.src = ad.thumbnailUrl;
            }
        });
    }
}

// 添加广告相关CSS样式
const adStyles = document.createElement('style');
adStyles.textContent = `
    .manual-banner-ad {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 1rem;
        margin: 1rem auto;
        cursor: pointer;
        transition: transform 0.3s ease;
        position: relative;
        overflow: hidden;
        width: 95%;
        max-width: 500px;
        min-height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .manual-banner-ad:hover {
        transform: translateY(-2px);
    }

    .ad-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        color: white;
        width: 100%;
        text-align: center;
    }

    .ad-image {
        flex-shrink: 0;
        width: 60px;
        height: 60px;
        border-radius: 8px;
        overflow: hidden;
    }

    .ad-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .ad-text {
        flex: 1;
    }

    .ad-text h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
    }

    .ad-text p {
        margin: 0 0 0.3rem 0;
        font-size: 0.9rem;
        opacity: 0.9;
    }

    .ad-sponsor {
        font-size: 0.7rem;
        opacity: 0.7;
    }

    .ad-badge {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: rgba(255,255,255,0.2);
        color: white;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 500;
    }

    .rewarded-ad-modal .modal {
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
    }

    .ad-header {
        text-align: center;
        padding: 1.5rem;
        border-bottom: 1px solid #eee;
    }

    .ad-header h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }

    .ad-content-wrapper {
        position: relative;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .video-ad, .image-ad {
        width: 100%;
        position: relative;
        cursor: pointer;
    }

    .video-ad video, .image-ad img {
        width: 100%;
        height: 200px;
        object-fit: cover;
    }

    .video-overlay, .image-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.7));
        color: white;
        padding: 1rem;
    }

    .video-overlay h4, .image-overlay h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
    }

    .video-overlay p, .image-overlay p {
        margin: 0;
        font-size: 0.9rem;
        opacity: 0.9;
    }

    .ad-controls {
        padding: 1rem;
        border-top: 1px solid #eee;
    }

    .ad-progress {
        text-align: center;
        margin-bottom: 1rem;
    }

    .progress-bar {
        width: 100%;
        height: 6px;
        background: #f0f0f0;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        border-radius: 3px;
        width: 0%;
        transition: width 1s linear;
    }

    .progress-text {
        font-size: 0.9rem;
        color: #666;
    }

    .ad-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .ad-btn {
        padding: 0.8rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .ad-btn.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .ad-btn.secondary {
        background: #f8f9fa;
        color: #666;
        border: 1px solid #dee2e6;
    }

    .ad-btn:hover {
        transform: translateY(-1px);
    }

    .ad-footer {
        padding: 1rem;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8f9fa;
    }

    .ad-sponsor-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: #666;
    }

    .interstitial-ad-modal .modal {
        max-width: 400px;
        width: 90%;
    }

    .interstitial-ad .ad-footer {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }

    @media (max-width: 480px) {
        .ad-content {
            flex-direction: column;
            text-align: center;
        }

        .ad-image {
            width: 80px;
            height: 80px;
        }

        .ad-buttons {
            flex-direction: column;
        }

        .ad-footer {
            flex-direction: column;
            gap: 1rem;
        }
    }

    /* 社交广告样式 */
    .social-ad {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 15px;
        padding: 1.5rem;
        color: white;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .social-ad:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    }

    .social-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .social-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
    }

    .social-ad h4 {
        font-size: 1.3rem;
        margin: 0;
        font-weight: 600;
    }

    .social-ad p {
        font-size: 1rem;
        margin: 0;
        opacity: 0.9;
        line-height: 1.4;
    }

    .contact-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255,255,255,0.2);
        padding: 0.5rem 1rem;
        border-radius: 25px;
        font-weight: 600;
    }

    .contact-label {
        font-size: 0.9rem;
    }

    .contact-link {
        color: #ffeaa7;
        font-weight: bold;
    }

    .contact-btn {
        background: rgba(255,255,255,0.2);
        border: 2px solid white;
        color: white;
        padding: 0.8rem 1.5rem;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1rem;
    }

    .contact-btn:hover {
        background: white;
        color: #667eea;
        transform: translateY(-1px);
    }

    /* 社交横幅广告样式 */
    .social-banner {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 2px solid rgba(255,255,255,0.3);
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    }

    .social-banner-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        color: white;
        padding: 0.5rem;
        width: 100%;
        text-align: center;
    }

    .social-banner .social-icon {
        font-size: 2.5rem;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .social-text {
        flex: 1;
        text-align: left;
    }

    .social-text h4 {
        font-size: 1.1rem;
        margin: 0 0 0.3rem 0;
        font-weight: 700;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    .social-text p {
        font-size: 0.9rem;
        margin: 0 0 0.5rem 0;
        opacity: 0.95;
        line-height: 1.3;
    }

    .social-banner .contact-info {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        margin-bottom: 0.3rem;
    }

    .social-banner .contact-link {
        background: rgba(255,255,255,0.25);
        padding: 0.3rem 0.8rem;
        border-radius: 15px;
        font-weight: 700;
        color: #ffeaa7;
        border: 1px solid rgba(255,255,255,0.3);
        font-size: 0.95rem;
    }

    .quick-contact-btn {
        background: rgba(255,255,255,0.2);
        border: 1px solid white;
        color: white;
        padding: 0.4rem 1rem;
        border-radius: 20px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.85rem;
    }

    .quick-contact-btn:hover {
        background: white;
        color: #667eea;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .social-banner .ad-sponsor {
        font-size: 0.75rem;
        opacity: 0.8;
        font-style: italic;
    }

    @media (max-width: 480px) {
        .social-banner-content {
            flex-direction: column;
            text-align: center;
            gap: 0.8rem;
        }

        .social-banner .social-icon {
            font-size: 2rem;
        }

        .social-text h4 {
            font-size: 1rem;
        }

        .social-text p {
            font-size: 0.85rem;
        }

        .social-banner .contact-info {
            flex-direction: column;
            gap: 0.5rem;
            align-items: center;
        }

        .quick-contact-btn {
            font-size: 0.8rem;
            padding: 0.3rem 0.8rem;
        }
    }
`;

document.head.appendChild(adStyles);

// 全局广告管理器实例
window.adsManager = new AdsManager();