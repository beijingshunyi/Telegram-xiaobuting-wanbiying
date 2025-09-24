import { createClient } from '@supabase/supabase-js'

// Telegram Bot API接口
interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
  entities?: TelegramMessageEntity[]
}

interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

interface TelegramChat {
  id: number
  type: string
  title?: string
  username?: string
  first_name?: string
  last_name?: string
}

interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

interface TelegramMessageEntity {
  type: string
  offset: number
  length: number
}

// 环境变量接口
interface Env {
  BOT_TOKEN: string
  BOT_USERNAME: string
  WEBAPP_URL: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_KEY: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // 健康检查
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 })
    }

    // Webhook处理
    if (url.pathname === '/webhook' && request.method === 'POST') {
      try {
        const update: TelegramUpdate = await request.json()
        await handleUpdate(update, env)
        return new Response('OK', { status: 200 })
      } catch (error) {
        console.error('Webhook error:', error)
        return new Response('Error', { status: 500 })
      }
    }

    // 设置Webhook
    if (url.pathname === '/setWebhook') {
      const webhookUrl = `https://${url.hostname}/webhook`
      const response = await setWebhook(env.BOT_TOKEN, webhookUrl)
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response('Not Found', { status: 404 })
  }
}

// 处理更新
async function handleUpdate(update: TelegramUpdate, env: Env) {
  if (update.message) {
    await handleMessage(update.message, env)
  }

  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query, env)
  }
}

// 处理消息
async function handleMessage(message: TelegramMessage, env: Env) {
  const chatId = message.chat.id
  const text = message.text || ''
  const user = message.from

  if (!user) return

  // 创建Supabase客户端
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

  try {
    // 处理不同的命令
    if (text.startsWith('/start')) {
      await handleStartCommand(chatId, text, user, env, supabase)
    } else if (text.startsWith('/help')) {
      await handleHelpCommand(chatId, env)
    } else if (text.startsWith('/profile') || text.startsWith('/me')) {
      await handleProfileCommand(chatId, user, env, supabase)
    } else if (text.startsWith('/balance')) {
      await handleBalanceCommand(chatId, user, env, supabase)
    } else if (text.startsWith('/withdraw')) {
      await handleWithdrawCommand(chatId, user, env, supabase)
    } else if (text.startsWith('/leaderboard')) {
      await handleLeaderboardCommand(chatId, env, supabase)
    } else {
      // 默认响应
      await sendGameLink(chatId, env)
    }

  } catch (error) {
    console.error('Message handling error:', error)
    await sendMessage(chatId, '抱歉，处理您的请求时出现了错误，请稍后重试。', env.BOT_TOKEN)
  }
}

// 处理回调查询
async function handleCallbackQuery(callbackQuery: TelegramCallbackQuery, env: Env) {
  const chatId = callbackQuery.message?.chat.id
  const callbackData = callbackQuery.data
  const user = callbackQuery.from

  if (!chatId || !callbackData) return

  // 创建Supabase客户端
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)

  try {
    if (callbackData === 'play_game') {
      await sendGameLink(chatId, env)
    } else if (callbackData === 'check_balance') {
      await handleBalanceCommand(chatId, user, env, supabase)
    } else if (callbackData === 'view_leaderboard') {
      await handleLeaderboardCommand(chatId, env, supabase)
    }

    // 应答回调查询
    await answerCallbackQuery(callbackQuery.id, env.BOT_TOKEN)

  } catch (error) {
    console.error('Callback query handling error:', error)
  }
}

