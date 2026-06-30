import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENT_DEFINITIONS,
  checkAchievements,
  checkLevelAchievements,
  checkStarAchievement,
  createInitialAchievements
} from '../src/services/achievementLogic';
import type { Achievement, AchievementId, BattleRecord, Progress } from '../src/types';

function makeAchievements(overrides: Partial<Record<AchievementId, number>> = {}): Achievement[] {
  return createInitialAchievements().map(a =>
    overrides[a.id] ? { ...a, unlockedAt: overrides[a.id] } : a
  );
}

function makeRecord(overrides: Partial<BattleRecord> = {}): BattleRecord {
  return {
    id: 'r1',
    subject: 'math',
    levelNumber: 1,
    result: 'win',
    durationMs: 1000,
    starsEarned: 5,
    expEarned: 10,
    correctAnswers: 1,
    createdAt: Date.now(),
    ...overrides
  };
}

function makeProgress(subject: Progress['subject'], levelNumber: number = 1, status: Progress['status'] = 'passed'): Progress {
  return {
    id: `${subject}-${String(levelNumber).padStart(3, '0')}`,
    subject,
    levelNumber,
    status
  };
}

describe('achievementLogic', () => {
  it('creates initial achievements from definitions', () => {
    const achievements = createInitialAchievements();
    expect(achievements).toHaveLength(ACHIEVEMENT_DEFINITIONS.length);
    expect(achievements.every(a => a.unlockedAt === undefined)).toBe(true);
  });

  it('unlocks first_win when a battle is won', () => {
    const current = makeAchievements();
    const records = [makeRecord({ result: 'win' })];
    const { newlyUnlocked } = checkAchievements(current, {
      level: 1,
      totalStarsEarned: 0,
      records,
      progress: []
    });
    expect(newlyUnlocked).toContain('first_win');
  });

  it('unlocks first_boss only for boss wins', () => {
    const current = makeAchievements();
    const records = [makeRecord({ result: 'win', levelNumber: 5, subject: 'math' })];
    const { newlyUnlocked } = checkAchievements(current, {
      level: 1,
      totalStarsEarned: 0,
      records,
      progress: []
    });
    expect(newlyUnlocked).toContain('first_boss');
  });

  it('does not unlock first_win for losses', () => {
    const current = makeAchievements();
    const records = [makeRecord({ result: 'lose' })];
    const { newlyUnlocked } = checkAchievements(current, {
      level: 1,
      totalStarsEarned: 0,
      records,
      progress: []
    });
    expect(newlyUnlocked).not.toContain('first_win');
  });

  it('unlocks reach_level achievements at correct thresholds', () => {
    const current = makeAchievements();
    expect(checkLevelAchievements(current, 4)).toEqual([]);
    expect(checkLevelAchievements(current, 5)).toContain('reach_level_5');
    expect(checkLevelAchievements(current, 10)).toContain('reach_level_10');
  });

  it('unlocks collect_100_stars at 100 earned stars', () => {
    const current = makeAchievements();
    expect(checkStarAchievement(current, 99)).toEqual([]);
    expect(checkStarAchievement(current, 100)).toContain('collect_100_stars');
    expect(checkStarAchievement(current, 150)).toContain('collect_100_stars');
  });

  it('unlocks win_streak_5 after 5 consecutive wins', () => {
    const current = makeAchievements();
    const records = [
      makeRecord({ result: 'win', createdAt: 1000 }),
      makeRecord({ result: 'win', createdAt: 2000 }),
      makeRecord({ result: 'lose', createdAt: 3000 }),
      makeRecord({ result: 'win', createdAt: 4000 }),
      makeRecord({ result: 'win', createdAt: 5000 }),
      makeRecord({ result: 'win', createdAt: 6000 }),
      makeRecord({ result: 'win', createdAt: 7000 }),
      makeRecord({ result: 'win', createdAt: 8000 })
    ];
    const { newlyUnlocked } = checkAchievements(current, {
      level: 1,
      totalStarsEarned: 0,
      records,
      progress: []
    });
    expect(newlyUnlocked).toContain('win_streak_5');
  });

  it('unlocks all_subject_passed when all subjects have passed progress', () => {
    const current = makeAchievements();
    const progress = [
      makeProgress('chinese'),
      makeProgress('math'),
      makeProgress('english')
    ];
    const { newlyUnlocked } = checkAchievements(current, {
      level: 1,
      totalStarsEarned: 0,
      records: [],
      progress
    });
    expect(newlyUnlocked).toContain('all_subject_passed');
  });

  it('does not re-unlock already unlocked achievements', () => {
    const current = makeAchievements({ first_win: Date.now() });
    const records = [makeRecord({ result: 'win' })];
    const { newlyUnlocked } = checkAchievements(current, {
      level: 1,
      totalStarsEarned: 0,
      records,
      progress: []
    });
    expect(newlyUnlocked).not.toContain('first_win');
  });

  it('sets unlockedAt on newly unlocked achievements', () => {
    const current = makeAchievements();
    const { next } = checkAchievements(current, {
      level: 10,
      totalStarsEarned: 100,
      records: [makeRecord({ result: 'win' })],
      progress: []
    });
    const unlocked = next.filter(a => a.unlockedAt !== undefined);
    expect(unlocked.length).toBeGreaterThan(0);
    expect(unlocked.every(a => (a.unlockedAt ?? 0) > 0)).toBe(true);
  });
});
