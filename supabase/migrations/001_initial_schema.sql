-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES users(id),

    -- 游戏数据
    current_level INTEGER DEFAULT 1,
    highest_score INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0, -- 秒
    games_played INTEGER DEFAULT 0,

    -- 经济数据
    wanhua_coins INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    total_withdrawn INTEGER DEFAULT 0,

    -- 道具库存
    hammer_count INTEGER DEFAULT 3,
    shuffle_count INTEGER DEFAULT 2,
    extra_moves_count INTEGER DEFAULT 1,
    hint_count INTEGER DEFAULT 5,

    -- 签到数据
    last_checkin_date DATE,
    checkin_streak INTEGER DEFAULT 0,
    total_checkins INTEGER DEFAULT 0,

    -- 状态和时间
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 游戏记录表
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    level INTEGER NOT NULL,
    score INTEGER NOT NULL,
    moves_used INTEGER NOT NULL,
    wanhua_coins_earned INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- 游戏时长（秒）
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 交易记录表
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('earn_game', 'earn_ad', 'earn_checkin', 'earn_invite', 'earn_share', 'spend_powerup', 'withdrawal')),
    amount INTEGER NOT NULL, -- 万花币数量（负数表示支出）
    description TEXT,
    metadata JSONB, -- 额外信息
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 提现申请表
CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL, -- 提现的万花币数量
    fee_amount INTEGER NOT NULL, -- 手续费
    net_amount DECIMAL(10,2) NOT NULL, -- 实际到账金额
    method TEXT NOT NULL CHECK (method IN ('alipay', 'trc20_usdt')),
    account_info JSONB NOT NULL, -- 账户信息

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    admin_note TEXT,
    processed_by UUID REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- 邀请记录表
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL REFERENCES users(id),
    invitee_id UUID NOT NULL REFERENCES users(id),
    reward_amount INTEGER DEFAULT 30, -- 邀请奖励
    is_rewarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rewarded_at TIMESTAMP WITH TIME ZONE
);

-- 分享记录表
CREATE TABLE shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    share_type TEXT NOT NULL CHECK (share_type IN ('private', 'group')),
    platform TEXT DEFAULT 'telegram',
    reward_amount INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 广告观看记录表
CREATE TABLE ad_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    ad_type TEXT NOT NULL CHECK (ad_type IN ('rewarded', 'interstitial', 'banner')),
    reward_amount INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 签到记录表
CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    checkin_date DATE NOT NULL,
    day_in_cycle INTEGER NOT NULL, -- 第几天（1-7）
    reward_amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, checkin_date)
);

-- 排行榜表（每日、每周、每月）
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start DATE NOT NULL,
    score INTEGER NOT NULL,
    wanhua_coins INTEGER NOT NULL,
    ranking INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, period_type, period_start)
);

-- 管理员广告表
CREATE TABLE custom_ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    video_url TEXT,
    target_url TEXT NOT NULL,

    -- 投放设置
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    priority INTEGER DEFAULT 1,

    -- 统计数据
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 广告投放记录
CREATE TABLE ad_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    ad_id UUID NOT NULL REFERENCES custom_ads(id),
    action_type TEXT NOT NULL CHECK (action_type IN ('view', 'click')),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 系统配置表
CREATE TABLE system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认系统配置
INSERT INTO system_config (key, value, description) VALUES
('withdrawal_fee_rate', '0.03', '提现手续费率'),
('min_withdrawal_amount', '1000', '最小提现万花币数量'),
('daily_ad_limit', '10', '每日广告观看上限'),
('daily_share_limit', '6', '每日分享奖励上限'),
('checkin_rewards', '[5, 10, 15, 25, 40, 60, 100]', '签到奖励数组'),
('powerup_costs', '{"hammer": 100, "shuffle": 80, "extra_moves": 60, "hint": 40}', '道具价格'),
('ad_rewards', '{"first_3": 15, "others": 10, "interstitial_bonus": 20}', '广告奖励设置');

-- 创建索引
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_invite_code ON users(invite_code);
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_completed_at ON game_sessions(completed_at);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_leaderboards_period ON leaderboards(period_type, period_start);
CREATE INDEX idx_leaderboards_ranking ON leaderboards(ranking);

