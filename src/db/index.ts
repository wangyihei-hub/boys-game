import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  Achievement,
  BattleRecord,
  DailyTask,
  InventoryItem,
  LotteryPrize,
  ParentSettings,
  Profile,
  Progress,
  Question,
  Redemption,
  Reward,
  Subject,
  Transaction,
  WrongQuestion
} from '../types';

const DB_NAME = 'boys-game-db';
const DB_VERSION = 4;

interface GameDB extends DBSchema {
  profiles: { key: string; value: Profile };
  questions: { key: string; value: Question; indexes: { 'by-subject-topic': [string, string] } };
  wrongQuestions: { key: string; value: WrongQuestion };
  rewards: { key: string; value: Reward };
  redemptions: { key: string; value: Redemption; indexes: { 'by-status': string } };
  transactions: { key: string; value: Transaction };
  achievements: { key: string; value: Achievement };
  parentSettings: { key: string; value: ParentSettings & { id: string } };
  progress: { key: string; value: Progress; indexes: { 'by-subject': Subject } };
  battleRecords: { key: string; value: BattleRecord; indexes: { 'by-subject-stage': [Subject, string] } };
  dailyTasks: { key: string; value: DailyTask };
  lotteryPool: { key: string; value: LotteryPrize };
  inventory: { key: string; value: InventoryItem };
}

let dbPromise: Promise<IDBPDatabase<GameDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GameDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Schema migrations: add versioned branches as the DB evolves.
        if (oldVersion < 1) {
          db.createObjectStore('profiles', { keyPath: 'id' });
          const questionStore = db.createObjectStore('questions', { keyPath: 'id' });
          questionStore.createIndex('by-subject-topic', ['subject', 'topic']);
          db.createObjectStore('wrongQuestions', { keyPath: 'questionId' });
          db.createObjectStore('rewards', { keyPath: 'id' });
          const redemptionStore = db.createObjectStore('redemptions', { keyPath: 'id' });
          redemptionStore.createIndex('by-status', 'status');
          db.createObjectStore('achievements', { keyPath: 'id' });
          db.createObjectStore('parentSettings', { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
          progressStore.createIndex('by-subject', 'subject');
          const battleRecordStore = db.createObjectStore('battleRecords', { keyPath: 'id' });
          battleRecordStore.createIndex('by-subject-stage', ['subject', 'stageId']);
        }
        if (oldVersion < 3) {
          db.createObjectStore('transactions', { keyPath: 'id' });
        }
        if (oldVersion < 4) {
          db.createObjectStore('dailyTasks', { keyPath: 'id' });
          db.createObjectStore('lotteryPool', { keyPath: 'id' });
          db.createObjectStore('inventory', { keyPath: 'id' });
        }
      }
    }).catch(err => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function resetDB(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
    } catch {
      // Connection failed; safe to proceed with deletion.
    }
    dbPromise = null;
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Database reset blocked'));
  });
}

export async function getProfile(id = 'default'): Promise<Profile | undefined> {
  const db = await getDB();
  return db.get('profiles', id);
}

export async function saveProfile(profile: Profile): Promise<void> {
  const db = await getDB();
  await db.put('profiles', profile);
}

export async function getQuestions(): Promise<Question[]> {
  const db = await getDB();
  return db.getAll('questions');
}

