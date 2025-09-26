// 提现管理器
class WithdrawManager {
    constructor() {
        this.minAmounts = {
            alipay: CONFIG.WITHDRAW.ALIPAY_MIN,
            usdt: 0 // 将在初始化时根据汇率计算
        };
        this.feeRate = CONFIG.WITHDRAW.FEE_RATE;
        this.usdtRate = 6.8; // 默认汇率

        // 延迟初始化，确保DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    async initialize() {
        try {
            await this.loadExchangeRate();
            this.calculateUsdtMin();
            this.setupEventListeners();
            console.log('提现系统初始化成功');
        } catch (error) {
            console.error('提现系统初始化失败:', error);
        }
    }

    // 加载汇率
    async loadExchangeRate() {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}/exchange-rate/usdt`);
            if (response.ok) {
                const data = await response.json();
                this.usdtRate = data.rate || 6.8;
            }
        } catch (error) {
            console.error('获取USDT汇率失败:', error);
        }
    }

    // 计算USDT最低提现金额
    calculateUsdtMin() {
        const usdMinAmount = 10; // 10美元
        this.minAmounts.usdt = Math.ceil(usdMinAmount * this.usdtRate * CONFIG.CURRENCY.RATE_TO_RMB / 10);
    }

    // 设置事件监听器 - 现在由main.js统一处理，避免重复监听
    setupEventListeners() {
        // 原来的重复监听器已移除，现在由main.js的showWithdraw()方法调用
        console.log('WithdrawManager event listeners setup completed');
    }

    // 显示提现模态框
    showWithdrawModal() {
        console.log('showWithdrawModal called');
        // 使用标准模态框容器系统
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            console.error('Modal container not found');
            return;
        }

        const userBalance = window.userManager ? window.userManager.getCurrentUser().coins : 0;

        const modalContent = `
            <div class="modal">
                <div class="modal-header">
                    <h2>💰 提现中心</h2>
                    <button class="modal-close" onclick="document.getElementById('modal-container').style.display='none'; document.getElementById('modal-container').innerHTML='';">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="balance-info">
                        <div class="balance-label">当前余额</div>
                        <div class="balance-amount">${userBalance.toLocaleString()} 万花币</div>
                        <div class="balance-rmb">≈ ${(userBalance / CONFIG.CURRENCY.RATE_TO_RMB * 10).toFixed(2)} 元</div>
                    </div>

                    <div class="withdraw-methods">
                        <div class="method-card ${userBalance >= this.minAmounts.alipay ? '' : 'disabled'}" data-method="alipay">
                            <div class="method-icon">💳</div>
                            <div class="method-info">
                                <div class="method-name">支付宝提现</div>
                                <div class="method-desc">最低 ${this.minAmounts.alipay} 万花币 (${(this.minAmounts.alipay / CONFIG.CURRENCY.RATE_TO_RMB * 10).toFixed(0)}元)</div>
                                <div class="method-fee">手续费: ${(this.feeRate * 100).toFixed(1)}%</div>
                            </div>
                        </div>

                        <div class="method-card ${userBalance >= this.minAmounts.usdt ? '' : 'disabled'}" data-method="usdt">
                            <div class="method-icon">₿</div>
                            <div class="method-info">
                                <div class="method-name">USDT提现</div>
                                <div class="method-desc">最低 ${this.minAmounts.usdt} 万花币 (10 USDT)</div>
                                <div class="method-fee">手续费: ${(this.feeRate * 100).toFixed(1)}%</div>
                            </div>
                        </div>
                    </div>

                    <div class="withdraw-notice">
                        <h4>提现说明：</h4>
                        <ul>
                            <li>处理时间：${CONFIG.WITHDRAW.PROCESSING_TIME}</li>
                            <li>手续费从提现金额中扣除</li>
                            <li>请确保账户信息准确无误</li>
                            <li>每日提现次数限制：3次</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;

        modalContainer.innerHTML = modalContent;
        modalContainer.style.display = 'flex';

        // 设置提现方式选择
        const methodCards = modalContainer.querySelectorAll('.method-card:not(.disabled)');
        methodCards.forEach(card => {
            card.addEventListener('click', () => {
                const method = card.dataset.method;
                this.showWithdrawForm(method);
            });
        });

