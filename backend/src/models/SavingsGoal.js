import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      maxlength: [100, 'Goal name cannot exceed 100 characters'],
    },
    targetAmount: {
      type: Number, // In paise
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least 1 paisa'],
    },
    currentAmount: {
      type: Number, // In paise
      default: 0,
      min: 0,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    color: {
      type: String,
      default: '#22C55E', // Emerald green
    },
    icon: {
      type: String,
      default: 'Target',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

savingsGoalSchema.index({ user: 1, isCompleted: 1 });

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);
export default SavingsGoal;
