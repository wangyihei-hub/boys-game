import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'game.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/** For test use: swap in an in-memory database */
export function setTestDb(testDb: Database.Database): void {
  db = testDb;
  db.pragma('foreign_keys = ON');
}

export function initDb(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL DEFAULT '',
      level INTEGER NOT NULL DEFAULT 1,
      exp INTEGER NOT NULL DEFAULT 0,
      stars INTEGER NOT NULL DEFAULT 0,
      equipped_weapon TEXT,
      equipped_shield TEXT,
      equipped_staff TEXT,
      equipped_shoes TEXT,
      active_pet TEXT,
      stamina INTEGER NOT NULL DEFAULT 10,
      stamina_updated_at TEXT NOT NULL DEFAULT '',
      daily_pass_count INTEGER NOT NULL DEFAULT 0,
      daily_pass_date TEXT NOT NULL DEFAULT '',
      current_level_number INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL DEFAULT '',
      difficulty INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL DEFAULT 'choice',
      question TEXT NOT NULL DEFAULT '',
      options TEXT,
      answer TEXT NOT NULL DEFAULT '',
      explanation TEXT NOT NULL DEFAULT '',
      generated_at TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);

    CREATE TABLE IF NOT EXISTS wrong_questions (
      question_id TEXT PRIMARY KEY,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      last_review_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      star_cost INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'food',
      description TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS redemptions (
      id TEXT PRIMARY KEY,
      reward_id TEXT NOT NULL DEFAULT '',
      reward_name TEXT NOT NULL DEFAULT '',
      star_cost INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT '',
      confirmed_at TEXT,
      rejected_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '',
      unlocked_at TEXT
    );

    CREATE TABLE IF NOT EXISTS parent_settings (
      id TEXT PRIMARY KEY,
      daily_star_limit INTEGER NOT NULL DEFAULT 100,
      daily_minute_limit INTEGER NOT NULL DEFAULT 120,
      eye_care_interval INTEGER NOT NULL DEFAULT 20,
      rest_mode_start_hour INTEGER NOT NULL DEFAULT 22,
      api_key TEXT,
      api_provider TEXT,
      api_endpoint TEXT,
      api_model TEXT,
      pin TEXT,
      curriculum_data TEXT
    );

    CREATE TABLE IF NOT EXISTS progress (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      level_number INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'locked',
      passed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_progress_subject ON progress(subject);

    CREATE TABLE IF NOT EXISTS battle_records (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      level_number INTEGER NOT NULL DEFAULT 1,
      result TEXT NOT NULL DEFAULT '',
      duration_ms INTEGER NOT NULL DEFAULT 0,
      stars_earned INTEGER NOT NULL DEFAULT 0,
      exp_earned INTEGER NOT NULL DEFAULT 0,
      correct_answers INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_battle_records_subject_level ON battle_records(subject, level_number);

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT '',
      amount INTEGER NOT NULL DEFAULT 0,
      reason TEXT NOT NULL DEFAULT '',
      balance_after INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS daily_tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT '',
      target INTEGER NOT NULL DEFAULT 0,
      reward_stars INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      progress INTEGER NOT NULL DEFAULT 0,
      date_key TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_daily_tasks_date_key ON daily_tasks(date_key);

    CREATE TABLE IF NOT EXISTS lottery_pool (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT '',
      amount INTEGER,
      icon TEXT NOT NULL DEFAULT '',
      probability REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      type TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '',
      count INTEGER NOT NULL DEFAULT 0,
      equipment_id TEXT,
      equipment_name TEXT,
      equipment_slot TEXT,
      equipment_level INTEGER,
      equipment_description TEXT,
      equipment_bonuses TEXT,
      pet_id TEXT,
      pet_name TEXT,
      pet_description TEXT,
      pet_skill TEXT,
      pet_skill_desc TEXT,
      pet_evolution_level INTEGER,
      pet_last_fed_at TEXT,
      pet_consecutive_feed_days INTEGER,
      pet_has_been_fed_today INTEGER
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      id TEXT PRIMARY KEY,
      date_key TEXT NOT NULL DEFAULT '',
      stars_earned INTEGER NOT NULL DEFAULT 0,
      minutes_played INTEGER NOT NULL DEFAULT 0,
      last_activity_at TEXT NOT NULL DEFAULT ''
    );
  `);

  // Migrate existing databases: add columns that were introduced after initial creation.
  const addColumn = (sql: string) => {
    try {
      db.exec(sql);
    } catch {
      // Column already exists.
    }
  };
  addColumn(`ALTER TABLE parent_settings ADD COLUMN curriculum_data TEXT`);
  addColumn(`ALTER TABLE profiles ADD COLUMN stamina INTEGER NOT NULL DEFAULT 10`);
  addColumn(`ALTER TABLE profiles ADD COLUMN stamina_updated_at TEXT NOT NULL DEFAULT ''`);
  addColumn(`ALTER TABLE profiles ADD COLUMN daily_pass_count INTEGER NOT NULL DEFAULT 0`);
  addColumn(`ALTER TABLE profiles ADD COLUMN daily_pass_date TEXT NOT NULL DEFAULT ''`);
  addColumn(`ALTER TABLE profiles ADD COLUMN current_level_number INTEGER NOT NULL DEFAULT 1`);
  addColumn(`ALTER TABLE progress ADD COLUMN level_number INTEGER NOT NULL DEFAULT 1`);
  addColumn(`ALTER TABLE progress ADD COLUMN passed_at TEXT`);
  addColumn(`ALTER TABLE battle_records ADD COLUMN level_number INTEGER NOT NULL DEFAULT 1`);
}

// ========== Profile ==========
export function dbGetProfile(id: string) {
  return getDb().prepare('SELECT * FROM profiles WHERE id = ?').get(id);
}
export function dbGetAllProfiles() {
  return getDb().prepare('SELECT * FROM profiles').all();
}
export function dbSaveProfile(profile: Record<string, unknown>) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM profiles WHERE id = ?').get(profile.id);
  if (existing) {
    db.prepare(`UPDATE profiles SET nickname=?, level=?, exp=?, stars=?,
      equipped_weapon=?, equipped_shield=?, equipped_staff=?, equipped_shoes=?,
      active_pet=?, stamina=?, stamina_updated_at=?, daily_pass_count=?, daily_pass_date=?,
      current_level_number=?, created_at=? WHERE id=?`).run(
      profile.nickname, profile.level, profile.exp, profile.stars,
      profile.equipped_weapon || null, profile.equipped_shield || null,
      profile.equipped_staff || null, profile.equipped_shoes || null,
      profile.active_pet || null,
      profile.stamina ?? 10,
      profile.stamina_updated_at ?? profile.staminaUpdatedAt ?? '',
      profile.daily_pass_count ?? profile.dailyPassCount ?? 0,
      profile.daily_pass_date ?? profile.dailyPassDate ?? '',
      profile.current_level_number ?? profile.currentLevelNumber ?? 1,
      profile.created_at, profile.id
    );
  } else {
    db.prepare(`INSERT INTO profiles (id, nickname, level, exp, stars,
      equipped_weapon, equipped_shield, equipped_staff, equipped_shoes,
      active_pet, stamina, stamina_updated_at, daily_pass_count, daily_pass_date,
      current_level_number, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      profile.id, profile.nickname, profile.level, profile.exp, profile.stars,
      profile.equipped_weapon || null, profile.equipped_shield || null,
      profile.equipped_staff || null, profile.equipped_shoes || null,
      profile.active_pet || null,
      profile.stamina ?? 10,
      profile.stamina_updated_at ?? profile.staminaUpdatedAt ?? '',
      profile.daily_pass_count ?? profile.dailyPassCount ?? 0,
      profile.daily_pass_date ?? profile.dailyPassDate ?? '',
      profile.current_level_number ?? profile.currentLevelNumber ?? 1,
      profile.created_at
    );
  }
}

// ========== Questions ==========
export function dbGetQuestions() {
  const rows = getDb().prepare('SELECT * FROM questions').all() as Record<string, unknown>[];
  return rows.map(deserializeQuestion);
}
export function dbGetQuestionsBySubject(subject: string) {
  const rows = getDb().prepare('SELECT * FROM questions WHERE subject = ?').all(subject) as Record<string, unknown>[];
  return rows.map(deserializeQuestion);
}
export function dbCountQuestions() {
  return (getDb().prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number }).count;
}
export function dbSaveQuestions(questions: Record<string, unknown>[]) {
  const db = getDb();
  const insert = db.prepare(`INSERT OR REPLACE INTO questions
    (id, subject, topic, difficulty, type, question, options, answer, explanation, generated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const tx = db.transaction((qs: Record<string, unknown>[]) => {
    for (const q of qs) {
      insert.run(q.id, q.subject, q.topic, q.difficulty, q.type, q.question,
        JSON.stringify(q.options || []), String(q.answer), q.explanation, q.generated_at);
    }
  });
  tx(questions);
}
export function dbDeleteQuestions(ids: string[]) {
  const db = getDb();
  const del = db.prepare('DELETE FROM questions WHERE id = ?');
  const tx = db.transaction((idList: string[]) => {
    for (const id of idList) del.run(id);
  });
  tx(ids);
}
function deserializeQuestion(row: Record<string, unknown>) {
  return {
    ...row,
    options: typeof row.options === 'string' ? JSON.parse(row.options as string) : (row.options || []),
    difficulty: Number(row.difficulty),
    answer: isNaN(Number(row.answer)) ? row.answer : Number(row.answer),
  };
}

// ========== Progress ==========
export function dbGetProgress(id: string) { return getDb().prepare('SELECT * FROM progress WHERE id = ?').get(id); }
export function dbGetProgressBySubject(subject: string) {
  return getDb().prepare('SELECT * FROM progress WHERE subject = ?').all(subject);
}
export function dbSaveProgress(progress: Record<string, unknown>) {
  const db = getDb();
  db.prepare(`INSERT OR REPLACE INTO progress (id, subject, level_number, status, passed_at)
    VALUES (?,?,?,?,?)`).run(
    progress.id, progress.subject,
    progress.level_number ?? progress.levelNumber ?? 1,
    progress.status,
    progress.passed_at ?? progress.passedAt ?? null
  );
}
export function dbSaveProgressBatch(list: Record<string, unknown>[]) {
  const db = getDb();
  const insert = db.prepare(`INSERT OR REPLACE INTO progress (id, subject, level_number, status, passed_at)
    VALUES (?,?,?,?,?)`);
  const tx = db.transaction((items: Record<string, unknown>[]) => {
    for (const p of items) {
      insert.run(
        p.id, p.subject,
        p.level_number ?? p.levelNumber ?? 1,
        p.status,
        p.passed_at ?? p.passedAt ?? null
      );
    }
  });
  tx(list);
}

// ========== Battle Records ==========
export function dbGetBattleRecords(subject: string, levelNumber: number) {
  return getDb().prepare('SELECT * FROM battle_records WHERE subject = ? AND level_number = ?').all(subject, levelNumber);
}
export function dbGetAllBattleRecords() {
  return getDb().prepare('SELECT * FROM battle_records').all();
}
export function dbSaveBattleRecord(record: Record<string, unknown>) {
  getDb().prepare(`INSERT OR REPLACE INTO battle_records
    (id, subject, level_number, result, duration_ms, stars_earned, exp_earned, correct_answers, created_at)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    record.id, record.subject, record.level_number ?? record.levelNumber ?? 1, record.result,
    record.duration_ms || record.durationMs, record.stars_earned || record.starsEarned,
    record.exp_earned || record.expEarned, record.correct_answers || record.correctAnswers,
    record.created_at || record.createdAt
  );
}

