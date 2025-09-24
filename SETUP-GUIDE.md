# 🚀 完整部署流程指南

本指南将带您从零开始部署"消不停・万币赢"游戏项目。

## 📋 前提条件

### 必需账号
- [ ] GitHub 账号
- [ ] Supabase 账号 (免费)
- [ ] Cloudflare 账号 (免费)

### 本地环境
- [ ] Node.js 18+ 已安装
- [ ] Git 已安装
- [ ] 命令行工具 (Terminal/PowerShell)

---

## 🗂️ 第一步：准备 GitHub 仓库

### 1.1 创建仓库
```bash
# 1. 在 GitHub 创建新仓库
# 仓库名: Telegram-xiaobuting-wanbiying
# 设置为 Public (GitHub Pages 需要)

# 2. 克隆到本地
git clone https://github.com/beijingshunyi/Telegram-xiaobuting-wanbiying.git
cd Telegram-xiaobuting-wanbiying

# 3. 复制所有项目文件到仓库目录
# (将我生成的所有文件复制到这个目录)
```

### 1.2 推送初始代码
```bash
git add .
git commit -m "🎮 初始化消不停・万币赢项目"
git push origin main
```

---

## 🗄️ 第二步：配置 Supabase 数据库

### 2.1 创建 Supabase 项目
1. 访问 [supabase.com](https://supabase.com)
2. 点击 "New project"
3. 选择组织，填写项目信息：
   - **Name**: `xiaobuting-wanbiying`
   - **Database Password**: 设置强密码
   - **Region**: 选择最近的区域

### 2.2 运行数据库迁移
```sql
-- 在 Supabase Dashboard → SQL Editor 中执行
-- 复制 supabase/migrations/001_initial_schema.sql 的全部内容并执行
```

### 2.3 获取数据库配置
在 Supabase Dashboard → Settings → API 中找到：
- **Project URL**: `https://your-project.supabase.co`
- **anon public key**: `eyJ...`
- **service_role secret**: `eyJ...`

### 2.4 配置认证
1. 进入 Authentication → Settings
2. 添加新的 Provider: 选择 "Custom"
3. 启用 "Enable third-party auth" (用于 Telegram 登录)

---

## ☁️ 第三步：配置 Cloudflare Workers

### 3.1 安装 Wrangler CLI
```bash
npm install -g wrangler
```

### 3.2 登录 Cloudflare
```bash
wrangler auth login
# 会打开浏览器，登录您的 Cloudflare 账号
```

### 3.3 更新配置文件
编辑 `apps/telegram-bot/wrangler.toml`：
```toml
[vars]
BOT_TOKEN = "8496818925:AAGxeh_UWELR9iGH9lEhuKbnNHcPLUDu6k0"
BOT_USERNAME = "XBTyxbot"
WEBAPP_URL = "https://beijingshunyi.github.io/Telegram-xiaobuting-wanbiying"
SUPABASE_URL = "https://your-project.supabase.co"  # 👈 替换为您的 URL
SUPABASE_ANON_KEY = "your-anon-key"  # 👈 替换为您的 anon key
```

### 3.4 设置密钥
```bash
cd apps/telegram-bot
wrangler secret put SUPABASE_SERVICE_KEY
# 输入您的 service_role secret key
```

### 3.5 部署 Worker
```bash
npm install
npx wrangler deploy
```

### 3.6 设置 Telegram Webhook
```bash
# 部署成功后，设置 webhook
curl -X POST "https://xiaobuting-wanbiying.bingkuijing.workers.dev/setWebhook"
```

---

## 📱 第四步：配置 GitHub Pages

### 4.1 启用 GitHub Pages
1. 进入 GitHub 仓库 → Settings → Pages
2. **Source**: 选择 "GitHub Actions"
3. 保存设置

### 4.2 配置 Actions 权限
1. 进入 Settings → Actions → General
2. **Workflow permissions**: 选择 "Read and write permissions"
3. 勾选 "Allow GitHub Actions to create and approve pull requests"
4. 保存

### 4.3 触发首次部署
```bash
# 推送任何更改都会触发自动部署
git add .
git commit -m "🚀 触发首次部署"
git push origin main
```

### 4.4 查看部署状态
1. 进入 GitHub 仓库 → Actions
2. 查看 "Deploy to GitHub Pages" 工作流
3. 等待部署完成（通常 2-3 分钟）

---

## 🧪 第五步：测试部署

### 5.1 测试前端游戏
```bash
# 访问游戏地址
https://beijingshunyi.github.io/Telegram-xiaobuting-wanbiying/
```
检查项目：
- [ ] 页面能正常加载
- [ ] 登录界面显示正常
- [ ] 没有控制台错误

### 5.2 测试 Telegram Bot
```bash
# 访问 Bot
https://t.me/XBTyxbot

# 发送 /start 命令测试
```
检查项目：
- [ ] Bot 响应 /start 命令
- [ ] WebApp 按钮能正常打开游戏
- [ ] 用户数据能正常保存

### 5.3 测试数据库连接
1. 在游戏中尝试登录
2. 查看 Supabase Dashboard → Table Editor
3. 确认 `users` 表中有新用户数据

---

## 🔧 第六步：配置优化

### 6.1 更新包依赖
```bash
# 在项目根目录
npm install
npm audit fix
```

### 6.2 环境变量安全检查
确认敏感信息不在 Git 历史中：
```bash
git log --oneline -10
# 检查是否有敏感信息被提交
```

### 6.3 性能优化
```bash
# 构建生产版本测试
npm run build --workspace=game-client
npm run type-check
```

---

## 📊 第七步：监控设置

### 7.1 GitHub Actions 监控
- 设置 GitHub 通知，构建失败时接收邮件
- 定期检查 Actions 页面

### 7.2 Supabase 监控
- 查看 Dashboard → Usage 了解 API 使用情况
- 设置数据库备份策略

### 7.3 Cloudflare 监控
```bash
# 查看 Worker 日志
cd apps/telegram-bot
npm run tail
```

---

## 🚀 完整部署命令总结

```bash
# 1. 克隆并推送代码
git clone https://github.com/beijingshunyi/Telegram-xiaobuting-wanbiying.git
cd Telegram-xiaobuting-wanbiying
git add .
git commit -m "🎮 初始化项目"
git push origin main

# 2. 安装依赖
npm install

# 3. 部署 Cloudflare Worker
cd apps/telegram-bot
npm install -g wrangler
wrangler auth login
npm install
npx wrangler deploy
curl -X POST "https://xiaobuting-wanbiying.bingkuijing.workers.dev/setWebhook"

# 4. 触发 GitHub Pages 部署
cd ../..
git add .
git commit -m "🚀 部署到生产环境"
git push origin main
```

---

## ✅ 部署检查清单

### 基础设置
- [ ] GitHub 仓库已创建并推送代码
- [ ] GitHub Pages 已启用 (Actions 模式)
- [ ] Actions 权限已正确设置

### 数据库配置
- [ ] Supabase 项目已创建
- [ ] 数据库迁移已执行
- [ ] API 密钥已获取

### 后端部署
- [ ] Cloudflare Workers 已部署
- [ ] 环境变量已配置
- [ ] Telegram Webhook 已设置

### 功能测试
- [ ] 游戏页面能正常访问
- [ ] Telegram Bot 响应正常
- [ ] 用户能成功登录
- [ ] 数据库连接正常

### 生产准备
- [ ] 所有依赖已安装
- [ ] 构建无错误
- [ ] 类型检查通过
- [ ] 监控已设置

---

## 🆘 常见问题排查

### GitHub Pages 无法访问
```bash
# 检查 Actions 状态
github.com/your-username/your-repo/actions

# 常见问题：
# 1. Pages 未启用 - 进入 Settings → Pages 启用
# 2. Actions 无权限 - 进入 Settings → Actions 设置权限
# 3. 构建失败 - 查看 Actions 日志
```

### Telegram Bot 无响应
```bash
# 检查 Worker 状态
curl https://xiaobuting-wanbiying.bingkuijing.workers.dev/health

# 常见问题：
# 1. Webhook 未设置 - 运行设置命令
# 2. 环境变量错误 - 检查 wrangler.toml
# 3. 部署失败 - 重新运行 wrangler deploy
```

### 数据库连接失败
```sql
-- 在 Supabase SQL Editor 测试
SELECT * FROM users LIMIT 1;

-- 常见问题：
-- 1. 迁移未执行 - 重新运行 SQL
-- 2. RLS 权限问题 - 检查策略设置
-- 3. API 密钥错误 - 重新获取密钥
```

---

## 📞 技术支持

如果遇到问题，可以：

1. **查看 GitHub Issues** - 搜索类似问题
2. **检查 Actions 日志** - 详细的错误信息
3. **联系开发者** - [@bjxc010](https://t.me/bjxc010)

---

🎉 **恭喜！您的"消不停・万币赢"游戏已成功部署！**

**游戏地址**: https://beijingshunyi.github.io/Telegram-xiaobuting-wanbiying/
**Telegram Bot**: [@XBTyxbot](https://t.me/XBTyxbot)