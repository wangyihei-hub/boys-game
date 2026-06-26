import { create } from 'zustand';
import type { Achievement, AchievementId, DailyStats, Profile, TransactionType } from '../types';
import {
  getAchievements as getAchievementsFromDB,
  getAllBattleRecords,
  getBattleRecords,
  getDailyStats,
  getDailyTasks,
  getInventory,
  getProfile,
  getProgressBySubject,
  getTransactions,
  deleteInventoryItem,
  saveAchievement,
  saveDailyStats,
  saveInventoryItem,
  saveProfile,
  saveTransaction
} from '../db';
import { calculateLevelUp } from '../services/battleLogic';
import { computeNextBalance, createTransaction } from '../services/economyLogic';
import { checkAchievements, checkLevelAchievements, checkStarAchievement, createInitialAchievements } from '../services/achievementLogic';
import {
  checkEvolution,
  evolvePet as evolvePetLogic,
  feedPet as feedPetLogic,
  getPetInstance
} from '../services/petLogic';
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
  setActivePet: (petItemId: string | undefined) => Promise<void>;
  feedPet: (petItemId: string, foodItemId?: string) => Promise<{ success: boolean; error?: string }>;
  evolvePet: (petItemId: string) => Promise<{ success: boolean; error?: string }>;
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
  async setActivePet(petItemId) {
    await get().updateProfile({ activePet: petItemId });
  },
  async feedPet(petItemId, foodItemId) {
    try {
      const inventory = await getInventory();
      const targetFoodId = foodItemId ?? inventory.find(i => i.type === 'pet_food')?.id;
      if (!targetFoodId) {
        return { success: false, error: '没有宠物食物' };
      }

      const { inventory: nextInventory, error } = feedPetLogic(inventory, petItemId, targetFoodId);
      if (error) {
        return { success: false, error };
      }

      const nextPet = nextInventory.find(i => i.id === petItemId);
      const nextFood = nextInventory.find(i => i.id === targetFoodId);
      if (nextPet) await saveInventoryItem(nextPet);
      if (nextFood) {
        await saveInventoryItem(nextFood);
      } else {
        await deleteInventoryItem(targetFoodId);
      }

      const { useEconomyStore } = await import('./economyStore');
      await useEconomyStore.getState().loadInventory();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : '喂养失败';
      set({ error: message });
      return { success: false, error: message };
    }
  },
  async evolvePet(petItemId) {
    try {
      const inventory = await getInventory();
      const petItem = inventory.find(i => i.id === petItemId && i.type === 'pet');
      if (!petItem) {
        return { success: false, error: '宠物不存在' };
      }

      const petInstance = getPetInstance(inventory, petItemId);
      if (!petInstance) {
        return { success: false, error: '宠物信息不完整' };
      }

      const battleRecords = await getAllBattleRecords();
      const dailyTasks = await getDailyTasks(getTodayKey());
      const { canEvolve } = checkEvolution(petInstance, battleRecords, dailyTasks);
      if (!canEvolve) {
        return { success: false, error: '进化条件不足' };
      }

      const { inventory: nextInventory, error } = evolvePetLogic(
        inventory,
        petItemId,
        battleRecords,
        dailyTasks
      );
      if (error) {
        return { success: false, error };
      }

      const nextPet = nextInventory.find(i => i.id === petItemId);
      if (nextPet) await saveInventoryItem(nextPet);

      const { useEconomyStore } = await import('./economyStore');
      await useEconomyStore.getState().loadInventory();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : '进化失败';
      set({ error: message });
      return { success: false, error: message };
    }
  },
  clearError() {
    set({ error: null });
  }
}));
