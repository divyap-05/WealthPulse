import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [40, 'Category name cannot exceed 40 characters'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Type (income or expense) is required'],
    },
    icon: {
      type: String,
      default: 'Tag', // Lucide icon identifier
    },
    color: {
      type: String,
      default: '#8B5CF6',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Unique category name per user and type
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;
