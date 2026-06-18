# ClearMate - 架构设计文档

## 一、总体架构

ClearMate 采用前后端分离的 monorepo 架构，部署在 Docker Compose 编排的容器集群中。

```
┌─────────────────────────────────────────────────────┐
│                    Nginx (反向代理)                    │
│              / → Next.js  /api → FastAPI              │
└──────────┬──────────────────────────┬───────────────┘
           │                          │
┌──────────▼──────────┐  ┌────────────▼──────────────┐
│   Next.js (前端)     │  │   FastAPI (后端 API)       │
│   React + TypeScript │  │   Python + Pydantic        │
│   Tailwind + shadcn  │  │   SQLAlchemy 2.x + Alembic │
└─────────────────────┘  └──────┬──────┬──────────────┘
                                │      │
                    ┌───────────▼──┐ ┌─▼────────────┐
                    │  PostgreSQL   │ │    Redis      │
                    │  (主数据库)    │ │  (缓存/队列)  │
                    └──────────────┘ └──────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │  MinIO / 本地文件存储      │
                    │  (文件系统)                │
                    └──────────────────────────┘
```

## 二、技术栈

### 前端
| 技术 | 用途 |
|------|------|
| Next.js 14+ | 前端框架 (App Router) |
| React 18+ | UI 库 |
| TypeScript | 类型安全 |
| Tailwind CSS | 样式 |
| shadcn/ui | 组件库 |
| Zustand | 状态管理 |
| TanStack Query | 服务端状态 |
| React Hook Form | 表单管理 |
| Zod | 前端校验 |

### 后端
| 技术 | 用途 |
|------|------|
| FastAPI | Web 框架 |
| Python 3.11+ | 语言 |
| SQLAlchemy 2.x | ORM |
| Alembic | 数据库迁移 |
| Pydantic v2 | 数据校验/序列化 |
| PostgreSQL 15+ | 主数据库 |
| Redis 7+ | 缓存/会话/队列 |
| Celery / RQ | 异步任务 |
| MinIO / 本地存储 | 文件存储 |

### AI 层
| 技术 | 用途 |
|------|------|
| LLM Provider Adapter | 统一模型调用抽象 |
| OpenAI-compatible API | 主力模型接口 |
| Mock Provider | 开发测试用 |
| PromptTemplateService | Prompt 版本管理 |

### 文档处理
| 技术 | 用途 |
|------|------|
| pypdf / pymupdf | PDF 文本提取 |
| python-docx | Word 文档 |
| openpyxl | Excel 文件 |
| OCR Adapter (可替换) | 图片文字识别 |

### 部署
| 技术 | 用途 |
|------|------|
| Docker | 容器化 |
| Docker Compose | 本地编排 |
| Nginx | 反向代理 |

## 三、项目结构

```
ClearMate/
  apps/
    web/                        # Next.js 前端
      app/                      # App Router 页面
      components/               # UI 组件
        ui/                     # shadcn/ui 基础组件
        layout/                 # 布局组件
        features/               # 业务功能组件
      lib/                      # 工具函数
      hooks/                    # 自定义 hooks
      stores/                   # Zustand stores
      types/                    # TypeScript 类型
      styles/                   # 全局样式
      public/                   # 静态资源
      package.json
      next.config.ts
      tailwind.config.ts
    api/                        # FastAPI 后端
      app/
        main.py                 # 应用入口
        core/                   # 核心配置
          config.py             # 设置
          security.py           # 认证/授权
          database.py           # 数据库连接
        api/                    # 路由
          v1/
            auth.py
            files.py
            tasks.py
            analyses.py
            reminders.py
            admin.py
        models/                 # SQLAlchemy 模型
        schemas/                # Pydantic schemas
        services/               # 业务逻辑层
          llm/                  # AI 相关服务
            providers/          # LLM Provider 适配
            prompts/            # Prompt 模板
          analysis.py
          file_extraction.py
          risk_scoring.py
        repositories/           # 数据访问层
        workers/                # 异步任务
        tests/                  # 测试
          unit/
          integration/
      alembic/                  # 数据库迁移
      pyproject.toml
  packages/
    shared/                     # 前后端共享
      types/                    # 共享类型定义
      constants/                # 共享常量
  infra/
    docker/
      Dockerfile.web
      Dockerfile.api
    nginx/
      nginx.conf
    docker-compose.yml
  docs/
    product/                    # 产品文档
    architecture/               # 架构文档
    api/                        # API 文档
    prompts/                    # Prompt 设计文档
    roadmap/                    # 路线图
  scripts/                      # 工具脚本
  README.md
  CHANGELOG.md
  .env.example
```

