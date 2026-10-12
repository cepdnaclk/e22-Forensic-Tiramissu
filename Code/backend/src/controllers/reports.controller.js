import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const generateReport = asyncHandler(async (req, res, next) => {
  const { case_type, case_id, report_type_id } = req.body;
  
  if (!case_type || !case_id || !report_type_id) {
    return next(new AppError('Required fields: case_type, case_id, report_type_id', 400));
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const docQuery = `
      INSERT INTO documents (case_type, case_id, doc_category, file_path, file_name, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING document_id;
    `;
    const docValues = [case_type, case_id, 'Report', `/generated/${case_type}/${case_id}_report_${Date.now()}.pdf`, 'Generated Report', req.user.user_id];
    const { rows: docRows } = await client.query(docQuery, docValues);
    
    const document_id = docRows[0].document_id;
    
    const repQuery = `
      INSERT INTO reports (case_type, case_id, report_type_id, generated_on, generated_by, document_id)
      VALUES ($1, $2, $3, NOW(), $4, $5)
      RETURNING *;
    `;
    const repValues = [case_type, case_id, report_type_id, req.user.user_id, document_id];
    
    const { rows: repRows } = await client.query(repQuery, repValues);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      status: 'success',
      data: repRows[0]
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

export const dispatchReport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { dispatched_on, dispatched_to, dispatched_via, certificate_no, rc_no } = req.body;
  
  if (!dispatched_on || !dispatched_to) {
     return next(new AppError('Required fields: dispatched_on, dispatched_to', 400));
  }

  const query = `
    UPDATE reports 
    SET dispatched_on = $1, dispatched_to = $2, dispatched_via = $3, certificate_no = $4, rc_no = $5, is_finalized = TRUE
    WHERE report_id = $6
    RETURNING *;
  `;
  const values = [dispatched_on, dispatched_to, dispatched_via, certificate_no, rc_no, id];
  
  const { rows } = await pool.query(query, values);
  
  if (rows.length === 0) {
    return next(new AppError('No report found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: rows[0]
  });
});
