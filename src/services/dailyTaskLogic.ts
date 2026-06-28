import type { CurriculumConfig, DailyTask, TaskType, Subject } from '../types';
import { getTodayCurriculumDay } from './curriculumData';

export const TASK_TEMPLATES: { type: TaskType; title: string; target: number; rewardStars: number }[] = [
  { type: 'login', title: '今日登录', target: 1, rewardStars: 2 },
  { type: 'win_battle', title: '通关 1 场战斗', target: 1, rewardStars: 5 },
  { type: 'correct_answers', title: '累计答对 5 题', target: 5, rewardStars: 5 },
  { type: 'earn_stars', title: '今日获得 20 颗星星', target: 20, rewardStars: 5 }
];

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function generateId(dateKey: string, type: TaskType): string {
  return `${dateKey}-${type}`;
}

export function generateDailyTasks(dateKey: string): DailyTask[] {
  return generateDailyTasksWithCurriculum(dateKey);
}

export function generateDailyTasksWithCurriculum(
  dateKey: string,
  curriculumConfig?: CurriculumConfig
): DailyTask[] {
  // Always include login and win_battle; rotate the third task by day for variety.
  const baseTypes: TaskType[] = ['login', 'win_battle', 'correct_answers'];
  const extraIndex = parseInt(dateKey.replace(/-/g, ''), 10) % 2;
  const extraType: TaskType = extraIndex === 0 ? 'earn_stars' : 'correct_answers';
  const selectedTypes = Array.from(new Set([...baseTypes, extraType]));

  const tasks = selectedTypes.map(type => {
    const template = TASK_TEMPLATES.find(t => t.type === type)!;
    return {
      id: generateId(dateKey, type),
      title: template.title,
      type,
      target: template.target,
      rewardStars: template.rewardStars,
      completed: type === 'login',
      progress: type === 'login' ? 1 : 0,
      dateKey
    };
  });

  const todayDay = curriculumConfig ? getTodayCurriculumDay(curriculumConfig) : undefined;
  const lessons = todayDay?.lessons ?? [];
  lessons.forEach((lesson, index) => {
    tasks.push({
      id: `${dateKey}-curriculum-${lesson.subject}-${index}`,
      title: `今日${subjectLabel(lesson.subject)}：${lesson.topic}`,
      type: 'correct_answers',
      target: Math.max(1, Math.min(lesson.questionCount, 10)),
      rewardStars: 3,
      completed: false,
      progress: 0,
      dateKey
    });
  });

  return tasks;
}

function subjectLabel(subject: Subject): string {
  const labels: Record<Subject, string> = { chinese: '语文', math: '数学', english: '英语' };
  return labels[subject];
}

export function updateTaskProgress(
  tasks: DailyTask[],
  type: TaskType,
  increment: number
): { next: DailyTask[]; completedIds: string[]; totalReward: number } {
  const completedIds: string[] = [];
  let totalReward = 0;

  const next = tasks.map(task => {
    if (task.type !== type || task.completed) return task;
    const nextProgress = Math.min(task.target, task.progress + increment);
    const nextCompleted = nextProgress >= task.target;
    if (nextCompleted && !task.completed) {
      completedIds.push(task.id);
      totalReward += task.rewardStars;
    }
    return { ...task, progress: nextProgress, completed: nextCompleted };
  });

  return { next, completedIds, totalReward };
}

export function markTaskRewardClaimed(tasks: DailyTask[], id: string): DailyTask[] {
  return tasks.map(task => (task.id === id ? { ...task, rewardStars: 0 } : task));
}
