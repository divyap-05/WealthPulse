import { Router } from 'express';
import { getDashboardSummary, getReportsAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const validDate = z.string().max(40).refine((value) => !Number.isNaN(Date.parse(value)));
const dashboardQuerySchema = z.object({
  query: z.object({
    period: z.enum(['week', 'month', 'year']).optional(),
    startDate: validDate.optional(),
    endDate: validDate.optional(),
  }).refine(({ startDate, endDate }) => Boolean(startDate) === Boolean(endDate), {
    message: 'Provide both startDate and endDate.',
  }),
});
const reportsQuerySchema = z.object({
  query: z.object({ year: z.string().regex(/^(?:202\d|20[3-9]\d|2100)$/).optional() }),
});

const router = Router();
router.use(protect);

router.get('/dashboard', validate(dashboardQuerySchema), getDashboardSummary);
router.get('/reports', validate(reportsQuerySchema), getReportsAnalytics);

export default router;
