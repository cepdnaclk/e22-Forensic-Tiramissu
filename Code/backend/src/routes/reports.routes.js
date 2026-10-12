import express from 'express';
import { generateReport, dispatchReport } from '../controllers/reports.controller.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

router.use(protect);

router.post('/', requireRole('doctor'), auditLog('reports'), generateReport);
router.put('/:id/dispatch', requireRole('doctor', 'clerk'), auditLog('reports'), dispatchReport);

export default router;
