@echo off
chcp 65001
echo =====================================================
echo         消不停·万币赢 - 自动部署脚本
echo =====================================================
echo.

echo 🚀 开始部署检查...
echo.

REM 检查是否存在关键文件
if not exist "index.html" (
    echo ❌ 错误：找不到 index.html 文件
    echo 请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "js" (
    echo ❌ 错误：找不到 js 文件夹
    pause
    exit /b 1
)

if not exist "css" (
    echo ❌ 错误：找不到 css 文件夹
    pause
    exit /b 1
)

echo ✅ 文件检查完成
echo.

echo 📋 部署选项：
echo 1. 启动本地测试服务器（推荐新手）
echo 2. 创建部署包（用于上传到服务器）
echo 3. Git 仓库初始化（用于GitHub部署）
echo 4. 生成Nginx配置文件
echo 5. 退出
echo.

set /p choice="请选择部署方式 (1-5): "

if "%choice%"=="1" goto local_server
if "%choice%"=="2" goto create_package
if "%choice%"=="3" goto git_init
if "%choice%"=="4" goto nginx_config
if "%choice%"=="5" goto end

echo ❌ 无效选择，请重新运行脚本
pause
exit /b 1

:local_server
echo.
echo 🏠 启动本地测试服务器...
echo.

REM 检查是否安装了Python
python --version >nul 2>&1
if %errorlevel%==0 (
    echo ✅ 检测到 Python，启动服务器...
    echo.
    echo 🌐 服务器将在 http://localhost:8000 启动
    echo 📱 请在浏览器中访问上述地址测试游戏
    echo 🛑 按 Ctrl+C 停止服务器
    echo.
    python -m http.server 8000
) else (
    echo ❌ 未检测到 Python
    echo.
    echo 💡 建议安装 Visual Studio Code + Live Server 插件
    echo    1. 下载 VS Code: https://code.visualstudio.com/
    echo    2. 安装 Live Server 插件
    echo    3. 右键 index.html → Open with Live Server
    echo.
)
goto end

:create_package
echo.
echo 📦 创建部署包...
echo.

REM 创建部署文件夹
if exist "deployment_package" rmdir /s /q "deployment_package"
mkdir "deployment_package"

echo 📋 复制文件...
xcopy "*.html" "deployment_package\" /Y
xcopy "*.json" "deployment_package\" /Y
xcopy "*.md" "deployment_package\" /Y
xcopy "css" "deployment_package\css\" /E /I /Y
xcopy "js" "deployment_package\js\" /E /I /Y
if exist "assets" xcopy "assets" "deployment_package\assets\" /E /I /Y

echo.
echo ✅ 部署包创建完成！
echo 📁 位置：deployment_package 文件夹
echo.
echo 📋 接下来的步骤：
echo 1. 将 deployment_package 文件夹压缩为 .zip 文件
echo 2. 上传到你选择的托管平台：
echo    - Netlify: 直接拖拽 zip 文件
echo    - GitHub: 上传文件到仓库
echo    - 服务器: 使用 SFTP 上传到 /var/www/html/
echo.
goto end

:git_init
echo.
echo 📚 Git 仓库初始化...
echo.

REM 检查是否安装了Git
git --version >nul 2>&1
if not %errorlevel%==0 (
    echo ❌ 未检测到 Git
    echo 请先安装 Git: https://git-scm.com/
    goto end
)

REM 检查是否已经是Git仓库
if exist ".git" (
    echo ⚠️  当前目录已经是 Git 仓库
    echo.
    set /p continue="是否继续添加和提交文件? (y/n): "
    if /i not "%continue%"=="y" goto end
) else (
    echo 🔧 初始化 Git 仓库...
    git init
)

echo 📋 添加文件...
git add .

echo 💾 创建提交...
git commit -m "🎮 消不停·万币赢 - 初始化游戏项目"

echo.
echo ✅ Git 仓库配置完成！
echo.
echo 📋 GitHub 部署步骤：
echo 1. 在 GitHub 创建新仓库
echo 2. 运行以下命令连接仓库：
echo    git remote add origin https://github.com/你的用户名/仓库名.git
echo    git push -u origin main
echo 3. 在 GitHub 仓库设置中启用 Pages
echo.
goto end

:nginx_config
echo.
echo 🔧 生成 Nginx 配置文件...
echo.

set /p domain="请输入域名 (或按回车使用默认): "
if "%domain%"=="" set domain="你的域名或服务器IP"

echo 📝 生成配置文件...
(
echo server {
echo     listen 80;
echo     server_name %domain%;
echo.
echo     root /var/www/html;
echo     index index.html index.htm;
echo.
echo     # 基本位置配置
echo     location / {
echo         try_files $uri $uri/ =404;
echo     }
echo.
echo     # 启用 gzip 压缩
echo     gzip on;
echo     gzip_vary on;
echo     gzip_min_length 1024;
echo     gzip_types text/plain text/css text/xml text/javascript
echo                application/javascript application/json application/xml+rss;
echo.
echo     # 静态资源缓存
echo     location ~* \.(css^|js^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf^|eot)$ {
echo         expires 1y;
echo         add_header Cache-Control "public, immutable";
echo         access_log off;
echo     }
echo.
echo     # 安全设置
echo     add_header X-Frame-Options "SAMEORIGIN" always;
echo     add_header X-Content-Type-Options "nosniff" always;
echo     add_header X-XSS-Protection "1; mode=block" always;
echo.
echo     # 禁止访问隐藏文件
echo     location ~ /\. {
echo         deny all;
echo         access_log off;
echo         log_not_found off;
echo     }
echo }
) > nginx.conf

echo ✅ Nginx 配置文件已生成：nginx.conf
echo.
echo 📋 服务器部署步骤：
echo 1. 将此文件复制到服务器：/etc/nginx/sites-available/xiaobuting
echo 2. 创建软链接：sudo ln -s /etc/nginx/sites-available/xiaobuting /etc/nginx/sites-enabled/
echo 3. 测试配置：sudo nginx -t
echo 4. 重载配置：sudo systemctl reload nginx
echo.
goto end

:end
echo.
echo 🎉 操作完成！
echo.
echo 📞 需要帮助？
echo    Telegram: @bjxc010
echo    部署文档: DEPLOYMENT_GUIDE.md
echo.
pause