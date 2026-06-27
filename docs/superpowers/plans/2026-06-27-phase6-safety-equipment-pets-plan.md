# Phase 6: 健康使用、数据安全与装备宠物系统

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐 design 文档中尚未实现的家长管控、数据安全与战斗成长深度：让孩子端健康使用规则真正生效，家长可导出/导入数据并设置 PIN；同时引入装备与宠物系统，让世界地图和战斗更具可玩性。

**Architecture:** 继续 React PWA + Zustand + IndexedDB 架构。所有新状态仍持久化到 IndexedDB，不引入后端。装备/宠物定义用本地 catalog，实例写入 `inventory` store；每日使用统计写入新增 `dailyStats` store。

**Tech Stack:** React latest stable + Vite + Tailwind CSS + React Router DOM + Zustand + idb + Vitest

---

## Global Constraints

- React latest stable（避免向用户提具体版本号）
- TypeScript strict；所有新增文件必须有类型
- Tailwind CSS 负责全部样式；不引入外部 UI 组件库
- 纯 CSS/HTML 卡通风格；无图片资源
- IndexedDB 本地持久化；无后端
- 家长设置 UI 必须可视化（滑块、卡片），避免表单堆砌
- 每个任务结束时有可验证的交付物和一次提交

---

## Scope Control

**本阶段包含：**
1. 健康使用规则落地：每日星星上限、每日时长上限、护眼提醒、21 点后休息模式
2. 数据安全：家长 PIN、全部数据导出/导入
3. 装备系统：武器/盾牌/法杖/鞋子四件套，装备影响战斗数值
4. 宠物系统：宠物选择、喂养、被动技能、进化条件

**本阶段不包含（留到后续）：**
- 语音识别/英语口语
- 接入外部作业系统
- 新增学科
- 根据错题自动调整 AI 出题策略
- 打印版学习护照
- 装备/宠物外观在战斗动画中的实时换装（先只显示图标和数值）

**范围兜底：** 若实现中发现装备+宠物过重，可自然拆分为 6a（健康/数据）和 6b（装备/宠物）两个子阶段；本计划按一个 Phase 编排，任务之间解耦。

---

## File Structure Overview

```
src/
├── types/index.ts                    # 新增 DailyStats、扩展 InventoryItem、Pet、EquipmentDef 等
├── db/index.ts                       # DB_VERSION 4→5，新增 dailyStats store
├── services/
│   ├── usageLogic.ts                 # 每日星星/时长统计、护眼/休息模式判定
│   ├── exportImportLogic.ts          # 全量数据导出/导入、版本校验
│   ├── pinLogic.ts                   # PIN 校验（家庭内部简单实现）
│   ├── equipmentLogic.ts             # 装备 catalog、装备/卸装、战斗属性加成
│   └── petLogic.ts                   # 宠物 catalog、喂养、进化、被动技能
├── stores/
│   ├── profileStore.ts               # 接入 dailyStats、PIN 校验、装备/宠物状态读取
│   ├── parentStore.ts                # 保存/校验 PIN、健康设置生效
│   ├── gameStore.ts                  # 战斗后上报时长和星星到 dailyStats
│   └── economyStore.ts               # 扩展商城：售卖装备、宠物、宠物饲料
├── components/play/
│   ├── EyeCareModal.tsx              # 护眼提醒弹窗
│   ├── RestModeOverlay.tsx           # 休息模式遮罩
│   ├── EquipmentPanel.tsx            # 装备面板（入口放在 PlayHome）
│   ├── PetPanel.tsx                  # 宠物面板
│   ├── PetAvatar.tsx                 # 宠物头像/进化展示
│   └── EquipmentCard.tsx             # 装备卡片
├── components/parent/
│   ├── HealthSettingsCard.tsx        # 健康设置可视化卡片
│   ├── PinSettingsCard.tsx           # PIN 设置/校验卡片
│   └── DataExportImportCard.tsx      # 数据导出/导入卡片
├── pages/
│   ├── PlayHome.tsx                  # 增加装备、宠物入口；显示今日剩余可玩时长/星星
│   ├── parent/ParentSettings.tsx     # 新增健康、PIN、数据管理标签页
│   └── parent/ParentDashboard.tsx    # 显示今日使用概览
├── hooks/
│   └── useHealthGuard.ts             # 在 PlayLayout 中统一触发护眼/休息检测
├── tests/
│   ├── usageLogic.test.ts
│   ├── exportImportLogic.test.ts
│   ├── equipmentLogic.test.ts
│   └── petLogic.test.ts
└── router.tsx                        # 可能新增 /play/equipment、/play/pet
```

