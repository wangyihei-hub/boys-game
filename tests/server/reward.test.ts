import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';

describe('Reward API', () => {
  const app = createTestApp();

  // Rewards
  it('GET /api/rewards returns empty initially', async () => {
    const res = await request(app).get('/api/rewards');
    expect(res.body).toEqual([]);
  });

  it('POST /api/rewards creates reward', async () => {
    const res = await request(app)
      .post('/api/rewards')
      .send({ id: 'r-1', name: '冰淇淋', star_cost: 20, stock: 10, category: 'food', description: '一支冰淇淋', icon: 'icecream' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('冰淇淋');
  });

  it('DELETE /api/rewards/:id removes reward', async () => {
    await request(app)
      .post('/api/rewards')
      .send({ id: 'r-1', name: '冰淇淋', star_cost: 20, stock: 10, category: 'food', description: '一支冰淇淋', icon: 'icecream' });

    const del = await request(app).delete('/api/rewards/r-1');
    expect(del.body.deleted).toBe(true);

    const after = await request(app).get('/api/rewards');
    expect(after.body).toEqual([]);
  });

  // Redemptions
  it('GET /api/redemptions returns empty initially', async () => {
    const res = await request(app).get('/api/redemptions');
    expect(res.body).toEqual([]);
  });

  it('PUT /api/redemptions creates redemption', async () => {
    const res = await request(app)
      .put('/api/redemptions')
      .send({ id: 'red-1', reward_id: 'r-1', reward_name: '冰淇淋', star_cost: 20, status: 'pending', created_at: '2026-06-27T00:00:00.000Z' });
    expect(res.status).toBe(200);
    expect(res.body.reward_name).toBe('冰淇淋');
  });

  // Lottery Pool
  it('GET /api/lottery returns empty initially', async () => {
    const res = await request(app).get('/api/lottery');
    expect(res.body).toEqual([]);
  });

  it('PUT /api/lottery adds prize', async () => {
    const res = await request(app)
      .put('/api/lottery')
      .send({ id: 'lp-1', name: '星星x5', type: 'stars', amount: 5, icon: 'star', probability: 0.3, stock: 100 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('星星x5');
  });

  it('DELETE /api/lottery/:id removes prize', async () => {
    await request(app)
      .put('/api/lottery')
      .send({ id: 'lp-1', name: '星星x5', type: 'stars', amount: 5, icon: 'star', probability: 0.3, stock: 100 });
    const del = await request(app).delete('/api/lottery/lp-1');
    expect(del.body.deleted).toBe(true);
  });

  // Inventory
  it('GET /api/inventory returns empty initially', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.body).toEqual([]);
  });

  it('PUT /api/inventory adds item', async () => {
    const res = await request(app)
      .put('/api/inventory')
      .send({ id: 'inv-1', name: '木材剑', type: 'weapon', icon: 'wood-sword', count: 1,
        equipment_slot: 'weapon', equipment_level: 1, equipment_bonuses: { attack: 5 } });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('木材剑');
  });

  it('DELETE /api/inventory/:id removes item', async () => {
    await request(app)
      .put('/api/inventory')
      .send({ id: 'inv-1', name: '木材剑', type: 'weapon', icon: 'wood-sword', count: 1 });
    const del = await request(app).delete('/api/inventory/inv-1');
    expect(del.body.deleted).toBe(true);
  });
});
