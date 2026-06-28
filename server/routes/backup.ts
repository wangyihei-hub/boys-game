import { Router } from 'express';
import { initDb, getDb } from '../db.js';
import { migrateFromIndexedDB } from '../migration.js';

export const backupRouter = Router();

// POST /api/migrate - Migrate IndexedDB data to SQLite
backupRouter.post('/migrate', (req, res) => {
  try {
    const data = req.body;
    const results = migrateFromIndexedDB(data);
    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/backup/export - Export all SQLite data as JSON
backupRouter.get('/backup/export', (_req, res) => {
  try {
    initDb();
    const db = getDb();

    const tables = [
      'profiles', 'questions', 'wrong_questions', 'rewards', 'redemptions',
      'achievements', 'parent_settings', 'progress', 'battle_records',
      'transactions', 'daily_tasks', 'lottery_pool', 'inventory', 'daily_stats',
    ];

    const exportData: Record<string, unknown[]> = {};
    for (const table of tables) {
      exportData[table] = db.prepare(`SELECT * FROM ${table}`).all();
    }

    res.json(exportData);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/backup/import - Import JSON to SQLite
backupRouter.post('/backup/import', (req, res) => {
  try {
    migrateFromIndexedDB(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