---

## Data Model Changes

### 新增/修改类型

```typescript
// 每日使用统计
export interface DailyStats {
  id: string;            // dateKey
  dateKey: string;       // YYYY-MM-DD
  starsEarned: number;
  minutesPlayed: number;
  lastActivityAt: number;
}

// 家长设置扩展
export interface ParentSettings {
  dailyStarLimit: number;          // 0-300
  dailyMinuteLimit: number;        // 0-240
  eyeCareIntervalMinutes: number;  // 默认 20
  restModeStartHour: number;       // 默认 21
  apiKey?: string;
  apiProvider?: AIProvider;
  apiEndpoint?: string;
  apiModel?: string;
  pin?: string;                    // 家庭内部简单 PIN
}

// 装备位与定义
export type EquipmentSlot = 'weapon' | 'shield' | 'staff' | 'shoes';

export interface EquipmentDef {
  id: string;
  name: string;
  slot: EquipmentSlot;
  icon: string;
  level: number;
  description: string;
  attackBonus?: number;
  hpBonus?: number;
  critBonus?: number;    // 暴击概率加成，可折算为暴击触发阈值变化
  timeBonus?: number;    // 答题时间加成（毫秒）
  starCost?: number;
}

// 宠物定义
export interface PetDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  skill: 'hint' | 'exclude' | 'heal' | 'double_stars';
  skillDescription: string;
  evolutions: {
    stage: number;
    name: string;
    icon: string;
    requirement: { type: 'correct_count' | 'subject_correct_count' | 'consecutive_days'; target: number; subject?: Subject };
  }[];
}

// 扩展 InventoryItem 以承载装备实例与宠物实例
export interface InventoryItem {
  id: string;
  name: string;
  type: 'skin' | 'effect' | 'furniture' | 'pet_food' | 'lottery_ticket' | 'fragment' | 'equipment' | 'pet';
  icon: string;
  count: number;
  // equipment/pet 专用
  slot?: EquipmentSlot;
  attackBonus?: number;
  hpBonus?: number;
  critBonus?: number;
  timeBonus?: number;
  petDefId?: string;
  evolutionStage?: number;
  bond?: number;
}
```

### DB Schema 升级

- `DB_VERSION` 从 4 升到 5
- 新增 `dailyStats` store：`keyPath: 'id'`
- `inventory` store 已存在，新增类型通过类型系统兼容，无需改索引

---

## 模块设计

### 6.1 健康使用

#### 每日统计

- `usageLogic.ts` 提供：
  - `getTodayKey()`
  - `createEmptyDailyStats(dateKey)`
  - `recordStarsEarned(stats, amount)`
  - `recordMinutes(stats, minutes)`
  - `checkDailyStarLimit(stats, limit)`：返回是否已达上限及剩余数量
  - `checkDailyMinuteLimit(stats, limit)`：同上
  - `isRestMode(settings)`：当前小时 >= restModeStartHour 时返回 true
  - `shouldShowEyeCare(lastReminderAt, intervalMinutes)`：距离上次提醒超过 interval 返回 true
- `profileStore` 加载档案时同时加载今日 `DailyStats`；不存在则创建空记录并写入 DB。
- `gameStore.finishBattle` 完成后：
  - 累计本场获得的星星到 `dailyStats.starsEarned`
  - 累计本场耗时到 `dailyStats.minutesPlayed`
  - 更新 `lastActivityAt`
- `applyTransaction('earn', ...)` 在获得星星时也更新 `dailyStats`（保证任务/抽奖等来源都被统计）。

#### 上限控制

- 达到每日星星上限后：继续答题/任务/抽奖不再发放星星，但经验、成就、任务进度正常记录。
- 达到每日时长上限后：允许完成当前战斗，但战斗结算后弹出提示；之后禁止开始新战斗（WorldMap/Battle 入口禁用或弹窗）。
- 上限数字在 `PlayHome` 顶部展示：今日已获得 / 上限。

#### 护眼与休息模式

