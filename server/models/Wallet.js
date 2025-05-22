import mongoose from 'mongoose';

const WalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true
  },
  pendingBalance: {
    type: Number,
    default: 0
  },
  lastPayout: Date
}, { timestamps: true });

export default mongoose.model('Wallet', WalletSchema);