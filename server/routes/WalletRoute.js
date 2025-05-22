import express from 'express';
import authMiddleware from '../Midleware/Authmidleware.js';
import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

  
// Get wallet balance
router.get('/wallet', authMiddleware, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });
    res.json({ balance: wallet?.balance || 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transactions
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;