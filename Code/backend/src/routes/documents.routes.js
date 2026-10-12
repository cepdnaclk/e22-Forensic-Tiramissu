import express from 'express';
import { uploadDocument, getDocuments } from '../controllers/documents.controller.js';
import { protect } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getDocuments)
  .post(auditLog('documents'), uploadDocument);

export default router;
