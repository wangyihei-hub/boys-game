import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  Achievement,
  ParentSettings,
  Profile,
  Question,
  Redemption,
  Reward
} from '../types';

const DB_NAME = 'boys-game-db';
const DB_VERSION = 1;

interface GameDB extends DBSchema {
  profiles: { key: string; value: Profile };
  questions: { key: string; value: Question; indexes: { 'by-subject-topic': [string, string] } };
  wrongQuestions: { key: string; value: { questionId: string; wrongCount: number; lastReviewAt: number } };
  rewards: { key: string; value: Reward };
  redemptions: { key: string; value: Redemption; indexes: { 'by-status': string } };
  achievements: { key: string; value: Achievement };
  parentSettings: { key: string; value: ParentSettings & { id: string } };
}

let dbPromise: Promise<IDBPDatabase<GameDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<GameDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
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
    });
  }
  return dbPromise;
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

export async function getRewards(): Promise<Reward[]> {
  const db = await getDB();
  return db.getAll('rewards');
}

export async function saveReward(reward: Reward): Promise<void> {
  const db = await getDB();
  await db.put('rewards', reward);
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
  return db.get('parentSettings', id);
}

export async function saveParentSettings(settings: ParentSettings, id = 'default'): Promise<void> {
  const db = await getDB();
  await db.put('parentSettings', { ...settings, id });
}
