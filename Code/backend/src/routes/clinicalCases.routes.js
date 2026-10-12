import express from 'express';
import { createClinicalCase, getClinicalCases, getClinicalCaseById, updateClinicalCase, deleteClinicalCase } from '../controllers/clinicalCases.controller.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getClinicalCases) // Case isolation is handled inside controller based on role
  .post(requireRole('doctor', 'clerk'), auditLog('clinical_cases'), createClinicalCase);

router
  .route('/:id')
  .get(getClinicalCaseById) // Isolation handled in controller
  .put(requireRole('doctor', 'clerk'), auditLog('clinical_cases'), updateClinicalCase)
  .delete(requireRole('super_admin'), auditLog('clinical_cases'), deleteClinicalCase);

export default router;
