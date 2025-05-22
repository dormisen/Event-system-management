import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import { toast } from 'react-hot-toast';

export const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        await API.get(`/payment/verify?session_id=${sessionId}`);
        toast.success('Payment successful! Tickets are being processed');
      } catch (error) {
        toast.error('Payment verification failed');
      }
    };

    if (sessionId) verifyPayment();
  }, [sessionId]);

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-4">Payment Processing</h1>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
      </div>
    </div>
  );
};