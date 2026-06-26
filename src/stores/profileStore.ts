import { create } from 'zustand';
import type { Achievement, AchievementId, DailyStats, Profile, TransactionType } from '../types';
import {
  getAchievements as getAchievementsFromDB,
  getBattleRecords,
  getDailyStats,
  getProfile,
  getProgressBySubject,
  getTransactions,
  saveAchievement,
  saveDailyStats,
  saveProfile,
  saveTransaction
} from '../db';
import { calculateLevelUp } from '../services/battleLogic';
import { computeNextBalance, createTransaction } from '../services/economyLogic';
import { checkAchievements, checkLevelAchievements, checkStarAchievement, createInitialAchievements } from '../services/achievementLogic';
import {
  createEmptyDailyStats,
  getTodayKey,
  recordMinutes as addMinutesToStats,
  recordStarsEarned as addStarsToStats
} from '../services/usageLogic';

interface ProfileState {
  profile: Profile | null;
  achievements: Achievement[];
  dailyStats: DailyStats | null;
  loaded: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  addStars: (amount: number, reason?: string) => Promise<void>;
  applyTransaction: (type: TransactionType, amount: number, reason: string) => Promise<void>;
  addExp: (amount: number) => Promise<{ newLevel: number; newExp: number; levelUps: number }>;
  applyBattleRewards: (stars: number, exp: number) => Promise<{ newLevel: number; newExp: number; levelUps: number; newlyUnlocked: AchievementId[] }>;
  checkBattleAchievements: (subject: string, stageId: string) => Promise<AchievementId[]>;
  recordStarsEarned: (amount: number) => Promise<void>;
  recordMinutesPlayed: (minutes: number) => Promise<void>;
  loadDailyStats: (dateKey?: string) => Promise<void>;
  clearError: () => void;
}

