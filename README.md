# 消不停・万币赢

一个基于Telegram的消除游戏，玩家可以通过游戏赚取真实收益。

## 🎮 项目概述

**消不停・万币赢** 是一个创新的区块链游戏平台，结合了经典的三消游戏玩法和加密货币奖励机制。玩家通过消除方块获得万花币，可以直接提现到支付宝或USDT钱包。

### ✨ 核心特性

- 🎯 **经典三消玩法** - 简单易上手，老少皆宜
- 💰 **真实收益** - 万花币可直接提现
- 🎁 **多元奖励** - 游戏、广告、签到、邀请多种赚币方式
- 📱 **Telegram集成** - 无需下载，在Telegram中直接游戏
- 🏆 **社交竞技** - 排行榜和邀请系统
- 💳 **多种提现** - 支持支付宝和TRC-20 USDT

## 🏗️ 技术架构

### 前端技术栈
- **游戏引擎**: Phaser 3 - HTML5游戏引擎
- **前端框架**: React + TypeScript
- **样式方案**: Tailwind CSS
- **状态管理**: Zustand
- **构建工具**: Vite

### 后端技术栈
- **边缘计算**: Cloudflare Workers
- **数据库**: Supabase (PostgreSQL)
- **身份认证**: Supabase Auth + Telegram Login
- **文件存储**: Supabase Storage
- **实时通信**: Supabase Realtime

### 部署与运维
- **前端部署**: GitHub Pages
- **后端部署**: Cloudflare Workers
- **域名**: https://beijingshunyi.github.io/Telegram-xiaobuting-wanbiying/
- **监控分析**: GitHub Actions + Cloudflare Analytics

## 📁 项目结构

```
📦 Telegram-xiaobuting-wanbiying
├── 📁 apps/                    # 应用目录
│   ├── 📁 game-client/         # 游戏前端 (Phaser + React)
│   ├── 📁 admin-dashboard/     # 管理后台 (Next.js)
│   └── 📁 telegram-bot/        # Telegram机器人 (Cloudflare Worker)
├── 📁 packages/               # 共享包
│   ├── 📁 database/           # 数据库类型定义和客户端
│   ├── 📁 utils/              # 共享工具函数
│   └── 📁 config/             # 配置文件
├── 📁 supabase/              # 数据库配置
│   ├── 📁 migrations/         # 数据库迁移文件
│   └── 📁 seeds/              # 初始数据
└── 📁 docs/                   # 项目文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 开发环境启动

```bash
# 启动游戏客户端
npm run dev

# 启动管理后台
npm run admin:dev

# 启动Telegram机器人（本地开发）
npm run bot:dev
```

### 构建项目

```bash
# 构建游戏客户端
npm run build

