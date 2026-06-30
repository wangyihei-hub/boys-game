import { describe, expect, it, vi } from 'vitest';
import {
  calculateLevelUp,
  calculateRewards,
  createBattleState,
  escapeBattle,
  getAnswerTimeLimitMs,
  getExcludedOption,
  getHintOption,
  nextLevelExp,
  submitAnswer,
  submitTimeout
} from '../src/services/battleLogic';
import type { Question } from '../src/types';

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

describe('battleLogic', () => {
  it('creates an initial battle state', () => {
    const questions = [makeQuestion()];
    const state = createBattleState('math', 1, '测试关', 1, questions);
    expect(state.subject).toBe('math');
    expect(state.levelNumber).toBe(1);
    expect(state.questions).toEqual(questions);
    expect(state.currentIndex).toBe(0);
    expect(state.combo).toBe(0);
    expect(state.finished).toBe(false);
    expect(state.result).toBeNull();
  });

  it('advances on correct answer', () => {
    const questions = [makeQuestion(), makeQuestion({ id: 'q2' })];
    const state = createBattleState('math', 1, '测试关', 1, questions);
    const next = submitAnswer(state, 1, 1);
    expect(next.finished).toBe(false);
    expect(next.currentIndex).toBe(1);
    expect(next.combo).toBe(1);
  });

  it('loses on wrong answer', () => {
    const questions = [makeQuestion()];
    const state = createBattleState('math', 1, '测试关', 1, questions);
    const next = submitAnswer(state, 0, 1);
    expect(next.finished).toBe(true);
    expect(next.result).toBe('lose');
    expect(next.combo).toBe(0);
  });

  it('loses on timeout', () => {
    const questions = [makeQuestion()];
    const state = createBattleState('math', 1, '测试关', 1, questions);
    const next = submitTimeout(state);
    expect(next.finished).toBe(true);
    expect(next.result).toBe('lose');
    expect(next.combo).toBe(0);
  });

  it('wins after the final correct answer', () => {
    const questions = [makeQuestion()];
    const state = createBattleState('math', 1, '测试关', 1, questions);
    const next = submitAnswer(state, 1, 1);
    expect(next.finished).toBe(true);
    expect(next.result).toBe('win');
  });

  it('can escape battle', () => {
    const questions = [makeQuestion()];
    const state = createBattleState('math', 1, '测试关', 1, questions);
    const next = escapeBattle(state);
    expect(next.finished).toBe(true);
    expect(next.result).toBe('escape');
  });

  it('returns zero rewards for non-win', () => {
    const questions = [makeQuestion({ answer: 99 })];
    const state = createBattleState('math', 1, '测试关', 1, questions);
    const next = submitAnswer(state, 0, 1);
    const rewards = calculateRewards(next);
    expect(rewards.stars).toBe(0);
    expect(rewards.exp).toBe(0);
  });

  it('calculates win rewards by difficulty', () => {
    const questions = [makeQuestion()];
    const state = createBattleState('math', 1, '测试关', 2, questions);
    const next = submitAnswer(state, 1, 1);
    const rewards = calculateRewards(next);
    expect(rewards.stars).toBe(2 + 2);
    expect(rewards.exp).toBe(10 * 2);
  });

  it('adds boss bonus to win exp', () => {
    const questions = [makeQuestion({ id: 'm-L001-BOSS-1' })];
    const state = createBattleState('math', 1, 'Boss关', 2, questions);
    const next = submitAnswer(state, 1, 1);
    const rewards = calculateRewards(next);
    expect(rewards.exp).toBe(10 * 2 + 20);
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

  it('increases answer time limit with timeBonus', () => {
    expect(getAnswerTimeLimitMs({ timeBonus: 3000 })).toBe(15_000 + 3000);
    expect(getAnswerTimeLimitMs({ timeBonus: 5000 })).toBe(15_000 + 5000);
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
    const questions = [makeQuestion()];
    const state = createBattleState('math', 1, '测试关', 2, questions);
    const next = submitAnswer(state, 1, 1);
    const original = calculateRewards(next);

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const doubled = calculateRewards(next, { skill: 'double_stars', doubleStarsChance: 1 });
    randomSpy.mockRestore();

    expect(doubled.stars).toBe(original.stars * 2);
    expect(doubled.doubled).toBe(true);
  });

  it('does not double stars when double_stars chance fails', () => {
    const questions = [makeQuestion()];
    const state = createBattleState('math', 1, '测试关', 2, questions);
    const next = submitAnswer(state, 1, 1);

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = calculateRewards(next, { skill: 'double_stars', doubleStarsChance: 0 });
    randomSpy.mockRestore();

    expect(result.doubled).toBe(false);
  });
});
