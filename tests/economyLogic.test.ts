import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REWARDS,
  REWARD_CATEGORIES,
  REWARD_CATEGORY_LABELS,
  canAfford,
  computeNextBalance,
  createRedemption,
  createTransaction,
  validateRewardFields
} from '../src/services/economyLogic';
import type { Profile, Reward } from '../src/types';

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'default',
    nickname: '小勇士',
    level: 1,
    exp: 0,
    stars: 50,
    equippedItems: {},
    stamina: 10,
    staminaUpdatedAt: 0,
    dailyPassCount: 0,
    dailyPassDate: '2024-01-01',
    currentLevelNumber: 1,
    createdAt: 0,
    ...overrides
  };
}

function makeReward(overrides: Partial<Reward> = {}): Reward {
  return {
    id: 'r1',
    name: 'Test Reward',
    starCost: 30,
    stock: 5,
    category: 'food',
    description: 'Test',
    icon: '🎁',
    ...overrides
  };
}

describe('economyLogic', () => {
  it('provides default reward templates', () => {
    expect(DEFAULT_REWARDS).toHaveLength(7);
    expect(DEFAULT_REWARDS.some(r => r.name === '肯德基一次')).toBe(true);
    expect(DEFAULT_REWARDS.some(r => r.name === '周末出游')).toBe(true);
  });

  it('labels all reward categories', () => {
    for (const category of REWARD_CATEGORIES) {
      expect(REWARD_CATEGORY_LABELS[category]).toBeDefined();
    }
  });

  it('validates reward fields', () => {
    expect(validateRewardFields(makeReward()).valid).toBe(true);
    expect(validateRewardFields({ ...makeReward(), name: '' }).valid).toBe(false);
    expect(validateRewardFields({ ...makeReward(), starCost: 0 }).valid).toBe(false);
    expect(validateRewardFields({ ...makeReward(), stock: -1 }).valid).toBe(false);
    expect(validateRewardFields({ ...makeReward(), category: 'invalid' as 'food' }).valid).toBe(false);
  });

  it('checks affordability', () => {
    const profile = makeProfile({ stars: 30 });
    expect(canAfford(profile, 20)).toBe(true);
    expect(canAfford(profile, 30)).toBe(true);
    expect(canAfford(profile, 31)).toBe(false);
    expect(canAfford(profile, 0)).toBe(false);
  });

  it('creates redemption snapshots', () => {
    const reward = makeReward({ name: 'Special', starCost: 40 });
    const redemption = createRedemption(reward);
    expect(redemption.rewardId).toBe(reward.id);
    expect(redemption.rewardName).toBe('Special');
    expect(redemption.starCost).toBe(40);
    expect(redemption.status).toBe('pending');
    expect(redemption.createdAt).toBeGreaterThan(0);
  });

  it('creates earn transactions', () => {
    const tx = createTransaction('earn', 10, '战斗奖励', 50);
    expect(tx.type).toBe('earn');
    expect(tx.amount).toBe(10);
    expect(tx.balanceAfter).toBe(60);
    expect(tx.reason).toBe('战斗奖励');
  });

  it('creates spend transactions', () => {
    const tx = createTransaction('spend', 20, '兑换奖励', 50);
    expect(tx.type).toBe('spend');
    expect(tx.balanceAfter).toBe(30);
  });

  it('creates refund transactions', () => {
    const tx = createTransaction('refund', 15, '退还', 25);
    expect(tx.type).toBe('refund');
    expect(tx.balanceAfter).toBe(40);
  });

  it('never lets balance go negative', () => {
    expect(computeNextBalance('spend', 100, 20)).toBe(0);
  });
});
