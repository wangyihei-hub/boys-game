import { describe, expect, it } from 'vitest';
import {
  checkDailyMinuteLimit,
  checkDailyStarLimit,
  createEmptyDailyStats,
  getTodayKey,
  isRestMode,
  recordMinutes,
  recordStarsEarned,
  shouldShowEyeCare
} from '../src/services/usageLogic';
import type { DailyStats, ParentSettings } from '../src/types';

function makeStats(overrides: Partial<DailyStats> = {}): DailyStats {
  return {
    id: '2026-06-27',
    dateKey: '2026-06-27',
    starsEarned: 0,
    minutesPlayed: 0,
    lastActivityAt: 0,
    ...overrides
  };
}

function makeSettings(overrides: Partial<ParentSettings> = {}): ParentSettings {
  return {
    dailyStarLimit: 50,
    dailyMinuteLimit: 60,
    eyeCareIntervalMinutes: 20,
    restModeStartHour: 21,
    ...overrides
  };
}

describe('usageLogic', () => {
  it('getTodayKey returns a YYYY-MM-DD string', () => {
    const key = getTodayKey();
    expect(/^\d{4}-\d{2}-\d{2}$/.test(key)).toBe(true);
  });

  it('creates empty daily stats', () => {
    const stats = createEmptyDailyStats('2026-06-27');
    expect(stats.id).toBe('2026-06-27');
    expect(stats.dateKey).toBe('2026-06-27');
    expect(stats.starsEarned).toBe(0);
    expect(stats.minutesPlayed).toBe(0);
    expect(stats.lastActivityAt).toBe(0);
  });

  it('records earned stars and updates last activity', () => {
    const stats = makeStats();
    const next = recordStarsEarned(stats, 10, 1000);
    expect(next.starsEarned).toBe(10);
    expect(next.lastActivityAt).toBe(1000);
  });

  it('records played minutes and updates last activity', () => {
    const stats = makeStats();
    const next = recordMinutes(stats, 15, 2000);
    expect(next.minutesPlayed).toBe(15);
    expect(next.lastActivityAt).toBe(2000);
  });

  it('preserves unrelated fields when recording activity', () => {
    const stats = makeStats({ minutesPlayed: 20 });
    const next = recordStarsEarned(stats, 5, 1000);
    expect(next.minutesPlayed).toBe(20);
    expect(next.starsEarned).toBe(5);
  });

  it('calculates remaining stars before limit', () => {
    const stats = makeStats({ starsEarned: 30 });
    expect(checkDailyStarLimit(stats, 50)).toEqual({ allowed: true, remaining: 20 });
  });

  it('rejects stars when limit is reached', () => {
    const stats = makeStats({ starsEarned: 50 });
    expect(checkDailyStarLimit(stats, 50)).toEqual({ allowed: false, remaining: 0 });
  });

  it('rejects stars when limit is exceeded', () => {
    const stats = makeStats({ starsEarned: 60 });
    expect(checkDailyStarLimit(stats, 50)).toEqual({ allowed: false, remaining: 0 });
  });

  it('calculates remaining minutes before limit', () => {
    const stats = makeStats({ minutesPlayed: 45 });
    expect(checkDailyMinuteLimit(stats, 60)).toEqual({ allowed: true, remaining: 15 });
  });

  it('rejects minutes when limit is reached', () => {
    const stats = makeStats({ minutesPlayed: 60 });
    expect(checkDailyMinuteLimit(stats, 60)).toEqual({ allowed: false, remaining: 0 });
  });

  it('enters rest mode at or after start hour', () => {
    expect(isRestMode(makeSettings(), 21)).toBe(true);
    expect(isRestMode(makeSettings(), 22)).toBe(true);
    expect(isRestMode(makeSettings({ restModeStartHour: 0 }), 0)).toBe(true);
  });

  it('is not in rest mode before start hour', () => {
    expect(isRestMode(makeSettings(), 20)).toBe(false);
    expect(isRestMode(makeSettings(), 0)).toBe(false);
  });

  it('shows eye care reminder on first use', () => {
    expect(shouldShowEyeCare(undefined, 20, 0)).toBe(true);
  });

  it('shows eye care reminder when interval has passed', () => {
    const lastReminderAt = 0;
    const intervalMs = 20 * 60 * 1000;
    expect(shouldShowEyeCare(lastReminderAt, 20, intervalMs)).toBe(true);
    expect(shouldShowEyeCare(lastReminderAt, 20, intervalMs + 1)).toBe(true);
  });

  it('does not show eye care reminder before interval passes', () => {
    const lastReminderAt = 1000;
    const now = 1000 + 20 * 60 * 1000 - 1;
    expect(shouldShowEyeCare(lastReminderAt, 20, now)).toBe(false);
  });
});
