import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const createInvestigation = asyncHandler(async (req, res, next) => {
  const { case_type, case_id, specimen_type, sent_to } = req.body;

  if (!case_type || !case_id || !specimen_type) {
    return next(new AppError('Required fields: case_type, case_id, specimen_type', 400));
  }

  const query = `
    INSERT INTO investigations (case_type, case_id, specimen_type, sent_to, created_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [case_type, case_id, specimen_type, sent_to, req.user.user_id];

  const { rows } = await pool.query(query, values);

  res.status(201).json({
    status: 'success',
    data: rows[0]
  });
});

export const updateInvestigation = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;
  
  const { rows: existing } = await pool.query('SELECT * FROM investigations WHERE investigation_id = $1', [id]);
  
  if (existing.length === 0) {
    return next(new AppError('No investigation found with that ID', 404));
  }

  const current = existing[0];

  if (updates.status) {
    const statuses = ['Ordered', 'To Be Sent', 'Pending', 'Completed', 'Discarded'];
    const currentIndex = statuses.indexOf(current.status);
    const newIndex = statuses.indexOf(updates.status);
    
    if (newIndex !== -1 && newIndex < currentIndex && current.status !== 'Discarded') {
      return next(new AppError('Cannot move status backwards', 400));
    }
    
    if (updates.status === 'Completed' && !updates.date_results) {
      updates.date_results = new Date().toISOString();
    }
    if (updates.status === 'Discarded' && !updates.discarded_on) {
      updates.discarded_on = new Date().toISOString();
    }
  }

  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return res.status(200).json({ status: 'success', data: current });
  }

  let setString = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const values = keys.map(key => updates[key]);
  values.push(id);
  
  const query = `UPDATE investigations SET ${setString} WHERE investigation_id = $${values.length} RETURNING *`;
  const { rows } = await pool.query(query, values);

  res.status(200).json({
    status: 'success',
    data: rows[0]
  });
});

export const getOverdueInvestigations = asyncHandler(async (req, res, next) => {
  const { overdue_days = 7 } = req.query;

  const query = `
    SELECT * FROM investigations 
    WHERE status IN ('Ordered', 'To Be Sent') 
    AND created_at < NOW() - INTERVAL '${parseInt(overdue_days)} days'
    ORDER BY created_at ASC
  `;

  const { rows } = await pool.query(query);

  res.status(200).json({
    status: 'success',
    results: rows.length,
    data: rows
  });
});