        // 点击背景关闭
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                modalContainer.style.display = 'none';
                modalContainer.innerHTML = '';
            }
        });
    }

    // 显示提现表单
    showWithdrawForm(method) {
        console.log('showWithdrawForm called with method:', method);
        // 使用标准模态框容器系统
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            console.error('Modal container not found');
            return;
        }

        const userBalance = window.userManager ? window.userManager.getCurrentUser().coins : 0;
        const minAmount = this.minAmounts[method];
        const maxAmount = userBalance;

        const isAlipay = method === 'alipay';

        const modalContent = `
            <div class="modal">
                <div class="modal-header">
                    <h2>${isAlipay ? '💳 支付宝提现' : '₿ USDT提现'}</h2>
                    <button class="modal-close" onclick="document.getElementById('modal-container').style.display='none'; document.getElementById('modal-container').innerHTML='';">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="withdraw-form" id="withdraw-form">
                        <div class="form-group">
                            <label>提现金额</label>
                            <div class="amount-input-group">
                                <input type="number"
                                       id="withdraw-amount"
                                       min="${minAmount}"
                                       max="${maxAmount}"
                                       placeholder="输入万花币数量">
                                <span class="amount-unit">万花币</span>
                            </div>
                            <div class="amount-range">
                                <span>最低: ${minAmount.toLocaleString()}</span>
                                <span>最高: ${maxAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>${isAlipay ? '支付宝账号' : 'USDT钱包地址'}</label>
                            <input type="text"
                                   id="withdraw-account"
                                   placeholder="${isAlipay ? '请输入支付宝账号' : '请输入USDT TRC-20钱包地址'}"
                                   required>
                        </div>

                        <div class="form-group">
                            <label>真实姓名</label>
                            <input type="text"
                                   id="withdraw-name"
                                   placeholder="请输入真实姓名"
                                   required>
                        </div>

                        <div class="withdraw-summary" id="withdraw-summary">
                            <div class="summary-row">
                                <span>提现金额：</span>
                                <span id="summary-amount">0 万花币</span>
                            </div>
                            <div class="summary-row">
                                <span>手续费 (${(this.feeRate * 100).toFixed(1)}%)：</span>
                                <span id="summary-fee">0 万花币</span>
                            </div>
                            <div class="summary-row total">
                                <span>实际到账：</span>
                                <span id="summary-final">0 万花币</span>
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary withdraw-submit">
                            确认提现
                        </button>
                    </form>
                </div>
            </div>
        `;

        modalContainer.innerHTML = modalContent;
        modalContainer.style.display = 'flex';

        // 设置表单事件
        this.setupWithdrawForm(modalContainer, method);

        // 点击背景关闭
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                modalContainer.style.display = 'none';
                modalContainer.innerHTML = '';
            }
        });
    }

    // 设置提现表单事件
    setupWithdrawForm(modal, method) {
        const form = modal.querySelector('#withdraw-form');
        const amountInput = modal.querySelector('#withdraw-amount');
        const summaryAmount = modal.querySelector('#summary-amount');
        const summaryFee = modal.querySelector('#summary-fee');
        const summaryFinal = modal.querySelector('#summary-final');

        // 金额输入事件
        amountInput.addEventListener('input', () => {
            const amount = parseFloat(amountInput.value) || 0;
            const fee = Math.floor(amount * this.feeRate);
            const finalAmount = amount - fee;

            summaryAmount.textContent = `${amount.toLocaleString()} 万花币`;
            summaryFee.textContent = `${fee.toLocaleString()} 万花币`;
            summaryFinal.textContent = `${finalAmount.toLocaleString()} 万花币`;
        });

        // 表单提交
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processWithdraw(method, modal);
        });
    }

    // 处理提现
    async processWithdraw(method, modal) {
        const amountInput = modal.querySelector('#withdraw-amount');
        const accountInput = modal.querySelector('#withdraw-account');
        const nameInput = modal.querySelector('#withdraw-name');

        const amount = parseFloat(amountInput.value);
        const account = accountInput.value.trim();
        const realName = nameInput.value.trim();

        // 验证
        if (!amount || amount < this.minAmounts[method]) {
            window.uiManager.showNotification(`提现金额不能少于${this.minAmounts[method]}万花币`, 'error');
            return;
        }

        if (!account) {
            window.uiManager.showNotification('请输入账号信息', 'error');
            return;
        }

        if (!realName) {
            window.uiManager.showNotification('请输入真实姓名', 'error');
            return;
        }

        const userBalance = window.userManager ? window.userManager.getCurrentUser().coins : 0;
        if (amount > userBalance) {
            window.uiManager.showNotification('余额不足', 'error');
            return;
        }

        try {
            // 显示确认对话框
            window.uiManager.showConfirm(
                `确认提现 ${amount.toLocaleString()} 万花币到${method === 'alipay' ? '支付宝' : 'USDT钱包'}？`,
                async () => {
                    await this.submitWithdraw(method, amount, account, realName);
                    document.body.removeChild(modal);
                }
            );
        } catch (error) {
            console.error('提现处理失败:', error);
            window.uiManager.showNotification('提现失败，请稍后重试', 'error');
        }
    }

    // 提交提现请求
    async submitWithdraw(method, amount, account, realName) {
        try {
            const response = await fetch(`${CONFIG.API.BASE_URL}/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: window.userManager?.currentUser?.id || 1,
                    type: method,
                    amount: amount,
                    account: account,
                    realName: realName
                })
            });

            if (response.ok) {
                const data = await response.json();

                // 扣除万花币
                if (window.userManager) {
                    await window.userManager.spendCoins(amount, `${method}提现`);
                }

                window.uiManager.showNotification(
                    `提现申请已提交！预计${CONFIG.WITHDRAW.PROCESSING_TIME}内到账`,
                    'success'
                );

                console.log('提现成功:', data);
            } else {
                throw new Error('提现请求失败');
            }
        } catch (error) {
            console.error('提现失败:', error);
            window.uiManager.showNotification('提现失败，请稍后重试', 'error');
        }
    }

    // 获取提现历史
    async getWithdrawHistory() {
        try {
            const userId = window.userManager?.currentUser?.id || 1;
            const response = await fetch(`${CONFIG.API.BASE_URL}/withdraw/history/${userId}`);

            if (response.ok) {
                const data = await response.json();
                return data.history || [];
            }
        } catch (error) {
            console.error('获取提现历史失败:', error);
        }
        return [];
    }

    // 格式化金额显示
    formatAmount(amount, currency = '万花币') {
        return `${amount.toLocaleString()} ${currency}`;
    }

    // 计算手续费
    calculateFee(amount) {
        return Math.floor(amount * this.feeRate);
    }
}

// 创建全局实例
window.withdrawManager = new WithdrawManager();

// CSS样式
const style = document.createElement('style');
style.textContent = `
    .balance-info {
        text-align: center;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 15px;
        color: white;
        margin-bottom: 20px;
    }

    .balance-amount {
        font-size: 28px;
        font-weight: bold;
        margin: 10px 0;
    }

    .balance-rmb {
        font-size: 14px;
        opacity: 0.8;
    }

    .withdraw-methods {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-bottom: 20px;
    }

    .method-card {
        display: flex;
        align-items: center;
        gap: 15px;
        padding: 20px;
        border-radius: 15px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid #e9ecef;
    }

    .method-card:hover:not(.disabled) {
        border-color: #007bff;
        background: #f8f9ff;
    }

    .method-card.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #f8f9fa;
    }

    .method-icon {
        font-size: 32px;
    }

    .method-info {
        flex: 1;
    }

    .method-name {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 5px;
    }

    .method-desc, .method-fee {
        font-size: 14px;
        color: #666;
        margin-bottom: 3px;
    }

    .withdraw-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .form-group label {
        font-weight: bold;
        color: #333;
    }

    .amount-input-group {
        display: flex;
        align-items: center;
        border: 2px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
    }

    .amount-input-group input {
        flex: 1;
        padding: 12px;
        border: none;
        outline: none;
        font-size: 16px;
    }

    .amount-unit {
        padding: 12px;
        background: #f8f9fa;
        border-left: 1px solid #ddd;
        font-size: 14px;
        color: #666;
    }

    .amount-range {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #666;
    }

    .form-group input[type="text"] {
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 16px;
    }

    .form-group input:focus {
        border-color: #007bff;
        outline: none;
    }

    .withdraw-summary {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 10px;
        border: 1px solid #dee2e6;
    }

    .summary-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 14px;
    }

    .summary-row.total {
        border-top: 1px solid #dee2e6;
        padding-top: 10px;
        font-weight: bold;
        font-size: 16px;
        color: #007bff;
    }

    .withdraw-submit {
        width: 100%;
        padding: 15px;
        font-size: 18px;
        font-weight: bold;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .withdraw-notice {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 8px;
        padding: 15px;
        font-size: 14px;
    }

    .withdraw-notice h4 {
        margin: 0 0 10px 0;
        color: #856404;
    }

    .withdraw-notice ul {
        margin: 0;
        padding-left: 20px;
        color: #856404;
    }

    .withdraw-notice li {
        margin-bottom: 5px;
    }
`;
document.head.appendChild(style);