// ========== Achievements ==========
export function dbGetAchievements() { return getDb().prepare('SELECT * FROM achievements').all(); }
export function dbSaveAchievement(a: Record<string, unknown>) {
  getDb().prepare(`INSERT OR REPLACE INTO achievements (id, title, description, icon, unlocked_at)
    VALUES (?,?,?,?,?)`).run(a.id, a.title, a.description, a.icon, a.unlocked_at || a.unlockedAt || null);
}

// ========== Transactions ==========
export function dbGetTransactions() { return getDb().prepare('SELECT * FROM transactions ORDER BY created_at DESC').all(); }
export function dbSaveTransaction(t: Record<string, unknown>) {
  getDb().prepare(`INSERT OR REPLACE INTO transactions (id, type, amount, reason, balance_after, created_at)
    VALUES (?,?,?,?,?,?)`).run(t.id, t.type, t.amount, t.reason, t.balance_after || t.balanceAfter, t.created_at || t.createdAt);
}

// ========== Wrong Questions ==========
export function dbGetWrongQuestions() { return getDb().prepare('SELECT * FROM wrong_questions').all(); }
export function dbGetWrongQuestion(questionId: string) {
  return getDb().prepare('SELECT * FROM wrong_questions WHERE question_id = ?').get(questionId);
}
export function dbSaveWrongQuestion(wq: Record<string, unknown>) {
  getDb().prepare(`INSERT OR REPLACE INTO wrong_questions (question_id, wrong_count, last_review_at)
    VALUES (?,?,?)`).run(wq.question_id || wq.questionId, wq.wrong_count || wq.wrongCount, wq.last_review_at || wq.lastReviewAt);
}
export function dbDeleteWrongQuestion(questionId: string) {
  getDb().prepare('DELETE FROM wrong_questions WHERE question_id = ?').run(questionId);
}

