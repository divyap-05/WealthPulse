import { Router } from 'express';
import {
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  contributeSavingsGoal,
  deleteSavingsGoal,
} from '../controllers/savingsGoalController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  contributeSavingsGoalSchema,
} from '../validators/savingsGoalValidator.js';

const router = Router();
router.use(protect);

router.get('/', getSavingsGoals);
router.post('/', validate(createSavingsGoalSchema), createSavingsGoal);
router.put('/:id', validate(updateSavingsGoalSchema), updateSavingsGoal);
router.post('/:id/contribute', validate(contributeSavingsGoalSchema), contributeSavingsGoal);
router.delete('/:id', deleteSavingsGoal);

export default router;
