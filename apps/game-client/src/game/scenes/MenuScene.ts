import Phaser from 'phaser'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2
    const centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2

    // 背景
    this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x1a1a2e)

    // 游戏标题
    const title = this.add.text(centerX, centerY - 200, '消不停・万币赢', {
      fontSize: '36px',
      color: '#f97316',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    // 添加标题动画
    this.tweens.add({
      targets: title,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })

    // 副标题
    this.add.text(centerX, centerY - 150, '玩消除游戏赚真钱', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    // 开始游戏按钮
    const startButton = this.add.image(centerX, centerY - 50, 'button')
    const startText = this.add.text(centerX, centerY - 50, '开始游戏', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    startButton.setInteractive()
    startButton.on('pointerdown', () => {
      this.tweens.add({
        targets: [startButton, startText],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          this.scene.start('GameScene')
          this.scene.launch('UIScene')
        }
      })
    })

    // 规则说明按钮
    const rulesButton = this.add.image(centerX, centerY + 20, 'button')
    const rulesText = this.add.text(centerX, centerY + 20, '游戏规则', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    rulesButton.setInteractive()
    rulesButton.on('pointerdown', () => {
      this.showRules()
    })

    // 排行榜按钮
    const leaderboardButton = this.add.image(centerX, centerY + 90, 'button')
    const leaderboardText = this.add.text(centerX, centerY + 90, '排行榜', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    leaderboardButton.setInteractive()
    leaderboardButton.on('pointerdown', () => {
      this.showLeaderboard()
    })

    // 版权信息
    const copyrightY = this.cameras.main.height - 60
    this.add.text(centerX, copyrightY, '游戏由"北京修车【万花楼】"赞助开发', {
      fontSize: '12px',
      color: '#888888',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    this.add.text(centerX, copyrightY + 15, '由@bjxc010开发，合作联系@bjxc010', {
      fontSize: '12px',
      color: '#888888',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    const copyrightText = this.add.text(centerX, copyrightY + 30, '版权归属：北京修车【万花楼】和@bjxc010', {
      fontSize: '12px',
      color: '#888888',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    // 点击@bjxc010跳转
    copyrightText.setInteractive()
    copyrightText.on('pointerdown', () => {
      window.open('https://t.me/bjxc010', '_blank')
    })
  }

  private showRules() {
    const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2
    const centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2

    // 创建规则面板
    const rulesPanel = this.add.image(centerX, centerY, 'panel').setScale(1.2)
    const rulesTitle = this.add.text(centerX, centerY - 80, '游戏规则', {
      fontSize: '24px',
      color: '#f97316',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold'
    }).setOrigin(0.5)

    const rulesContent = `• 连接3个或更多相同水果可消除
• 消除水果获得万花币
• 4连消生成直线消除道具
• 5连消生成爆炸道具
• 观看广告获得道具
• 累积万花币可提现`

    const rulesText = this.add.text(centerX, centerY - 20, rulesContent, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      lineSpacing: 5,
      align: 'left'
    }).setOrigin(0.5)

    // 关闭按钮
    const closeButton = this.add.image(centerX, centerY + 70, 'button').setScale(0.8)
    const closeText = this.add.text(centerX, centerY + 70, '知道了', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    closeButton.setInteractive()
    closeButton.on('pointerdown', () => {
      rulesPanel.destroy()
      rulesTitle.destroy()
      rulesText.destroy()
      closeButton.destroy()
      closeText.destroy()
    })
  }

  private showLeaderboard() {
    // TODO: 实现排行榜功能
    console.log('显示排行榜')
  }
}