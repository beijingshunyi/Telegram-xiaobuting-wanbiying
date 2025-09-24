import Phaser from 'phaser'
import { GAME_CONFIG } from '../../../packages/config/constants'

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text
  private movesText!: Phaser.GameObjects.Text
  private coinsText!: Phaser.GameObjects.Text
  private powerUpButtons: { [key: string]: Phaser.GameObjects.Image } = {}

  constructor() {
    super({ key: 'UIScene' })
  }

  create() {
    this.createTopUI()
    this.createPowerUps()
    this.setupEventListeners()
  }

  private createTopUI() {
    const topBarHeight = 100
    const padding = 20

    // 顶部背景
    this.add.rectangle(this.cameras.main.width / 2, topBarHeight / 2, this.cameras.main.width, topBarHeight, 0x16213e, 0.9)

    // 分数显示
    this.add.text(padding, 20, '分数', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    })
    this.scoreText = this.add.text(padding, 40, '0', {
      fontSize: '20px',
      color: '#f97316',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    })

    // 步数显示
    const centerX = this.cameras.main.width / 2
    this.add.text(centerX, 20, '剩余步数', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5, 0)
    this.movesText = this.add.text(centerX, 40, '30', {
      fontSize: '20px',
      color: '#4ecdc4',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0)

    // 万花币显示
    const rightX = this.cameras.main.width - padding
    this.add.text(rightX, 20, '万花币', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(1, 0)
    this.coinsText = this.add.text(rightX, 40, '0', {
      fontSize: '20px',
      color: '#ffd700',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(1, 0)
  }

  private createPowerUps() {
    const bottomY = this.cameras.main.height - 80
    const powerUps = Object.values(GAME_CONFIG.POWER_UPS)
    const totalWidth = powerUps.length * 80 - 20
    const startX = (this.cameras.main.width - totalWidth) / 2

    powerUps.forEach((powerUp, index) => {
      const x = startX + index * 80 + 40

      // 道具背景
      const bg = this.add.circle(x, bottomY, 25, 0x16213e, 0.8)
      bg.setStrokeStyle(2, 0xf97316)

      // 道具图标
      const button = this.add.image(x, bottomY, powerUp.id).setScale(0.6)
      button.setInteractive()

      // 价格文字
      this.add.text(x, bottomY + 35, `${powerUp.cost}币`, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }).setOrigin(0.5)

      button.on('pointerdown', () => {
        this.onPowerUpClick(powerUp.id)
      })

      this.powerUpButtons[powerUp.id] = button
    })

    // 返回菜单按钮
    const menuButton = this.add.image(30, 30, 'button').setScale(0.6)
    const menuText = this.add.text(30, 30, '菜单', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    menuButton.setInteractive()
    menuButton.on('pointerdown', () => {
      this.showPauseMenu()
    })
  }

  private setupEventListeners() {
    const gameScene = this.scene.get('GameScene')

    // 监听游戏场景事件
    gameScene.events.on('updateScore', (score: number) => {
      this.scoreText.setText(score.toString())
    })

    gameScene.events.on('updateMoves', (moves: number) => {
      this.movesText.setText(moves.toString())
      if (moves <= 5) {
        this.movesText.setColor('#ff6b6b') // 红色警告
      } else {
        this.movesText.setColor('#4ecdc4')
      }
    })

    gameScene.events.on('updateCoins', (coins: number) => {
      this.coinsText.setText(coins.toString())

      // 万花币增加动画
      this.tweens.add({
        targets: this.coinsText,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Power2'
      })
    })

    // 监听游戏结束事件
    this.events.on('showGameOver', (data: { score: number, coins: number }) => {
      this.showGameOverDialog(data)
    })
  }

  private onPowerUpClick(powerUpId: string) {
    const powerUp = GAME_CONFIG.POWER_UPS[powerUpId as keyof typeof GAME_CONFIG.POWER_UPS]
    if (!powerUp) return

    // 检查是否有足够的万花币
    const currentCoins = parseInt(this.coinsText.text)
    if (currentCoins < powerUp.cost) {
      this.showInsufficientCoinsDialog()
      return
    }

    // 扣除万花币
    const newCoins = currentCoins - powerUp.cost
    this.coinsText.setText(newCoins.toString())

    // 使用道具
    const gameScene = this.scene.get('GameScene') as any
    gameScene.usePowerUp(powerUpId)

    // 道具使用动画
    const button = this.powerUpButtons[powerUpId]
    this.tweens.add({
      targets: button,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    })
  }

  private showInsufficientCoinsDialog() {
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    // 对话框背景
    const dialogBg = this.add.rectangle(centerX, centerY, 280, 200, 0x16213e, 0.95)
    dialogBg.setStrokeStyle(2, 0xf97316)

    // 标题
    const title = this.add.text(centerX, centerY - 60, '万花币不足', {
      fontSize: '20px',
      color: '#f97316',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // 内容
    const content = this.add.text(centerX, centerY - 20, '您的万花币不足以购买此道具\n可以通过以下方式获得万花币：\n• 消除更多水果\n• 观看广告\n• 完成每日任务', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      lineSpacing: 5,
      align: 'center'
    }).setOrigin(0.5)

    // 关闭按钮
    const closeButton = this.add.image(centerX, centerY + 60, 'button').setScale(0.8)
    const closeText = this.add.text(centerX, centerY + 60, '知道了', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    closeButton.setInteractive()
    closeButton.on('pointerdown', () => {
      dialogBg.destroy()
      title.destroy()
      content.destroy()
      closeButton.destroy()
      closeText.destroy()
    })
  }

  private showPauseMenu() {
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    // 暂停游戏
    this.scene.pause('GameScene')

    // 半透明遮罩
    const mask = this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5)

    // 菜单面板
    const menuPanel = this.add.image(centerX, centerY, 'panel')

    // 标题
    const title = this.add.text(centerX, centerY - 70, '游戏暂停', {
      fontSize: '24px',
      color: '#f97316',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // 继续游戏按钮
    const continueButton = this.add.image(centerX, centerY - 20, 'button')
    const continueText = this.add.text(centerX, centerY - 20, '继续游戏', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    continueButton.setInteractive()
    continueButton.on('pointerdown', () => {
      mask.destroy()
      menuPanel.destroy()
      title.destroy()
      continueButton.destroy()
      continueText.destroy()
      restartButton.destroy()
      restartText.destroy()
      mainMenuButton.destroy()
      mainMenuText.destroy()

      this.scene.resume('GameScene')
    })

    // 重新开始按钮
    const restartButton = this.add.image(centerX, centerY + 20, 'button')
    const restartText = this.add.text(centerX, centerY + 20, '重新开始', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    restartButton.setInteractive()
    restartButton.on('pointerdown', () => {
      mask.destroy()
      menuPanel.destroy()
      title.destroy()
      continueButton.destroy()
      continueText.destroy()
      restartButton.destroy()
      restartText.destroy()
      mainMenuButton.destroy()
      mainMenuText.destroy()

      const gameScene = this.scene.get('GameScene') as any
      gameScene.restartGame()
    })

    // 主菜单按钮
    const mainMenuButton = this.add.image(centerX, centerY + 60, 'button')
    const mainMenuText = this.add.text(centerX, centerY + 60, '主菜单', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    mainMenuButton.setInteractive()
    mainMenuButton.on('pointerdown', () => {
      this.scene.stop('GameScene')
      this.scene.stop('UIScene')
      this.scene.start('MenuScene')
    })
  }

  private showGameOverDialog(data: { score: number, coins: number }) {
    const centerX = this.cameras.main.width / 2
    const centerY = this.cameras.main.height / 2

    // 半透明遮罩
    const mask = this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)

    // 游戏结束面板
    const gameOverPanel = this.add.image(centerX, centerY, 'panel').setScale(1.2)

    // 标题
    const title = this.add.text(centerX, centerY - 80, '游戏结束', {
      fontSize: '28px',
      color: '#ff6b6b',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // 结果显示
    const resultText = `最终分数: ${data.score}\n获得万花币: ${data.coins}\n\n恭喜您！获得的万花币已添加到账户`

    const result = this.add.text(centerX, centerY - 20, resultText, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      lineSpacing: 8,
      align: 'center'
    }).setOrigin(0.5)

    // 重新开始按钮
    const restartButton = this.add.image(centerX - 60, centerY + 60, 'button').setScale(0.9)
    const restartText = this.add.text(centerX - 60, centerY + 60, '再来一局', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    restartButton.setInteractive()
    restartButton.on('pointerdown', () => {
      mask.destroy()
      gameOverPanel.destroy()
      title.destroy()
      result.destroy()
      restartButton.destroy()
      restartText.destroy()
      mainMenuButton.destroy()
      mainMenuText.destroy()

      const gameScene = this.scene.get('GameScene') as any
      gameScene.restartGame()
    })

    // 主菜单按钮
    const mainMenuButton = this.add.image(centerX + 60, centerY + 60, 'button').setScale(0.9)
    const mainMenuText = this.add.text(centerX + 60, centerY + 60, '主菜单', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    mainMenuButton.setInteractive()
    mainMenuButton.on('pointerdown', () => {
      this.scene.stop('GameScene')
      this.scene.stop('UIScene')
      this.scene.start('MenuScene')
    })
  }
}