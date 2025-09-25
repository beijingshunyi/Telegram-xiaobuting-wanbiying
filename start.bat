@echo off
chcp 65001 >nul
cls

echo ===============================================
echo 🎮 消不停·万币赢 - Windows启动脚本
echo ===============================================
echo.

:: 检查Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js 16.0 或更高版本
    echo 访问: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✅ Node.js 版本: %NODE_VERSION%

:: 检查npm
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安装
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo ✅ npm 版本: %NPM_VERSION%

:: 检查依赖
if not exist "node_modules" (
    echo.
    echo 📦 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
)

:: 检查环境变量文件
if not exist ".env" (
    echo.
    echo ⚠️  .env 文件不存在，正在创建...
    copy ".env.example" ".env" >nul
    echo 📝 请编辑 .env 文件，设置正确的配置参数
    echo 重要配置项：
    echo   - BOT_TOKEN: Telegram Bot Token
    echo   - GAME_URL: 游戏域名
    echo   - ENCRYPTION_KEY: 32位加密密钥
    echo   - ADMOB_*: AdMob广告配置
    echo.
    set /p "edit=是否现在编辑 .env 文件？(y/n): "
    if /i "%edit%"=="y" (
        notepad .env
    )
)

:: 创建日志目录
if not exist "logs" mkdir logs

:: 检查数据库
if exist "game_data.db" (
    echo ✅ 数据库文件存在
) else (
    echo 📊 首次运行，将创建数据库
)

echo.
echo 🚀 启动选项：
echo 1^) 开发模式 ^(npm run dev^)
echo 2^) 生产模式 ^(npm start^)
echo 3^) 查看帮助
echo 4^) 退出
echo.

set /p "choice=请选择启动方式 (1-4): "

if "%choice%"=="1" (
    echo.
    echo 🔧 启动开发模式...
    echo 访问地址: http://localhost:3000
    echo.
    npm run dev
) else if "%choice%"=="2" (
    echo.
    echo 🚀 启动生产模式...
    echo 访问地址: http://localhost:3000
    echo.
    set NODE_ENV=production
    npm start
) else if "%choice%"=="3" (
    echo.
    echo 📖 帮助信息：
    echo.
    echo 🔧 开发环境设置：
    echo   1. 编辑 .env 文件设置配置
    echo   2. 运行 npm run dev 启动开发服务器
    echo   3. 浏览器访问 http://localhost:3000
    echo.
    echo 📱 Telegram Bot设置：
    echo   1. 找 @BotFather 创建Bot
    echo   2. 获取Token并填入 BOT_TOKEN
    echo   3. 设置Web App URL为你的域名
    echo   4. 发送 /start 命令测试
    echo.
    echo 🌐 部署到生产环境：
    echo   1. 参考 deploy.md 文档
    echo   2. 推荐使用 Railway 或 Vercel
    echo   3. 配置域名和SSL证书
    echo.
    echo 💡 技术支持：
    echo   开发者: @bjxc010
    echo   赞助商: 北京修车【万花楼】
    echo.
    pause
) else if "%choice%"=="4" (
    echo.
    echo 👋 再见！
    exit /b 0
) else (
    echo.
    echo ❌ 无效选择
    pause
    exit /b 1
)

echo.
echo 🎉 启动完成！
echo.
echo 📱 下一步操作：
echo   1. 设置Telegram Bot
echo   2. 配置AdMob广告
echo   3. 测试游戏功能
echo   4. 部署到生产环境
echo.
echo 💰 每天玩游戏，万花币提现支付宝和USDT！
echo.
pause