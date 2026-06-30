import { describe, it, expect } from 'vitest';
import {
  exportAllData,
  importAllData,
  EXPORT_VERSION
} from '../src/services/exportImportLogic';
import { getDB, resetDB } from '../src/db';
import {
  saveProfile,
  saveQuestions,
  saveProgress,
  saveReward,
  saveRedemption,
  saveTransaction,
  saveAchievement,
  saveParentSettings,
  saveDailyTasks,
  saveLotteryPrize,
  saveInventoryItem,
  saveWrongQuestion,
  saveDailyStats
} from '../src/db';
import type {
  Achievement,
  BattleRecord,
  DailyStats,
  DailyTask,
  InventoryItem,
  LotteryPrize,
  ParentSettings,
  Profile,
  Progress,
  Question,
  Redemption,
  Reward,
  Transaction,
  WrongQuestion
} from '../src/types';

async function seedDatabase(): Promise<void> {
  const profile: Profile = {
    id: 'default',
    nickname: '小勇士',
    level: 3,
    exp: 120,
    stars: 50,
    equippedItems: {},
    activePet: 'pet-1',
    minigameStats: {
      gomokuWins: 0,
      triviaCorrect: 0,
      memorySRankCount: 0,
      speedMathSRankCount: 0,
      wordChainCount: 0
    },
    stamina: 10,
    staminaUpdatedAt: 1_700_000_000_000,
    dailyPassCount: 0,
    dailyPassDate: '2024-01-01',
    currentLevelNumber: 1,
    createdAt: 1_700_000_000_000
  };
  await saveProfile(profile);

  const question: Question = {
    id: 'q1',
    subject: 'math',
    topic: 'fraction',
    difficulty: 2,
    type: 'choice',
    question: '1/2 + 1/4 = ?',
    options: ['1/6', '2/6', '3/4', '1'],
    answer: 2,
    explanation: '通分后相加',
    generatedAt: 1_700_000_000_000
  };
  await saveQuestions([question]);

  const progress: Progress = {
    id: 'math-001',
    subject: 'math',
    levelNumber: 1,
    status: 'passed',
    passedAt: 1_700_000_000_000
  };
  await saveProgress(progress);

  const reward: Reward = {
    id: 'reward-1',
    name: '冰淇淋',
    starCost: 10,
    stock: 5,
    category: 'food',
    description: '美味的冰淇淋',
    icon: '🍦'
  };
  await saveReward(reward);

  const redemption: Redemption = {
    id: 'redemption-1',
    rewardId: 'reward-1',
    rewardName: '冰淇淋',
    starCost: 10,
    status: 'pending',
    createdAt: 1_700_000_000_000
  };
  await saveRedemption(redemption);

  const transaction: Transaction = {
    id: 'txn-1',
    type: 'earn',
    amount: 20,
    reason: '战斗奖励',
    balanceAfter: 50,
    createdAt: 1_700_000_000_000
  };
  await saveTransaction(transaction);

  const achievement: Achievement = {
    id: 'first_win',
    title: '首胜',
    description: '赢得第一场战斗',
    icon: '🏆',
    unlockedAt: 1_700_000_000_000
  };
  await saveAchievement(achievement);

  const settings: ParentSettings = {
    dailyStarLimit: 80,
    dailyMinuteLimit: 30,
    eyeCareIntervalMinutes: 20,
    restModeStartHour: 21,
    pin: '1234'
  };
  await saveParentSettings(settings);

  const db = await getDB();

  const battleRecord: BattleRecord = {
    id: 'battle-1',
    subject: 'math',
    levelNumber: 1,
    result: 'win',
    durationMs: 60_000,
    starsEarned: 10,
    expEarned: 20,
    correctAnswers: 5,
    createdAt: 1_700_000_000_000
  };
  await db.put('battleRecords', battleRecord);

  const dailyTask: DailyTask = {
    id: 'task-1',
    title: '完成 1 场战斗',
    type: 'win_battle',
    target: 1,
    rewardStars: 5,
    completed: true,
    progress: 1,
    dateKey: '2024-01-01'
  };
  await saveDailyTasks([dailyTask]);

  const lotteryPrize: LotteryPrize = {
    id: 'prize-1',
    name: '10 星星',
    type: 'stars',
    amount: 10,
    icon: '⭐',
    probability: 0.3,
    stock: 0
  };
  await saveLotteryPrize(lotteryPrize);

  const inventoryItem: InventoryItem = {
    id: 'item-1',
    name: '木剑',
    type: 'equipment',
    icon: '🗡️',
    count: 1,
    slot: 'weapon',
    attackBonus: 5
  };
  await saveInventoryItem(inventoryItem);

  const wrongQuestion: WrongQuestion = {
    questionId: 'q1',
    wrongCount: 2,
    lastReviewAt: 1_700_000_000_000
  };
  await saveWrongQuestion(wrongQuestion);

  const dailyStats: DailyStats = {
    id: '2024-01-01',
    dateKey: '2024-01-01',
    starsEarned: 20,
    minutesPlayed: 15,
    lastActivityAt: 1_700_000_000_000
  };
  await saveDailyStats(dailyStats);
}

