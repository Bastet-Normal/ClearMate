# ClearMate - TODO 追踪

## Phase 0
- [x] 创建 monorepo 目录结构
- [x] 编写 PRD / 架构文档 / 实施路线图
- [x] 初始化 Next.js 前端（构建通过）
- [x] 初始化 FastAPI 后端（/health 运行正常）
- [x] 配置 Docker Compose (PostgreSQL + Redis + API + Web)
- [x] 实现后端 /health 接口
- [x] 实现前端首页（三个核心入口：防诈骗/退款投诉/文件解读）
- [x] 配置后端 lint/format（ruff）
- [x] 创建 .env.example
- [x] 编写 README 启动说明
- [ ] 配置前端 lint / format
- [ ] 验证 Docker Compose 完整启动

## Phase 1
- [x] 后端 User / Task 模型、Schema、Service、Repository
- [x] 后端 Auth API（注册/登录/Me）+ JWT
- [x] 后端 Task CRUD API（创建/列表/详情/更新/删除）
- [x] 前端登录/注册页面
- [x] 前端任务列表/新建/详情页面
- [x] 前端 Header 组件（登录状态）
- [x] 前端构建通过（next build ✓）
- [x] 后端 smoke 测试通过（11/11 ✓）
- [x] SQLite 替代 PostgreSQL（本地开发）
- [x] useSearchParams Suspense 包裹修复
