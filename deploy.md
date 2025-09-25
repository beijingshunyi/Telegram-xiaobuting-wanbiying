# 部署指南

本文档详细介绍了如何将消不停·万币赢游戏部署到各种平台。

## 🚀 部署方案选择

### 免费方案（适合测试）
- **前端**：GitHub Pages / Netlify
- **后端**：Railway / Render 免费额度
- **数据库**：SQLite（本地文件）

### 推荐方案（适合生产）
- **前端**：Vercel / Netlify Pro
- **后端**：Railway / Render
- **数据库**：PlanetScale MySQL / Supabase PostgreSQL

### 企业方案（适合大规模）
- **前端**：CDN + 云存储
- **后端**：VPS / 云服务器集群
- **数据库**：云数据库集群
- **缓存**：Redis集群

## 📋 部署前准备

### 1. Telegram Bot设置

1. 找 [@BotFather](https://t.me/botfather) 创建机器人
```
/newbot
Bot名称: 消不停·万币赢 Bot
Bot用户名: xiaobuting_wanbiying_bot
```

2. 获取Bot Token
```
/token
选择你的Bot -> 复制Token
```

3. 设置Web App
```
/setdomain
选择Bot -> 输入域名: your-domain.com
```

4. 设置命令菜单
```
/setcommands
选择Bot -> 输入命令:
start - 🎮 开始游戏
help - ❓ 获取帮助
status - 📊 查看状态
withdraw - 💰 申请提现
invite - 👥 邀请好友
support - 📞 联系客服
```

### 2. AdMob广告设置

1. 注册 [Google AdMob](https://admob.google.com)
2. 创建新应用
3. 创建广告单元：
   - 横幅广告：Banner
   - 激励广告：Rewarded

### 3. 域名和SSL证书

Telegram要求Web App必须使用HTTPS，建议：
- 购买域名
- 使用免费SSL证书（Let's Encrypt）
- 或使用Cloudflare免费SSL

## 🌐 Railway部署（推荐）

### 优势
- 免费额度充足
- 自动CI/CD
- 内置数据库
- 简单易用

### 部署步骤

1. **Fork代码仓库**
```bash
# Fork到你的GitHub账号
https://github.com/your-username/Telegram-xiaobuting-wanbiying
```

2. **连接Railway**
- 访问 [Railway](https://railway.app)
- 使用GitHub登录
- 点击 "New Project"
- 选择 "Deploy from GitHub repo"
- 选择你的仓库

3. **配置环境变量**
```bash
NODE_ENV=production
PORT=3000
BOT_TOKEN=your_telegram_bot_token
GAME_URL=https://your-app.up.railway.app
ENCRYPTION_KEY=your-32-character-encryption-key
ADMOB_BANNER_ID=ca-app-pub-6402806742664594/3631141010
ADMOB_REWARD_ID=ca-app-pub-6402806742664594/4856592778
```

4. **自定义域名（可选）**
- 在Railway控制台点击"Settings"
- 点击"Domains"
- 添加自定义域名

5. **部署完成**
- Railway会自动构建和部署
- 访问分配的URL测试游戏

## ☁️ Vercel + PlanetScale部署

### 适用场景
- 高并发需求
- 全球CDN加速
- Serverless架构

### 前端部署到Vercel

1. **安装Vercel CLI**
```bash
npm install -g vercel
```

2. **配置vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/app.js",
      "use": "@vercel/node"
    },
    {
      "src": "index.html",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/app.js"
    },
    {
      "src": "/(.*)",
      "dest": "$1"
    }
  ]
}
```

3. **部署**
```bash
vercel --prod
```

### 数据库迁移到PlanetScale

1. **注册PlanetScale账号**
2. **创建数据库**
3. **获取连接信息**
4. **更新数据库配置**

## 🖥️ VPS自建部署

### 服务器要求
- CPU: 1核以上
- 内存: 512MB以上
- 存储: 10GB以上
- 系统: Ubuntu 20.04+

### 部署脚本

```bash
#!/bin/bash

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装Nginx
sudo apt install nginx -y

