import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Payment method name is required'],
      trim: true,
      maxlength: [40, 'Payment method name cannot exceed 40 characters'],
    },
    icon: {
      type: String,
      default: 'CreditCard',
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

paymentMethodSchema.index({ user: 1, name: 1 }, { unique: true });

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
export default PaymentMethod;
