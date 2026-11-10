import { z } from 'zod';

export const chatSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, 'Enter a question.').max(1200, 'Keep your question under 1,200 characters.'),
  }),
});

export const receiptScanSchema = z.object({
  body: z.object({
    text: z.string().trim().min(10, 'No readable receipt text was found.').max(12000, 'The document text is too long to scan.'),
  }),
});
