import { ADMOB_CONFIG } from '../../../packages/config/constants'
import { db } from '../../../packages/database/client'
import { useUserStore } from '../stores/userStore'
import { TelegramUtils } from './telegram'

// AdMob广告类型
export enum AdType {
  BANNER = 'banner',
  INTERSTITIAL = 'interstitial',
  REWARDED = 'rewarded'
}

// 广告状态
export enum AdStatus {
  NOT_LOADED = 'not_loaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  SHOWING = 'showing',
  FAILED = 'failed'
}

// 广告配置
interface AdConfig {
  adUnitId: string
  autoShow?: boolean
  showInterval?: number
}

export class AdMobManager {
  private static instance: AdMobManager
  private isInitialized = false
  private adStatus: { [key: string]: AdStatus } = {}
  private lastInterstitialShow = 0
  private rewardedVideoQueue: Array<{ resolve: Function, reject: Function }> = []

  // AdMob配置
  private adConfigs: { [key: string]: AdConfig } = {
    [AdType.BANNER]: {
      adUnitId: ADMOB_CONFIG.bannerAdId
    },
    [AdType.INTERSTITIAL]: {
      adUnitId: 'ca-app-pub-3940256099942544/1033173712', // 测试ID，生产环境需替换
      showInterval: 90000 // 90秒间隔
    },
    [AdType.REWARDED]: {
      adUnitId: ADMOB_CONFIG.rewardedAdId
    }
  }

  static getInstance(): AdMobManager {
    if (!AdMobManager.instance) {
      AdMobManager.instance = new AdMobManager()
    }
    return AdMobManager.instance
  }

  // 初始化AdMob
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // 检查AdMob SDK是否加载
      if (typeof (window as any).adsbygoogle === 'undefined') {
        console.warn('AdMob SDK not loaded, using fallback ads')
        return false
      }

      // 初始化所有广告类型
      await this.initializeAds()

