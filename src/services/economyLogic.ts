import type { Profile, Redemption, Reward, Transaction, TransactionType } from '../types';

export const REWARD_CATEGORIES = ['food', 'privilege', 'learning', 'mystery'] as const;

export const REWARD_CATEGORY_LABELS: Record<(typeof REWARD_CATEGORIES)[number], string> = {
  food: '美食',
  privilege: '特权',
  learning: '学习',
  mystery: '惊喜'
};

export const DEFAULT_REWARDS: Omit<Reward, 'id'>[] = [
  { name: '肯德基一次', starCost: 80, stock: 0, category: 'food', description: '周末去吃一次肯德基', icon: '🍗' },
  { name: '麦当劳一次', starCost: 80, stock: 0, category: 'food', description: '周末去吃一次麦当劳', icon: '🍔' },
  { name: '必胜客一次', starCost: 120, stock: 0, category: 'food', description: '周末去吃一次必胜客', icon: '🍕' },
  { name: '晚睡 30 分钟券', starCost: 50, stock: 0, category: 'privilege', description: '今晚可以晚睡 30 分钟', icon: '🌙' },
  { name: '电影选择权', starCost: 60, stock: 0, category: 'privilege', description: '下次家庭电影由你选', icon: '🎬' },
  { name: '免家务券', starCost: 40, stock: 0, category: 'privilege', description: '免做一次家务', icon: '🧹' },
  { name: '周末出游', starCost: 150, stock: 0, category: 'learning', description: '安排一次周末出游', icon: '🏞️' }
];

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createRewardId(): string {
  return generateId();
}

export function createRedemptionId(): string {
  return generateId();
}

export function createTransactionId(): string {
  return generateId();
}

export function canAfford(profile: Profile, cost: number): boolean {
  return profile.stars >= cost && cost > 0;
}

export function isRewardAvailable(reward: Reward): boolean {
  return reward.stock === 0 || reward.stock > 0;
}

export function createRedemption(reward: Reward): Redemption {
  return {
    id: createRedemptionId(),
    rewardId: reward.id,
    rewardName: reward.name,
    starCost: reward.starCost,
    status: 'pending',
    createdAt: Date.now()
  };
}

export function createTransaction(
  type: TransactionType,
  amount: number,
  reason: string,
  currentStars: number
): Transaction {
  const delta = type === 'spend' ? -amount : amount;
  return {
    id: createTransactionId(),
    type,
    amount,
    reason,
    balanceAfter: Math.max(0, currentStars + delta),
    createdAt: Date.now()
  };
}

export function computeNextBalance(type: TransactionType, amount: number, currentStars: number): number {
  const delta = type === 'spend' ? -amount : amount;
  return Math.max(0, currentStars + delta);
}

export function validateRewardFields(reward: Partial<Reward>): { valid: boolean; error?: string } {
  if (!reward.name || reward.name.trim().length === 0) {
    return { valid: false, error: '奖励名称不能为空' };
  }
  if (typeof reward.starCost !== 'number' || reward.starCost < 1) {
    return { valid: false, error: '星星价格至少为 1' };
  }
  if (typeof reward.stock !== 'number' || reward.stock < 0) {
    return { valid: false, error: '库存不能为负数（0 表示不限）' };
  }
  if (!reward.category || !REWARD_CATEGORIES.includes(reward.category as (typeof REWARD_CATEGORIES)[number])) {
    return { valid: false, error: '请选择有效分类' };
  }
  return { valid: true };
}
