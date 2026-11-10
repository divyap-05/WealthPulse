import mongoose from 'mongoose';

const exchangeSchema = new mongoose.Schema({
  question: { type: String, required: true, maxlength: 1200 },
  reply: { type: String, required: true, maxlength: 6000 },
  createdAt: { type: Date, default: Date.now },
});

const aiChatHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  messages: { type: [exchangeSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('AIChatHistory', aiChatHistorySchema);
