import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Alert from './alert';
import { Loader } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  id?: string;
  email?: string;
  exp?: number;
}

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenExpired, setTokenExpired] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState('');
  
  const rawToken = searchParams.get('token');
  const token = rawToken ? decodeURIComponent(rawToken) : null;

  useEffect(() => {
    if (!token) {
      setError("Missing verification token");
      setLoading(false);
      return;
    }
  
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      if (!decoded?.email) {
        throw new Error('Token missing email');
      }
      setEmail(decoded.email);
    } catch (error) {
      console.error('Token decoding failed:', error);
      setError('Invalid verification token format');
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !email) return;

      try {
        const response = await API.post('/auth/verify-email', { token });
        
        if (response.data.success) {
          navigate('/login', { 
            state: { 
              success: "Email verified successfully! You can now login.",
              email: email
            },
            replace: true
          });
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        const serverMessage = error.response?.data?.message;
        const expired = serverMessage?.includes('expired') || error.response?.data?.tokenExpired;
        
        setError(serverMessage || "Verification failed. Please try again.");
        setTokenExpired(expired);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [email, token, navigate]);

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      setError('');
      await API.post('/auth/send-verification-email', { email });
      setSuccessMessage('A new verification email has been sent. Please check your inbox.');
      setCooldown(30);
      const interval = setInterval(() => {
        setCooldown(prev => prev > 0 ? prev - 1 : 0);
        if (cooldown <= 0) clearInterval(interval);
      }, 1000);
    } catch (error: any) {
      setError(error.response?.data?.msg || "Failed to resend verification email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
          <Loader className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Verifying your email...</h1>
          <p className="text-gray-600">Please wait while we confirm your email address.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
        {error ? (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
            <Alert type="error" message={error} className="mb-4" />
          </>
        ) : successMessage ? (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Sent!</h1>
            <Alert type="success" message={successMessage} className="mb-4" />
          </>
        ) : null}

        {tokenExpired ? (
          <button
            onClick={handleResendVerification}
            disabled={cooldown > 0 || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
          >
            Return to Login
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;