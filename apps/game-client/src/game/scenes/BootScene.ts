import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text
  private progressBar!: Phaser.GameObjects.Graphics
  private progressBox!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    this.createLoadingScreen()
    this.loadAssets()
    this.setLoadingEvents()
  }

  private createLoadingScreen() {
    const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2
    const centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2

    // Loading text
    this.loadingText = this.add.text(centerX, centerY - 50, '加载中...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5)

    // Progress bar background
    this.progressBox = this.add.graphics()
    this.progressBox.fillStyle(0x222222)
    this.progressBox.fillRoundedRect(centerX - 150, centerY, 300, 30, 15)

    // Progress bar
    this.progressBar = this.add.graphics()
  }

  private loadAssets() {
    // 创建简单的彩色方块作为水果
    this.createFruitTextures()

    // 创建道具纹理
    this.createPowerUpTextures()

    // 创建UI纹理
    this.createUITextures()
  }

  private createFruitTextures() {
    const fruits = [
      { key: 'fruit0', color: 0xff6b6b }, // 红色
      { key: 'fruit1', color: 0x4ecdc4 }, // 青色
      { key: 'fruit2', color: 0x45b7d1 }, // 蓝色
      { key: 'fruit3', color: 0x96ceb4 }, // 绿色
      { key: 'fruit4', color: 0xfeca57 }, // 黄色
      { key: 'fruit5', color: 0xff9ff3 }, // 粉色
    ]

    fruits.forEach(fruit => {
      const graphics = this.add.graphics()
      graphics.fillStyle(fruit.color)
      graphics.fillRoundedRect(0, 0, 60, 60, 10)

      // 添加渐变效果
      graphics.fillStyle(0xffffff, 0.3)
      graphics.fillRoundedRect(5, 5, 50, 25, 5)

      graphics.generateTexture(fruit.key, 60, 60)
      graphics.destroy()
    })

    // 特殊效果水果
    const specialGraphics = this.add.graphics()
    specialGraphics.fillStyle(0xffd700)
    specialGraphics.fillRoundedRect(0, 0, 60, 60, 10)
    specialGraphics.lineStyle(3, 0xffffff)
    specialGraphics.strokeRoundedRect(0, 0, 60, 60, 10)
    specialGraphics.generateTexture('special_fruit', 60, 60)
    specialGraphics.destroy()
  }

  private createPowerUpTextures() {
    // 锤子道具
    const hammerGraphics = this.add.graphics()
    hammerGraphics.fillStyle(0x8b4513)
    hammerGraphics.fillRect(20, 10, 20, 40)
    hammerGraphics.fillStyle(0x696969)
    hammerGraphics.fillRect(15, 5, 30, 15)
    hammerGraphics.generateTexture('hammer', 60, 60)
    hammerGraphics.destroy()

    // 洗牌道具
    const shuffleGraphics = this.add.graphics()
    shuffleGraphics.fillStyle(0x4169e1)
    shuffleGraphics.fillRoundedRect(10, 15, 40, 30, 5)
    shuffleGraphics.fillStyle(0xffffff)
    shuffleGraphics.fillCircle(20, 25, 3)
    shuffleGraphics.fillCircle(30, 35, 3)
    shuffleGraphics.fillCircle(40, 25, 3)
    shuffleGraphics.generateTexture('shuffle', 60, 60)
    shuffleGraphics.destroy()
  }

  private createUITextures() {
    // 按钮背景
    const buttonGraphics = this.add.graphics()
    buttonGraphics.fillGradientStyle(0xf97316, 0xf97316, 0xea580c, 0xea580c)
    buttonGraphics.fillRoundedRect(0, 0, 120, 40, 20)
    buttonGraphics.generateTexture('button', 120, 40)
    buttonGraphics.destroy()

    // 面板背景
    const panelGraphics = this.add.graphics()
    panelGraphics.fillStyle(0x16213e, 0.9)
    panelGraphics.fillRoundedRect(0, 0, 300, 200, 15)
    panelGraphics.lineStyle(2, 0xf97316)
    panelGraphics.strokeRoundedRect(0, 0, 300, 200, 15)
    panelGraphics.generateTexture('panel', 300, 200)
    panelGraphics.destroy()
  }

  private setLoadingEvents() {
    this.load.on('progress', (value: number) => {
      const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2
      const centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2

      this.progressBar.clear()
      this.progressBar.fillStyle(0xf97316)
      this.progressBar.fillRoundedRect(centerX - 140, centerY + 5, (280 * value), 20, 10)

      const percentage = Math.round(value * 100)
      this.loadingText.setText(`加载中... ${percentage}%`)
    })

    this.load.on('complete', () => {
      this.time.delayedCall(500, () => {
        // 隐藏HTML加载屏幕
        const loadingElement = document.getElementById('loading')
        if (loadingElement) {
          loadingElement.style.display = 'none'
        }

        this.scene.start('MenuScene')
      })
    })
  }
}