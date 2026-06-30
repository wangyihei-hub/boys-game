# V3 重构计划 · 学霸星球（boys-game）

> 本文档 = 下个会话恢复的**唯一权威入口**。所有上下文、决策、待办都在这里。

## 0. 一句话目标

把当前 27 关（每科 9 关）线性架构升级为 **三科 ×100 关 ×(30 普通题 + 1 Boss)** 的新版本，三科同步推进，加入体力系统，主页重做为单视图营地。

## 1. 已锁定的产品决策（不要再问用户）

| 主题 | 决策 |
|---|---|
| 关卡总数 | 语文 100 + 数学 100 + 英语 100 |
| 每关结构 | 30 道普通题 + 1 个 Boss 模块（含 5 道小题） |
| 普通题抽取 | 每次闯关从 30 道里随机抽 10 道；失败重新抽 |
| 过关条件 | 10 道普通题 + 5 道 Boss 小题**全部答对** |
| 失败惩罚 | 不扣星，但已消耗体力不返还 |
| 推进规则 | 三科**并行**：语 N + 数 N + 英 N 全过 → 解锁第 N+1 关 |
| 每日上限 | 每天最多通过 10 关（一关 = 三科同号全过） |
| 体力 | 上限 10、每关消耗 1（成败都扣）、每分钟自动回 1 |
| 主页 | 单视图营地，删除底部 6 Tab 导航 |
| 主页保留 | 错题本 / 商城 / 成就 / 抽奖 / 每日任务 / 体力条 / X/10 进度 |
| 家长入口 | 仅 `/parent`，主页不展示 |
| 英语 Boss | 奇数关短文阅读，偶数关情景对话（5 道小题） |
| 难度梯度 | L001-L033 难度 1，L034-L066 难度 2，L067-L100 难度 3 |
| 闯关方法 | 在题库生成完成前，先用方案 B（并行 Agent 撰写）保证题面原创高质量 |

## 2. 当前进度

- ✅ V3 题库 Schema 设计：`docs/v3/SCHEMA.md`
- ✅ 三科 outline 抽取：`docs/v3/inputs/{chinese,math,english}_outline.json`（每条 `{level, grade, topic, difficulty}`）
- ✅ 语文 Boss 100 篇阅读已写好（4 题/篇）：`docs/v3/inputs/chinese_bosses.json`
- ✅ 数学 Boss 100 道大题已写好（3 题/题）：`docs/v3/inputs/math_bosses.json`
- ✅ 原始 markdown 资产（含 5 道样题/关）：`docs/v3/boss-raw/{chinese,math,english}_100_levels.md`
- ⏳ 普通题 30 道/关 ×300 关 = **9000 道**（待生成 - 方案 B）
- ⏳ 英语 Boss 100 关（短文+对话混合）= **500 道**（待生成 - 方案 B）
- ⏳ Boss 题数升级到 5 道：语文/数学当前 Boss 是 4 题/3 题，需各补 1–2 题到 5 题（或保持当前条数并把 schema 改成 `parts.length 可变`，推荐保留每个学科原有题数）
- ⏳ boys-game 代码重构（全部 pending）

**注意：第 3 节给出推荐的题型差异化处理。**

## 3. 题库生成方案（方案 B - 并行 Agent）

### 3.1 学科分工与并行度

- 每科 100 关，每 10 关一个 agent 任务 → **每科 10 个 agent，3 科共 30 个 agent**
- 全部并行，最高吞吐
- 每个 agent 用 structured output schema 强制返回结构化 JSON
- 失败时单独重跑该批次（10 关 ≈ 300 道题），不影响其他批次

### 3.2 每个 agent 的输入

```json
{
  "subject": "chinese",
  "levels": [
    { "level": 1, "grade": 4, "topic": "多音字辨析", "difficulty": 1 },
    { "level": 2, "grade": 4, "topic": "形近字辨析", "difficulty": 1 },
    ...10 关
  ],
  "boss_already_done": true,   // 语文/数学=true，英语=false
  "requirements": "每关 30 道普通题，选择 ≥18 题、填空 ≤12 题，原创不重复，符合小学 4-5 年级真题难度"
}
```

### 3.3 每个 agent 的输出 schema

