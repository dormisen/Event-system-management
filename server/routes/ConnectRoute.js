//ConnectRoute.js
import express from 'express';
import User from '../models/User.js';
import Stripe from 'stripe';
import authMiddleware from '../Midleware/Authmidleware.js';
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// Middleware to verify organizer status
const verifyOrganizer = async (req, res, next) => {
  try {
    console.log('Verifying organizer:', req.user?.id);
    
    if (!req.user) {
      console.log('No user in request');
      return res.status(401).json({ msg: "Not authenticated" });
    }

    const user = await User.findById(req.user.id);
    
    console.log('Found user:', {
      id: user?.id,
      role: user?.role,
      verified: user?.organizerInfo?.verified
    });

    if (!user || user.role !== 'organizer') {
      console.log('User is not organizer');
      return res.status(403).json({ msg: "Organizer access required" });
    }

    next();
  } catch (error) {
    console.error("Organizer verification error:", error);
    res.status(500).json({ msg: "Server error" });
  }
};
// Enhanced onboarding flow
router.get('/onboard-organizer', authMiddleware, verifyOrganizer, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.organizerInfo.stripeAccountId) {
      const accountLink = await stripe.accountLinks.create({
        account: user.organizerInfo.stripeAccountId,
        refresh_url: `${process.env.CLIENT_URL}/organizer/onboard`,
        return_url: `${process.env.CLIENT_URL}/organizer/dashboard`,
        type: 'account_onboarding',
      });
      return res.json({ url: accountLink.url });
    }

    const account = await stripe.accounts.create({
      type: 'express',
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual'
          }
        }
      }
    });

    await User.findByIdAndUpdate(req.user.id, {
      'organizerInfo.stripeAccountId': account.id,
      'organizerInfo.stripeAccountStatus': 'pending'
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.CLIENT_URL}/organizer/dashboard`,
      return_url: `${process.env.CLIENT_URL}/organizer/dashboard`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe onboarding error:', error);
    res.status(500).json({ error: 'Failed to create Stripe account' });
  }
});
export default router;