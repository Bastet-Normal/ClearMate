<p align="center">
  <img src="docs/images/banner.png" alt="ClearMate Banner" width="100%" style="border-radius: 12px; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);" />
</p>

<h1 align="center">🛡️ ClearMate (消保卫士)</h1>

<p align="center">
  <strong>—— 帮普通人看懂风险、处理麻烦、维护权益的生活事务代理与消费守护平台</strong>
</p>

<p align="center">
  <a href="https://github.com/wangjiehu/ClearMate/actions"><img src="https://img.shields.io/github/actions/workflow/status/wangjiehu/ClearMate/deploy.yml?branch=main&style=flat-square&logo=github-actions&logoColor=white&label=GitHub%20Pages" alt="GitHub Pages Status" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-14.2-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://sqlite.org/"><img src="https://img.shields.io/badge/SQLite-3.0-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" /></a>
</p>

---

## 🌟 什么是 ClearMate？

在大数据时代，普通人经常面临各种消费陷阱、繁琐的自动续费、复杂的合同条款以及层出不穷的诈骗套路。对于老年人或数字弱势群体，维权更是困难重重。

**ClearMate** 是一款面向大众生活场景的任务型 AI 辅助维权与风险自检系统。用户不需要学习复杂的提示词（Prompt），只需上传截图、账单、合同文件或描述遭遇的纠纷，系统就能自动提取关键信息、智能识别潜在套路、生成结构化取证清单，并提供一键可复制的专业投诉信和沟通话术。

