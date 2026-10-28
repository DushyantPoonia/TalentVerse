import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', asyncHandler(requireAuth), asyncHandler(me));
export default router;
