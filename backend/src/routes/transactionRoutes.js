import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';
import { protect, blockDemoWrites } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
} from '../validators/transactionValidator.js';

const router = Router();

router.use(protect); // All transaction endpoints require authenticated user
router.use(blockDemoWrites);

router.get('/', validate(getTransactionsQuerySchema), getTransactions);
router.get('/:id', getTransactionById);
router.post('/', validate(createTransactionSchema), createTransaction);
router.put('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
