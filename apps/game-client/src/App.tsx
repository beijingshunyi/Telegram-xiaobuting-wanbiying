import React, { useEffect, useState } from 'react'
import Phaser from 'phaser'
import { GameConfig } from './game/GameConfig'
import { useUserStore } from './stores/userStore'
import { initTelegramWebApp, TelegramUtils } from './utils/telegram'
import { initializeAdMob } from './utils/admob'
import { gameManager } from './game/GameManager'
import LoginScreen from './components/LoginScreen'
import UserProfile from './components/UserProfile'
import SharePanel from './components/SharePanel'
import WithdrawalPanel from './components/WithdrawalPanel'
import PowerUpShop from './components/PowerUpShop'
import './index.css'

function App() {
  const [gameInstance, setGameInstance] = useState<Phaser.Game | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showWithdrawal, setShowWithdrawal] = useState(false)
  const [showShop, setShowShop] = useState(false)

  const {
    isLoggedIn,
    isLoading,
    loginWithTelegram,
    user,
    currentCoins,
    refreshUserData
  } = useUserStore()

  useEffect(() => {
    // 初始化Telegram WebApp
    initTelegramWebApp()

    // 初始化AdMob
    initializeAdMob()

    // 自动登录
    const attemptAutoLogin = async () => {
      try {
        // 获取邀请码参数
        const inviteCode = TelegramUtils.getStartParam()

        await loginWithTelegram(inviteCode || undefined)
      } catch (error) {
        console.error('自动登录失败:', error)
      }
    }

    if (!isLoggedIn && !isLoading) {
      attemptAutoLogin()
    }
  }, [isLoggedIn, isLoading, loginWithTelegram])

  useEffect(() => {
    // 用户登录后启动游戏
    if (isLoggedIn && !gameInstance) {
      startGame()
    }

    // 定期刷新用户数据
    if (isLoggedIn) {
      const interval = setInterval(() => {
        refreshUserData()
      }, 30000) // 30秒刷新一次

      return () => clearInterval(interval)
    }
  }, [isLoggedIn, gameInstance, refreshUserData])

  const startGame = () => {
    // 确保游戏容器存在
    const gameContainer = document.getElementById('game-container')
    if (!gameContainer) {
      const container = document.createElement('div')
      container.id = 'game-container'
      document.body.appendChild(container)
    }

    // 创建游戏实例
    const game = new Phaser.Game(GameConfig)
    setGameInstance(game)

    // 设置游戏事件监听
    setupGameEvents(game)
  }

  const setupGameEvents = (game: Phaser.Game) => {
    // 监听游戏场景事件
    game.events.on('ready', () => {
      console.log('游戏已启动')

      // 初始化游戏管理器
      const gameScene = game.scene.getScene('GameScene')
      const uiScene = game.scene.getScene('UIScene')

      if (gameScene && uiScene) {
        gameManager.initialize(gameScene, uiScene)
      }
    })
  }

  const handleShowProfile = () => {
    setShowProfile(true)
    TelegramUtils.hapticFeedback('light')
  }

  const handleShowShare = () => {
    setShowShare(true)
    TelegramUtils.hapticFeedback('light')
  }

  const handleShowWithdrawal = () => {
    if (currentCoins < 1000) {
      TelegramUtils.showAlert('万花币不足1000，无法提现')
      return
    }
    setShowWithdrawal(true)
    TelegramUtils.hapticFeedback('light')
  }

  // 如果未登录，显示登录界面
  if (!isLoggedIn) {
    return <LoginScreen />
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-game-bg to-game-card">
      {/* 游戏容器 */}
      <div id="game-container" className="absolute inset-0" />

      {/* 悬浮UI */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={handleShowProfile}
          className="flex items-center space-x-2 bg-game-card/80 backdrop-blur-sm rounded-lg px-3 py-2 text-white btn-click"
        >
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm">
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <div className="text-left">
            <div className="text-xs opacity-80">万花币</div>
            <div className="font-bold text-primary-400">{currentCoins}</div>
          </div>
        </button>
      </div>

      {/* 右上角功能按钮 */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={() => setShowShop(true)}
          className="bg-game-card/80 backdrop-blur-sm rounded-lg p-3 text-white btn-click"
          title="道具商店"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 2L3 7v11a2 2 0 002 2h4v-6h4v6h4a2 2 0 002-2V7l-7-5z" clipRule="evenodd"/>
          </svg>
        </button>

        <button
          onClick={handleShowShare}
          className="bg-game-card/80 backdrop-blur-sm rounded-lg p-3 text-white btn-click"
          title="分享游戏"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
          </svg>
        </button>

        <button
          onClick={handleShowWithdrawal}
          className="bg-game-card/80 backdrop-blur-sm rounded-lg p-3 text-white btn-click"
          title="提现"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>

      {/* 底部导航栏 */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="bg-game-card/90 backdrop-blur-sm border-t border-primary-500/20 px-4 py-2">
          <div className="flex justify-between items-center text-white text-sm">
            <div className="text-center">
              <div className="opacity-80">关卡</div>
              <div className="font-bold text-primary-400">{user?.current_level || 1}</div>
            </div>

            <div className="text-center">
              <div className="opacity-80">最高分</div>
              <div className="font-bold text-primary-400">{user?.highest_score || 0}</div>
            </div>

            <div className="text-center">
              <div className="opacity-80">游戏次数</div>
              <div className="font-bold text-primary-400">{user?.games_played || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 模态窗口 */}
      {showProfile && (
        <UserProfile
          user={user!}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showShare && (
        <SharePanel
          user={user!}
          onClose={() => setShowShare(false)}
        />
      )}

      {showWithdrawal && (
        <WithdrawalPanel
          user={user!}
          currentCoins={currentCoins}
          onClose={() => setShowWithdrawal(false)}
        />
      )}

      {showShop && (
        <PowerUpShop
          user={user!}
          onClose={() => setShowShop(false)}
          onPowerUpPurchased={() => {
            refreshUserData()
          }}
        />
      )}

      {/* 版权信息 */}
      <div className="absolute bottom-16 left-0 right-0 z-0 text-center text-xs text-gray-500 px-4">
        <div>游戏由"北京修车【万花楼】"赞助开发</div>
        <div className="mt-1">
          由
          <button
            onClick={() => TelegramUtils.openTelegramContact('@bjxc010')}
            className="text-primary-400 mx-1 underline"
          >
            @bjxc010
          </button>
          开发，合作联系
          <button
            onClick={() => TelegramUtils.openTelegramContact('@bjxc010')}
            className="text-primary-400 mx-1 underline"
          >
            @bjxc010
          </button>
        </div>
        <div className="mt-1">版权归属：北京修车【万花楼】和@bjxc010</div>
      </div>
    </div>
  )
}

export default App