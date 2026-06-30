import { describe, it, expect } from 'vitest';
import {
  refreshStamina,
  canEnterLevel,
  consumeStamina,
  markDailyPass,
  advanceCurrentLevel,
  getStaminaRecoveryText,
  MAX_STAMINA,
  STAMINA_REGEN_MS,
  DAILY_PASS_LIMIT
} from '../src/services/staminaLogic';
import { getTodayKey } from '../src/services/usageLogic';
import type { Profile } from '../src/types';

function createProfile(overrides: Partial<Profile> = {}): Profile {
  const today = getTodayKey();
  return {
    id: 'default',
    nickname: '小勇士',
    level: 1,
    exp: 0,
    stars: 0,
    equippedItems: {},
    minigameStats: {
      gomokuWins: 0,
      triviaCorrect: 0,
      memorySRankCount: 0,
      speedMathSRankCount: 0,
      wordChainCount: 0
    },
    stamina: MAX_STAMINA,
    staminaUpdatedAt: 0,
    dailyPassCount: 0,
    dailyPassDate: today,
    currentLevelNumber: 1,
    createdAt: 0,
    ...overrides
  };
}

describe('staminaLogic', () => {
  it('does not change stamina before a full minute passes', () => {
    const profile = createProfile({ stamina: 5, staminaUpdatedAt: 0 });
    const next = refreshStamina(profile, STAMINA_REGEN_MS - 1);
    expect(next.stamina).toBe(5);
    expect(next.staminaUpdatedAt).toBe(0);
  });

  it('recovers one stamina per minute', () => {
    const profile = createProfile({ stamina: 5, staminaUpdatedAt: 0 });
    const next = refreshStamina(profile, STAMINA_REGEN_MS * 3);
    expect(next.stamina).toBe(8);
    expect(next.staminaUpdatedAt).toBe(STAMINA_REGEN_MS * 3);
  });

  it('caps stamina at MAX_STAMINA', () => {
    const profile = createProfile({ stamina: 9, staminaUpdatedAt: 0 });
    const next = refreshStamina(profile, STAMINA_REGEN_MS * 5);
    expect(next.stamina).toBe(MAX_STAMINA);
  });

  it('allows entering a level with enough stamina', () => {
    const profile = createProfile({ stamina: 5 });
    const result = canEnterLevel(profile, Date.now());
    expect(result.ok).toBe(true);
    expect(result.stamina).toBe(5);
  });

  it('refuses entry when stamina is empty', () => {
    const profile = createProfile({ stamina: 0 });
    const result = canEnterLevel(profile, Date.now());
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('stamina');
  });

  it('refuses entry when daily pass limit is reached', () => {
    const profile = createProfile({ stamina: 5, dailyPassCount: DAILY_PASS_LIMIT });
    const result = canEnterLevel(profile, Date.now());
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('daily_limit');
  });

  it('resets daily pass count for a new date', () => {
    const profile = createProfile({ dailyPassCount: DAILY_PASS_LIMIT, dailyPassDate: '2023-12-31' });
    const result = canEnterLevel(profile, Date.now());
    expect(result.ok).toBe(true);
  });

  it('consumes one stamina and updates refresh timestamp', () => {
    const now = 1_000_000;
    const profile = createProfile({ stamina: 5, staminaUpdatedAt: 0 });
    const next = consumeStamina(profile, now);
    expect(next.stamina).toBe(4);
    expect(next.staminaUpdatedAt).toBe(now);
  });

  it('marks first daily pass on a new date', () => {
    const profile = createProfile({ dailyPassCount: 5, dailyPassDate: '2023-12-31' });
    const next = markDailyPass(profile, '2024-01-01');
    expect(next.dailyPassCount).toBe(1);
    expect(next.dailyPassDate).toBe('2024-01-01');
  });

  it('increments daily pass count on the same date', () => {
    const today = getTodayKey();
    const profile = createProfile({ dailyPassCount: 3, dailyPassDate: today });
    const next = markDailyPass(profile, today);
    expect(next.dailyPassCount).toBe(4);
  });

  it('caps daily pass count at the limit', () => {
    const today = getTodayKey();
    const profile = createProfile({ dailyPassCount: DAILY_PASS_LIMIT, dailyPassDate: today });
    const next = markDailyPass(profile, today);
    expect(next.dailyPassCount).toBe(DAILY_PASS_LIMIT);
  });

  it('advances current unified level up to 100', () => {
    const profile = createProfile({ currentLevelNumber: 1 });
    expect(advanceCurrentLevel(profile).currentLevelNumber).toBe(2);

    const maxed = createProfile({ currentLevelNumber: 100 });
    expect(advanceCurrentLevel(maxed).currentLevelNumber).toBe(100);
  });

  it('formats recovery text for full and partial stamina', () => {
    expect(getStaminaRecoveryText(MAX_STAMINA)).toBe('体力已满');
    expect(getStaminaRecoveryText(8)).toBe('2 分钟后回满');
    expect(getStaminaRecoveryText(0)).toBe('10 分钟后回满');
  });
});
