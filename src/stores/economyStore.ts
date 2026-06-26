import { create } from 'zustand';
import type { InventoryItem, LotteryPrize, Redemption, Reward, Transaction } from '../types';
import {
  getInventory,
  getLotteryPool,
  getRedemptions,
  getRewards,
  getTransactions,
  saveInventoryItem,
  saveLotteryPrize
} from '../db';
import { canAfford, createRedemption, createRewardId } from '../services/economyLogic';
import { createPetInstance } from '../services/petLogic';
import {
  canSynthesizeFragment,
  createDefaultLotteryPool,
  createInventoryItem,
  drawPrize,
  getInventoryCount,
  synthesizeFragmentReward,
  updateInventory
} from '../services/lotteryLogic';
import { useParentStore } from './parentStore';
import { useProfileStore } from './profileStore';

const LOTTERY_TICKET_ID = 'lottery_ticket';
const LOTTERY_TICKET_COST = 10;

interface EconomyState {
  rewards: Reward[];
  redemptions: Redemption[];
  transactions: Transaction[];
  inventory: InventoryItem[];
  lotteryPool: LotteryPrize[];
  lotteryDrawCount: number;
  loaded: boolean;
  error: string | null;
  loadEconomyData: () => Promise<void>;
  loadInventory: () => Promise<void>;
  loadLotteryPool: () => Promise<void>;
  requestRedemption: (rewardId: string) => Promise<{ success: boolean; error?: string }>;
  cancelPendingRedemption: (id: string) => Promise<{ success: boolean; error?: string }>;
  rejectRedemption: (id: string) => Promise<{ success: boolean; error?: string }>;
  buyLotteryTicket: () => Promise<{ success: boolean; error?: string }>;
  drawLottery: () => Promise<{ success: boolean; prize?: { name: string; icon: string; type: string }; error?: string }>;
  buyShopItem: (item: Omit<InventoryItem, 'count'>, cost: number) => Promise<{ success: boolean; error?: string }>;
  synthesizeFragment: () => Promise<{ success: boolean; reward?: Reward; error?: string }>;
  clearError: () => void;
}

