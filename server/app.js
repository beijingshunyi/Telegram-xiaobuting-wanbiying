const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// 导入数据库管理器
const dbManager = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// 数据库已通过dbManager自动初始化

// Telegram Bot (可选)
const BOT_TOKEN = process.env.BOT_TOKEN;
let bot = null;

if (BOT_TOKEN) {
    bot = new TelegramBot(BOT_TOKEN, { polling: true });

    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (text === '/start') {
            bot.sendMessage(chatId, `🎮 欢迎来到消不停·万币赢！\n\n🎯 每天玩游戏赚万花币\n💰 万花币可提现到支付宝和USDT\n🎁 邀请好友获得额外奖励\n\n点击下方按钮开始游戏：`, {
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
app.get('/api/user/:telegramId', async (req, res) => {
    const { telegramId } = req.params;

    try {
        const paramIndex = dbManager.getType() === 'postgresql' ? '$1' : '?';
        const user = await dbManager.get(`SELECT * FROM users WHERE telegram_id = ${paramIndex}`, [telegramId]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/user/create', async (req, res) => {
    const { telegramId, username, firstName, photoUrl } = req.body;
    const inviteCode = generateInviteCode();

    try {
        const isPostgres = dbManager.getType() === 'postgresql';
        const params = isPostgres ?
            '$1, $2, $3, $4, $5' : '?, ?, ?, ?, ?';

        const userId = await dbManager.insert(
            `INSERT INTO users (telegram_id, username, first_name, photo_url, invite_code)
             VALUES (${params})`,
            [telegramId, username, firstName, photoUrl, inviteCode]
        );

        res.json({
            success: true,
            userId,
            inviteCode
        });
    } catch (error) {
        console.error('Failed to create user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.put('/api/user/:telegramId', async (req, res) => {
    const { telegramId } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
        if (key !== 'telegramId') {
            const param = dbManager.getType() === 'postgresql' ? `$${paramIndex}` : '?';
            fields.push(`${key} = ${param}`);
            values.push(updates[key]);
            paramIndex++;
        }
    });

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
    }

    const finalParam = dbManager.getType() === 'postgresql' ? `$${paramIndex}` : '?';
    values.push(telegramId);

    const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = ${
        dbManager.getType() === 'postgresql' ? 'CURRENT_TIMESTAMP' : "datetime('now')"
    } WHERE telegram_id = ${finalParam}`;

    try {
        await dbManager.run(sql, values);
        res.json({ success: true });
    } catch (error) {
        console.error('Failed to update user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// 游戏记录API
app.post('/api/game/record', async (req, res) => {
    const { userId, level, score, moves, coinsEarned, completed } = req.body;

    try {
        const isPostgres = dbManager.getType() === 'postgresql';
        const params = isPostgres ?
            '$1, $2, $3, $4, $5, $6' : '?, ?, ?, ?, ?, ?';

        const recordId = await dbManager.insert(
            `INSERT INTO game_records (user_id, level, score, moves, coins_earned, completed)
             VALUES (${params})`,
            [userId, level, score, moves, coinsEarned, completed]
        );

        res.json({ success: true, recordId });
    } catch (error) {
        console.error('Failed to save game record:', error);
        res.status(500).json({ error: 'Failed to save game record' });
    }
});

// 排行榜API
app.get('/api/leaderboard/:type', async (req, res) => {
    const { type } = req.params;
    let dateFilter = '';
    let dateFunction = '';

    if (dbManager.getType() === 'postgresql') {
        switch (type) {
            case 'monthly':
                dateFilter = "AND DATE_TRUNC('month', timestamp) = DATE_TRUNC('month', CURRENT_DATE)";
                break;
            case 'weekly':
                dateFilter = "AND timestamp >= DATE_TRUNC('week', CURRENT_DATE)";
                break;
            case 'daily':
                dateFilter = "AND DATE(timestamp) = CURRENT_DATE";
                break;
        }
    } else {
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
    }

    const sql = `
        SELECT u.username, u.first_name, u.photo_url, SUM(g.score) as total_score, COUNT(g.id) as games_played
        FROM users u
        JOIN game_records g ON u.id = g.user_id
        WHERE 1=1 ${dateFilter}
        GROUP BY u.id, u.username, u.first_name, u.photo_url
        ORDER BY total_score DESC
        LIMIT 50
    `;

    try {
        const leaderboard = await dbManager.query(sql);
        res.json({
            success: true,
            leaderboard
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// 提现API
app.post('/api/withdraw', async (req, res) => {
    const { userId, type, amount, account, realName } = req.body;

    const fee = Math.floor(amount * 0.03);
    const finalAmount = amount - fee;

    const encryptedAccount = encrypt(account);
    const encryptedRealName = encrypt(realName);

    try {
        const isPostgres = dbManager.getType() === 'postgresql';
        const params = isPostgres ?
            '$1, $2, $3, $4, $5, $6, $7' : '?, ?, ?, ?, ?, ?, ?';

        const withdrawalId = await dbManager.insert(
            `INSERT INTO withdrawal_records (user_id, type, amount, fee, final_amount, account, real_name)
             VALUES (${params})`,
            [userId, type, amount, fee, finalAmount, encryptedAccount, encryptedRealName]
        );

        res.json({
            success: true,
            withdrawalId,
            fee,
            finalAmount
        });
    } catch (error) {
        console.error('Failed to process withdrawal:', error);
        res.status(500).json({ error: 'Failed to process withdrawal' });
    }
});

// 邀请处理API
app.post('/api/invite/process', async (req, res) => {
    const { inviteCode, newUserId } = req.body;

    try {
        const paramIndex = dbManager.getType() === 'postgresql' ? '$1' : '?';
        const inviter = await dbManager.get(`SELECT id FROM users WHERE invite_code = ${paramIndex}`, [inviteCode]);

        if (!inviter) {
            return res.status(400).json({ error: 'Invalid invite code' });
        }

        const isPostgres = dbManager.getType() === 'postgresql';
        const params = isPostgres ? '$1, $2, $3' : '?, ?, ?';

        await dbManager.insert(
            `INSERT INTO invite_relations (inviter_id, invitee_id, invite_code)
             VALUES (${params})`,
            [inviter.id, newUserId, inviteCode]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Failed to process invite:', error);
        res.status(500).json({ error: 'Failed to process invite' });
    }
});

// 广告API
app.get('/api/ads/manual', (req, res) => {
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
    console.log(`Ad clicked: ${adId} by user ${userId} at ${new Date(timestamp)}`);
    res.json({ success: true });
});

// 用户分享API
app.post('/api/user/share', async (req, res) => {
    const { userId, timestamp } = req.body;

    try {
        const paramIndex = dbManager.getType() === 'postgresql' ? '$1' : '?';
        const user = await dbManager.get(`SELECT coins FROM users WHERE id = ${paramIndex}`, [userId]);

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        const shareReward = 5;
        const newCoins = user.coins + shareReward;

        const updateParam1 = dbManager.getType() === 'postgresql' ? '$1' : '?';
        const updateParam2 = dbManager.getType() === 'postgresql' ? '$2' : '?';

        await dbManager.run(`UPDATE users SET coins = ${updateParam1} WHERE id = ${updateParam2}`, [newCoins, userId]);

        res.json({
            success: true,
            reward: shareReward,
            newBalance: newCoins
        });
    } catch (error) {
        console.error('Failed to process share:', error);
        res.status(500).json({ error: 'Failed to process share' });
    }
});

// USDT汇率API
app.get('/api/exchange-rate/usdt', async (req, res) => {
    try {
        const usdtRate = 6.8; // 模拟汇率
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

// 静态文件服务
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 启动服务器（仅在非Vercel环境）
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🎮 消不停·万币赢 Server running on port ${PORT}`);
        console.log(`🌐 Game URL: http://localhost:${PORT}`);
        console.log(`🗄️  Database: ${dbManager.getType()}`);
        if (bot) {
            console.log('🤖 Telegram Bot is running');
        }
    });

    // 优雅关闭
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        dbManager.close();
        if (bot) {
            bot.stopPolling();
        }
        process.exit(0);
    });
}

// 导出app供Vercel使用
module.exports = app;