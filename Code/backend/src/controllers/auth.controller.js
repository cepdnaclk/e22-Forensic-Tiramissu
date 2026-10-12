import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

const signToken = (user_id) => {
  return jwt.sign({ user_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.user_id);

  // Remove password from output
  user.password_hash = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const register = asyncHandler(async (req, res, next) => {
  const { username, password, full_name, role_id } = req.body;

  if (!username || !password || !full_name || !role_id) {
    return next(new AppError('Please provide all required fields', 400));
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  try {
    const { rows } = await pool.query(
      'INSERT INTO users (username, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4) RETURNING user_id, username, full_name, role_id, is_active',
      [username, passwordHash, full_name, role_id]
    );

    createSendToken(rows[0], 201, res);
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return next(new AppError('Username already exists', 400));
    }
    next(err);
  }
});

export const login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Please provide username and password!', 400));
  }

  const { rows } = await pool.query(
    `SELECT u.*, r.role_name 
     FROM users u 
     JOIN roles r ON u.role_id = r.role_id 
     WHERE u.username = $1 AND u.is_active = TRUE`,
    [username]
  );

  if (rows.length === 0) {
    return next(new AppError('Incorrect username or password', 401));
  }

  const user = rows[0];
  const isCorrect = await bcrypt.compare(password, user.password_hash);

  if (!isCorrect) {
    return next(new AppError('Incorrect username or password', 401));
  }

  createSendToken(user, 200, res);
});