      this.isInitialized = true
      console.log('AdMob initialized successfully')
      return true

    } catch (error) {
      console.error('AdMob initialization failed:', error)
      return false
    }
  }

  // 初始化广告
  private async initializeAds(): Promise<void> {
    const promises = Object.keys(this.adConfigs).map(adType =>
      this.loadAd(adType as AdType)
    )

    await Promise.allSettled(promises)
  }

  // 加载广告
  private async loadAd(adType: AdType): Promise<void> {
    if (this.adStatus[adType] === AdStatus.LOADING || this.adStatus[adType] === AdStatus.LOADED) {
      return
    }

    this.adStatus[adType] = AdStatus.LOADING

    try {
      const config = this.adConfigs[adType]

      switch (adType) {
        case AdType.BANNER:
          await this.loadBannerAd(config)
          break
        case AdType.INTERSTITIAL:
          await this.loadInterstitialAd(config)
          break
        case AdType.REWARDED:
          await this.loadRewardedAd(config)
          break
      }

      this.adStatus[adType] = AdStatus.LOADED

    } catch (error) {
      console.error(`Failed to load ${adType} ad:`, error)
      this.adStatus[adType] = AdStatus.FAILED

      // 重试机制
      setTimeout(() => {
        this.loadAd(adType)
      }, 30000)
    }
  }

  // 加载横幅广告
  private async loadBannerAd(config: AdConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 创建横幅广告容器
        let bannerContainer = document.getElementById('banner-ad-container')
        if (!bannerContainer) {
          bannerContainer = document.createElement('div')
          bannerContainer.id = 'banner-ad-container'
          bannerContainer.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            text-align: center;
            z-index: 1000;
            background: rgba(0,0,0,0.8);
          `
          document.body.appendChild(bannerContainer)
        }

        // 创建广告元素
        const adElement = document.createElement('ins')
        adElement.className = 'adsbygoogle'
        adElement.style.cssText = 'display: block; width: 320px; height: 50px; margin: 0 auto;'
        adElement.setAttribute('data-ad-client', 'ca-pub-6402806742664594')
        adElement.setAttribute('data-ad-slot', config.adUnitId.split('/')[1])

        bannerContainer.innerHTML = ''
        bannerContainer.appendChild(adElement)

        // 推送广告
        ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})

        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  // 加载插屏广告
  private async loadInterstitialAd(config: AdConfig): Promise<void> {
    // 插屏广告通常需要原生实现，这里使用模拟
    return new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
  }

  // 加载激励视频广告
  private async loadRewardedAd(config: AdConfig): Promise<void> {
    // 激励视频广告通常需要原生实现，这里使用模拟
    return new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
  }

  // 显示横幅广告
  showBannerAd(): void {
    const container = document.getElementById('banner-ad-container')
    if (container) {
      container.style.display = 'block'
    } else {
      this.loadAd(AdType.BANNER)
    }
  }

  // 隐藏横幅广告
  hideBannerAd(): void {
    const container = document.getElementById('banner-ad-container')
    if (container) {
      container.style.display = 'none'
    }
  }

  // 显示插屏广告
  async showInterstitialAd(): Promise<boolean> {
    // 检查间隔时间
    const now = Date.now()
    if (now - this.lastInterstitialShow < (this.adConfigs[AdType.INTERSTITIAL].showInterval || 90000)) {
      console.log('Interstitial ad cooldown active')
      return false
    }

    try {
      if (this.adStatus[AdType.INTERSTITIAL] !== AdStatus.LOADED) {
        await this.loadAd(AdType.INTERSTITIAL)
      }

      // 模拟插屏广告显示
      await this.showSimulatedInterstitial()

      this.lastInterstitialShow = now
      this.adStatus[AdType.INTERSTITIAL] = AdStatus.NOT_LOADED

      // 重新加载
      setTimeout(() => {
        this.loadAd(AdType.INTERSTITIAL)
      }, 1000)

      return true

    } catch (error) {
      console.error('Failed to show interstitial ad:', error)
      return false
    }
  }

  // 显示激励视频广告
  async showRewardedVideoAd(): Promise<{ success: boolean, reward?: number }> {
    try {
      if (this.adStatus[AdType.REWARDED] !== AdStatus.LOADED) {
        await this.loadAd(AdType.REWARDED)
      }

      // 显示模拟的激励视频
      const reward = await this.showSimulatedRewardedVideo()

      this.adStatus[AdType.REWARDED] = AdStatus.NOT_LOADED

      // 重新加载
      setTimeout(() => {
        this.loadAd(AdType.REWARDED)
      }, 1000)

      return { success: true, reward }

    } catch (error) {
      console.error('Failed to show rewarded video ad:', error)
      return { success: false }
    }
  }

  // 模拟插屏广告
  private async showSimulatedInterstitial(): Promise<void> {
    return new Promise((resolve) => {
      // 创建模拟广告界面
      const adOverlay = document.createElement('div')
      adOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        flex-direction: column;
        color: white;
        font-family: Arial, sans-serif;
      `

      adOverlay.innerHTML = `
        <div style="text-align: center; max-width: 300px;">
          <div style="font-size: 20px; margin-bottom: 20px;">📱 广告</div>
          <div style="background: #333; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <div>这是一个模拟插屏广告</div>
            <div style="font-size: 14px; opacity: 0.7; margin-top: 10px;">3秒后可关闭</div>
          </div>
          <button id="close-ad-btn" style="
            background: #ff4444;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            opacity: 0.5;
            pointer-events: none;
          " disabled>关闭广告</button>
        </div>
      `

      document.body.appendChild(adOverlay)

      // 3秒后允许关闭
      setTimeout(() => {
        const closeBtn = document.getElementById('close-ad-btn')
        if (closeBtn) {
          closeBtn.style.opacity = '1'
          closeBtn.style.pointerEvents = 'auto'
          closeBtn.removeAttribute('disabled')
          closeBtn.onclick = () => {
            document.body.removeChild(adOverlay)
            resolve()
          }
        }
      }, 3000)

      // 记录广告查看
      this.recordAdView(AdType.INTERSTITIAL, true, 0)
    })
  }

  // 模拟激励视频广告
  private async showSimulatedRewardedVideo(): Promise<number> {
    return new Promise((resolve, reject) => {
      // 创建模拟广告界面
      const adOverlay = document.createElement('div')
      adOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        flex-direction: column;
        color: white;
        font-family: Arial, sans-serif;
      `

      let countdown = 15
      const reward = this.calculateRewardAmount()

      adOverlay.innerHTML = `
        <div style="text-align: center; max-width: 300px;">
          <div style="font-size: 20px; margin-bottom: 20px;">🎥 激励视频</div>
          <div style="background: #333; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <div>观看完整视频获得奖励</div>
            <div style="font-size: 24px; color: #ffd700; margin: 10px 0;">${reward} 万花币</div>
            <div id="countdown" style="font-size: 18px; color: #00ff00;">${countdown}秒</div>
          </div>
          <div style="display: flex; gap: 10px;">
            <button id="skip-ad-btn" style="
              background: #666;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
            ">跳过</button>
            <button id="complete-ad-btn" style="
              background: #00aa00;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              opacity: 0.5;
              pointer-events: none;
            " disabled>领取奖励</button>
          </div>
        </div>
      `

      document.body.appendChild(adOverlay)

      // 倒计时
      const countdownInterval = setInterval(() => {
        countdown--
        const countdownEl = document.getElementById('countdown')
        if (countdownEl) {
          countdownEl.textContent = `${countdown}秒`
        }

        if (countdown <= 0) {
          clearInterval(countdownInterval)
          const completeBtn = document.getElementById('complete-ad-btn')
          if (completeBtn) {
            completeBtn.style.opacity = '1'
            completeBtn.style.pointerEvents = 'auto'
            completeBtn.removeAttribute('disabled')
          }
        }
      }, 1000)

      // 跳过按钮
      const skipBtn = document.getElementById('skip-ad-btn')
      if (skipBtn) {
        skipBtn.onclick = () => {
          clearInterval(countdownInterval)
          document.body.removeChild(adOverlay)
          this.recordAdView(AdType.REWARDED, false, 0)
          reject(new Error('Ad skipped'))
        }
      }

      // 完成按钮
      const completeBtn = document.getElementById('complete-ad-btn')
      if (completeBtn) {
        completeBtn.onclick = () => {
          clearInterval(countdownInterval)
          document.body.removeChild(adOverlay)
          this.recordAdView(AdType.REWARDED, true, reward)
          resolve(reward)
        }
      }
    })
  }

  // 计算奖励金额
  private calculateRewardAmount(): number {
    // 前3次观看15万花币，之后10万花币
    const userStore = useUserStore.getState()
    const userId = userStore.user?.id

    if (!userId) return 10

    // 这里应该查询今日观看次数，简化为随机
    const todayViews = Math.floor(Math.random() * 10)
    return todayViews < 3 ? 15 : 10
  }

  // 记录广告观看
  private async recordAdView(adType: AdType, completed: boolean, reward: number): Promise<void> {
    try {
      const userStore = useUserStore.getState()
      const userId = userStore.user?.id

      if (!userId) return

      const { data } = await db.recordAdView(userId, adType as any, completed)

      if (data && reward > 0) {
        // 更新用户万花币
        userStore.updateCoins(reward)

        // 显示奖励通知
        TelegramUtils.showAlert(`观看广告完成！获得${reward}万花币奖励`)
        TelegramUtils.notificationFeedback('success')
      }

    } catch (error) {
      console.error('Failed to record ad view:', error)
    }
  }

  // 检查广告是否可用
  isAdReady(adType: AdType): boolean {
    return this.adStatus[adType] === AdStatus.LOADED
  }

  // 获取今日观看次数
  async getTodayAdViewCount(userId: string): Promise<number> {
    try {
      // 这里应该查询数据库，简化为返回随机数
      return Math.floor(Math.random() * 5)
    } catch (error) {
      console.error('Failed to get ad view count:', error)
      return 0
    }
  }

  // 预加载所有广告
  preloadAds(): void {
    Object.keys(this.adConfigs).forEach(adType => {
      if (this.adStatus[adType] !== AdStatus.LOADED) {
        this.loadAd(adType as AdType)
      }
    })
  }

  // 清理资源
  dispose(): void {
    this.hideBannerAd()

    // 清除横幅广告容器
    const bannerContainer = document.getElementById('banner-ad-container')
    if (bannerContainer) {
      document.body.removeChild(bannerContainer)
    }

    this.adStatus = {}
    this.isInitialized = false
  }
}

// 导出单例
export const adMobManager = AdMobManager.getInstance()

// 广告工具函数
export class AdUtils {
  // 在游戏暂停时显示插屏广告
  static async showGamePauseAd(): Promise<void> {
    await adMobManager.showInterstitialAd()
  }

  // 在游戏结束时显示激励视频选项
  static async offerRewardedVideoForRevive(): Promise<boolean> {
    try {
      const result = await TelegramUtils.showConfirm(
        '观看广告可以复活并获得万花币奖励，是否观看？'
      )

      if (result) {
        const adResult = await adMobManager.showRewardedVideoAd()
        return adResult.success
      }

      return false
    } catch (error) {
      console.error('Failed to offer rewarded video:', error)
      return false
    }
  }

  // 获取道具时提供激励视频选项
  static async offerRewardedVideoForPowerUp(powerUpName: string): Promise<boolean> {
    try {
      const result = await TelegramUtils.showConfirm(
        `观看广告免费获得${powerUpName}道具和万花币奖励，是否观看？`
      )

      if (result) {
        const adResult = await adMobManager.showRewardedVideoAd()
        return adResult.success
      }

      return false
    } catch (error) {
      console.error('Failed to offer rewarded video for power-up:', error)
      return false
    }
  }

  // 显示横幅广告在游戏界面
  static showInGameBanner(): void {
    adMobManager.showBannerAd()
  }

  // 隐藏横幅广告
  static hideInGameBanner(): void {
    adMobManager.hideBannerAd()
  }
}

// 初始化AdMob（在应用启动时调用）
export async function initializeAdMob(): Promise<void> {
  try {
    await adMobManager.initialize()

    // 预加载广告
    adMobManager.preloadAds()

    console.log('AdMob system initialized')
  } catch (error) {
    console.error('Failed to initialize AdMob:', error)
  }
}