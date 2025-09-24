import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'
import { UIScene } from './scenes/UIScene'

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: Math.min(window.innerWidth, 414),
  height: Math.min(window.innerHeight, 896),
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: Math.min(window.innerWidth, 414),
    height: Math.min(window.innerHeight, 896),
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MenuScene, GameScene, UIScene],
  dom: {
    createContainer: true
  },
  input: {
    touch: {
      capture: true
    }
  },
  audio: {
    disableWebAudio: false
  },
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true,
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR'
  }
}