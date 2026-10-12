import express from 'express';
import { getAuditLogs } from '../controllers/auditLog.controller.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/', requireRole('super_admin'), getAuditLogs);

export default router;
