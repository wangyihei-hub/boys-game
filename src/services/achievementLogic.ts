import { STAGES } from '../stores/gameStore';
import type { Achievement, AchievementId, BattleRecord, Progress } from '../types';

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  { id: 'first_win', title: '首战告捷', description: '首次通关任意关卡', icon: '🏆' },
  { id: 'first_boss', title: 'Boss 克星', description: '首次击败区域 Boss', icon: '👑' },
  { id: 'reach_level_5', title: '学习小达人', description: '角色等级达到 5 级', icon: '📈' },
  { id: 'reach_level_10', title: '知识探索者', description: '角色等级达到 10 级', icon: '🚀' },
  { id: 'win_streak_5', title: '五连胜', description: '连续赢得 5 场战斗', icon: '🔥' },
  { id: 'collect_100_stars', title: '星星收藏家', description: '累计获得 100 颗星星', icon: '⭐' },
  { id: 'all_subject_passed', title: '三科全能', description: '语文、数学、英语各通关至少 1 关', icon: '🌈' }
];

export function createInitialAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map(def => ({ ...def }));
}

export function checkAchievements(
  current: Achievement[],
  context: {
    level: number;
    totalStarsEarned: number;
    records: BattleRecord[];
    progress: Progress[];
  }
): { next: Achievement[]; newlyUnlocked: AchievementId[] } {
  const next: Achievement[] = current.map(a => ({ ...a }));
  const newlyUnlocked: AchievementId[] = [];

  const isUnlocked = (id: AchievementId) => next.find(a => a.id === id)?.unlockedAt !== undefined;
  const unlock = (id: AchievementId) => {
    const achievement = next.find(a => a.id === id);
    if (achievement && !achievement.unlockedAt) {
      achievement.unlockedAt = Date.now();
      newlyUnlocked.push(id);
    }
  };

  if (!isUnlocked('first_win')) {
    const hasWin = context.records.some(r => r.result === 'win');
    if (hasWin) unlock('first_win');
  }

  if (!isUnlocked('first_boss')) {
    const bossStageIds = new Set(STAGES.filter(s => s.isBoss).map(s => s.id));
    const hasBossWin = context.records.some(r => r.result === 'win' && bossStageIds.has(r.stageId));
    if (hasBossWin) unlock('first_boss');
  }

  if (!isUnlocked('reach_level_5') && context.level >= 5) unlock('reach_level_5');
  if (!isUnlocked('reach_level_10') && context.level >= 10) unlock('reach_level_10');

  if (!isUnlocked('collect_100_stars') && context.totalStarsEarned >= 100) unlock('collect_100_stars');

  if (!isUnlocked('win_streak_5')) {
    const sorted = [...context.records].sort((a, b) => a.createdAt - b.createdAt);
    let streak = 0;
    let maxStreak = 0;
    for (const record of sorted) {
      if (record.result === 'win') {
        streak += 1;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }
    if (maxStreak >= 5) unlock('win_streak_5');
  }

  if (!isUnlocked('all_subject_passed')) {
    const passedSubjects = new Set(context.progress.filter(p => p.status === 'passed').map(p => p.subject));
    if (passedSubjects.size >= 3) unlock('all_subject_passed');
  }

  return { next, newlyUnlocked };
}

export function checkLevelAchievements(current: Achievement[], level: number): AchievementId[] {
  const { next, newlyUnlocked } = checkAchievements(current, {
    level,
    totalStarsEarned: 0,
    records: [],
    progress: []
  });
  void next;
  return newlyUnlocked;
}

export function checkStarAchievement(current: Achievement[], totalStarsEarned: number): AchievementId[] {
  const { next, newlyUnlocked } = checkAchievements(current, {
    level: 1,
    totalStarsEarned,
    records: [],
    progress: []
  });
  void next;
  return newlyUnlocked;
}
