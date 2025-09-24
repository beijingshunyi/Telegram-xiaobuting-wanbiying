export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ad_impressions: {
        Row: {
          action_type: string
          ad_id: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          ad_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          ad_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
      }
      ad_views: {
        Row: {
          ad_type: string
          completed: boolean | null
          created_at: string | null
          id: string
          reward_amount: number | null
          user_id: string
        }
        Insert: {
          ad_type: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          reward_amount?: number | null
          user_id: string
        }
        Update: {
          ad_type?: string
          completed?: boolean | null
          created_at?: string | null
          id?: string
          reward_amount?: number | null
          user_id?: string
        }
      }
      checkins: {
        Row: {
          checkin_date: string
          created_at: string | null
          day_in_cycle: number
          id: string
          reward_amount: number
          user_id: string
        }
        Insert: {
          checkin_date: string
          created_at?: string | null
          day_in_cycle: number
          id?: string
          reward_amount: number
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string | null
          day_in_cycle?: number
          id?: string
          reward_amount?: number
          user_id?: string
        }
      }
      custom_ads: {
        Row: {
          click_count: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          priority: number | null
          start_date: string | null
          target_url: string
          title: string
          updated_at: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          click_count?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          priority?: number | null
          start_date?: string | null
          target_url: string
          title: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          click_count?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          priority?: number | null
          start_date?: string | null
          target_url?: string
          title?: string
          updated_at?: string | null
          video_url?: string | null
          view_count?: number | null
        }
      }
      game_sessions: {
        Row: {
          completed_at: string | null
          duration: number
          id: string
          level: number
          moves_used: number
          score: number
          user_id: string
          wanhua_coins_earned: number
        }
        Insert: {
          completed_at?: string | null
          duration: number
          id?: string
          level: number
          moves_used: number
          score: number
          user_id: string
          wanhua_coins_earned: number
        }
        Update: {
          completed_at?: string | null
          duration?: number
          id?: string
          level?: number
          moves_used?: number
          score?: number
          user_id?: string
          wanhua_coins_earned?: number
        }
      }
      invitations: {
        Row: {
          created_at: string | null
          id: string
          invitee_id: string
          inviter_id: string
          is_rewarded: boolean | null
          reward_amount: number | null
          rewarded_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitee_id: string
          inviter_id: string
          is_rewarded?: boolean | null
          reward_amount?: number | null
          rewarded_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invitee_id?: string
          inviter_id?: string
          is_rewarded?: boolean | null
          reward_amount?: number | null
          rewarded_at?: string | null
        }
      }
      leaderboards: {
        Row: {
          created_at: string | null
          id: string
          period_start: string
          period_type: string
          ranking: number | null
          score: number
          user_id: string
          wanhua_coins: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          period_start: string
          period_type: string
          ranking?: number | null
          score: number
          user_id: string
          wanhua_coins: number
        }
        Update: {
          created_at?: string | null
          id?: string
          period_start?: string
          period_type?: string
          ranking?: number | null
          score?: number
          user_id?: string
          wanhua_coins?: number
        }
      }
      shares: {
        Row: {
          created_at: string | null
          id: string
          platform: string | null
          reward_amount: number | null
          share_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string | null
          reward_amount?: number | null
          share_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string | null
          reward_amount?: number | null
          share_type?: string
          user_id?: string
        }
      }
      system_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
      }
      users: {
        Row: {
          avatar_url: string | null
          checkin_streak: number | null
          created_at: string | null
          current_level: number | null
          extra_moves_count: number | null
          first_name: string | null
          games_played: number | null
          hammer_count: number | null
          highest_score: number | null
          hint_count: number | null
          id: string
          invite_code: string
          invited_by: string | null
          is_active: boolean | null
          is_banned: boolean | null
          last_checkin_date: string | null
          last_login_at: string | null
          last_name: string | null
          shuffle_count: number | null
          telegram_id: number
          total_checkins: number | null
          total_earned: number | null
          total_play_time: number | null
          total_withdrawn: number | null
          updated_at: string | null
          username: string | null
          wanhua_coins: number | null
        }
        Insert: {
          avatar_url?: string | null
          checkin_streak?: number | null
          created_at?: string | null
          current_level?: number | null
          extra_moves_count?: number | null
          first_name?: string | null
          games_played?: number | null
          hammer_count?: number | null
          highest_score?: number | null
          hint_count?: number | null
          id?: string
          invite_code: string
          invited_by?: string | null
          is_active?: boolean | null
          is_banned?: boolean | null
          last_checkin_date?: string | null
          last_login_at?: string | null
          last_name?: string | null
          shuffle_count?: number | null
          telegram_id: number
          total_checkins?: number | null
          total_earned?: number | null
          total_play_time?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          username?: string | null
          wanhua_coins?: number | null
        }
        Update: {
          avatar_url?: string | null
          checkin_streak?: number | null
          created_at?: string | null
          current_level?: number | null
          extra_moves_count?: number | null
          first_name?: string | null
          games_played?: number | null
          hammer_count?: number | null
          highest_score?: number | null
          hint_count?: number | null
          id?: string
          invite_code?: string
          invited_by?: string | null
          is_active?: boolean | null
          is_banned?: boolean | null
          last_checkin_date?: string | null
          last_login_at?: string | null
          last_name?: string | null
          shuffle_count?: number | null
          telegram_id?: number
          total_checkins?: number | null
          total_earned?: number | null
          total_play_time?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          username?: string | null
          wanhua_coins?: number | null
        }
      }
      withdrawal_requests: {
        Row: {
          account_info: Json
          admin_note: string | null
          amount: number
          created_at: string | null
          fee_amount: number
          id: string
          method: string
          net_amount: number
          processed_at: string | null
          processed_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          account_info: Json
          admin_note?: string | null
          amount: number
          created_at?: string | null
          fee_amount: number
          id?: string
          method: string
          net_amount: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          account_info?: Json
          admin_note?: string | null
          amount?: number
          created_at?: string | null
          fee_amount?: number
          id?: string
          method?: string
          net_amount?: number
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          user_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user: {
        Args: {
          p_telegram_id: number
          p_username?: string
          p_first_name?: string
          p_last_name?: string
          p_avatar_url?: string
          p_inviter_code?: string
        }
        Returns: string
      }
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_leaderboard: {
        Args: {
          p_user_id: string
          p_score: number
          p_coins: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 类型别名
export type User = Database['public']['Tables']['users']['Row']
export type GameSession = Database['public']['Tables']['game_sessions']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type WithdrawalRequest = Database['public']['Tables']['withdrawal_requests']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type Share = Database['public']['Tables']['shares']['Row']
export type AdView = Database['public']['Tables']['ad_views']['Row']
export type Checkin = Database['public']['Tables']['checkins']['Row']
export type Leaderboard = Database['public']['Tables']['leaderboards']['Row']
export type CustomAd = Database['public']['Tables']['custom_ads']['Row']
export type SystemConfig = Database['public']['Tables']['system_config']['Row']

// 插入类型
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type GameSessionInsert = Database['public']['Tables']['game_sessions']['Insert']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type WithdrawalRequestInsert = Database['public']['Tables']['withdrawal_requests']['Insert']

// 更新类型
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type WithdrawalRequestUpdate = Database['public']['Tables']['withdrawal_requests']['Update']

// 事务类型枚举
export enum TransactionType {
  EARN_GAME = 'earn_game',
  EARN_AD = 'earn_ad',
  EARN_CHECKIN = 'earn_checkin',
  EARN_INVITE = 'earn_invite',
  EARN_SHARE = 'earn_share',
  SPEND_POWERUP = 'spend_powerup',
  WITHDRAWAL = 'withdrawal'
}

// 提现状态枚举
export enum WithdrawalStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 提现方式枚举
export enum WithdrawalMethod {
  ALIPAY = 'alipay',
  TRC20_USDT = 'trc20_usdt'
}

// 广告类型枚举
export enum AdType {
  REWARDED = 'rewarded',
  INTERSTITIAL = 'interstitial',
  BANNER = 'banner'
}

// 排行榜周期枚举
export enum LeaderboardPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}