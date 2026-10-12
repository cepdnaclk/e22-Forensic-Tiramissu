import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const createCourtRecord = asyncHandler(async (req, res, next) => {
  const { case_ref, court_name, case_number, date_of_court_visit, document_name } = req.body;

  if (!case_ref || !court_name) {
    return next(new AppError('case_ref and court_name are required', 400));
  }

  const query = `
    INSERT INTO court_records (
      case_type, case_id, court_name, case_number, date_of_court_visit, judge_order, codification_cases
    ) VALUES (
      'clinical', 1, $1, $2, $3, $4, $5
    ) RETURNING *;
  `;

  const values = [
    court_name,
    case_number || null,
    date_of_court_visit || null,
    document_name || null,
    case_ref
  ];

  const { rows } = await pool.query(query, values);

  res.status(201).json({
    status: 'success',
    data: rows[0]
  });
});

export const getCourtRecords = asyncHandler(async (req, res, next) => {
  const query = `
    SELECT 
      record_id,
      codification_cases AS case_ref,
      court_name,
      case_number,
      date_of_court_visit,
      judge_order AS document_name,
      created_at
    FROM court_records
    ORDER BY created_at DESC;
  `;

  const { rows } = await pool.query(query);

  res.status(200).json({
    status: 'success',
    data: rows
  });
});
