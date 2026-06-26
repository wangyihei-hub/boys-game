export type Subject = 'chinese' | 'math' | 'english';

export type QuestionType = 'choice' | 'fillblank' | 'spelling';

export type Difficulty = 1 | 2 | 3;

export interface Question {
  id: string;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  options?: string[];
  answer: number | string;
  explanation: string;
  generatedAt: number;
}

export interface Profile {
  id: string;
  nickname: string;
  level: number;
  exp: number;
  stars: number;
  equippedItems: {
    weapon?: string;
    shield?: string;
    staff?: string;
    shoes?: string;
  };
  activePet?: string;
  createdAt: number;
}

export type RewardCategory = 'food' | 'privilege' | 'learning' | 'mystery';

export interface Reward {
  id: string;
  name: string;
  starCost: number;
  stock: number;
  category: RewardCategory;
  description: string;
  icon: string;
}

export type RedemptionStatus = 'pending' | 'confirmed' | 'rejected';

export interface Redemption {
  id: string;
  rewardId: string;
  rewardName: string;
  starCost: number;
  status: RedemptionStatus;
  createdAt: number;
  confirmedAt?: number;
  rejectedAt?: number;
}

export type TransactionType = 'earn' | 'spend' | 'refund';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  reason: string;
  balanceAfter: number;
  createdAt: number;
}

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

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export type StageStatus = 'locked' | 'unlocked' | 'passed';

export interface Stage {
  id: string;
  subject: Subject;
  regionName: string;
  stageNumber: number;
  name: string;
  difficulty: Difficulty;
  questionCount: number;
  monsterHp: number;
  isBoss: boolean;
}

export interface Progress {
  id: string;
  subject: Subject;
  stageId: string;
  status: StageStatus;
  stars: number;
  bestScore: number;
}

export type BattleResult = 'win' | 'lose' | 'escape';

export interface BattleAnswer {
  questionId: string;
  correct: boolean;
  timeMs: number;
}

export interface BattleRecord {
  id: string;
  subject: Subject;
  stageId: string;
  result: BattleResult;
  durationMs: number;
  starsEarned: number;
  expEarned: number;
  createdAt: number;
}
