#!/bin/bash

# 消不停·万币赢 - Linux/Mac 部署脚本
# 使用方法：chmod +x deploy.sh && ./deploy.sh

set -e

echo "====================================================="
echo "        消不停·万币赢 - 自动部署脚本"
echo "====================================================="
echo

echo "🚀 开始部署检查..."
echo

# 检查关键文件
if [ ! -f "index.html" ]; then
    echo "❌ 错误：找不到 index.html 文件"
    echo "请确保在项目根目录运行此脚本"
    exit 1
fi

if [ ! -d "js" ]; then
    echo "❌ 错误：找不到 js 文件夹"
    exit 1
fi

if [ ! -d "css" ]; then
    echo "❌ 错误：找不到 css 文件夹"
    exit 1
fi

echo "✅ 文件检查完成"
echo

# 部署选项菜单
show_menu() {
    echo "📋 部署选项："
    echo "1. 启动本地测试服务器"
    echo "2. 创建部署包"
    echo "3. Git 仓库初始化"
    echo "4. 生成Nginx配置文件"
    echo "5. 一键服务器部署（需要sudo权限）"
    echo "6. 退出"
    echo
}

# 本地服务器
start_local_server() {
    echo
    echo "🏠 启动本地测试服务器..."
    echo

    # 检查Python版本
    if command -v python3 &> /dev/null; then
        echo "✅ 检测到 Python3，启动服务器..."
        echo
        echo "🌐 服务器将在 http://localhost:8000 启动"
        echo "📱 请在浏览器中访问上述地址测试游戏"
        echo "🛑 按 Ctrl+C 停止服务器"
        echo
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        echo "✅ 检测到 Python2，启动服务器..."
        echo
        echo "🌐 服务器将在 http://localhost:8000 启动"
        echo "📱 请在浏览器中访问上述地址测试游戏"
        echo "🛑 按 Ctrl+C 停止服务器"
        echo
        python -m SimpleHTTPServer 8000
    else
        echo "❌ 未检测到 Python"
        echo
        echo "安装方法："
        echo "  Ubuntu/Debian: sudo apt install python3"
        echo "  CentOS/RHEL:   sudo yum install python3"
        echo "  macOS:         brew install python3"
        echo
    fi
}

# 创建部署包
create_package() {
    echo
    echo "📦 创建部署包..."
    echo

    # 移除旧的部署包
    if [ -d "deployment_package" ]; then
        rm -rf deployment_package
    fi

    mkdir deployment_package

    echo "📋 复制文件..."

    # 复制HTML文件
    cp *.html deployment_package/ 2>/dev/null || true

    # 复制JSON文件
    cp *.json deployment_package/ 2>/dev/null || true

    # 复制Markdown文件
    cp *.md deployment_package/ 2>/dev/null || true

    # 复制目录
    cp -r css deployment_package/
    cp -r js deployment_package/

    if [ -d "assets" ]; then
        cp -r assets deployment_package/
    fi

    echo
    echo "✅ 部署包创建完成！"
    echo "📁 位置：deployment_package 文件夹"
    echo
    echo "📋 接下来的步骤："
    echo "1. 压缩部署包："
    echo "   tar -czf xiaobuting-game.tar.gz deployment_package/*"
    echo "2. 上传到托管平台："
    echo "   - Netlify: 拖拽 tar.gz 文件"
    echo "   - 服务器: scp xiaobuting-game.tar.gz user@server:/var/www/html/"
    echo
}

