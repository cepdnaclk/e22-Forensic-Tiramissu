import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

const generateCmeNo = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const prefix = `CME/${year}/${month}/`;
  
  const { rows } = await pool.query(
    "SELECT cme_no FROM clinical_cases WHERE cme_no LIKE $1 ORDER BY cme_no DESC LIMIT 1",
    [`${prefix}%`]
  );
  
  let sequence = 1;
  if (rows.length > 0) {
    const lastNo = rows[0].cme_no;
    const lastSeq = parseInt(lastNo.split('/').pop());
    sequence = lastSeq + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

export const createClinicalCase = asyncHandler(async (req, res, next) => {
  const { patient_id, patient_type, bht_no, ward, hospital, admission_datetime, police_station_id, police_officer_name, police_officer_reg_no, police_contact_no, produced_by, examined_date, place_of_examination, category, reason_for_examination, hurt_description, sr_no, ordering_court_id, trial_court_id, case_no } = req.body;

  if (!patient_id || !patient_type || !examined_date) {
    return next(new AppError('Required fields: patient_id, patient_type, examined_date', 400));
  }
  
  const examining_doctor_id = req.user.user_id; 
  const cme_no = await generateCmeNo();

  const query = `
    INSERT INTO clinical_cases (
      cme_no, patient_id, patient_type, bht_no, ward, hospital, admission_datetime, 
      police_station_id, police_officer_name, police_officer_reg_no, police_contact_no, 
      produced_by, examining_doctor_id, examined_date, place_of_examination, category, 
      reason_for_examination, hurt_description, sr_no, ordering_court_id, trial_court_id, 
      case_no, created_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
    ) RETURNING *;
  `;
  
  const values = [
    cme_no, patient_id, patient_type, bht_no, ward, hospital, admission_datetime,
    police_station_id, police_officer_name, police_officer_reg_no, police_contact_no,
    produced_by, examining_doctor_id, examined_date, place_of_examination, category,
    reason_for_examination, hurt_description, sr_no, ordering_court_id, trial_court_id,
    case_no, req.user.user_id
  ];

  const { rows } = await pool.query(query, values);

  res.status(201).json({
    status: 'success',
    data: rows[0]
  });
});

export const getClinicalCases = asyncHandler(async (req, res, next) => {
  const { status, doctor_id, date_from, date_to, search, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT c.*, p.full_name AS patient_name, p.nic, p.contact_no, p.address, p.sex, p.religion FROM clinical_cases c JOIN patients p ON c.patient_id = p.patient_id WHERE 1=1';
  const values = [];
  let paramCount = 1;

  if (req.user.role_name === 'doctor') {
    query += ` AND c.examining_doctor_id = $${paramCount}`;
    values.push(req.user.user_id);
    paramCount++;
  } else if (doctor_id) {
    query += ` AND c.examining_doctor_id = $${paramCount}`;
    values.push(doctor_id);
    paramCount++;
  }

  if (status) {
    query += ` AND c.case_status = $${paramCount}`;
    values.push(status);
    paramCount++;
  }
  
  if (date_from) {
    query += ` AND c.examined_date >= $${paramCount}`;
    values.push(date_from);
    paramCount++;
  }
  
  if (date_to) {
    query += ` AND c.examined_date <= $${paramCount}`;
    values.push(date_to);
    paramCount++;
  }

  if (search) {
    query += ` AND (c.cme_no ILIKE $${paramCount} OR p.full_name ILIKE $${paramCount})`;
    values.push(`%${search}%`);
    paramCount++;
  }

  const countQuery = `SELECT COUNT(*) FROM (${query}) AS sub`;
  const { rows: countRows } = await pool.query(countQuery, values);
  const total = parseInt(countRows[0].count);

  query += ` ORDER BY c.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);

  res.status(200).json({
    status: 'success',
    results: rows.length,
    total,
    data: rows
  });
});

export const getClinicalCaseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const { rows } = await pool.query('SELECT c.*, p.full_name AS patient_name, p.nic, p.contact_no, p.address, p.sex, p.religion FROM clinical_cases c JOIN patients p ON c.patient_id = p.patient_id WHERE c.case_id = $1', [id]);

  if (rows.length === 0) {
    return next(new AppError('No clinical case found with that ID', 404));
  }

  const clinicalCase = rows[0];

  if (req.user.role_name === 'doctor' && clinicalCase.examining_doctor_id !== req.user.user_id) {
    return next(new AppError('You do not have permission to access this case', 403));
  }
  
  const { rows: examinations } = await pool.query('SELECT * FROM clinical_examinations WHERE clinical_case_id = $1', [id]);
  const { rows: reviews } = await pool.query('SELECT * FROM clinical_reviews WHERE clinical_case_id = $1', [id]);
  const { rows: investigations } = await pool.query("SELECT * FROM investigations WHERE case_type = 'clinical' AND case_id = $1", [id]);
  const { rows: documents } = await pool.query("SELECT * FROM documents WHERE case_type = 'clinical' AND case_id = $1 AND is_current = TRUE", [id]);
  
  clinicalCase.examinations = examinations;
  clinicalCase.reviews = reviews;
  clinicalCase.investigations = investigations;
  clinicalCase.documents = documents;

  res.status(200).json({
    status: 'success',
    data: clinicalCase
  });
});

export const updateClinicalCase = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;
  
  const { rows: existing } = await pool.query('SELECT * FROM clinical_cases WHERE case_id = $1', [id]);
  
  if (existing.length === 0) {
    return next(new AppError('No clinical case found with that ID', 404));
  }

  const currentCase = existing[0];

  if (req.user.role_name === 'doctor' && currentCase.examining_doctor_id !== req.user.user_id) {
    return next(new AppError('You do not have permission to update this case', 403));
  }
  
  if (updates.case_status) {
    const statuses = ['Open', 'Report Generated', 'Dispatched', 'Closed', 'Deleted'];
    const currentIndex = statuses.indexOf(currentCase.case_status);
    const newIndex = statuses.indexOf(updates.case_status);
    
    if (newIndex !== -1 && newIndex < currentIndex) {
      return next(new AppError('Cannot move case status backwards', 400));
    }
  }

  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return res.status(200).json({ status: 'success', data: currentCase });
  }

  let setString = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const values = keys.map(key => updates[key]);
  values.push(id);
  
  const query = `UPDATE clinical_cases SET ${setString} WHERE case_id = $${values.length} RETURNING *`;
  const { rows } = await pool.query(query, values);

  res.status(200).json({
    status: 'success',
    data: rows[0]
  });
});

export const deleteClinicalCase = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const { rows } = await pool.query("UPDATE clinical_cases SET case_status = 'Deleted' WHERE case_id = $1 RETURNING *", [id]);
  
  if (rows.length === 0) {
    return next(new AppError('No clinical case found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});
