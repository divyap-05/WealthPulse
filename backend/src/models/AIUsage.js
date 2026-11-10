import mongoose from 'mongoose';

const aiUsageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: Date, required: true },
  chatRequests: { type: Number, default: 0 },
  scanRequests: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
});

aiUsageSchema.index({ user: 1, day: 1 }, { unique: true });
aiUsageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('AIUsage', aiUsageSchema);
