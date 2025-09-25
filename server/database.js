const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbType = process.env.DATABASE_TYPE || 'sqlite';
        this.supabase = null;
        this.initializeDatabase();
    }

    initializeDatabase() {
        if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://')) {
            // PostgreSQL/Supabase 配置
            this.dbType = 'postgresql';
            this.db = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });

            // 如果是Supabase，同时初始化Supabase客户端
            if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
                this.supabase = createClient(
                    process.env.SUPABASE_URL,
                    process.env.SUPABASE_ANON_KEY
                );
            }

            console.log('🐘 PostgreSQL database initialized');
        } else {
            // SQLite 配置（本地开发）
            this.dbType = 'sqlite';
            this.db = new sqlite3.Database('./game_data.db');
            console.log('📁 SQLite database initialized');
        }

        this.createTables();
    }

    async createTables() {
        if (this.dbType === 'postgresql') {
            await this.createPostgreSQLTables();
        } else {
            await this.createSQLiteTables();
        }
    }

    async createPostgreSQLTables() {
        const queries = [
            // 用户表
            `CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // 游戏记录表
            `CREATE TABLE IF NOT EXISTS game_records (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                level INTEGER,
                score INTEGER,
                moves INTEGER,
                coins_earned INTEGER,
                completed BOOLEAN,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // 签到记录表
            `CREATE TABLE IF NOT EXISTS checkin_records (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                date DATE,
                reward INTEGER,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // 提现记录表
            `CREATE TABLE IF NOT EXISTS withdrawal_records (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                type TEXT,
                amount INTEGER,
                fee INTEGER,
                final_amount DECIMAL,
                account TEXT,
                real_name TEXT,
                status TEXT DEFAULT 'pending',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // 邀请关系表
            `CREATE TABLE IF NOT EXISTS invite_relations (
                id SERIAL PRIMARY KEY,
                inviter_id INTEGER REFERENCES users(id),
                invitee_id INTEGER REFERENCES users(id),
                invite_code TEXT,
                reward_claimed BOOLEAN DEFAULT FALSE,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,

            // 创建索引
            `CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id)`,
            `CREATE INDEX IF NOT EXISTS idx_game_records_user_id ON game_records(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_checkin_records_user_id ON checkin_records(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_withdrawal_records_user_id ON withdrawal_records(user_id)`
        ];

        try {
            for (const query of queries) {
                await this.db.query(query);
            }
            console.log('✅ PostgreSQL tables created successfully');
        } catch (error) {
            console.error('❌ Failed to create PostgreSQL tables:', error);
        }
    }

    createSQLiteTables() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // 用户表
                this.db.run(`CREATE TABLE IF NOT EXISTS users (
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
                this.db.run(`CREATE TABLE IF NOT EXISTS game_records (
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
                this.db.run(`CREATE TABLE IF NOT EXISTS checkin_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    date DATE,
                    reward INTEGER,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`);

                // 提现记录表
                this.db.run(`CREATE TABLE IF NOT EXISTS withdrawal_records (
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
                this.db.run(`CREATE TABLE IF NOT EXISTS invite_relations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    inviter_id INTEGER,
                    invitee_id INTEGER,
                    invite_code TEXT,
                    reward_claimed BOOLEAN DEFAULT FALSE,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(inviter_id) REFERENCES users(id),
                    FOREIGN KEY(invitee_id) REFERENCES users(id)
                )`);

                console.log('✅ SQLite tables created successfully');
                resolve();
            });
        });
    }

    // 统一的查询接口
    async query(sql, params = []) {
        if (this.dbType === 'postgresql') {
            try {
                const result = await this.db.query(sql, params);
                return result.rows;
            } catch (error) {
                console.error('PostgreSQL query error:', error);
                throw error;
            }
        } else {
            return new Promise((resolve, reject) => {
                this.db.all(sql, params, (err, rows) => {
                    if (err) {
                        console.error('SQLite query error:', err);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        }
    }

    // 插入数据并返回ID
    async insert(sql, params = []) {
        if (this.dbType === 'postgresql') {
            try {
                const result = await this.db.query(sql + ' RETURNING id', params);
                return result.rows[0].id;
            } catch (error) {
                console.error('PostgreSQL insert error:', error);
                throw error;
            }
        } else {
            return new Promise((resolve, reject) => {
                this.db.run(sql, params, function(err) {
                    if (err) {
                        console.error('SQLite insert error:', err);
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                });
            });
        }
    }

    // 执行更新操作
    async run(sql, params = []) {
        if (this.dbType === 'postgresql') {
            try {
                const result = await this.db.query(sql, params);
                return result.rowCount;
            } catch (error) {
                console.error('PostgreSQL run error:', error);
                throw error;
            }
        } else {
            return new Promise((resolve, reject) => {
                this.db.run(sql, params, function(err) {
                    if (err) {
                        console.error('SQLite run error:', err);
                        reject(err);
                    } else {
                        resolve(this.changes);
                    }
                });
            });
        }
    }

    // 获取单行数据
    async get(sql, params = []) {
        const rows = await this.query(sql, params);
        return rows.length > 0 ? rows[0] : null;
    }

    // 关闭数据库连接
    async close() {
        if (this.dbType === 'postgresql') {
            await this.db.end();
        } else {
            this.db.close();
        }
    }

    // 获取数据库类型
    getType() {
        return this.dbType;
    }

    // 获取Supabase客户端
    getSupabase() {
        return this.supabase;
    }
}

module.exports = new DatabaseManager();