import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useQuestionStore } from '../src/stores/questionStore';
import { useParentStore } from '../src/stores/parentStore';
import { countQuestions, getQuestions, getQuestionsBySubject } from '../src/db';
import type { GenerationResult, Question } from '../src/types';

vi.mock('../src/services/aiQuestion', () => ({
  generateQuestions: vi.fn()
}));

import { generateQuestions as generateQuestionsMock } from '../src/services/aiQuestion';

function createQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q1',
    subject: 'math',
    topic: 'fraction',
    difficulty: 2,
    type: 'choice',
    question: '1/2 + 1/4 = ?',
    options: ['1/6', '3/4', '1', '2'],
    answer: 1,
    explanation: '通分后相加',
    generatedAt: Date.now(),
    ...overrides
  };
}

const DEFAULT_PARENT_SETTINGS = {
  dailyStarLimit: 100,
  dailyMinuteLimit: 45,
  eyeCareIntervalMinutes: 20,
  restModeStartHour: 21,
  apiProvider: 'openai' as const,
  apiKey: 'test-key',
  apiModel: 'gpt-4o-mini'
};

describe('questionStore', () => {
  beforeEach(() => {
    useQuestionStore.setState({ questions: [], loaded: false, error: null });
  });

  it('loads questions from IndexedDB', async () => {
    const q = createQuestion();
    await useQuestionStore.getState().saveGeneratedQuestions([q]);
    useQuestionStore.setState({ questions: [], loaded: false });

    await useQuestionStore.getState().loadQuestions();

    const state = useQuestionStore.getState();
    expect(state.questions).toHaveLength(1);
    expect(state.questions[0].id).toBe('q1');
    expect(state.loaded).toBe(true);
  });

  it('merges generated questions by id and persists them', async () => {
    const original = createQuestion({ id: 'q1', answer: 0 });
    await useQuestionStore.getState().saveGeneratedQuestions([original]);

    const updated = createQuestion({ id: 'q1', answer: 2 });
    const newQuestion = createQuestion({ id: 'q2', topic: 'decimal' });
    await useQuestionStore.getState().saveGeneratedQuestions([updated, newQuestion]);

    const state = useQuestionStore.getState();
    expect(state.questions).toHaveLength(2);
    expect(state.questions.find(q => q.id === 'q1')?.answer).toBe(2);

    const fromDb = await getQuestions();
    expect(fromDb).toHaveLength(2);
  });

  it('deletes questions from store and IndexedDB', async () => {
    const q1 = createQuestion({ id: 'q1' });
    const q2 = createQuestion({ id: 'q2', subject: 'chinese', topic: 'poem' });
    await useQuestionStore.getState().saveGeneratedQuestions([q1, q2]);

    await useQuestionStore.getState().deleteQuestions(['q1']);

    expect(useQuestionStore.getState().questions).toHaveLength(1);
    const fromDb = await getQuestions();
    expect(fromDb).toHaveLength(1);
    expect(fromDb[0].id).toBe('q2');
  });

  it('filters persisted questions by subject', async () => {
    const mathQ = createQuestion({ id: 'm1', subject: 'math' });
    const chineseQ = createQuestion({ id: 'c1', subject: 'chinese', topic: 'poem' });
    await useQuestionStore.getState().saveGeneratedQuestions([mathQ, chineseQ]);

    const mathQuestions = await getQuestionsBySubject('math');
    expect(mathQuestions).toHaveLength(1);
    expect(mathQuestions[0].id).toBe('m1');
  });

  it('counts persisted questions', async () => {
    await useQuestionStore.getState().saveGeneratedQuestions([createQuestion({ id: 'q1' })]);
    expect(await countQuestions()).toBe(1);
  });
});

describe('parentStore question generation', () => {
  beforeEach(() => {
    useQuestionStore.setState({ questions: [], loaded: false, error: null });
    useParentStore.setState({
      settings: DEFAULT_PARENT_SETTINGS,
      rewards: [],
      redemptions: [],
      loaded: true,
      error: null,
      generating: false,
      lastResult: null
    });
  });

  it('generates and persists questions through questionStore', async () => {
    const generated: Question[] = [
      createQuestion({ id: 'gen1', subject: 'english' }),
      createQuestion({ id: 'gen2', subject: 'english' })
    ];
    const result: GenerationResult = {
      success: 2,
      failed: 0,
      questions: generated,
      durationMs: 1000
    };
    vi.mocked(generateQuestionsMock).mockResolvedValueOnce(result);

    await useParentStore.getState().generateQuestions({
      subject: 'english',
      topic: 'vocabulary',
      difficulty: 2,
      count: 2,
      grade: 4
    });

    expect(useParentStore.getState().generating).toBe(false);
    expect(useParentStore.getState().lastResult?.success).toBe(2);
    expect(useQuestionStore.getState().questions).toHaveLength(2);
    expect(await countQuestions()).toBe(2);
  });

  it('sets error and stops generating on failure', async () => {
    vi.mocked(generateQuestionsMock).mockRejectedValueOnce(new Error('API error'));

    await useParentStore.getState().generateQuestions({
      subject: 'math',
      topic: 'fraction',
      difficulty: 2,
      count: 1,
      grade: 4
    });

    expect(useParentStore.getState().generating).toBe(false);
    expect(useParentStore.getState().error).toBe('API error');
    expect(useQuestionStore.getState().questions).toHaveLength(0);
  });
});
