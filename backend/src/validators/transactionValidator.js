import { z } from 'zod';

const dateValue = z.union([
  z.date(),
  z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date'),
]);

export const createTransactionSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(100),
    amount: z.number().positive('Amount must be positive in rupees'),
    type: z.enum(['income', 'expense']),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    paymentMethod: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid payment method ID').optional().nullable(),
    date: dateValue.optional(),
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
    date: dateValue.optional(),
    note: z.string().max(500).optional().nullable(),
  }),
});

export const getTransactionsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^[1-9]\d{0,3}$/).optional(),
    limit: z.string().regex(/^\d{1,3}$/).optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    paymentMethod: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    search: z.string().max(100).optional(),
    startDate: z.string().refine((value) => !Number.isNaN(Date.parse(value))).optional(),
    endDate: z.string().refine((value) => !Number.isNaN(Date.parse(value))).optional(),
    sortBy: z.enum(['date', 'amount', 'title']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});
