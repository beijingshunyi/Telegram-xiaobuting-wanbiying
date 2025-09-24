import Phaser from 'phaser'
import { GAME_CONFIG } from '../../../packages/config/constants'

interface GridTile {
  sprite: Phaser.GameObjects.Image
  type: number
  row: number
  col: number
  isEmpty: boolean
}

export class GameScene extends Phaser.Scene {
  private grid: GridTile[][] = []
  private readonly TILE_SIZE = 60
  private readonly GRID_START_X = 50
  private readonly GRID_START_Y = 150
  private selectedTile: GridTile | null = null
  private isProcessing = false
  private score = 0
  private moves = 30
  private wanhuaCoins = 0
  private comboCount = 0

  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    this.createBackground()
    this.createGrid()
    this.fillInitialGrid()

    // 确保初始网格有可消除的组合
    while (!this.hasValidMoves()) {
      this.shuffleGrid()
    }

    this.setupInput()

    // 注册场景事件
    this.events.on('updateUI', this.updateUI, this)
  }

  private createBackground() {
    const centerX = this.cameras.main.worldView.x + this.cameras.main.width / 2
    const centerY = this.cameras.main.worldView.y + this.cameras.main.height / 2
    this.add.rectangle(centerX, centerY, this.cameras.main.width, this.cameras.main.height, 0x1a1a2e)
  }

  private createGrid() {
    for (let row = 0; row < GAME_CONFIG.GRID_ROWS; row++) {
      this.grid[row] = []
      for (let col = 0; col < GAME_CONFIG.GRID_COLS; col++) {
        const x = this.GRID_START_X + col * this.TILE_SIZE + this.TILE_SIZE / 2
        const y = this.GRID_START_Y + row * this.TILE_SIZE + this.TILE_SIZE / 2

        // 创建空的网格位置
        this.grid[row][col] = {
          sprite: this.add.image(x, y, 'fruit0').setVisible(false),
          type: -1,
          row,
          col,
          isEmpty: true
        }
      }
    }
  }

  private fillInitialGrid() {
    for (let row = 0; row < GAME_CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < GAME_CONFIG.GRID_COLS; col++) {
        let type: number
        do {
          type = Phaser.Math.Between(0, GAME_CONFIG.FRUIT_TYPES - 1)
        } while (this.wouldCreateMatch(row, col, type))

        this.setTileType(row, col, type)
      }
    }
  }

  private wouldCreateMatch(row: number, col: number, type: number): boolean {
    // 检查水平方向
    let horizontalCount = 1

    // 向左检查
    for (let c = col - 1; c >= 0 && this.grid[row][c].type === type; c--) {
      horizontalCount++
    }

    // 向右检查
    for (let c = col + 1; c < GAME_CONFIG.GRID_COLS && this.grid[row][c].type === type; c++) {
      horizontalCount++
    }

    if (horizontalCount >= GAME_CONFIG.MIN_MATCH) return true

    // 检查垂直方向
    let verticalCount = 1

    // 向上检查
    for (let r = row - 1; r >= 0 && this.grid[r][col].type === type; r--) {
      verticalCount++
    }

    // 向下检查
    for (let r = row + 1; r < GAME_CONFIG.GRID_ROWS && this.grid[r][col].type === type; r++) {
      verticalCount++
    }

    return verticalCount >= GAME_CONFIG.MIN_MATCH
  }

  private setTileType(row: number, col: number, type: number) {
    const tile = this.grid[row][col]
    tile.type = type
    tile.isEmpty = false
    tile.sprite.setTexture(`fruit${type}`)
    tile.sprite.setVisible(true)
  }

  private setupInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isProcessing) return

      const { row, col } = this.getGridPosition(pointer.x, pointer.y)
      if (row === -1 || col === -1) return

      const clickedTile = this.grid[row][col]
      if (clickedTile.isEmpty) return

      if (!this.selectedTile) {
        this.selectTile(clickedTile)
      } else if (this.selectedTile === clickedTile) {
        this.deselectTile()
      } else if (this.areAdjacent(this.selectedTile, clickedTile)) {
        this.swapTiles(this.selectedTile, clickedTile)
      } else {
        this.deselectTile()
        this.selectTile(clickedTile)
      }
    })
  }

  private getGridPosition(x: number, y: number): { row: number, col: number } {
    const col = Math.floor((x - this.GRID_START_X) / this.TILE_SIZE)
    const row = Math.floor((y - this.GRID_START_Y) / this.TILE_SIZE)

    if (row >= 0 && row < GAME_CONFIG.GRID_ROWS && col >= 0 && col < GAME_CONFIG.GRID_COLS) {
      return { row, col }
    }

    return { row: -1, col: -1 }
  }

  private selectTile(tile: GridTile) {
    this.selectedTile = tile
    tile.sprite.setTint(0xffff00) // 黄色高亮
    tile.sprite.setScale(1.1)
  }

  private deselectTile() {
    if (this.selectedTile) {
      this.selectedTile.sprite.clearTint()
      this.selectedTile.sprite.setScale(1)
      this.selectedTile = null
    }
  }

  private areAdjacent(tile1: GridTile, tile2: GridTile): boolean {
    const rowDiff = Math.abs(tile1.row - tile2.row)
    const colDiff = Math.abs(tile1.col - tile2.col)
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
  }

  private async swapTiles(tile1: GridTile, tile2: GridTile) {
    this.isProcessing = true

    // 交换类型
    const tempType = tile1.type
    tile1.type = tile2.type
    tile2.type = tempType

    // 交换纹理
    tile1.sprite.setTexture(`fruit${tile1.type}`)
    tile2.sprite.setTexture(`fruit${tile2.type}`)

    // 检查是否有匹配
    const matches = this.findMatches()

    if (matches.length > 0) {
      this.deselectTile()
      this.moves--
      this.comboCount = 0
      await this.processMatches()
    } else {
      // 没有匹配，撤回交换
      const tempType2 = tile1.type
      tile1.type = tile2.type
      tile2.type = tempType2
      tile1.sprite.setTexture(`fruit${tile1.type}`)
      tile2.sprite.setTexture(`fruit${tile2.type}`)
      this.deselectTile()
    }

    this.updateUI()
    this.isProcessing = false

    // 检查游戏结束条件
    if (this.moves <= 0) {
      this.gameOver()
    }
  }

  private findMatches(): GridTile[] {
    const matches: GridTile[] = []
    const visited: boolean[][] = Array(GAME_CONFIG.GRID_ROWS).fill(null).map(() => Array(GAME_CONFIG.GRID_COLS).fill(false))

    for (let row = 0; row < GAME_CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < GAME_CONFIG.GRID_COLS; col++) {
        if (!visited[row][col] && !this.grid[row][col].isEmpty) {
          const matchGroup = this.findMatchGroup(row, col, visited)
          if (matchGroup.length >= GAME_CONFIG.MIN_MATCH) {
            matches.push(...matchGroup)
          }
        }
      }
    }

    return matches
  }

  private findMatchGroup(startRow: number, startCol: number, visited: boolean[]): GridTile[] {
    const type = this.grid[startRow][startCol].type
    const matches: GridTile[] = []

    // 水平匹配检查
    const horizontalMatches = [this.grid[startRow][startCol]]

    // 向左检查
    for (let col = startCol - 1; col >= 0 && this.grid[startRow][col].type === type && !this.grid[startRow][col].isEmpty; col--) {
      horizontalMatches.unshift(this.grid[startRow][col])
    }

    // 向右检查
    for (let col = startCol + 1; col < GAME_CONFIG.GRID_COLS && this.grid[startRow][col].type === type && !this.grid[startRow][col].isEmpty; col++) {
      horizontalMatches.push(this.grid[startRow][col])
    }

    if (horizontalMatches.length >= GAME_CONFIG.MIN_MATCH) {
      matches.push(...horizontalMatches)
      horizontalMatches.forEach(tile => visited[tile.row][tile.col] = true)
    }

    // 垂直匹配检查
    const verticalMatches = [this.grid[startRow][startCol]]

    // 向上检查
    for (let row = startRow - 1; row >= 0 && this.grid[row][startCol].type === type && !this.grid[row][startCol].isEmpty; row--) {
      verticalMatches.unshift(this.grid[row][startCol])
    }

    // 向下检查
    for (let row = startRow + 1; row < GAME_CONFIG.GRID_ROWS && this.grid[row][startCol].type === type && !this.grid[row][startCol].isEmpty; row++) {
      verticalMatches.push(this.grid[row][startCol])
    }

    if (verticalMatches.length >= GAME_CONFIG.MIN_MATCH) {
      matches.push(...verticalMatches)
      verticalMatches.forEach(tile => visited[tile.row][tile.col] = true)
    }

    return matches
  }

  private async processMatches() {
    let hasMatches = true

    while (hasMatches) {
      const matches = this.findMatches()
      hasMatches = matches.length > 0

      if (hasMatches) {
        this.comboCount++

        // 计算得分和万花币
        this.calculateRewards(matches)

        // 消除动画
        await this.animateDestroy(matches)

        // 清除匹配的方块
        matches.forEach(tile => {
          tile.isEmpty = true
          tile.type = -1
          tile.sprite.setVisible(false)
        })

        // 下落动画
        await this.dropTiles()

        // 填充新方块
        this.fillEmptyTiles()
      }
    }

    // 检查是否有可用移动
    if (!this.hasValidMoves()) {
      await this.shuffleGrid()
    }
  }

  private calculateRewards(matches: GridTile[]) {
    let baseCoins = 0
    const matchCount = matches.length

    if (matchCount >= 5) {
      baseCoins = GAME_CONFIG.WANHUA_COIN_RATES.FIVE_MATCH
    } else if (matchCount >= 4) {
      baseCoins = GAME_CONFIG.WANHUA_COIN_RATES.FOUR_MATCH
    } else {
      baseCoins = GAME_CONFIG.WANHUA_COIN_RATES.THREE_MATCH
    }

    // 连击奖励
    const comboMultiplier = this.comboCount < GAME_CONFIG.WANHUA_COIN_RATES.COMBO_BONUS.length
      ? GAME_CONFIG.WANHUA_COIN_RATES.COMBO_BONUS[this.comboCount]
      : 1.0

    const totalCoins = Math.floor(baseCoins * (1 + comboMultiplier))
    this.wanhuaCoins += totalCoins

    // 计算分数
    const baseScore = matchCount >= 5 ? GAME_CONFIG.BASE_SCORE.FIVE_MATCH :
                     matchCount >= 4 ? GAME_CONFIG.BASE_SCORE.FOUR_MATCH :
                     GAME_CONFIG.BASE_SCORE.THREE_MATCH

    this.score += Math.floor(baseScore * (1 + comboMultiplier))
  }

  private async animateDestroy(matches: GridTile[]): Promise<void> {
    return new Promise((resolve) => {
      const tweens = matches.map(tile => {
        return this.tweens.add({
          targets: tile.sprite,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 200,
          ease: 'Power2'
        })
      })

      // 等待所有动画完成
      let completed = 0
      tweens.forEach(tween => {
        tween.on('complete', () => {
          completed++
          if (completed === tweens.length) {
            resolve()
          }
        })
      })
    })
  }

  private async dropTiles(): Promise<void> {
    const dropPromises: Promise<void>[] = []

    for (let col = 0; col < GAME_CONFIG.GRID_COLS; col++) {
      let writeIndex = GAME_CONFIG.GRID_ROWS - 1

      // 从底部开始向上扫描
      for (let row = GAME_CONFIG.GRID_ROWS - 1; row >= 0; row--) {
        if (!this.grid[row][col].isEmpty) {
          if (row !== writeIndex) {
            // 需要下落
            const tile = this.grid[row][col]
            const targetTile = this.grid[writeIndex][col]

            // 移动数据
            targetTile.type = tile.type
            targetTile.isEmpty = false
            targetTile.sprite.setTexture(`fruit${tile.type}`)
            targetTile.sprite.setVisible(true)

            // 清空原位置
            tile.type = -1
            tile.isEmpty = true
            tile.sprite.setVisible(false)

            // 添加下落动画
            const startY = this.GRID_START_Y + row * this.TILE_SIZE + this.TILE_SIZE / 2
            const endY = this.GRID_START_Y + writeIndex * this.TILE_SIZE + this.TILE_SIZE / 2

            if (startY !== endY) {
              targetTile.sprite.setPosition(targetTile.sprite.x, startY)

              dropPromises.push(new Promise((resolve) => {
                this.tweens.add({
                  targets: targetTile.sprite,
                  y: endY,
                  duration: 300,
                  ease: 'Bounce.easeOut',
                  onComplete: () => resolve()
                })
              }))
            }
          }
          writeIndex--
        }
      }
    }

    await Promise.all(dropPromises)
  }

  private fillEmptyTiles() {
    for (let col = 0; col < GAME_CONFIG.GRID_COLS; col++) {
      for (let row = 0; row < GAME_CONFIG.GRID_ROWS; row++) {
        if (this.grid[row][col].isEmpty) {
          const type = Phaser.Math.Between(0, GAME_CONFIG.FRUIT_TYPES - 1)
          this.setTileType(row, col, type)

          // 添加出现动画
          const tile = this.grid[row][col]
          tile.sprite.setAlpha(0)
          tile.sprite.setScale(0)

          this.tweens.add({
            targets: tile.sprite,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.easeOut'
          })
        }
      }
    }
  }

  private hasValidMoves(): boolean {
    for (let row = 0; row < GAME_CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < GAME_CONFIG.GRID_COLS; col++) {
        if (this.checkValidMovesForTile(row, col)) {
          return true
        }
      }
    }
    return false
  }

  private checkValidMovesForTile(row: number, col: number): boolean {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ]

    for (const [dr, dc] of directions) {
      const newRow = row + dr
      const newCol = col + dc

      if (newRow >= 0 && newRow < GAME_CONFIG.GRID_ROWS &&
          newCol >= 0 && newCol < GAME_CONFIG.GRID_COLS) {

        // 临时交换
        const tempType = this.grid[row][col].type
        this.grid[row][col].type = this.grid[newRow][newCol].type
        this.grid[newRow][newCol].type = tempType

        // 检查是否有匹配
        const hasMatch = this.wouldCreateMatch(row, col, this.grid[row][col].type) ||
                        this.wouldCreateMatch(newRow, newCol, this.grid[newRow][newCol].type)

        // 恢复交换
        this.grid[newRow][newCol].type = this.grid[row][col].type
        this.grid[row][col].type = tempType

        if (hasMatch) {
          return true
        }
      }
    }

    return false
  }

  private async shuffleGrid() {
    // 洗牌动画
    const allTiles = this.grid.flat().filter(tile => !tile.isEmpty)

    // 隐藏所有方块
    allTiles.forEach(tile => {
      this.tweens.add({
        targets: tile.sprite,
        alpha: 0,
        duration: 200
      })
    })

    // 等待隐藏完成
    await new Promise(resolve => this.time.delayedCall(200, resolve))

    // 重新生成网格
    this.fillInitialGrid()

    // 显示动画
    allTiles.forEach(tile => {
      tile.sprite.setAlpha(0)
      this.tweens.add({
        targets: tile.sprite,
        alpha: 1,
        duration: 200
      })
    })
  }

  private updateUI() {
    this.events.emit('updateScore', this.score)
    this.events.emit('updateMoves', this.moves)
    this.events.emit('updateCoins', this.wanhuaCoins)
  }

  private gameOver() {
    this.isProcessing = true
    this.scene.pause()
    this.scene.get('UIScene').events.emit('showGameOver', {
      score: this.score,
      coins: this.wanhuaCoins
    })
  }

  // 公共方法，供UI调用
  public usePowerUp(type: string) {
    switch (type) {
      case 'shuffle':
        this.shuffleGrid()
        break
      case 'extra_moves':
        this.moves += 5
        this.updateUI()
        break
    }
  }

  public restartGame() {
    this.score = 0
    this.moves = 30
    this.wanhuaCoins = 0
    this.comboCount = 0
    this.selectedTile = null
    this.isProcessing = false

    this.fillInitialGrid()
    this.updateUI()
    this.scene.resume()
  }
}