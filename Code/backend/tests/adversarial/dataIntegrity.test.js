import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';
import { generateTestToken } from '../helpers.js';

describe('Data Integrity & Constraints', () => {
  let clerkToken, doctorToken;

  beforeAll(async () => {
    const { rows: clerkRows } = await pool.query("SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'clerk' LIMIT 1");
    clerkToken = generateTestToken(clerkRows[0].user_id, 'clerk');

    const { rows: docRows } = await pool.query("SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'doctor' LIMIT 1");
    doctorToken = generateTestToken(docRows[0].user_id, 'doctor');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Cannot create patient with duplicate NIC', async () => {
    const patientData = {
      full_name: 'Test Integrity',
      nic: '999999999V',
      sex: 'Male'
    };

    // First creation
    await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${clerkToken}`)
      .send(patientData);

    // Second creation with same NIC should return success but indicate it already exists without throwing 500 error
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${clerkToken}`)
      .send(patientData);
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Patient already exists');
  });

  test('Status transitions logic', async () => {
    const resPat = await request(app).post('/api/patients').set('Authorization', `Bearer ${clerkToken}`).send({ full_name: 'Trans Pat', sex: 'Female' });
    const patientId = resPat.body.data.patient_id;

    const resCreate = await request(app)
      .post('/api/autopsy-cases')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ patient_id: patientId, case_status: 'Open' });
      
    const caseId = resCreate.body.data.case_id;

    // Set to closed directly via DB to test state machine enforcement when going backwards via API
    await pool.query(`UPDATE autopsy_cases SET case_status = 'Closed' WHERE case_id = $1`, [caseId]);

    const res = await request(app)
      .put(`/api/autopsy-cases/${caseId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ case_status: 'Open' });
    
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Cannot move case status backwards/i);
    
    // Clean up
    await pool.query(`DELETE FROM autopsy_cases WHERE case_id = $1`, [caseId]);
    await pool.query(`DELETE FROM patients WHERE patient_id = $1`, [patientId]);
  });
});
