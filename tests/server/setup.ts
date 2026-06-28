import { beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import express from 'express';
import cors from 'cors';
import { setTestDb, initDb } from '../../server/db.js';
import { profileRouter } from '../../server/routes/profile.js';
import { questionRouter } from '../../server/routes/question.js';
import { gameRouter } from '../../server/routes/game.js';
import { rewardRouter } from '../../server/routes/reward.js';
import { settingsRouter } from '../../server/routes/settings.js';
import { backupRouter } from '../../server/routes/backup.js';

export function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', profileRouter);
  app.use('/api', questionRouter);
  app.use('/api', gameRouter);
  app.use('/api', rewardRouter);
  app.use('/api', settingsRouter);
  app.use('/api', backupRouter);
  return app;
}

let testDb: Database.Database;

beforeEach(() => {
  testDb = new Database(':memory:');
  setTestDb(testDb);
  initDb();
});

afterEach(() => {
  testDb.close();
});
