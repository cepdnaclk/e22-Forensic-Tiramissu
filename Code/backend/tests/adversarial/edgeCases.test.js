import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';
import { generateTestToken } from '../helpers.js';

describe('Edge Cases & Malformed Inputs', () => {
  let clerkToken;

  beforeAll(() => {
    clerkToken = generateTestToken(2, 'clerk');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Missing mandatory fields should return 400', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${clerkToken}`)
      .send({}); // Missing full_name

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/required/i);
  });

  test('Excessively large string lengths', async () => {
    const longString = 'a'.repeat(300); // Exceeds varchar(255) potentially or causes issues
    
    // In our logic, full_name is text, but nic is varchar(20). Let's test NIC constraint.
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${clerkToken}`)
      .send({
        full_name: 'Test',
        nic: longString
      });

    // Should return 500 error from pg due to value too long for type character varying(20)
    // Or 400 if validation is added
    expect([400, 500]).toContain(res.status);
  });

  test('Malformed JSON should return error gracefully', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${clerkToken}`)
      .set('Content-Type', 'application/json')
      .send('{"full_name": "Test", "nic": "123"'); // Missing closing brace

    expect(res.status).toBe(400); // Express json middleware returns 400 for malformed json
  });
});
