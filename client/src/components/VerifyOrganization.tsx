import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Alert from './alert';
import { Loader, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/Authcontext';

const VerifyOrganization = () => {
  const { checkAuthStatus } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await API.post('/auth/verify-organization', { token });
        if (response.data.success) {
          await checkAuthStatus();
          setSuccess(true);
          setTimeout(() => navigate('/organizer/dashboard'), 3000);
        }
      } catch (error: any) {
        setError(error.response?.data?.message || "Verification failed");
      } finally {
        setLoading(false);
      }
    };

    if (token) verifyToken();
    else {
      setError("Missing verification token");
      setLoading(false);
    }
  }, [token, navigate, checkAuthStatus]);

  const handleResend = async () => {
    try {
      setLoading(true);
      await API.post('/auth/resend-organization-verification', { token });
      setError('');
      setCooldown(30);
      const interval = setInterval(() => {
        setCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to resend verification");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
          <Loader className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Verifying Organization...</h1>
          <p className="text-gray-600">Please wait while we verify your organization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4">
        {success ? (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Successful!</h1>
            <p className="text-gray-600 mb-4">Redirecting to organizer dashboard...</p>
          </>
        ) : (
          <>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
            <Alert type="error" message={error} className="mb-4" />
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || !token}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyOrganization;