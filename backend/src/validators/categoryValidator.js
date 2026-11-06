import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(40),
    type: z.enum(['income', 'expense']),
    icon: z.string().optional(),
    color: z.string().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(40).optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
  }),
});

export const createPaymentMethodSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(40),
    icon: z.string().optional(),
  }),
});
