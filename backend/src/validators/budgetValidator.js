import { z } from 'zod';

export const createBudgetSchema = z.object({
  body: z.object({
    category: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    amount: z.number().positive('Budget amount must be positive'),
    month: z.number().min(1).max(12),
    year: z.number().min(2020).max(2100),
    alertThreshold: z.number().min(1).max(100).optional(),
  }),
});

export const updateBudgetSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
  body: z.object({
    amount: z.number().positive().optional(),
    alertThreshold: z.number().min(1).max(100).optional(),
  }),
});

export const getBudgetsQuerySchema = z.object({
  query: z.object({
    month: z.string().regex(/^(?:[1-9]|1[0-2])$/).optional(),
    year: z.string().regex(/^(?:202\d|20[3-9]\d|2100)$/).optional(),
  }),
});
