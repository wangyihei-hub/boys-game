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
  status: RedemptionStatus;
  createdAt: number;
  confirmedAt?: number;
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
