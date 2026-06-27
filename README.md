# SCI Writer — 零门槛 SCI 论文写作助手

> 🏆 **Trae 创造力大赛参赛作品**
>
> **[📄 点击查看完整技术方案书](competition.html)** — 评审可直接在浏览器中打开

## 一句话介绍

一款完全基于传统软件工程架构的 SCI 论文写作辅助系统。将复杂的 IMRaD 结构拆解为 25 个标签化的"填空题"，内置 89 条学术句型模板，填写完成后一键编译为 LaTeX / PDF / Word。**零 AI 依赖，100% 确定性逻辑。**

---

## 竞赛评审快速入口

| 项目 | 说明 |
|------|------|
| 📄 **技术方案书** | [competition.html](competition.html) — 浏览器直接打开，含完整架构、功能清单、竞品对比 |
| 🚀 **在线体验** | `cd frontend && npm run dev` → http://localhost:3000（纯前端，无需后端） |
| 📦 **源码** | 前端 10 个源文件 + 后端 7 个引擎 + 4 个 API 路由 + 种子数据 |
| 💻 **全栈运行** | `docker-compose up -d`（5 服务一键编排，含 LaTeX/PDF 编译） |

---

## 能解决什么问题

| 痛点 | 方案 |
|------|------|
| 普通人不知道论文每部分该写什么 | 6 个章节拆成 25 个带提示、示例、字数指导的填空题 |
| 不会写学术英语 | 89 条手工编排的句型模板，按写作意图三级分类，点选填充即可 |
| 搞不定 LaTeX 和期刊排版 | JSON → Document AST → LaTeX/Word 自动编译，预置 4 种期刊模板 |

---

## 快速体验

### 方式一：纯前端（推荐，无需安装任何东西）

```bash
cd frontend
npm install
npm run dev
# 浏览器打开 http://localhost:3000
# 点击 "开始写作（本地模式）" — 所有数据保存在浏览器 localStorage
```

### 方式二：全栈（含 LaTeX/PDF 导出）

```bash
docker-compose up -d                          # 启动 PostgreSQL + Redis + LanguageTool + Backend
docker-compose exec backend python -m seed_data.run_seed  # 初始化句型库
# API 文档: http://localhost:8000/docs
```

---

## 技术架构

```
┌─────────────────────────────────────────────────┐
│  React 18 + TypeScript + Ant Design 5 + Zustand │
│  独立 localStorage 模式（零后端依赖）              │
└──────────────────┬──────────────────────────────┘
                   │ REST API (JSON)
┌──────────────────┴──────────────────────────────┐
│  Python FastAPI + SQLAlchemy 2.0 + PostgreSQL 15 │
│  ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│  │ 句型库服务│ │ 文献导入器 │ │ 校验规则引擎   │  │
│  └──────────┘ └───────────┘ └────────────────┘  │
│  ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│  │LaTeX编译器│ │Word编译器 │ │ 引文格式化(5种) │  │
│  └──────────┘ └───────────┘ └────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────┐
│  PostgreSQL JSONB  ←→  Document AST (12 节点)    │
│  → LaTeX (xelatex) → PDF                        │
│  → python-docx     → .docx                       │
└─────────────────────────────────────────────────┘
```

**核心创新：Document AST 中间表示** — 论文数据在数据库中存为 JSONB，导出时先编译为统一的文档对象模型（Section → Paragraph → Run 树），然后分发给 LaTeX 或 Word 编译器。新增一种导出格式只需写一个新 Compiler。

---

## 当前交付物（66 个文件）

### 前端（10 个源文件）

| 组件 | 功能 |
|------|------|
| `App.tsx` | 欢迎页：三列特性 + 本地/后端双模式入口 |
| `PaperWizard.tsx` | 6 步向导：进度环 + 校验面板 + 句型库入口 |
| `StructuredSectionEditor.tsx` | 结构化填空题：提示、示例、字数计数、金色悬停发光 |
| `PhraseBrowser.tsx` | 句型浏览器：三级分类树 + 搜索 + 一键插入 |
| `ExportPreview.tsx` | 导出面板：PDF/LaTeX/Word + 期刊模板选择 |
| `sectionSchemas.ts` | **25 个标签化字段**：Abstract(5) + Introduction(4) + Methods(5) + Results(3) + Discussion(5) + Conclusion(3) |
| `paperStore.ts` | Zustand 状态管理：localStorage 持久化 + API 同步双模式 |

