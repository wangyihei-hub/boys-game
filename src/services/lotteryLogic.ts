import type { InventoryItem, LotteryPrize } from '../types';

export const DEFAULT_LOTTERY_PRIZES: Omit<LotteryPrize, 'id'>[] = [
  { name: '小星星 5', type: 'stars', amount: 5, icon: '⭐', probability: 0.25, stock: 0 },
  { name: '小星星 10', type: 'stars', amount: 10, icon: '⭐', probability: 0.15, stock: 0 },
  { name: '小星星 20', type: 'stars', amount: 20, icon: '⭐', probability: 0.05, stock: 0 },
  { name: '实物碎片', type: 'fragment', icon: '🧩', probability: 0.1, stock: 0 },
  { name: '特权卡', type: 'privilege', icon: '🎫', probability: 0.05, stock: 0 },
  { name: '虚拟道具', type: 'virtual', icon: '🎀', probability: 0.15, stock: 0 },
  { name: '谢谢参与', type: 'stars', amount: 0, icon: '😅', probability: 0.25, stock: 0 }
];

export function normalizeProbabilities(prizes: LotteryPrize[]): LotteryPrize[] {
  const total = prizes.reduce((sum, p) => sum + p.probability, 0);
  if (total <= 0) return prizes.map(p => ({ ...p, probability: 1 / prizes.length }));
  return prizes.map(p => ({ ...p, probability: p.probability / total }));
}

export function drawPrize(prizes: LotteryPrize[], guaranteedFragment: boolean): LotteryPrize {
  const normalized = normalizeProbabilities(prizes);

  if (guaranteedFragment) {
    const fragment = normalized.find(p => p.type === 'fragment');
    if (fragment) return fragment;
  }

  const random = Math.random();
  let cumulative = 0;
  for (const prize of normalized) {
    cumulative += prize.probability;
    if (random <= cumulative) return prize;
  }
  return normalized[normalized.length - 1];
}

export function createLotteryPrizeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `prize-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultLotteryPool(): LotteryPrize[] {
  return DEFAULT_LOTTERY_PRIZES.map(prize => ({ ...prize, id: createLotteryPrizeId() }));
}

export function getInventoryCount(inventory: InventoryItem[], id: string): number {
  return inventory.find(item => item.id === id)?.count ?? 0;
}

export function updateInventory(inventory: InventoryItem[], item: InventoryItem): InventoryItem[] {
  const exists = inventory.find(i => i.id === item.id);
  if (exists) {
    return inventory.map(i => (i.id === item.id ? { ...i, count: i.count + item.count } : i));
  }
  return [...inventory, item];
}

export function createInventoryItem(
  id: string,
  name: string,
  type: InventoryItem['type'],
  icon: string,
  count: number
): InventoryItem {
  return { id, name, type, icon, count };
}

export function canSynthesizeFragment(inventory: InventoryItem[]): boolean {
  return getInventoryCount(inventory, 'fragment') >= 5;
}

export function synthesizeFragmentReward(): { name: string; starCost: number; stock: number; category: 'food' | 'privilege' | 'learning' | 'mystery'; description: string; icon: string } {
  return {
    name: '餐饮兑换券',
    starCost: 0,
    stock: 0,
    category: 'food',
    description: '5 个碎片合成的餐饮兑换券，可在奖励池中使用',
    icon: '🍽️'
  };
}
