import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(asyncHandler(requireAuth));
router.get('/', asyncHandler(getProfile));
router.patch('/', asyncHandler(updateProfile));
export default router;