## 四、数据库设计

### ER 图概览

```
users ──< households ──< household_members
  │
  ├──< files ──< task_files
  │
  ├──< tasks ──< analyses
  │         ├──< action_plans
  │         ├──< reminders
  │         └──< task_files
  │
  ├──< reminders
  │
  └──< audit_logs

prompt_templates (独立)
model_call_logs (关联 user/task)
```

### 核心表结构

#### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| email | VARCHAR(255) | 唯一 |
| password_hash | VARCHAR(255) | |
| display_name | VARCHAR(100) | |
| role | VARCHAR(20) | user/admin |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### households
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(100) | |
| owner_id | UUID FK | → users |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### household_members
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| household_id | UUID FK | → households |
| user_id | UUID FK | → users |
| member_role | VARCHAR(20) | owner/member |
| mode | VARCHAR(20) | normal/elder/child |
| created_at | TIMESTAMP | |

#### files
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID FK | → users |
| household_id | UUID FK (nullable) | → households |
| original_name | VARCHAR(255) | |
| storage_path | VARCHAR(500) | |
| mime_type | VARCHAR(100) | |
| size | BIGINT | 字节 |
| file_type | VARCHAR(50) | 自动判断 |
| extracted_text | TEXT | |
| summary | TEXT | |
| sensitive_detected | BOOLEAN | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### tasks
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID FK | → users |
| household_id | UUID FK (nullable) | → households |
| title | VARCHAR(255) | |
| task_type | VARCHAR(50) | scam_check/refund_request/complaint/subscription_cancel/document_review/bill_check/shopping_risk/general_life_issue |
| status | VARCHAR(30) | draft/pending_info/analyzing/waiting_confirmation/ready_to_execute/in_progress/waiting_response/completed/failed/archived |
| risk_level | VARCHAR(20) | low/medium/high/critical |
| description | TEXT | |
| deadline_at | TIMESTAMP (nullable) | |
| reminder_at | TIMESTAMP (nullable) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### task_files
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| task_id | UUID FK | → tasks |
| file_id | UUID FK | → files |
| created_at | TIMESTAMP | |

#### analyses
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| task_id | UUID FK | → tasks |
| file_id | UUID FK (nullable) | → files |
| analysis_type | VARCHAR(50) | scam_check/document_review/action_plan |
| summary | TEXT | |
| risk_level | VARCHAR(20) | |
| result_json | JSONB | 结构化结果 |
| model_name | VARCHAR(100) | |
| prompt_version | VARCHAR(20) | |
| created_at | TIMESTAMP | |

#### action_plans
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| task_id | UUID FK | → tasks |
| title | VARCHAR(255) | |
| steps_json | JSONB | |
| draft_text | TEXT | |
| status | VARCHAR(20) | draft/confirmed/executing/completed |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### reminders
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| task_id | UUID FK | → tasks |
| user_id | UUID FK | → users |
| remind_at | TIMESTAMP | |
| channel | VARCHAR(20) | in_app/email/sms |
| status | VARCHAR(20) | pending/sent/dismissed |
| created_at | TIMESTAMP | |

#### audit_logs
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID FK (nullable) | → users |
| task_id | UUID FK (nullable) | → tasks |
| action | VARCHAR(100) | |
| metadata_json | JSONB | |
| created_at | TIMESTAMP | |

#### prompt_templates
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(100) | |
| version | VARCHAR(20) | |
| task_type | VARCHAR(50) | |
| system_prompt | TEXT | |
| user_prompt_template | TEXT | |
| output_schema | JSONB | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

#### model_call_logs
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID FK (nullable) | → users |
| task_id | UUID FK (nullable) | → tasks |
| provider | VARCHAR(50) | |
| model | VARCHAR(100) | |
| input_tokens | INTEGER | |
| output_tokens | INTEGER | |
| latency_ms | INTEGER | |
| status | VARCHAR(20) | success/error |
| error_message | TEXT (nullable) | |
| created_at | TIMESTAMP | |

