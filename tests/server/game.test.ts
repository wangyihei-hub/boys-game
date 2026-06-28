import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';

describe('Game API', () => {
  const app = createTestApp();

  const sampleProgress = {
    id: 'math-stage1',
    subject: 'math',
    stage_id: 'stage1',
    status: 'unlocked',
    stars: 3,
    best_score: 85,
  };

  const sampleBattleRecord = {
    id: 'battle-1',
    subject: 'math',
    stage_id: 'stage1',
    result: 'win',
    duration_ms: 60000,
    stars_earned: 3,
    exp_earned: 50,
    correct_answers: 8,
    created_at: '2026-06-27T00:00:00.000Z',
  };

  // Progress
  it('GET /api/progress/:profileId returns empty array initially', async () => {
    const res = await request(app).get('/api/progress/math');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('PUT /api/progress/:profileId saves single progress', async () => {
    const res = await request(app)
      .put('/api/progress/math')
      .send(sampleProgress);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('math-stage1');
  });

  it('PUT /api/progress/:profileId saves batch progress', async () => {
    const batch = [
      { id: 'math-stage1', subject: 'math', stage_id: 'stage1', status: 'completed', stars: 3, best_score: 100 },
      { id: 'math-stage2', subject: 'math', stage_id: 'stage2', status: 'unlocked', stars: 0, best_score: 0 },
    ];
    const res = await request(app)
      .put('/api/progress/math')
      .send(batch);
    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(2);
  });

  // Battle Records
  it('POST /api/battle creates battle record', async () => {
    const res = await request(app)
      .post('/api/battle')
      .send(sampleBattleRecord);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('battle-1');
  });

  it('GET /api/battle/records returns records', async () => {
    await request(app).post('/api/battle').send(sampleBattleRecord);
    const res = await request(app).get('/api/battle/records');
    expect(res.body).toHaveLength(1);
  });

  it('GET /api/battle/records filters by subject and stageId', async () => {
    await request(app).post('/api/battle').send(sampleBattleRecord);
    await request(app).post('/api/battle').send({
      ...sampleBattleRecord, id: 'battle-2', subject: 'chinese', stage_id: 'ch-stage1',
    });

    const res = await request(app)
      .get('/api/battle/records?subject=math&stageId=stage1');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('battle-1');
  });

  // Achievements
  it('GET /api/achievements returns empty initially', async () => {
    const res = await request(app).get('/api/achievements');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('PUT /api/achievements saves achievement', async () => {
    const res = await request(app)
      .put('/api/achievements')
      .send({ id: 'ach-1', title: '初出茅庐', description: '首次闯关', icon: 'star', unlocked_at: '2026-06-27T00:00:00.000Z' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('初出茅庐');
  });

  // Transactions
  it('GET /api/transactions returns empty initially', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/transactions creates transaction', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({ id: 'tx-1', type: 'earn', amount: 10, reason: '答题奖励', balance_after: 100, created_at: '2026-06-27T00:00:00.000Z' });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('earn');
  });

  // Wrong Questions
  it('GET /api/wrong-questions returns empty initially', async () => {
    const res = await request(app).get('/api/wrong-questions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('PUT /api/wrong-questions saves wrong question', async () => {
    const res = await request(app)
      .put('/api/wrong-questions')
      .send({ question_id: 'q-1', wrong_count: 1, last_review_at: '2026-06-27T00:00:00.000Z' });
    expect(res.status).toBe(200);
    expect(res.body.question_id).toBe('q-1');
  });

  it('GET /api/wrong-questions?questionId returns single', async () => {
    await request(app)
      .put('/api/wrong-questions')
      .send({ question_id: 'q-1', wrong_count: 1, last_review_at: '2026-06-27T00:00:00.000Z' });
    const res = await request(app).get('/api/wrong-questions?questionId=q-1');
    expect(res.body.question_id).toBe('q-1');
  });

  it('DELETE /api/wrong-questions/:questionId deletes entry', async () => {
    await request(app)
      .put('/api/wrong-questions')
      .send({ question_id: 'q-1', wrong_count: 1, last_review_at: '2026-06-27T00:00:00.000Z' });
    const res = await request(app).delete('/api/wrong-questions/q-1');
    expect(res.body.deleted).toBe(true);

    const after = await request(app).get('/api/wrong-questions');
    expect(after.body).toEqual([]);
  });

  // Daily Tasks
  it('GET /api/daily-tasks handles queries with dateKey', async () => {
    await request(app)
      .put('/api/daily-tasks')
      .send({ id: 'dt-1', title: '答题', type: 'answer', target: 10, reward_stars: 20, completed: 0, progress: 5, date_key: '2026-06-27' });
    const res = await request(app).get('/api/daily-tasks?dateKey=2026-06-27');
    expect(res.body).toHaveLength(1);
  });

  // Daily Stats
  it('GET /api/daily-stats/:dateKey returns null for missing', async () => {
    const res = await request(app).get('/api/daily-stats/2026-06-27');
    expect(res.body).toBeNull();
  });

  it('PUT /api/daily-stats saves stats', async () => {
    const res = await request(app)
      .put('/api/daily-stats')
      .send({ id: 'ds-1', date_key: '2026-06-27', stars_earned: 30, minutes_played: 45, last_activity_at: '2026-06-27T00:00:00.000Z' });
    expect(res.status).toBe(200);
    expect(res.body.stars_earned).toBe(30);
  });
});
