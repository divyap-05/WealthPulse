import { Router } from 'express';
import { getDashboardSummary, getReportsAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/dashboard', getDashboardSummary);
router.get('/reports', getReportsAnalytics);

export default router;
