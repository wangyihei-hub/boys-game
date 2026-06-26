import type { BattleAnswer, BattleResult, Difficulty, Question, Stage } from '../types';
import type { EquipmentBonuses } from './equipmentLogic';
import type { PetSkillEffect } from './petLogic';

export interface BattleState {
  stage: Stage;
  questions: Question[];
  currentIndex: number;
  playerHp: number;
  monsterHp: number;
  combo: number;
  critReady: boolean;
  answers: BattleAnswer[];
  startTime: number;
  finished: boolean;
  result: BattleResult | null;
}

export interface AttackResult {
  damage: number;
  isCrit: boolean;
  comboBonus: number;
}

export const BASE_PLAYER_HP = 30;
export const PLAYER_HP_PER_LEVEL = 5;
export const BASE_DAMAGE = 10;
export const DAMAGE_PER_LEVEL = 2;
export const COMBO_THRESHOLD_1 = 3;
export const COMBO_THRESHOLD_2 = 5;
export const COMBO_MULTIPLIER_1 = 1.5;
export const COMBO_MULTIPLIER_2 = 2;
export const CRIT_MULTIPLIER = 2;
export const CORRECT_ANSWER_TIME_LIMIT_MS = 15_000;

export function getMaxPlayerHp(level: number, bonuses: Partial<EquipmentBonuses> = {}): number {
  return BASE_PLAYER_HP + level * PLAYER_HP_PER_LEVEL + (bonuses.hpBonus ?? 0);
}

export function getBaseDamage(level: number, bonuses: Partial<EquipmentBonuses> = {}): number {
  return BASE_DAMAGE + level * DAMAGE_PER_LEVEL + (bonuses.attackBonus ?? 0);
}

export function getMonsterCounterDamage(difficulty: Difficulty): number {
  return 8 + difficulty * 3;
}

export function getAnswerTimeLimitMs(bonuses: Partial<EquipmentBonuses> = {}): number {
  return CORRECT_ANSWER_TIME_LIMIT_MS + (bonuses.timeBonus ?? 0);
}

