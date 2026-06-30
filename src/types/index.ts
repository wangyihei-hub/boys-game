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

export interface MinigameStats {
  gomokuWins: number;
  triviaCorrect: number;
  memorySRankCount: number;
  speedMathSRankCount: number;
  wordChainCount: number;
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
  minigameStats?: MinigameStats;
  // V3 体力与关卡推进
  stamina: number;
  staminaUpdatedAt: number;
  dailyPassCount: number;
  dailyPassDate: string;
  currentLevelNumber: number;
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

export type AIProvider = 'openai' | 'anthropic' | 'custom' | 'local';

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

export interface CurriculumConfig {
  enabled: boolean;
  grade: 4 | 5;
  startDate: string; // ISO date YYYY-MM-DD
  subjects: Subject[];
  questionsPerLesson: number;
}

export interface CurriculumLesson {
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  questionCount: number;
}

export interface CurriculumDay {
  dayIndex: number;
  dateKey: string;
  lessons: CurriculumLesson[];
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
  pin?: string;
  curriculum?: CurriculumConfig;
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

export interface DailyStats {
  id: string;
  dateKey: string;
  starsEarned: number;
  minutesPlayed: number;
  lastActivityAt: number;
}

export type AchievementId =
  | 'first_win'
  | 'first_boss'
  | 'reach_level_5'
  | 'reach_level_10'
  | 'win_streak_5'
  | 'collect_100_stars'
  | 'all_subject_passed'
  | 'eye_care_guard'
  | 'gomoku_win_3'
  | 'trivia_master_100'
  | 'memory_s_10'
  | 'speed_math_s_3'
  | 'word_chain_100';

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

export type InventoryItemType =
  | 'skin'
  | 'effect'
  | 'furniture'
  | 'pet_food'
  | 'lottery_ticket'
  | 'fragment'
  | 'equipment'
  | 'pet';

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
  critBonus?: number;
  timeBonus?: number;
  starCost?: number;
}

export interface PetDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  skill: 'hint' | 'exclude' | 'heal' | 'double_stars';
  skillDescription: string;
  starCost?: number;
  evolutions: {
    stage: number;
    name: string;
    icon: string;
    bondRequired: number;
    requirement: {
      type: 'correct_count' | 'subject_correct_count' | 'consecutive_days';
      target: number;
      subject?: Subject;
    };
  }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  type: InventoryItemType;
  icon: string;
  count: number;
  // Equipment fields
  slot?: EquipmentSlot;
  attackBonus?: number;
  hpBonus?: number;
  critBonus?: number;
  timeBonus?: number;
  // Pet fields
  petDefId?: string;
  evolutionStage?: number;
  bond?: number;
}

export type LevelStatus = 'locked' | 'unlocked' | 'passed';

export interface Progress {
  id: string;
  subject: Subject;
  levelNumber: number;
  status: LevelStatus;
  passedAt?: number;
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
  levelNumber: number;
  result: BattleResult;
  durationMs: number;
  starsEarned: number;
  expEarned: number;
  correctAnswers: number;
  createdAt: number;
}
