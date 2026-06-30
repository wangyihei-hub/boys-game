import type { Achievement, AchievementId, BattleRecord, MinigameStats, Progress } from '../types';

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  { id: 'first_win', title: '首战告捷', description: '首次通关任意关卡', icon: '🏆' },
  { id: 'first_boss', title: 'Boss 克星', description: '首次击败区域 Boss', icon: '👑' },
  { id: 'reach_level_5', title: '学习小达人', description: '角色等级达到 5 级', icon: '📈' },
  { id: 'reach_level_10', title: '知识探索者', description: '角色等级达到 10 级', icon: '🚀' },
  { id: 'win_streak_5', title: '五连胜', description: '连续赢得 5 场战斗', icon: '🔥' },
  { id: 'collect_100_stars', title: '星星收藏家', description: '累计获得 100 颗星星', icon: '⭐' },
  { id: 'all_subject_passed', title: '三科全能', description: '语文、数学、英语各通关至少 1 关', icon: '🌈' },
  { id: 'eye_care_guard', title: '护眼小卫士', description: '单日游戏时长达到护眼提醒限制后仍休息 5 分钟', icon: '👀' },
  { id: 'gomoku_win_3', title: '五子棋新秀', description: '在休闲五子棋中累计获胜 3 局', icon: '⚫' },
  { id: 'trivia_master_100', title: '百科达人', description: '知识问答累计答对 100 题', icon: '📚' },
  { id: 'memory_s_10', title: '记忆大师', description: '记忆翻牌累计获得 10 次 S 评价', icon: '🧠' },
  { id: 'speed_math_s_3', title: '速算闪电侠', description: '速算挑战累计获得 3 次 S 评价', icon: '⚡' },
  { id: 'word_chain_100', title: '词语接龙王', description: '词语接龙累计接词 100 次', icon: '🔗' }
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
    minigameStats?: MinigameStats;
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
    // In V3 every level contains a boss module, so any winning record counts as a boss win.
    const hasBossWin = context.records.some(r => r.result === 'win' && r.levelNumber >= 1);
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

  if (!isUnlocked('eye_care_guard')) {
    // Eye-care guard is unlocked when the app records a rest session after reaching the daily limit.
    // The profileStore explicitly unlocks it via checkMinigameAchievements after a rest is confirmed.
  }

  const stats = context.minigameStats;
  if (stats) {
    if (!isUnlocked('gomoku_win_3') && stats.gomokuWins >= 3) unlock('gomoku_win_3');
    if (!isUnlocked('trivia_master_100') && stats.triviaCorrect >= 100) unlock('trivia_master_100');
    if (!isUnlocked('memory_s_10') && stats.memorySRankCount >= 10) unlock('memory_s_10');
    if (!isUnlocked('speed_math_s_3') && stats.speedMathSRankCount >= 3) unlock('speed_math_s_3');
    if (!isUnlocked('word_chain_100') && stats.wordChainCount >= 100) unlock('word_chain_100');
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
