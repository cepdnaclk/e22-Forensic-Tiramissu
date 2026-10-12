import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';
import { generateTestToken } from '../helpers.js';

describe('SQL Injection Prevention', () => {
  let validToken;
  let originalPatientCount;

  beforeAll(async () => {
    validToken = generateTestToken(1, 'super_admin');
    const { rows } = await pool.query('SELECT COUNT(*) FROM patients');
    originalPatientCount = parseInt(rows[0].count);
  });

  afterAll(async () => {
    await pool.end();
  });

  test('should reject SQL injection in patient search', async () => {
    const maliciousInputs = [
      "'; DROP TABLE patients; --",
      "1' OR '1'='1",
      "1; SELECT * FROM users; --",
      "1' UNION SELECT password_hash FROM users --",
      "Robert'); DROP TABLE clinical_cases; --",
      "' OR 1=1; UPDATE users SET role_id=1 WHERE username='attacker'; --",
    ];

    for (const input of maliciousInputs) {
      const res = await request(app)
        .get(`/api/patients?search=${encodeURIComponent(input)}`)
        .set('Authorization', `Bearer ${validToken}`);
      
      expect(res.status).not.toBe(500);
      expect(res.body.data).toHaveLength(0); // ILIKE %...% will just find 0 matches
    }
    
    // Verify tables still exist
    const { rows } = await pool.query('SELECT COUNT(*) FROM patients');
    expect(parseInt(rows[0].count)).toBe(originalPatientCount);
  });
});
