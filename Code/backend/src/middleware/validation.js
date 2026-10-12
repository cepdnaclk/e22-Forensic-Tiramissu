import { body, validationResult } from 'express-validator';
import AppError from '../utils/AppError.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors nicely
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

    return next(new AppError('Validation Failed: ' + JSON.stringify(extractedErrors), 400));
  };
};

export const patientValidationRules = () => {
  return [
    body('full_name').notEmpty().withMessage('Full name is required').isLength({ max: 255 }).withMessage('Full name cannot exceed 255 characters'),
    body('nic').optional().isLength({ max: 20 }).withMessage('NIC cannot exceed 20 characters'),
    body('sex').optional().isIn(['Male', 'Female', 'Unknown']).withMessage('Sex must be Male, Female, or Unknown'),
    body('address').optional().isLength({ max: 500 }).withMessage('Address is too long')
  ];
};

export const autopsyValidationRules = () => {
  return [
    body('patient_id').notEmpty().withMessage('patient_id is required').isInt().withMessage('patient_id must be an integer'),
    body('case_status').optional().isIn(['Open', 'Report Generated', 'Closed']).withMessage('Invalid status')
  ];
};
