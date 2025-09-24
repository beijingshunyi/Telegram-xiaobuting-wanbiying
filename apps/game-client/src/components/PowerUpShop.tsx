import React, { useState } from 'react'
import { User } from '../../../packages/database/types'
import { GAME_CONFIG } from '../../../packages/config/constants'
import { TelegramUtils } from '../utils/telegram'
import { AdUtils } from '../utils/admob'
import { db } from '../../../packages/database/client'
import { useUserStore } from '../stores/userStore'

interface PowerUpShopProps {
  user: User
  onClose: () => void
  onPowerUpPurchased: (powerUpId: string) => void
}

interface PowerUpItem {
  id: string
  name: string
  description: string
  icon: string
  cost: number
  currentCount: number
  maxCount?: number
}

export default function PowerUpShop({ user, onClose, onPowerUpPurchased }: PowerUpShopProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingItem, setProcessingItem] = useState<string | null>(null)
  const { updateCoins } = useUserStore()

  const powerUps: PowerUpItem[] = [
    {
      id: 'hammer',
      name: '锤子',
      description: '点击消除单个方块（包括障碍物）',
      icon: '🔨',
      cost: GAME_CONFIG.POWER_UPS.HAMMER.cost,
      currentCount: user.hammer_count || 0,
      maxCount: 99
    },
    {
      id: 'shuffle',
      name: '洗牌',
      description: '重新随机排列整个棋盘',
      icon: '🔀',
      cost: GAME_CONFIG.POWER_UPS.SHUFFLE.cost,
      currentCount: user.shuffle_count || 0,
      maxCount: 99
    },
    {
      id: 'extra_moves',
      name: '加步数',
      description: '增加5次移动机会',
      icon: '➕',
      cost: GAME_CONFIG.POWER_UPS.EXTRA_MOVES.cost,
      currentCount: user.extra_moves_count || 0,
      maxCount: 99
    },
    {
      id: 'hint',
      name: '提示',
      description: '高亮显示可消除的组合',
      icon: '💡',
      cost: GAME_CONFIG.POWER_UPS.HINT.cost,
      currentCount: user.hint_count || 0,
      maxCount: 99
    }
  ]

  const handlePurchase = async (powerUp: PowerUpItem, method: 'coins' | 'ad') => {
    if (isProcessing) return

    setIsProcessing(true)
    setProcessingItem(powerUp.id)

    try {
      if (method === 'ad') {
        // 观看广告获得道具
        const success = await AdUtils.offerRewardedVideoForPowerUp(powerUp.name)
        if (success) {
          await updatePowerUpCount(powerUp.id, 1, true)
          TelegramUtils.showAlert(`观看广告获得${powerUp.name}道具！`)
          TelegramUtils.hapticFeedback('medium')
        }
      } else {
        // 万花币购买
        if ((user.wanhua_coins || 0) < powerUp.cost) {
          TelegramUtils.showAlert('万花币不足')
          TelegramUtils.notificationFeedback('error')
          return
        }

        const confirmed = await TelegramUtils.showConfirm(
          `确认花费 ${powerUp.cost} 万花币购买${powerUp.name}？`
        )

        if (!confirmed) return

        await updatePowerUpCount(powerUp.id, 1, false, powerUp.cost)
        updateCoins(-powerUp.cost)

        TelegramUtils.showAlert(`成功购买${powerUp.name}！`)
        TelegramUtils.hapticFeedback('medium')
      }

      onPowerUpPurchased(powerUp.id)

    } catch (error) {
      console.error('Purchase failed:', error)
      TelegramUtils.showAlert('购买失败，请重试')
      TelegramUtils.notificationFeedback('error')
    } finally {
      setIsProcessing(false)
      setProcessingItem(null)
    }
  }

  const updatePowerUpCount = async (powerUpId: string, count: number, fromAd: boolean, cost?: number) => {
    const updateData: any = {}
    const columnMap: { [key: string]: string } = {
      hammer: 'hammer_count',
      shuffle: 'shuffle_count',
      extra_moves: 'extra_moves_count',
      hint: 'hint_count'
    }

    const column = columnMap[powerUpId]
    if (!column) return

    updateData[column] = ((user as any)[column] || 0) + count

    await db.updateUser(user.id, updateData)

    // 记录交易
    if (!fromAd && cost) {
      await db.addTransaction({
        user_id: user.id,
        type: 'spend_powerup',
        amount: -cost,
        description: `购买道具：${powerUpId}`,
        metadata: { power_up_id: powerUpId, count }
      })
    }
  }

  const handleBulkPurchase = async (powerUp: PowerUpItem, count: number) => {
    if (isProcessing) return

    const totalCost = powerUp.cost * count

    if ((user.wanhua_coins || 0) < totalCost) {
      TelegramUtils.showAlert('万花币不足')
      return
    }

    const confirmed = await TelegramUtils.showConfirm(
      `确认花费 ${totalCost} 万花币购买${count}个${powerUp.name}？`
    )

    if (!confirmed) return

    setIsProcessing(true)
    setProcessingItem(powerUp.id)

    try {
      await updatePowerUpCount(powerUp.id, count, false, totalCost)
      updateCoins(-totalCost)

      TelegramUtils.showAlert(`成功购买${count}个${powerUp.name}！`)
      TelegramUtils.hapticFeedback('medium')

      onPowerUpPurchased(powerUp.id)

    } catch (error) {
      console.error('Bulk purchase failed:', error)
      TelegramUtils.showAlert('购买失败，请重试')
    } finally {
      setIsProcessing(false)
      setProcessingItem(null)
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
              <path fillRule="evenodd" d="M10 2L3 7v11a2 2 0 002 2h4v-6h4v6h4a2 2 0 002-2V7l-7-5z" clipRule="evenodd"/>
            </svg>
            <div>
              <h2 className="text-xl font-bold">道具商店</h2>
              <p className="text-white/80 text-sm">当前余额：{user.wanhua_coins || 0} 万花币</p>
            </div>
          </div>
        </div>

        {/* 道具列表 */}
        <div className="p-6 max-h-96 overflow-y-auto space-y-4">
          {powerUps.map((powerUp) => (
            <div key={powerUp.id} className="bg-game-bg/50 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{powerUp.icon}</div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold text-lg">{powerUp.name}</h3>
                    <span className="text-primary-400 font-bold">
                      拥有: {powerUp.currentCount}
                    </span>
                  </div>

                  <p className="text-gray-300 text-sm mb-3">{powerUp.description}</p>

                  <div className="flex items-center space-x-2">
                    {/* 万花币购买 */}
                    <button
                      onClick={() => handlePurchase(powerUp, 'coins')}
                      disabled={isProcessing || (user.wanhua_coins || 0) < powerUp.cost}
                      className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 px-3 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors btn-click"
                    >
                      {processingItem === powerUp.id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          处理中
                        </div>
                      ) : (
                        `${powerUp.cost} 万花币`
                      )}
                    </button>

                    {/* 观看广告获得 */}
                    <button
                      onClick={() => handlePurchase(powerUp, 'ad')}
                      disabled={isProcessing}
                      className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors btn-click"
                    >
                      📺 广告
                    </button>

                    {/* 批量购买下拉菜单 */}
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          const count = parseInt(e.target.value)
                          if (count > 1) {
                            handleBulkPurchase(powerUp, count)
                          }
                          e.target.value = '1'
                        }}
                        className="bg-gray-600 text-white py-2 px-2 rounded-lg text-sm"
                        disabled={isProcessing}
                      >
                        <option value="1">x1</option>
                        <option value="5">x5</option>
                        <option value="10">x10</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="p-6 border-t border-gray-600">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-2">💡 获取道具的方法</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>• 使用万花币直接购买</div>
              <div>• 观看广告免费获得（每个道具每日3次）</div>
              <div>• 完成每日签到获得道具奖励</div>
              <div>• 邀请好友可获得道具礼包</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}