import { SHARE_TEMPLATES, COPYRIGHT_INFO } from '../../../packages/config/constants'

export class TelegramUtils {
  // 检查是否在Telegram环境中
  static isInTelegram(): boolean {
    return !!(window as any).Telegram?.WebApp
  }

  // 获取启动参数（邀请码）
  static getStartParam(): string | null {
    if (!this.isInTelegram()) return null

    const tg = (window as any).Telegram.WebApp
    return tg.initDataUnsafe?.start_param || null
  }

  // 显示Telegram原生弹窗
  static showAlert(message: string): void {
    if (this.isInTelegram()) {
      (window as any).Telegram.WebApp.showAlert(message)
    } else {
      alert(message)
    }
  }

  // 显示确认对话框
  static async showConfirm(message: string): Promise<boolean> {
    if (this.isInTelegram()) {
      return new Promise((resolve) => {
        (window as any).Telegram.WebApp.showPopup({
          title: '确认',
          message,
          buttons: [
            { type: 'cancel', text: '取消' },
            { type: 'ok', text: '确定' }
          ]
        }, (buttonId: string) => {
          resolve(buttonId === 'ok')
        })
      })
    } else {
      return confirm(message)
    }
  }

  // 触觉反馈
  static hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
    if (this.isInTelegram()) {
      (window as any).Telegram.WebApp.HapticFeedback.impactOccurred(style)
    }
  }

  // 通知反馈
  static notificationFeedback(type: 'success' | 'warning' | 'error'): void {
    if (this.isInTelegram()) {
      (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred(type)
    }
  }

  // 生成分享链接
  static generateShareLink(inviteCode: string, botUsername = 'XBTyxbot'): string {
    return `https://t.me/${botUsername}?start=${inviteCode}`
  }

  // 生成分享内容
  static generateShareContent(
    templateType: 'private' | 'group',
    variables: {
      username?: string
      userCode: string
      level?: number
      coins?: number
      ranking?: number
    }
  ): string {
    const templates = templateType === 'private'
      ? SHARE_TEMPLATES.PRIVATE
      : SHARE_TEMPLATES.GROUP

    // 随机选择一个模板
    const template = templates[Math.floor(Math.random() * templates.length)]

    // 替换变量
    return template
      .replace(/\{username\}/g, variables.username || '玩家')
      .replace(/\{userCode\}/g, variables.userCode)
      .replace(/\{level\}/g, String(variables.level || 1))
      .replace(/\{coins\}/g, String(variables.coins || 0))
      .replace(/\{ranking\}/g, String(variables.ranking || '未上榜'))
  }

  // 分享到Telegram
  static shareToTelegram(
    content: string,
    shareType: 'private' | 'group' = 'private'
  ): void {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(this.generateShareLink('SHARE'))}&text=${encodeURIComponent(content)}`

    if (this.isInTelegram()) {
      (window as any).Telegram.WebApp.openTelegramLink(shareUrl)
    } else {
      window.open(shareUrl, '_blank')
    }
  }

  // 打开Telegram联系人
  static openTelegramContact(username: string): void {
    const url = `https://t.me/${username.replace('@', '')}`

    if (this.isInTelegram()) {
      (window as any).Telegram.WebApp.openTelegramLink(url)
    } else {
      window.open(url, '_blank')
    }
  }

  // 关闭WebApp
  static close(): void {
    if (this.isInTelegram()) {
      (window as any).Telegram.WebApp.close()
    } else {
      window.close()
    }
  }

  // 展开WebApp
  static expand(): void {
    if (this.isInTelegram()) {
      (window as any).Telegram.WebApp.expand()
    }
  }

  // 启用关闭确认
  static enableClosingConfirmation(): void {
    if (this.isInTelegram()) {
      (window as any).Telegram.WebApp.enableClosingConfirmation()
    }
  }

  // 禁用关闭确认
  static disableClosingConfirmation(): void {
    if (this.isInTelegram()) {
      (window as any).Telegram.WebApp.disableClosingConfirmation()
    }
  }

  // 设置主按钮
  static setMainButton(params: {
    text: string
    color?: string
    textColor?: string
    isActive?: boolean
    onClick?: () => void
  }): void {
    if (!this.isInTelegram()) return

    const tg = (window as any).Telegram.WebApp
    const mainButton = tg.MainButton

    mainButton.text = params.text
    if (params.color) mainButton.color = params.color
    if (params.textColor) mainButton.textColor = params.textColor

    if (params.isActive !== false) {
      mainButton.show()
    } else {
      mainButton.hide()
    }

    if (params.onClick) {
      mainButton.onClick(params.onClick)
    }
  }

  // 隐藏主按钮
  static hideMainButton(): void {
    if (this.isInTelegram()) {
      (window as any).Telegram.WebApp.MainButton.hide()
    }
  }
}

