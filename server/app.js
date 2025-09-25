const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// 数据库初始化
const db = new sqlite3.Database('./game_data.db');

// 初始化数据库表
db.serialize(() => {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        photo_url TEXT,
        coins INTEGER DEFAULT 0,
        energy INTEGER DEFAULT 100,
        level INTEGER DEFAULT 1,
        total_score INTEGER DEFAULT 0,
        checkin_streak INTEGER DEFAULT 0,
        last_checkin DATE,
        invite_code TEXT UNIQUE,
        invited_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 游戏记录表
    db.run(`CREATE TABLE IF NOT EXISTS game_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        level INTEGER,
        score INTEGER,
        moves INTEGER,
        coins_earned INTEGER,
        completed BOOLEAN,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // 签到记录表
    db.run(`CREATE TABLE IF NOT EXISTS checkin_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date DATE,
        reward INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // 提现记录表
    db.run(`CREATE TABLE IF NOT EXISTS withdrawal_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        amount INTEGER,
        fee INTEGER,
        final_amount DECIMAL,
        account TEXT,
        real_name TEXT,
        status TEXT DEFAULT 'pending',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // 邀请关系表
    db.run(`CREATE TABLE IF NOT EXISTS invite_relations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inviter_id INTEGER,
        invitee_id INTEGER,
        invite_code TEXT,
        reward_claimed BOOLEAN DEFAULT FALSE,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(inviter_id) REFERENCES users(id),
        FOREIGN KEY(invitee_id) REFERENCES users(id)
    )`);

    console.log('Database tables initialized');
});

// Telegram Bot (可选)
const BOT_TOKEN = process.env.BOT_TOKEN;
let bot = null;

if (BOT_TOKEN) {
    bot = new TelegramBot(BOT_TOKEN, { polling: true });

    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (text === '/start') {
            bot.sendMessage(chatId, `🎮 欢迎来到${CONFIG?.COPYRIGHT?.GAME_NAME || '消不停·万币赢'}！\n\n🎯 每天玩游戏赚万花币\n💰 万花币可提现到支付宝和USDT\n🎁 邀请好友获得额外奖励\n\n点击下方按钮开始游戏：`, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🎮 开始游戏', web_app: { url: process.env.GAME_URL || 'https://your-domain.com' } }
                    ]]
                }
            });
        }
    });
}

// API路由

// 用户相关API
app.get('/api/user/:telegramId', (req, res) => {
    const { telegramId } = req.params;

    db.get('SELECT * FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: row
        });
    });
});

app.post('/api/user/create', (req, res) => {
    const { telegramId, username, firstName, photoUrl } = req.body;
    const inviteCode = generateInviteCode();

    db.run(`INSERT INTO users (telegram_id, username, first_name, photo_url, invite_code)
            VALUES (?, ?, ?, ?, ?)`,
           [telegramId, username, firstName, photoUrl, inviteCode],
           function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
        }

        res.json({
            success: true,
            userId: this.lastID,
            inviteCode
        });
    });
});

app.put('/api/user/:telegramId', (req, res) => {
    const { telegramId } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
        if (key !== 'telegramId') {
            fields.push(`${key} = ?`);
            values.push(updates[key]);
        }
    });

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(telegramId);
    const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?`;

    db.run(sql, values, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update user' });
        }

        res.json({ success: true });
    });
});

// 游戏记录API
app.post('/api/game/record', (req, res) => {
    const { userId, level, score, moves, coinsEarned, completed } = req.body;

    db.run(`INSERT INTO game_records (user_id, level, score, moves, coins_earned, completed)
            VALUES (?, ?, ?, ?, ?, ?)`,
           [userId, level, score, moves, coinsEarned, completed],
           function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to save game record' });
        }

        res.json({ success: true, recordId: this.lastID });
    });
});