export function getComboMultiplier(combo: number): number {
  if (combo >= COMBO_THRESHOLD_2) return COMBO_MULTIPLIER_2;
  if (combo >= COMBO_THRESHOLD_1) return COMBO_MULTIPLIER_1;
  return 1;
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

export function calculateHeal(
  state: BattleState,
  petEffect: PetSkillEffect | undefined,
  level: number,
  bonuses: Partial<EquipmentBonuses> = {}
): number {
  if (petEffect?.skill !== 'heal' || !petEffect.healAmount) return 0;
  const correctCount = state.answers.filter(a => a.correct).length;
  if (correctCount === 0 || correctCount % 3 !== 0) return 0;
  const maxHp = getMaxPlayerHp(level, bonuses);
  return Math.min(petEffect.healAmount, Math.max(0, maxHp - state.playerHp));
}

export function calculateAttack(
  level: number,
  combo: number,
  critReady: boolean,
  bonuses: Partial<EquipmentBonuses> = {}
): AttackResult {
  const base = getBaseDamage(level, bonuses);
  const comboBonus = getComboMultiplier(combo);
  let damage = Math.round(base * comboBonus);
  let isCrit = false;
  if (critReady) {
    damage = Math.round(damage * (CRIT_MULTIPLIER + (bonuses.critBonus ?? 0)));
    isCrit = true;
  }
  return { damage, isCrit, comboBonus };
}

export function createBattleState(
  stage: Stage,
  questions: Question[],
  playerLevel: number,
  bonuses: Partial<EquipmentBonuses> = {}
): BattleState {
  return {
    stage,
    questions,
    currentIndex: 0,
    playerHp: getMaxPlayerHp(playerLevel, bonuses),
    monsterHp: stage.monsterHp,
    combo: 0,
    critReady: false,
    answers: [],
    startTime: performance.now(),
    finished: false,
    result: null
  };
}

export function submitAnswer(
  state: BattleState,
  selectedAnswer: string | number,
  level: number,
  bonuses: Partial<EquipmentBonuses> = {},
  petEffect?: PetSkillEffect
): BattleState {
  if (state.finished) return state;

  const question = state.questions[state.currentIndex];
  const timeMs = Math.round(performance.now() - state.startTime);
  const isCorrect = question.answer === selectedAnswer;

  const nextAnswers = [
    ...state.answers,
    { questionId: question.id, correct: isCorrect, timeMs }
  ];

  let next = { ...state, answers: nextAnswers };

  if (isCorrect) {
    const attack = calculateAttack(level, next.combo, next.critReady, bonuses);
    next = {
      ...next,
      monsterHp: Math.max(0, next.monsterHp - attack.damage),
      combo: next.combo + 1,
      critReady: next.combo >= 2 // 连续3题答对后下一题暴击：答对第3题后 critReady=true
    };

    const heal = calculateHeal(next, petEffect, level, bonuses);
    if (heal > 0) {
      next = { ...next, playerHp: next.playerHp + heal };
    }
  } else {
    const counterDamage = getMonsterCounterDamage(state.stage.difficulty);
    next = {
      ...next,
      playerHp: Math.max(0, next.playerHp - counterDamage),
      combo: 0,
      critReady: false
    };
  }

  return advanceBattle(next);
}

export function submitTimeout(
  state: BattleState,
  bonuses: Partial<EquipmentBonuses> = {}
): BattleState {
  if (state.finished) return state;

  const question = state.questions[state.currentIndex];
  const nextAnswers = [
    ...state.answers,
    { questionId: question.id, correct: false, timeMs: getAnswerTimeLimitMs(bonuses) }
  ];

  const counterDamage = getMonsterCounterDamage(state.stage.difficulty);
  const next = {
    ...state,
    answers: nextAnswers,
    playerHp: Math.max(0, state.playerHp - counterDamage),
    combo: 0,
    critReady: false
  };

  return advanceBattle(next);
}

function advanceBattle(state: BattleState): BattleState {
  if (state.monsterHp <= 0) {
    return {
      ...state,
      finished: true,
      result: 'win'
    };
  }

  if (state.playerHp <= 0) {
    return {
      ...state,
      finished: true,
      result: 'lose'
    };
  }

  const nextIndex = state.currentIndex + 1;
  if (nextIndex >= state.questions.length) {
    // 题目用完还没击败怪物，判定失败
    return {
      ...state,
      finished: true,
      result: 'lose'
    };
  }

  return {
    ...state,
    currentIndex: nextIndex
  };
}

export function escapeBattle(state: BattleState): BattleState {
  if (state.finished) return state;
  return {
    ...state,
    finished: true,
    result: 'escape'
  };
}

export function calculateRewards(
  state: BattleState,
  petEffect?: PetSkillEffect
): { stars: number; exp: number; doubled: boolean } {
  if (state.result !== 'win') return { stars: 0, exp: 0, doubled: false };

  const correctCount = state.answers.filter(a => a.correct).length;
  const totalQuestions = state.questions.length;
  const baseStars = 2 + state.stage.difficulty;
  const comboBonus = Math.max(0, state.answers.filter(a => a.correct).length - COMBO_THRESHOLD_1);
  let stars = baseStars + Math.min(comboBonus, 5);
  let doubled = false;

  if (petEffect?.skill === 'double_stars' && petEffect.doubleStarsChance !== undefined) {
    if (Math.random() < petEffect.doubleStarsChance) {
      stars *= 2;
      doubled = true;
    }
  }

  const baseExp = 10 * state.stage.difficulty;
  const accuracyBonus = Math.round((correctCount / totalQuestions) * 10);
  const bossBonus = state.stage.isBoss ? 20 : 0;
  const exp = baseExp + accuracyBonus + bossBonus;

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