```ts
{
  levels: Array<{
    level: number,
    topic: string,
    questions: Array<{   // 30 道
      id: string,                          // e.g. "c-L001-Q01"
      type: "choice" | "fillblank",
      question: string,
      options?: [string, string, string, string],
      answer: number | string,             // choice → 0-3; fillblank → 字符串
      explanation?: string
    }>,
    // 仅英语 agent 输出：
    boss?: {
      prompt: string,    // 奇数关短文 / 偶数关对话
      parts: Array<{ id, type, question, options?, answer, explanation? }>  // 5 题
    }
  }>
}
```

### 3.4 已有 Boss 的 normalization

把 `docs/v3/inputs/chinese_bosses.json` 与 `math_bosses.json` 转成统一 `V3Boss` 结构（`{ prompt, parts:[5] }`）：

- **语文 Boss**：现 4 题/篇 → 让 agent 各加 1 题，使每篇成 5 题（一次单独 agent 做完）
- **数学 Boss**：现 3 题/题 → 让 agent 各加 2 题，成 5 题
- **英语 Boss**：上面 3.2-3.3 中由生成 agent 一并产出

### 3.5 落盘格式

每关一个 JSON 文件，放进仓库：

```
src/data/v3/bank/
  chinese/L001.json … L100.json
  math/L001.json … L100.json
  english/L001.json … L100.json
  index.ts          // 用 import.meta.glob 或显式 import 聚合
```

## 4. 代码重构清单（按顺序执行）

### 4.1 新增 src/data/v3/

- `src/data/v3/types.ts`：`V3Question / V3Boss / V3BossPart / V3Level`
- `src/data/v3/bank/{subject}/L***.json`（300 关）
- `src/data/v3/index.ts`：导出 `getV3Level(subject, levelNumber): V3Level`、`SUBJECTS = ['chinese','math','english']`、`LEVEL_COUNT = 100`

### 4.2 新增 stamina 系统

- `src/types/index.ts` 给 `Profile` 加：
  ```ts
  stamina: number;             // 当前点数 0..10
  staminaUpdatedAt: number;    // 上次刷新时刻（用于按分钟回血）
  dailyPassCount: number;      // 今日通过的"统一关号"数量（0..10）
  dailyPassDate: string;       // YYYY-MM-DD，跨日重置 dailyPassCount
  currentLevelNumber: number;  // 当前统一关号 1..100（三科同号）
  ```
- `src/services/staminaLogic.ts`：纯函数 `refreshStamina(profile, now)`、`consumeStamina(profile)`、`canEnterLevel(profile)`
- 常量：`MAX_STAMINA = 10`、`STAMINA_REGEN_MS = 60 * 1000`、`STAMINA_PER_ATTEMPT = 1`、`DAILY_PASS_LIMIT = 10`

### 4.3 重构 gameStore

- 删除 `STAGES` 常量
- 新增 `startV3Battle(subject, levelNumber)`：从 V3 题库随机抽 10 普通题 + 1 Boss（含 5 小题）
- `submitAnswer`：判定单题对错；任何错题写入错题本（用 questionId = `c-L001-Q07` / `c-L001-BOSS-1`）
- `finishBattle`：全对则 markSubjectPassed(subject, levelNumber)；三科同号全过 → `currentLevelNumber++` 且 `dailyPassCount++`
- Progress 表结构改为：`{ subject, levelNumber, passed: boolean, passedAt: number }`，key = `${subject}-${levelNumber}`
- IndexedDB schema 升一版（v6）

### 4.4 重构主页 PlayHome.tsx

- 顶部状态条：星星 / 库存 / **体力 X/10** / **今日 X/10 关**
- 中部三张大卡：语文 L042 / 数学 L042 / 英语 L042（已过则灰、未过则可点）；点击 → `/play/battle/{subject}/L042`
- 下方模块格子：错题本 / 商城 / 抽奖 / 每日任务 / 成就 / 副本（保留 minigames）
- 移除"今日课程"区块、"去闯关"按钮、整个 WorldMap 入口

### 4.5 删除 PlayLayout 底部 Tab

`src/components/layout/PlayLayout.tsx` 删除 `<nav>` 与 `TABS`。家长入口仅靠输入 `/parent` URL 进入（不在 PlayHome 露出）。

### 4.6 重构 Battle 页

- 进入时若 stamina < 1 或今日已通 10 关：直接 toast 拒绝 + 跳回主页
- 进入立即扣 1 点体力（不论成败）
- 答错任一普通题/Boss 小题 → 立即结束，记录错题，回主页
- 全对 → 调 `markSubjectPassed`，回主页

### 4.7 删除的旧代码

