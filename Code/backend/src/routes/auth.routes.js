import express from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

router.post('/login', login);

// Only Super Admin can register new users in the system, or maybe clerk?
// Let's restrict to super_admin or we can leave it open for now based on requirements.
// The prompt said 'clerk cannot create a user with super_admin role'.
// Let's protect the register route and add custom logic or just restrict it.
router.post('/register', protect, requireRole('super_admin'), register);

export default router;
