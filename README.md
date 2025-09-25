# 消不停·万币赢 - Telegram小游戏

> 一比一模仿腾讯消消乐的Telegram小游戏，集成万花币系统、提现功能、签到奖励、广告系统等完整功能。

## 🎮 游戏特色

- **🎯 经典消消乐玩法**：完全还原腾讯消消乐的游戏体验
- **💰 万花币系统**：1000万花币=10元人民币，真金白银可提现
- **📅 每日签到**：连续签到获得更多万花币奖励
- **📺 广告奖励**：观看广告获得额外万花币和道具
- **🏆 成就系统**：完成各种成就获得丰厚奖励
- **📊 全服排行**：每月前5名获得万花币奖励
- **💳 多种提现**：支持支付宝和USDT TRC-20提现
- **🛒 道具商店**：购买锤子、洗牌、步数、提示等道具
- **👥 社交功能**：邀请好友获得奖励，分享获得万花币
- **🤖 Telegram Bot**：查询状态、申请提现、客服沟通

## 🏗️ 技术架构

### 前端技术栈
- **HTML5 Canvas**：游戏渲染引擎
- **JavaScript ES6+**：核心游戏逻辑
- **CSS3**：响应式UI设计
- **Telegram Web App API**：Telegram集成
- **Google AdMob SDK**：广告系统

### 后端技术栈
- **Node.js + Express**：API服务器
- **SQLite**：轻量级数据库
- **Telegram Bot API**：机器人功能
- **加密存储**：用户敏感信息保护

### 部署方案
- **前端**：支持GitHub Pages、Netlify、Vercel等静态托管
- **后端**：支持Railway、Render、VPS等Node.js环境

## 🚀 快速开始

### 环境要求
- Node.js 16.0+
- npm 8.0+
- Telegram Bot Token（可选）

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/your-username/Telegram-xiaobuting-wanbiying.git
cd Telegram-xiaobuting-wanbiying
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 创建 .env 文件
cp .env.example .env