- `useHealthGuard` hook：
  - 在孩子端所有页面挂载一个全局定时器（每 60 秒检查一次）。
  - 若进入休息模式时段，显示 `RestModeOverlay`，屏蔽游戏入口，仅保留查看成就/错题本等只读页面。
  - 若满足护眼提醒条件，弹出 `EyeCareModal`，倒计时 60 秒后自动关闭，期间禁止答题。
- 护眼目标达成后自动解锁成就 `eye_care_guard`（新增成就）。

### 6.2 数据安全

#### 家长 PIN

- `pinLogic.ts`：简单数字 PIN 校验（4-6 位），家庭环境不要求加密。
- `ParentSettings` 增加 `pin` 字段。
- 家长端进入“系统设置”或执行“导入数据”时要求输入 PIN（如果已设置）。
- 提供设置 PIN、修改 PIN、清除 PIN 三个操作。

#### 数据导出/导入

- `exportImportLogic.ts`：
  - `exportAllData()`：读取 profiles、questions、progress、rewards、redemptions、transactions、achievements、parentSettings、dailyTasks、lotteryPool、inventory、battleRecords、wrongQuestions、dailyStats，打包为 JSON 并触发浏览器下载。
  - `importAllData(json)`：校验顶层 `version` 和必要 store 结构；先清空对应 store，再批量写入；完成后刷新页面或重新加载各 store。
- UI 放在 `ParentSettings` 的“数据管理”标签，提供“导出全部数据”按钮和“选择文件导入”输入框。

### 6.3 装备系统

#### 装备定义

- `equipmentLogic.ts` 内置 catalog：
  - 武器：+攻击
  - 盾牌：+护盾值
  - 法杖：+暴击触发频率（降低暴击所需连击数）
  - 鞋子：+答题时间上限
- 每件装备为 `InventoryItem` 实例，带 `slot` 和对应加成字段。
- 装备通过商城购买或成就/抽奖获得。

#### 战斗数值接入

- 修改 `battleLogic.ts`：
  - `getMaxPlayerHp(level, equippedItems)`：基础 + 盾牌加成
  - `getBaseDamage(level, equippedItems)`：基础 + 武器加成
  - `calculateAttack(level, combo, critReady, equippedItems)`：法杖加成影响 critReady 逻辑或暴击倍率
  - `CORRECT_ANSWER_TIME_LIMIT_MS + getTimeBonus(equippedItems)`：鞋子加成
- `Battle.tsx` 从 `profileStore` 读取 `equippedItems`，传入 battleLogic。

#### 装备 UI

- 新增 `/play/equipment` 页面（或弹层面板）：
  - 左侧显示四个装备位，点击选择/卸下
  - 右侧显示背包中的装备列表
  - 装备后即时更新 Profile 并持久化
- `PlayHome` 增加“我的装备”入口卡片，并显示当前装备图标缩略。

### 6.4 宠物系统

#### 宠物定义

- `petLogic.ts` 内置 catalog：
  - 初始宠物：小猫/小狗，技能为“提示一次”
  - 进阶宠物：通过学科答题数或连续打卡进化
- 宠物实例存储在 `inventory` 中，类型 `'pet'`，带 `petDefId`、`evolutionStage`、`bond`。
- 宠物饲料（`pet_food`）增加 `bond`，bond 满后满足进化条件可进化。

#### 被动技能

- 在 `Battle.tsx` / `battleLogic.ts` 中接入 `activePet`：
  - `hint`：当孩子答错时随机给出一次提示（本阶段可简化为高亮一个错误选项）
  - `exclude`：开局随机排除一个错误选项
  - `heal`：每答对 3 题恢复少量 HP
  - `double_stars`：战斗胜利时有概率双倍星星
- 技能触发概率/强度与宠物进化阶段挂钩。

#### 进化条件

- `petLogic.ts` 提供 `checkEvolution(pet, progress, records, dailyTasks)`，判断是否满足下一阶段条件。
- 在宠物面板点击“进化”时校验并升级。

#### 宠物 UI

- 新增 `/play/pet` 页面：
  - 显示当前宠物、技能说明、bond 进度、进化条件
  - 列出已拥有的宠物，点击切换 activePet
  - 喂食按钮（消耗 pet_food）
- `PlayHome` 增加“我的宠物”入口卡片，并在角色卡片旁显示宠物图标。

---

## 路由变更