export const useEconomyStore = create<EconomyState>((set, get) => ({
  rewards: [],
  redemptions: [],
  transactions: [],
  inventory: [],
  lotteryPool: [],
  lotteryDrawCount: 0,
  loaded: false,
  error: null,
  async loadEconomyData() {
    try {
      const [rewards, redemptions, transactions, inventory, lotteryPool] = await Promise.all([
        getRewards(),
        getRedemptions(),
        getTransactions(),
        getInventory(),
        getLotteryPool()
      ]);
      const finalLotteryPool = lotteryPool.length > 0 ? lotteryPool : createDefaultLotteryPool();
      if (lotteryPool.length === 0) {
        await Promise.all(finalLotteryPool.map(prize => saveLotteryPrize(prize)));
      }
      set({
        rewards,
        redemptions,
        transactions,
        inventory,
        lotteryPool: finalLotteryPool,
        loaded: true,
        error: null
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载经济数据失败', loaded: true });
    }
  },
  async loadInventory() {
    try {
      const inventory = await getInventory();
      set({ inventory, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载背包失败' });
    }
  },
  async loadLotteryPool() {
    try {
      let lotteryPool = await getLotteryPool();
      if (lotteryPool.length === 0) {
        lotteryPool = createDefaultLotteryPool();
        await Promise.all(lotteryPool.map(prize => saveLotteryPrize(prize)));
      }
      set({ lotteryPool, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载奖池失败' });
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
  async buyLotteryTicket() {
    const profile = useProfileStore.getState().profile;
    if (!profile) return { success: false, error: '孩子档案未加载' };
    if (!canAfford(profile, LOTTERY_TICKET_COST)) {
      return { success: false, error: '星星不足' };
    }

    try {
      await useProfileStore.getState().applyTransaction('spend', LOTTERY_TICKET_COST, '购买抽奖券');
      const ticket = createInventoryItem(LOTTERY_TICKET_ID, '抽奖券', 'lottery_ticket', '🎟️', 1);
      const nextInventory = updateInventory(get().inventory, ticket);
      await saveInventoryItem(nextInventory.find(i => i.id === LOTTERY_TICKET_ID)!);
      set({ inventory: nextInventory, error: null });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : '购买失败';
      set({ error: message });
      return { success: false, error: message };
    }
  },
  async drawLottery() {
    const inventory = get().inventory;
    const ticketCount = getInventoryCount(inventory, LOTTERY_TICKET_ID);
    if (ticketCount <= 0) {
      return { success: false, error: '没有抽奖券' };
    }

    const lotteryPool = get().lotteryPool;
    if (lotteryPool.length === 0) {
      return { success: false, error: '奖池为空' };
    }

    try {
      const nextDrawCount = get().lotteryDrawCount + 1;
      const guaranteedFragment = nextDrawCount % 10 === 0;
      const prize = drawPrize(lotteryPool, guaranteedFragment);

      // Consume one ticket
      const ticket = inventory.find(i => i.id === LOTTERY_TICKET_ID);
      const nextInventory = ticket
        ? inventory.map(i => (i.id === LOTTERY_TICKET_ID ? { ...i, count: i.count - 1 } : i))
        : inventory;

      // Apply prize result
      let appliedInventory = nextInventory.filter(i => i.count > 0);
      if (prize.type === 'stars' && prize.amount && prize.amount > 0) {
        await useProfileStore.getState().applyTransaction('earn', prize.amount, `抽奖获得 ${prize.name}`);
      } else if (prize.type === 'fragment') {
        const fragment = createInventoryItem('fragment', '实物碎片', 'fragment', prize.icon, 1);
        appliedInventory = updateInventory(appliedInventory, fragment);
        await saveInventoryItem(appliedInventory.find(i => i.id === 'fragment')!);
      } else if (prize.type === 'virtual') {
        const virtualItem = createInventoryItem(
          `virtual-${Date.now()}`,
          prize.name,
          'effect',
          prize.icon,
          1
        );
        appliedInventory = updateInventory(appliedInventory, virtualItem);
        await saveInventoryItem(appliedInventory.find(i => i.id === virtualItem.id)!);
      } else if (prize.type === 'privilege') {
        const privilegeReward: Reward = {
          id: createRewardId(),
          name: prize.name,
          starCost: 0,
          stock: 0,
          category: 'privilege',
          description: '抽奖获得的特权奖励',
          icon: prize.icon
        };
        await useParentStore.getState().addReward(privilegeReward);
      }

      set({ inventory: appliedInventory, lotteryDrawCount: nextDrawCount, error: null });
      return {
        success: true,
        prize: { name: prize.name, icon: prize.icon, type: prize.type }
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '抽奖失败';
      set({ error: message });
      return { success: false, error: message };
    }
  },
  async buyShopItem(item, cost) {
    const profile = useProfileStore.getState().profile;
    if (!profile) return { success: false, error: '孩子档案未加载' };
    if (cost < 0) return { success: false, error: '价格无效' };
    if (cost > 0 && !canAfford(profile, cost)) {
      return { success: false, error: '星星不足' };
    }

    try {
      if (cost > 0) {
        await useProfileStore.getState().applyTransaction('spend', cost, `购买 ${item.name}`);
      }
      const newItem: InventoryItem =
        item.type === 'pet' && item.petDefId
          ? createPetInstance(item.petDefId)
          : { ...item, count: 1 };
      const nextInventory = updateInventory(get().inventory, newItem);
      await saveInventoryItem(nextInventory.find(i => i.id === newItem.id)!);
      set({ inventory: nextInventory, error: null });
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : '购买失败';
      set({ error: message });
      return { success: false, error: message };
    }
  },
  async synthesizeFragment() {
    const inventory = get().inventory;
    if (!canSynthesizeFragment(inventory)) {
      return { success: false, error: '碎片不足 5 个' };
    }

    try {
      const fragment = inventory.find(i => i.id === 'fragment')!;
      const nextFragment = { ...fragment, count: fragment.count - 5 };
      const nextInventory = inventory
        .map(i => (i.id === 'fragment' ? nextFragment : i))
        .filter(i => i.count > 0);
      await saveInventoryItem(nextFragment);

      const rewardData = synthesizeFragmentReward();
      const reward: Reward = { ...rewardData, id: createRewardId() };
      await useParentStore.getState().addReward(reward);
      set({ inventory: nextInventory, error: null });
      return { success: true, reward };
    } catch (err) {
      const message = err instanceof Error ? err.message : '合成失败';
      set({ error: message });
      return { success: false, error: message };
    }
  },
  clearError() {
    set({ error: null });
  }
}));
