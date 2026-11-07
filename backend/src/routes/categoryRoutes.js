import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import {
  getPaymentMethods,
  createPaymentMethod,
  deletePaymentMethod,
} from '../controllers/paymentMethodController.js';
import { protect, blockDemoWrites } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCategorySchema,
  updateCategorySchema,
  createPaymentMethodSchema,
} from '../validators/categoryValidator.js';

const router = Router();
router.use(protect);
router.use(blockDemoWrites);

// Categories
router.get('/categories', getCategories);
router.post('/categories', validate(createCategorySchema), createCategory);
router.put('/categories/:id', validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);

// Payment Methods
router.get('/payment-methods', getPaymentMethods);
router.post('/payment-methods', validate(createPaymentMethodSchema), createPaymentMethod);
router.delete('/payment-methods/:id', deletePaymentMethod);

export default router;