# 安装PM2
npm install -g pm2

# 克隆代码
git clone https://github.com/your-username/Telegram-xiaobuting-wanbiying.git
cd Telegram-xiaobuting-wanbiying

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
# 编辑.env文件设置正确的值

# 启动应用
pm2 start server/app.js --name xiaobuting-game

# 配置开机自启
pm2 startup
pm2 save

# 配置Nginx反向代理
sudo tee /etc/nginx/sites-available/xiaobuting-game << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/xiaobuting-game /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 安装SSL证书（Let's Encrypt）
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com

echo "部署完成！访问 https://your-domain.com 测试游戏"
```

## 📊 监控和维护

### 日志监控

```bash
# PM2日志查看
pm2 logs xiaobuting-game

# 系统资源监控
pm2 monit

# Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# 应用错误日志
tail -f logs/app.log
```

### 数据库备份

```bash
#!/bin/bash
# 数据库备份脚本

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backup/xiaobuting"
DB_FILE="game_data.db"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
cp $DB_FILE "$BACKUP_DIR/game_data_$DATE.db"

# 保留最近7天的备份
find $BACKUP_DIR -name "game_data_*.db" -type f -mtime +7 -delete

echo "数据库备份完成: game_data_$DATE.db"
```

### 性能优化

1. **启用Gzip压缩**
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

2. **静态资源缓存**
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, no-transform";
}
```

3. **限制请求频率**
```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location /api {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
    }
}
```

## 🔧 故障排除

### 常见问题

1. **Telegram Web App无法打开**
   - 检查域名SSL证书
   - 确认Bot设置正确
   - 检查服务器防火墙

2. **数据库连接失败**
   - 检查数据库文件权限
   - 确认环境变量配置
   - 查看应用日志

3. **广告无法显示**
   - 检查AdMob配置
   - 确认广告ID正确
   - 检查网络连接

4. **提现功能异常**
   - 检查加密密钥配置
   - 确认支付接口设置
   - 查看交易日志

### 调试命令

```bash
# 检查应用状态
pm2 status

# 重启应用
pm2 restart xiaobuting-game

# 查看实时日志
pm2 logs xiaobuting-game --lines 100

# 检查数据库
sqlite3 game_data.db ".tables"

# 测试API接口
curl -X GET http://localhost:3000/api/user/123456

# 检查Nginx配置
sudo nginx -t

# 重新加载Nginx
sudo systemctl reload nginx
```

## 📈 扩容指南

当用户量增长时，可以按以下方式扩容：

### 水平扩容
1. 部署多个应用实例
2. 使用Nginx负载均衡
3. 分离数据库到专用服务器

### 垂直扩容
1. 增加服务器配置
2. 优化数据库索引
3. 使用Redis缓存

### 微服务拆分
1. 游戏逻辑服务
2. 用户管理服务
3. 支付处理服务
4. 消息推送服务

## 🔐 安全配置

### 服务器安全
```bash
# 创建非root用户
sudo useradd -m -s /bin/bash gameuser
sudo usermod -aG sudo gameuser

# 配置SSH密钥登录
ssh-copy-id gameuser@your-server

# 禁用密码登录
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 安装防火墙
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
```

### 应用安全
- 定期更新依赖包
- 使用HTTPS加密传输
- 实施API请求限制
- 敏感数据加密存储

## 📞 技术支持

如果在部署过程中遇到问题，可以联系：

- **开发者Telegram**: [@bjxc010](https://t.me/bjxc010)
- **技术支持群**: [加入群聊](https://t.me/xiaobutingwanbiying_support)
- **GitHub Issues**: [提交问题](https://github.com/your-username/Telegram-xiaobuting-wanbiying/issues)

---

祝你部署顺利！🎉