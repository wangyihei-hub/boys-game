# Phase 2: AI Question Generation System

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable parents to generate Chinese, Math, and English quiz questions via a front-end cloud LLM API, store them in IndexedDB, preview/manage the question bank, and lay the groundwork for offline play.

**Architecture:** A new `src/services/aiQuestion.ts` module abstracts the LLM provider (OpenAI, Anthropic, custom endpoint). Prompt templates live in `src/services/prompts/`. A JSON parser/validator sanitizes model output. Generated questions are persisted to the existing IndexedDB `questions` store. Parent UI gets two new routes: `/parent/questions/generate` and `/parent/questions`.

**Tech Stack:** React latest stable + Vite + Tailwind CSS + Zustand + idb + native `fetch` + Vitest

## Global Constraints

- React latest stable (do not hardcode version numbers in user-facing text)
- TypeScript required for all source files
- Tailwind CSS for all styling; no external UI component libraries
- Pure CSS/HTML cartoon style; no image assets
- IndexedDB for local persistence; no backend
- API Key stored in IndexedDB (`parentSettings.apiKey`), front-end only
- Support OpenAI, Anthropic, and custom endpoint providers
- Parent/admin UI must be visualized (cards, selectors, sliders) rather than form-heavy
- Frequent commits; each task ends with a working, testable deliverable
- All code changes happen in a git worktree for the `phase2-ai-questions` branch

---

## File Structure Overview

New/modified files for Phase 2:

```
src/
├── services/
│   ├── aiQuestion.ts           # Provider abstraction + generation orchestration
│   ├── prompts/
│   │   ├── chinese.ts          # 语文 prompt builder
│   │   ├── math.ts             # 数学 prompt builder
│   │   ├── english.ts          # 英语 prompt builder
│   │   └── index.ts            # Prompt registry
│   └── parser.ts               # JSON extraction + question validation
├── stores/
│   ├── questionStore.ts        # Question loading, saving, filtering, deleting
│   └── parentStore.ts          # Extend with generation state + API settings
├── components/
│   └── parent/
│       ├── ApiSettingsCard.tsx # API provider/key/endpoint editor
│       ├── SubjectSelector.tsx # Visual subject/topic/difficulty selector
│       ├── GenerateForm.tsx    # Generation parameter form
│       ├── GenerationStatus.tsx# Loading/success/error display
│       └── QuestionCard.tsx    # Single question preview
├── pages/
│   ├── ParentDashboard.tsx     # Add navigation cards
│   ├── GenerateQuestions.tsx   # AI 出题页面
│   └── QuestionBank.tsx        # 题库管理页面
├── router.tsx                  # Add /parent/questions routes
├── types/
│   └── index.ts                # Add AI provider + generation config types
└── db/
    └── index.ts                # Add deleteQuestions, getQuestionsBySubjectTopic
```

---

### Task 1: Extend Types and Settings for AI Generation

**Files:**
- Modify: `src/types/index.ts`

**Interfaces:**
- Add `AIProvider` type
- Add `QuestionGenerationConfig` type
- Add `GenerationStatus` / `GenerationResult` types
- Extend `ParentSettings` with `apiKey`, `apiProvider`, `apiEndpoint`, `apiModel`

- [ ] **Step 1: Add AI-related types**

```typescript
export type AIProvider = 'openai' | 'anthropic' | 'custom';

export interface QuestionGenerationConfig {
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  count: number;
  grade: 4 | 5;
}

export interface GenerationResult {
  success: number;
  failed: number;
  questions: Question[];
  rawResponse?: string;
  durationMs: number;
}
```

- [ ] **Step 2: Extend `ParentSettings`**

```typescript
export interface ParentSettings {
  dailyStarLimit: number;
  dailyMinuteLimit: number;
  eyeCareIntervalMinutes: number;
  restModeStartHour: number;
  apiKey?: string;
  apiProvider?: AIProvider;
  apiEndpoint?: string;
  apiModel?: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add AI provider and question generation types"
```

---

### Task 2: Create Prompt Templates

**Files:**
- Create: `src/services/prompts/chinese.ts`
- Create: `src/services/prompts/math.ts`
- Create: `src/services/prompts/english.ts`
- Create: `src/services/prompts/index.ts`

**Interfaces:**
- Each prompt builder receives `QuestionGenerationConfig` and returns a structured prompt string
- All prompts demand strict JSON output with question/options/answer/explanation

- [ ] **Step 1: Create prompt registry**

```typescript
export interface PromptBuilder {
  system: string;
  user(config: QuestionGenerationConfig): string;
}
```

- [ ] **Step 2: Implement Chinese prompt**

Focus: 字词理解、成语运用、阅读理解小片段、古诗文填空。

- [ ] **Step 3: Implement Math prompt**

Focus: 四则运算、分数小数、简单方程、应用题。

- [ ] **Step 4: Implement English prompt**

