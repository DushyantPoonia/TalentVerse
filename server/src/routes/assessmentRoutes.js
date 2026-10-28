import { Router } from 'express';
import { createAssessment, getAssessment, getProgress, listAssessments, updateProgress } from '../controllers/assessmentController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(asyncHandler(requireAuth));
router.post('/', asyncHandler(createAssessment));
router.get('/', asyncHandler(listAssessments));
router.get('/:id/progress', asyncHandler(getProgress));
router.put('/:id/progress', asyncHandler(updateProgress));
router.get('/:id', asyncHandler(getAssessment));
export default router;
