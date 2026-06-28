import { Router } from 'express';
import { dbGetQuestions, dbGetQuestionsBySubject, dbCountQuestions, dbSaveQuestions, dbDeleteQuestions } from '../db.js';

export const questionRouter = Router();

// GET /api/questions - Get all questions
questionRouter.get('/questions', (_req, res) => {
  try {
    const questions = dbGetQuestions();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/questions/subject/:subject - Get questions by subject
questionRouter.get('/questions/subject/:subject', (req, res) => {
  try {
    const questions = dbGetQuestionsBySubject(req.params.subject);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/questions/count - Count all questions
questionRouter.get('/questions/count', (_req, res) => {
  try {
    const count = dbCountQuestions();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/questions - Save questions (batch)
questionRouter.post('/questions', (req, res) => {
  try {
    const questions = Array.isArray(req.body) ? req.body : [req.body];
    dbSaveQuestions(questions);
    res.status(201).json({ saved: questions.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /api/questions - Delete questions by IDs
questionRouter.delete('/questions', (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Missing ids array in body' });
    }
    dbDeleteQuestions(ids);
    res.json({ deleted: ids.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
