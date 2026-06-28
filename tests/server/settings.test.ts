import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';

describe('Settings API', () => {
  const app = createTestApp();

  it('GET /api/settings/:id returns null when missing', async () => {
    const res = await request(app).get('/api/settings/default');
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  it('PUT /api/settings/:id saves and returns settings', async () => {
    const payload = {
      dailyStarLimit: 100,
      dailyMinuteLimit: 45,
      eyeCareIntervalMinutes: 20,
      restModeStartHour: 21,
    };
    const res = await request(app)
      .put('/api/settings/default')
      .send(payload);
    expect(res.status).toBe(200);
    expect(res.body.dailyStarLimit).toBe(100);
  });

  it('PUT /api/settings/:id persists curriculum config', async () => {
    const curriculum = {
      enabled: true,
      grade: 4 as const,
      startDate: '2026-06-27',
      subjects: ['math'] as const,
      questionsPerLesson: 5,
    };
    const payload = {
      dailyStarLimit: 120,
      dailyMinuteLimit: 45,
      eyeCareIntervalMinutes: 20,
      restModeStartHour: 21,
      curriculum,
    };
    const put = await request(app)
      .put('/api/settings/default')
      .send(payload);
    expect(put.status).toBe(200);

    const get = await request(app).get('/api/settings/default');
    expect(get.status).toBe(200);
    expect(get.body.curriculum).toEqual(curriculum);
  });
});
