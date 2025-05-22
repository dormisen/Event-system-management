// pages/PaymentSuccess.tsx
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import API from '../../api/axios';
import { Link } from 'react-router-dom';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        await API.get(`/payment/verify?session_id=${sessionId}`);
        toast.success('Payment successful!');
      } catch (error) {
        toast.error('Payment verification failed');
      }
    };
    
    if (sessionId) verifyPayment();
  }, [sessionId]);

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
      <p className="text-lg mb-6">
        Thank you for your purchase. Your tickets will be emailed to you shortly.
      </p>
      <Link 
        to="/events" 
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
      >
        Browse More Events
      </Link>
    </div>
  );
};