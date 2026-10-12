import express from 'express';
import { createCourtRecord, getCourtRecords } from '../controllers/courtRecords.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getCourtRecords)
  .post(createCourtRecord);

export default router;
