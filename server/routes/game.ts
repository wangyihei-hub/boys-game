import { Router } from 'express';
import {
  dbGetProgress, dbGetProgressBySubject, dbSaveProgress, dbSaveProgressBatch,
  dbGetBattleRecords, dbGetAllBattleRecords, dbSaveBattleRecord,
  dbGetAchievements, dbSaveAchievement,
  dbGetTransactions, dbSaveTransaction,
  dbGetWrongQuestions, dbGetWrongQuestion, dbSaveWrongQuestion, dbDeleteWrongQuestion,
  dbGetAllDailyTasks, dbGetDailyTasks, dbSaveDailyTask, dbSaveDailyTasks, dbDeleteDailyTasks,
  dbGetDailyStats, dbSaveDailyStats,
} from '../db.js';

export const gameRouter = Router();

// ========== Progress ==========
gameRouter.get('/progress/:profileId', (req, res) => {
  try {
    const items = dbGetProgressBySubject(req.params.profileId);
    // Also get individual progress if profileId is a specific progress ID
    const single = dbGetProgress(req.params.profileId);
    res.json(single ? [single, ...items] : items);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.put('/progress/:profileId', (req, res) => {
  try {
    const data = req.body;
    if (Array.isArray(data)) {
      dbSaveProgressBatch(data);
      res.json({ saved: data.length });
    } else {
      dbSaveProgress(data);
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ========== Battle ==========
gameRouter.post('/battle', (req, res) => {
  try {
    const record = req.body;
    dbSaveBattleRecord(record);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.get('/battle/records', (req, res) => {
  try {
    const { subject, levelNumber } = req.query;
    if (subject && levelNumber) {
      res.json(dbGetBattleRecords(subject as string, Number(levelNumber)));
    } else {
      res.json(dbGetAllBattleRecords());
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ========== Achievements ==========
gameRouter.get('/achievements', (_req, res) => {
  try { res.json(dbGetAchievements()); } catch (err) { res.status(500).json({ error: String(err) }); }
});

gameRouter.put('/achievements', (req, res) => {
  try {
    const achievement = req.body;
    dbSaveAchievement(achievement);
    res.json(achievement);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ========== Transactions ==========
gameRouter.get('/transactions', (_req, res) => {
  try { res.json(dbGetTransactions()); } catch (err) { res.status(500).json({ error: String(err) }); }
});

gameRouter.post('/transactions', (req, res) => {
  try {
    const transaction = req.body;
    dbSaveTransaction(transaction);
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ========== Wrong Questions ==========
gameRouter.get('/wrong-questions', (req, res) => {
  try {
    const { questionId } = req.query;
    if (questionId) {
      const wq = dbGetWrongQuestion(questionId as string);
      return res.json(wq || null);
    }
    res.json(dbGetWrongQuestions());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.put('/wrong-questions', (req, res) => {
  try {
    const wq = req.body;
    dbSaveWrongQuestion(wq);
    res.json(wq);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.delete('/wrong-questions/:questionId', (req, res) => {
  try {
    dbDeleteWrongQuestion(req.params.questionId);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ========== Daily Tasks ==========
gameRouter.get('/daily-tasks', (req, res) => {
  try {
    const { dateKey } = req.query;
    if (dateKey) return res.json(dbGetDailyTasks(dateKey as string));
    res.json(dbGetAllDailyTasks());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.put('/daily-tasks', (req, res) => {
  try {
    const data = req.body;
    if (Array.isArray(data)) {
      dbSaveDailyTasks(data);
      res.json({ saved: data.length });
    } else {
      dbSaveDailyTask(data);
      res.json(data);
    }
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.delete('/daily-tasks/:dateKey', (req, res) => {
  try {
    dbDeleteDailyTasks(req.params.dateKey);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ========== Daily Stats ==========
gameRouter.get('/daily-stats/:dateKey', (req, res) => {
  try {
    const stats = dbGetDailyStats(req.params.dateKey);
    res.json(stats || null);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

gameRouter.put('/daily-stats', (req, res) => {
  try {
    const stats = req.body;
    dbSaveDailyStats(stats);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
