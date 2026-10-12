import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

export const createPatient = asyncHandler(async (req, res, next) => {
  const { full_name, nic, passport_no, address, sex, age_years, age_months, age_days, contact_no, religion } = req.body;

  if (!full_name) {
    return next(new AppError('Patient full name is required', 400));
  }

  // De-duplicate by NIC if provided
  if (nic) {
    const { rows: existing } = await pool.query('SELECT * FROM patients WHERE nic = $1', [nic]);
    if (existing.length > 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Patient already exists',
        data: existing[0]
      });
    }
  }

  const query = `
    INSERT INTO patients (full_name, nic, passport_no, address, sex, age_years, age_months, age_days, contact_no, religion)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
  `;
  const values = [full_name, nic, passport_no, address, sex, age_years, age_months, age_days, contact_no, religion];

  const { rows } = await pool.query(query, values);

  res.status(201).json({
    status: 'success',
    data: rows[0]
  });
});

export const getPatients = asyncHandler(async (req, res, next) => {
  const { search, nic, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM patients WHERE 1=1';
  const values = [];
  let paramCount = 1;

  if (search) {
    query += ` AND full_name ILIKE $${paramCount}`;
    values.push(`%${search}%`);
    paramCount++;
  }

  if (nic) {
    query += ` AND nic = $${paramCount}`;
    values.push(nic);
    paramCount++;
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM (${query}) AS sub`;
  const { rows: countRows } = await pool.query(countQuery, values);
  const total = parseInt(countRows[0].count);

  query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);

  res.status(200).json({
    status: 'success',
    results: rows.length,
    total,
    data: rows
  });
});

export const getPatientById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const { rows } = await pool.query('SELECT * FROM patients WHERE patient_id = $1', [id]);

  if (rows.length === 0) {
    return next(new AppError('No patient found with that ID', 404));
  }

  // Include linked cases count
  const { rows: clinicalCount } = await pool.query('SELECT COUNT(*) FROM clinical_cases WHERE patient_id = $1', [id]);
  const { rows: autopsyCount } = await pool.query('SELECT COUNT(*) FROM autopsy_cases WHERE patient_id = $1', [id]);

  const patient = rows[0];
  patient.clinical_cases_count = parseInt(clinicalCount[0].count);
  patient.autopsy_cases_count = parseInt(autopsyCount[0].count);

  res.status(200).json({
    status: 'success',
    data: patient
  });
});

export const updatePatient = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { full_name, nic, passport_no, address, sex, age_years, age_months, age_days, contact_no, religion } = req.body;

  const query = `
    UPDATE patients 
    SET full_name = COALESCE($1, full_name),
        nic = COALESCE($2, nic),
        passport_no = COALESCE($3, passport_no),
        address = COALESCE($4, address),
        sex = COALESCE($5, sex),
        age_years = COALESCE($6, age_years),
        age_months = COALESCE($7, age_months),
        age_days = COALESCE($8, age_days),
        contact_no = COALESCE($9, contact_no),
        religion = COALESCE($10, religion)
    WHERE patient_id = $11
    RETURNING *;
  `;
  const values = [full_name, nic, passport_no, address, sex, age_years, age_months, age_days, contact_no, religion, id];

  const { rows } = await pool.query(query, values);

  if (rows.length === 0) {
    return next(new AppError('No patient found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: rows[0]
  });
});
