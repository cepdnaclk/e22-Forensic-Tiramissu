import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';
import { generateTestToken } from '../helpers.js';

describe('Input Validation', () => {
  let clerkToken;

  beforeAll(async () => {
    const { rows: clerkRows } = await pool.query("SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'clerk' LIMIT 1");
    clerkToken = generateTestToken(clerkRows[0].user_id, 'clerk');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Should reject patient creation with empty full_name', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${clerkToken}`)
      .send({ sex: 'Male' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Full name is required/i);
  });

  test('Should reject invalid sex enum', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${clerkToken}`)
      .send({ full_name: 'Invalid Sex Pat', sex: 'Alien' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Sex must be Male, Female, or Unknown/i);
  });
});
