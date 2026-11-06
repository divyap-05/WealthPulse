import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // If category is null, it acts as an overall monthly budget
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    amount: {
      type: Number, // In paise
      required: [true, 'Budget limit amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    month: {
      type: Number, // 1-12
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number, // e.g. 2026
      required: true,
    },
    alertThreshold: {
      type: Number, // Percentage, e.g. 80 for 80%
      default: 80,
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// One budget per user, category (or null for overall), month, year
budgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
