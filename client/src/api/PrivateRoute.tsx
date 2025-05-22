import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Authcontext';

interface PrivateRouteProps {
  children: React.ReactElement;
  requiredRole?: 'admin' | 'organizer' | 'user';
}

const PrivateRoute = ({ children, requiredRole }: PrivateRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (requiredRole && user?.role !== requiredRole) {
      navigate('/unauthorized'); // Create an unauthorized page
    }
  }, [isAuthenticated, requiredRole, user, navigate]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  // Special case for organizer verification
  if (requiredRole === 'organizer' && !user?.organizerInfo?.verified) {
    return <Navigate to="/verification-pending" />;
  }

  return children;
};

export default PrivateRoute;