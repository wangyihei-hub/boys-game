import { describe, it, expect } from 'vitest';
import { generateLocalQuestions } from '../src/services/localQuestionGenerator';
import type { QuestionGenerationConfig } from '../src/types';

const baseConfig: QuestionGenerationConfig = {
  subject: 'math',
  topic: 'fraction-addition',
  difficulty: 2,
  count: 8,
  grade: 4,
};

describe('generateLocalQuestions', () => {
  it('returns the requested number of questions', async () => {
    const questions = await generateLocalQuestions(baseConfig);
    expect(questions).toHaveLength(baseConfig.count);
  });

  it('produces math questions with valid structure', async () => {
    const questions = await generateLocalQuestions(baseConfig);

    for (const q of questions) {
      expect(['choice', 'fillblank', 'spelling']).toContain(q.type);
      expect(q.question.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);

      if (q.type === 'choice') {
        expect(q.options).toHaveLength(4);
        expect(q.options?.every(opt => opt.trim().length > 0)).toBe(true);
        expect(typeof q.answer).toBe('number');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
      } else {
        expect(typeof q.answer).toBe('string');
        expect((q.answer as string).trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('produces chinese questions with valid structure', async () => {
    const questions = await generateLocalQuestions({ ...baseConfig, subject: 'chinese', topic: '成语' });

    expect(questions.length).toBe(baseConfig.count);
    for (const q of questions) {
      expect(q.question.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      if (q.type === 'choice') {
        expect(q.options).toHaveLength(4);
      }
    }
  });

  it('produces english questions with valid structure', async () => {
    const questions = await generateLocalQuestions({ ...baseConfig, subject: 'english', topic: 'vocabulary' });

    expect(questions.length).toBe(baseConfig.count);
    for (const q of questions) {
      expect(q.question.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      if (q.type === 'choice') {
        expect(q.options).toHaveLength(4);
      }
    }
  });

  it('clamps count to valid range', async () => {
    const tooFew = await generateLocalQuestions({ ...baseConfig, count: 0 });
    expect(tooFew.length).toBe(1);

    const tooMany = await generateLocalQuestions({ ...baseConfig, count: 100 });
    expect(tooMany.length).toBe(20);
  });
});
