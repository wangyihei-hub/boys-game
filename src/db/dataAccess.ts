/**
 * Data Access Layer — unified interface for both server API and local IndexedDB.
 *
 * When the server is available, all operations go through the REST API.
 * In test mode or when server is unreachable, falls back to IndexedDB.
 *
 * Store files should import from here instead of directly from '../db'.
 */

import { useServer } from './compat.js';
import { api } from '../api/client.js';
import type {
  Profile, Question, WrongQuestion, Reward, Redemption,
  Achievement, ParentSettings, Progress, BattleRecord,
  Transaction, DailyTask, LotteryPrize, InventoryItem, DailyStats, Subject,
} from '../types';

// ========== Profile ==========

export async function getProfile(id = 'default'): Promise<Profile | undefined> {
  if (useServer()) {
    return api.get<Profile | null>(`/profile/${id}`).then(r => r ?? undefined);
  }
  const { getProfile: idbGet } = await import('./index.js');
  return idbGet(id);
}

export async function saveProfile(profile: Profile): Promise<void> {
  if (useServer()) {
    await api.put(`/profile/${profile.id}`, profile);
    return;
  }
  const { saveProfile: idbSave } = await import('./index.js');
  return idbSave(profile);
}

// ========== Questions ==========

export async function getQuestions(): Promise<Question[]> {
  if (useServer()) return api.get<Question[]>('/questions');
  const { getQuestions: idbGet } = await import('./index.js');
  return idbGet();
}

export async function getQuestionsBySubject(subject: Subject): Promise<Question[]> {
  if (useServer()) return api.get<Question[]>(`/questions/subject/${subject}`);
  const { getQuestionsBySubject: idbGet } = await import('./index.js');
  return idbGet(subject);
}

export async function countQuestions(): Promise<number> {
  if (useServer()) {
    const r = await api.get<{ count: number }>('/questions/count');
    return r.count;
  }
  const { countQuestions: idbCount } = await import('./index.js');
  return idbCount();
}

export async function saveQuestions(questions: Question[]): Promise<void> {
  if (useServer()) { await api.post('/questions', questions); return; }
  const { saveQuestions: idbSave } = await import('./index.js');
  return idbSave(questions);
}

export async function deleteQuestions(ids: string[]): Promise<void> {
  if (useServer()) { await api.delete('/questions', { ids }); return; }
  const { deleteQuestions: idbDel } = await import('./index.js');
  return idbDel(ids);
}

// ========== Progress ==========

export async function getProgress(id: string): Promise<Progress | undefined> {
  if (useServer()) {
    const r = await api.get<Progress[]>(`/progress/${id}`);
    return Array.isArray(r) ? r[0] : (r as unknown as Progress | undefined);
  }
  const { getProgress: idbGet } = await import('./index.js');
  return idbGet(id);
}

export async function getProgressBySubject(subject: Subject): Promise<Progress[]> {
  if (useServer()) {
    const all = await api.get<Progress[]>(`/progress/${subject}`);
    return Array.isArray(all) ? all.filter(p => p.subject === subject) : [];
  }
  const { getProgressBySubject: idbGet } = await import('./index.js');
  return idbGet(subject);
}

export async function saveProgress(progress: Progress): Promise<void> {
  if (useServer()) { await api.put(`/progress/${progress.id}`, progress); return; }
  const { saveProgress: idbSave } = await import('./index.js');
  return idbSave(progress);
}

export async function saveProgressBatch(progressList: Progress[]): Promise<void> {
  if (useServer()) { await api.put(`/progress/batch`, progressList); return; }
  const { saveProgressBatch: idbSave } = await import('./index.js');
  return idbSave(progressList);
}

// ========== Battle Records ==========

export async function getBattleRecords(subject: Subject, levelNumber: number): Promise<BattleRecord[]> {
  if (useServer()) return api.get<BattleRecord[]>(`/battle/records?subject=${subject}&levelNumber=${levelNumber}`);
  const { getBattleRecords: idbGet } = await import('./index.js');
  return idbGet(subject, levelNumber);
}

