export const SUPABASE_CONFIG = {
  url: 'https://mtndxfqxivgivbwamjgn.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bmR4ZnF4aXZnaXZid2FtamduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDc1MDQsImV4cCI6MjA3MzgyMzUwNH0.s7LQxin9OyNLUTQsrv0EK1z60CcmqhyGAjDY-A17Yy0',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bmR4ZnF4aXZnaXZid2FtamduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODI0NzUwNCwiZXhwIjoyMDczODIzNTA0fQ.zBPORwIitvB40av6G05c_Qi6BmdKOEvtQk3gs-QCjLA'
}

export const TELEGRAM_CONFIG = {
  botToken: '8496818925:AAGxeh_UWELR9iGH9lEhuKbnNHcPLUDu6k0',
  botUsername: '@XBTyxbot'
}

export const ADMOB_CONFIG = {
  bannerAdId: 'ca-app-pub-6402806742664594/3631141010',
  rewardedAdId: 'ca-app-pub-6402806742664594/4856592778'
}

export const CLOUDFLARE_CONFIG = {
  workerUrl: 'https://xiaobuting-wanbiying.bingkuijing.workers.dev'
}

export const GAME_CONFIG = {
  GRID_ROWS: 8,
  GRID_COLS: 6,
  FRUIT_TYPES: 6,
  MIN_MATCH: 3,
  BASE_SCORE: {
    THREE_MATCH: 10,
    FOUR_MATCH: 30,
    FIVE_MATCH: 60,
    BONUS_MULTIPLIER: 1.5
  },
  WANHUA_COIN_RATES: {
    THREE_MATCH: 1,
    FOUR_MATCH: 3,
    FIVE_MATCH: 6,
    COMBO_BONUS: [0, 0.1, 0.25, 0.5, 1.0] // 连击奖励倍数
  },
  POWER_UPS: {
    HAMMER: { id: 'hammer', cost: 100 },
    SHUFFLE: { id: 'shuffle', cost: 80 },
    EXTRA_MOVES: { id: 'extra_moves', cost: 60 },
    HINT: { id: 'hint', cost: 40 }
  }
}

export const WITHDRAWAL_CONFIG = {
  MIN_AMOUNT: 1000, // 最小提现万花币数量
  FEE_RATE: 0.03, // 3% 手续费
  SUPPORTED_METHODS: ['alipay', 'trc20_usdt']
}

export const SHARE_TEMPLATES = {
  PRIVATE: [
    '🎮 我在玩消不停・万币赢，已经赚了 {coins} 万花币！真的能提现哦！快来和我一起玩吧！邀请码：{userCode}',
    '💰 太爽了！玩消除游戏就能赚钱，我已经通过第 {level} 关了！你也来试试吧：{userCode}',
    '🌟 发现一个超棒的赚钱游戏！消除游戏玩着轻松，还能赚万花币提现。我的邀请码：{userCode}'
  ],
  GROUP: [
    '🎯 【消不停・万币赢】新上线！玩消除游戏赚真钱💰\n✅ 真实提现到支付宝/USDT\n✅ 简单易上手，老少皆宜\n🔥 使用邀请码有额外奖励：{userCode}',
    '🎮 和朋友们分享一个好玩的赚钱小游戏\n消除游戏+区块链收益，玩着就把钱赚了！\n我的战绩：第{level}关 | {coins}万花币\n一起来玩：{userCode}'
  ]
}

export const COPYRIGHT_INFO = {
  sponsor: '北京修车【万花楼】',
  developer: '@bjxc010',
  telegramLink: 'https://t.me/bjxc010'
}