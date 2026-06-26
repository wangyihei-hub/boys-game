# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## 项目简介

**学科小勇士** — 家庭版儿童学科闯关 PWA 游戏。小学 4-5 年级孩子通过答题战斗闯关学习语文、数学、英语。家长通过独立管理后台配置题库、奖励和系统设置。无后端服务，所有数据持久化在浏览器 IndexedDB 中。

## 常用命令

```bash
npm run dev          # 启动 Vite 开发服务器 (http://localhost:5173)
npm run build        # TypeScript 类型检查 + Vite 生产构建
npm run preview      # 预览生产构建产物
npm test             # 运行 Vitest 测试（默认 watch 模式）
npm test -- --run    # 单次运行测试（CI 模式）
npm run test:ui      # 运行测试并打开 Vitest UI
```

目前尚未配置 linter 或格式化工具。

## 架构概览

### 双入口路由

应用有两个独立入口，共享同一份数据层：

- **`/play`** — 孩子端：战斗、地图、商城、成就等游戏界面
- **`/parent`** — 家长端：仪表盘、AI 出题、奖励管理、系统设置
- `/` 根路径自动重定向到 `/play`

路由使用 `react-router-dom` v7 的 `createBrowserRouter`，定义在 `src/router.tsx`。

### 数据流

```
组件 → Zustand Store（内存状态） → IndexedDB via idb（持久化）
```

- **Zustand** 管理运行时状态，每个 store 的 async action 直接读写 IndexedDB
- **IndexedDB**（`src/db/index.ts`）是唯一的持久化层，通过 `idb` 的 `DBSchema` 接口定义 schema。无后端服务
- Layout 组件（`PlayLayout`、`ParentLayout`）在 `useEffect` 中触发数据加载，并通过 loading 守卫控制渲染

### 关键目录

| 路径 | 职责 |
|---|---|
| `src/db/` | IndexedDB schema（`GameDB` 接口）和带类型的 CRUD 工具函数 |
| `src/stores/` | Zustand store — `profileStore`（孩子档案）、`parentStore`（设置、奖励、兑换） |
| `src/types/` | 共享 TypeScript 领域类型（`Profile`、`Question`、`Reward`、`ParentSettings` 等） |
| `src/pages/` | 路由级页面组件 |
| `src/components/layout/` | `PlayLayout` 和 `ParentLayout` — 包裹子路由并负责数据加载 |
| `src/styles/index.css` | Tailwind 分层 + 可复用组件类（`.card`、`.btn-primary`、`.btn-secondary`） |

### 技术选型

- **React 19** + **Vite 6** + **TypeScript strict 模式**
- **Tailwind CSS 3** 负责所有样式 — 不使用外部 UI 组件库
- **Zustand 5** 做状态管理（不用 Redux / Context）
- **idb 8** 操作 IndexedDB（不用原生 IndexedDB 或 Dexie）
- **Vitest** + **jsdom** 做测试
- **Vite PWA 插件** 自动生成 Service Worker 和 manifest
- 纯 CSS/HTML 卡通视觉风格 — 无图片资源

### 学科配色 Token

Tailwind 自定义颜色（定义在 `tailwind.config.ts`）：

- **语文**：`chinese-100/500/700` — 绿色系
- **数学**：`math-100/500/700` — 蓝色系
- **英语**：`english-100/500/700` — 黄色系

### 自定义动画

- `animate-bounceShort` — 短弹跳效果（0.5s）
- `animate-shake` — 水平抖动，用于攻击特效（0.4s）

## Git Worktree 结构

本仓库使用 git worktree。主要工作代码位于 `.worktrees/phase1-foundation/` 目录下。运行 `npm run dev` 或 `npm test` 等命令时，需要先 `cd` 到该目录。

## 设计文档

- **产品规格**：`docs/superpowers/specs/2026-06-26-儿童学科闯关游戏-design.md` — 完整架构、数据模型、游戏机制、奖励系统
- **Phase 1 实现计划**：`docs/superpowers/plans/2026-06-26-phase1-project-foundation-plan.md` — 基础框架实现任务及代码