### 后端（7 个引擎 + 4 个 API 路由）

| 引擎 | 功能 |
|------|------|
| `document_ast.py` | 12 种节点类型的文档中间表示，frozen dataclass + 双向序列化 |
| `phrase_assembler.py` | 模板变量替换引擎：类型校验（text/number/select）+ 缺失插槽检测 |
| `latex_compiler.py` | DocumentAST → .tex，4 种期刊 preamble，xelatex 编译 |
| `docx_compiler.py` | DocumentAST → .docx（python-docx），格式规则可配置 |
| `citation_formatter.py` | 5 种引文格式独立实现（IEEE/APA/Vancouver/Nature/MLA） |
| `numbering_engine.py` | 图表/公式自动编号（顺序 / 按章节双模式） |
| `reference_importer.py` | **手写** BibTeX + RIS 双格式解析器，括号深度追踪，作者名规范化 |

### 种子数据

- **89 条**学术句型模板（Introduction 28 + Methods 17 + Results 13 + Discussion 23 + Conclusion 8）
- **4 个**期刊模板配置（IEEE / Elsevier / Springer / Nature）
- **3 个** LaTeX Jinja2 模板

---

## 与现有工具的差异

| 维度 | SCI Writer | Overleaf | Word 模板 | AI 写作工具 |
|------|-----------|----------|----------|-----------|
| 写作引导 | ✅ 25 个结构化字段 | ❌ 空白编辑器 | ❌ 空白文档 | ⚠️ 依赖 prompt |
| 学术句型库 | ✅ 89 条手工模板 | ❌ 无 | ❌ 无 | ⚠️ 不可控生成 |
| 结构化校验 | ✅ 14 条声明式规则 | ❌ 仅拼写 | ❌ 仅拼写 | ❌ 无 |
| AI 依赖 | ✅ **零 AI** | ✅ 零 AI | ✅ 零 AI | ❌ 100% LLM |
| 运行方式 | 浏览器直接打开 | SaaS 在线 | 本地安装 | SaaS 在线 |

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18, TypeScript, Ant Design 5, Zustand, Vite |
| 后端 | Python 3.12, FastAPI, SQLAlchemy 2.0 (async) |
| 数据库 | PostgreSQL 15 (JSONB 结构化论文内容) |
| 缓存/队列 | Redis 7 + Celery (异步 PDF 编译) |
| 排版 | MiKTeX (xelatex), python-docx, Pandoc |
| 语法检查 | LanguageTool (Docker, 开源本地部署) |
| 容器化 | Docker + Docker Compose |

---

## 项目结构

```
scipaper/
├── frontend/src/
│   ├── components/
│   │   ├── Wizard/              # 6 步向导主组件
│   │   ├── StepForm/            # 结构化填空题编辑器
│   │   ├── PhraseBrowser/       # 学术句型浏览器
│   │   └── ExportPreview/       # 导出/下载面板
│   ├── data/                    # 25 个字段的章节 Schema 定义
│   ├── stores/                  # Zustand 状态管理
│   └── api/                     # Axios API 客户端
├── backend/app/
│   ├── engines/                 # 7 个核心引擎
│   ├── parsers/                 # 手写 BibTeX/RIS 解析器
│   ├── services/                # 句型/导出/校验服务
│   ├── models/                  # SQLAlchemy ORM（11 张表）
│   ├── schemas/                 # Pydantic Schema
│   └── api/                     # FastAPI 路由（24 个端点）
├── backend/seed_data/           # 句型库 + 期刊模板种子数据
├── templates/                   # LaTeX Jinja2 模板
├── docker-compose.yml           # 5 服务编排
├── competition.html             # 参赛技术方案书（浏览器直接打开）
└── CLAUDE.md                    # 项目架构文档
```

---

**设计哲学：不替代用户思考，而是提供结构和选项。用户始终是自己论文的唯一作者。**
