const CONFIG = {
    // 游戏基础配置
    GAME: {
        GRID_SIZE: 8,
        CELL_SIZE: 50,
        CANVAS_WIDTH: 400,
        CANVAS_HEIGHT: 600,
        ANIMATION_DURATION: 300,
        MATCH_MIN_COUNT: 3,
        INITIAL_MOVES: 30,
        ENERGY_MAX: 100,
        ENERGY_COST_PER_GAME: 5,
        ENERGY_RECOVERY_TIME: 5 * 60 * 1000 // 5分钟恢复1点体力
    },

    // 万花币配置（平衡优化版）
    CURRENCY: {
        NAME: "万花币",
        SYMBOL: "🪙",
        RATE_TO_RMB: 1000, // 1000万花币 = 10人民币

        // 每日基础奖励（资深用户月最多3000币，普通用户月最多2000币）
        DAILY_BONUS: {
            BASE: 50,           // 基础每日奖励50币
            VIP_MULTIPLIER: 1.5 // 资深用户倍数
        },

        // 连续签到奖励（平衡调整）
        SIGN_IN_BONUS: [20, 25, 30, 35, 40, 50, 80], // 7天总共280币

        // 游戏内消除奖励（大幅降低）
        MATCH_REWARDS: {
            3: 0.5, // 3连消奖励0.5万花币
            4: 1,   // 4连消奖励1万花币
            5: 2,   // 5连消奖励2万花币
            L: 3,   // L型消除奖励3万花币
            T: 5    // T型消除奖励5万花币
        },

        // 月度上限控制
        MONTHLY_LIMITS: {
            REGULAR_USER: 2000,    // 普通用户月上限2000币
            VIP_USER: 3000,        // 资深用户月上限3000币
            VIP_THRESHOLD: 30      // 连续30天登录成为资深用户
        },

        // 获取途径权重分配
        EARNING_SOURCES: {
            DAILY_SIGNIN: 0.4,     // 40%来自签到
            GAME_REWARDS: 0.3,     // 30%来自游戏奖励
            ACHIEVEMENTS: 0.15,    // 15%来自成就
            SOCIAL: 0.15          // 15%来自社交活动
        }
    },

    // 道具配置和价格
    TOOLS: {
        HAMMER: {
            name: "锤子",
            price: 100,
            icon: "🔨",
            description: "消除单个方块"
        },
        SHUFFLE: {
            name: "洗牌",
            price: 80,
            icon: "🔄",
            description: "重新排列所有方块"
        },
        STEPS: {
            name: "步数",
            price: 60,
            icon: "👣",
            description: "增加5步额外步数"
        },
        HINT: {
            name: "提示",
            price: 40,
            icon: "💡",
            description: "显示可消除的方块"
        }
    },

    // 社交奖励配置
    SOCIAL: {
        SHARE_REWARD: 5,        // 分享奖励
        SHARE_DAILY_LIMIT: 6,   // 每日分享次数限制
        INVITE_REWARD: 30,      // 邀请奖励
        INVITE_REQUIREMENT: 10, // 好友需完成关卡数
        DAILY_ACTIVE_REWARD: 5  // 邀请活跃每日奖励
    },

    // 提现配置
    WITHDRAW: {
        ALIPAY_MIN: 3000,       // 支付宝最低提现3000万花币(30元)
        USDT_MIN_USD: 10,       // USDT最低提现10美元
        FEE_RATE: 0.03,         // 提现手续费3%
        PROCESSING_TIME: "1-3个工作日"
    },

    // 成就系统（平衡优化版）
    ACHIEVEMENTS: {
        FIRST_GAME: {
            id: "first_game",
            name: "初出茅庐",
            description: "完成第一局游戏",
            reward: 30,
            icon: "🎮"
        },
        SCORE_1000: {
            id: "score_1000",
            name: "得分达人",
            description: "单局得分超过1000",
            reward: 50,
            icon: "🎯"
        },
        LEVEL_10: {
            id: "level_10",
            name: "关卡挑战者",
            description: "通过第10关",
            reward: 80,
            icon: "🏆"
        },
        COMBO_5: {
            id: "combo_5",
            name: "连击高手",
            description: "达成5连击",
            reward: 60,
            icon: "⚡"
        },
        DAILY_7: {
            id: "daily_7",
            name: "坚持不懈",
            description: "连续签到7天",
            reward: 120,
            icon: "📅"
        },
        FRIEND_5: {
            id: "friend_5",
            name: "人脉广阔",
            description: "邀请5位好友",
            reward: 200,
            icon: "👥"
        },
        COIN_5000: {
            id: "coin_5000",
            name: "万花币收藏家",
            description: "累计获得5000万花币",
            reward: 150,
            icon: "💰"
        },
        MONTHLY_LOGIN: {
            id: "monthly_login",
            name: "月度坚持者",
            description: "连续登录30天",
            reward: 300,
            icon: "🌟"
        }
    },

    // 排行榜奖励（平衡调整版）
    LEADERBOARD: {
        MONTHLY_REWARDS: {
            1: 800,   // 第一名奖励800万花币
            2: 500,   // 第二名奖励500万花币
            3: 300,   // 第三名奖励300万花币
            4: 200,   // 第四名奖励200万花币
            5: 100    // 第五名奖励100万花币
        },
        RESET_DAY: 1 // 每月1号重置排行榜
    },

    // AdMob广告配置
    ADMOB: {
        BANNER_ID: "ca-app-pub-6402806742664594/3631141010",
        REWARD_ID: "ca-app-pub-6402806742664594/4856592778",
        REWARD_AMOUNT: 20 // 看广告奖励20万花币
    },

    // Telegram配置
    TELEGRAM: {
        BOT_USERNAME: "xiaobuting_wanbiying_bot",
        SHARE_URL: "https://t.me/xiaobuting_wanbiying_bot/game",
        DEVELOPER_USERNAME: "bjxc010"
    },

    // API配置
    API: {
        BASE_URL: typeof window !== 'undefined' && window.location.origin
            ? window.location.origin + '/api'
            : 'http://localhost:3000/api',
        TIMEOUT: 10000
    },

    // 游戏平衡性配置
    BALANCE: {
        LEVEL_DIFFICULTY_INCREASE: 1.2, // 每关难度增加20%
        SCORE_MULTIPLIERS: {
            3: 100,  // 3连消基础分数
            4: 300,  // 4连消基础分数
            5: 800,  // 5连消基础分数
            L: 1200, // L型消除基础分数
            T: 1500  // T型消除基础分数
        },
        COMBO_MULTIPLIER: 1.5, // 连击倍数
        SPECIAL_BLOCK_CHANCE: 0.15 // 特殊方块生成概率15%
    },

    // 音效配置
    AUDIO: {
        MASTER_VOLUME: 0.7,
        MUSIC_VOLUME: 0.5,
        SFX_VOLUME: 0.8,
        SOUNDS: {
            MATCH: 'audio/match.mp3',
            COIN: 'audio/coin.mp3',
            BUTTON: 'audio/button.mp3',
            BACKGROUND: 'audio/bg-music.mp3',
            LEVEL_COMPLETE: 'audio/level-complete.mp3',
            GAME_OVER: 'audio/game-over.mp3'
        }
    },

    // 本地存储键名
    STORAGE_KEYS: {
        USER_DATA: 'xiaobuting_user_data',
        GAME_SETTINGS: 'xiaobuting_game_settings',
        ACHIEVEMENTS: 'xiaobuting_achievements',
        DAILY_CHECKIN: 'xiaobuting_daily_checkin'
    },

    // 版权信息
    COPYRIGHT: {
        SPONSOR: "北京修车【万花楼】",
        DEVELOPER: "@bjxc010",
        COOPERATION: "@bjxc010",
        GAME_NAME: "消不停·万币赢"
    },

    // USDT汇率API
    EXCHANGE_RATE: {
        API_URL: "https://api.exchangerate-api.com/v4/latest/USD",
        CACHE_TIME: 10 * 60 * 1000 // 汇率缓存10分钟
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}