> 🌐 **零后端依赖，即开即用！**
>
> 🚀 **在线直接体验：[https://wangjiehu.github.io/ClearMate/](https://wangjiehu.github.io/ClearMate/)**

---

## ✨ 产品特色

- 📱 **老人友好模式 (Elder Mode)**
  * 一键切换超大字体、高对比度主题、醒目的高风险弹窗提示。
  * 核心结论一句话提炼，降低阅读成本，并支持一键**“发送给家人确认”**（基于 Web Share API）。
- ⚙️ **双模型引擎 & 隐私无忧 (Hybrid Engine)**
  * **模拟引擎 (Local Mock)**：默认无需 API Key，可在本地模拟生成高质量的分析报告与维权建议。
  * **真实 API (Gemini Direct)**：在「设置」中输入您的 Gemini API 密钥，前端直接调用大模型，无任何中间服务器，保障数据隐私。
- 🕒 **思考流展示 (Thinking Process Flow)**
  * AI 分析时拆解步骤（“读取文件”、“文本抽取”、“条款校验”、“套路识别”），提供渐进式进度提示，让老年人看得懂、用得安心。
- 📋 **自动表单填充 (Auto-Fill Templates)**
  * 在「个人设置」中配置好基本信息后，生成的退款申请书、投诉信等维权材料会自动填充 `[你的姓名]`、`[联系电话]` 等字段，做到开箱即用。

---

## 🧩 核心功能矩阵

| 功能板块 | 核心场景 | 解决的问题 |
| :--- | :--- | :--- |
| 🔍 **这是不是坑？** | 投资、兼职、虚假广告、高利贷 | 智能分析短信或聊天截图，指出可疑点，还原常见套路步骤。 |
| 💰 **退款/投诉/取消** | 购物退款纠纷、网络侵权、违约金 | 提供格式化证据清单，生成投诉信模板与客服“对线”话术。 |
| 🔓 **订阅陷阱** | 隐藏续费、自动扣款、套路首月 | 识别隐藏的“次月扣费”约定，给出详细的退订和关闭流程。 |
| 📄 **看懂文件** | 电子合同、电子收据、账单通知 | 自动提取关键金额、截止日期，高亮风险责任条款与敏感数据。 |
| 🛡️ **消费避坑库** | 黄金、网购、医美、租房等9大品类 | 提供常见避坑指南和预设维权话术，防患于未然。 |
| ✅ **风险自检** | 综合安全体检、专项风险评估 | 互动式问答打分，根据选择输出定制化风险报告与防范建议。 |

---

## 🏗️ 架构概览

ClearMate 支持 **纯静态前端模式 (Serverless Mode)** 与 **全栈容器化模式 (Fullstack Mode)**。

```mermaid
graph TD
    User([用户浏览器]) -->|1. 访问网页| GitHubPages[GitHub Pages 静态托管]
    User -->|2. 保存任务 & 配置| LocalStorage[(浏览器 LocalStorage)]
    
    subgraph AI Engine (统一分析层)
        User -->|3. 发起分析任务| Analyze[Unified Analyze Pipeline]
        
        Analyze -->|配置了 API Key| GeminiAPI[Google Gemini API]
        Analyze -->|未配置 API Key| LocalMock[浏览器本地模拟分析]
    end

    subgraph 全栈扩展 (可选)
        User -->|4. 本地全栈开发| FastAPI[FastAPI 后端服务]
        FastAPI -->|数据存储| SQLite[(SQLite 数据库)]
    end

    classDef primary fill:#2563EB,stroke:#1D4ED8,color:#fff;
    classDef secondary fill:#059669,stroke:#047857,color:#fff;
    classDef storage fill:#7C3AED,stroke:#6D28D9,color:#fff;
    
    class User,GitHubPages primary;
    class Analyze,GeminiAPI,LocalMock secondary;
    class LocalStorage,FastAPI,SQLite storage;
```

---

## 🛠️ 快速开始

项目采用 Monorepo 结构，包含 Next.js 前端和 FastAPI 后端。

### 1. 纯前端运行（推荐，直接体验）

```bash
# 1. 克隆项目
git clone https://github.com/wangjiehu/ClearMate.git
cd ClearMate

# 2. 进入前端目录
cd apps/web

# 3. 安装依赖并启动
npm install
npm run dev
```
* 浏览器访问：[http://localhost:3000](http://localhost:3000)
* *提示：如果在本地测试，点击右上角设置，填入您的 Gemini API Key 即可解除 Mock 限制。*

### 2. 后端运行（可选，用于数据持久化及高级提取）

```bash
# 1. 进入后端目录
cd apps/api

# 2. 创建并激活虚拟环境 (推荐)
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. 安装开发环境依赖
pip install -e ".[dev]"

# 4. 运行后端服务
uvicorn app.main:app --reload --port 8000
```
* API 交互文档：[http://localhost:8000/api/docs](http://localhost:8000/api/docs)
* 默认使用本地 SQLite 数据库：`apps/api/clearmate.db`

---

## 📂 目录结构

```text
ClearMate/
├── apps/
│   ├── api/                      # FastAPI 后端项目
│   │   ├── app/
│   │   │   ├── api/              # 路由控制器 (Auth, Analysis, Tasks)
│   │   │   ├── core/             # 配置项与数据库连接
│   │   │   ├── models/           # SQLAlchemy 数据库实体
│   │   │   ├── schemas/          # Pydantic 校验模型
│   │   │   └── services/         # 业务逻辑与 LLM 适配器
│   │   └── tests/                # pytest 单元测试
│   │
│   └── web/                      # Next.js 14 前端项目 (App Router)
│       ├── app/                  # 页面组件及路由管理
│       │   ├── dashboard/        # 维权看板 (任务总览)
│       │   ├── tasks/            # 维权任务 (详情、新建、取证)
│       │   ├── self-check/       # 风险自检系统
│       │   └── avoid-pit/        # 避坑知识库
│       ├── components/           # 复用 UI 组件 (layout/ui)
│       ├── lib/                  # 数据流、模拟分析器与工具类
│       └── types/                # TypeScript 类型声明
│
├── docs/                         # 项目设计与架构文档
└── .github/workflows/            # GitHub Actions 自动化部署流
```

---

## 🛡️ 安全、隐私与合规

1. **隐私优先**：AI 分析提取的所有文本和截图、设置的 API 密钥及用户信息全部保存在用户本地的 `localStorage` 中，绝不上送云端。
2. **风险强提醒**：当用户输入的文本或截图中包含身份证号、银行卡号、手机验证码、或者引导大额转账时，UI 会进行强制性的红色警告弹窗。
3. **法律免责声明**：AI 分析结果基于现有算法及本地数据，不构成任何具有法律效力的建议或指导，用户在采取维权、退款等涉及财务和法律的行为前，请仔细核实真实情况。

---

## 📜 许可证

本项目采用 [MIT 许可证](LICENSE)。
