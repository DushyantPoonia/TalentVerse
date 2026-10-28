import { Router } from 'express';
import { createAssessment, getAssessment, getProgress, listAssessments, updateProgress } from '../controllers/assessmentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);
router.post('/', createAssessment);
router.get('/', listAssessments);
router.get('/:id/progress', getProgress);
router.put('/:id/progress', updateProgress);
router.get('/:id', getAssessment);
export default router;
