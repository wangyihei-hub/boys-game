import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';

describe('Question API', () => {
  const app = createTestApp();

  const sampleQuestion = {
    id: 'q-1',
    subject: 'math',
    topic: '四则运算',
    difficulty: 2,
    type: 'choice',
    question: '25 × 4 = ?',
    options: ['80', '90', '100', '110'],
    answer: '100',
    explanation: '25 × 4 = 100',
    generated_at: '2026-06-27T00:00:00.000Z',
  };

  it('GET /api/questions/count returns 0 initially', async () => {
    const res = await request(app).get('/api/questions/count');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  it('GET /api/questions returns empty array initially', async () => {
    const res = await request(app).get('/api/questions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /api/questions creates questions', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send(sampleQuestion);
    expect(res.status).toBe(201);
    expect(res.body.saved).toBe(1);
  });

  it('GET /api/questions/count reflects saved questions', async () => {
    await request(app).post('/api/questions').send(sampleQuestion);
    const res = await request(app).get('/api/questions/count');
    expect(res.body.count).toBe(1);
  });

  it('GET /api/questions returns saved questions', async () => {
    await request(app).post('/api/questions').send(sampleQuestion);
    const res = await request(app).get('/api/questions');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('q-1');
  });

  it('GET /api/questions/subject/:subject filters by subject', async () => {
    await request(app).post('/api/questions').send(sampleQuestion);
    await request(app).post('/api/questions').send({
      ...sampleQuestion, id: 'q-2', subject: 'chinese',
      question: '床前明月光的作者是？', answer: '李白',
    });
    await request(app).post('/api/questions').send({
      ...sampleQuestion, id: 'q-3', subject: 'math',
      question: '100 ÷ 5 = ?', answer: '20',
    });

    const mathRes = await request(app).get('/api/questions/subject/math');
    expect(mathRes.body).toHaveLength(2);

    const chineseRes = await request(app).get('/api/questions/subject/chinese');
    expect(chineseRes.body).toHaveLength(1);
  });

  it('DELETE /api/questions removes questions by IDs', async () => {
    await request(app).post('/api/questions').send(sampleQuestion);
    await request(app).post('/api/questions').send({ ...sampleQuestion, id: 'q-2' });

    const del = await request(app)
      .delete('/api/questions')
      .send({ ids: ['q-1'] });
    expect(del.body.deleted).toBe(1);

    const remaining = await request(app).get('/api/questions');
    expect(remaining.body).toHaveLength(1);
    expect(remaining.body[0].id).toBe('q-2');
  });

  it('DELETE /api/questions rejects missing ids array', async () => {
    const res = await request(app)
      .delete('/api/questions')
      .send({});
    expect(res.status).toBe(400);
  });
});