export async function getAllBattleRecords(): Promise<BattleRecord[]> {
  if (useServer()) return api.get<BattleRecord[]>('/battle/records');
  const { getAllBattleRecords: idbGet } = await import('./index.js');
  return idbGet();
}

export async function saveBattleRecord(record: BattleRecord): Promise<void> {
  if (useServer()) { await api.post('/battle', record); return; }
  const { saveBattleRecord: idbSave } = await import('./index.js');
  return idbSave(record);
}

// ========== Achievements ==========

export async function getAchievements(): Promise<Achievement[]> {
  if (useServer()) return api.get<Achievement[]>('/achievements');
  const { getAchievements: idbGet } = await import('./index.js');
  return idbGet();
}

export async function saveAchievement(achievement: Achievement): Promise<void> {
  if (useServer()) { await api.put('/achievements', achievement); return; }
  const { saveAchievement: idbSave } = await import('./index.js');
  return idbSave(achievement);
}

// ========== Transactions ==========

export async function getTransactions(): Promise<Transaction[]> {
  if (useServer()) return api.get<Transaction[]>('/transactions');
  const { getTransactions: idbGet } = await import('./index.js');
  return idbGet();
}

export async function saveTransaction(transaction: Transaction): Promise<void> {
  if (useServer()) { await api.post('/transactions', transaction); return; }
  const { saveTransaction: idbSave } = await import('./index.js');
  return idbSave(transaction);
}

// ========== Wrong Questions ==========

export async function getWrongQuestions(): Promise<WrongQuestion[]> {
  if (useServer()) return api.get<WrongQuestion[]>('/wrong-questions');
  const { getWrongQuestions: idbGet } = await import('./index.js');
  return idbGet();
}

export async function getWrongQuestion(questionId: string): Promise<WrongQuestion | undefined> {
  if (useServer()) {
    const r = await api.get<WrongQuestion | null>(`/wrong-questions?questionId=${questionId}`);
    return r ?? undefined;
  }
  const { getWrongQuestion: idbGet } = await import('./index.js');
  return idbGet(questionId);
}

export async function saveWrongQuestion(record: WrongQuestion): Promise<void> {
  if (useServer()) { await api.put('/wrong-questions', record); return; }
  const { saveWrongQuestion: idbSave } = await import('./index.js');
  return idbSave(record);
}

export async function deleteWrongQuestion(questionId: string): Promise<void> {
  if (useServer()) { await api.delete(`/wrong-questions/${questionId}`); return; }
  const { deleteWrongQuestion: idbDel } = await import('./index.js');
  return idbDel(questionId);
}

// ========== Daily Tasks ==========

export async function getDailyTasks(dateKey: string): Promise<DailyTask[]> {
  if (useServer()) return api.get<DailyTask[]>(`/daily-tasks?dateKey=${dateKey}`);
  const { getDailyTasks: idbGet } = await import('./index.js');
  return idbGet(dateKey);
}

export async function getAllDailyTasks(): Promise<DailyTask[]> {
  if (useServer()) return api.get<DailyTask[]>('/daily-tasks');
  const { getAllDailyTasks: idbGet } = await import('./index.js');
  return idbGet();
}

export async function saveDailyTask(task: DailyTask): Promise<void> {
  if (useServer()) { await api.put('/daily-tasks', task); return; }
  const { saveDailyTask: idbSave } = await import('./index.js');
  return idbSave(task);
}

export async function saveDailyTasks(tasks: DailyTask[]): Promise<void> {
  if (useServer()) { await api.put('/daily-tasks', tasks); return; }
  const { saveDailyTasks: idbSave } = await import('./index.js');
  return idbSave(tasks);
}

export async function deleteDailyTasks(dateKey: string): Promise<void> {
  if (useServer()) { await api.delete(`/daily-tasks/${dateKey}`); return; }
  const { deleteDailyTasks: idbDel } = await import('./index.js');
  return idbDel(dateKey);
}

// ========== Lottery Pool ==========

export async function getLotteryPool(): Promise<LotteryPrize[]> {
  if (useServer()) return api.get<LotteryPrize[]>('/lottery');
  const { getLotteryPool: idbGet } = await import('./index.js');
  return idbGet();
}

