#!/bin/bash

# 消不停·万币赢 - 启动脚本
# 作者: @bjxc010
# 赞助: 北京修车【万花楼】

echo "🎮 消不停·万币赢 - 启动脚本"
echo "=================================="

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 16.0 或更高版本"
    echo "访问: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
echo "✅ Node.js 版本: $NODE_VERSION"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✅ npm 版本: $NPM_VERSION"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
fi

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  .env 文件不存在，正在创建..."
    cp .env.example .env
    echo "📝 请编辑 .env 文件，设置正确的配置参数"
    echo "重要配置项："
    echo "  - BOT_TOKEN: Telegram Bot Token"
    echo "  - GAME_URL: 游戏域名"
    echo "  - ENCRYPTION_KEY: 32位加密密钥"
    echo "  - ADMOB_*: AdMob广告配置"
    echo ""
    read -p "是否现在编辑 .env 文件？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
fi

# 检查数据库文件权限
if [ -f "game_data.db" ]; then
    echo "✅ 数据库文件存在"
else
    echo "📊 首次运行，将创建数据库"
fi

# 创建日志目录
mkdir -p logs

# 启动选项
echo ""
echo "🚀 启动选项："
echo "1) 开发模式 (npm run dev)"
echo "2) 生产模式 (npm start)"
echo "3) PM2管理模式 (推荐生产环境)"
echo "4) 退出"
echo ""

read -p "请选择启动方式 (1-4): " choice

case $choice in
    1)
        echo "🔧 启动开发模式..."
        echo "访问地址: http://localhost:3000"
        npm run dev
        ;;
    2)
        echo "🚀 启动生产模式..."
        echo "访问地址: http://localhost:3000"
        NODE_ENV=production npm start
        ;;
    3)
        # 检查PM2
        if ! command -v pm2 &> /dev/null; then
            echo "❌ PM2 未安装，正在安装..."
            npm install -g pm2
        fi

        echo "🔄 使用PM2启动..."
        pm2 stop xiaobuting-game 2>/dev/null || true
        pm2 delete xiaobuting-game 2>/dev/null || true
        pm2 start server/app.js --name xiaobuting-game --env production
        pm2 logs xiaobuting-game --lines 20

        echo ""
        echo "📊 PM2管理命令："
        echo "  查看状态: pm2 status"
        echo "  查看日志: pm2 logs xiaobuting-game"
        echo "  重启应用: pm2 restart xiaobuting-game"
        echo "  停止应用: pm2 stop xiaobuting-game"
        echo "  开机自启: pm2 startup && pm2 save"
        ;;
    4)
        echo "👋 再见！"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎉 启动完成！"
echo ""
echo "📱 Telegram Bot设置："
echo "  1. 找 @BotFather 创建Bot"
echo "  2. 获取Token并填入.env文件"
echo "  3. 设置Web App URL"
echo "  4. 发送 /start 测试Bot"
echo ""
echo "💡 技术支持："
echo "  开发者: @bjxc010"
echo "  赞助商: 北京修车【万花楼】"
echo "  GitHub: https://github.com/your-username/Telegram-xiaobuting-wanbiying"
echo ""
echo "💰 每天玩游戏，万花币提现支付宝和USDT！"