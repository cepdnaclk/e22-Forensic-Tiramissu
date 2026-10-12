import express from 'express';
import { createAutopsyCase, getAutopsyCases, getAutopsyCaseById, updateAutopsyCase, releaseBody } from '../controllers/autopsyCases.controller.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAutopsyCases)
  .post(requireRole('doctor', 'clerk', 'lab_staff'), auditLog('autopsy_cases'), createAutopsyCase);

router
  .route('/:id')
  .get(getAutopsyCaseById)
  .put(requireRole('doctor', 'clerk', 'lab_staff'), auditLog('autopsy_cases'), updateAutopsyCase);

router
  .route('/:id/body-release')
  .post(requireRole('doctor', 'clerk', 'lab_staff'), auditLog('body_releases'), releaseBody);

export default router;
