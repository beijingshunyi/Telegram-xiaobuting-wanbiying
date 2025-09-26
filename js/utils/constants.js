/**
 * 游戏常量定义
 * 集中管理所有游戏配置和常量
 */

window.GAME_CONSTANTS = {
    // 游戏基本配置
    BOARD: {
        ROWS: 8,
        COLS: 8,
        MIN_MATCH_LENGTH: 3
    },

    // 元素类型（对应天天爱消除角色）
    ELEMENT_TYPES: {
        YELLOW_CAT: 'yellow-cat',        // 黄豆豆（黄猫）
        BROWN_BEAR: 'brown-bear',        // 琦琦熊（棕熊）
        PINK_RABBIT: 'pink-rabbit',      // 果果兔（粉兔）
        PURPLE_CAT: 'purple-cat',        // 喵星星（紫猫）
        BLUE_OWL: 'blue-owl',           // 蓝猫头鹰
        GREEN_FROG: 'green-frog'        // 绿青蛙
    },

    // 特殊元素类型
    SPECIAL_TYPES: {
        ROCKET_H: 'rocket-horizontal',    // 横向火箭
        ROCKET_V: 'rocket-vertical',      // 纵向火箭
        BOMB: 'bomb',                     // 炸弹
        RAINBOW_OWL: 'rainbow-owl'        // 彩色猫头鹰
    },

    // 匹配类型
    MATCH_TYPES: {
        LINE_3: 'line-3',
        LINE_4: 'line-4',
        LINE_5: 'line-5',
        LINE_6_PLUS: 'line-6+',
        L_SHAPE: 'l-shape',
        T_SHAPE: 't-shape',
        CROSS: 'cross'
    },

    // 游戏状态
    GAME_STATES: {
        LOADING: 'loading',
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        LEVEL_COMPLETE: 'level_complete',
        GAME_OVER: 'game_over',
        SETTINGS: 'settings'
    },

    // 动画配置
    ANIMATIONS: {
        SWAP_DURATION: 300,
        FALL_DURATION: 500,
        MATCH_DURATION: 400,
        SPECIAL_DURATION: 600,
        PARTICLE_LIFETIME: 2000
    },

    // 得分配置
    SCORING: {
        BASE_MATCH_3: 100,
        BASE_MATCH_4: 200,
        BASE_MATCH_5: 500,
        L_SHAPE_BONUS: 600,
        T_SHAPE_BONUS: 700,
        SPECIAL_ACTIVATION: 300,
        COMBO_MULTIPLIER: 1.5,
        MAX_COMBO_MULTIPLIER: 3.0
    },

    // 万花币系统
    COIN_SYSTEM: {
        EXCHANGE_RATE: {
            CNY: 100,           // 1元 = 100万花币
            USDT: 720          // 1 USDT = 720万花币 (按7.2汇率)
        },
        MIN_WITHDRAW: {
            ALIPAY: 3000,      // 支付宝最低提现3000万花币(30元)
            USDT: 720          // USDT最低提现720万花币(1 USDT)
        },
        WITHDRAWAL_FEE: 0.02,  // 提现手续费2%
        DAILY_CHECKIN: 100,    // 每日签到奖励100万花币
        LEVEL_REWARD: {
            BASE: 50,          // 基础通关奖励
            STAR_BONUS: 25     // 每颗星额外奖励
        }
    },

    // 关卡配置
    LEVEL_CONFIG: {
        OBJECTIVES: {
            COLLECT: 'collect',           // 收集目标
            SCORE: 'score',              // 分数目标
            CLEAR_OBSTACLES: 'obstacles'  // 清除障碍物
        },
        OBSTACLES: {
            ICE: 'ice',                  // 冰块
            CHOCOLATE: 'chocolate',      // 巧克力
            VINE: 'vine',               // 藤蔓
            CAGE: 'cage'                // 牢笼
        },
        DIFFICULTY_CURVE: {
            EASY: { levels: [1, 10], moves: 30, objectives: 15 },
            NORMAL: { levels: [11, 30], moves: 25, objectives: 20 },
            HARD: { levels: [31, 50], moves: 20, objectives: 25 },
            EXPERT: { levels: [51, 100], moves: 18, objectives: 30 }
        }
    },

    // 排行榜配置
    LEADERBOARD: {
        DEEP_PLAYER_CRITERIA: {
            MIN_LOGIN_DAYS: 25,
            MIN_LEVELS: 50,
            MIN_INVITES: 5,
            MIN_ADS: 20
        },
        MONTHLY_REWARDS: {
            DEEP_PLAYERS: [3500, 3200, 3000, 2800, 2500],
            NORMAL_PLAYERS: [2500, 2300, 2100, 1900, 1700]
        }
    },

    // 音效文件
    SOUNDS: {
        BACKGROUND_MUSIC: 'assets/sounds/bg_music.mp3',
        UI_CLICK: 'assets/sounds/ui_click.wav',
        ELEMENT_SWAP: 'assets/sounds/swap.wav',
        MATCH_POP: 'assets/sounds/pop_01.wav',
        MATCH_POP_ALT: 'assets/sounds/pop_02.wav',
        SPECIAL_CREATE: 'assets/sounds/special_generate.wav',
        ROCKET_LAUNCH: 'assets/sounds/rocket_launch.wav',
        BOMB_EXPLODE: 'assets/sounds/bird_explode.wav',
        LEVEL_WIN: 'assets/sounds/victory_jingle.wav',
        LEVEL_LOSE: 'assets/sounds/fail_jingle.wav',
        COMBO_SOUND: 'assets/sounds/combo.wav'
    },

    // 图片资源
    IMAGES: {
        CHARACTERS: {
            YELLOW_CAT: 'assets/images/characters/yellow-cat.png',
            BROWN_BEAR: 'assets/images/characters/brown-bear.png',
            PINK_RABBIT: 'assets/images/characters/pink-rabbit.png',
            PURPLE_CAT: 'assets/images/characters/purple-cat.png',
            BLUE_OWL: 'assets/images/characters/blue-owl.png',
            GREEN_FROG: 'assets/images/characters/green-frog.png'
        },
        SPECIAL: {
            ROCKET_H: 'assets/images/special/rocket-h.png',
            ROCKET_V: 'assets/images/special/rocket-v.png',
            BOMB: 'assets/images/special/bomb.png',
            RAINBOW_OWL: 'assets/images/special/rainbow-owl.png'
        },
        UI: {
            DEFAULT_AVATAR: 'assets/images/ui/default-avatar.png',
            STAR_EMPTY: 'assets/images/ui/star-empty.png',
            STAR_FILLED: 'assets/images/ui/star-filled.png',
            COIN_ICON: 'assets/images/ui/coin.png'
        }
    },

    // 广告配置
    ADS: {
        DAILY_LIMIT: 10,               // 每日最多观看10次广告
        MIN_INTERVAL: 300000,          // 最小间隔5分钟
        REWARD_ENERGY: 5,              // 广告奖励5点体力
        REWARD_COINS: 50,              // 广告奖励50万花币
        CONTINUE_MOVES: 5              // 广告继续游戏增加5步
    },

    // Telegram集成
    TELEGRAM: {
        BOT_USERNAME: 'bjxc010',
        SHARE_TEMPLATE: '🎮 我在万花消消乐通过了第{level}关，得分{score}！快来挑战我吧！',
        INVITE_REWARD: 100,            // 邀请奖励100万花币
        FRIEND_COMPLETE_REWARD: 200,   // 好友完成10关奖励200万花币
        PURCHASE_COMMISSION: 0.1       // 好友充值10%提成
    },

    // 本地存储键名
    STORAGE_KEYS: {
        GAME_PROGRESS: 'xiaobutting_game_progress',
        USER_SETTINGS: 'xiaobutting_user_settings',
        COIN_BALANCE: 'xiaobutting_coin_balance',
        ENERGY_DATA: 'xiaobutting_energy_data',
        LAST_CHECKIN: 'xiaobutting_last_checkin',
        AUDIO_SETTINGS: 'xiaobutting_audio_settings',
        LEADERBOARD_DATA: 'xiaobutting_leaderboard',
        TELEGRAM_DATA: 'xiaobutting_telegram'
    },

    // 错误代码
    ERROR_CODES: {
        INVALID_MOVE: 'E001',
        NO_MATCHES: 'E002',
        INSUFFICIENT_MOVES: 'E003',
        INVALID_SPECIAL_COMBO: 'E004',
        NETWORK_ERROR: 'E005',
        INSUFFICIENT_COINS: 'E006',
        WITHDRAWAL_LIMIT: 'E007'
    },

    // API端点
    API: {
        BASE_URL: '/api',
        ENDPOINTS: {
            USER_DATA: '/user/data',
            LEADERBOARD: '/leaderboard',
            WITHDRAW: '/withdraw',
            TELEGRAM_AUTH: '/telegram/auth',
            GAME_STATS: '/stats'
        }
    },

    // 版本信息
    VERSION: {
        MAJOR: 1,
        MINOR: 0,
        PATCH: 0,
        BUILD: Date.now(),
        NAME: '消不停·万币赢'
    },

    // 开发者信息
    CREDITS: {
        DEVELOPER: '@bjxc010',
        SPONSOR: '北京修车【万花楼】',
        TELEGRAM_CONTACT: 'tg://resolve?domain=bjxc010',
        REPOSITORY: 'https://github.com/beijingshunyi/Telegram-xiaobuting-wanbiying'
    }
};

// 冻结常量对象，防止意外修改
Object.freeze(window.GAME_CONSTANTS);

console.log('📋 Game constants loaded:', window.GAME_CONSTANTS.VERSION.NAME);