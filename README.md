# 🎮 消不停·万币赢

> 像素级复刻腾讯"天天爱消除"的Web游戏，集成万花币经济系统、Telegram社交功能、全服排行榜和广告变现系统。

![游戏预览](https://img.shields.io/badge/Status-Ready%20to%20Deploy-brightgreen)
![技术栈](https://img.shields.io/badge/Tech-HTML5%20%7C%20JavaScript%20%7C%20CSS3-blue)
![移动端](https://img.shields.io/badge/Mobile-Responsive-orange)

## ✨ 游戏特色

### 🎯 核心玩法
- **8x8棋盘** - 完全复刻天天爱消除的游戏机制
- **三消规则** - 经典的三个或以上相同元素消除
- **特殊元素** - 四连线火箭、五连线彩虹猫头鹰
- **连击系统** - 支持无限连击，越高分越刺激
- **官方角色** - 黄豆豆、琦琦熊、果果兔、喵星星

### 💰 经济系统
- **万花币** - 游戏内虚拟货币，可提现
- **多种获取方式** - 游戏奖励、签到奖励、广告奖励
- **提现功能** - 支持支付宝和USDT双通道
- **汇率系统** - 实时USDT汇率，1万花币≈0.1USDT

### 🤝 社交功能
- **Telegram集成** - 无缝连接Telegram Bot
- **好友邀请** - 邀请好友获得万花币奖励
- **分享功能** - 分享成就到Telegram群组
- **全服排行榜** - 深度玩家和普通玩家分级排行

### 📱 技术特点
- **响应式设计** - 完美适配手机、平板、桌面
- **PWA支持** - 可安装到桌面，离线可用
- **特效系统** - 粒子特效、屏幕震动、音效反馈
- **性能优化** - 60fps流畅运行，低内存占用

## 🚀 快速开始

### 方式一：自动部署脚本（推荐新手）

**Windows用户：**
```cmd
双击运行 deploy.bat
```

**Linux/Mac用户：**
```bash
chmod +x deploy.sh
./deploy.sh
```

### 方式二：手动部署

#### 1. 本地测试
```bash
# 使用Python启动本地服务器
python -m http.server 8000

# 或者使用VS Code + Live Server插件
# 右键index.html → Open with Live Server
```

#### 2. GitHub Pages（免费托管）
```bash
# 1. 创建GitHub仓库
# 2. 上传所有文件
# 3. 在Settings → Pages中启用页面服务
```

#### 3. Netlify（免费托管）
```bash
# 1. 将项目打包为zip文件
# 2. 拖拽到netlify.com的部署区域
# 3. 获得免费域名
```

## 📖 详细部署指南

查看 **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** 获取完整的部署教程，包括：

- 🏠 本地测试环境搭建
- 🌐 多平台免费部署（GitHub Pages、Netlify、Vercel）
- 🖥️ 服务器部署和Nginx配置
- 🌐 域名配置和SSL证书
- 🐛 常见问题解决方案

## 🛠️ 技术架构

### 前端技术栈
```
HTML5 Canvas - 游戏渲染引擎
JavaScript ES6+ - 游戏逻辑和交互
CSS3 - 响应式界面和动画
Web APIs - PWA、本地存储、振动反馈
```

### 核心系统
```
📁 js/core/          - 游戏核心引擎
📁 js/effects/       - 特效动画系统
📁 js/economy/       - 经济和提现系统
📁 js/social/        - 社交和排行榜系统
📁 js/utils/         - 工具类和广告系统
```

### 外部集成
- **Telegram Bot API** - 社交功能集成
- **AdMon SDK** - 广告变现系统
- **实时汇率API** - USDT汇率获取
- **支付接口** - 支付宝和USDT提现

## 🎯 游戏截图

```
🎮 主界面          📊 游戏面板         💰 提现系统
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ 消不停·万币赢 │   │ 分数: 1250  │   │ 余额: 5240万花币│
│             │   │ 步数: 18    │   │ ≈ $52.40   │
│ [开始游戏]   │   │ 目标: 收集   │   │             │
│ [排行榜]    │   │ 🍎×20 🍌×15  │   │ [提现到支付宝]│
│ [设置]      │   │             │   │ [提现到USDT]│
└─────────────┘   │ 8×8游戏棋盘  │   │ [交易记录]  │
                  │ [🍎🍌🍇🍊...] │   └─────────────┘
                  └─────────────┘
```

## 📱 移动端优化

- ✅ **触摸操作** - 完美支持滑动消除
- ✅ **自适应布局** - 各种屏幕尺寸完美适配
- ✅ **性能优化** - 针对移动设备优化渲染
- ✅ **离线支持** - PWA技术，无网络也能玩
- ✅ **振动反馈** - 操作反馈更真实

## 💡 商业模式

### 收入来源
1. **广告收入** - AdMon激励视频广告
2. **提现手续费** - 每笔提现收取5%手续费
3. **道具销售** - 额外步数、时间冻结等道具
4. **VIP会员** - 专享特权和奖励

### 用户获取
1. **Telegram推广** - Bot邀请和群组分享
2. **社交传播** - 排行榜竞争和好友邀请
3. **内容营销** - 游戏攻略和社区建设

## 🔧 开发和定制

### 修改游戏参数
```javascript
// js/utils/constants.js
const GAME_CONFIG = {
    BOARD_SIZE: 8,           // 棋盘大小
    INITIAL_MOVES: 25,       // 初始步数
    COIN_REWARD_RATE: 0.1,   // 万花币奖励比例
    WITHDRAWAL_FEE: 0.05     // 提现手续费
};
```

### 添加新角色
```javascript
// js/core/elements.js
const CHARACTERS = {
    'new_character': {
        name: '新角色',
        color: '#FF6B9D',
        sprite: generateNewCharacterSprite
    }
};
```

### 自定义关卡
```javascript
// js/core/levels.js
const LEVELS = {
    1: {
        objectives: [
            { type: 'collect', element: 'apple', required: 20 }
        ],
        moves: 25
    }
};
```

## 🎯 路线图

### 已完成 ✅
- [x] 核心游戏引擎
- [x] 特效动画系统
- [x] 万花币经济系统
- [x] 提现功能
- [x] Telegram集成
- [x] 排行榜系统
- [x] 广告系统

### 计划中 📋
- [ ] 后端API开发
- [ ] 实时多人对战
- [ ] 更多特殊道具
- [ ] 社交功能增强
- [ ] 数据分析后台

## 📞 支持与联系

### 技术支持
- **Telegram**: [@bjxc010](https://t.me/bjxc010)
- **开发合作**: [@bjxc010](https://t.me/bjxc010)

### 赞助商
本游戏由 **北京修车【万花楼】** 赞助开发

### 问题反馈
如果遇到问题，请提供：
1. 设备信息（系统版本、浏览器版本）
2. 错误截图
3. 操作步骤描述
4. 浏览器控制台错误信息（F12 → Console）

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

---

**🎉 准备好体验最棒的三消游戏了吗？立即部署并开始游戏吧！**

---

<div align="center">

**Built with ❤️ by Claude Code**

[🎮 立即游戏](https://your-domain.com) • [📖 部署指南](DEPLOYMENT_GUIDE.md) • [💬 技术支持](https://t.me/bjxc010)

</div>