function createDefaultProfile(): Profile {
  return {
    id: 'default',
    nickname: '小勇士',
    level: 1,
    exp: 0,
    stars: 0,
    equippedItems: {},
    createdAt: Date.now()
  };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  achievements: [],
  dailyStats: null,
  loaded: false,
  error: null,
  async loadProfile() {
    try {
      let profile = await getProfile('default');
      if (!profile) {
        profile = createDefaultProfile();
        await saveProfile(profile);
      }
      let achievements = await getAchievementsFromDB();
      if (achievements.length === 0) {
        achievements = createInitialAchievements();
        for (const achievement of achievements) {
          await saveAchievement(achievement);
        }
      }
      const today = getTodayKey();
      let dailyStats = await getDailyStats(today);
      if (!dailyStats) {
        dailyStats = createEmptyDailyStats(today);
        await saveDailyStats(dailyStats);
      }
      set({ profile, achievements, dailyStats, loaded: true, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载档案失败', loaded: true });
    }
  },
  async updateProfile(updates) {
    try {
      const current = get().profile;
      if (!current) return;
      const next = { ...current, ...updates };
      await saveProfile(next);
      set({ profile: next, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存档案失败' });
    }
  },
  async applyTransaction(type, amount, reason) {
    try {
      const current = get().profile;
      if (!current) return;
      const nextStars = computeNextBalance(type, amount, current.stars);
      const next = { ...current, stars: nextStars };
      const transaction = createTransaction(type, amount, reason, current.stars);
      await saveProfile(next);
      await saveTransaction(transaction);
      set({ profile: next, error: null });
      if (type === 'earn') {
        await get().recordStarsEarned(amount);
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存星星变动失败' });
    }
  },
  async addStars(amount, reason = '获得星星') {
    await get().applyTransaction('earn', amount, reason);
  },
  async addExp(amount) {
    try {
      const current = get().profile;
      if (!current) return { newLevel: 1, newExp: 0, levelUps: 0 };
      const { newLevel, newExp, levelUps } = calculateLevelUp(current.level, current.exp, amount);
      const next = { ...current, level: newLevel, exp: newExp };
      await saveProfile(next);
      set({ profile: next, error: null });
      return { newLevel, newExp, levelUps };
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存经验失败' });
      return { newLevel: get().profile?.level ?? 1, newExp: get().profile?.exp ?? 0, levelUps: 0 };
    }
  },
  async applyBattleRewards(stars, exp) {
    try {
      const current = get().profile;
      if (!current) return { newLevel: 1, newExp: 0, levelUps: 0, newlyUnlocked: [] };

      // Record star reward through applyTransaction so daily stats are updated exactly once.
      await get().applyTransaction('earn', stars, '战斗奖励');

      const afterStars = get().profile;
      if (!afterStars) return { newLevel: 1, newExp: 0, levelUps: 0, newlyUnlocked: [] };

      const { newLevel, newExp, levelUps } = calculateLevelUp(afterStars.level, afterStars.exp, exp);
      const next = { ...afterStars, level: newLevel, exp: newExp };
      await saveProfile(next);
      set({ profile: next, error: null });

      const newlyUnlocked: AchievementId[] = [];
      const achievements = get().achievements;
      for (const id of checkLevelAchievements(achievements, newLevel)) {
        newlyUnlocked.push(id);
      }
      const transactions = await getTransactions();
      const totalStarsEarned = transactions
        .filter(t => t.type === 'earn')
        .reduce((sum, t) => sum + t.amount, 0);
      for (const id of checkStarAchievement(achievements, totalStarsEarned)) {
        newlyUnlocked.push(id);
      }
      if (newlyUnlocked.length > 0) {
        const nextAchievements = achievements.map(a =>
          newlyUnlocked.includes(a.id) ? { ...a, unlockedAt: Date.now() } : a
        );
        for (const achievement of nextAchievements) {
          await saveAchievement(achievement);
        }
        set({ profile: next, achievements: nextAchievements, error: null });
      }
      return { newLevel, newExp, levelUps, newlyUnlocked };
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存战斗奖励失败' });
      return { newLevel: get().profile?.level ?? 1, newExp: get().profile?.exp ?? 0, levelUps: 0, newlyUnlocked: [] };
    }
  },
  async checkBattleAchievements(subject, stageId) {
    try {
      const current = get().achievements;
      const transactions = await getTransactions();
      const totalStarsEarned = transactions
        .filter(t => t.type === 'earn')
        .reduce((sum, t) => sum + t.amount, 0);
      const records = await getBattleRecords(subject as import('../types').Subject, stageId);
      const progress = await Promise.all(
        (['chinese', 'math', 'english'] as const).map(s => getProgressBySubject(s))
      ).then(groups => groups.flat());
      const { next, newlyUnlocked } = checkAchievements(current, {
        level: get().profile?.level ?? 1,
        totalStarsEarned,
        records,
        progress
      });
      if (newlyUnlocked.length > 0) {
        for (const achievement of next) {
          await saveAchievement(achievement);
        }
        set({ achievements: next, error: null });
      }
      return newlyUnlocked;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '检查成就失败' });
      return [];
    }
  },
  async recordStarsEarned(amount) {
    try {
      const current = get().dailyStats;
      if (!current) return;
      const next = addStarsToStats(current, amount, Date.now());
      await saveDailyStats(next);
      set({ dailyStats: next, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '记录星星统计失败' });
    }
  },
  async recordMinutesPlayed(minutes) {
    try {
      const current = get().dailyStats;
      if (!current) return;
      const next = addMinutesToStats(current, minutes, Date.now());
      await saveDailyStats(next);
      set({ dailyStats: next, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '记录时长统计失败' });
    }
  },
  async loadDailyStats(dateKey = getTodayKey()) {
    try {
      let stats = await getDailyStats(dateKey);
      if (!stats) {
        stats = createEmptyDailyStats(dateKey);
        await saveDailyStats(stats);
      }
      set({ dailyStats: stats, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载每日统计失败' });
    }
  },
  clearError() {
    set({ error: null });
  }
}));