// ========== Daily Tasks ==========
export function dbGetAllDailyTasks() { return getDb().prepare('SELECT * FROM daily_tasks').all(); }
export function dbGetDailyTasks(dateKey: string) {
  return getDb().prepare('SELECT * FROM daily_tasks WHERE date_key = ?').all(dateKey);
}
export function dbSaveDailyTask(task: Record<string, unknown>) {
  getDb().prepare(`INSERT OR REPLACE INTO daily_tasks (id, title, type, target, reward_stars, completed, progress, date_key)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    task.id, task.title, task.type, task.target,
    task.reward_stars || task.rewardStars, task.completed ? 1 : 0,
    task.progress, task.date_key || task.dateKey
  );
}
export function dbSaveDailyTasks(tasks: Record<string, unknown>[]) {
  const db = getDb();
  const insert = db.prepare(`INSERT OR REPLACE INTO daily_tasks (id, title, type, target, reward_stars, completed, progress, date_key)
    VALUES (?,?,?,?,?,?,?,?)`);
  const tx = db.transaction((items: Record<string, unknown>[]) => {
    for (const t of items) {
      insert.run(t.id, t.title, t.type, t.target, t.reward_stars || t.rewardStars,
        t.completed ? 1 : 0, t.progress, t.date_key || t.dateKey);
    }
  });
  tx(tasks);
}
export function dbDeleteDailyTasks(dateKey: string) {
  getDb().prepare('DELETE FROM daily_tasks WHERE date_key = ?').run(dateKey);
}

// ========== Lottery Pool ==========
export function dbGetLotteryPool() { return getDb().prepare('SELECT * FROM lottery_pool').all(); }
export function dbSaveLotteryPrize(p: Record<string, unknown>) {
  getDb().prepare(`INSERT OR REPLACE INTO lottery_pool (id, name, type, amount, icon, probability, stock)
    VALUES (?,?,?,?,?,?,?)`).run(p.id, p.name, p.type, p.amount || null, p.icon, p.probability, p.stock);
}
export function dbDeleteLotteryPrize(id: string) {
  getDb().prepare('DELETE FROM lottery_pool WHERE id = ?').run(id);
}

// ========== Inventory ==========
export function dbGetInventory() {
  const rows = getDb().prepare('SELECT * FROM inventory').all() as Record<string, unknown>[];
  return rows.map(deserializeInventory);
}
export function dbGetInventoryItem(id: string) {
  const row = getDb().prepare('SELECT * FROM inventory WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? deserializeInventory(row) : undefined;
}
export function dbSaveInventoryItem(item: Record<string, unknown>) {
  const db = getDb();
  const bonuses = item.equipment_bonuses || item.equipmentBonuses;
  db.prepare(`INSERT OR REPLACE INTO inventory
    (id, name, type, icon, count,
     equipment_id, equipment_name, equipment_slot, equipment_level, equipment_description, equipment_bonuses,
     pet_id, pet_name, pet_description, pet_skill, pet_skill_desc,
     pet_evolution_level, pet_last_fed_at, pet_consecutive_feed_days, pet_has_been_fed_today)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    item.id, item.name, item.type, item.icon, item.count,
    item.equipment_id || item.equipmentId || null, item.equipment_name || item.equipmentName || null,
    item.equipment_slot || item.equipmentSlot || null, item.equipment_level || item.equipmentLevel || null,
    item.equipment_description || item.equipmentDescription || null,
    bonuses ? JSON.stringify(bonuses) : null,
    item.pet_id || item.petId || null, item.pet_name || item.petName || null,
    item.pet_description || item.petDescription || null, item.pet_skill || item.petSkill || null,
    item.pet_skill_desc || item.petSkillDesc || null,
    item.pet_evolution_level ?? item.petEvolutionLevel ?? null,
    item.pet_last_fed_at || item.petLastFedAt || null,
    item.pet_consecutive_feed_days ?? item.petConsecutiveFeedDays ?? null,
    item.pet_has_been_fed_today ?? item.petHasBeenFedToday ?? null
  );
}
export function dbDeleteInventoryItem(id: string) {
  getDb().prepare('DELETE FROM inventory WHERE id = ?').run(id);
}
function deserializeInventory(row: Record<string, unknown>) {
  return {
    ...row,
    stageId: row.stage_id,
    stage_id: undefined,
    equipmentId: row.equipment_id,
    equipmentName: row.equipment_name,
    equipmentSlot: row.equipment_slot,
    equipmentLevel: row.equipment_level,
    equipmentDescription: row.equipment_description,
    equipmentBonuses: row.equipment_bonuses ? JSON.parse(row.equipment_bonuses as string) : undefined,
    petId: row.pet_id,
    petName: row.pet_name,
    petDescription: row.pet_description,
    petSkill: row.pet_skill,
    petSkillDesc: row.pet_skill_desc,
    petEvolutionLevel: row.pet_evolution_level,
    petLastFedAt: row.pet_last_fed_at,
    petConsecutiveFeedDays: row.pet_consecutive_feed_days,
    petHasBeenFedToday: row.pet_has_been_fed_today,
  };
}