- `src/pages/WorldMap.tsx`（删除路由）
- `src/stores/questionStore.ts` 的 `getQuestionsForBattle`（改成读 V3 bank）
- `src/services/aiQuestion.ts`、`src/services/localQuestionGenerator.ts`（保留文件，但 UI 入口删除）
- `src/data/seedQuestions.ts`（删除）
- `src/services/curriculumLogic.ts` 与 `ParentCurriculum.tsx`（保留入口但不再驱动战斗）
- IndexedDB 的 `questions` store 不再写入（保留以便兼容旧数据，新版从 V3 bank 读）

### 4.8 错题本对齐

`WrongQuestion` 加字段 `levelNumber: number, isBoss: boolean`；写入逻辑：`/services/wrongLogic.ts`。

### 4.9 测试

- 修复 `tests/gameStore.test.ts`（STAGES 已删）
- 新增 `tests/staminaLogic.test.ts`
- 新增 `tests/v3BankLoading.test.ts`（任选若干关验证 JSON 完整性 + answer 类型）
- 删除 `tests/questionStore.test.ts` 的 getQuestionsForBattle 用例

## 5. 飞书在线文档

三科文档 ID（已存在）：
- 语文：`Czemd0UZRoFeOWx6uHWcp5a3nob`
- 数学：`UuogdntLmo6acexAMaKctAbBnBd`
- 英语：（需查找；若没有可用 lark-cli 新建）

更新策略（避免 append 静默失败）：

1. `lark-cli docs +update --command overwrite --doc-format markdown --content '@chunk_0.md'`
2. `lark-cli docs +fetch --detail with-ids` 拿最后 block ID
3. 后续 chunk 用 `block_insert_after` 指向最后 block ID

把 9500 道新题渲染为 markdown 文档（每关 30 道普通题 + Boss）后分块上传。

## 6. 下个会话恢复步骤（按顺序执行）

```
1. cd /d/coder/boys-game
2. git pull --ff-only github master    # 拉取本次推送的筹备资产
3. 读取 docs/v3/PLAN.md（本文件）和 docs/v3/SCHEMA.md
4. 读取 docs/v3/inputs/*.json（outline + 已有 Boss）
5. 启动 30 个并行 agent 生成 9000 道普通题，按 3.5 节落盘
6. 启动 3 个 agent：语文 Boss +1 题 / 数学 Boss +2 题 / 英语 Boss 整套
7. 写 src/data/v3/{types.ts,index.ts}
8. 实施 4.2-4.9 代码改造
9. npm run test:types && npm test -- --run && npm run build
10. 把 9500 道新题 + Boss 渲染为 3 份 markdown，按 5 节上传飞书
11. git commit + push 到 github & gitee
```

## 7. 重要历史决策与陷阱（来自 MEMORY）

- 飞书 `append` 命令对大文档"成功"但实际未追加；必须用 `overwrite` + `block_insert_after`
- Windows 下 `@file.md` 用 cmd 不识别单引号，要 Bash 工具或双引号
- `createHashRouter`，家长端实际是 `http://localhost:5173/#/parent`
- React strict mode + TS strict；测试用 Vitest + jsdom
- 数学 Boss 已修复随机数 dedup bug（详见 `generate_boss-exam-style.js` 历史记录）
- 路由器底部 Tab 在 `PlayLayout.tsx:9-16`，重构需同步删
- gameStore.ts 内联了 `STAGES`，没有独立 stages.ts
- WorldMap 战斗题源仅按 `subject + difficulty` 筛后 shuffle slice，无 stageId 耦合，V3 重构的关键缝在此

## 8. 资产清单（仓库内）

```
docs/v3/
├── SCHEMA.md                    # 新题库 JSON 结构定义
├── PLAN.md                      # 本文件（恢复入口）
├── extract_inputs.js            # 从 outputs 解析 outline + bosses
├── inputs/
│   ├── chinese_outline.json     # 100 条 {level, grade, topic, difficulty}
│   ├── math_outline.json        # 100 条
│   ├── english_outline.json     # 100 条
│   ├── chinese_bosses.json      # 100 篇阅读 (4 题/篇，待升 5 题)
│   └── math_bosses.json         # 100 道大题 (3 题/题，待升 5 题)
└── boss-raw/
    ├── chinese_boss_l001_l020.json ... l081_l100.json (5 个分文件原始数据)
    ├── chinese_100_levels.md
    ├── math_100_levels.md
    └── english_100_levels.md
```

## 9. 飞书恢复提示词链接

新会话开始时贴入该链接的内容（含本文件全部）：

> 见下次会话提供的飞书文档链接。
