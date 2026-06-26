import type { DailyStats, ParentSettings } from '../types';

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function createEmptyDailyStats(dateKey: string): DailyStats {
  return {
    id: dateKey,
    dateKey,
    starsEarned: 0,
    minutesPlayed: 0,
    lastActivityAt: 0
  };
}

export function recordStarsEarned(
  stats: DailyStats,
  amount: number,
  now: number
): DailyStats {
  return {
    ...stats,
    starsEarned: stats.starsEarned + amount,
    lastActivityAt: now
  };
}

export function recordMinutes(
  stats: DailyStats,
  minutes: number,
  now: number
): DailyStats {
  return {
    ...stats,
    minutesPlayed: stats.minutesPlayed + minutes,
    lastActivityAt: now
  };
}

export function checkDailyStarLimit(
  stats: DailyStats,
  limit: number
): { allowed: boolean; remaining: number } {
  const remaining = Math.max(0, limit - stats.starsEarned);
  return {
    allowed: stats.starsEarned < limit,
    remaining
  };
}

export function checkDailyMinuteLimit(
  stats: DailyStats,
  limit: number
): { allowed: boolean; remaining: number } {
  const remaining = Math.max(0, limit - stats.minutesPlayed);
  return {
    allowed: stats.minutesPlayed < limit,
    remaining
  };
}

export function isRestMode(
  settings: Pick<ParentSettings, 'restModeStartHour'>,
  currentHour: number
): boolean {
  return currentHour >= settings.restModeStartHour;
}

export function shouldShowEyeCare(
  lastReminderAt: number | undefined,
  intervalMinutes: number,
  now: number
): boolean {
  if (lastReminderAt === undefined) return true;
  return now - lastReminderAt >= intervalMinutes * 60 * 1000;
}
