import { describe, expect, it, vi } from 'vitest';
import {
  calculateAttack,
  calculateLevelUp,
  calculateRewards,
  createBattleState,
  escapeBattle,
  getAnswerTimeLimitMs,
  getBaseDamage,
  getComboMultiplier,
  getExcludedOption,
  getHintOption,
  getMaxPlayerHp,
  getMonsterCounterDamage,
  nextLevelExp,
  submitAnswer,
  submitTimeout
} from '../src/services/battleLogic';
import type { Question, Stage } from '../src/types';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    subject: 'math',
    topic: 'test',
    difficulty: 1,
    type: 'choice',
    question: '1+1=?',
    options: ['1', '2', '3', '4'],
    answer: 1,
    explanation: 'test',
    generatedAt: 0,
    ...overrides
  };
}

function makeStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: 'm1',
    subject: 'math',
    regionName: '数学迷宫',
    stageNumber: 1,
    name: '测试关',
    difficulty: 1,
    questionCount: 3,
    monsterHp: 30,
    isBoss: false,
    ...overrides
  };
}

describe('battleLogic', () => {
  it('calculates max player hp by level', () => {
    expect(getMaxPlayerHp(1)).toBe(35);
    expect(getMaxPlayerHp(5)).toBe(55);
  });

  it('calculates base damage by level', () => {
    const base = 10 + 1 * 2;
    expect(calculateAttack(1, 0, false).damage).toBe(base);
  });

  it('applies combo multipliers', () => {
    expect(getComboMultiplier(0)).toBe(1);
    expect(getComboMultiplier(2)).toBe(1);
    expect(getComboMultiplier(3)).toBe(1.5);
    expect(getComboMultiplier(5)).toBe(2);
  });

  it('applies crit after 3 correct answers', () => {
    const normal = calculateAttack(1, 3, false);
    const crit = calculateAttack(1, 3, true);
    expect(crit.damage).toBe(Math.round(normal.damage * 2));
    expect(crit.isCrit).toBe(true);
  });

  it('calculates monster counter damage by difficulty', () => {
    expect(getMonsterCounterDamage(1)).toBe(11);
    expect(getMonsterCounterDamage(3)).toBe(17);
  });

  it('deals damage to monster on correct answer', () => {
    const stage = makeStage({ monsterHp: 30 });
    const questions = [makeQuestion()];
    const state = createBattleState(stage, questions, 1);
    const next = submitAnswer(state, 1, 1);
    expect(next.monsterHp).toBeLessThan(30);
    expect(next.combo).toBe(1);
  });

  it('damages player on wrong answer', () => {
    const stage = makeStage({ difficulty: 1, monsterHp: 30 });
    const questions = [makeQuestion()];
    const state = createBattleState(stage, questions, 1);
    const next = submitAnswer(state, 0, 1);
    expect(next.playerHp).toBeLessThan(getMaxPlayerHp(1));
    expect(next.combo).toBe(0);
  });

  it('damages player on timeout', () => {
    const stage = makeStage({ difficulty: 1, monsterHp: 30 });
    const questions = [makeQuestion()];
    const state = createBattleState(stage, questions, 1);
    const next = submitTimeout(state);
    expect(next.playerHp).toBeLessThan(getMaxPlayerHp(1));
  });

  it('wins when monster hp reaches zero', () => {
    const stage = makeStage({ monsterHp: 1 });
    const questions = [makeQuestion()];
    const state = createBattleState(stage, questions, 1);
    const next = submitAnswer(state, 1, 1);
    expect(next.finished).toBe(true);
    expect(next.result).toBe('win');
  });

  it('loses when player hp reaches zero', () => {
    const stage = makeStage({ difficulty: 3 });
    const questions = [makeQuestion({ answer: 99 })];
    const state = createBattleState(stage, questions, 1);
    const next = submitAnswer(state, 0, 1);
    expect(next.finished).toBe(true);
    expect(next.result).toBe('lose');
  });

  it('loses when questions run out', () => {
    const stage = makeStage({ monsterHp: 999 });
    const questions = [makeQuestion()];
    const state = createBattleState(stage, questions, 1);
    const next = submitAnswer(state, 1, 1);
    expect(next.finished).toBe(true);
    expect(next.result).toBe('lose');
  });

  it('can escape battle', () => {
    const stage = makeStage();
    const questions = [makeQuestion()];
    const state = createBattleState(stage, questions, 1);
    const next = escapeBattle(state);
    expect(next.finished).toBe(true);
    expect(next.result).toBe('escape');
  });

  it('calculates win rewards', () => {
    const stage = makeStage({ difficulty: 2, monsterHp: 1 });
    const questions = [makeQuestion()];
    const state = createBattleState(stage, questions, 1);
    const next = submitAnswer(state, 1, 1);
    const rewards = calculateRewards(next);
    expect(rewards.stars).toBeGreaterThan(0);
    expect(rewards.exp).toBeGreaterThan(0);
  });

  it('returns zero rewards for non-win', () => {
    const stage = makeStage();
    const questions = [makeQuestion({ answer: 99 })];
    const state = createBattleState(stage, questions, 1);
    const next = submitAnswer(state, 0, 1);
    const rewards = calculateRewards(next);
    expect(rewards.stars).toBe(0);
    expect(rewards.exp).toBe(0);
  });

  it('calculates next level exp', () => {
    expect(nextLevelExp(1)).toBe(100);
    expect(nextLevelExp(5)).toBe(500);
  });

  it('calculates level up', () => {
    const result = calculateLevelUp(1, 0, 150);
    expect(result.newLevel).toBe(2);
    expect(result.newExp).toBe(50);
    expect(result.levelUps).toBe(1);
  });

  it('handles multiple level ups', () => {
    const result = calculateLevelUp(1, 0, 350);
    expect(result.newLevel).toBe(3);
    expect(result.newExp).toBe(50);
    expect(result.levelUps).toBe(2);
  });

  it('increases max player hp with hpBonus', () => {
    expect(getMaxPlayerHp(1, { hpBonus: 10 })).toBe(getMaxPlayerHp(1) + 10);
    expect(getMaxPlayerHp(5, { hpBonus: 25 })).toBe(getMaxPlayerHp(5) + 25);
  });

  it('increases base damage with attackBonus', () => {
    expect(getBaseDamage(1, { attackBonus: 3 })).toBe(getBaseDamage(1) + 3);
    expect(getBaseDamage(5, { attackBonus: 7 })).toBe(getBaseDamage(5) + 7);
  });

  it('increases crit multiplier with critBonus', () => {
    const normal = calculateAttack(1, 3, false, { critBonus: 0.25 });
    const crit = calculateAttack(1, 3, true, { critBonus: 0.25 });
    expect(crit.damage).toBe(Math.round(normal.damage * (2 + 0.25)));
    expect(crit.isCrit).toBe(true);
  });

  it('increases answer time limit with timeBonus', () => {
    expect(getAnswerTimeLimitMs({ timeBonus: 3000 })).toBe(15_000 + 3000);
    expect(getAnswerTimeLimitMs({ timeBonus: 5000 })).toBe(15_000 + 5000);
  });

  it('applies attack bonus when dealing damage', () => {
    const stage = makeStage({ monsterHp: 999 });
    const questions = [makeQuestion()];
    const state = createBattleState(stage, questions, 1, { attackBonus: 5 });
    const next = submitAnswer(state, 1, 1, { attackBonus: 5 });
    expect(next.monsterHp).toBe(999 - calculateAttack(1, 0, false, { attackBonus: 5 }).damage);
  });

  it('applies hp bonus to initial battle state', () => {
    const stage = makeStage();
    const questions = [makeQuestion()];
    const state = createBattleState(stage, questions, 1, { hpBonus: 15 });
    expect(state.playerHp).toBe(getMaxPlayerHp(1) + 15);
  });

  it('returns a wrong option index for hint', () => {
    const question = makeQuestion({ options: ['1', '2', '3', '4'], answer: 1 });
    const hint = getHintOption(question, { skill: 'hint' });
    expect(hint).not.toBe(1);
    expect(hint).toBeGreaterThanOrEqual(0);
    expect(hint).toBeLessThan(4);
  });

  it('returns undefined for hint when skill is not hint', () => {
    const question = makeQuestion({ options: ['1', '2', '3', '4'], answer: 1 });
    expect(getHintOption(question, { skill: 'exclude' })).toBeUndefined();
  });

  it('returns a wrong option index for exclude', () => {
    const question = makeQuestion({ options: ['1', '2', '3', '4'], answer: 1 });
    const excluded = getExcludedOption(question, { skill: 'exclude' });
    expect(excluded).not.toBe(1);
    expect(excluded).toBeGreaterThanOrEqual(0);
    expect(excluded).toBeLessThan(4);
  });

  it('returns undefined for exclude when skill is not exclude', () => {
    const question = makeQuestion({ options: ['1', '2', '3', '4'], answer: 1 });
    expect(getExcludedOption(question, { skill: 'heal' })).toBeUndefined();
  });

  it('doubles stars when double_stars pet effect triggers', () => {
    const stage = makeStage({ difficulty: 2, monsterHp: 1 });
    const questions = [makeQuestion()];
    const state = createBattleState(stage, questions, 1);
    const next = submitAnswer(state, 1, 1);
    const original = calculateRewards(next);

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const doubled = calculateRewards(next, { skill: 'double_stars', doubleStarsChance: 1 });
    randomSpy.mockRestore();

    expect(doubled.stars).toBe(original.stars * 2);
    expect(doubled.doubled).toBe(true);
  });

  it('does not double stars when double_stars chance fails', () => {
    const stage = makeStage({ difficulty: 2, monsterHp: 1 });
    const questions = [makeQuestion()];
    const state = createBattleState(stage, questions, 1);
    const next = submitAnswer(state, 1, 1);

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = calculateRewards(next, { skill: 'double_stars', doubleStarsChance: 0 });
    randomSpy.mockRestore();

    expect(result.doubled).toBe(false);
  });
});
