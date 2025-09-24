import Phaser from 'phaser'
import { useUserStore } from '../stores/userStore'
import { db } from '../../../packages/database/client'
import { adMobManager } from '../utils/admob'
import { TelegramUtils } from '../utils/telegram'

export class GameManager {
  private static instance: GameManager
  private gameScene: Phaser.Scene | null = null
  private uiScene: Phaser.Scene | null = null
  private currentSessionStartTime: number = 0

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager()
    }
    return GameManager.instance
  }

  initialize(gameScene: Phaser.Scene, uiScene: Phaser.Scene) {
    this.gameScene = gameScene
    this.uiScene = uiScene
    this.currentSessionStartTime = Date.now()

    // 显示横幅广告
    setTimeout(() => {
      adMobManager.showBannerAd()
    }, 5000)
  }

  async onGameComplete(gameData: {
    level: number
    score: number
    movesUsed: number
    wanhuaCoinsEarned: number
  }) {
    const duration = Math.floor((Date.now() - this.currentSessionStartTime) / 1000)
    const userState = useUserStore.getState()

    if (userState.user) {
      try {
        // 保存游戏会话
        await db.saveGameSession({
          user_id: userState.user.id,
          level: gameData.level,
          score: gameData.score,
          moves_used: gameData.movesUsed,
          wanhua_coins_earned: gameData.wanhuaCoinsEarned,
          duration
        })

        // 更新用户状态
        userState.updateCoins(gameData.wanhuaCoinsEarned)
        userState.updateLevel(gameData.level)
        userState.updateScore(gameData.score)

        // 检查邀请奖励
        await this.checkInviteRewards(userState.user.id, gameData.level)

        // 显示插屏广告（每5关一次）
        if (gameData.level % 5 === 0) {
          setTimeout(() => {
            adMobManager.showInterstitialAd()
          }, 2000)
        }

        console.log('Game session saved successfully')

      } catch (error) {
        console.error('Failed to save game session:', error)
      }
    }
  }

  async onGameFailed() {
    // 提供复活选项
    const reviveOffered = await this.offerRevive()
    if (!reviveOffered) {
      // 显示插屏广告
      setTimeout(() => {
        adMobManager.showInterstitialAd()
      }, 1000)
    }
  }

  private async offerRevive(): Promise<boolean> {
    try {
      const confirmed = await TelegramUtils.showConfirm(
        '游戏失败！观看广告可以复活并继续游戏，是否观看？'
      )

      if (!confirmed) return false

      const result = await adMobManager.showRewardedVideoAd()
      if (result.success) {
        // 复活游戏
        this.reviveGame()
        TelegramUtils.showAlert('复活成功！继续加油！')
        return true
      }

      return false
    } catch (error) {
      console.error('Revive offer failed:', error)
      return false
    }
  }

  private reviveGame() {
    if (this.gameScene && this.uiScene) {
      // 重置游戏状态（添加5步数）
      (this.gameScene as any).addMoves(5)

      // 恢复游戏
      this.gameScene.scene.resume()
      TelegramUtils.hapticFeedback('medium')
    }
  }

  async usePowerUp(powerUpId: string, userId: string): Promise<boolean> {
    try {
      // 检查用户是否有该道具
      const userState = useUserStore.getState()
      if (!userState.user) return false

      const columnMap: { [key: string]: keyof typeof userState.user } = {
        hammer: 'hammer_count',
        shuffle: 'shuffle_count',
        extra_moves: 'extra_moves_count',
        hint: 'hint_count'
      }

      const column = columnMap[powerUpId]
      if (!column) return false

      const currentCount = (userState.user as any)[column] || 0
      if (currentCount <= 0) {
        TelegramUtils.showAlert('道具数量不足')
        return false
      }

      // 扣除道具数量
      const updateData: any = {}
      updateData[column] = currentCount - 1

      await db.updateUser(userId, updateData)

      // 更新本地状态
      await userState.refreshUserData()

      TelegramUtils.hapticFeedback('light')
      return true

    } catch (error) {
      console.error('Failed to use power up:', error)
      TelegramUtils.showAlert('道具使用失败')
      return false
    }
  }

  private async checkInviteRewards(userId: string, currentLevel: number) {
    // 如果用户完成了第10关，检查邀请奖励
    if (currentLevel === 10) {
      try {
        // 这里应该检查是否有邀请者需要奖励
        // 简化实现，实际应查询invitations表
        console.log('User completed level 10, checking invite rewards...')
      } catch (error) {
        console.error('Failed to check invite rewards:', error)
      }
    }
  }

  onGamePause() {
    // 游戏暂停时的处理
    adMobManager.hideBannerAd()
  }

  onGameResume() {
    // 游戏恢复时的处理
    adMobManager.showBannerAd()
  }

  onGameExit() {
    // 游戏退出时的清理
    adMobManager.dispose()
    this.currentSessionStartTime = 0
  }

  // 获取用户道具数量
  getUserPowerUpCount(powerUpId: string): number {
    const userState = useUserStore.getState()
    if (!userState.user) return 0

    const columnMap: { [key: string]: keyof typeof userState.user } = {
      hammer: 'hammer_count',
      shuffle: 'shuffle_count',
      extra_moves: 'extra_moves_count',
      hint: 'hint_count'
    }

    const column = columnMap[powerUpId]
    if (!column) return 0

    return (userState.user as any)[column] || 0
  }

  // 检查是否可以使用道具
  canUsePowerUp(powerUpId: string): boolean {
    return this.getUserPowerUpCount(powerUpId) > 0
  }
}

export const gameManager = GameManager.getInstance()