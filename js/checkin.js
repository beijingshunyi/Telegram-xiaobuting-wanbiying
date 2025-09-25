class CheckinSystem {
    constructor() {
        this.isInitialized = false;
        this.checkinModal = null;
        this.initialize();
    }

    async initialize() {
        // 等待用户管理器初始化完成
        await window.userManager.initPromise;

        // 设置签到按钮事件监听
        this.setupEventListeners();

        // 检查是否显示签到提醒
        await this.checkDailyCheckin();

        this.isInitialized = true;
        console.log('CheckinSystem initialized');
    }

    setupEventListeners() {
        const checkinBtn = document.getElementById('daily-checkin');
        if (checkinBtn) {
            checkinBtn.addEventListener('click', () => this.showCheckinModal());
        }
    }

    async checkDailyCheckin() {
        const user = window.userManager.getCurrentUser();
        if (!user) return;

        const today = new Date().toDateString();
        const lastCheckin = await window.dbManager.getLastCheckin(user.id);

        // 检查是否已经签到
        if (!lastCheckin || lastCheckin.date !== today) {
            // 显示签到提醒红点
            this.showCheckinBadge();

            // 如果是新用户或者连续签到中断，重置连击
            if (!lastCheckin || this.isCheckinBroken(lastCheckin.date)) {
                await window.dbManager.updateUser(user.id, {
                    checkinStreak: 0
                });
            }
        } else {
            // 已经签到，隐藏红点
            this.hideCheckinBadge();
        }
    }

    isCheckinBroken(lastCheckinDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return new Date(lastCheckinDate).toDateString() !== yesterday.toDateString();
    }

    showCheckinBadge() {
        const badge = document.getElementById('checkin-badge');
        if (badge) {
            badge.style.display = 'flex';
        }
    }

    hideCheckinBadge() {
        const badge = document.getElementById('checkin-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    }

    async showCheckinModal() {
        const user = window.userManager.getCurrentUser();
        if (!user) return;

        const today = new Date().toDateString();
        const lastCheckin = await window.dbManager.getLastCheckin(user.id);

        // 检查是否已经签到
        if (lastCheckin && lastCheckin.date === today) {
            this.showAlreadyCheckedInModal();
            return;
        }

        // 创建签到模态框
        this.createCheckinModal(user.checkinStreak);
    }

    createCheckinModal(currentStreak) {
        // 移除已存在的模态框
        this.removeCheckinModal();

        const modal = document.createElement('div');
        modal.id = 'checkin-modal';
        modal.className = 'modal-container';
        modal.style.display = 'flex';

        const rewards = CONFIG.CURRENCY.SIGN_IN_BONUS;
        const nextReward = rewards[Math.min(currentStreak, rewards.length - 1)];

        modal.innerHTML = `
            <div class="modal checkin-modal">
                <button class="modal-close" onclick="window.checkinSystem.removeCheckinModal()">&times;</button>
                <div class="checkin-header">
                    <h2>📅 每日签到</h2>
                    <p>连续签到可获得更多奖励！</p>
                </div>

                <div class="checkin-calendar">
                    ${this.generateCheckinCalendar(currentStreak)}
                </div>

                <div class="checkin-reward">
                    <div class="reward-preview">
                        <div class="reward-coin">
                            <img src="images/coin-icon.png" alt="万花币" class="coin-icon">
                            <span class="reward-amount">+${nextReward}</span>
                        </div>
                        <p>今日签到奖励</p>
                    </div>

                    <div class="streak-info">
                        <p>当前连续签到：<strong>${currentStreak}天</strong></p>
                        <p class="streak-bonus">连续7天可获得额外奖励！</p>
                    </div>
                </div>

                <div class="checkin-actions">
                    <button class="checkin-btn primary" onclick="window.checkinSystem.performCheckin()">
                        <span class="btn-icon">✨</span>
                        立即签到
                    </button>
                    <button class="checkin-btn secondary" onclick="window.checkinSystem.watchAdForDoubleReward()">
                        <span class="btn-icon">📺</span>
                        看广告翻倍
                    </button>
                </div>

                <div class="weekly-rewards">
                    <h3>连续签到奖励</h3>
                    <div class="reward-track">
                        ${this.generateRewardTrack(currentStreak)}
                    </div>
                </div>

                <div class="sponsor-info">
                    <p>本功能由"${CONFIG.COPYRIGHT.SPONSOR}"提供技术支持</p>
                    <p>合作联系：<a href="#" onclick="window.telegramApp.openTelegramUser('${CONFIG.COPYRIGHT.COOPERATION}')" class="sponsor-link">${CONFIG.COPYRIGHT.COOPERATION}</a></p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.checkinModal = modal;

        // 添加动画效果
        setTimeout(() => modal.classList.add('show'), 10);
    }

    generateCheckinCalendar(currentStreak) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDate = today.getDate();

        let calendarHtml = '<div class="calendar-grid">';

        // 生成本月的签到日历（简化版）
        for (let day = 1; day <= 7; day++) {
            const isToday = day === currentDate;
            const isCheckedIn = day < currentDate || (day === currentDate && currentStreak > 0);
            const dayClass = isToday ? 'today' : isCheckedIn ? 'checked-in' : 'future';

            calendarHtml += `
                <div class="calendar-day ${dayClass}">
                    <span class="day-number">${day}</span>
                    <span class="day-status">${isCheckedIn ? '✓' : isToday ? '📍' : ''}</span>
                </div>
            `;
        }

        calendarHtml += '</div>';
        return calendarHtml;
    }

    generateRewardTrack(currentStreak) {
        const rewards = CONFIG.CURRENCY.SIGN_IN_BONUS;
        let trackHtml = '';

        rewards.forEach((reward, index) => {
            const day = index + 1;
            const isCompleted = currentStreak >= day;
            const isCurrent = currentStreak + 1 === day;
            const statusClass = isCompleted ? 'completed' : isCurrent ? 'current' : 'future';

            trackHtml += `
                <div class="reward-day ${statusClass}">
                    <div class="day-circle">
                        <span class="day-number">${day}</span>
                        ${isCompleted ? '<span class="check-mark">✓</span>' : ''}
                    </div>
                    <div class="day-reward">
                        <img src="images/coin-icon.png" alt="万花币" class="mini-coin">
                        <span>${reward}</span>
                    </div>
                    ${day === 7 ? '<div class="bonus-indicator">🎁 特殊奖励</div>' : ''}
                </div>
            `;
        });

        return trackHtml;
    }

    async performCheckin(isDoubleReward = false) {
        const user = window.userManager.getCurrentUser();
        if (!user) return;

        try {
            const today = new Date().toDateString();
            const lastCheckin = await window.dbManager.getLastCheckin(user.id);

            // 再次检查是否已经签到
            if (lastCheckin && lastCheckin.date === today) {
                window.telegramApp.showAlert('今天已经签到过了！');
                return;
            }

            // 计算连续签到天数
            let newStreak = 1;
            if (lastCheckin && !this.isCheckinBroken(lastCheckin.date)) {
                newStreak = user.checkinStreak + 1;
            }

            // 计算奖励
            const rewards = CONFIG.CURRENCY.SIGN_IN_BONUS;
            let baseReward = rewards[Math.min(newStreak - 1, rewards.length - 1)];

            if (isDoubleReward) {
                baseReward *= 2;
            }

            // 七天连续签到额外奖励
            let bonusReward = 0;
            if (newStreak % 7 === 0) {
                bonusReward = 100; // 额外100万花币
            }

            const totalReward = baseReward + bonusReward;

            // 更新用户数据
            await window.userManager.addCoins(totalReward, '每日签到奖励');
            await window.dbManager.updateUser(user.id, {
                checkinStreak: newStreak,
                lastCheckin: Date.now()
            });

            // 保存签到记录
            await window.dbManager.saveCheckinRecord(user.id, totalReward);

            // 显示成功动画
            this.showCheckinSuccess(totalReward, newStreak, bonusReward > 0);

            // 隐藏签到提醒
            this.hideCheckinBadge();

            // 播放金币音效
            window.userManager.playCoinSound();

            // 触觉反馈
            window.telegramApp.hapticFeedback('success');

            // 移除模态框
            setTimeout(() => this.removeCheckinModal(), 2000);

        } catch (error) {
            console.error('Checkin failed:', error);
            window.telegramApp.showAlert('签到失败，请重试！');
        }
    }

    async watchAdForDoubleReward() {
        try {
            // 这里调用广告系统观看激励广告
            const adWatched = await window.adsManager.showRewardedAd();

            if (adWatched) {
                await this.performCheckin(true);
            } else {
                window.telegramApp.showAlert('广告观看失败，将给予正常奖励');
                await this.performCheckin(false);
            }
        } catch (error) {
            console.error('Watch ad failed:', error);
            // 降级到普通签到
            await this.performCheckin(false);
        }
    }

    showCheckinSuccess(reward, streak, hasBonus) {
        // 移除现有内容，显示成功页面
        const modal = document.querySelector('.checkin-modal .modal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="checkin-success">
                <div class="success-animation">
                    <div class="success-icon">✨</div>
                    <h2>签到成功！</h2>
                </div>

                <div class="success-rewards">
                    <div class="reward-item">
                        <img src="images/coin-icon.png" alt="万花币" class="coin-icon">
                        <span class="reward-text">+${reward} ${CONFIG.CURRENCY.NAME}</span>
                    </div>

                    ${hasBonus ? `
                        <div class="bonus-reward">
                            <span class="bonus-text">🎉 七天连续签到奖励！</span>
                        </div>
                    ` : ''}
                </div>

                <div class="streak-display">
                    <h3>连续签到</h3>
                    <div class="streak-number">${streak}</div>
                    <p>天</p>
                </div>

                <div class="next-reward">
                    <p>明天继续签到可获得 <strong>${this.getNextDayReward(streak)} ${CONFIG.CURRENCY.NAME}</strong></p>
                </div>
            </div>
        `;

        // 添加成功动画样式
        const style = document.createElement('style');
        style.textContent = `
            .checkin-success {
                text-align: center;
                padding: 2rem;
            }

            .success-animation {
                margin-bottom: 2rem;
            }

            .success-icon {
                font-size: 4rem;
                animation: successBounce 0.8s ease-in-out;
                margin-bottom: 1rem;
            }

            .success-rewards {
                margin: 2rem 0;
                padding: 1.5rem;
                background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
                border-radius: 15px;
                color: #2d3436;
            }

            .reward-item {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                font-size: 1.2rem;
                font-weight: 600;
            }

            .bonus-reward {
                margin-top: 1rem;
                padding: 0.5rem;
                background: rgba(255,255,255,0.3);
                border-radius: 8px;
            }

            .streak-display {
                margin: 2rem 0;
            }

            .streak-number {
                font-size: 3rem;
                font-weight: bold;
                color: #0984e3;
                margin: 0.5rem 0;
            }

            @keyframes successBounce {
                0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-20px);
                }
                60% {
                    transform: translateY(-10px);
                }
            }
        `;
        document.head.appendChild(style);
    }

    getNextDayReward(currentStreak) {
        const rewards = CONFIG.CURRENCY.SIGN_IN_BONUS;
        const nextDay = Math.min(currentStreak, rewards.length - 1);
        return rewards[nextDay];
    }

    showAlreadyCheckedInModal() {
        this.removeCheckinModal();

        const modal = document.createElement('div');
        modal.id = 'checkin-modal';
        modal.className = 'modal-container';
        modal.style.display = 'flex';

        const user = window.userManager.getCurrentUser();

        modal.innerHTML = `
            <div class="modal">
                <button class="modal-close" onclick="window.checkinSystem.removeCheckinModal()">&times;</button>
                <div class="already-checkedin">
                    <div class="checkedin-icon">✅</div>
                    <h2>今日已签到</h2>
                    <p>您今天已经完成签到了！</p>

                    <div class="current-streak">
                        <h3>当前连续签到</h3>
                        <div class="streak-number">${user.checkinStreak}</div>
                        <p>天</p>
                    </div>

                    <div class="tomorrow-reminder">
                        <p>明天记得继续签到哦！</p>
                        <p>可获得 <strong>${this.getNextDayReward(user.checkinStreak)} ${CONFIG.CURRENCY.NAME}</strong></p>
                    </div>

                    <button class="checkin-btn primary" onclick="window.checkinSystem.removeCheckinModal()">
                        知道了
                    </button>
                </div>

                <div class="sponsor-info">
                    <p>本功能由"${CONFIG.COPYRIGHT.SPONSOR}"提供技术支持</p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.checkinModal = modal;

        setTimeout(() => modal.classList.add('show'), 10);
    }

    removeCheckinModal() {
        if (this.checkinModal) {
            this.checkinModal.classList.add('hide');
            setTimeout(() => {
                if (this.checkinModal && this.checkinModal.parentNode) {
                    this.checkinModal.parentNode.removeChild(this.checkinModal);
                }
                this.checkinModal = null;
            }, 300);
        }
    }

    // 获取用户签到统计
    async getUserCheckinStats(userId) {
        try {
            const user = await window.dbManager.getUser(userId);
            return {
                currentStreak: user?.checkinStreak || 0,
                lastCheckin: user?.lastCheckin || null,
                totalCheckins: 0 // 这里可以从签到记录表中统计
            };
        } catch (error) {
            console.error('Failed to get checkin stats:', error);
            return {
                currentStreak: 0,
                lastCheckin: null,
                totalCheckins: 0
            };
        }
    }

    // 重置签到（管理员功能）
    async resetUserCheckin(userId) {
        try {
            await window.dbManager.updateUser(userId, {
                checkinStreak: 0,
                lastCheckin: null
            });
            return true;
        } catch (error) {
            console.error('Failed to reset checkin:', error);
            return false;
        }
    }
}

// 添加签到相关CSS样式
const checkinStyles = document.createElement('style');
checkinStyles.textContent = `
    .checkin-modal {
        max-width: 400px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    }

    .checkin-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .checkin-header h2 {
        color: #333;
        margin-bottom: 0.5rem;
    }

    .checkin-calendar {
        margin-bottom: 2rem;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .calendar-day {
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        font-size: 0.8rem;
        position: relative;
    }

    .calendar-day.today {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-weight: bold;
    }

    .calendar-day.checked-in {
        background: #00b894;
        color: white;
    }

    .calendar-day.future {
        background: #f1f3f4;
        color: #666;
    }

    .checkin-reward {
        text-align: center;
        margin-bottom: 2rem;
    }

    .reward-preview {
        background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
        border-radius: 15px;
        padding: 1.5rem;
        margin-bottom: 1rem;
    }

    .reward-coin {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .reward-amount {
        font-size: 1.5rem;
        font-weight: bold;
        color: #2d3436;
    }

    .streak-info {
        color: #666;
    }

    .streak-bonus {
        color: #e17055;
        font-weight: 500;
        margin-top: 0.5rem;
    }

    .checkin-actions {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .checkin-btn {
        flex: 1;
        padding: 1rem;
        border: none;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }

    .checkin-btn.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .checkin-btn.secondary {
        background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
        color: white;
    }

    .checkin-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    }

    .weekly-rewards {
        margin-bottom: 2rem;
    }

    .weekly-rewards h3 {
        text-align: center;
        color: #333;
        margin-bottom: 1rem;
    }

    .reward-track {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        overflow-x: auto;
        padding: 0.5rem 0;
    }

    .reward-day {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 50px;
        text-align: center;
    }

    .day-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.5rem;
        position: relative;
        font-weight: bold;
    }

    .reward-day.completed .day-circle {
        background: #00b894;
        color: white;
    }

    .reward-day.current .day-circle {
        background: #667eea;
        color: white;
    }

    .reward-day.future .day-circle {
        background: #f1f3f4;
        color: #666;
    }

    .day-reward {
        display: flex;
        align-items: center;
        gap: 0.2rem;
        font-size: 0.8rem;
    }

    .mini-coin {
        width: 12px;
        height: 12px;
    }

    .bonus-indicator {
        font-size: 0.7rem;
        color: #e17055;
        margin-top: 0.2rem;
    }

    .modal-container.show {
        opacity: 1;
    }

    .modal-container.hide {
        opacity: 0;
    }

    .already-checkedin {
        text-align: center;
        padding: 2rem;
    }

    .checkedin-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    .current-streak {
        margin: 2rem 0;
    }

    .current-streak .streak-number {
        font-size: 3rem;
        font-weight: bold;
        color: #0984e3;
        margin: 0.5rem 0;
    }

    .tomorrow-reminder {
        background: #e8f4f8;
        border-radius: 10px;
        padding: 1rem;
        margin: 1.5rem 0;
        color: #2d3436;
    }
`;

document.head.appendChild(checkinStyles);

// 全局签到系统实例
window.checkinSystem = new CheckinSystem();