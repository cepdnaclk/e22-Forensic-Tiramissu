import express from 'express';
import { createInvestigation, updateInvestigation, getOverdueInvestigations } from '../controllers/investigations.controller.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(requireRole('doctor', 'clerk', 'lab_staff'), auditLog('investigations'), createInvestigation)
  .get(getOverdueInvestigations);

router
  .route('/:id')
  .put(requireRole('doctor', 'clerk', 'lab_staff'), auditLog('investigations'), updateInvestigation);

export default router;
