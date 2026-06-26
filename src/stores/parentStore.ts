import { create } from 'zustand';
import type { ParentSettings, Reward, Redemption } from '../types';
import { getParentSettings, saveParentSettings, getRewards, saveReward, getRedemptions, saveRedemption } from '../db';

interface ParentState {
  settings: ParentSettings | null;
  rewards: Reward[];
  redemptions: Redemption[];
  loaded: boolean;
  loadParentData: () => Promise<void>;
  updateSettings: (settings: ParentSettings) => Promise<void>;
  addReward: (reward: Reward) => Promise<void>;
  confirmRedemption: (id: string) => Promise<void>;
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
  async loadParentData() {
    const [settings, rewards, redemptions] = await Promise.all([
      getParentSettings('default'),
      getRewards(),
      getRedemptions()
    ]);
    set({
      settings: settings ?? DEFAULT_SETTINGS,
      rewards,
      redemptions,
      loaded: true
    });
    if (!settings) {
      await saveParentSettings(DEFAULT_SETTINGS);
    }
  },
  async updateSettings(settings) {
    await saveParentSettings(settings);
    set({ settings });
  },
  async addReward(reward) {
    await saveReward(reward);
    set({ rewards: [...get().rewards, reward] });
  },
  async confirmRedemption(id) {
    const redemption = get().redemptions.find(r => r.id === id);
    if (!redemption) return;
    const updated = { ...redemption, status: 'confirmed' as const, confirmedAt: Date.now() };
    await saveRedemption(updated);
    set({ redemptions: get().redemptions.map(r => (r.id === id ? updated : r)) });
  }
}));
