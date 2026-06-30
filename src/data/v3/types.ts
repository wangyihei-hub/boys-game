export type V3Subject = 'chinese' | 'math' | 'english';
export type V3Difficulty = 1 | 2 | 3;
export type V3QuestionType = 'choice' | 'fillblank';

export interface V3Question {
  id: string;
  type: V3QuestionType;
  question: string;
  options?: string[];
  answer: number | string;
  explanation?: string;
}

export interface V3BossPart {
  id: string;
  type: V3QuestionType;
  question: string;
  options?: string[];
  answer: number | string;
  explanation?: string;
}

export interface V3Boss {
  prompt: string;
  parts: V3BossPart[];
}

export interface V3Level {
  level: number;
  subject: V3Subject;
  topic: string;
  difficulty: V3Difficulty;
  questions: V3Question[];
  boss: V3Boss;
}
