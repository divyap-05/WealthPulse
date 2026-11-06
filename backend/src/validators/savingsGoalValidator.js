import { z } from 'zod';

export const createSavingsGoalSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Goal name is required').max(100),
    targetAmount: z.number().positive('Target amount must be positive'),
    currentAmount: z.number().min(0).optional(),
    targetDate: z.string().or(z.date()).optional().nullable(),
    color: z.string().optional(),
    icon: z.string().optional(),
  }),
});

export const updateSavingsGoalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    targetAmount: z.number().positive().optional(),
    currentAmount: z.number().min(0).optional(),
    targetDate: z.string().or(z.date()).optional().nullable(),
    color: z.string().optional(),
    icon: z.string().optional(),
    isCompleted: z.boolean().optional(),
  }),
});

export const contributeSavingsGoalSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
  body: z.object({
    amount: z.number().positive('Contribution amount must be positive'),
    action: z.enum(['add', 'withdraw']).default('add'),
  }),
});