// 排行榜API
app.get('/api/leaderboard/:type', (req, res) => {
    const { type } = req.params; // monthly, weekly, daily
    let dateFilter = '';

    switch (type) {
        case 'monthly':
            dateFilter = "AND strftime('%Y-%m', timestamp) = strftime('%Y-%m', 'now')";
            break;
        case 'weekly':
            dateFilter = "AND timestamp >= date('now', 'weekday 0', '-7 days')";
            break;
        case 'daily':
            dateFilter = "AND date(timestamp) = date('now')";
            break;
    }

    const sql = `
        SELECT u.username, u.first_name, u.photo_url, SUM(g.score) as total_score, COUNT(g.id) as games_played
        FROM users u
        JOIN game_records g ON u.id = g.user_id
        WHERE 1=1 ${dateFilter}
        GROUP BY u.id
        ORDER BY total_score DESC
        LIMIT 50
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        res.json({
            success: true,
            leaderboard: rows
        });
    });
});

// 提现API
app.post('/api/withdraw', (req, res) => {
    const { userId, type, amount, account, realName } = req.body;

    // 计算手续费
    const fee = Math.floor(amount * 0.03);
    const finalAmount = amount - fee;

    // 加密敏感信息
    const encryptedAccount = encrypt(account);
    const encryptedRealName = encrypt(realName);

    db.run(`INSERT INTO withdrawal_records (user_id, type, amount, fee, final_amount, account, real_name, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
           [userId, type, amount, fee, finalAmount, encryptedAccount, encryptedRealName],
           function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to process withdrawal' });
        }

        res.json({
            success: true,
            withdrawalId: this.lastID,
            fee,
            finalAmount
        });
    });
});

// 邀请处理API
app.post('/api/invite/process', (req, res) => {
    const { inviteCode, newUserId } = req.body;

    // 查找邀请者
    db.get('SELECT id FROM users WHERE invite_code = ?', [inviteCode], (err, inviter) => {
        if (err || !inviter) {
            return res.status(400).json({ error: 'Invalid invite code' });
        }

        // 创建邀请关系
        db.run(`INSERT INTO invite_relations (inviter_id, invitee_id, invite_code)
                VALUES (?, ?, ?)`,
               [inviter.id, newUserId, inviteCode],
               function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to process invite' });
            }

            // 给邀请者奖励（好友完成10关后）
            res.json({ success: true });
        });
    });
});

// 广告API
app.get('/api/ads/manual', (req, res) => {
    // 返回手动广告配置
    const manualAds = [
        {
            id: 'sponsor_1',
            type: 'image',
            title: '万花楼汽车维修',
            description: '专业维修，值得信赖！联系我们获得优质服务',
            imageUrl: '/images/ads/car-repair.jpg',
            linkUrl: 'https://t.me/bjxc010',
            sponsor: '北京修车【万花楼】',
            active: true,
            weight: 10
        }
    ];

    res.json(manualAds);
});

app.post('/api/ads/click', (req, res) => {
    const { adId, userId, timestamp } = req.body;

    // 记录广告点击（简化实现）
    console.log(`Ad clicked: ${adId} by user ${userId} at ${new Date(timestamp)}`);

    res.json({ success: true });
});

// 用户分享API
app.post('/api/user/share', (req, res) => {
    const { userId, timestamp } = req.body;

    // 记录分享事件并给予奖励
    db.get('SELECT coins FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // 给予分享奖励（每日限制在前端控制）
        const shareReward = 5;
        const newCoins = user.coins + shareReward;

        db.run('UPDATE users SET coins = ? WHERE id = ?', [newCoins, userId], (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ error: 'Failed to update coins' });
            }

            res.json({
                success: true,
                reward: shareReward,
                newBalance: newCoins
            });
        });
    });
});

// USDT汇率API
app.get('/api/exchange-rate/usdt', async (req, res) => {
    try {
        // 这里应该调用真实的汇率API
        // 为了演示，返回模拟汇率
        const usdtRate = 6.8; // 1 USDT = 6.8 RMB

        res.json({
            success: true,
            rate: usdtRate,
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exchange rate' });
    }
});

// 工具函数
function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'your-secret-key-here-must-be-32-chars!';
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = process.env.ENCRYPTION_KEY || 'your-secret-key-here-must-be-32-chars!';

    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');

    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

// 静态文件服务
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🎮 消不停·万币赢 Server running on port ${PORT}`);
    console.log(`🌐 Game URL: http://localhost:${PORT}`);
    if (bot) {
        console.log('🤖 Telegram Bot is running');
    }
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close();
    if (bot) {
        bot.stopPolling();
    }
    process.exit(0);
});