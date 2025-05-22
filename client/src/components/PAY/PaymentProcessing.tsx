import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import LoadingSpinner  from '../components/../AD_co/LoadingSpinner';
import  {PaymentSuccess} from '../PAY/PaymentSuccess';

export const PaymentProcessing = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        await API.get(`/payment/verify?session_id=${sessionId}`);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };

    if (sessionId) verifyPayment();
  }, [sessionId]);

  return (
    <div className="max-w-2xl mx-auto p-6 text-center min-h-[400px] flex items-center justify-center">
      {status === 'loading' && (
        <div className="space-y-4">
          <LoadingSpinner />
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="space-y-4">
          <PaymentSuccess />
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-gray-600">
            Your tickets will be emailed to you shortly
          </p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-red-600 space-y-4">
          <h1 className="text-3xl font-bold">Payment Failed</h1>
          <p>Please try again or contact support</p>
        </div>
      )}
    </div>
  );
};