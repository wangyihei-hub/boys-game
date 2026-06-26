import { describe, it, expect, beforeEach } from 'vitest';
import { getDB, getProfile, saveProfile, getQuestions, saveQuestions } from '../src/db';
import type { Profile, Question } from '../src/types';

describe('IndexedDB layer', () => {
  beforeEach(async () => {
    const db = await getDB();
    await db.clear('profiles');
    await db.clear('questions');
  });

  it('saves and retrieves a profile', async () => {
    const profile: Profile = {
      id: 'default',
      nickname: 'Test Kid',
      level: 1,
      exp: 0,
      stars: 0,
      equippedItems: {},
      createdAt: Date.now()
    };
    await saveProfile(profile);
    const result = await getProfile('default');
    expect(result?.nickname).toBe('Test Kid');
  });

  it('saves and retrieves questions', async () => {
    const questions: Question[] = [
      {
        id: 'q1',
        subject: 'math',
        topic: 'fraction-addition',
        difficulty: 2,
        type: 'choice',
        question: '1/2 + 1/4 = ?',
        options: ['1/6', '2/6', '3/4', '1'],
        answer: 2,
        explanation: '通分后相加',
        generatedAt: Date.now()
      }
    ];
    await saveQuestions(questions);
    const result = await getQuestions();
    expect(result).toHaveLength(1);
    expect(result[0].answer).toBe(2);
  });
});
