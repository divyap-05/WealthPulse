import { Router } from 'express';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
} from '../controllers/recurringController.js';
import { protect, blockDemoWrites } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createRecurringSchema, updateRecurringSchema } from '../validators/recurringValidator.js';

const router = Router();
router.use(protect);
router.use(blockDemoWrites);

router.get('/', getRecurringTransactions);
router.post('/', validate(createRecurringSchema), createRecurringTransaction);
router.put('/:id', validate(updateRecurringSchema), updateRecurringTransaction);
router.delete('/:id', deleteRecurringTransaction);

export default router;
