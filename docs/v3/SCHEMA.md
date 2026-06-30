# V3 题库 JSON Schema

## 文件组织

```
src/data/v3/bank/
  chinese/
    L001.json
    L002.json
    ...
    L100.json
  math/
    L001.json ... L100.json
  english/
    L001.json ... L100.json
  index.ts        // import 全部 + 类型化导出
```

## LevelBank 顶层结构

```ts
export type V3Subject = 'chinese' | 'math' | 'english';
export type V3Difficulty = 1 | 2 | 3;

export interface V3Question {
  id: string;             // e.g. "c-L001-Q07"
  type: 'choice' | 'fillblank';
  question: string;       // 题面（普通题，单行）
  options?: string[];     // choice 时 4 选项
  answer: number | string; // choice → index (0-3); fillblank → 字符串
  explanation?: string;
}

export interface V3BossPart {
  // 通用：Boss 共 5 道小题，全对才算 Boss 通过
  id: string;             // e.g. "c-L001-BOSS-1"
  type: 'choice' | 'fillblank';
  question: string;
  options?: string[];
  answer: number | string;
  explanation?: string;
}

export interface V3Boss {
  // 语文：阅读理解；数学：应用大题；英语：奇短文/偶对话
  prompt: string;         // 题干材料（阅读短文 / 大题情境 / 对话）
  parts: V3BossPart[];    // 5 道小题，全部答对 = Boss 过
}

export interface V3Level {
  level: number;          // 1..100
  subject: V3Subject;
  topic: string;          // 章节/知识点名称
  difficulty: V3Difficulty;
  questions: V3Question[]; // 30 道普通题
  boss: V3Boss;
}
```

## 闯关计算规则

```
进入第 N 关 (某学科)
  → 从 level.questions (30 道) 中用 Fisher–Yates 随机抽 10 道
  → 用户依次答完 10 道
  → 全对 → 进入 boss 阶段
  → 依次答 boss.parts (5 道)
  → 全对 → 该学科 N 关通过
  → 三科 N 关同时通过 → 解锁 N+1 关
  
失败（任何一题错或 Boss 一题错）
  → 整关不通过，已消耗体力不返还
  → 下次再进入：重新随机抽 10 道普通题
```

## 体力 / 推进规则

- 体力上限 `maxStamina = 10`
- 每分钟自动恢复 1 点（基于 `lastStaminaUpdateAt` 计算）
- 进入一关消耗 1 点（失败也不返还）
- 每日通过 10 关后当天剩余关卡无法进入；次日 0 点重置
- `Progress` 仍按 stageId 存，但只记录 `passed` 与否，不存历史题目

## 错题本写入

```ts
// 任何答错的题都写入
WrongQuestion {
  questionId: 'c-L001-Q07' | 'c-L001-BOSS-1',
  subject, levelNumber, topic,
  question, answer (correct), userAnswer, options?,
  firstWrongAt, lastWrongAt, wrongCount
}
```

## 题型分布建议（普通 30 题）

- 选择题（4 选 1）≥ 18 道
- 填空题 ≤ 12 道
- 语文 / 英语：以 choice 为主，少量填空（如听写、首字母）
- 数学：填空与选择 1:1，确保口算/算式题验证容易

## 难度分布

每关 `difficulty` 取关号决定：
- L001-L033 → 难度 1
- L034-L066 → 难度 2
- L067-L100 → 难度 3

每关内部 30 道题混合难度，约 70% 同级 + 20% 低一档 + 10% 高一档。
