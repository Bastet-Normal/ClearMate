# ClearMate — AI 生活事务代理平台

**ClearMate** 帮你看懂风险、处理麻烦、维护权益。上传截图、文件，或描述问题，AI 自动分析风险、生成维权材料、给出行动指南。

🌐 **在线体验：https://wangjiehu.github.io/ClearMate/**

---

## 核心功能

| 入口 | 说明 |
|------|------|
| 🔍 **这是不是坑？** | 判断短信、广告、兼职是否诈骗，拆解套路步骤 |
| 💰 **退款/投诉/取消** | 生成投诉信、退款申请、客服话术 |
| 🔓 **订阅陷阱** | 识别自动续费陷阱，给出取消路径 |
| 📄 **看懂文件** | 上传文件或粘贴文本，提取关键信息、标注风险条款 |
| 🛡️ **消费避坑** | 买前查一查，9大品类风险库（黄金/网购/租房/贷款/医美/投资/外卖/旅游/培训） |
| ✅ **风险自检** | 回答问题快速评估风险，结果可保存 |

---

## 产品亮点

- **取证清单**：按场景生成具体取证动作（不是笼统的"保留证据"）
- **反套路话术**：实时对话场景的话术指导（不只是投诉信模板）
- **相似案例**：8类诈骗案例库，含套路步骤拆解
- **亲情守护**：高风险任务一键"发给家人确认"（navigator.share）
- **老人模式**：大字体 + 高对比度 + 高风险弹窗提醒
- **AI 分析进度**：分步展示思考过程，建立信任感
- **模板自动填充**：维权模板中 `[你的姓名]` 自动从用户信息预填

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Next.js 14 (App Router) + Tailwind CSS |
| 部署 | GitHub Pages (静态导出) |
| 数据 | localStorage (纯前端，无需后端) |
| AI 引擎 | 浏览器内规则引擎 + 模拟分析 (mock-analysis) |
| 后端 | FastAPI + SQLite (本地开发用，线上未启用) |

---

## 快速开始

### 在线体验

直接访问 https://wangjiehu.github.io/ClearMate/ ，无需安装。

### 本地开发

```bash
# 前端
cd apps/web
npm install
npm run dev
# 访问 http://localhost:3000

# 后端（可选）
cd apps/api
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
# API 文档 http://localhost:8000/api/docs
```

---

## 项目结构

```
ClearMate/
├── apps/
│   ├── api/              # FastAPI 后端（本地开发用）
│   └── web/              # Next.js 前端
│       ├── app/          # 页面路由
│       │   ├── page.tsx          # 首页（Hero + 快速体验）
│       │   ├── avoid-pit/        # 消费避坑
│       │   ├── self-check/       # 风险自检
│       │   ├── dashboard/        # 仪表盘
│       │   ├── tasks/            # 任务列表/新建/详情
│       │   ├── login/ & register/
│       │   └── not-found.tsx     # 404 页面
│       ├── components/
│       │   ├── layout/   # Header / Footer / ElderMode
│       │   └── ui/       # Toast / Confirm / Button / Card
│       ├── lib/
│       │   ├── mock-analysis.ts  # AI 分析引擎
│       │   ├── analyze-progress.ts # 分析进度模拟
│       │   ├── category-risks.ts # 品类风险知识库
│       │   └── local-store.ts   # localStorage 数据层
│       └── types/
├── docs/
└── .github/workflows/    # GitHub Pages 部署
```

---

## 安全说明

- AI 分析结果仅供参考，不构成法律、金融或医疗建议
- 涉及转账、验证码、身份证、银行卡时强制风险提醒
- 密码哈希存储（非明文）
- 所有 AI 分析输出均附带免责声明

---

## License

MIT
