import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    amount: z.number().positive('Amount must be positive in rupees'),
    type: z.enum(['income', 'expense']),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    paymentMethod: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment method ID').optional().nullable(),
    date: z.string().or(z.date()).optional(),
    note: z.string().max(500).optional().nullable(),
  }),
});

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid transaction ID'),
  }),
  body: z.object({
    title: z.string().min(1).max(100).optional(),
    amount: z.number().positive().optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    paymentMethod: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    date: z.string().or(z.date()).optional(),
    note: z.string().max(500).optional().nullable(),
  }),
});

export const getTransactionsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().optional(),
    paymentMethod: z.string().optional(),
    search: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['date', 'amount', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});
