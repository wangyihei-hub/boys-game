import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';

describe('Profile API', () => {
  const app = createTestApp();

  it('GET /api/profiles returns empty array initially', async () => {
    const res = await request(app).get('/api/profiles');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/profile creates a profile', async () => {
    const res = await request(app)
      .post('/api/profile')
      .send({
        id: 'profile-1',
        nickname: '测试小勇士',
        level: 1,
        exp: 0,
        stars: 0,
        created_at: '2026-06-27T00:00:00.000Z',
      });
    expect(res.status).toBe(201);
    expect(res.body.nickname).toBe('测试小勇士');
  });

  it('GET /api/profile/:id returns 404 for missing profile', async () => {
    const res = await request(app).get('/api/profile/nonexistent');
    expect(res.status).toBe(404);
  });

  it('GET /api/profile/:id returns created profile', async () => {
    await request(app)
      .post('/api/profile')
      .send({ id: 'profile-2', nickname: '小明', level: 5, exp: 100, stars: 300, created_at: '2026-06-27T00:00:00.000Z' });

    const res = await request(app).get('/api/profile/profile-2');
    expect(res.status).toBe(200);
    expect(res.body.nickname).toBe('小明');
    expect(res.body.level).toBe(5);
  });

  it('PUT /api/profile/:id updates a profile', async () => {
    await request(app)
      .post('/api/profile')
      .send({ id: 'profile-3', nickname: '小红', level: 1, exp: 0, stars: 0, created_at: '2026-06-27T00:00:00.000Z' });

    const res = await request(app)
      .put('/api/profile/profile-3')
      .send({ nickname: '小红', level: 3, exp: 50, stars: 120, created_at: '2026-06-27T00:00:00.000Z' });
    expect(res.status).toBe(200);
    expect(res.body.level).toBe(3);
  });

  it('GET /api/profiles returns all profiles', async () => {
    await request(app)
      .post('/api/profile')
      .send({ id: 'p-a', nickname: 'A', level: 1, exp: 0, stars: 0, created_at: '2026-06-27T00:00:00.000Z' });
    await request(app)
      .post('/api/profile')
      .send({ id: 'p-b', nickname: 'B', level: 2, exp: 0, stars: 0, created_at: '2026-06-27T00:00:00.000Z' });

    const res = await request(app).get('/api/profiles');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});
