import RecurringTransaction from '../models/RecurringTransaction.js';
import Transaction from '../models/Transaction.js';

export const calculateNextDueDate = (currentDueDate, frequency) => {
  const next = new Date(currentDueDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
};

/**
 * Checks all active recurring items and generates transactions up to current date.
 * Idempotent with safeguards against duplicate generation.
 */
export const processRecurringTransactions = async (userId = null) => {
  const now = new Date();
  const query = {
    status: 'active',
    nextDueDate: { $lte: now },
  };

  if (userId) {
    query.user = userId;
  }

  const items = await RecurringTransaction.find(query);
  let generatedCount = 0;

  for (const item of items) {
    // Check if end date passed
    if (item.endDate && item.nextDueDate > item.endDate) {
      item.status = 'cancelled';
      await item.save();
      continue;
    }

    // Duplicate check: Check if transaction already exists for this recurring ref and exact date
    const startOfDay = new Date(item.nextDueDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(item.nextDueDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingTx = await Transaction.findOne({
      user: item.user,
      recurringRef: item._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!existingTx) {
      await Transaction.create({
        user: item.user,
        title: item.title,
        amount: item.amount,
        type: item.type,
        category: item.category,
        paymentMethod: item.paymentMethod,
        date: item.nextDueDate,
        note: `Generated from recurring rule (${item.frequency}). ${item.note || ''}`.trim(),
        isRecurring: true,
        recurringRef: item._id,
      });
      generatedCount++;
    }

    // Advance next due date
    item.lastGeneratedDate = item.nextDueDate;
    item.nextDueDate = calculateNextDueDate(item.nextDueDate, item.frequency);

    if (item.endDate && item.nextDueDate > item.endDate) {
      item.status = 'cancelled';
    }

    await item.save();
  }

  return { processed: items.length, generated: generatedCount };
};