Focus: 词汇选择、情景对话、语法填空、阅读理解小片段。

- [ ] **Step 5: Commit**

```bash
git add src/services/prompts/
git commit -m "feat: add subject-specific AI prompt templates"
```

---

### Task 3: Create Response Parser and Validator

**Files:**
- Create: `src/services/parser.ts`
- Create: `tests/parser.test.ts`

**Interfaces:**
- Extract JSON from markdown code fences or raw text
- Validate each question has required fields and valid option/answer index
- Return parsed questions or detailed error info

- [ ] **Step 1: Create parser**

Functions:
- `extractJson(text: string): unknown`
- `validateQuestions(raw: unknown, config: QuestionGenerationConfig): { valid: Question[]; invalid: number }`

- [ ] **Step 2: Add parser tests**

Cover:
- Valid JSON array parsing
- JSON inside markdown fences
- Missing fields rejected
- Invalid answer index rejected
- Malformed JSON returns error

- [ ] **Step 3: Commit**

```bash
git add src/services/parser.ts tests/parser.test.ts
git commit -m "feat: add AI response parser and validator with tests"
```

---

### Task 4: Create AI Question Service

**Files:**
- Create: `src/services/aiQuestion.ts`
- Create: `tests/aiQuestion.test.ts`

**Interfaces:**
- `generateQuestions(config, settings): Promise<GenerationResult>`
- Provider-specific request builders for OpenAI (`/v1/chat/completions`), Anthropic (`/v1/messages`), and custom endpoints
- Uses native `fetch`

- [ ] **Step 1: Define service API**

```typescript
export async function generateQuestions(
  config: QuestionGenerationConfig,
  settings: Pick<ParentSettings, 'apiProvider' | 'apiKey' | 'apiEndpoint' | 'apiModel'>
): Promise<GenerationResult>
```

- [ ] **Step 2: Implement provider adapters**

- OpenAI: model defaults to `gpt-4o-mini`
- Anthropic: model defaults to `claude-3-haiku-20240307`
- Custom: user provides full endpoint URL, body follows OpenAI-compatible shape

- [ ] **Step 3: Wire prompt registry and parser**

- Select prompt by `config.subject`
- Send request
- Parse response text
- Validate and assign IDs (`crypto.randomUUID()`)

- [ ] **Step 4: Add service tests with mocked fetch**

Cover:
- OpenAI success path
- Anthropic success path
- Custom endpoint success path
- API key missing error
- Network error
- Invalid JSON response

- [ ] **Step 5: Commit**

```bash
git add src/services/aiQuestion.ts tests/aiQuestion.test.ts
git commit -m "feat: add AI question generation service with provider adapters"
```

---

### Task 5: Extend DB and Stores for Questions

**Files:**
- Modify: `src/db/index.ts`
- Create: `src/stores/questionStore.ts`
- Modify: `src/stores/parentStore.ts`
- Create: `tests/questionStore.test.ts`

**Interfaces:**
- Add `deleteQuestions`, `getQuestionsBySubjectTopic`, `countQuestions`
- `questionStore` manages the local question bank in memory
- `parentStore` adds `generateQuestions` action and generation status

- [ ] **Step 1: Extend DB helpers**

```typescript
export async function deleteQuestions(ids: string[]): Promise<void>
export async function getQuestionsBySubject(subject: Subject): Promise<Question[]>
export async function countQuestions(): Promise<number>
```

- [ ] **Step 2: Create questionStore**

```typescript
interface QuestionState {
  questions: Question[];
  loaded: boolean;
  loadQuestions: () => Promise<void>;
  saveGeneratedQuestions: (questions: Question[]) => Promise<void>;
  deleteQuestions: (ids: string[]) => Promise<void>;
}
```

- [ ] **Step 3: Extend parentStore with generation**

```typescript
interface ParentState {
  // existing fields
  generating: boolean;
  lastResult: GenerationResult | null;
  generateQuestions: (config: QuestionGenerationConfig) => Promise<void>;
}
```

- [ ] **Step 4: Add tests**

- Question CRUD round-trip
- Generated questions are persisted

- [ ] **Step 5: Commit**

```bash
git add src/db/index.ts src/stores/questionStore.ts src/stores/parentStore.ts tests/questionStore.test.ts
git commit -m "feat: extend DB and stores for question bank management"
```

---

### Task 6: Build API Settings UI

**Files:**
- Create: `src/components/parent/ApiSettingsCard.tsx`
- Modify: `src/pages/ParentDashboard.tsx`

**Interfaces:**
- Visual card with provider selector, API key input (masked), endpoint/model inputs
- Save to `parentStore.updateSettings`

- [ ] **Step 1: Create ApiSettingsCard component**

Use Tailwind cards, select dropdown, password-style input for key.

- [ ] **Step 2: Add to ParentDashboard**

Render `ApiSettingsCard` below the existing settings card.

- [ ] **Step 3: Verify settings persist on refresh**