# 构建管理后台
npm run admin:build
```

### 部署

```bash
# 部署Telegram机器人到Cloudflare Workers
npm run bot:deploy
```

## 🎮 游戏系统

### 核心玩法
- **三消机制** - 连接3个或更多相同水果可消除
- **连击奖励** - 连续消除获得倍数奖励
- **特殊道具** - 4连消生成直线消除，5连消生成爆炸道具
- **关卡进程** - 逐步解锁更有挑战性的关卡

### 经济系统
- **万花币获取**
  - 基础消除：3连=1币，4连=3币，5连=6币
  - 连击奖励：2连击+10%，3连击+25%，4连击+50%
  - 每日签到：5-100万花币递增奖励
  - 观看广告：前3次15币/次，后续10币/次
  - 社交分享：5币/次（每日6次上限）
  - 邀请奖励：30币/人（好友完成10关后）

- **万花币消费**
  - 道具购买：锤子100币，洗牌80币，加步数60币，提示40币
  - 提现申请：最低1000币，手续费3%

### 道具系统
- **🔨 锤子** - 点击消除单个方块（包括障碍物）
- **🔀 洗牌** - 重新随机排列整个棋盘
- **➕ 加步数** - 增加5次移动机会
- **💡 提示** - 高亮显示可消除的组合

## 📱 Telegram集成

### 机器人功能
- **/start** - 开始游戏和用户注册
- **/help** - 游戏帮助和说明
- **/balance** - 查看万花币余额和游戏统计
- **/profile** - 个人资料和成就
- **/withdraw** - 提现申请
- **/leaderboard** - 排行榜查看

### WebApp集成
- 无缝Telegram登录
- 原生UI体验
- 触觉反馈支持
- 深度链接和参数传递

## 💰 提现系统

### 支持的提现方式
1. **支付宝提现**
   - 最低金额：1000万花币（10元）
   - 手续费：3%
   - 到账时间：24小时内

2. **TRC-20 USDT提现**
   - 最低金额：1000万花币（10 USDT）
   - 手续费：3%
   - 到账时间：24小时内

### 提现流程
1. 用户在游戏内申请提现
2. 填写收款信息（支付宝账号或USDT地址）
3. 系统自动风控检测
4. 管理员人工审核
5. 批准后自动转账到账

## 🔐 安全机制

### 防作弊系统
- 游戏数据服务器端验证
- 异常行为模式检测
- IP地址和设备指纹跟踪
- 提现申请多重审核

### 数据安全
- 所有敏感数据加密存储
- Row Level Security (RLS) 数据库权限控制
- API接口速率限制
- 日志审计和监控

## 📊 管理后台

### 功能模块
- **用户管理** - 用户信息、状态管理、数据统计
- **游戏数据** - 关卡统计、成绩分析、异常监控
- **经济管理** - 万花币流水、提现审核、财务报表
- **广告管理** - 自定义广告投放和效果分析
- **系统配置** - 参数调整、公告发布、版本管理

## 🎯 运营策略

### 用户获取
- Telegram群组推广
- 社交媒体营销
- 邀请奖励机制
- KOL合作推广

### 用户留存
- 每日签到奖励
- 限时活动和任务
- 排行榜竞技
- 社交分享激励

### 收益模式
- 广告收益分成
- 提现手续费
- 道具销售收入
- 品牌合作广告

## 🔧 开发指南

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/beijingshunyi/Telegram-xiaobuting-wanbiying.git
   cd Telegram-xiaobuting-wanbiying
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   # 复制环境变量模板
   cp .env.example .env.local

   # 编辑环境变量
   nano .env.local
   ```

4. **初始化数据库**
   ```bash
   # 运行数据库迁移
   npm run db:migrate

   # 生成类型定义
   npm run db:generate
   ```

5. **启动开发服务器**
   ```bash
   npm run dev
   ```

### 代码规范

- 使用TypeScript进行类型检查
- 遵循ESLint和Prettier配置
- 组件采用函数式编程风格
- API接口使用RESTful设计
- Git提交信息遵循Conventional Commits

### 测试

```bash
# 运行类型检查
npm run type-check

# 运行代码检查
npm run lint

# 修复代码格式
npm run lint --fix
```

## 📝 API文档

### 用户相关API
- `POST /api/users` - 创建用户
- `GET /api/users/:id` - 获取用户信息
- `PUT /api/users/:id` - 更新用户信息

### 游戏相关API
- `POST /api/games` - 保存游戏会话
- `GET /api/games/:userId` - 获取游戏历史
- `GET /api/leaderboard` - 获取排行榜

### 经济相关API
- `POST /api/transactions` - 创建交易记录
- `GET /api/transactions/:userId` - 获取交易历史
- `POST /api/withdrawals` - 创建提现申请
- `GET /api/withdrawals` - 获取提现记录

## 🤝 贡献指南

我们欢迎社区贡献！请阅读我们的贡献指南：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

版权所有 © 2024 北京修车【万花楼】和@bjxc010

## 📞 联系我们

- **开发者**: [@bjxc010](https://t.me/bjxc010)
- **合作联系**: [@bjxc010](https://t.me/bjxc010)
- **赞助商**: 北京修车【万花楼】
- **游戏机器人**: [@XBTyxbot](https://t.me/XBTyxbot)

---

🎮 **立即开始游戏** → [https://t.me/XBTyxbot](https://t.me/XBTyxbot)

💰 **玩游戏，赚真钱！消不停・万币赢！**
