import express from 'express';
import { createPatient, getPatients, getPatientById, updatePatient } from '../controllers/patients.controller.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { auditLog } from '../middleware/audit.js';
import { validate, patientValidationRules } from '../middleware/validation.js';

const router = express.Router();

router.use(protect); // All patient routes require authentication

router
  .route('/')
  .get(requireRole('super_admin', 'doctor', 'clerk'), getPatients)
  .post(requireRole('doctor', 'clerk'), validate(patientValidationRules()), auditLog('patients'), createPatient);

router
  .route('/:id')
  .get(requireRole('super_admin', 'doctor', 'clerk'), getPatientById)
  .put(requireRole('doctor', 'clerk'), auditLog('patients'), updatePatient);

export default router;
