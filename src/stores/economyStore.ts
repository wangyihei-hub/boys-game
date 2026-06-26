import { create } from 'zustand';
import type { Redemption, Reward, Transaction } from '../types';
import { getRedemptions, getRewards, getTransactions } from '../db';
import { canAfford, createRedemption } from '../services/economyLogic';
import { useParentStore } from './parentStore';
import { useProfileStore } from './profileStore';

interface EconomyState {
  rewards: Reward[];
  redemptions: Redemption[];
  transactions: Transaction[];
  loaded: boolean;
  error: string | null;
  loadEconomyData: () => Promise<void>;
  requestRedemption: (rewardId: string) => Promise<{ success: boolean; error?: string }>;
  cancelPendingRedemption: (id: string) => Promise<{ success: boolean; error?: string }>;
  rejectRedemption: (id: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
  rewards: [],
  redemptions: [],
  transactions: [],
  loaded: false,
  error: null,
  async loadEconomyData() {
    try {
      const [rewards, redemptions, transactions] = await Promise.all([
        getRewards(),
        getRedemptions(),
        getTransactions()
      ]);
      set({ rewards, redemptions, transactions, loaded: true, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载经济数据失败', loaded: true });
    }
  },
  async requestRedemption(rewardId) {
    const reward = get().rewards.find(r => r.id === rewardId);
    if (!reward) return { success: false, error: '奖励不存在' };

    const profile = useProfileStore.getState().profile;
    if (!profile) return { success: false, error: '孩子档案未加载' };

    if (!canAfford(profile, reward.starCost)) {
      return { success: false, error: '星星不足' };
    }

    try {
      await useProfileStore.getState().applyTransaction('spend', reward.starCost, `兑换 ${reward.name}`);
      const redemption = createRedemption(reward);
      await useParentStore.getState().addRedemption(redemption);
      set({
        redemptions: [redemption, ...get().redemptions],
        error: null
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : '兑换失败';
      set({ error: message });
      return { success: false, error: message };
    }
  },
  async cancelPendingRedemption(id) {
    const redemption = get().redemptions.find(r => r.id === id);
    if (!redemption) return { success: false, error: '兑换记录不存在' };
    if (redemption.status !== 'pending') return { success: false, error: '只能撤销待处理兑换' };

    try {
      await useProfileStore.getState().applyTransaction('refund', redemption.starCost, `撤销兑换 ${redemption.rewardName}`);
      const updated = { ...redemption, status: 'rejected' as const, rejectedAt: Date.now() };
      await useParentStore.getState().markRedemptionRejected(id);
      set({
        redemptions: get().redemptions.map(r => (r.id === id ? updated : r)),
        error: null
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : '撤销失败';
      set({ error: message });
      return { success: false, error: message };
    }
  },
  async rejectRedemption(id) {
    const redemption = get().redemptions.find(r => r.id === id);
    if (!redemption) return { success: false, error: '兑换记录不存在' };
    if (redemption.status !== 'pending') return { success: false, error: '只能拒绝待处理兑换' };

    try {
      await useProfileStore.getState().applyTransaction('refund', redemption.starCost, `兑换被拒：${redemption.rewardName}`);
      await useParentStore.getState().markRedemptionRejected(id);
      const updated = { ...redemption, status: 'rejected' as const, rejectedAt: Date.now() };
      set({
        redemptions: get().redemptions.map(r => (r.id === id ? updated : r)),
        error: null
      });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : '拒绝失败';
      set({ error: message });
      return { success: false, error: message };
    }
  },
  clearError() {
    set({ error: null });
  }
}));
