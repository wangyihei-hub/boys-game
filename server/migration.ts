import { initDb, getDb } from './db.js';

interface MigrationTables {
  [table: string]: unknown[];
}

export function migrateFromIndexedDB(data: MigrationTables): { table: string; count: number }[] {
  initDb();
  const db = getDb();
  const results: { table: string; count: number }[] = [];

  const tableMap: Record<string, string> = {
    profiles: 'profiles',
    questions: 'questions',
    wrongQuestions: 'wrong_questions',
    rewards: 'rewards',
    redemptions: 'redemptions',
    achievements: 'achievements',
    parentSettings: 'parent_settings',
    progress: 'progress',
    battleRecords: 'battle_records',
    transactions: 'transactions',
    dailyTasks: 'daily_tasks',
    lotteryPool: 'lottery_pool',
    inventory: 'inventory',
    dailyStats: 'daily_stats',
  };

  const migrateTable = db.transaction((tableName: string, rows: Record<string, unknown>[]) => {
    if (rows.length === 0) return 0;

    // Flatten parentSettings (which has nested id)
    if (tableName === 'parent_settings') {
      rows = rows.map((r: Record<string, unknown>) => {
        if (!r.id && (r as unknown as { _storedId: string })._storedId) {
          return { ...r, id: (r as unknown as { _storedId: string })._storedId };
        }
        return r;
      });
    }

    const columns = Object.keys(rows[0]).map(k => camelToSnake(k));
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    const stmt = db.prepare(sql);
    for (const row of rows) {
      const values = columns.map(col => {
        const camelKey = snakeToCamel(col);
        const val = row[camelKey] ?? row[col];
        if (typeof val === 'object' && val !== null) return JSON.stringify(val);
        if (typeof val === 'boolean') return val ? 1 : 0;
        return val ?? null;
      });
      stmt.run(...values);
    }
    return rows.length;
  });

  for (const [idbName, sqlName] of Object.entries(tableMap)) {
    const rows = data[idbName] || [];
    const count = migrateTable(sqlName, rows as Record<string, unknown>[]);
    results.push({ table: idbName, count });
  }

  return results;
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}
