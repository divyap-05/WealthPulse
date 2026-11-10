import { Router } from 'express';
import { askFinancialCoach, scanReceiptText } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { chatSchema, receiptScanSchema } from '../validators/aiValidator.js';

const router = Router();
router.use(protect);
const blockDemoAI = (req, res, next) => {
  if (req.user?.isDemo) {
    return res.status(403).json({ success: false, message: 'AI services are disabled for demo accounts.' });
  }
  next();
};

router.post('/chat', blockDemoAI, aiLimiter, validate(chatSchema), askFinancialCoach);
router.post('/receipt/scan', blockDemoAI, aiLimiter, validate(receiptScanSchema), scanReceiptText);

export default router;
