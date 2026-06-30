import type { Profile } from '../types';
import { getTodayKey } from './usageLogic';

export const MAX_STAMINA = 10;
export const STAMINA_REGEN_MS = 60 * 1000; // 1 分钟恢复 1 点
export const STAMINA_PER_ATTEMPT = 1;
export const DAILY_PASS_LIMIT = 10;

export function refreshStamina(profile: Profile, now = Date.now()): Profile {
  const elapsedMs = now - profile.staminaUpdatedAt;
  if (elapsedMs <= 0) return profile;

  const recovered = Math.floor(elapsedMs / STAMINA_REGEN_MS);
  if (recovered <= 0) return profile;

  const nextStamina = Math.min(MAX_STAMINA, profile.stamina + recovered);
  if (nextStamina === profile.stamina) return profile;

  return {
    ...profile,
    stamina: nextStamina,
    staminaUpdatedAt: profile.staminaUpdatedAt + recovered * STAMINA_REGEN_MS
  };
}

export function canEnterLevel(profile: Profile, _now = Date.now()): {
  ok: boolean;
  reason?: 'stamina' | 'daily_limit';
  stamina: number;
} {
  if (profile.stamina < STAMINA_PER_ATTEMPT) {
    return { ok: false, reason: 'stamina', stamina: profile.stamina };
  }
  if (profile.dailyPassDate !== getTodayKey()) {
    return { ok: true, stamina: profile.stamina };
  }
  if (profile.dailyPassCount >= DAILY_PASS_LIMIT) {
    return { ok: false, reason: 'daily_limit', stamina: profile.stamina };
  }
  return { ok: true, stamina: profile.stamina };
}

export function consumeStamina(profile: Profile, now = Date.now()): Profile {
  return {
    ...profile,
    stamina: Math.max(0, profile.stamina - STAMINA_PER_ATTEMPT),
    staminaUpdatedAt: now
  };
}

export function markDailyPass(profile: Profile, dateKey = getTodayKey()): Profile {
  if (profile.dailyPassDate !== dateKey) {
    return {
      ...profile,
      dailyPassCount: 1,
      dailyPassDate: dateKey
    };
  }
  return {
    ...profile,
    dailyPassCount: Math.min(DAILY_PASS_LIMIT, profile.dailyPassCount + 1)
  };
}

export function advanceCurrentLevel(profile: Profile): Profile {
  return {
    ...profile,
    currentLevelNumber: Math.min(100, profile.currentLevelNumber + 1)
  };
}

export function getStaminaRecoveryText(stamina: number): string {
  if (stamina >= MAX_STAMINA) return '体力已满';
  const missing = MAX_STAMINA - stamina;
  const minutes = missing;
  if (minutes < 60) return `${minutes} 分钟后回满`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hours} 小时 ${rem} 分钟后回满` : `${hours} 小时后回满`;
}
