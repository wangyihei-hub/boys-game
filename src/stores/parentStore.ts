import { create } from 'zustand';
import type { DailyTask, GenerationResult, LotteryPrize, ParentSettings, QuestionGenerationConfig, Reward, Redemption } from '../types';
import {
  getParentSettings,
  saveParentSettings,
  getRewards,
  saveReward,
  deleteReward as deleteRewardFromDB,
  getRedemptions,
  saveRedemption,
  getDailyTasks,
  saveDailyTask,
  saveDailyTasks,
  deleteDailyTasks as deleteDailyTasksFromDB,
  getLotteryPool,
  saveLotteryPrize,
  deleteLotteryPrize as deleteLotteryPrizeFromDB
} from '../db/dataAccess';
import { generateQuestions as generateQuestionsFromAI } from '../services/aiQuestion';
import { generateDailyTasksWithCurriculum, getTodayKey, markTaskRewardClaimed } from '../services/dailyTaskLogic';
import { generateCurriculumQuestionsForRange } from '../services/curriculumLogic';
import type { CurriculumConfig } from '../types';
import { createLotteryPrizeId } from '../services/lotteryLogic';
import { isValidPinFormat } from '../services/pinLogic';
import { useProfileStore } from './profileStore';
import { useQuestionStore } from './questionStore';

interface ParentState {
  settings: ParentSettings | null;
  rewards: Reward[];
  redemptions: Redemption[];
  dailyTasks: DailyTask[];
  lotteryPool: LotteryPrize[];
  loaded: boolean;
  error: string | null;
  generating: boolean;
  lastResult: GenerationResult | null;
  loadParentData: () => Promise<void>;
  updateSettings: (settings: ParentSettings) => Promise<void>;
  addReward: (reward: Reward) => Promise<void>;
  updateReward: (reward: Reward) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  addRedemption: (redemption: Redemption) => Promise<void>;
  confirmRedemption: (id: string) => Promise<void>;
  markRedemptionRejected: (id: string) => Promise<void>;
  loadDailyTasks: (dateKey?: string) => Promise<void>;
  addDailyTask: (task: DailyTask) => Promise<void>;
  updateDailyTask: (task: DailyTask) => Promise<void>;
  deleteDailyTask: (id: string, dateKey?: string) => Promise<void>;
  resetDailyTasks: (dateKey?: string) => Promise<void>;
  claimDailyTaskReward: (taskId: string) => Promise<{ success: boolean; error?: string }>;
  loadLotteryPool: () => Promise<void>;
  addLotteryPrize: (prize: Omit<LotteryPrize, 'id'>) => Promise<void>;
  updateLotteryPrize: (prize: LotteryPrize) => Promise<void>;
  deleteLotteryPrize: (id: string) => Promise<void>;
  generateQuestions: (config: QuestionGenerationConfig) => Promise<void>;
  updateCurriculum: (curriculum: CurriculumConfig | undefined) => Promise<void>;
  generateCurriculumQuestions: (startDayIndex?: number, endDayIndex?: number) => Promise<GenerationResult>;
  verifyPin: (input: string) => boolean;
  updatePin: (pin: string | undefined) => Promise<void>;
  clearError: () => void;
  clearGenerationResult: () => void;
}

const DEFAULT_SETTINGS: ParentSettings = {
  dailyStarLimit: 100,
  dailyMinuteLimit: 45,
  eyeCareIntervalMinutes: 20,
  restModeStartHour: 21
};