# 编辑环境变量
NODE_ENV=development
PORT=3000
BOT_TOKEN=your_telegram_bot_token
GAME_URL=http://localhost:3000
ENCRYPTION_KEY=your-32-character-encryption-key-here!
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问游戏**
- 浏览器访问：`http://localhost:3000`
- Telegram测试：使用 [@BotFather](https://t.me/botfather) 设置Web App URL

### 生产部署

#### 方案1：Railway部署（推荐）

1. Fork本仓库到你的GitHub
2. 登录 [Railway](https://railway.app)
3. 连接GitHub仓库
4. 设置环境变量
5. 部署完成

#### 方案2：Vercel + PlanetScale

1. 前端部署到Vercel
2. 数据库使用PlanetScale MySQL
3. API部署到Vercel Functions

#### 方案3：VPS自建

```bash
# 服务器部署脚本
git clone https://github.com/your-username/Telegram-xiaobuting-wanbiying.git
cd Telegram-xiaobuting-wanbiying
npm install --production
npm start

# 使用PM2管理进程
npm install -g pm2
pm2 start server/app.js --name xiaobuting-game
pm2 startup
pm2 save
```

## ⚙️ 配置说明

### 游戏配置 (js/config.js)

```javascript
const CONFIG = {
    // 万花币汇率：1000万花币 = 10人民币
    CURRENCY: {
        RATE_TO_RMB: 1000,
        NAME: "万花币"
    },

    // 提现设置
    WITHDRAW: {
        ALIPAY_MIN: 3000,      // 支付宝最低30元
        USDT_MIN_USD: 10,      // USDT最低10美元
        FEE_RATE: 0.03         // 3%手续费
    },

    // AdMob广告ID
    ADMOB: {
        BANNER_ID: "ca-app-pub-6402806742664594/3631141010",
        REWARD_ID: "ca-app-pub-6402806742664594/4856592778"
    }
};
```

### Telegram Bot配置

1. 找 [@BotFather](https://t.me/botfather) 创建Bot
2. 获取Bot Token
3. 设置Web App URL：`/setdomain your-domain.com`
4. 设置菜单：`/setcommands`

```
start - 🎮 开始游戏
help - ❓ 获取帮助
status - 📊 查看状态
withdraw - 💰 申请提现
```

## 💰 盈利模式

### 收入来源
1. **广告收入**：AdMob横幅广告 + 激励广告
2. **手动广告**：赞助商广告位
3. **提现手续费**：3%提现手续费
4. **道具销售**：用户购买游戏道具

### 成本控制
1. **服务器成本**：月费用约$10-50
2. **万花币发放**：通过广告收入和手续费平衡
3. **提现成本**：支付宝接口费用 + USDT矿工费

## 📊 数据统计

游戏内置完整的数据统计系统：

- **用户数据**：注册量、活跃度、留存率
- **游戏数据**：游戏次数、平均分数、关卡通过率
- **收入数据**：广告收入、道具收入、提现数据
- **运营数据**：签到率、分享率、邀请转化率

## 🔒 安全措施

1. **数据加密**：用户敏感信息AES-256加密存储
2. **防作弊**：游戏数据服务器验证
3. **提现审核**：人工审核大额提现申请
4. **风控系统**：异常行为监控和封号机制

## 📱 移动端适配

- **响应式设计**：支持各种屏幕尺寸
- **触摸优化**：针对移动设备触摸操作优化
- **性能优化**：Canvas游戏引擎性能优化
- **离线支持**：基础功能支持离线使用

## 🔧 开发指南

### 项目结构
```
├── index.html              # 主页面
├── css/                    # 样式文件
│   ├── style.css          # 主样式
│   └── game.css           # 游戏样式
├── js/                     # JavaScript文件
│   ├── config.js          # 配置文件
│   ├── telegram.js        # Telegram集成
│   ├── database.js        # 数据库管理
│   ├── user.js            # 用户管理
│   ├── game-engine.js     # 游戏引擎
│   ├── checkin.js         # 签到系统
│   ├── ads.js             # 广告系统
│   └── main.js            # 主控制器
├── server/                 # 后端代码
│   └── app.js             # Express服务器
├── images/                 # 图片资源
├── audio/                  # 音频资源
└── package.json           # 项目配置
```

### 添加新功能

1. **新增游戏模式**：在 `game-engine.js` 中扩展
2. **新增道具**：在 `config.js` 中定义，在 `user.js` 中实现
3. **新增成就**：在 `config.js` 中定义成就条件
4. **新增API**：在 `server/app.js` 中添加路由

### 本地化支持

游戏支持多语言，在 `config.js` 中配置：

```javascript
const LANGUAGES = {
    'zh': '简体中文',
    'en': 'English',
    'ru': 'Русский'
};
```

## 📈 运营建议

### 用户获取
1. **Telegram群推广**：在相关群组分享游戏
2. **网红合作**：与Telegram网红合作推广
3. **朋友圈传播**：利用邀请奖励机制
4. **ASO优化**：优化Bot搜索排名

### 用户留存
1. **每日签到**：培养用户习惯
2. **限时活动**：定期举办特殊活动
3. **社交功能**：增强用户互动
4. **推送提醒**：及时推送游戏更新

### 收入优化
1. **广告优化**：测试最佳广告位置和频次
2. **道具平衡**：调整道具价格和稀有度
3. **提现门槛**：优化提现门槛和手续费
4. **VIP系统**：开发付费会员功能

## 🤝 版权与赞助

### 版权信息
- **游戏开发**：@bjxc010
- **技术支持**：北京修车【万花楼】
- **商务合作**：@bjxc010

### 赞助商广告
游戏支持赞助商广告位，为合作伙伴提供精准流量：
- 横幅广告位
- 激励视频广告
- 品牌植入广告
- 定制活动合作

## 📞 技术支持

### 问题反馈
- **开发者Telegram**：[@bjxc010](https://t.me/bjxc010)
- **技术支持群**：[加入群聊](https://t.me/xiaobutingwanbiying_support)
- **GitHub Issues**：[提交问题](https://github.com/your-username/Telegram-xiaobuting-wanbiying/issues)

### 开发者服务
- **定制开发**：游戏功能定制开发
- **技术咨询**：Telegram游戏开发咨询
- **运营指导**：游戏运营策略指导
- **服务器部署**：协助游戏部署上线

## 📄 开源协议

本项目采用 MIT 开源协议，允许商业使用和修改。

### 使用条款
1. 保留原作者版权信息
2. 商业使用需注明来源
3. 修改代码需开源贡献
4. 不提供任何形式的担保

## 🎉 更新日志

### v1.0.0 (2024-01-15)
- ✨ 完整的消消乐游戏功能
- 💰 万花币系统和提现功能
- 📅 每日签到和奖励系统
- 📺 AdMob广告集成
- 🏆 成就和排行榜系统
- 👥 社交分享和邀请功能
- 🤖 Telegram Bot集成
- 🔒 数据加密和安全防护

### 即将更新
- 🎨 更多游戏皮肤和主题
- 🎯 挑战模式和冒险模式
- 🎪 限时活动和节日活动
- 💎 VIP会员系统
- 🌍 多语言支持
- 📊 高级数据分析

---

**🎮 立即体验：[消不停·万币赢](https://t.me/xiaobuting_wanbiying_bot)**

*每天玩游戏，万花币提现到支付宝和USDT！*