-- 创建更新触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_ads_updated_at BEFORE UPDATE ON custom_ads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建邀请码生成函数
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
    char_count INTEGER := length(chars);
BEGIN
    -- 生成6位邀请码
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * char_count + 1)::integer, 1);
    END LOOP;

    -- 确保唯一性
    WHILE EXISTS (SELECT 1 FROM users WHERE invite_code = result) LOOP
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * char_count + 1)::integer, 1);
        END LOOP;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 创建用户注册函数
CREATE OR REPLACE FUNCTION create_user(
    p_telegram_id BIGINT,
    p_username TEXT DEFAULT NULL,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_inviter_code TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_inviter_id UUID := NULL;
    v_invite_code TEXT;
BEGIN
    -- 检查用户是否已存在
    SELECT id INTO v_user_id FROM users WHERE telegram_id = p_telegram_id;

    IF v_user_id IS NOT NULL THEN
        RETURN v_user_id;
    END IF;

    -- 生成邀请码
    v_invite_code := generate_invite_code();

    -- 查找邀请者
    IF p_inviter_code IS NOT NULL THEN
        SELECT id INTO v_inviter_id FROM users WHERE invite_code = p_inviter_code;
    END IF;

    -- 创建新用户
    INSERT INTO users (
        telegram_id, username, first_name, last_name, avatar_url,
        invite_code, invited_by
    ) VALUES (
        p_telegram_id, p_username, p_first_name, p_last_name, p_avatar_url,
        v_invite_code, v_inviter_id
    ) RETURNING id INTO v_user_id;

    -- 如果有邀请者，创建邀请记录
    IF v_inviter_id IS NOT NULL THEN
        INSERT INTO invitations (inviter_id, invitee_id)
        VALUES (v_inviter_id, v_user_id);
    END IF;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- 创建排行榜更新函数
CREATE OR REPLACE FUNCTION update_leaderboard(
    p_user_id UUID,
    p_score INTEGER,
    p_coins INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_today DATE := CURRENT_DATE;
    v_week_start DATE := v_today - INTERVAL '1 day' * EXTRACT(DOW FROM v_today)::INTEGER;
    v_month_start DATE := DATE_TRUNC('month', v_today)::DATE;
BEGIN
    -- 更新每日排行榜
    INSERT INTO leaderboards (user_id, period_type, period_start, score, wanhua_coins)
    VALUES (p_user_id, 'daily', v_today, p_score, p_coins)
    ON CONFLICT (user_id, period_type, period_start)
    DO UPDATE SET
        score = GREATEST(leaderboards.score, p_score),
        wanhua_coins = leaderboards.wanhua_coins + p_coins;

    -- 更新每周排行榜
    INSERT INTO leaderboards (user_id, period_type, period_start, score, wanhua_coins)
    VALUES (p_user_id, 'weekly', v_week_start, p_score, p_coins)
    ON CONFLICT (user_id, period_type, period_start)
    DO UPDATE SET
        score = GREATEST(leaderboards.score, p_score),
        wanhua_coins = leaderboards.wanhua_coins + p_coins;

    -- 更新每月排行榜
    INSERT INTO leaderboards (user_id, period_type, period_start, score, wanhua_coins)
    VALUES (p_user_id, 'monthly', v_month_start, p_score, p_coins)
    ON CONFLICT (user_id, period_type, period_start)
    DO UPDATE SET
        score = GREATEST(leaderboards.score, p_score),
        wanhua_coins = leaderboards.wanhua_coins + p_coins;
END;
$$ LANGUAGE plpgsql;

-- 创建RLS策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和修改自己的数据
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own game sessions" ON game_sessions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own game sessions" ON game_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own withdrawals" ON withdrawal_requests FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create own withdrawals" ON withdrawal_requests FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 公开数据的查看权限
CREATE POLICY "Public read access to leaderboards" ON leaderboards FOR SELECT TO public USING (true);
CREATE POLICY "Public read access to custom ads" ON custom_ads FOR SELECT TO public USING (is_active = true);