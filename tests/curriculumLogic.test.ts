import { describe, it, expect } from 'vitest';
import type { CurriculumConfig } from '../src/types';
import { generateCurriculumPlan, getTodayCurriculumDay, CURRICULUM_DAYS } from '../src/services/curriculumData';
import { generateLessonQuestions } from '../src/services/curriculumLogic';

describe('curriculumData', () => {
  const baseConfig: CurriculumConfig = {
    enabled: true,
    grade: 4,
    startDate: '2026-06-01',
    subjects: ['chinese', 'math', 'english'],
    questionsPerLesson: 5,
  };

  it('generates the configured number of days', () => {
    const plan = generateCurriculumPlan(baseConfig);
    expect(plan).toHaveLength(CURRICULUM_DAYS);
  });

  it('each day has one lesson per configured subject', () => {
    const plan = generateCurriculumPlan(baseConfig);
    plan.forEach(day => {
      expect(day.lessons).toHaveLength(3);
      day.lessons.forEach(lesson => {
        expect(lesson.questionCount).toBe(5);
        expect([1, 2, 3]).toContain(lesson.difficulty);
      });
    });
  });

  it('returns empty lessons when disabled', () => {
    const plan = generateCurriculumPlan({ ...baseConfig, enabled: false });
    expect(plan[0].lessons).toHaveLength(3);
  });

  it('respects subject selection', () => {
    const plan = generateCurriculumPlan({ ...baseConfig, subjects: ['math'] });
    expect(plan[0].lessons).toHaveLength(1);
    expect(plan[0].lessons[0].subject).toBe('math');
  });

  it('computes date keys sequentially', () => {
    const plan = generateCurriculumPlan(baseConfig);
    expect(plan[0].dateKey).toBe('2026-06-01');
    expect(plan[1].dateKey).toBe('2026-06-02');
    expect(plan[59].dateKey).toBe('2026-07-30');
  });

  it('returns today day based on start date', () => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const start = new Date(today);
    start.setDate(start.getDate() - 5);
    const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const day = getTodayCurriculumDay({ ...baseConfig, startDate });
    expect(day).toBeDefined();
    expect(day!.dayIndex).toBe(5);
    expect(day!.dateKey).toBe(todayKey);
  });

  it('returns undefined when out of range', () => {
    const future = new Date();
    future.setDate(future.getDate() - 100);
    const startDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
    expect(getTodayCurriculumDay({ ...baseConfig, startDate })).toBeUndefined();
  });
});

describe('curriculumLogic', () => {
  it('generates local questions for a lesson', async () => {
    const questions = await generateLessonQuestions(
      { subject: 'math', topic: '四则运算', difficulty: 1, questionCount: 3 },
      4
    );
    expect(questions.length).toBeGreaterThan(0);
    questions.forEach(q => {
      expect(q.subject).toBe('math');
      expect(q.topic).toBe('四则运算');
      expect(q.difficulty).toBe(1);
      expect(q.generatedAt).toBeGreaterThan(0);
    });
  });
});
