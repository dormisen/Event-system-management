import express from 'express';
import { body } from 'express-validator';
import authMiddleware from '../Midleware/Authmidleware.js';
import rateLimit from 'express-rate-limit';
import PaymentService from '../services/paymentService.js';

const router = express.Router();

const validatePaymentIntent = [
  body('eventId').isMongoId(),
  body('tickets').isArray({ min: 1 }),
  body('tickets.*.id').isMongoId(),
  body('tickets.*.quantity').isInt({ min: 1 })
];

router.post('/create-payment-intent', authMiddleware, validatePaymentIntent, async (req, res) => {
  try {
    const { clientSecret } = await PaymentService.createPaymentIntent(
      req.user.id,
      req.body.eventId,
      req.body.tickets,
    );
    res.json({ clientSecret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
    
    await PaymentService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

const payoutLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3 
});

router.post('/payout', authMiddleware, payoutLimiter, async (req, res) => {
  try {
    const { payoutId } = await PaymentService.processPayout(
      req.user.id,
      req.body.amount
    );
    res.json({ success: true, payoutId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/verify', async (req, res) => {
  try {
    await PaymentService.verifyPayment(req.query.session_id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;