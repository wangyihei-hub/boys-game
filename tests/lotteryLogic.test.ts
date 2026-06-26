import { describe, expect, it } from 'vitest';
import {
  canSynthesizeFragment,
  createDefaultLotteryPool,
  createInventoryItem,
  createLotteryPrizeId,
  drawPrize,
  getInventoryCount,
  normalizeProbabilities,
  synthesizeFragmentReward,
  updateInventory
} from '../src/services/lotteryLogic';
import type { InventoryItem, LotteryPrize } from '../src/types';

function makePrize(overrides: Partial<LotteryPrize> = {}): LotteryPrize {
  return {
    id: createLotteryPrizeId(),
    name: 'Test Prize',
    type: 'stars',
    amount: 5,
    icon: '⭐',
    probability: 0.25,
    stock: 0,
    ...overrides
  };
}

describe('lotteryLogic', () => {
  it('creates a default lottery pool', () => {
    const pool = createDefaultLotteryPool();
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every(p => p.id && p.name && p.probability >= 0)).toBe(true);
  });

  it('normalizes probabilities to sum to 1', () => {
    const prizes = [
      makePrize({ probability: 0.5 }),
      makePrize({ probability: 0.5 }),
      makePrize({ probability: 0.5 })
    ];
    const normalized = normalizeProbabilities(prizes);
    const total = normalized.reduce((sum, p) => sum + p.probability, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it('fallbacks to equal probabilities when total is zero', () => {
    const prizes = [
      makePrize({ probability: 0 }),
      makePrize({ probability: 0 })
    ];
    const normalized = normalizeProbabilities(prizes);
    expect(normalized[0].probability).toBe(0.5);
    expect(normalized[1].probability).toBe(0.5);
  });

  it('draws a prize from the pool', () => {
    const prizes = createDefaultLotteryPool();
    const prize = drawPrize(prizes, false);
    expect(prizes.some(p => p.id === prize.id)).toBe(true);
  });

  it('guarantees fragment when requested', () => {
    const prizes = createDefaultLotteryPool();
    const prize = drawPrize(prizes, true);
    expect(prize.type).toBe('fragment');
  });

  it('tracks inventory count', () => {
    const inventory: InventoryItem[] = [
      createInventoryItem('lottery_ticket', '抽奖券', 'lottery_ticket', '🎟️', 3)
    ];
    expect(getInventoryCount(inventory, 'lottery_ticket')).toBe(3);
    expect(getInventoryCount(inventory, 'fragment')).toBe(0);
  });

  it('updates existing inventory items', () => {
    const ticket = createInventoryItem('lottery_ticket', '抽奖券', 'lottery_ticket', '🎟️', 1);
    const inventory = updateInventory([ticket], { ...ticket, count: 2 });
    expect(inventory).toHaveLength(1);
    expect(inventory[0].count).toBe(3);
  });

  it('adds new inventory items', () => {
    const ticket = createInventoryItem('lottery_ticket', '抽奖券', 'lottery_ticket', '🎟️', 1);
    const inventory = updateInventory([], ticket);
    expect(inventory).toHaveLength(1);
    expect(inventory[0].count).toBe(1);
  });

  it('checks fragment synthesis requirement', () => {
    const enough = [createInventoryItem('fragment', '实物碎片', 'fragment', '🧩', 5)];
    const notEnough = [createInventoryItem('fragment', '实物碎片', 'fragment', '🧩', 4)];
    expect(canSynthesizeFragment(enough)).toBe(true);
    expect(canSynthesizeFragment(notEnough)).toBe(false);
    expect(canSynthesizeFragment([])).toBe(false);
  });

  it('creates a fragment synthesis reward', () => {
    const reward = synthesizeFragmentReward();
    expect(reward.name).toBe('餐饮兑换券');
    expect(reward.category).toBe('food');
    expect(reward.starCost).toBe(0);
    expect(reward.stock).toBe(0);
  });

  it('generates unique lottery prize ids', () => {
    const id1 = createLotteryPrizeId();
    const id2 = createLotteryPrizeId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
  });
});
