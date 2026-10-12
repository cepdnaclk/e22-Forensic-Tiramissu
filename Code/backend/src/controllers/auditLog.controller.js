import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getAuditLogs = asyncHandler(async (req, res, next) => {
  const { user_id, table_name, action, date_from, date_to, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT a.*, u.username FROM audit_log a LEFT JOIN users u ON a.user_id = u.user_id WHERE 1=1';
  const values = [];
  let paramCount = 1;

  if (user_id) {
    query += ` AND a.user_id = $${paramCount}`;
    values.push(user_id);
    paramCount++;
  }
  if (table_name) {
    query += ` AND a.table_name = $${paramCount}`;
    values.push(table_name);
    paramCount++;
  }
  if (action) {
    query += ` AND a.action = $${paramCount}`;
    values.push(action);
    paramCount++;
  }
  if (date_from) {
    query += ` AND a.timestamp >= $${paramCount}`;
    values.push(date_from);
    paramCount++;
  }
  if (date_to) {
    query += ` AND a.timestamp <= $${paramCount}`;
    values.push(date_to);
    paramCount++;
  }

  const countQuery = `SELECT COUNT(*) FROM (${query}) AS sub`;
  const { rows: countRows } = await pool.query(countQuery, values);
  const total = parseInt(countRows[0].count);

  query += ` ORDER BY a.timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);

  res.status(200).json({
    status: 'success',
    results: rows.length,
    total,
    data: rows
  });
});
