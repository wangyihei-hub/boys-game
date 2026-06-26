import { describe, expect, it } from 'vitest';
import {
  TASK_TEMPLATES,
  generateDailyTasks,
  getTodayKey,
  markTaskRewardClaimed,
  updateTaskProgress
} from '../src/services/dailyTaskLogic';

describe('dailyTaskLogic', () => {
  it('generates tasks for a date key', () => {
    const tasks = generateDailyTasks('2026-06-27');
    expect(tasks.length).toBeGreaterThanOrEqual(3);
    expect(tasks.some(t => t.type === 'login')).toBe(true);
    expect(tasks.some(t => t.type === 'win_battle')).toBe(true);
    expect(tasks.every(t => t.dateKey === '2026-06-27')).toBe(true);
  });

  it('marks login task as completed by default', () => {
    const tasks = generateDailyTasks('2026-06-27');
    const loginTask = tasks.find(t => t.type === 'login');
    expect(loginTask?.completed).toBe(true);
    expect(loginTask?.progress).toBe(1);
  });

  it('updates win_battle progress and detects completion', () => {
    const tasks = generateDailyTasks('2026-06-27');
    const { next, completedIds, totalReward } = updateTaskProgress(tasks, 'win_battle', 1);
    const task = next.find(t => t.type === 'win_battle');
    expect(task?.progress).toBe(1);
    expect(task?.completed).toBe(true);
    expect(completedIds).toContain(task?.id);
    expect(totalReward).toBe(task?.rewardStars);
  });

  it('accumulates correct_answers progress', () => {
    const tasks = generateDailyTasks('2026-06-27');
    let { next } = updateTaskProgress(tasks, 'correct_answers', 2);
    ({ next } = updateTaskProgress(next, 'correct_answers', 2));
    const task = next.find(t => t.type === 'correct_answers');
    expect(task?.progress).toBe(4);
    expect(task?.completed).toBe(false);

    ({ next } = updateTaskProgress(next, 'correct_answers', 1));
    const finished = next.find(t => t.type === 'correct_answers');
    expect(finished?.progress).toBe(5);
    expect(finished?.completed).toBe(true);
  });

  it('does not exceed target progress', () => {
    const tasks = generateDailyTasks('2026-06-27');
    const { next } = updateTaskProgress(tasks, 'correct_answers', 100);
    const task = next.find(t => t.type === 'correct_answers');
    expect(task?.progress).toBe(task?.target);
  });

  it('returns empty completion when task already completed', () => {
    const tasks = generateDailyTasks('2026-06-27');
    const { next } = updateTaskProgress(tasks, 'win_battle', 1);
    const second = updateTaskProgress(next, 'win_battle', 1);
    expect(second.completedIds).toHaveLength(0);
    expect(second.totalReward).toBe(0);
  });

  it('marks task reward as claimed', () => {
    const tasks = generateDailyTasks('2026-06-27');
    const target = tasks.find(t => t.type === 'win_battle')!;
    const claimed = markTaskRewardClaimed(tasks, target.id);
    expect(claimed.find(t => t.id === target.id)?.rewardStars).toBe(0);
  });

  it('produces deterministic templates', () => {
    expect(TASK_TEMPLATES.length).toBeGreaterThanOrEqual(4);
    for (const template of TASK_TEMPLATES) {
      expect(template.target).toBeGreaterThan(0);
      expect(template.rewardStars).toBeGreaterThanOrEqual(0);
    }
  });

  it('generates unique task ids', () => {
    const tasks = generateDailyTasks('2026-06-27');
    const ids = tasks.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getTodayKey returns a YYYY-MM-DD string', () => {
    const key = getTodayKey();
    expect(/^\d{4}-\d{2}-\d{2}$/.test(key)).toBe(true);
  });
});
