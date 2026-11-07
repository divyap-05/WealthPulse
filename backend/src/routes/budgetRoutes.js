import { Router } from 'express';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../controllers/budgetController.js';
import { protect, blockDemoWrites } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createBudgetSchema, updateBudgetSchema, getBudgetsQuerySchema } from '../validators/budgetValidator.js';

const router = Router();
router.use(protect);
router.use(blockDemoWrites);

router.get('/', validate(getBudgetsQuerySchema), getBudgets);
router.post('/', validate(createBudgetSchema), createBudget);
router.put('/:id', validate(updateBudgetSchema), updateBudget);
router.delete('/:id', deleteBudget);

export default router;
