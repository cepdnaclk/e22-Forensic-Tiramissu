import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

const generatePmNo = async (doctorCode, caseType = 'PM') => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  const prefix = `${month}.`;
  
  const { rows } = await pool.query(
    "SELECT pm_no FROM autopsy_cases WHERE pm_no LIKE $1 ORDER BY pm_no DESC LIMIT 1",
    [`%/${prefix}%`]
  );
  
  let sequence = 1;
  let serial = 1;
  if (rows.length > 0) {
    const lastNo = rows[0].pm_no;
    const match = lastNo.match(/^(\d+)\/(\d{2})\.(\d+)\s(.*)$/);
    if (match) {
        serial = parseInt(match[1]) + 1;
        sequence = parseInt(match[3]) + 1;
    }
  }
  
  return `${serial}/${month}.${sequence} ${caseType} ${doctorCode || 'UNKN'}`;
};

export const createAutopsyCase = asyncHandler(async (req, res, next) => {
  const { patient_id, morgue_no, inquest_no, case_no, police_station_id, police_officer_name, police_contact_no, pm_date, place_of_pm, date_of_death, time_of_death, verdict, case_type_code, doctor_code } = req.body;

  if (!patient_id) {
    return next(new AppError('patient_id is required', 400));
  }
  
  const examining_doctor_id = req.user.user_id; 
  const pm_no = await generatePmNo(doctor_code || req.user.username, case_type_code || 'PM');

  const query = `
    INSERT INTO autopsy_cases (
      pm_no, patient_id, morgue_no, inquest_no, case_no, 
      police_station_id, police_officer_name, police_contact_no, 
      examining_doctor_id, pm_date, place_of_pm, date_of_death, time_of_death, verdict, created_by
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    ) RETURNING *;
  `;
  
  const values = [
    pm_no, patient_id, morgue_no, inquest_no, case_no,
    police_station_id, police_officer_name, police_contact_no,
    examining_doctor_id, pm_date, place_of_pm, date_of_death, time_of_death, verdict, req.user.user_id
  ];

  const { rows } = await pool.query(query, values);

  res.status(201).json({
    status: 'success',
    data: rows[0]
  });
});

export const getAutopsyCases = asyncHandler(async (req, res, next) => {
  const { status, doctor_id, date_from, date_to, search, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT c.*, p.full_name AS patient_name, 
    CASE WHEN br.release_id IS NOT NULL THEN 'Released' ELSE 'Not Released' END as body_release_status 
    FROM autopsy_cases c 
    JOIN patients p ON c.patient_id = p.patient_id 
    LEFT JOIN body_releases br ON c.case_id = br.case_id
    WHERE 1=1
  `;
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

  if (search) {
    query += ` AND (c.pm_no ILIKE $${paramCount} OR p.full_name ILIKE $${paramCount})`;
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

export const getAutopsyCaseById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const { rows } = await pool.query('SELECT * FROM autopsy_cases WHERE case_id = $1', [id]);

  if (rows.length === 0) {
    return next(new AppError('No autopsy case found with that ID', 404));
  }

  const autopsyCase = rows[0];

  if (req.user.role_name === 'doctor' && autopsyCase.examining_doctor_id !== req.user.user_id) {
    return next(new AppError('You do not have permission to access this case', 403));
  }
  
  const { rows: exam } = await pool.query('SELECT * FROM autopsy_examinations WHERE autopsy_case_id = $1', [id]);
  const { rows: cod } = await pool.query('SELECT * FROM cause_of_death WHERE case_id = $1', [id]);
  const { rows: br } = await pool.query('SELECT * FROM body_releases WHERE case_id = $1', [id]);
  const { rows: investigations } = await pool.query("SELECT * FROM investigations WHERE case_type = 'autopsy' AND case_id = $1", [id]);
  const { rows: documents } = await pool.query("SELECT * FROM documents WHERE case_type = 'autopsy' AND case_id = $1 AND is_current = TRUE", [id]);
  
  autopsyCase.autopsy_examination = exam[0] || null;
  autopsyCase.cause_of_death = cod[0] || null;
  autopsyCase.body_release = br[0] || null;
  autopsyCase.investigations = investigations;
  autopsyCase.documents = documents;

  res.status(200).json({
    status: 'success',
    data: autopsyCase
  });
});

export const updateAutopsyCase = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;
  
  const { rows: existing } = await pool.query('SELECT c.*, br.release_id FROM autopsy_cases c LEFT JOIN body_releases br ON c.case_id = br.case_id WHERE c.case_id = $1', [id]);
  
  if (existing.length === 0) {
    return next(new AppError('No autopsy case found with that ID', 404));
  }

  const currentCase = existing[0];
  const isReleased = currentCase.release_id !== null;

  if (req.user.role_name === 'lab_staff' && isReleased) {
    return next(new AppError('Lab staff cannot modify case after body is released', 403));
  }

  if (updates.case_status && currentCase.case_status) {
    const STATUS_ORDER = { 'Open': 1, 'Report Generated': 2, 'Closed': 3 };
    if (STATUS_ORDER[updates.case_status] < STATUS_ORDER[currentCase.case_status]) {
      return next(new AppError('Cannot move case status backwards', 400));
    }
  }

  const keys = Object.keys(updates);
  if (keys.length === 0) {
    delete currentCase.release_id;
    return res.status(200).json({ status: 'success', data: currentCase });
  }

  let setString = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const values = keys.map(key => updates[key]);
  values.push(id);
  
  const query = `UPDATE autopsy_cases SET ${setString} WHERE case_id = $${values.length} RETURNING *`;
  const { rows } = await pool.query(query, values);

  res.status(200).json({
    status: 'success',
    data: rows[0]
  });
});

export const releaseBody = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { nok_name, nok_relationship, nok_nic, nok_contact, release_date, release_time, releasing_tech, dc_no, cemetery } = req.body;

  try {
    const query = `
      INSERT INTO body_releases (case_id, nok_name, nok_relationship, nok_nic, nok_contact, release_date, release_time, releasing_tech, dc_no, cemetery)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [id, nok_name, nok_relationship, nok_nic, nok_contact, release_date, release_time, releasing_tech, dc_no, cemetery];
    
    const { rows } = await pool.query(query, values);
    
    res.status(201).json({
      status: 'success',
      data: rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
       return next(new AppError('Body already released for this case', 409));
    }
    next(err);
  }
});
