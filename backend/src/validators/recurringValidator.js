import { z } from 'zod';

export const createRecurringSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    amount: z.number().positive('Amount must be positive'),
    type: z.enum(['income', 'expense']),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/),
    paymentMethod: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional().nullable(),
    note: z.string().max(500).optional().nullable(),
  }),
});

export const updateRecurringSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/),
  }),
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    amount: z.number().positive().optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    paymentMethod: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional().nullable(),
    status: z.enum(['active', 'paused', 'cancelled']).optional(),
    note: z.string().max(500).optional().nullable(),
  }),
});
