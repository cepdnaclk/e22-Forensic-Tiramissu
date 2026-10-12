import AppError from '../utils/AppError.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by the auth middleware (protect)
    if (!req.user || !allowedRoles.includes(req.user.role_name)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