```typescript
{
  path: '/play',
  children: [
    // ... 现有路由
    { path: 'equipment', element: <EquipmentPanel /> },
    { path: 'pet', element: <PetPanel /> }
  ]
}
```

`ParentSettings` 内部新增标签页：
- 每日任务
- 抽奖奖池
- 健康使用（新增）
- 数据安全（新增）

---

## PlayHome 改造

- 在现有入口网格中新增“我的装备”“我的宠物”两个卡片。
- 在角色卡片下方或右侧展示今日健康概览：
  - 今日星星： earned / limit
  - 今日时长： minutes / limit
- 休息模式时段在首页直接显示休息倒计时提示。

---

## Implementation Order

### Part A：健康使用 + 数据安全

1. **类型与 DB**：新增 `DailyStats`，扩展 `ParentSettings`，升级 DB_VERSION 到 5
2. **Usage Logic**：统计、上限、护眼/休息判定 + 单元测试
3. **Profile Store 扩展**：加载/创建 dailyStats，星星/时长上报
4. **Game Store / Economy Store**：战斗和交易后上报时长与星星
5. **Health UI**：`EyeCareModal`、`RestModeOverlay`、`useHealthGuard`
6. **PlayHome**：显示今日使用概览
7. **PIN Logic & UI**：简单 PIN 设置与校验
8. **Export/Import Logic & UI**：数据导出导入
9. **ParentSettings 标签**：健康、PIN、数据管理
10. **ParentDashboard 概览**：今日学习时长、星星收支
11. **测试与构建**

### Part B：装备 + 宠物

12. **Equipment/Pet Types**：扩展 `InventoryItem`，新增 `EquipmentDef`、`PetDef`
13. **Equipment Logic**：catalog、装备卸装、属性加成 + 测试
14. **Battle Logic 接入**：装备影响伤害/HP/暴击/时间
15. **Pet Logic**：catalog、喂养、进化、技能 + 测试
16. **Battle 接入宠物技能**：提示/排除/回血/双倍星星
17. **Shop 扩展**：售卖装备、宠物、饲料
18. **Equipment/Pet UI**：面板、卡片、PlayHome 入口
19. **PlayHome 展示**：装备与宠物缩略
20. **集成测试、类型检查、构建、截图**

---

## Test Strategy

- `usageLogic.test.ts`：每日星星/时长上限、护眼提醒、休息模式判定
- `exportImportLogic.test.ts`：导出结构、导入校验、版本兼容
- `equipmentLogic.test.ts`：装备位唯一性、属性加成汇总、卸装
- `petLogic.test.ts`：喂养增加 bond、进化条件、技能概率
- Store 测试：
  - 达到星星上限后 `applyTransaction('earn')` 不再加星
  - 战斗结束后 `dailyStats` 正确更新
  - 装备切换后 `Profile.equippedItems` 持久化
  - 宠物切换后 `Profile.activePet` 持久化
- UI 测试：通过 CDP 截图验证健康弹窗、装备/宠物页面正常渲染

---

## Risks and Rollback

- **范围较大**：若 Part B 过重，可在 Part A 完成后先合并发布，Part B 作为 Phase 7。
- **DB 升级**：新增 `dailyStats` store，老用户无感知；导入数据时需兼容旧版本缺少的字段。
- **PIN 安全**：仅做简单数字校验，不适用于高安全场景；符合家庭内部使用定位。
- **战斗平衡**：装备/宠物加成需要实测数值，避免早期关卡过于简单或困难。
- **护眼提醒可能打断答题**：确保在答题过程中不强制打断，只在切换题目或进入页面时触发。

---

## Self-Review

**Spec coverage:**
- 健康使用：design §10.2、§8.3
- 数据安全：design §10.3、§10.4
- 装备系统：design §7.5
- 宠物系统：design §7.6

**Placeholder scan:**
- 无 TBD/TODO/"implement later"
- 每个任务结束时有可验证交付物和提交

**Type consistency:**
- 新类型与现有 `InventoryItem`、`ParentSettings`、`Profile` 兼容
- `dailyStats` 通过 dateKey 与 dailyTasks 对齐

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-27-phase6-safety-equipment-pets-plan.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — 每个任务派一个子代理，任务间审查，快速迭代
2. **Inline Execution** — 在本会话中按任务列表顺序执行，分批验证

**Which approach?**
