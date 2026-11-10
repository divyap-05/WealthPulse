import { Router } from 'express';
import { askFinancialCoach, scanReceiptText } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { chatSchema, receiptScanSchema } from '../validators/aiValidator.js';

const router = Router();
router.use(protect);
router.post('/chat', aiLimiter, validate(chatSchema), askFinancialCoach);
router.post('/receipt/scan', aiLimiter, validate(receiptScanSchema), scanReceiptText);

export default router;
