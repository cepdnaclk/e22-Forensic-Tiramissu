import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateTestToken = (userId, roleName) => {
  return jwt.sign({ user_id: userId, role_name: roleName }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
};
