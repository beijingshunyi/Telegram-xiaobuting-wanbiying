/**
 * 提现系统
 * 处理支付宝和USDT提现申请、验证和管理
 */

class WithdrawSystem {
    constructor() {
        this.coinSystem = null;
        this.withdrawalRequests = new Map();
        this.pendingRequests = [];

        // 提现方法配置
        this.methods = {
            alipay: {
                name: '支付宝',
                minAmount: 3000,      // 30元
                maxAmount: 100000,    // 1000元
                fee: 0.02,            // 2%
                processingTime: '1-24小时',
                fields: ['account', 'realName']
            },
            usdt: {
                name: 'USDT (TRC-20)',
                minAmount: 720,       // 1 USDT
                maxAmount: 72000,     // 100 USDT
                fee: 0.02,            // 2%
                processingTime: '10-30分钟',
                fields: ['walletAddress']
            }
        };

        // 实时汇率（模拟）
        this.exchangeRates = {
            usdt: 7.2,  // 1 USDT = 7.2 CNY
            updateTime: Date.now()
        };

        // 提现状态
        this.STATUS = {
            PENDING: 'pending',
            PROCESSING: 'processing',
            COMPLETED: 'completed',
            REJECTED: 'rejected',
            CANCELLED: 'cancelled'
        };

        // 风控配置
        this.riskControl = {
            maxDailyRequests: 3,
            maxDailyAmount: 50000,    // 500元
            cooldownPeriod: 5 * 60 * 1000,  // 5分钟冷却期
            verificationRequired: 10000     // 超过100元需要验证
        };

        console.log('💸 WithdrawSystem initialized');
    }

    // 初始化提现系统
    async init(coinSystem) {
        this.coinSystem = coinSystem;

        try {
            // 加载提现记录
            this.loadWithdrawalHistory();

            // 更新汇率
            await this.updateExchangeRates();

            // 绑定UI事件
            this.bindUIEvents();

            console.log('✅ WithdrawSystem initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize WithdrawSystem:', error);
            return false;
        }
    }

    // 加载提现记录
    loadWithdrawalHistory() {
        const saved = GameHelpers.storage.get('withdrawal_requests', []);
        this.pendingRequests = saved.filter(req =>
            req.status === this.STATUS.PENDING || req.status === this.STATUS.PROCESSING
        );

        saved.forEach(req => {
            this.withdrawalRequests.set(req.id, req);
        });

        console.log(`📜 Loaded ${saved.length} withdrawal records`);
    }

    // 保存提现记录
    saveWithdrawalHistory() {
        const allRequests = Array.from(this.withdrawalRequests.values());
        GameHelpers.storage.set('withdrawal_requests', allRequests);
    }

    // 更新汇率
    async updateExchangeRates() {
        try {
            // 模拟获取实时汇率
            // 在实际应用中，这里应该调用真实的汇率API
            const simulatedRate = 7.0 + Math.random() * 0.5; // 7.0-7.5之间

            this.exchangeRates.usdt = simulatedRate;
            this.exchangeRates.updateTime = Date.now();

            console.log(`💱 Updated USDT rate: ${this.exchangeRates.usdt}`);

            // 更新UI显示
            this.updateRateDisplay();

        } catch (error) {
            console.warn('⚠️ Failed to update exchange rates:', error);
        }
    }

