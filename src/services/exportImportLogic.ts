import { getDB } from '../db';
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
} from '../types';

export const EXPORT_VERSION = 5;

export interface ExportBundle {
  version: number;
  exportedAt: number;
  profiles: Profile[];
  questions: Question[];
  progress: Progress[];
  rewards: Reward[];
  redemptions: Redemption[];
  transactions: Transaction[];
  achievements: Achievement[];
  parentSettings: (ParentSettings & { id: string })[];
  battleRecords: BattleRecord[];
  dailyTasks: DailyTask[];
  lotteryPool: LotteryPrize[];
  inventory: InventoryItem[];
  wrongQuestions: WrongQuestion[];
  dailyStats: DailyStats[];
}

type StoreKey = keyof Omit<ExportBundle, 'version' | 'exportedAt'>;

const STORE_KEYS: StoreKey[] = [
  'profiles',
  'questions',
  'progress',
  'rewards',
  'redemptions',
  'transactions',
  'achievements',
  'parentSettings',
  'battleRecords',
  'dailyTasks',
  'lotteryPool',
  'inventory',
  'wrongQuestions',
  'dailyStats'
];

export async function exportAllData(): Promise<ExportBundle> {
  const db = await getDB();

  const [
    profiles,
    questions,
    progress,
    rewards,
    redemptions,
    transactions,
    achievements,
    parentSettings,
    battleRecords,
    dailyTasks,
    lotteryPool,
    inventory,
    wrongQuestions,
    dailyStats
  ] = await Promise.all([
    db.getAll('profiles'),
    db.getAll('questions'),
    db.getAll('progress'),
    db.getAll('rewards'),
    db.getAll('redemptions'),
    db.getAll('transactions'),
    db.getAll('achievements'),
    db.getAll('parentSettings'),
    db.getAll('battleRecords'),
    db.getAll('dailyTasks'),
    db.getAll('lotteryPool'),
    db.getAll('inventory'),
    db.getAll('wrongQuestions'),
    db.getAll('dailyStats')
  ]);

  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    profiles,
    questions,
    progress,
    rewards,
    redemptions,
    transactions,
    achievements,
    parentSettings,
    battleRecords,
    dailyTasks,
    lotteryPool,
    inventory,
    wrongQuestions,
    dailyStats
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertArray(value: unknown, name: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`导入数据无效：${name} 必须是数组`);
  }
  return value;
}

export async function importAllData(data: unknown): Promise<void> {
  if (!isObject(data)) {
    throw new Error('导入数据无效：必须是一个对象');
  }

  const version = data.version;
  if (typeof version !== 'number' || version < 1) {
    throw new Error('导入数据无效：version 必须是大于等于 1 的数字');
  }

  const bundle: Partial<ExportBundle> = {};
  for (const key of STORE_KEYS) {
    const value = data[key];
    if (value === undefined) {
      throw new Error(`导入数据无效：缺少 ${key} 数组`);
    }
    (bundle as Record<string, unknown[]>)[key] = assertArray(value, key);
  }

  const db = await getDB();

  await db.clear('profiles');
  for (const item of bundle.profiles!) {
    await db.put('profiles', item as Profile);
  }

  await db.clear('questions');
  for (const item of bundle.questions!) {
    await db.put('questions', item as Question);
  }

  await db.clear('progress');
  for (const item of bundle.progress!) {
    await db.put('progress', item as Progress);
  }

  await db.clear('rewards');
  for (const item of bundle.rewards!) {
    await db.put('rewards', item as Reward);
  }

  await db.clear('redemptions');
  for (const item of bundle.redemptions!) {
    await db.put('redemptions', item as Redemption);
  }

  await db.clear('transactions');
  for (const item of bundle.transactions!) {
    await db.put('transactions', item as Transaction);
  }

  await db.clear('achievements');
  for (const item of bundle.achievements!) {
    await db.put('achievements', item as Achievement);
  }

  await db.clear('parentSettings');
  for (const item of bundle.parentSettings!) {
    await db.put('parentSettings', item as ParentSettings & { id: string });
  }

  await db.clear('battleRecords');
  for (const item of bundle.battleRecords!) {
    await db.put('battleRecords', item as BattleRecord);
  }

  await db.clear('dailyTasks');
  for (const item of bundle.dailyTasks!) {
    await db.put('dailyTasks', item as DailyTask);
  }

  await db.clear('lotteryPool');
  for (const item of bundle.lotteryPool!) {
    await db.put('lotteryPool', item as LotteryPrize);
  }

  await db.clear('inventory');
  for (const item of bundle.inventory!) {
    await db.put('inventory', item as InventoryItem);
  }

  await db.clear('wrongQuestions');
  for (const item of bundle.wrongQuestions!) {
    await db.put('wrongQuestions', item as WrongQuestion);
  }

  await db.clear('dailyStats');
  for (const item of bundle.dailyStats!) {
    await db.put('dailyStats', item as DailyStats);
  }
}

export function downloadJson(data: object, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