// 处理/start命令
async function handleStartCommand(
  chatId: number,
  text: string,
  user: TelegramUser,
  env: Env,
  supabase: any
) {
  // 提取邀请码
  const parts = text.split(' ')
  const inviteCode = parts.length > 1 ? parts[1] : null

  // 查找或创建用户
  let { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', user.id)
    .single()

  if (!existingUser) {
    // 创建新用户
    const { data: newUserId, error } = await supabase.rpc('create_user', {
      p_telegram_id: user.id,
      p_username: user.username,
      p_first_name: user.first_name,
      p_last_name: user.last_name,
      p_inviter_code: inviteCode
    })

    if (error) {
      console.error('User creation error:', error)
    } else {
      // 重新获取用户数据
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', user.id)
        .single()

      existingUser = userData
    }
  }

  const welcomeMessage = `🎮 欢迎来到消不停・万币赢！

🌟 ${user.first_name}，欢迎您！这是一个可以通过玩消除游戏赚取真钱的平台。

💰 游戏特色：
• 经典三消玩法，简单易上手
• 消除方块获得万花币
• 万花币可直接提现到支付宝/USDT
• 邀请好友获得更多奖励

🎯 您的游戏信息：
万花币余额：${existingUser?.wanhua_coins || 0}
当前关卡：${existingUser?.current_level || 1}
邀请码：${existingUser?.invite_code || 'N/A'}

点击下方按钮开始游戏！`

  await sendMessage(chatId, welcomeMessage, env.BOT_TOKEN, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 开始游戏',
            web_app: { url: env.WEBAPP_URL }
          }
        ],
        [
          {
            text: '💰 查看余额',
            callback_data: 'check_balance'
          },
          {
            text: '🏆 排行榜',
            callback_data: 'view_leaderboard'
          }
        ],
        [
          {
            text: '❓ 帮助',
            callback_data: 'help'
          }
        ]
      ]
    }
  })
}

// 处理帮助命令
async function handleHelpCommand(chatId: number, env: Env) {
  const helpMessage = `📖 游戏帮助

🎮 **游戏玩法：**
• 连接3个或更多相同水果可消除
• 4连消生成直线消除道具
• 5连消生成爆炸道具
• 完成关卡获得万花币奖励

💰 **赚钱方式：**
• 消除水果获得万花币
• 观看广告获得额外奖励
• 每日签到获得万花币
• 邀请好友获得丰厚奖励

🎁 **道具系统：**
• 锤子：消除单个方块
• 洗牌：重新排列棋盘
• 加步数：增加移动次数
• 提示：显示可消除组合

💸 **提现说明：**
• 最低提现：1000万花币
• 手续费：3%
• 支持支付宝和USDT提现
• 24小时内处理

📞 **联系我们：**
合作联系：@bjxc010
客服支持：@bjxc010

游戏由"北京修车【万花楼】"赞助开发`

  await sendMessage(chatId, helpMessage, env.BOT_TOKEN, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 开始游戏',
            web_app: { url: env.WEBAPP_URL }
          }
        ]
      ]
    }
  })
}

// 处理余额查询
async function handleBalanceCommand(
  chatId: number,
  user: TelegramUser,
  env: Env,
  supabase: any
) {
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', user.id)
    .single()

  if (!userData) {
    await sendMessage(chatId, '请先发送 /start 开始游戏', env.BOT_TOKEN)
    return
  }

  const balanceMessage = `💰 您的游戏资产

🪙 万花币余额：${userData.wanhua_coins || 0}
🎯 当前关卡：${userData.current_level || 1}
🏆 最高分数：${userData.highest_score || 0}
🎮 游戏次数：${userData.games_played || 0}

📊 收益统计：
• 累计收益：${userData.total_earned || 0} 万花币
• 累计提现：${userData.total_withdrawn || 0} 万花币

💡 提现条件：
• 最低提现：1000万花币
• 当前${userData.wanhua_coins >= 1000 ? '✅ 可以提现' : '❌ 余额不足'}`

  await sendMessage(chatId, balanceMessage, env.BOT_TOKEN, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 继续游戏',
            web_app: { url: env.WEBAPP_URL }
          }
        ],
        [
          {
            text: '💸 申请提现',
            web_app: { url: `${env.WEBAPP_URL}?page=withdraw` }
          }
        ]
      ]
    }
  })
}

