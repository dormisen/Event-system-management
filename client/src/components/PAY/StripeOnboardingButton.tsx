import { loadStripe } from '@stripe/stripe-js';
import API from '../../api/axios';
import { EventType } from '../../assets/types';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface TicketCheckoutProps {
  event: EventType;
  selectedTickets: { id: string; quantity: number; }[];
}



export const TicketCheckout = ({ event, selectedTickets }: TicketCheckoutProps) => {
  const handleCheckout = async () => {
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      const session = await API.post('/payment/create-checkout-session', {
        eventId: event._id,
        tickets: selectedTickets
      });

      const result = await stripe.redirectToCheckout({
        sessionId: session.data.id
      });

      if (result.error) {
        console.error(result.error.message);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <button 
      onClick={handleCheckout}
      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
    >
      Proceed to Payment
    </button>
  );
};