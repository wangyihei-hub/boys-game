import { create } from 'zustand';
import type { GenerationResult, ParentSettings, QuestionGenerationConfig, Reward, Redemption } from '../types';
import {
  getParentSettings,
  saveParentSettings,
  getRewards,
  saveReward,
  deleteReward as deleteRewardFromDB,
  getRedemptions,
  saveRedemption
} from '../db';
import { generateQuestions as generateQuestionsFromAI } from '../services/aiQuestion';
import { useQuestionStore } from './questionStore';

interface ParentState {
  settings: ParentSettings | null;
  rewards: Reward[];
  redemptions: Redemption[];
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
  generateQuestions: (config: QuestionGenerationConfig) => Promise<void>;
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
  loaded: false,
  error: null,
  generating: false,
  lastResult: null,
  async loadParentData() {
    try {
      const [settings, rewards, redemptions] = await Promise.all([
        getParentSettings('default'),
        getRewards(),
        getRedemptions()
      ]);
      set({
        settings: settings ?? DEFAULT_SETTINGS,
        rewards,
        redemptions,
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
  clearError() {
    set({ error: null });
  },
  clearGenerationResult() {
    set({ lastResult: null });
  }
}));
