import React, { useState } from 'react'
import { User } from '../../../packages/database/types'
import { TelegramUtils } from '../utils/telegram'
import { db } from '../../../packages/database/client'
import { useUserStore } from '../stores/userStore'

interface WithdrawalPanelProps {
  user: User
  currentCoins: number
  onClose: () => void
}

interface WithdrawalForm {
  amount: number
  method: 'alipay' | 'trc20_usdt'
  alipayAccount?: string
  alipayName?: string
  usdtAddress?: string
}

export default function WithdrawalPanel({ user, currentCoins, onClose }: WithdrawalPanelProps) {
  const [formData, setFormData] = useState<WithdrawalForm>({
    amount: 1000,
    method: 'alipay'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const { updateCoins } = useUserStore()

  const feeRate = 0.03 // 3% 手续费
  const feeAmount = Math.floor(formData.amount * feeRate)
  const netAmount = ((formData.amount - feeAmount) / 100).toFixed(2) // 转换为实际货币单位

  const handleAmountChange = (amount: number) => {
    if (amount <= currentCoins) {
      setFormData(prev => ({ ...prev, amount }))
    }
  }

  const handleSubmit = async () => {
    // 表单验证
    if (formData.amount < 1000) {
      TelegramUtils.showAlert('最小提现金额为1000万花币')
      return
    }

    if (formData.amount > currentCoins) {
      TelegramUtils.showAlert('万花币余额不足')
      return
    }

    if (formData.method === 'alipay') {
      if (!formData.alipayAccount || !formData.alipayName) {
        TelegramUtils.showAlert('请完整填写支付宝账户信息')
        return
      }
    } else {
      if (!formData.usdtAddress) {
        TelegramUtils.showAlert('请填写USDT钱包地址')
        return
      }
    }

    const confirmed = await TelegramUtils.showConfirm(
      `确认提现 ${formData.amount} 万花币？\n手续费：${feeAmount} 万花币\n实际到账：${netAmount} ${formData.method === 'alipay' ? '元' : 'USDT'}`
    )

    if (!confirmed) return

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const accountInfo = formData.method === 'alipay'
        ? { account: formData.alipayAccount, name: formData.alipayName }
        : { address: formData.usdtAddress }

      const { data, error } = await db.createWithdrawalRequest({
        user_id: user.id,
        amount: formData.amount,
        method: formData.method,
        account_info: accountInfo
      })

      if (error) {
        setSubmitResult(`提现申请失败：${error.message}`)
        TelegramUtils.notificationFeedback('error')
      } else {
        // 更新本地万花币余额
        updateCoins(-formData.amount)

        setSubmitResult('提现申请已提交！管理员将在24小时内处理')
        TelegramUtils.notificationFeedback('success')
        TelegramUtils.hapticFeedback('medium')

        // 3秒后关闭面板
        setTimeout(() => {
          onClose()
        }, 3000)
      }

    } catch (error) {
      setSubmitResult('提现申请失败，请重试')
      TelegramUtils.notificationFeedback('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-game-card rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
            <div>
              <h2 className="text-xl font-bold">提现申请</h2>
              <p className="text-white/80 text-sm">当前余额：{currentCoins} 万花币</p>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* 提现金额 */}
          <div>
            <label className="block text-white font-semibold mb-3">提现金额</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1000, 2000, 5000].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleAmountChange(amount)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.amount === amount
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                min="1000"
                max={currentCoins}
                value={formData.amount}
                onChange={(e) => handleAmountChange(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 pr-20 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="输入提现金额"
              />
              <span className="absolute right-3 top-3 text-gray-400">万花币</span>
            </div>

            <div className="text-sm text-gray-400 mt-2">
              最小提现：1000万花币，最大提现：{currentCoins}万花币
            </div>
          </div>

          {/* 提现方式 */}
          <div>
            <label className="block text-white font-semibold mb-3">提现方式</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData(prev => ({ ...prev, method: 'alipay' }))}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.method === 'alipay'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-600 bg-gray-700/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💰</div>
                  <div className="text-white font-medium">支付宝</div>
                  <div className="text-xs text-gray-400">100万花币 = 1元</div>
                </div>
              </button>

              <button
                onClick={() => setFormData(prev => ({ ...prev, method: 'trc20_usdt' }))}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  formData.method === 'trc20_usdt'
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-gray-600 bg-gray-700/50'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🪙</div>
                  <div className="text-white font-medium">USDT</div>
                  <div className="text-xs text-gray-400">TRC-20网络</div>
                </div>
              </button>
            </div>
          </div>

          {/* 账户信息 */}
          <div>
            <label className="block text-white font-semibold mb-3">收款信息</label>
            {formData.method === 'alipay' ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={formData.alipayAccount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, alipayAccount: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="支付宝账号/手机号/邮箱"
                />
                <input
                  type="text"
                  value={formData.alipayName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, alipayName: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="支付宝真实姓名"
                />
              </div>
            ) : (
              <input
                type="text"
                value={formData.usdtAddress || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, usdtAddress: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="USDT钱包地址(TRC-20)"
              />
            )}
          </div>

          {/* 费用明细 */}
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3">费用明细</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>提现金额</span>
                <span>{formData.amount} 万花币</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>手续费 (3%)</span>
                <span>-{feeAmount} 万花币</span>
              </div>
              <div className="border-t border-gray-600 pt-2 flex justify-between text-white font-semibold">
                <span>实际到账</span>
                <span>{netAmount} {formData.method === 'alipay' ? '元' : 'USDT'}</span>
              </div>
            </div>
          </div>

          {/* 提现说明 */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-yellow-400 font-semibold mb-2">提现说明</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>• 提现申请提交后24小时内处理</div>
              <div>• 手续费为提现金额的3%</div>
              <div>• 请确保收款信息准确，错误信息导致的损失自负</div>
              <div>• 工作日处理速度更快</div>
            </div>
          </div>

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || formData.amount < 1000}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>提交中...</span>
              </div>
            ) : (
              `确认提现 ${netAmount} ${formData.method === 'alipay' ? '元' : 'USDT'}`
            )}
          </button>

          {/* 提交结果 */}
          {submitResult && (
            <div className={`text-center p-3 rounded-lg ${
              submitResult.includes('已提交')
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {submitResult}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}