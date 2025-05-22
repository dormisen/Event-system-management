import Stripe from 'stripe';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Wallet from '../models/Wallet.js';
import 'dotenv/config';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
  apiVersion: '2024-04-10' 
});

class PaymentService {
  static async calculatePlatformFee(totalCents) {
    return Math.round(totalCents * 0.10); 
  }

  static async calculateTotalAmount(tickets, event) {
    return tickets.reduce((total, { id, quantity }) => {
      const ticket = event.tickets.find(t => t._id.toString() === id);
      if (!ticket) throw new Error('Invalid ticket');
      if (ticket.quantity < quantity) {
        throw new Error(`Only ${ticket.quantity} tickets available`);
      }
      return total + (ticket.price * 100 * quantity);
    }, 0);
  }

  static async createPaymentIntent(userId, eventId, tickets) {
  const event = await Event.findById(eventId)
    .populate({
      path: 'organizer',
      select: 'organizerInfo.stripeAccountId'
    });

  if (!event?.organizer?.organizerInfo?.stripeAccountId) {
    throw new Error('Organizer has not set up Stripe account');
  }
  if (!event) throw new Error('Event not found');
  if (!event.organizer) throw new Error('Organizer not found');
  
    const totalAmountCents = await this.calculateTotalAmount(tickets, event);
    const applicationFee = await this.calculatePlatformFee(totalAmountCents);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency: 'usd',
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: event.organizer.organizerInfo.stripeAccountId,
      },
      metadata: {
        eventId: eventId.toString(),
        userId: userId.toString(),
        tickets: JSON.stringify(tickets),
      },
    });

    await Transaction.create({
      user: userId,
      amount: totalAmountCents / 100,
      type: 'payment',
      status: 'pending',
      event: eventId,
      stripePaymentIntentId: paymentIntent.id,
      metadata: {
        eventTitle: event.title,
        ticketCount: tickets.reduce((sum, t) => sum + t.quantity, 0),
        organizerId: event.organizer._id
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  }

  static async handleWebhookEvent(event) {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const metadata = paymentIntent.metadata;

      await this.handleSuccessfulPayment(
        paymentIntent.id,
        metadata.userId,
        metadata.organizerId,
        paymentIntent.amount,
        metadata.eventId
      );
    }
  }

  static async handleSuccessfulPayment(paymentIntentId, userId, organizerId, amount, eventId) {
    const platformFee = await this.calculatePlatformFee(amount);
    const organizerAmount = (amount - platformFee) / 100;

    await Promise.all([
      Transaction.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        { status: 'completed' }
      ),
      Wallet.findOneAndUpdate(
        { user: organizerId },
        { $inc: { balance: organizerAmount } },
        { upsert: true }
      )
    ]);

    return { success: true };
  }

  static async processPayout(userId, amount) {
    const MIN_PAYOUT = 50;
    const user = await User.findById(userId);
    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) throw new Error('Wallet not found');
    if (wallet.balance < MIN_PAYOUT) {
      throw new Error(`Minimum payout is $${MIN_PAYOUT}`);
    }
    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }
    if (!user?.organizerInfo?.stripeAccountId) {
      throw new Error('Stripe account not setup');
    }

    const payout = await stripe.payouts.create({
      amount: amount * 100,
      currency: 'usd',
      destination: user.organizerInfo.stripeAccountId,
    });

    await Promise.all([
      Wallet.updateOne(
        { user: userId },
        { $inc: { balance: -amount } }
      ),
      Transaction.create({
        user: userId,
        amount,
        type: 'payout',
        status: 'completed',
        stripePayoutId: payout.id,
        metadata: { payoutMethod: "stripe" }
      })
    ]);

    return { payoutId: payout.id };
  }

  static async verifyPayment(sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    if (session.payment_status === 'paid') {
      const { eventId, tickets } = session.metadata;
      const ticketsPurchased = JSON.parse(tickets);

      const updateOperations = ticketsPurchased.map(({ id, quantity }) => ({
        updateOne: {
          filter: { "_id": eventId, "tickets._id": id },
          update: { $inc: { "tickets.$.quantity": -quantity } }
        }
      }));

      await Event.bulkWrite(updateOperations);
      return { success: true };
    }

    throw new Error('Payment not completed');
  }
}

export default PaymentService;