// 处理提现命令
async function handleWithdrawCommand(
  chatId: number,
  user: TelegramUser,
  env: Env,
  supabase: any
) {
  const { data: userData } = await supabase
    .from('users')
    .select('wanhua_coins')
    .eq('telegram_id', user.id)
    .single()

  if (!userData) {
    await sendMessage(chatId, '请先发送 /start 开始游戏', env.BOT_TOKEN)
    return
  }

  if ((userData.wanhua_coins || 0) < 1000) {
    await sendMessage(
      chatId,
      `💸 提现申请

当前余额：${userData.wanhua_coins || 0} 万花币
最低提现：1000 万花币

余额不足，请继续游戏获取更多万花币！`,
      env.BOT_TOKEN,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🎮 继续游戏',
                web_app: { url: env.WEBAPP_URL }
              }
            ]
          ]
        }
      }
    )
    return
  }

  await sendMessage(
    chatId,
    `💸 提现申请

当前余额：${userData.wanhua_coins} 万花币
✅ 满足提现条件

点击下方按钮在游戏内申请提现：`,
    env.BOT_TOKEN,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '💸 立即提现',
              web_app: { url: `${env.WEBAPP_URL}?page=withdraw` }
            }
          ]
        ]
      }
    }
  )
}

// 处理排行榜命令
async function handleLeaderboardCommand(chatId: number, env: Env, supabase: any) {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data: leaderboard } = await supabase
      .from('leaderboards')
      .select(`
        *,
        users:user_id (
          first_name,
          last_name,
          username
        )
      `)
      .eq('period_type', 'daily')
      .eq('period_start', today)
      .order('score', { ascending: false })
      .limit(10)

    if (!leaderboard || leaderboard.length === 0) {
      await sendMessage(chatId, '📊 今日排行榜暂无数据', env.BOT_TOKEN)
      return
    }

    let leaderboardText = '🏆 今日排行榜 Top 10\n\n'

    leaderboard.forEach((entry, index) => {
      const rank = index + 1
      const user = entry.users
      const name = user.first_name + (user.last_name ? ' ' + user.last_name : '')
      const username = user.username ? ` (@${user.username})` : ''

      let rankEmoji = ''
      if (rank === 1) rankEmoji = '🥇'
      else if (rank === 2) rankEmoji = '🥈'
      else if (rank === 3) rankEmoji = '🥉'
      else rankEmoji = `${rank}.`

      leaderboardText += `${rankEmoji} ${name}${username}\n`
      leaderboardText += `   分数：${entry.score} | 万花币：${entry.wanhua_coins}\n\n`
    })

    await sendMessage(chatId, leaderboardText, env.BOT_TOKEN, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎮 挑战排行榜',
              web_app: { url: env.WEBAPP_URL }
            }
          ]
        ]
      }
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    await sendMessage(chatId, '获取排行榜数据失败，请稍后重试', env.BOT_TOKEN)
  }
}

// 发送游戏链接
async function sendGameLink(chatId: number, env: Env) {
  await sendMessage(
    chatId,
    '🎮 点击下方按钮开始游戏，赚取万花币！',
    env.BOT_TOKEN,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎮 开始游戏',
              web_app: { url: env.WEBAPP_URL }
            }
          ]
        ]
      }
    }
  )
}

// 发送消息
async function sendMessage(
  chatId: number,
  text: string,
  botToken: string,
  options?: any
) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  const body = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    ...options
  }

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

// 应答回调查询
async function answerCallbackQuery(callbackQueryId: string, botToken: string) {
  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackQueryId
    })
  })
}

// 设置Webhook
async function setWebhook(botToken: string, webhookUrl: string) {
  const url = `https://api.telegram.org/bot${botToken}/setWebhook`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    })
  })

  return await response.json()
}