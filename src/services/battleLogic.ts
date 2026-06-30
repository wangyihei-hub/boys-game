import type { BattleAnswer, BattleResult, Difficulty, Question, Subject } from '../types';
import type { EquipmentBonuses } from './equipmentLogic';
import type { PetSkillEffect } from './petLogic';

export interface BattleState {
  subject: Subject;
  levelNumber: number;
  levelName: string;
  isBoss: boolean;
  difficulty: Difficulty;
  questions: Question[];
  currentIndex: number;
  combo: number;
  answers: BattleAnswer[];
  startTime: number;
  finished: boolean;
  result: BattleResult | null;
}

export const CORRECT_ANSWER_TIME_LIMIT_MS = 15_000;

export function getAnswerTimeLimitMs(bonuses: Partial<EquipmentBonuses> = {}): number {
  return CORRECT_ANSWER_TIME_LIMIT_MS + (bonuses.timeBonus ?? 0);
}

function getWrongOptionIndices(question: Question): number[] {
  if (!question.options || question.options.length === 0) return [];
  return question.options
    .map((_, index) => index)
    .filter(index => String(index) !== String(question.answer));
}

export function getHintOption(
  question: Question,
  petEffect: PetSkillEffect
): number | undefined {
  if (petEffect.skill !== 'hint') return undefined;
  const wrong = getWrongOptionIndices(question);
  if (wrong.length === 0) return undefined;
  return wrong[Math.floor(Math.random() * wrong.length)];
}

export function getExcludedOption(
  question: Question,
  petEffect: PetSkillEffect
): number | undefined {
  if (petEffect.skill !== 'exclude') return undefined;
  const wrong = getWrongOptionIndices(question);
  if (wrong.length === 0) return undefined;
  return wrong[Math.floor(Math.random() * wrong.length)];
}

export function createBattleState(
  subject: Subject,
  levelNumber: number,
  levelName: string,
  difficulty: Difficulty,
  questions: Question[]
): BattleState {
  return {
    subject,
    levelNumber,
    levelName,
    isBoss: questions.some(q => q.id.includes('-BOSS-')),
    difficulty,
    questions,
    currentIndex: 0,
    combo: 0,
    answers: [],
    startTime: performance.now(),
    finished: false,
    result: null
  };
}

function finish(state: BattleState, result: BattleResult): BattleState {
  return { ...state, finished: true, result };
}

export function submitAnswer(
  state: BattleState,
  selectedAnswer: string | number,
  _level: number,
  _bonuses: Partial<EquipmentBonuses> = {},
  _petEffect?: PetSkillEffect
): BattleState {
  if (state.finished) return state;

  const question = state.questions[state.currentIndex];
  const timeMs = Math.round(performance.now() - state.startTime);
  const isCorrect = question.answer === selectedAnswer;

  const nextAnswers = [
    ...state.answers,
    { questionId: question.id, correct: isCorrect, timeMs }
  ];

  const next: BattleState = {
    ...state,
    answers: nextAnswers,
    combo: isCorrect ? state.combo + 1 : 0
  };

  if (!isCorrect) {
    return finish(next, 'lose');
  }

  if (next.currentIndex + 1 >= next.questions.length) {
    return finish(next, 'win');
  }

  return {
    ...next,
    currentIndex: next.currentIndex + 1
  };
}

export function submitTimeout(
  state: BattleState,
  _bonuses: Partial<EquipmentBonuses> = {}
): BattleState {
  if (state.finished) return state;

  const question = state.questions[state.currentIndex];
  const nextAnswers = [
    ...state.answers,
    { questionId: question.id, correct: false, timeMs: getAnswerTimeLimitMs(_bonuses) }
  ];

  return finish({ ...state, answers: nextAnswers, combo: 0 }, 'lose');
}

export function escapeBattle(state: BattleState): BattleState {
  if (state.finished) return state;
  return finish(state, 'escape');
}

export function calculateRewards(
  state: BattleState,
  petEffect?: PetSkillEffect
): { stars: number; exp: number; doubled: boolean } {
  if (state.result !== 'win') return { stars: 0, exp: 0, doubled: false };

  const baseStars = 2 + state.difficulty;
  let stars = baseStars;
  let doubled = false;

  if (petEffect?.skill === 'double_stars' && petEffect.doubleStarsChance !== undefined) {
    if (Math.random() < petEffect.doubleStarsChance) {
      stars *= 2;
      doubled = true;
    }
  }

  const baseExp = 10 * state.difficulty;
  const bossBonus = state.isBoss ? 20 : 0;
  const exp = baseExp + bossBonus;

  return { stars, exp, doubled };
}

export function nextLevelExp(level: number): number {
  return level * 100;
}

export function calculateLevelUp(currentLevel: number, currentExp: number, gainedExp: number): {
  newLevel: number;
  newExp: number;
  levelUps: number;
} {
  let exp = currentExp + gainedExp;
  let level = currentLevel;
  let levelUps = 0;

  while (exp >= nextLevelExp(level)) {
    exp -= nextLevelExp(level);
    level += 1;
    levelUps += 1;
  }

  return { newLevel: level, newExp: exp, levelUps };
}