describe('export/import logic', () => {
  it('exportAllData returns the expected bundle shape', async () => {
    await seedDatabase();

    const data = await exportAllData();

    expect(data.version).toBe(EXPORT_VERSION);
    expect(typeof data.exportedAt).toBe('number');

    expect(data.profiles).toHaveLength(1);
    expect(data.questions).toHaveLength(1);
    expect(data.progress).toHaveLength(1);
    expect(data.rewards).toHaveLength(1);
    expect(data.redemptions).toHaveLength(1);
    expect(data.transactions).toHaveLength(1);
    expect(data.achievements).toHaveLength(1);
    expect(data.parentSettings).toHaveLength(1);
    expect(data.battleRecords).toHaveLength(1);
    expect(data.dailyTasks).toHaveLength(1);
    expect(data.lotteryPool).toHaveLength(1);
    expect(data.inventory).toHaveLength(1);
    expect(data.wrongQuestions).toHaveLength(1);
    expect(data.dailyStats).toHaveLength(1);

    expect(data.profiles[0].nickname).toBe('小勇士');
    expect(data.parentSettings[0].pin).toBe('1234');
  });

  it('importAllData restores all stores after reset', async () => {
    await seedDatabase();

    const bundle = await exportAllData();

    await resetDB();
    await importAllData(bundle);

    const db = await getDB();

    expect(await db.getAll('profiles')).toHaveLength(1);
    expect(await db.getAll('questions')).toHaveLength(1);
    expect(await db.getAll('progress')).toHaveLength(1);
    expect(await db.getAll('rewards')).toHaveLength(1);
    expect(await db.getAll('redemptions')).toHaveLength(1);
    expect(await db.getAll('transactions')).toHaveLength(1);
    expect(await db.getAll('achievements')).toHaveLength(1);
    expect(await db.getAll('parentSettings')).toHaveLength(1);
    expect(await db.getAll('battleRecords')).toHaveLength(1);
    expect(await db.getAll('dailyTasks')).toHaveLength(1);
    expect(await db.getAll('lotteryPool')).toHaveLength(1);
    expect(await db.getAll('inventory')).toHaveLength(1);
    expect(await db.getAll('wrongQuestions')).toHaveLength(1);
    expect(await db.getAll('dailyStats')).toHaveLength(1);

    const restoredProfile = await db.get('profiles', 'default');
    expect(restoredProfile?.nickname).toBe('小勇士');

    const restoredSettings = await db.get('parentSettings', 'default');
    expect(restoredSettings?.pin).toBe('1234');
  });

  it('importAllData validates the version field', async () => {
    await expect(importAllData({})).rejects.toThrow('version');
    await expect(importAllData({ version: 0 })).rejects.toThrow('version');
    await expect(importAllData({ version: '1' })).rejects.toThrow('version');
  });

  it('importAllData rejects missing store arrays', async () => {
    await expect(
      importAllData({
        version: 1,
        profiles: []
      })
    ).rejects.toThrow('questions');
  });
});
