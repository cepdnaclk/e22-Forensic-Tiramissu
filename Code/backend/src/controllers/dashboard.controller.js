import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getStats = asyncHandler(async (req, res, next) => {
  const { rows: clinTotal } = await pool.query('SELECT COUNT(*) FROM clinical_cases');
  const { rows: autoTotal } = await pool.query('SELECT COUNT(*) FROM autopsy_cases');
  
  const { rows: clinStatus } = await pool.query('SELECT case_status, COUNT(*) FROM clinical_cases GROUP BY case_status');
  const { rows: autoStatus } = await pool.query('SELECT case_status, COUNT(*) FROM autopsy_cases GROUP BY case_status');
  
  const { rows: overdueSpec } = await pool.query(`
    SELECT COUNT(*) FROM investigations 
    WHERE status IN ('Ordered', 'To Be Sent') 
    AND created_at < NOW() - INTERVAL '7 days'
  `);
  
  const { rows: pendingRep } = await pool.query('SELECT COUNT(*) FROM reports WHERE is_finalized = FALSE');
  
  res.status(200).json({
    status: 'success',
    data: {
      total_clinical: parseInt(clinTotal[0].count),
      total_autopsy: parseInt(autoTotal[0].count),
      clinical_by_status: clinStatus,
      autopsy_by_status: autoStatus,
      overdue_specimens: parseInt(overdueSpec[0].count),
      pending_reports: parseInt(pendingRep[0].count)
    }
  });
});

export const getMyCases = asyncHandler(async (req, res, next) => {
  const userId = req.user.user_id;
  
  const { rows: clinRows } = await pool.query('SELECT case_id, cme_no, case_status, examined_date FROM clinical_cases WHERE examining_doctor_id = $1 ORDER BY examined_date DESC LIMIT 5', [userId]);
  const { rows: autoRows } = await pool.query('SELECT case_id, pm_no, case_status, pm_date FROM autopsy_cases WHERE examining_doctor_id = $1 ORDER BY pm_date DESC LIMIT 5', [userId]);
  
  res.status(200).json({
    status: 'success',
    data: {
      clinical_cases: clinRows,
      autopsy_cases: autoRows
    }
  });
});
