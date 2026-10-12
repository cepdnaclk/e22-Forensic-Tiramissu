import express from 'express';
import { getStats, getMyCases } from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/my-cases', getMyCases);

export default router;