export async function saveLotteryPrize(prize: LotteryPrize): Promise<void> {
  if (useServer()) { await api.put('/lottery', prize); return; }
  const { saveLotteryPrize: idbSave } = await import('./index.js');
  return idbSave(prize);
}

export async function deleteLotteryPrize(id: string): Promise<void> {
  if (useServer()) { await api.delete(`/lottery/${id}`); return; }
  const { deleteLotteryPrize: idbDel } = await import('./index.js');
  return idbDel(id);
}

// ========== Inventory ==========

export async function getInventory(): Promise<InventoryItem[]> {
  if (useServer()) return api.get<InventoryItem[]>('/inventory');
  const { getInventory: idbGet } = await import('./index.js');
  return idbGet();
}

export async function getInventoryItem(id: string): Promise<InventoryItem | undefined> {
  if (useServer()) {
    const r = await api.get<InventoryItem | null>(`/inventory?id=${id}`);
    return r ?? undefined;
  }
  const { getInventoryItem: idbGet } = await import('./index.js');
  return idbGet(id);
}

export async function saveInventoryItem(item: InventoryItem): Promise<void> {
  if (useServer()) { await api.put('/inventory', item); return; }
  const { saveInventoryItem: idbSave } = await import('./index.js');
  return idbSave(item);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  if (useServer()) { await api.delete(`/inventory/${id}`); return; }
  const { deleteInventoryItem: idbDel } = await import('./index.js');
  return idbDel(id);
}

// ========== Parent Settings ==========

export async function getParentSettings(id = 'default'): Promise<ParentSettings | undefined> {
  if (useServer()) {
    const r = await api.get<ParentSettings | null>(`/settings/${id}`);
    return r ?? undefined;
  }
  const { getParentSettings: idbGet } = await import('./index.js');
  return idbGet(id);
}

export async function saveParentSettings(settings: ParentSettings, id = 'default'): Promise<void> {
  if (useServer()) { await api.put(`/settings/${id}`, settings); return; }
  const { saveParentSettings: idbSave } = await import('./index.js');
  return idbSave(settings, id);
}

// ========== Rewards ==========

export async function getRewards(): Promise<Reward[]> {
  if (useServer()) return api.get<Reward[]>('/rewards');
  const { getRewards: idbGet } = await import('./index.js');
  return idbGet();
}

export async function saveReward(reward: Reward): Promise<void> {
  if (useServer()) { await api.post('/rewards', reward); return; }
  const { saveReward: idbSave } = await import('./index.js');
  return idbSave(reward);
}

export async function deleteReward(id: string): Promise<void> {
  if (useServer()) { await api.delete(`/rewards/${id}`); return; }
  const { deleteReward: idbDel } = await import('./index.js');
  return idbDel(id);
}

// ========== Redemptions ==========

export async function getRedemptions(status?: Redemption['status']): Promise<Redemption[]> {
  if (useServer()) {
    const query = status ? `?status=${status}` : '';
    return api.get<Redemption[]>(`/redemptions${query}`);
  }
  const { getRedemptions: idbGet } = await import('./index.js');
  return idbGet(status);
}

export async function saveRedemption(redemption: Redemption): Promise<void> {
  if (useServer()) { await api.put('/redemptions', redemption); return; }
  const { saveRedemption: idbSave } = await import('./index.js');
  return idbSave(redemption);
}

// ========== Daily Stats ==========

export async function getDailyStats(dateKey: string): Promise<DailyStats | undefined> {
  if (useServer()) {
    const r = await api.get<DailyStats | null>(`/daily-stats/${dateKey}`);
    return r ?? undefined;
  }
  const { getDailyStats: idbGet } = await import('./index.js');
  return idbGet(dateKey);
}

export async function saveDailyStats(stats: DailyStats): Promise<void> {
  if (useServer()) { await api.put('/daily-stats', stats); return; }
  const { saveDailyStats: idbSave } = await import('./index.js');
  return idbSave(stats);
}

// ========== Reset / Init ==========
export { resetDB, getDB } from './index.js';