export async function saveQuestions(questions: Question[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('questions', 'readwrite');
  for (const q of questions) {
    await tx.store.put(q);
  }
  await tx.done;
}

export async function deleteQuestions(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('questions', 'readwrite');
  for (const id of ids) {
    await tx.store.delete(id);
  }
  await tx.done;
}

export async function getQuestionsBySubject(subject: Subject): Promise<Question[]> {
  const db = await getDB();
  const range = IDBKeyRange.bound([subject, ''], [subject, '\uffff']);
  return db.getAllFromIndex('questions', 'by-subject-topic', range);
}

export async function countQuestions(): Promise<number> {
  const db = await getDB();
  return db.count('questions');
}

export async function getRewards(): Promise<Reward[]> {
  const db = await getDB();
  return db.getAll('rewards');
}

export async function saveReward(reward: Reward): Promise<void> {
  const db = await getDB();
  await db.put('rewards', reward);
}

export async function deleteReward(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('rewards', id);
}

export async function getRedemptions(status?: Redemption['status']): Promise<Redemption[]> {
  const db = await getDB();
  if (status) {
    return db.getAllFromIndex('redemptions', 'by-status', status);
  }
  return db.getAll('redemptions');
}

export async function saveRedemption(redemption: Redemption): Promise<void> {
  const db = await getDB();
  await db.put('redemptions', redemption);
}

export async function getParentSettings(id = 'default'): Promise<ParentSettings | undefined> {
  const db = await getDB();
  const record = await db.get('parentSettings', id);
  if (!record) return undefined;
  const { id: _id, ...settings } = record;
  return settings;
}

export async function saveParentSettings(settings: ParentSettings, id = 'default'): Promise<void> {
  const db = await getDB();
  await db.put('parentSettings', { ...settings, id });
}

export async function getProgress(id: string): Promise<Progress | undefined> {
  const db = await getDB();
  return db.get('progress', id);
}

export async function getProgressBySubject(subject: Subject): Promise<Progress[]> {
  const db = await getDB();
  return db.getAllFromIndex('progress', 'by-subject', subject);
}

export async function saveProgress(progress: Progress): Promise<void> {
  const db = await getDB();
  await db.put('progress', progress);
}

export async function saveProgressBatch(progressList: Progress[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('progress', 'readwrite');
  for (const p of progressList) {
    await tx.store.put(p);
  }
  await tx.done;
}

export async function getBattleRecords(subject: Subject, stageId: string): Promise<BattleRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('battleRecords', 'by-subject-stage', [subject, stageId]);
}

export async function saveBattleRecord(record: BattleRecord): Promise<void> {
  const db = await getDB();
  await db.put('battleRecords', record);
}

export async function getAchievements(): Promise<Achievement[]> {
  const db = await getDB();
  return db.getAll('achievements');
}

export async function saveAchievement(achievement: Achievement): Promise<void> {
  const db = await getDB();
  await db.put('achievements', achievement);
}

export async function getTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  return db.getAll('transactions');
}

export async function saveTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', transaction);
}

export async function getWrongQuestions(): Promise<WrongQuestion[]> {
  const db = await getDB();
  return db.getAll('wrongQuestions');
}

export async function getWrongQuestion(questionId: string): Promise<WrongQuestion | undefined> {
  const db = await getDB();
  return db.get('wrongQuestions', questionId);
}

export async function saveWrongQuestion(record: WrongQuestion): Promise<void> {
  const db = await getDB();
  await db.put('wrongQuestions', record);
}

export async function deleteWrongQuestion(questionId: string): Promise<void> {
  const db = await getDB();
  await db.delete('wrongQuestions', questionId);
}

export async function getDailyTasks(dateKey: string): Promise<DailyTask[]> {
  const db = await getDB();
  const all = await db.getAll('dailyTasks');
  return all.filter(t => t.dateKey === dateKey);
}

export async function saveDailyTask(task: DailyTask): Promise<void> {
  const db = await getDB();
  await db.put('dailyTasks', task);
}

export async function saveDailyTasks(tasks: DailyTask[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('dailyTasks', 'readwrite');
  for (const task of tasks) {
    await tx.store.put(task);
  }
  await tx.done;
}

export async function deleteDailyTasks(dateKey: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('dailyTasks', 'readwrite');
  const all = await tx.store.getAll();
  for (const task of all) {
    if (task.dateKey === dateKey) {
      await tx.store.delete(task.id);
    }
  }
  await tx.done;
}

export async function getLotteryPool(): Promise<LotteryPrize[]> {
  const db = await getDB();
  return db.getAll('lotteryPool');
}

export async function saveLotteryPrize(prize: LotteryPrize): Promise<void> {
  const db = await getDB();
  await db.put('lotteryPool', prize);
}

export async function deleteLotteryPrize(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('lotteryPool', id);
}

export async function getInventory(): Promise<InventoryItem[]> {
  const db = await getDB();
  return db.getAll('inventory');
}

export async function getInventoryItem(id: string): Promise<InventoryItem | undefined> {
  const db = await getDB();
  return db.get('inventory', id);
}

export async function saveInventoryItem(item: InventoryItem): Promise<void> {
  const db = await getDB();
  await db.put('inventory', item);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('inventory', id);
}
