import { describe, it, expect } from 'vitest';
import {
  getV3Level,
  assertV3Level,
  getAllLevels,
  SUBJECTS,
  LEVEL_COUNT,
  QUESTIONS_PER_BATTLE,
  BOSS_PARTS_COUNT
} from '../src/data/v3';
import type { V3Question, V3Subject } from '../src/data/v3';

function isValidAnswer(question: V3Question): boolean {
  if (question.type === 'choice') {
    return (
      typeof question.answer === 'number' &&
      question.answer >= 0 &&
      question.answer < (question.options?.length ?? 0)
    );
  }
  return typeof question.answer === 'string' && question.answer.length > 0;
}

describe('v3 bank loading', () => {
  it.each(SUBJECTS)('loads level 1 for %s', (subject) => {
    const level = getV3Level(subject, 1);
    expect(level).toBeDefined();
    expect(level!.subject).toBe(subject);
    expect(level!.level).toBe(1);
    expect(level!.topic).toBeTruthy();
    expect(level!.difficulty).toBeGreaterThanOrEqual(1);
    expect(level!.difficulty).toBeLessThanOrEqual(3);
  });

  it.each(SUBJECTS)('loads the final level for %s', (subject) => {
    const level = getV3Level(subject, LEVEL_COUNT);
    expect(level).toBeDefined();
    expect(level!.level).toBe(LEVEL_COUNT);
  });

  it.each(SUBJECTS)('each level has 30 normal questions and a boss', (subject) => {
    const levels = getAllLevels(subject as V3Subject);
    expect(levels.length).toBeGreaterThan(0);

    for (const level of levels.slice(0, 5)) {
      expect(level.questions).toHaveLength(30);
      expect(level.boss).toBeDefined();
      expect(level.boss.prompt).toBeTruthy();
      expect(level.boss.parts.length).toBeGreaterThan(0);
    }
  });

  it('validates question answers and choice options', () => {
    const samples: Array<[V3Subject, number]> = [
      ['chinese', 1],
      ['math', 1],
      ['english', 1],
      ['chinese', 50],
      ['math', 50],
      ['english', 50],
      ['chinese', 100],
      ['math', 100],
      ['english', 100]
    ];

    for (const [subject, levelNumber] of samples) {
      const level = assertV3Level(subject, levelNumber);
      for (const question of level.questions) {
        expect(question.id).toMatch(/^\w-L\d{3}-Q\d{2}$/);
        expect(isValidAnswer(question)).toBe(true);
        if (question.type === 'choice') {
          expect(question.options).toHaveLength(4);
        }
      }
      for (const part of level.boss.parts) {
        expect(part.id).toMatch(/^\w-L\d{3}-BOSS-\d+$/);
        expect(isValidAnswer(part)).toBe(true);
        if (part.type === 'choice') {
          expect(part.options).toHaveLength(4);
        }
      }
    }
  });

  it('throws for missing levels', () => {
    expect(() => assertV3Level('chinese', 999)).toThrow('V3 level not found');
  });

  it('exports expected V3 constants', () => {
    expect(SUBJECTS).toEqual(['chinese', 'math', 'english']);
    expect(LEVEL_COUNT).toBe(100);
    expect(QUESTIONS_PER_BATTLE).toBe(10);
    expect(BOSS_PARTS_COUNT).toBe(5);
  });
});
