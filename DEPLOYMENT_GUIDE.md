# 消不停·万币赢 - 详细部署手册

## 📋 目录
1. [准备工作](#准备工作)
2. [本地测试部署](#本地测试部署)
3. [GitHub Pages 免费部署](#github-pages-免费部署)
4. [Netlify 免费部署](#netlify-免费部署)
5. [Vercel 免费部署](#vercel-免费部署)
6. [服务器部署](#服务器部署)
7. [域名配置](#域名配置)
8. [故障排除](#故障排除)

---

## 🛠️ 准备工作

### 1.1 检查项目文件
确保你的项目文件夹包含以下文件：
```
Telegram-xiaobuting-wanbiying/
├── index.html                    # 主页面
├── manifest.json                 # PWA配置
├── css/                          # 样式文件夹
├── js/                           # JavaScript文件夹
├── assets/                       # 资源文件夹
└── DEPLOYMENT_GUIDE.md           # 本部署手册
```

### 1.2 必备软件安装

**对于完全新手，我推荐先从本地测试开始：**

#### Windows用户：
1. **下载并安装 Visual Studio Code**
   - 访问：https://code.visualstudio.com/
   - 点击 "Download for Windows"
   - 下载完成后双击安装，全部选择默认设置

2. **安装 Live Server 插件**
   - 打开 VS Code
   - 点击左侧的扩展图标（四个方块）
   - 搜索 "Live Server"
   - 点击 "Ritwick Dey" 开发的 Live Server
   - 点击 "Install"

---

## 🏠 本地测试部署

### 2.1 使用 VS Code + Live Server（推荐新手）

**步骤1：打开项目**
1. 打开 VS Code
2. 点击 "File" → "Open Folder"
3. 选择你的 `Telegram-xiaobuting-wanbiying` 文件夹
4. 点击 "选择文件夹"

**步骤2：启动本地服务器**
1. 在 VS Code 中右键点击 `index.html`
2. 选择 "Open with Live Server"
3. 浏览器会自动打开，地址类似：`http://127.0.0.1:5500`

**步骤3：测试游戏**
1. 检查游戏是否正常加载
2. 测试点击、滑动等功能
3. 检查控制台是否有错误（F12 → Console）

### 2.2 使用 Python 简易服务器

**如果你已经安装了 Python：**

```bash
# 在项目文件夹中打开命令提示符
# Windows: Shift + 右键 → "在此处打开 PowerShell 窗口"

# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```

然后访问：http://localhost:8000

---

## 🌐 GitHub Pages 免费部署

### 3.1 创建 GitHub 账号
1. 访问：https://github.com
2. 点击 "Sign up"
3. 填写用户名、邮箱、密码
4. 验证邮箱

### 3.2 创建仓库

**方法一：网页上传（推荐新手）**

1. **创建新仓库**
   - 登录 GitHub
   - 点击右上角 "+" → "New repository"
   - Repository name：`xiaobuting-game`（可自定义）
   - 选择 "Public"
   - ✅ 勾选 "Add a README file"
   - 点击 "Create repository"

2. **上传文件**
   - 在新创建的仓库页面，点击 "uploading an existing file"
   - 将你的所有项目文件拖拽到上传区域
   - **重要**：不要上传 `.git` 文件夹（如果有的话）
   - 在 "Commit changes" 部分填写：
     - Title: `初始化游戏项目`
     - Description: `上传消不停万币赢游戏文件`
   - 点击 "Commit changes"

3. **启用 GitHub Pages**
   - 在仓库页面，点击 "Settings" 选项卡
   - 向下滚动找到 "Pages" 部分
   - Source 选择：`Deploy from a branch`
   - Branch 选择：`main`
   - Folder 选择：`/ (root)`
   - 点击 "Save"

4. **获取访问链接**
   - 等待1-2分钟
   - 刷新 Settings → Pages 页面
   - 你会看到：`Your site is published at https://你的用户名.github.io/xiaobuting-game/`

**方法二：使用 Git（适合有经验的用户）**

```bash
# 1. 初始化 Git 仓库
git init

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "初始化游戏项目"

# 4. 添加远程仓库
git remote add origin https://github.com/你的用户名/xiaobuting-game.git

# 5. 推送到 GitHub
git push -u origin main
```

---

## 🚀 Netlify 免费部署

### 4.1 准备文件
1. 将整个项目文件夹压缩成 `.zip` 文件
2. 确保 `index.html` 在压缩包的根目录

### 4.2 部署步骤
1. **注册 Netlify**
   - 访问：https://netlify.com
   - 点击 "Get started for free"
   - 可以用 GitHub 账号登录

2. **拖拽部署**
   - 登录后，在首页找到 "Want to deploy a new site without connecting to Git?"
   - 直接拖拽你的 `.zip` 文件到上传区域
   - 等待部署完成（通常1-2分钟）

3. **获取链接**
   - 部署成功后，你会得到一个链接，格式类似：
   - `https://奇怪的名字.netlify.app`

4. **自定义域名（可选）**
   - 点击 "Domain settings"
   - 点击 "Change site name"
   - 输入你想要的名字：`xiaobuting-game`
   - 新链接：`https://xiaobuting-game.netlify.app`

---

## ⚡ Vercel 免费部署

### 5.1 GitHub 连接部署（推荐）
1. **注册 Vercel**
   - 访问：https://vercel.com
   - 点击 "Get Started"
   - 用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库
   - 点击 "Import"

3. **配置项目**
   - Project Name：`xiaobuting-game`
   - Framework Preset：`Other`
   - Root Directory：`./`
   - 点击 "Deploy"

4. **获取链接**
   - 部署成功后：`https://xiaobuting-game.vercel.app`

### 5.2 直接上传部署
1. 安装 Vercel CLI（需要 Node.js）
2. 在项目文件夹运行：
   ```bash
   npx vercel --prod
   ```

---

## 🖥️ 服务器部署

### 6.1 VPS服务器部署

**推荐新手服务器：**
- 腾讯云轻量应用服务器
- 阿里云ECS
- Vultr
- DigitalOcean

**系统要求：**
- Ubuntu 20.04 或更新版本
- 1GB RAM
- 10GB 磁盘空间

### 6.2 Nginx 部署步骤

**1. 连接服务器**
```bash
# 使用 SSH 连接（Windows 用户可以使用 PuTTY）
ssh root@你的服务器IP
```

**2. 安装 Nginx**
```bash
# 更新系统
sudo apt update
sudo apt upgrade -y

# 安装 Nginx
sudo apt install nginx -y

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

**3. 配置防火墙**
```bash
# 开放 HTTP 和 HTTPS 端口
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

**4. 上传游戏文件**

**方法一：使用 SCP**
```bash
# 在本地电脑运行（将项目文件夹路径替换为你的实际路径）
scp -r C:\Users\limin\Telegram-xiaobuting-wanbiying\* root@你的服务器IP:/var/www/html/
```

**方法二：使用 SFTP 工具**
- 下载 FileZilla 或 WinSCP
- 连接到服务器
- 将文件上传到 `/var/www/html/`

**5. 配置 Nginx**
```bash
# 编辑 Nginx 配置
sudo nano /etc/nginx/sites-available/default
```

将内容替换为：
```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    root /var/www/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    # 启用 gzip 压缩
    gzip on;
    gzip_types text/css application/javascript application/json;

    # 设置缓存
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**6. 重启 Nginx**
```bash
sudo nginx -t  # 检查配置
sudo systemctl reload nginx
```

### 6.3 SSL证书配置（HTTPS）

**使用 Let's Encrypt 免费证书：**
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d 你的域名

# 自动续期
sudo crontab -e
# 添加这一行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🌐 域名配置

### 7.1 购买域名
**推荐域名注册商：**
- 腾讯云
- 阿里云
- GoDaddy
- Namecheap

### 7.2 DNS配置

**GitHub Pages:**
```
类型: CNAME
名称: www
值: 你的用户名.github.io
```

**Netlify:**
```
类型: CNAME
名称: www
值: 你的站点名.netlify.app
```

**自己的服务器:**
```
类型: A
名称: @
值: 你的服务器IP

类型: CNAME
名称: www
值: 你的域名
```

### 7.3 等待DNS生效
- 通常需要24-48小时
- 可以用 https://www.whatsmydns.net 检查DNS传播状态

---

## 🐛 故障排除

### 8.1 常见问题

**问题1：页面显示404错误**
```
解决方案：
1. 检查 index.html 是否在根目录
2. 确认文件名大小写正确
3. 检查服务器路径配置
```

**问题2：游戏不能正常运行**
```
解决方案：
1. 按F12打开开发者工具
2. 查看Console选项卡的错误信息
3. 检查Network选项卡，看哪些文件加载失败
4. 确认所有 js/css 文件路径正确
```

**问题3：HTTPS混合内容错误**
```
解决方案：
1. 确保所有资源链接使用HTTPS
2. 修改代码中的HTTP链接为HTTPS
3. 使用相对路径而不是绝对路径
```

**问题4：移动端显示异常**
```
解决方案：
1. 检查viewport meta标签
2. 确认CSS媒体查询
3. 测试不同屏幕尺寸
```

### 8.2 性能优化建议

**1. 文件压缩**
```bash
# 压缩 CSS 和 JS 文件
# 使用在线工具：https://www.minifier.org/
```

**2. 图片优化**
```bash
# 压缩图片文件
# 使用工具：TinyPNG (https://tinypng.com/)
```

**3. 启用缓存**
```nginx
# 在 Nginx 配置中添加缓存设置
location ~* \.(css|js|png|jpg|jpeg|gif|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 8.3 监控和分析

**Google Analytics 集成：**
```html
<!-- 在 index.html 的 <head> 中添加 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 📞 技术支持

如果遇到部署问题，可以：

1. **检查本手册的故障排除部分**
2. **查看浏览器开发者工具的错误信息**
3. **联系技术支持：**
   - Telegram: @bjxc010
   - 提供具体的错误截图和描述

---

## 🎯 快速部署检查清单

- [ ] 项目文件完整
- [ ] 本地测试通过
- [ ] 选择部署平台
- [ ] 上传文件成功
- [ ] 访问链接正常
- [ ] 移动端测试通过
- [ ] 域名配置（如需要）
- [ ] SSL证书安装（如需要）
- [ ] 性能优化完成

**恭喜！你的"消不停·万币赢"游戏现在可以让全世界的玩家访问了！** 🎉