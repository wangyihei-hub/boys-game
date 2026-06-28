import { Router } from 'express';
import { dbGetParentSettings, dbSaveParentSettings } from '../db.js';

export const settingsRouter = Router();

settingsRouter.get('/settings/:id', (req, res) => {
  try {
    const settings = dbGetParentSettings(req.params.id);
    if (!settings) return res.json(null);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

settingsRouter.put('/settings/:id', (req, res) => {
  try {
    dbSaveParentSettings(req.body, req.params.id);
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
