import { Router } from 'express';
import { dbGetProfile, dbGetAllProfiles, dbSaveProfile } from '../db.js';

export const profileRouter = Router();

// GET /api/profile/:id - Get single profile
profileRouter.get('/profile/:id', (req, res) => {
  try {
    const profile = dbGetProfile(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /api/profiles - Get all profiles
profileRouter.get('/profiles', (_req, res) => {
  try {
    const profiles = dbGetAllProfiles();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/profile - Create profile
profileRouter.post('/profile', (req, res) => {
  try {
    const profile = { ...req.body, id: req.body.id || `profile-${Date.now()}` };
    dbSaveProfile(profile);
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT /api/profile/:id - Update profile
profileRouter.put('/profile/:id', (req, res) => {
  try {
    const profile = { ...req.body, id: req.params.id };
    dbSaveProfile(profile);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