// ========== Parent Settings ==========
export function dbGetParentSettings(id: string) {
  const row = getDb().prepare('SELECT * FROM parent_settings WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  const { id: _id, curriculum_data, ...settings } = row;
  const parsed = curriculum_data ? JSON.parse(curriculum_data as string) : undefined;
  return { ...settings, curriculum: parsed };
}
export function dbSaveParentSettings(settings: Record<string, unknown>, id: string) {
  const db = getDb();
  const curriculum = settings.curriculum ?? settings.curriculumData;
  const curriculumData = curriculum ? JSON.stringify(curriculum) : null;
  const existing = db.prepare('SELECT id FROM parent_settings WHERE id = ?').get(id);
  if (existing) {
    db.prepare(`UPDATE parent_settings SET daily_star_limit=?, daily_minute_limit=?, eye_care_interval=?,
      rest_mode_start_hour=?, api_key=?, api_provider=?, api_endpoint=?, api_model=?, pin=?, curriculum_data=?
      WHERE id=?`).run(
      settings.daily_star_limit ?? settings.dailyStarLimit, settings.daily_minute_limit ?? settings.dailyMinuteLimit,
      settings.eye_care_interval ?? settings.eyeCareIntervalMinutes, settings.rest_mode_start_hour ?? settings.restModeStartHour,
      settings.api_key || settings.apiKey || null, settings.api_provider || settings.apiProvider || null,
      settings.api_endpoint || settings.apiEndpoint || null, settings.api_model || settings.apiModel || null,
      settings.pin || null, curriculumData, id
    );
  } else {
    db.prepare(`INSERT INTO parent_settings (id, daily_star_limit, daily_minute_limit, eye_care_interval,
      rest_mode_start_hour, api_key, api_provider, api_endpoint, api_model, pin, curriculum_data)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, settings.daily_star_limit ?? settings.dailyStarLimit, settings.daily_minute_limit ?? settings.dailyMinuteLimit,
      settings.eye_care_interval ?? settings.eyeCareIntervalMinutes, settings.rest_mode_start_hour ?? settings.restModeStartHour,
      settings.api_key || settings.apiKey || null, settings.api_provider || settings.apiProvider || null,
      settings.api_endpoint || settings.apiEndpoint || null, settings.api_model || settings.apiModel || null,
      settings.pin || null, curriculumData
    );
  }
}

// ========== Daily Stats ==========
export function dbGetDailyStats(dateKey: string) {
  return getDb().prepare('SELECT * FROM daily_stats WHERE date_key = ?').get(dateKey);
}
export function dbSaveDailyStats(stats: Record<string, unknown>) {
  getDb().prepare(`INSERT OR REPLACE INTO daily_stats (id, date_key, stars_earned, minutes_played, last_activity_at)
    VALUES (?,?,?,?,?)`).run(
    stats.id, stats.date_key || stats.dateKey, stats.stars_earned || stats.starsEarned,
    stats.minutes_played || stats.minutesPlayed, stats.last_activity_at || stats.lastActivityAt
  );
}

// ========== Rewards ==========
export function dbGetRewards() { return getDb().prepare('SELECT * FROM rewards').all(); }
export function dbSaveReward(r: Record<string, unknown>) {
  getDb().prepare(`INSERT OR REPLACE INTO rewards (id, name, star_cost, stock, category, description, icon)
    VALUES (?,?,?,?,?,?,?)`).run(r.id, r.name, r.star_cost || r.starCost, r.stock, r.category, r.description, r.icon);
}
export function dbDeleteReward(id: string) { getDb().prepare('DELETE FROM rewards WHERE id = ?').run(id); }

// ========== Redemptions ==========
export function dbGetRedemptions(status?: string) {
  if (status) {
    return getDb().prepare('SELECT * FROM redemptions WHERE status = ?').all(status);
  }
  return getDb().prepare('SELECT * FROM redemptions').all();
}
export function dbSaveRedemption(r: Record<string, unknown>) {
  getDb().prepare(`INSERT OR REPLACE INTO redemptions
    (id, reward_id, reward_name, star_cost, status, created_at, confirmed_at, rejected_at)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    r.id, r.reward_id || r.rewardId, r.reward_name || r.rewardName,
    r.star_cost || r.starCost, r.status,
    r.created_at || r.createdAt, r.confirmed_at || r.confirmedAt || null, r.rejected_at || r.rejectedAt || null
  );
}
