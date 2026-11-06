import Category from '../models/Category.js';
import PaymentMethod from '../models/PaymentMethod.js';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_PAYMENT_METHODS,
} from '../utils/defaults.js';

export const seedUserDefaults = async (userId) => {
  const incomeDocs = DEFAULT_INCOME_CATEGORIES.map((cat) => ({
    ...cat,
    type: 'income',
    user: userId,
    isDefault: true,
  }));

  const expenseDocs = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
    ...cat,
    type: 'expense',
    user: userId,
    isDefault: true,
  }));

  const paymentDocs = DEFAULT_PAYMENT_METHODS.map((pm) => ({
    ...pm,
    user: userId,
    isDefault: true,
  }));

  await Promise.all([
    Category.insertMany([...incomeDocs, ...expenseDocs]),
    PaymentMethod.insertMany(paymentDocs),
  ]);
};
