import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '../../../packages/database/client'
import { User } from '../../../packages/database/types'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
}

interface UserState {
  // 用户状态
  user: User | null
  telegramUser: TelegramUser | null
  isLoggedIn: boolean
  isLoading: boolean

  // 游戏状态
  currentCoins: number
  currentLevel: number
  currentScore: number

  // 动作
  loginWithTelegram: (inviteCode?: string) => Promise<void>
  logout: () => void
  updateCoins: (amount: number) => void
  updateLevel: (level: number) => void
  updateScore: (score: number) => void
  refreshUserData: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      telegramUser: null,
      isLoggedIn: false,
      isLoading: false,
      currentCoins: 0,
      currentLevel: 1,
      currentScore: 0,

      // Telegram登录
      loginWithTelegram: async (inviteCode?: string) => {
        set({ isLoading: true })

        try {
          // 从Telegram WebApp获取用户信息
          const tgUser = getTelegramUser()
          if (!tgUser) {
            throw new Error('无法获取Telegram用户信息')
          }

          set({ telegramUser: tgUser })

          // 查找或创建用户
          let { data: existingUser } = await db.getUserByTelegramId(tgUser.id)

          if (!existingUser) {
            // 创建新用户
            const { data: newUserId, error } = await db.createUser({
              telegram_id: tgUser.id,
              username: tgUser.username,
              first_name: tgUser.first_name,
              last_name: tgUser.last_name,
              avatar_url: tgUser.photo_url,
              inviter_code: inviteCode
            })

            if (error) {
              throw new Error('创建用户失败：' + error.message)
            }

            // 重新获取用户数据
            const { data: userData } = await db.getUserByTelegramId(tgUser.id)
            existingUser = userData
          } else {
            // 更新最后登录时间
            await db.updateUser(existingUser.id, {
              last_login_at: new Date().toISOString()
            })
          }

          if (existingUser) {
            set({
              user: existingUser,
              isLoggedIn: true,
              currentCoins: existingUser.wanhua_coins || 0,
              currentLevel: existingUser.current_level || 1,
              currentScore: existingUser.highest_score || 0
            })

            // 发送登录成功事件
            if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
            }
          }

        } catch (error) {
          console.error('登录失败:', error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // 登出
      logout: () => {
        set({
          user: null,
          telegramUser: null,
          isLoggedIn: false,
          currentCoins: 0,
          currentLevel: 1,
          currentScore: 0
        })
      },

      // 更新万花币
      updateCoins: (amount: number) => {
        const { user, currentCoins } = get()
        const newCoins = Math.max(0, currentCoins + amount)

        set({ currentCoins: newCoins })

        // 同步到数据库
        if (user) {
          db.updateUser(user.id, { wanhua_coins: newCoins })
        }
      },

      // 更新关卡
      updateLevel: (level: number) => {
        const { user, currentLevel } = get()
        if (level > currentLevel) {
          set({ currentLevel: level })

          // 同步到数据库
          if (user) {
            db.updateUser(user.id, { current_level: level })
          }
        }
      },

      // 更新分数
      updateScore: (score: number) => {
        const { user, currentScore } = get()
        if (score > currentScore) {
          set({ currentScore: score })

          // 同步到数据库
          if (user) {
            db.updateUser(user.id, { highest_score: score })
          }
        }
      },

      // 刷新用户数据
      refreshUserData: async () => {
        const { telegramUser } = get()
        if (!telegramUser) return

        try {
          const { data: userData } = await db.getUserByTelegramId(telegramUser.id)
          if (userData) {
            set({
              user: userData,
              currentCoins: userData.wanhua_coins || 0,
              currentLevel: userData.current_level || 1,
              currentScore: userData.highest_score || 0
            })
          }
        } catch (error) {
          console.error('刷新用户数据失败:', error)
        }
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        telegramUser: state.telegramUser,
        isLoggedIn: state.isLoggedIn,
        currentCoins: state.currentCoins,
        currentLevel: state.currentLevel,
        currentScore: state.currentScore
      })
    }
  )
)

// 获取Telegram用户信息
function getTelegramUser(): TelegramUser | null {
  if (typeof window === 'undefined') return null

  const tg = (window as any).Telegram?.WebApp
  if (!tg || !tg.initDataUnsafe?.user) {
    // 开发环境的模拟数据
    if (process.env.NODE_ENV === 'development') {
      return {
        id: 12345678,
        first_name: '测试用户',
        last_name: '',
        username: 'testuser'
      }
    }
    return null
  }

  const user = tg.initDataUnsafe.user
  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    photo_url: user.photo_url
  }
}

// Telegram WebApp API扩展
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initDataUnsafe: {
          user?: TelegramUser
          start_param?: string
        }
        ready: () => void
        expand: () => void
        close: () => void
        disableVerticalSwipes: () => void
        enableClosingConfirmation: () => void
        disableClosingConfirmation: () => void
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        showPopup: (params: {
          title?: string
          message: string
          buttons?: Array<{
            id?: string
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'
            text: string
          }>
        }) => void
        showAlert: (message: string) => void
        showConfirm: (message: string) => Promise<boolean>
        openTelegramLink: (url: string) => void
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void
        shareToStory: (mediaUrl: string, params?: any) => void
      }
    }
  }
}