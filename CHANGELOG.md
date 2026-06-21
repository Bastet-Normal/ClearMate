# Changelog

All notable changes to ClearMate will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-06-21

### Added
- **全站关键页面适老化语音朗读支持 (TTS)**：在任务详情、风险自检和消费避坑页面添加语音播放控件，支持在老年大字模式下自动降低语速至 0.85 倍。
- **AI 诊断引擎来源透明化标签**：在任务详情中显示诊断来源的真实标记（规则引擎本地、智能 AI 后端、直连 Gemini AI）。
- **客户端数据沙盒备份与还原**：在设置页中支持对本地存储的任务、诊断以及配置进行备份导出 JSON 与导入复原。
- **客户端 PDF.js 文本解析与容灾**：在新建任务中支持通过标准 PDF.js 提取纯文本，并在故障时无缝降级。
- **语音输入声波微动画**：为主页麦克风图标添加动态声波振幅脉冲效果，提升老年用户交互友好度。
- **统一公文模板智能装配**：提取公共 `template-filler` 匹配工具，实现对姓名、手机号、金额、商家等核心参数的自动对齐与渲染。

### Fixed
- 修复了 Next.js 生产包编译中关于 `pdfjs-dist` 可选 Node 依赖（`canvas` / `encoding`）的 webpack 解析错误。

## [0.1.0] - 2025-06-18

### Added
- Project initialization with monorepo structure
- PRD, Architecture, and Implementation Plan documents
- FastAPI backend scaffold with `/health` endpoint
- Next.js frontend scaffold with home page (3 core entry buttons)
- Docker Compose configuration (PostgreSQL + Redis + API + Web)
- Environment variable template (.env.example)
- Basic project configuration and CORS setup
