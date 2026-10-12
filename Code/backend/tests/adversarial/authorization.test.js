import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';
import { generateTestToken } from '../helpers.js';

describe('Authorization & RBAC', () => {
  let clerkToken, labStaffToken;
  let testLabStaffId;

  beforeAll(async () => {
    const { rows: clerkRows } = await pool.query("SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'clerk' LIMIT 1");
    clerkToken = generateTestToken(clerkRows[0].user_id, 'clerk');

    // Create a lab_staff user for testing
    const { rows: rRows } = await pool.query("SELECT role_id FROM roles WHERE role_name = 'lab_staff'");
    const { rows: uRows } = await pool.query("INSERT INTO users (username, password_hash, full_name, role_id) VALUES ('test_lab', 'hash', 'Test Lab', $1) RETURNING user_id", [rRows[0].role_id]);
    testLabStaffId = uRows[0].user_id;
    labStaffToken = generateTestToken(testLabStaffId, 'lab_staff');
  });

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE user_id = $1", [testLabStaffId]);
    await pool.end();
  });

  test('Lab Staff cannot access patient list (RBAC failure)', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${labStaffToken}`);
    
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/permission/i);
  });

  test('Clerk can access patient list (RBAC success)', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${clerkToken}`);
    
    expect(res.status).toBe(200);
  });

  test('Invalid token is rejected', async () => {
    const res = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer invalid.jwt.token`);
    
    expect(res.status).toBe(401);
  });
});