# Git初始化
git_init() {
    echo
    echo "📚 Git 仓库初始化..."
    echo

    # 检查Git是否安装
    if ! command -v git &> /dev/null; then
        echo "❌ 未检测到 Git"
        echo "安装方法："
        echo "  Ubuntu/Debian: sudo apt install git"
        echo "  CentOS/RHEL:   sudo yum install git"
        echo "  macOS:         brew install git"
        return
    fi

    # 检查是否已经是Git仓库
    if [ -d ".git" ]; then
        echo "⚠️  当前目录已经是 Git 仓库"
        echo
        read -p "是否继续添加和提交文件? (y/n): " continue
        if [ "$continue" != "y" ] && [ "$continue" != "Y" ]; then
            return
        fi
    else
        echo "🔧 初始化 Git 仓库..."
        git init

        # 创建.gitignore
        cat > .gitignore << EOF
# 日志文件
*.log
npm-debug.log*

# 依赖目录
node_modules/

# 构建目录
dist/
build/

# 系统文件
.DS_Store
Thumbs.db

# IDE文件
.vscode/
.idea/
*.swp
*.swo

# 部署文件
deployment_package/
EOF
        echo "📝 创建了 .gitignore 文件"
    fi

    echo "📋 添加文件..."
    git add .

    echo "💾 创建提交..."
    git commit -m "🎮 消不停·万币赢 - 初始化游戏项目

✨ 功能特点:
- 像素级复刻天天爱消除
- 8x8棋盘三消游戏
- 万花币经济系统
- 提现功能(支付宝/USDT)
- Telegram集成
- 全服排行榜系统
- AdMon广告集成
- 完整特效动画系统

🚀 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

    echo
    echo "✅ Git 仓库配置完成！"
    echo
    echo "📋 GitHub 部署步骤："
    echo "1. 在 GitHub 创建新仓库"
    echo "2. 运行以下命令连接仓库："
    echo "   git remote add origin https://github.com/你的用户名/仓库名.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
    echo "3. 在 GitHub 仓库 Settings → Pages 中启用页面"
    echo
}

# 生成Nginx配置
generate_nginx_config() {
    echo
    echo "🔧 生成 Nginx 配置文件..."
    echo

    read -p "请输入域名 (按回车使用默认): " domain
    if [ -z "$domain" ]; then
        domain="你的域名或服务器IP"
    fi

    echo "📝 生成配置文件..."

    cat > nginx.conf << EOF
server {
    listen 80;
    server_name $domain;

    root /var/www/html;
    index index.html index.htm;

    # 基本位置配置
    location / {
        try_files \$uri \$uri/ =404;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # 静态资源缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # 安全设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # 错误页面
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}

# HTTPS 重定向 (如果需要SSL)
# server {
#     listen 443 ssl http2;
#     server_name $domain;
#
#     ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
#
#     # 其他配置同上...
# }
EOF

    echo "✅ Nginx 配置文件已生成：nginx.conf"
    echo
    echo "📋 服务器部署步骤："
    echo "1. 复制到服务器：sudo cp nginx.conf /etc/nginx/sites-available/xiaobuting"
    echo "2. 启用站点：sudo ln -s /etc/nginx/sites-available/xiaobuting /etc/nginx/sites-enabled/"
    echo "3. 测试配置：sudo nginx -t"
    echo "4. 重载配置：sudo systemctl reload nginx"
    echo
    echo "🔒 SSL证书配置："
    echo "sudo apt install certbot python3-certbot-nginx"
    echo "sudo certbot --nginx -d $domain"
    echo
}

# 一键服务器部署
deploy_to_server() {
    echo
    echo "🚀 一键服务器部署..."
    echo

    # 检查是否有sudo权限
    if ! sudo -n true 2>/dev/null; then
        echo "❌ 此功能需要 sudo 权限"
        return 1
    fi

    echo "📋 安装依赖..."

    # 检测操作系统
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        sudo apt update
        sudo apt install -y nginx
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        sudo yum install -y epel-release
        sudo yum install -y nginx
    else
        echo "❌ 不支持的操作系统"
        return 1
    fi

    echo "🔧 配置 Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx

    echo "📁 复制文件..."
    sudo cp -r . /var/www/html/
    sudo chown -R www-data:www-data /var/www/html/
    sudo chmod -R 755 /var/www/html/

    echo "🔥 配置防火墙..."
    if command -v ufw &> /dev/null; then
        sudo ufw allow 'Nginx Full'
        sudo ufw --force enable
    fi

    echo "🔄 重启服务..."
    sudo systemctl restart nginx

    echo
    echo "✅ 部署完成！"
    echo "🌐 访问地址：http://$(curl -s ifconfig.me)"
    echo
}

# 主循环
while true; do
    show_menu
    read -p "请选择部署方式 (1-6): " choice

    case $choice in
        1)
            start_local_server
            ;;
        2)
            create_package
            ;;
        3)
            git_init
            ;;
        4)
            generate_nginx_config
            ;;
        5)
            deploy_to_server
            ;;
        6)
            echo
            echo "🎉 感谢使用部署脚本！"
            echo
            echo "📞 需要帮助？"
            echo "   Telegram: @bjxc010"
            echo "   部署文档: DEPLOYMENT_GUIDE.md"
            echo
            exit 0
            ;;
        *)
            echo "❌ 无效选择，请输入 1-6"
            ;;
    esac

    echo
    echo "按回车键继续..."
    read
done