    // 绑定UI事件
    bindUIEvents() {
        // 提现方法选择
        document.querySelectorAll('.method-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const method = card.dataset.method;
                if (method) {
                    this.selectWithdrawalMethod(method);
                }
            });
        });

        // 提现按钮
        const withdrawBtn = document.getElementById('confirm-withdraw');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', (e) => {
                this.handleWithdrawRequest();
            });
        }

        // 金额输入验证
        const amountInput = document.getElementById('withdraw-amount');
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                this.validateWithdrawAmount(e.target.value);
            });
        }
    }

    // 选择提现方法
    selectWithdrawalMethod(method) {
        if (!this.methods[method]) {
            console.error('❌ Invalid withdrawal method:', method);
            return;
        }

        // 移除其他选中状态
        document.querySelectorAll('.method-card').forEach(card => {
            card.classList.remove('selected');
        });

        // 选中当前方法
        const selectedCard = document.querySelector(`[data-method="${method}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        // 显示对应的表单
        this.showWithdrawForm(method);

        console.log(`💳 Selected withdrawal method: ${method}`);
    }

    // 显示提现表单
    showWithdrawForm(method) {
        const methodConfig = this.methods[method];

        // 创建表单HTML
        const formHTML = this.generateWithdrawForm(method, methodConfig);

        // 更新页面
        const formContainer = document.getElementById('withdraw-form-container');
        if (formContainer) {
            formContainer.innerHTML = formHTML;
            formContainer.classList.add('active');
        }

        // 更新最小提现显示
        this.updateMinAmountDisplay(method, methodConfig.minAmount);
    }

    // 生成提现表单HTML
    generateWithdrawForm(method, config) {
        let fieldsHTML = '';

        if (method === 'alipay') {
            fieldsHTML = `
                <div class="form-group">
                    <label for="alipay-account">支付宝账号</label>
                    <input type="text" id="alipay-account" placeholder="请输入支付宝账号" required>
                </div>
                <div class="form-group">
                    <label for="real-name">真实姓名</label>
                    <input type="text" id="real-name" placeholder="请输入真实姓名" required>
                </div>
            `;
        } else if (method === 'usdt') {
            fieldsHTML = `
                <div class="form-group">
                    <label for="wallet-address">USDT钱包地址 (TRC-20)</label>
                    <input type="text" id="wallet-address" placeholder="请输入TRC-20钱包地址" required>
                    <small>请确保钱包地址支持TRC-20网络</small>
                </div>
                <div class="rate-info">
                    <p>当前汇率: 1 USDT = ${this.exchangeRates.usdt.toFixed(2)} CNY</p>
                    <p>汇率更新时间: ${new Date(this.exchangeRates.updateTime).toLocaleTimeString()}</p>
                </div>
            `;
        }

        return `
            <div class="withdraw-form">
                <h3>提现到 ${config.name}</h3>

                <div class="form-group">
                    <label for="withdraw-amount">提现金额</label>
                    <div class="amount-input-container">
                        <input type="number" id="withdraw-amount"
                               placeholder="请输入提现金额"
                               min="${config.minAmount}"
                               max="${config.maxAmount}"
                               required>
                        <span class="amount-unit">万花币</span>
                    </div>
                    <div class="amount-hints">
                        <p>最低提现: ${config.minAmount.toLocaleString()} 万花币</p>
                        <p>手续费: ${(config.fee * 100).toFixed(0)}%</p>
                        <p>预计到账: <span id="estimated-amount">-</span></p>
                    </div>
                </div>

                ${fieldsHTML}

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.withdraw-form').style.display='none'">
                        取消
                    </button>
                    <button type="button" class="btn btn-primary" id="confirm-withdraw" disabled>
                        确认提现
                    </button>
                </div>

                <div class="withdraw-notes">
                    <h4>提现说明</h4>
                    <ul>
                        <li>提现申请提交后无法取消，请仔细核对信息</li>
                        <li>预计处理时间: ${config.processingTime}</li>
                        <li>每日最多可申请 ${this.riskControl.maxDailyRequests} 次提现</li>
                        <li>单日提现限额: ${this.riskControl.maxDailyAmount.toLocaleString()} 万花币</li>
                    </ul>
                </div>
            </div>
        `;
    }

    // 验证提现金额
    validateWithdrawAmount(amount) {
        const numAmount = parseInt(amount);
        const selectedMethod = document.querySelector('.method-card.selected')?.dataset.method;

        if (!selectedMethod) return false;

        const methodConfig = this.methods[selectedMethod];
        const confirmBtn = document.getElementById('confirm-withdraw');
        const estimatedSpan = document.getElementById('estimated-amount');

        // 验证条件
        const isValid = numAmount >= methodConfig.minAmount &&
                        numAmount <= methodConfig.maxAmount &&
                        numAmount <= this.coinSystem.getBalance();

        // 更新按钮状态
        if (confirmBtn) {
            confirmBtn.disabled = !isValid;
        }

        // 计算预计到账金额
        if (isValid && estimatedSpan) {
            const fee = Math.floor(numAmount * methodConfig.fee);
            const actualAmount = numAmount - fee;

            if (selectedMethod === 'alipay') {
                const cnyAmount = actualAmount / 100; // 万花币转人民币
                estimatedSpan.textContent = `${cnyAmount.toFixed(2)} 元`;
            } else if (selectedMethod === 'usdt') {
                const usdtAmount = actualAmount / 720; // 万花币转USDT
                estimatedSpan.textContent = `${usdtAmount.toFixed(4)} USDT`;
            }
        } else if (estimatedSpan) {
            estimatedSpan.textContent = '-';
        }

        return isValid;
    }

    // 处理提现请求
    async handleWithdrawRequest() {
        const selectedMethod = document.querySelector('.method-card.selected')?.dataset.method;
        if (!selectedMethod) {
            this.showMessage('请选择提现方式', 'error');
            return;
        }

        const amount = parseInt(document.getElementById('withdraw-amount')?.value || 0);
        if (!amount) {
            this.showMessage('请输入提现金额', 'error');
            return;
        }

        // 收集表单数据
        const formData = this.collectFormData(selectedMethod);
        if (!formData) {
            this.showMessage('请完整填写提现信息', 'error');
            return;
        }

        // 风控检查
        const riskCheck = this.performRiskCheck(amount, selectedMethod);
        if (!riskCheck.passed) {
            this.showMessage(riskCheck.message, 'error');
            return;
        }

        try {
            // 显示确认对话框
            const confirmed = await this.showConfirmDialog(amount, selectedMethod, formData);
            if (!confirmed) return;

            // 提交提现申请
            const result = this.submitWithdrawalRequest(amount, selectedMethod, formData);

            if (result.success) {
                this.showMessage('提现申请已提交，请等待处理', 'success');
                this.clearForm();
                this.updateBalance();
            } else {
                this.showMessage(result.message, 'error');
            }

        } catch (error) {
            console.error('❌ Withdrawal request failed:', error);
            this.showMessage('提现申请失败，请重试', 'error');
        }
    }

    // 收集表单数据
    collectFormData(method) {
        const data = { method: method };

        if (method === 'alipay') {
            const account = document.getElementById('alipay-account')?.value.trim();
            const realName = document.getElementById('real-name')?.value.trim();

            if (!account || !realName) return null;

            // 验证支付宝账号格式
            if (!this.validateAlipayAccount(account)) {
                this.showMessage('请输入正确的支付宝账号', 'error');
                return null;
            }

            data.account = account;
            data.realName = realName;

        } else if (method === 'usdt') {
            const walletAddress = document.getElementById('wallet-address')?.value.trim();

            if (!walletAddress) return null;

            // 验证USDT钱包地址格式
            if (!this.validateUSDTAddress(walletAddress)) {
                this.showMessage('请输入正确的USDT钱包地址', 'error');
                return null;
            }

            data.walletAddress = walletAddress;
        }

        return data;
    }

    // 验证支付宝账号
    validateAlipayAccount(account) {
        // 支持手机号和邮箱
        const phoneRegex = /^1[3-9]\d{9}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return phoneRegex.test(account) || emailRegex.test(account);
    }

    // 验证USDT钱包地址
    validateUSDTAddress(address) {
        // TRC-20地址格式验证（简化版）
        return address.length === 34 && address.startsWith('T');
    }

    // 风控检查
    performRiskCheck(amount, method) {
        const today = new Date().toDateString();
        const todayRequests = Array.from(this.withdrawalRequests.values())
            .filter(req => new Date(req.timestamp).toDateString() === today);

        // 检查每日申请次数
        if (todayRequests.length >= this.riskControl.maxDailyRequests) {
            return {
                passed: false,
                message: `每日最多可申请${this.riskControl.maxDailyRequests}次提现`
            };
        }

        // 检查每日提现金额
        const todayTotal = todayRequests.reduce((sum, req) => sum + req.amount, 0);
        if (todayTotal + amount > this.riskControl.maxDailyAmount) {
            return {
                passed: false,
                message: `超出每日提现限额 (${this.riskControl.maxDailyAmount.toLocaleString()} 万花币)`
            };
        }

        // 检查冷却期
        const lastRequest = todayRequests.sort((a, b) => b.timestamp - a.timestamp)[0];
        if (lastRequest && Date.now() - lastRequest.timestamp < this.riskControl.cooldownPeriod) {
            const remaining = Math.ceil((this.riskControl.cooldownPeriod - (Date.now() - lastRequest.timestamp)) / 60000);
            return {
                passed: false,
                message: `请等待 ${remaining} 分钟后再次申请`
            };
        }

        return { passed: true };
    }

    // 显示确认对话框
    showConfirmDialog(amount, method, formData) {
        return new Promise((resolve) => {
            const methodConfig = this.methods[method];
            const fee = Math.floor(amount * methodConfig.fee);
            const actualAmount = amount - fee;

            let displayAmount = '';
            if (method === 'alipay') {
                displayAmount = `${(actualAmount / 100).toFixed(2)} 元`;
            } else if (method === 'usdt') {
                displayAmount = `${(actualAmount / 720).toFixed(4)} USDT`;
            }

            const message = `
确认提现信息：
提现方式: ${methodConfig.name}
提现金额: ${amount.toLocaleString()} 万花币
手续费: ${fee.toLocaleString()} 万花币
实际到账: ${displayAmount}

${method === 'alipay' ? `
支付宝账号: ${formData.account}
真实姓名: ${formData.realName}
` : `
钱包地址: ${formData.walletAddress}
`}

确认提交申请吗？申请提交后无法取消。`;

            if (confirm(message)) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    // 提交提现申请
    submitWithdrawalRequest(amount, method, formData) {
        // 使用CoinSystem的提现功能
        const result = this.coinSystem.requestWithdrawal(amount, method, formData);

        if (result.success) {
            // 保存到本地记录
            const request = result.data;
            this.withdrawalRequests.set(request.id, request);
            this.pendingRequests.push(request);
            this.saveWithdrawalHistory();

            // 模拟提现处理（实际应用中由后端处理）
            this.simulateWithdrawalProcessing(request);
        }

        return result;
    }

    // 模拟提现处理过程
    simulateWithdrawalProcessing(request) {
        // 模拟不同的处理时间
        const processingTime = request.method === 'usdt' ?
            GameHelpers.math.randomInt(10, 30) * 60 * 1000 :  // 10-30分钟
            GameHelpers.math.randomInt(60, 1440) * 60 * 1000; // 1-24小时

        setTimeout(() => {
            // 90%概率成功，10%概率失败（用于测试）
            const success = Math.random() > 0.1;

            this.updateWithdrawalStatus(request.id, success ?
                this.STATUS.COMPLETED : this.STATUS.REJECTED
            );

            // 如果失败，退回万花币
            if (!success) {
                this.coinSystem.addCoins(request.amount, '提现失败退款', {
                    withdrawalId: request.id
                });
            }

        }, Math.min(processingTime, 5000)); // 演示用，最多等5秒
    }

    // 更新提现状态
    updateWithdrawalStatus(requestId, newStatus) {
        const request = this.withdrawalRequests.get(requestId);
        if (request) {
            request.status = newStatus;
            request.updateTime = Date.now();

            // 从待处理列表移除
            if (newStatus === this.STATUS.COMPLETED || newStatus === this.STATUS.REJECTED) {
                this.pendingRequests = this.pendingRequests.filter(req => req.id !== requestId);
            }

            this.saveWithdrawalHistory();

            // 通知用户
            this.notifyWithdrawalUpdate(request);
        }
    }

    // 通知提现状态更新
    notifyWithdrawalUpdate(request) {
        const statusText = {
            [this.STATUS.COMPLETED]: '已完成',
            [this.STATUS.REJECTED]: '已拒绝',
            [this.STATUS.PROCESSING]: '处理中'
        };

        const message = `提现申请${statusText[request.status]}`;
        this.showMessage(message, request.status === this.STATUS.COMPLETED ? 'success' : 'info');
    }

    // 获取提现记录
    getWithdrawalHistory(limit = 20) {
        return Array.from(this.withdrawalRequests.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // 获取待处理提现
    getPendingWithdrawals() {
        return [...this.pendingRequests];
    }

    // 取消提现申请（仅限待处理状态）
    cancelWithdrawal(requestId) {
        const request = this.withdrawalRequests.get(requestId);
        if (!request || request.status !== this.STATUS.PENDING) {
            return {
                success: false,
                message: '无法取消该提现申请'
            };
        }

        // 更新状态为已取消
        this.updateWithdrawalStatus(requestId, this.STATUS.CANCELLED);

        // 退回万花币
        this.coinSystem.addCoins(request.amount, '提现取消退款', {
            withdrawalId: requestId
        });

        return {
            success: true,
            message: '提现申请已取消'
        };
    }

    // 更新汇率显示
    updateRateDisplay() {
        const rateElement = document.getElementById('usdt-rate');
        if (rateElement) {
            rateElement.textContent = this.exchangeRates.usdt.toFixed(2);
        }
    }

    // 更新最小金额显示
    updateMinAmountDisplay(method, minAmount) {
        const displayElements = document.querySelectorAll('.min-amount-display');
        displayElements.forEach(element => {
            if (method === 'alipay') {
                element.textContent = `${minAmount.toLocaleString()} 万花币 (${(minAmount / 100).toFixed(0)} 元)`;
            } else if (method === 'usdt') {
                element.textContent = `${minAmount.toLocaleString()} 万花币 (${(minAmount / 720).toFixed(1)} USDT)`;
            }
        });
    }

    // 更新余额显示
    updateBalance() {
        const balanceElement = document.getElementById('withdraw-balance');
        if (balanceElement && this.coinSystem) {
            balanceElement.textContent = this.coinSystem.getFormattedBalance();
        }
    }

    // 清空表单
    clearForm() {
        const formContainer = document.getElementById('withdraw-form-container');
        if (formContainer) {
            formContainer.innerHTML = '';
            formContainer.classList.remove('active');
        }

        // 取消选中状态
        document.querySelectorAll('.method-card').forEach(card => {
            card.classList.remove('selected');
        });
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 简单的消息显示（可以替换为更美观的Toast）
        console.log(`${type.toUpperCase()}: ${message}`);

        // 如果有消息容器，显示在页面上
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            const messageElement = document.createElement('div');
            messageElement.className = `message message-${type}`;
            messageElement.textContent = message;

            messageContainer.appendChild(messageElement);

            // 自动移除
            setTimeout(() => {
                messageElement.remove();
            }, 3000);
        } else {
            // 备用方案
            alert(message);
        }
    }

    // 获取系统统计信息
    getStatistics() {
        const allRequests = Array.from(this.withdrawalRequests.values());
        const completed = allRequests.filter(req => req.status === this.STATUS.COMPLETED);
        const pending = allRequests.filter(req => req.status === this.STATUS.PENDING);
        const rejected = allRequests.filter(req => req.status === this.STATUS.REJECTED);

        return {
            totalRequests: allRequests.length,
            completedRequests: completed.length,
            pendingRequests: pending.length,
            rejectedRequests: rejected.length,
            totalWithdrawn: completed.reduce((sum, req) => sum + req.actualAmount, 0),
            totalFees: completed.reduce((sum, req) => sum + req.fee, 0),
            averageAmount: completed.length > 0 ?
                completed.reduce((sum, req) => sum + req.amount, 0) / completed.length : 0
        };
    }
}

// 导出WithdrawSystem类
window.WithdrawSystem = WithdrawSystem;