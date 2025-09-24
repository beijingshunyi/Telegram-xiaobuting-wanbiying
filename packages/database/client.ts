import { createClient } from '@supabase/supabase-js'
import { Database } from './types'
import { SUPABASE_CONFIG } from '../config/constants'

// 创建Supabase客户端
export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
)

// 管理员客户端（服务器端使用）
export const supabaseAdmin = createClient<Database>(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 数据库操作类
export class DatabaseService {
  private client = supabase

  constructor(useAdmin = false) {
    if (useAdmin) {
      this.client = supabaseAdmin
    }
  }

  // 用户相关操作
  async getUserByTelegramId(telegramId: number) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single()

    return { data, error }
  }

  async createUser(userData: {
    telegram_id: number
    username?: string
    first_name?: string
    last_name?: string
    avatar_url?: string
    inviter_code?: string
  }) {
    const { data, error } = await this.client.rpc('create_user', {
      p_telegram_id: userData.telegram_id,
      p_username: userData.username,
      p_first_name: userData.first_name,
      p_last_name: userData.last_name,
      p_avatar_url: userData.avatar_url,
      p_inviter_code: userData.inviter_code
    })

    return { data, error }
  }

  async updateUser(userId: string, updates: any) {
    const { data, error } = await this.client
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  }

  // 游戏会话相关
  async saveGameSession(sessionData: {
    user_id: string
    level: number
    score: number
    moves_used: number
    wanhua_coins_earned: number
    duration: number
  }) {
    const { data, error } = await this.client
      .from('game_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (!error && data) {
      // 更新用户统计
      await this.updateUserStats(sessionData.user_id, {
        highest_score: sessionData.score,
        wanhua_coins_earned: sessionData.wanhua_coins_earned,
        play_time: sessionData.duration
      })

      // 更新排行榜
      await this.client.rpc('update_leaderboard', {
        p_user_id: sessionData.user_id,
        p_score: sessionData.score,
        p_coins: sessionData.wanhua_coins_earned
      })
    }

    return { data, error }
  }

  // 交易相关
  async addTransaction(transactionData: {
    user_id: string
    type: string
    amount: number
    description?: string
    metadata?: any
  }) {
    const { data, error } = await this.client
      .from('transactions')
      .insert(transactionData)
      .select()
      .single()

    if (!error && data) {
      // 更新用户万花币余额
      await this.updateUserCoins(transactionData.user_id, transactionData.amount)
    }

    return { data, error }
  }

  async getUserTransactions(userId: string, limit = 50) {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return { data, error }
  }

  // 提现相关
  async createWithdrawalRequest(requestData: {
    user_id: string
    amount: number
    method: string
    account_info: any
  }) {
    const feeRate = 0.03 // 3% 手续费
    const feeAmount = Math.floor(requestData.amount * feeRate)
    const netAmount = (requestData.amount - feeAmount) / 100 // 转换为实际货币单位

    const { data, error } = await this.client
      .from('withdrawal_requests')
      .insert({
        ...requestData,
        fee_amount: feeAmount,
        net_amount: netAmount
      })
      .select()
      .single()

    if (!error && data) {
      // 扣除用户万花币（包括手续费）
      await this.updateUserCoins(requestData.user_id, -requestData.amount)

      // 添加提现交易记录
      await this.addTransaction({
        user_id: requestData.user_id,
        type: 'withdrawal',
        amount: -requestData.amount,
        description: `提现申请 - ${requestData.method}`,
        metadata: { withdrawal_id: data.id }
      })
    }

    return { data, error }
  }

  async getWithdrawalRequests(userId?: string, status?: string) {
    let query = this.client.from('withdrawal_requests').select(`
      *,
      users:user_id (
        telegram_id,
        username,
        first_name,
        last_name
      )
    `)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    return { data, error }
  }

  // 签到相关
  async dailyCheckin(userId: string) {
    const today = new Date().toISOString().split('T')[0]

    // 检查今天是否已签到
    const { data: existingCheckin } = await this.client
      .from('checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', today)
      .single()

    if (existingCheckin) {
      return { data: null, error: new Error('今日已签到') }
    }

    // 获取用户信息
    const { data: user } = await this.client
      .from('users')
      .select('checkin_streak, last_checkin_date')
      .eq('id', userId)
      .single()

    if (!user) {
      return { data: null, error: new Error('用户不存在') }
    }

    // 计算签到天数和奖励
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newStreak = 1
    if (user.last_checkin_date === yesterdayStr) {
      newStreak = (user.checkin_streak || 0) + 1
    }

    const dayInCycle = ((newStreak - 1) % 7) + 1
    const rewards = [5, 10, 15, 25, 40, 60, 100]
    const rewardAmount = rewards[dayInCycle - 1]

    // 创建签到记录
    const { data, error } = await this.client
      .from('checkins')
      .insert({
        user_id: userId,
        checkin_date: today,
        day_in_cycle: dayInCycle,
        reward_amount: rewardAmount
      })
      .select()
      .single()

    if (!error && data) {
      // 更新用户签到状态
      await this.updateUser(userId, {
        checkin_streak: newStreak,
        last_checkin_date: today,
        total_checkins: (user.checkin_streak || 0) + 1
      })

      // 添加签到奖励
      await this.addTransaction({
        user_id: userId,
        type: 'earn_checkin',
        amount: rewardAmount,
        description: `每日签到第${dayInCycle}天奖励`
      })
    }

    return { data: data ? { ...data, reward_amount: rewardAmount } : null, error }
  }

  // 排行榜相关
  async getLeaderboard(period: 'daily' | 'weekly' | 'monthly', limit = 50) {
    let periodStart: string

    const now = new Date()
    if (period === 'daily') {
      periodStart = now.toISOString().split('T')[0]
    } else if (period === 'weekly') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      periodStart = weekStart.toISOString().split('T')[0]
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      periodStart = monthStart.toISOString().split('T')[0]
    }

    const { data, error } = await this.client
      .from('leaderboards')
      .select(`
        *,
        users:user_id (
          username,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('period_type', period)
      .eq('period_start', periodStart)
      .order('score', { ascending: false })
      .limit(limit)

    return { data, error }
  }

  // 邀请相关
  async processInviteReward(inviterId: string, inviteeId: string) {
    const rewardAmount = 30

    // 检查被邀请用户是否完成了10关
    const { data: sessions } = await this.client
      .from('game_sessions')
      .select('level')
      .eq('user_id', inviteeId)
      .gte('level', 10)
      .limit(1)

    if (!sessions || sessions.length === 0) {
      return { data: null, error: new Error('被邀请用户尚未完成10关') }
    }

    // 检查是否已经奖励过
    const { data: existingInvite } = await this.client
      .from('invitations')
      .select('*')
      .eq('inviter_id', inviterId)
      .eq('invitee_id', inviteeId)
      .eq('is_rewarded', true)
      .single()

    if (existingInvite) {
      return { data: null, error: new Error('邀请奖励已发放') }
    }

    // 发放邀请奖励
    await this.addTransaction({
      user_id: inviterId,
      type: 'earn_invite',
      amount: rewardAmount,
      description: '邀请好友奖励'
    })

    // 更新邀请记录
    const { data, error } = await this.client
      .from('invitations')
      .update({
        is_rewarded: true,
        rewarded_at: new Date().toISOString()
      })
      .eq('inviter_id', inviterId)
      .eq('invitee_id', inviteeId)
      .select()
      .single()

    return { data, error }
  }

  // 广告相关
  async recordAdView(userId: string, adType: 'rewarded' | 'interstitial' | 'banner', completed = true) {
    let rewardAmount = 0

    if (completed && adType === 'rewarded') {
      // 检查今日观看次数
      const today = new Date().toISOString().split('T')[0]
      const { count } = await this.client
        .from('ad_views')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('ad_type', 'rewarded')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)

      const viewCount = count || 0
      if (viewCount < 3) {
        rewardAmount = 15 // 前3次
      } else if (viewCount < 10) {
        rewardAmount = 10 // 后续
      } else {
        rewardAmount = 0 // 达到每日上限
      }
    }

    const { data, error } = await this.client
      .from('ad_views')
      .insert({
        user_id: userId,
        ad_type: adType,
        completed,
        reward_amount: rewardAmount
      })
      .select()
      .single()

    if (!error && rewardAmount > 0) {
      await this.addTransaction({
        user_id: userId,
        type: 'earn_ad',
        amount: rewardAmount,
        description: `观看${adType === 'rewarded' ? '激励' : '插屏'}广告奖励`
      })
    }

    return { data: data ? { ...data, reward_amount: rewardAmount } : null, error }
  }

  // 分享相关
  async recordShare(userId: string, shareType: 'private' | 'group') {
    // 检查今日分享次数
    const today = new Date().toISOString().split('T')[0]
    const { count } = await this.client
      .from('shares')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)

    const shareCount = count || 0
    if (shareCount >= 6) {
      return { data: null, error: new Error('今日分享次数已达上限') }
    }

    const rewardAmount = 5
    const { data, error } = await this.client
      .from('shares')
      .insert({
        user_id: userId,
        share_type: shareType,
        reward_amount: rewardAmount
      })
      .select()
      .single()

    if (!error && data) {
      await this.addTransaction({
        user_id: userId,
        type: 'earn_share',
        amount: rewardAmount,
        description: `分享到${shareType === 'private' ? '私聊' : '群组'}奖励`
      })
    }

    return { data, error }
  }

  // 私有方法
  private async updateUserStats(userId: string, stats: {
    highest_score?: number
    wanhua_coins_earned?: number
    play_time?: number
  }) {
    const updates: any = {}

    if (stats.highest_score !== undefined) {
      const { data: user } = await this.client
        .from('users')
        .select('highest_score, games_played, total_play_time, total_earned')
        .eq('id', userId)
        .single()

      if (user) {
        updates.games_played = (user.games_played || 0) + 1
        updates.total_play_time = (user.total_play_time || 0) + (stats.play_time || 0)
        updates.total_earned = (user.total_earned || 0) + (stats.wanhua_coins_earned || 0)

        if (stats.highest_score > (user.highest_score || 0)) {
          updates.highest_score = stats.highest_score
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await this.updateUser(userId, updates)
    }
  }

  private async updateUserCoins(userId: string, amount: number) {
    const { data: user } = await this.client
      .from('users')
      .select('wanhua_coins')
      .eq('id', userId)
      .single()

    if (user) {
      const newBalance = Math.max(0, (user.wanhua_coins || 0) + amount)
      await this.updateUser(userId, { wanhua_coins: newBalance })
    }
  }
}

export const db = new DatabaseService()
export const adminDb = new DatabaseService(true)