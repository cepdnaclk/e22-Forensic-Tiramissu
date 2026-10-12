import request from 'supertest';
import app from '../../src/app.js';
import pool from '../../src/config/database.js';
import { generateTestToken } from '../helpers.js';

describe('Integration Workflows', () => {
  let doctorToken;

  beforeAll(async () => {
    const { rows: docRows } = await pool.query("SELECT u.user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'doctor' LIMIT 1");
    doctorToken = generateTestToken(docRows[0].user_id, 'doctor');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('Full Autopsy Workflow', async () => {
    // 1. Create Patient
    let res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        full_name: 'Flow Test Patient',
        sex: 'Male'
      });
    
    expect(res.status).toBe(201);
    const patientId = res.body.data.patient_id;

    // 2. Create Autopsy Case
    res = await request(app)
      .post('/api/autopsy-cases')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patient_id: patientId,
        morgue_no: 'MORGUE-123'
      });
    
    expect(res.status).toBe(201);
    const caseId = res.body.data.case_id;

    // 3. Update Autopsy Case (add verdict)
    res = await request(app)
      .put(`/api/autopsy-cases/${caseId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        verdict: 'Natural'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.data.verdict).toBe('Natural');

    // 4. Create Document (Mock upload)
    res = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        case_type: 'autopsy',
        case_id: caseId,
        doc_category: 'Report',
        file_name: 'autopsy_report.pdf'
      });
    
    expect(res.status).toBe(201);

    // 5. Release Body
    res = await request(app)
      .post(`/api/autopsy-cases/${caseId}/body-release`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        nok_name: 'Jane Doe',
        release_date: '2026-07-22'
      });
    
    expect(res.status).toBe(201);
    
    // Clean up
    await pool.query('DELETE FROM documents WHERE case_id = $1 AND case_type = $2', [caseId, 'autopsy']);
    await pool.query('DELETE FROM body_releases WHERE case_id = $1', [caseId]);
    await pool.query('DELETE FROM autopsy_cases WHERE case_id = $1', [caseId]);
    await pool.query('DELETE FROM patients WHERE patient_id = $1', [patientId]);
  });
});