export const useParentStore = create<ParentState>((set, get) => ({
  settings: null,
  rewards: [],
  redemptions: [],
  dailyTasks: [],
  lotteryPool: [],
  loaded: false,
  error: null,
  generating: false,
  lastResult: null,
  async loadParentData() {
    try {
      const today = getTodayKey();
      const [settings, rewards, redemptions, loadedTasks, lotteryPool] = await Promise.all([
        getParentSettings('default'),
        getRewards(),
        getRedemptions(),
        getDailyTasks(today),
        getLotteryPool()
      ]);
      const curriculumConfig = settings?.curriculum;
      const dailyTasks = loadedTasks.length > 0 ? loadedTasks : generateDailyTasksWithCurriculum(today, curriculumConfig);
      if (loadedTasks.length === 0) {
        await saveDailyTasks(dailyTasks);
      }
      set({
        settings: settings ?? DEFAULT_SETTINGS,
        rewards,
        redemptions,
        dailyTasks,
        lotteryPool,
        loaded: true,
        error: null
      });
      if (!settings) {
        await saveParentSettings(DEFAULT_SETTINGS);
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载家长数据失败', loaded: true });
    }
  },
  async updateSettings(settings) {
    try {
      await saveParentSettings(settings);
      set({ settings, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存设置失败' });
    }
  },
  async addReward(reward) {
    try {
      await saveReward(reward);
      set({ rewards: [...get().rewards, reward], error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存奖励失败' });
    }
  },
  async updateReward(reward) {
    try {
      await saveReward(reward);
      set({
        rewards: get().rewards.map(r => (r.id === reward.id ? reward : r)),
        error: null
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新奖励失败' });
    }
  },
  async deleteReward(id) {
    try {
      await deleteRewardFromDB(id);
      set({ rewards: get().rewards.filter(r => r.id !== id), error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除奖励失败' });
    }
  },
  async addRedemption(redemption) {
    try {
      await saveRedemption(redemption);
      set({ redemptions: [redemption, ...get().redemptions], error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存兑换申请失败' });
    }
  },
  async confirmRedemption(id) {
    try {
      const redemption = get().redemptions.find(r => r.id === id);
      if (!redemption) return;
      const reward = get().rewards.find(r => r.id === redemption.rewardId);
      const updatedRedemption = { ...redemption, status: 'confirmed' as const, confirmedAt: Date.now() };
      await saveRedemption(updatedRedemption);
      if (reward && reward.stock > 0) {
        const updatedReward = { ...reward, stock: reward.stock - 1 };
        await saveReward(updatedReward);
        set({
          redemptions: get().redemptions.map(r => (r.id === id ? updatedRedemption : r)),
          rewards: get().rewards.map(r => (r.id === reward.id ? updatedReward : r)),
          error: null
        });
      } else {
        set({
          redemptions: get().redemptions.map(r => (r.id === id ? updatedRedemption : r)),
          error: null
        });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '确认兑换失败' });
    }
  },
  async markRedemptionRejected(id) {
    try {
      const redemption = get().redemptions.find(r => r.id === id);
      if (!redemption) return;
      const updated = { ...redemption, status: 'rejected' as const, rejectedAt: Date.now() };
      await saveRedemption(updated);
      set({ redemptions: get().redemptions.map(r => (r.id === id ? updated : r)), error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '拒绝兑换失败' });
    }
  },
  async loadDailyTasks(dateKey = getTodayKey()) {
    try {
      const loadedTasks = await getDailyTasks(dateKey);
      const curriculumConfig = get().settings?.curriculum;
      const tasks = loadedTasks.length > 0 ? loadedTasks : generateDailyTasksWithCurriculum(dateKey, curriculumConfig);
      if (loadedTasks.length === 0) {
        await saveDailyTasks(tasks);
      }
      set({ dailyTasks: tasks, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载每日任务失败' });
    }
  },
  async addDailyTask(task) {
    try {
      await saveDailyTask(task);
      set({ dailyTasks: [...get().dailyTasks, task], error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '添加任务失败' });
    }
  },
  async updateDailyTask(task) {
    try {
      await saveDailyTask(task);
      set({
        dailyTasks: get().dailyTasks.map(t => (t.id === task.id ? task : t)),
        error: null
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新任务失败' });
    }
  },
  async deleteDailyTask(id, dateKey = getTodayKey()) {
    try {
      await deleteDailyTasksFromDB(dateKey);
      const nextTasks = get().dailyTasks.filter(t => t.id !== id);
      for (const task of nextTasks) {
        await saveDailyTask(task);
      }
      set({ dailyTasks: nextTasks, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除任务失败' });
    }
  },
  async resetDailyTasks(dateKey = getTodayKey()) {
    try {
      await deleteDailyTasksFromDB(dateKey);
      const curriculumConfig = get().settings?.curriculum;
      const tasks = generateDailyTasksWithCurriculum(dateKey, curriculumConfig);
      for (const task of tasks) {
        await saveDailyTask(task);
      }
      set({ dailyTasks: tasks, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '重置任务失败' });
    }
  },
  async claimDailyTaskReward(taskId) {
    const task = get().dailyTasks.find(t => t.id === taskId);
    if (!task) return { success: false, error: '任务不存在' };
    if (!task.completed) return { success: false, error: '任务尚未完成' };
    if (task.rewardStars <= 0) return { success: false, error: '奖励已领取' };

    try {
      await useProfileStore.getState().applyTransaction('earn', task.rewardStars, `完成任务：${task.title}`);
      const nextTasks = markTaskRewardClaimed(get().dailyTasks, taskId);
      const updated = nextTasks.find(t => t.id === taskId)!;
      await saveDailyTask(updated);
      set({ dailyTasks: nextTasks, error: null });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : '领取失败';
      set({ error: message });
      return { success: false, error: message };
    }
  },
  async loadLotteryPool() {
    try {
      const lotteryPool = await getLotteryPool();
      set({ lotteryPool, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载奖池失败' });
    }
  },
  async addLotteryPrize(prize) {
    try {
      const item: LotteryPrize = { ...prize, id: createLotteryPrizeId() };
      await saveLotteryPrize(item);
      set({ lotteryPool: [...get().lotteryPool, item], error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '添加奖品失败' });
    }
  },
  async updateLotteryPrize(prize) {
    try {
      await saveLotteryPrize(prize);
      set({
        lotteryPool: get().lotteryPool.map(p => (p.id === prize.id ? prize : p)),
        error: null
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新奖品失败' });
    }
  },
  async deleteLotteryPrize(id) {
    try {
      await deleteLotteryPrizeFromDB(id);
      set({ lotteryPool: get().lotteryPool.filter(p => p.id !== id), error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除奖品失败' });
    }
  },
  async generateQuestions(config) {
    const settings = get().settings;
    if (!settings) {
      set({ error: '家长设置未加载' });
      return;
    }
    set({ generating: true, error: null, lastResult: null });
    try {
      const result = await generateQuestionsFromAI(config, {
        apiProvider: settings.apiProvider,
        apiKey: settings.apiKey,
        apiEndpoint: settings.apiEndpoint,
        apiModel: settings.apiModel
      });
      if (result.questions.length > 0) {
        await useQuestionStore.getState().saveGeneratedQuestions(result.questions);
      }
      set({ lastResult: result, generating: false, error: null });
    } catch (err) {
      set({ generating: false, error: err instanceof Error ? err.message : '生成题目失败', lastResult: null });
    }
  },
  async updateCurriculum(curriculum) {
    const current = get().settings;
    if (!current) {
      set({ error: '家长设置未加载' });
      return;
    }
    const next = { ...current, curriculum };
    try {
      await saveParentSettings(next);
      set({ settings: next, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存课程计划失败' });
    }
  },
  async generateCurriculumQuestions(startDayIndex, endDayIndex) {
    const settings = get().settings;
    if (!settings) throw new Error('家长设置未加载');
    const curriculum = settings.curriculum;
    if (!curriculum || !curriculum.enabled) throw new Error('90 天课程未启用');

    const startTime = performance.now();
    set({ generating: true, error: null, lastResult: null });
    try {
      const { questions, generatedCount, failed } = await generateCurriculumQuestionsForRange(
        curriculum,
        startDayIndex,
        endDayIndex
      );
      if (questions.length > 0) {
        await useQuestionStore.getState().saveGeneratedQuestions(questions);
      }
      const result: GenerationResult = {
        success: generatedCount,
        failed,
        questions,
        durationMs: Math.round(performance.now() - startTime)
      };
      set({ lastResult: result, generating: false, error: null });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成课程题目失败';
      set({ generating: false, error: message, lastResult: null });
      throw new Error(message);
    }
  },
  verifyPin(input) {
    const settings = get().settings;
    if (!settings?.pin) return true;
    return input === settings.pin;
  },
  async updatePin(pin) {
    try {
      if (pin !== undefined && !isValidPinFormat(pin)) {
        set({ error: 'PIN 必须是 4-6 位数字' });
        return;
      }
      const current = get().settings;
      if (!current) return;
      const next = { ...current, pin };
      await saveParentSettings(next);
      set({ settings: next, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新 PIN 失败' });
    }
  },
  clearError() {
    set({ error: null });
  },
  clearGenerationResult() {
    set({ lastResult: null });
  }
}));
