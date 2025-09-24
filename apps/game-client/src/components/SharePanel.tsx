import React, { useState } from 'react'
import { User } from '../../../packages/database/types'
import { TelegramUtils, ShareManager } from '../utils/telegram'
import { db } from '../../../packages/database/client'
import { useUserStore } from '../stores/userStore'

interface SharePanelProps {
  user: User
  onClose: () => void
}

export default function SharePanel({ user, onClose }: SharePanelProps) {
  const [isSharing, setIsSharing] = useState(false)
  const [shareResult, setShareResult] = useState<string | null>(null)
  const { updateCoins } = useUserStore()

  const shareManager = ShareManager.getInstance()
  const todayShareCount = shareManager.getTodayShareCount(user.id)
  const canShare = todayShareCount < 6

  const handleShare = async (shareType: 'private' | 'group') => {
    if (!canShare) {
      TelegramUtils.showAlert('今日分享次数已达上限（6次）')
      return
    }

    setIsSharing(true)
    setShareResult(null)

    try {
      // 执行分享
      const result = await shareManager.executeShare(shareType, {
        id: user.id,
        username: user.username || user.first_name || '玩家',
        inviteCode: user.invite_code,
        level: user.current_level,
        coins: user.wanhua_coins
      })

      if (result.success) {
        // 记录分享到数据库并获得奖励
        const { error } = await db.recordShare(user.id, shareType)

        if (!error) {
          updateCoins(5) // 添加5万花币奖励
          setShareResult('分享成功！获得5万花币奖励')
          TelegramUtils.notificationFeedback('success')
        } else {
          setShareResult(result.message)
        }
      } else {
        setShareResult(result.message)
        TelegramUtils.notificationFeedback('error')
      }

    } catch (error) {
      setShareResult('分享失败，请重试')
      TelegramUtils.notificationFeedback('error')
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyInviteLink = () => {
    const inviteLink = `https://t.me/XBTyxbot?start=${user.invite_code}`

    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink)
      TelegramUtils.showAlert('邀请链接已复制到剪贴板')
    } else {
      TelegramUtils.showAlert(`邀请链接：${inviteLink}`)
    }

    TelegramUtils.hapticFeedback('light')
  }

  const generatePreviewText = (shareType: 'private' | 'group') => {
    const templates = shareType === 'private'
      ? [
          `🎮 我在玩消不停・万币赢，已经赚了 ${user.wanhua_coins} 万花币！真的能提现哦！快来和我一起玩吧！邀请码：${user.invite_code}`,
          `💰 太爽了！玩消除游戏就能赚钱，我已经通过第 ${user.current_level} 关了！你也来试试吧：${user.invite_code}`,
          `🌟 发现一个超棒的赚钱游戏！消除游戏玩着轻松，还能赚万花币提现。我的邀请码：${user.invite_code}`
        ]
      : [
          `🎯 【消不停・万币赢】新上线！玩消除游戏赚真钱💰\n✅ 真实提现到支付宝/USDT\n✅ 简单易上手，老少皆宜\n🔥 使用邀请码有额外奖励：${user.invite_code}`,
          `🎮 和朋友们分享一个好玩的赚钱小游戏\n消除游戏+区块链收益，玩着就把钱赚了！\n我的战绩：第${user.current_level}关 | ${user.wanhua_coins}万花币\n一起来玩：${user.invite_code}`
        ]

    return templates[Math.floor(Math.random() * templates.length)]
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
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
            </svg>
            <div>
              <h2 className="text-xl font-bold">分享游戏</h2>
              <p className="text-white/80 text-sm">分享获得万花币奖励</p>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* 分享次数显示 */}
          <div className="bg-game-bg/50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">今日分享次数</span>
              <span className={`font-bold ${canShare ? 'text-green-400' : 'text-red-400'}`}>
                {todayShareCount}/6
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(todayShareCount / 6) * 100}%` }}
              />
            </div>
            {canShare && (
              <p className="text-sm text-gray-400 mt-2">
                每次分享获得5万花币，今日还可分享 {6 - todayShareCount} 次
              </p>
            )}
          </div>

          {/* 分享选项 */}
          <div className="space-y-4">
            {/* 私聊分享 */}
            <div className="border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <h3 className="font-semibold text-white">分享给好友</h3>
                    <p className="text-sm text-gray-400">私聊分享，精准邀请</p>
                  </div>
                </div>
                <button
                  onClick={() => handleShare('private')}
                  disabled={!canShare || isSharing}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSharing ? '分享中...' : '分享'}
                </button>
              </div>
              <div className="bg-gray-700/30 rounded p-3 text-sm text-gray-300">
                {generatePreviewText('private')}
              </div>
            </div>

            {/* 群组分享 */}
            <div className="border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                  <div>
                    <h3 className="font-semibold text-white">分享到群组</h3>
                    <p className="text-sm text-gray-400">群组分享，批量推广</p>
                  </div>
                </div>
                <button
                  onClick={() => handleShare('group')}
                  disabled={!canShare || isSharing}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSharing ? '分享中...' : '分享'}
                </button>
              </div>
              <div className="bg-gray-700/30 rounded p-3 text-sm text-gray-300">
                {generatePreviewText('group')}
              </div>
            </div>
          </div>

          {/* 邀请链接复制 */}
          <div className="border-t border-gray-600 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 font-medium">邀请链接</span>
              <button
                onClick={handleCopyInviteLink}
                className="text-primary-400 hover:text-primary-300 text-sm"
              >
                复制链接
              </button>
            </div>
            <div className="bg-gray-700/50 rounded p-3 text-sm text-gray-300 break-all">
              https://t.me/XBTyxbot?start={user.invite_code}
            </div>
          </div>

          {/* 分享结果 */}
          {shareResult && (
            <div className={`text-center p-3 rounded-lg ${
              shareResult.includes('成功')
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {shareResult}
            </div>
          )}

          {/* 分享奖励说明 */}
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
            <h3 className="text-primary-400 font-semibold mb-2">分享奖励规则</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>• 每次成功分享获得 5 万花币</div>
              <div>• 每日最多分享 6 次</div>
              <div>• 邀请好友完成10关额外奖励 30 万花币</div>
              <div>• 分享次数每日0点重置</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}