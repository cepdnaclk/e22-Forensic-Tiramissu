import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';
import { generateTestToken } from '../helpers.js';

describe('Concurrency', () => {
  let doctorToken;
  let caseId;
  let patientId;

  beforeAll(async () => {
    const { rows: docRows } = await pool.query("SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'doctor' LIMIT 1");
    doctorToken = generateTestToken(docRows[0].user_id, 'doctor');
    
    const resPat = await request(app).post('/api/patients').set('Authorization', `Bearer ${doctorToken}`).send({ full_name: 'Conc Pat', sex: 'Male' });
    patientId = resPat.body.data.patient_id;

    const resCreate = await request(app)
      .post('/api/clinical-cases')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ patient_id: patientId, patient_type: 'Outpatient', examined_date: new Date() });
      
    caseId = resCreate.body.data.case_id;
  });

  afterAll(async () => {
    await pool.query(`DELETE FROM clinical_cases WHERE case_id = $1`, [caseId]);
    await pool.query(`DELETE FROM patients WHERE patient_id = $1`, [patientId]);
    await pool.end();
  });

  test('Concurrent status updates should not violate state machine', async () => {
    // Fire two requests almost simultaneously
    const req1 = request(app)
      .put(`/api/clinical-cases/${caseId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ case_status: 'Report Generated' });

    const req2 = request(app)
      .put(`/api/clinical-cases/${caseId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ case_status: 'Closed' });

    const [res1, res2] = await Promise.all([req1, req2]);
    
    // Depending on which finishes first, the second one might fail if the state was jumped
    // Both should at least not crash the server and result in a valid state
    expect([200, 400]).toContain(res1.status);
    expect([200, 400]).toContain(res2.status);
    
    const { rows } = await pool.query(`SELECT case_status FROM clinical_cases WHERE case_id = $1`, [caseId]);
    expect(['Report Generated', 'Closed']).toContain(rows[0].case_status);
  });
});
