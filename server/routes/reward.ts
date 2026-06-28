import { Router } from 'express';
import {
  dbGetRewards, dbSaveReward, dbDeleteReward,
  dbGetRedemptions, dbSaveRedemption,
  dbGetLotteryPool, dbSaveLotteryPrize, dbDeleteLotteryPrize,
  dbGetInventory, dbGetInventoryItem, dbSaveInventoryItem, dbDeleteInventoryItem,
} from '../db.js';

export const rewardRouter = Router();

// ========== Rewards ==========
rewardRouter.get('/rewards', (_req, res) => {
  try { res.json(dbGetRewards()); } catch (err) { res.status(500).json({ error: String(err) }); }
});

rewardRouter.post('/rewards', (req, res) => {
  try {
    const reward = req.body;
    dbSaveReward(reward);
    res.status(201).json(reward);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

rewardRouter.delete('/rewards/:id', (req, res) => {
  try {
    dbDeleteReward(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ========== Redemptions ==========
rewardRouter.get('/redemptions', (req, res) => {
  try {
    const { status } = req.query;
    res.json(dbGetRedemptions(status as string | undefined));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

rewardRouter.put('/redemptions', (req, res) => {
  try {
    const redemption = req.body;
    dbSaveRedemption(redemption);
    res.json(redemption);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ========== Lottery Pool ==========
rewardRouter.get('/lottery', (_req, res) => {
  try { res.json(dbGetLotteryPool()); } catch (err) { res.status(500).json({ error: String(err) }); }
});

rewardRouter.put('/lottery', (req, res) => {
  try {
    const prize = req.body;
    dbSaveLotteryPrize(prize);
    res.json(prize);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

rewardRouter.delete('/lottery/:id', (req, res) => {
  try {
    dbDeleteLotteryPrize(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// ========== Inventory ==========
rewardRouter.get('/inventory', (req, res) => {
  try {
    const { id } = req.query;
    if (id) {
      const item = dbGetInventoryItem(id as string);
      return res.json(item || null);
    }
    res.json(dbGetInventory());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

rewardRouter.put('/inventory', (req, res) => {
  try {
    const item = req.body;
    dbSaveInventoryItem(item);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

rewardRouter.delete('/inventory/:id', (req, res) => {
  try {
    dbDeleteInventoryItem(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});
