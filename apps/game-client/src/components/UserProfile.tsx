import React, { useState } from 'react'
import { User } from '../../../packages/database/types'
import { TelegramUtils } from '../utils/telegram'
import { db } from '../../../packages/database/client'

interface UserProfileProps {
  user: User
  onClose: () => void
}

export default function UserProfile({ user, onClose }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'checkin' | 'invite'>('profile')
  const [isCheckinLoading, setIsCheckinLoading] = useState(false)
  const [checkinResult, setCheckinResult] = useState<string | null>(null)

  const handleCheckin = async () => {
    setIsCheckinLoading(true)
    setCheckinResult(null)

    try {
      const { data, error } = await db.dailyCheckin(user.id)

      if (error) {
        setCheckinResult(error.message)
        TelegramUtils.notificationFeedback('error')
      } else if (data) {
        setCheckinResult(`签到成功！获得 ${data.reward_amount} 万花币`)
        TelegramUtils.notificationFeedback('success')
        TelegramUtils.hapticFeedback('medium')
      }
    } catch (error) {
      setCheckinResult('签到失败，请重试')
      TelegramUtils.notificationFeedback('error')
    } finally {
      setIsCheckinLoading(false)
    }
  }

  const handleInviteFriend = () => {
    const inviteText = `🎮 我在玩"消不停・万币赢"，已经赚了 ${user.wanhua_coins} 万花币！

🎯 这是一个可以赚真钱的消除游戏
💰 玩游戏就能获得万花币，可以提现
🎁 使用我的邀请码有额外奖励

邀请码：${user.invite_code}

点击链接开始游戏：
https://t.me/XBTyxbot?start=${user.invite_code}

游戏由"北京修车【万花楼】"赞助开发`

    TelegramUtils.shareToTelegram(inviteText, 'private')
    TelegramUtils.hapticFeedback('light')
  }

  const copyInviteCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(user.invite_code)
      TelegramUtils.showAlert('邀请码已复制到剪贴板')
    } else {
      TelegramUtils.showAlert(`您的邀请码：${user.invite_code}`)
    }
    TelegramUtils.hapticFeedback('light')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '从未'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getCheckinStreak = () => {
    const streak = user.checkin_streak || 0
    const dayInCycle = ((streak - 1) % 7) + 1
    const rewards = [5, 10, 15, 25, 40, 60, 100]
    const nextReward = rewards[dayInCycle - 1]

    return { streak, dayInCycle, nextReward }
  }

  const { streak, dayInCycle, nextReward } = getCheckinStreak()

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

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
              {user.first_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {user.first_name} {user.last_name || ''}
              </h2>
              {user.username && (
                <p className="text-white/80">@{user.username}</p>
              )}
              <p className="text-white/60 text-sm">ID: {user.telegram_id}</p>
            </div>
          </div>
        </div>

        {/* 导航栏 */}
        <div className="flex border-b border-gray-700">
          {[
            { key: 'profile', label: '资料', icon: 'user' },
            { key: 'checkin', label: '签到', icon: 'calendar' },
            { key: 'invite', label: '邀请', icon: 'users' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-4 px-2 text-center transition-colors ${
                activeTab === tab.key
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="text-sm font-medium">{tab.label}</div>
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* 游戏统计 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-game-bg/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary-400">
                    {user.wanhua_coins || 0}
                  </div>
                  <div className="text-sm text-gray-400">万花币</div>
                </div>
                <div className="bg-game-bg/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary-400">
                    {user.current_level || 1}
                  </div>
                  <div className="text-sm text-gray-400">当前关卡</div>
                </div>
                <div className="bg-game-bg/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary-400">
                    {user.highest_score || 0}
                  </div>
                  <div className="text-sm text-gray-400">最高分</div>
                </div>
                <div className="bg-game-bg/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary-400">
                    {user.games_played || 0}
                  </div>
                  <div className="text-sm text-gray-400">游戏次数</div>
                </div>
              </div>

              {/* 详细信息 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">注册时间</span>
                  <span className="text-white">{formatDate(user.created_at)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">最后登录</span>
                  <span className="text-white">{formatDate(user.last_login_at)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">总游戏时长</span>
                  <span className="text-white">
                    {Math.floor((user.total_play_time || 0) / 60)} 分钟
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">累计收益</span>
                  <span className="text-white">{user.total_earned || 0} 万花币</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checkin' && (
            <div className="space-y-4">
              {/* 签到状态 */}
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-400 mb-2">
                  {streak}
                </div>
                <div className="text-gray-300">连续签到天数</div>
              </div>

              {/* 签到奖励 */}
              <div className="bg-game-bg/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">签到奖励</h3>
                <div className="grid grid-cols-7 gap-2">
                  {[5, 10, 15, 25, 40, 60, 100].map((reward, index) => (
                    <div
                      key={index}
                      className={`text-center p-2 rounded-lg text-xs ${
                        index + 1 === dayInCycle
                          ? 'bg-primary-500 text-white'
                          : index + 1 < dayInCycle
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-600/20 text-gray-400'
                      }`}
                    >
                      <div>第{index + 1}天</div>
                      <div className="font-bold">{reward}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 签到按钮 */}
              <button
                onClick={handleCheckin}
                disabled={isCheckinLoading}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {isCheckinLoading ? '签到中...' : `签到领取 ${nextReward} 万花币`}
              </button>

              {checkinResult && (
                <div className={`text-center text-sm ${
                  checkinResult.includes('成功') ? 'text-green-400' : 'text-red-400'
                }`}>
                  {checkinResult}
                </div>
              )}
            </div>
          )}

          {activeTab === 'invite' && (
            <div className="space-y-4">
              {/* 邀请码 */}
              <div className="bg-game-bg/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">我的邀请码</h3>
                <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3">
                  <div className="text-primary-400 font-mono text-xl font-bold">
                    {user.invite_code}
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="text-primary-400 hover:text-primary-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 邀请奖励说明 */}
              <div className="bg-game-bg/50 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">邀请奖励</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div>• 邀请好友注册：+30万花币</div>
                  <div>• 好友完成10关后发放奖励</div>
                  <div>• 无邀请数量限制</div>
                  <div>• 邀请越多，收益越高</div>
                </div>
              </div>

              {/* 邀请按钮 */}
              <button
                onClick={handleInviteFriend}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                </svg>
                <span>邀请好友</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}