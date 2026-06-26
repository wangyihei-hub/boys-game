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

export interface WrongQuestion {
  questionId: string;
  wrongCount: number;
  lastReviewAt: number;
}

export type TaskType = 'login' | 'win_battle' | 'correct_answers' | 'earn_stars';

export interface DailyTask {
  id: string;
  title: string;
  type: TaskType;
  target: number;
  rewardStars: number;
  completed: boolean;
  progress: number;
  dateKey: string;
}

export type AchievementId =
  | 'first_win'
  | 'first_boss'
  | 'reach_level_5'
  | 'reach_level_10'
  | 'win_streak_5'
  | 'collect_100_stars'
  | 'all_subject_passed';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export type PrizeType = 'stars' | 'fragment' | 'privilege' | 'virtual';

export interface LotteryPrize {
  id: string;
  name: string;
  type: PrizeType;
  amount?: number;
  icon: string;
  probability: number;
  stock: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'skin' | 'effect' | 'furniture' | 'pet_food' | 'lottery_ticket' | 'fragment';
  icon: string;
  count: number;
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
