import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const uploadDocument = asyncHandler(async (req, res, next) => {
  const { case_type, case_id, doc_category, file_name, file_mime_type, file_size_bytes, previous_version_id } = req.body;
  
  if (!case_type || !case_id || !doc_category || !file_name) {
    return next(new AppError('Required fields: case_type, case_id, doc_category, file_name', 400));
  }
  
  const file_path = `/uploads/${case_type}/${case_id}/${file_name}`;
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    let version = 1;
    
    if (previous_version_id) {
       const { rows: prev } = await client.query('SELECT version FROM documents WHERE document_id = $1', [previous_version_id]);
       if (prev.length > 0) {
         version = prev[0].version + 1;
         await client.query('UPDATE documents SET is_current = FALSE WHERE document_id = $1', [previous_version_id]);
       }
    }
    
    const query = `
      INSERT INTO documents (case_type, case_id, doc_category, file_path, file_name, file_mime_type, file_size_bytes, version, is_current, previous_version_id, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [case_type, case_id, doc_category, file_path, file_name, file_mime_type, file_size_bytes, version, true, previous_version_id || null, req.user.user_id];
    
    const { rows } = await client.query(query, values);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      status: 'success',
      data: rows[0]
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

export const getDocuments = asyncHandler(async (req, res, next) => {
  const { case_type, case_id, include_versions } = req.query;
  
  let query = 'SELECT * FROM documents WHERE 1=1';
  const values = [];
  let paramCount = 1;
  
  if (case_type) {
    query += ` AND case_type = $${paramCount}`;
    values.push(case_type);
    paramCount++;
  }
  
  if (case_id) {
    query += ` AND case_id = $${paramCount}`;
    values.push(case_id);
    paramCount++;
  }
  
  if (include_versions !== 'true') {
    query += ` AND is_current = TRUE`;
  }
  
  query += ' ORDER BY uploaded_at DESC';
  
  const { rows } = await pool.query(query, values);
  
  res.status(200).json({
    status: 'success',
    results: rows.length,
    data: rows
  });
});