// 分享管理器
export class ShareManager {
  private static instance: ShareManager
  private shareCount: { [key: string]: number } = {}

  static getInstance(): ShareManager {
    if (!ShareManager.instance) {
      ShareManager.instance = new ShareManager()
    }
    return ShareManager.instance
  }

  // 检查今日分享次数
  checkDailyShareLimit(userId: string): boolean {
    const today = new Date().toISOString().split('T')[0]
    const key = `${userId}_${today}`
    return (this.shareCount[key] || 0) < 6
  }

  // 记录分享
  recordShare(userId: string): void {
    const today = new Date().toISOString().split('T')[0]
    const key = `${userId}_${today}`
    this.shareCount[key] = (this.shareCount[key] || 0) + 1
  }

  // 获取今日分享次数
  getTodayShareCount(userId: string): number {
    const today = new Date().toISOString().split('T')[0]
    const key = `${userId}_${today}`
    return this.shareCount[key] || 0
  }

  // 执行分享
  async executeShare(
    shareType: 'private' | 'group',
    userInfo: {
      id: string
      username?: string
      inviteCode: string
      level?: number
      coins?: number
    }
  ): Promise<{ success: boolean; message: string }> {
    // 检查分享次数限制
    if (!this.checkDailyShareLimit(userInfo.id)) {
      return { success: false, message: '今日分享次数已达上限（6次）' }
    }

    try {
      // 生成分享内容
      const shareContent = TelegramUtils.generateShareContent(shareType, {
        username: userInfo.username,
        userCode: userInfo.inviteCode,
        level: userInfo.level,
        coins: userInfo.coins
      })

      // 执行分享
      TelegramUtils.shareToTelegram(shareContent, shareType)

      // 记录分享（这里应该在分享成功后调用）
      this.recordShare(userInfo.id)

      // 触觉反馈
      TelegramUtils.hapticFeedback('light')

      return { success: true, message: '分享成功！获得5万花币奖励' }

    } catch (error) {
      console.error('分享失败:', error)
      return { success: false, message: '分享失败，请重试' }
    }
  }
}

// 邀请管理器
export class InviteManager {
  // 生成邀请链接
  static generateInviteLink(inviteCode: string): string {
    return TelegramUtils.generateShareLink(inviteCode)
  }

  // 生成邀请二维码（如果需要）
  static generateQRCode(inviteCode: string): string {
    const link = this.generateInviteLink(inviteCode)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`
  }

  // 发送邀请
  static sendInvite(inviteCode: string, username?: string): void {
    const inviteContent = `🎮 ${username || '我'} 邀请你一起玩"消不停・万币赢"！

🎯 这是一个可以赚真钱的消除游戏
💰 玩游戏就能获得万花币，可以提现
🎁 使用我的邀请码有额外奖励

邀请码：${inviteCode}

点击链接开始游戏：
${this.generateInviteLink(inviteCode)}

${COPYRIGHT_INFO.sponsor}出品 | ${COPYRIGHT_INFO.developer}开发`

    TelegramUtils.shareToTelegram(inviteContent, 'private')
  }
}

// 初始化Telegram WebApp
export function initTelegramWebApp(): void {
  if (TelegramUtils.isInTelegram()) {
    const tg = (window as any).Telegram.WebApp

    // 准备就绪
    tg.ready()

    // 展开应用
    tg.expand()

    // 禁用垂直滑动
    tg.disableVerticalSwipes()

    // 启用关闭确认
    tg.enableClosingConfirmation()

    console.log('Telegram WebApp 初始化完成')
  }
}