- [ ] **Step 4: Commit**

```bash
git add src/components/parent/ApiSettingsCard.tsx src/pages/ParentDashboard.tsx
git commit -m "feat: add API settings card to parent dashboard"
```

---

### Task 7: Build AI Question Generation Page

**Files:**
- Create: `src/components/parent/SubjectSelector.tsx`
- Create: `src/components/parent/GenerateForm.tsx`
- Create: `src/components/parent/GenerationStatus.tsx`
- Create: `src/pages/GenerateQuestions.tsx`

**Interfaces:**
- Parent selects subject, inputs topic, chooses difficulty, sets count
- Visual cards for subject selection (green/blue/yellow)
- Generate button triggers `parentStore.generateQuestions`
- Show loading spinner, success count, failed count, raw response preview on error

- [ ] **Step 1: Create SubjectSelector**

Three colored cards: 语文之森 / 数学迷宫 / 英语海岸.

- [ ] **Step 2: Create GenerateForm**

Inputs:
- Topic (text)
- Difficulty (1/2/3 segmented buttons)
- Count (slider 1-20)

- [ ] **Step 3: Create GenerationStatus**

Displays `generating`, result counts, and expandable raw response.

- [ ] **Step 4: Create GenerateQuestions page**

Compose the above components with a generate button.

- [ ] **Step 5: Commit**

```bash
git add src/components/parent/SubjectSelector.tsx src/components/parent/GenerateForm.tsx src/components/parent/GenerationStatus.tsx src/pages/GenerateQuestions.tsx
git commit -m "feat: add AI question generation page"
```

---

### Task 8: Build Question Bank Page

**Files:**
- Create: `src/components/parent/QuestionCard.tsx`
- Create: `src/pages/QuestionBank.tsx`

**Interfaces:**
- List generated questions by subject
- Show question text, options, answer, explanation in a collapsible card
- Allow delete (single or selected)
- Show total count

- [ ] **Step 1: Create QuestionCard component**

Collapsible card with subject color accent.

- [ ] **Step 2: Create QuestionBank page**

- Load questions on mount via `questionStore`
- Group by subject
- Delete button per card

- [ ] **Step 3: Commit**

```bash
git add src/components/parent/QuestionCard.tsx src/pages/QuestionBank.tsx
git commit -m "feat: add question bank management page"
```

---

### Task 9: Wire Routes and Navigation

**Files:**
- Modify: `src/router.tsx`
- Modify: `src/pages/ParentDashboard.tsx`

**Interfaces:**
- `/parent/questions` → QuestionBank
- `/parent/questions/generate` → GenerateQuestions
- ParentDashboard gets navigation cards linking to both

- [ ] **Step 1: Update router**

```typescript
{
  path: '/parent',
  element: <ParentLayout />,
  children: [
    { index: true, element: <ParentDashboard /> },
    { path: 'questions', element: <QuestionBank /> },
    { path: 'questions/generate', element: <GenerateQuestions /> }
  ]
}
```

- [ ] **Step 2: Add navigation cards to ParentDashboard**

Cards for "题库管理" and "AI 出题" with Lucide icons.

- [ ] **Step 3: Verify routes in dev server**

- `/parent`
- `/parent/questions`
- `/parent/questions/generate`

- [ ] **Step 4: Commit**

```bash
git add src/router.tsx src/pages/ParentDashboard.tsx
git commit -m "feat: wire parent question routes and dashboard navigation"
```

---

### Task 10: Final Verification and Self-Review

- [ ] Run `npm run test:types` — must pass
- [ ] Run `npm test -- --run` — must pass
- [ ] Run `npm run build` — must succeed
- [ ] Manual smoke test in browser:
  - Set API provider to "custom" and save
  - Navigate to `/parent/questions/generate`
  - Select subject, enter topic, generate (without valid key should show error)
  - Navigate to `/parent/questions` and confirm empty bank

- [ ] **Commit any final fixes**

---

## Self-Review

**Spec coverage:**
- AI question generation via LLM API: Tasks 2-4
- Prompt templates per subject: Task 2
- JSON parsing/validation: Task 3
- Question persistence in IndexedDB: Task 5
- Parent UI for generation and bank: Tasks 6-9
- Offline-ready local question bank: Task 5

**Placeholder scan:**
- No TBD/TODO/"implement later" allowed.
- Each task ends with a testable deliverable and a commit.

**Security & Privacy:**
- API Key stored only in IndexedDB
- No key sent to any server other than the chosen LLM endpoint

**Gaps intentionally left for later phases:**
- Integration of question bank into `/play` battle flow (Phase 3)
- Topic presets / knowledge point management UI (Phase 3 or 4)
- Auto-retry on network failure with exponential backoff (Phase 3)
- Question difficulty auto-adjustment based on wrong answers (Phase 4)

---

## Execution Handoff

Plan complete.

**Two execution options:**

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints

**Which approach?**
