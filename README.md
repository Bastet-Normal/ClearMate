# ClearMate — AI 生活事务代理平台

**ClearMate** 是一个帮助普通人看懂风险、处理麻烦、维护权益、节省金钱和时间的 AI 生活事务代理平台。

不需要学 prompt，不需要懂技术。上传截图、文件，或描述你遇到的问题，ClearMate 自动分析风险、生成维权材料、跟进处理进度。

---

## 快速开始

### 前置要求

- Python >= 3.11（后端，推荐用 conda 管理）
- Node.js >= 18（前端）

### 1. 启动后端（SQLite，零依赖）

```bash
cd apps/api

# 安装依赖（在 conda 环境中）
conda run -n happy pip install -e ".[dev]"

# 启动开发服务器（默认 http://localhost:8000）
conda run -n happy uvicorn app.main:app --reload --port 8000
```

后端默认使用 SQLite（`./clearmate.db`），无需安装数据库。如需切换 PostgreSQL，复制 `.env.example` 为 `.env` 并修改 `DATABASE_URL`。

API 文档：http://localhost:8000/api/docs

### 2. 启动前端

```bash
cd apps/web

npm install
npm run dev
```

默认地址：http://localhost:3000

### 3. （可选）Docker Compose 完整环境

如果你需要 PostgreSQL + Redis + 后端 + 前端一体化启动：

```bash
docker compose -f infra/docker-compose.yml up --build
```

启动后：
- 前端：http://localhost:3000
- 后端 API：http://localhost:8000
- API 文档：http://localhost:8000/api/docs
- PostgreSQL：localhost:5432
- Redis：localhost:6379

---

## 项目结构

```
ClearMate/
├── apps/
│   ├── api/              # FastAPI 后端
│   │   ├── app/
│   │   │   ├── api/      # API 路由
│   │   │   ├── core/     # 配置、数据库、安全
│   │   │   ├── models/   # SQLAlchemy 模型
│   │   │   ├── schemas/  # Pydantic 序列化
│   │   │   ├── services/ # 业务逻辑
│   │   │   │   └── llm/  # AI 分析服务
│   │   │   ├── repositories/ # 数据访问
│   │   │   ├── workers/  # Celery 任务（MVP 未启用）
│   │   │   └── tests/    # pytest 测试
│   │   └── alembic/      # 数据库迁移
│   └── web/              # Next.js 前端
│       ├── app/          # 页面
│       ├── components/   # 通用组件
│       ├── lib/          # 工具库
│       └── types/        # TypeScript 类型
├── docs/
│   ├── architecture/     # 架构文档
│   ├── product/          # 产品文档
│   └── roadmap/          # 开发路线图
├── infra/
│   ├── docker/           # Dockerfile
│   └── docker-compose.yml
└── scripts/              # 辅助脚本
```

---

## 三个核心功能

| 入口 | 说明 |
|------|------|
| 🔍 **这是不是坑？** | 判断短信、聊天记录、广告、兼职是不是诈骗 |
| 💰 **帮我退款/投诉/取消** | 生成投诉信、退款申请、客服话术 |
| 📄 **帮我看懂这份文件** | 提取关键信息、标注风险条款、大白话解释 |

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | Next.js 14 (App Router) |
| 样式 | Tailwind CSS |
| 状态管理 | Zustand + React Query |
| 后端框架 | FastAPI + Uvicorn |
| 数据库 | SQLite（默认）/ PostgreSQL |
| AI | OpenAI-compatible API / Mock Provider |

---

## 开发命令

### 后端

```bash
# 跑测试
conda run -n happy python -m pytest app/tests/ -v

# 跑 lint
conda run -n happy ruff check app/
conda run -n happy ruff format app/

# 跑 smoke 测试（端到端验证）
conda run -n happy python test_smoke.py
```

### 前端

```bash
npm run dev      # 开发
npm run build    # 构建
npm run lint     # lint
```

---

## 开发路线

1. **Phase 0** — 项目初始化 ✅
2. **Phase 1** — 用户与任务基础系统 ✅
3. **Phase 2** — 文件上传与文本提取 ✅
4. **Phase 3** — AI 分析核心闭环 ✅
5. **Phase 4** — 行动计划生成（待开始）
6. **Phase 5** — Dashboard 与提醒系统（待开始）
7. **Phase 6** — 风险规则系统（待开始）
8. **Phase 7** — 后台管理（待开始）
9. **Phase 8** — 工程完善（待开始）
详情见 [docs/roadmap/IMPLEMENTATION_PLAN.md](docs/roadmap/IMPLEMENTATION_PLAN.md)

---

## 安全说明

- AI 分析结果仅供参考，不能替代律师、医生、金融顾问
- 涉及转账、验证码、身份证、银行卡时强制风险提醒
- 敏感信息展示时自动遮盖
- 所有 AI 分析输出均附带免责声明

---

## License

MIT
