# 部署指南

## 🚀 GitHub Pages 部署配置

项目已配置为使用 GitHub Pages 进行前端部署，地址：https://beijingshunyi.github.io/Telegram-xiaobuting-wanbiying/

### 自动部署流程

1. **推送代码到 main 分支**
   ```bash
   git add .
   git commit -m "部署更新"
   git push origin main
   ```

2. **GitHub Actions 自动构建**
   - 工作流文件：`.github/workflows/deploy-pages.yml`
   - 自动安装依赖、构建项目、部署到 Pages

3. **访问地址**
   - 游戏地址：https://beijingshunyi.github.io/Telegram-xiaobuting-wanbiying/
   - Telegram Bot：[@XBTyxbot](https://t.me/XBTyxbot)

### GitHub Pages 设置

1. **仓库设置**
   - 进入 Settings → Pages
   - Source: GitHub Actions
   - 自动部署已配置

2. **权限设置**
   - 确保 Actions 有写入权限
   - Settings → Actions → General → Workflow permissions

### Cloudflare Workers 部署

1. **安装 Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler auth login
   ```

3. **部署 Telegram Bot**
   ```bash
   cd apps/telegram-bot
   npm install
   npx wrangler deploy
   ```

4. **设置 Webhook**
   ```bash
   curl -X POST "https://xiaobuting-wanbiying.bingkuijing.workers.dev/setWebhook"
   ```

## 🗄️ 数据库设置

### Supabase 数据库初始化

1. **创建项目**
   - 访问 [Supabase Dashboard](https://supabase.com/dashboard)
   - 使用现有项目或创建新项目

2. **运行迁移**
   ```sql
   -- 在 Supabase SQL Editor 中运行 supabase/migrations/001_initial_schema.sql
   ```

3. **配置 RLS (Row Level Security)**
   - 已在迁移文件中配置
   - 确保用户只能访问自己的数据

### 环境变量配置

#### Telegram Bot (Cloudflare Workers)
```toml
# wrangler.toml
[vars]
BOT_TOKEN = "8496818925:AAGxeh_UWELR9iGH9lEhuKbnNHcPLUDu6k0"
BOT_USERNAME = "XBTyxbot"
WEBAPP_URL = "https://beijingshunyi.github.io/Telegram-xiaobuting-wanbiying"
SUPABASE_URL = "https://mtndxfqxivgivbwamjgn.supabase.co"
SUPABASE_ANON_KEY = "your_anon_key"

[secrets]
SUPABASE_SERVICE_KEY = "your_service_key"
```

#### 前端 (GitHub Pages)
环境变量已内置在构建配置中，无需额外配置。

## 🔧 本地开发

### 前端开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build
```

### 后端开发
```bash
# 进入 bot 目录
cd apps/telegram-bot

# 安装依赖
npm install

# 本地开发
npm run dev
```

## 📊 监控和日志

### GitHub Actions 日志
- 构建状态：仓库 Actions 页面
- 部署日志：每次 push 后的工作流日志

### Cloudflare Workers 日志
```bash
# 查看实时日志
cd apps/telegram-bot
npm run tail
```

### Supabase 监控
- 数据库监控：Supabase Dashboard
- API 使用情况：Usage 页面
- 错误日志：Logs 页面

## 🔄 更新流程

### 前端更新
1. 修改代码
2. 推送到 GitHub
3. 自动构建部署

### 后端更新
1. 修改 Telegram Bot 代码
2. 运行 `npm run deploy`
3. 重新设置 Webhook（如需要）

### 数据库更新
1. 创建新的迁移文件
2. 在 Supabase 中执行 SQL
3. 更新类型定义

## 🐛 故障排除

### 常见问题

1. **GitHub Pages 无法访问**
   - 检查 Actions 是否成功运行
   - 确认 Pages 设置正确

2. **Telegram Bot 无响应**
   - 检查 Webhook 是否设置
   - 查看 Workers 日志

3. **数据库连接失败**
   - 检查 Supabase 配置
   - 验证 API 密钥

### 调试命令

```bash
# 检查构建
npm run build --workspace=game-client

# 测试 Bot
curl -X POST "https://xiaobuting-wanbiying.bingkuijing.workers.dev/health"

# 检查类型
npm run type-check
```

## 📝 部署清单

- [ ] GitHub 仓库已创建
- [ ] GitHub Pages 已启用
- [ ] Actions 权限已设置
- [ ] Supabase 项目已创建
- [ ] 数据库迁移已运行
- [ ] Cloudflare Workers 已部署
- [ ] Telegram Webhook 已设置
- [ ] Bot 测试成功
- [ ] 游戏可正常访问

## 🔗 相关链接

- **游戏地址**: https://beijingshunyi.github.io/Telegram-xiaobuting-wanbiying/
- **Telegram Bot**: https://t.me/XBTyxbot
- **GitHub 仓库**: https://github.com/beijingshunyi/Telegram-xiaobuting-wanbiying
- **Supabase Dashboard**: https://supabase.com/dashboard/project/mtndxfqxivgivbwamjgn
- **Cloudflare Workers**: https://xiaobuting-wanbiying.bingkuijing.workers.dev/

---

✅ 项目已配置为使用 GitHub Pages 自动部署！