## 五、API 设计

### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/register | 注册 |
| POST | /api/v1/auth/login | 登录 |
| GET | /api/v1/auth/me | 当前用户 |

### 文件
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/files/upload | 上传文件 |
| GET | /api/v1/files | 文件列表 |
| GET | /api/v1/files/{file_id} | 文件详情 |
| DELETE | /api/v1/files/{file_id} | 删除文件 |
| POST | /api/v1/files/{file_id}/extract | 提取文本 |
| POST | /api/v1/files/{file_id}/summarize | 生成摘要 |

### 任务
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/tasks | 创建任务 |
| GET | /api/v1/tasks | 任务列表 |
| GET | /api/v1/tasks/{task_id} | 任务详情 |
| PATCH | /api/v1/tasks/{task_id} | 更新任务 |
| DELETE | /api/v1/tasks/{task_id} | 删除任务 |

### 分析
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/tasks/{task_id}/analyze-scam | 诈骗分析 |
| POST | /api/v1/tasks/{task_id}/analyze-document | 文件分析 |
| POST | /api/v1/tasks/{task_id}/generate-action-plan | 生成行动计划 |
| GET | /api/v1/tasks/{task_id}/analyses | 分析列表 |
| GET | /api/v1/tasks/{task_id}/action-plans | 行动计划列表 |

### 提醒
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/reminders | 创建提醒 |
| GET | /api/v1/reminders | 提醒列表 |
| PATCH | /api/v1/reminders/{reminder_id} | 更新提醒 |

### 管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/admin/model-call-logs | 模型调用日志 |
| GET | /api/v1/admin/prompt-templates | Prompt 模板列表 |
| POST | /api/v1/admin/prompt-templates | 创建 Prompt 模板 |
| PATCH | /api/v1/admin/prompt-templates/{id} | 更新 Prompt 模板 |

### 统一错误格式
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "人类可读的错误描述",
    "details": {}
  }
}
```

## 六、AI 层架构

### LLM Provider Adapter

```
┌─────────────────────┐
│   AnalysisService   │  ← 业务层调用
└─────────┬───────────┘
          │
┌─────────▼───────────┐
│  LLMClient          │  ← 统一调用接口
└─────────┬───────────┘
          │
   ┌──────┼──────┐
   │      │      │
┌──▼──┐ ┌▼───┐ ┌▼───────┐
│Mock │ │OAI │ │Future  │
│     │ │    │ │Provider │
└─────┘ └────┘ └────────┘
```

- `LLMClient` 接受 provider 配置，统一 `chat(messages, schema)` 接口
- `MockProvider` 返回预设结构化结果
- `OpenAIProvider` 调用 OpenAI-compatible API
- 通过环境变量 `LLM_PROVIDER` 切换

### Prompt 模板服务

- 所有 prompt 存储在 `app/services/llm/prompts/` 目录
- 每个模板有名称和版本号
- 支持变量插值 `{{variable}}`
- 数据库中也有 `prompt_templates` 表用于运行时管理

### 核心服务层

| 服务 | 职责 |
|------|------|
| PromptTemplateService | 加载/渲染 prompt 模板 |
| LLMClient | 统一调用大模型 |
| AnalysisService | 编排分析流程 |
| RiskScoringService | 规则评分 + AI 评分结合 |
| DocumentExtractionService | 文件文本提取 |

## 七、安全架构

- JWT Token 认证
- 密码 bcrypt 哈希
- CORS 白名单
- 文件上传类型/大小限制
- 敏感信息脱敏展示
- 高风险操作二次确认
- SQL 注入防护 (ORM)
- XSS 防护 (前端框架默认)
- API Rate Limiting

## 八、部署架构

### 开发环境
- Docker Compose 一键启动
- 热重载前端/后端
- 本地 PostgreSQL + Redis

### 生产环境 (后续)
- Nginx 反向代理 + SSL
- PostgreSQL 托管
- Redis 托管
- MinIO / S3 文件存储
- Celery Worker 独立部署
