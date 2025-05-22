import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { User, AuthContextType as IAuthContext, OrganizerInfo } from '../assets/types';
import debounce from 'lodash.debounce';

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();


const _checkAuthStatus = async (
  setUser: React.Dispatch<React.SetStateAction<User | null>>,
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    const res = await API.get('/auth/me');
    const userData = res.data.user;

    setUser({
      ...userData,
      role: userData.role,
      organizerInfo: {
        ...userData.organizerInfo,
        stripeAccountId: userData.organizerInfo?.stripeAccountId,
        stripeAccountStatus: userData.organizerInfo?.stripeAccountStatus
      }
    });
    setIsAuthenticated(true);
  } catch {
    setUser(null);
    setIsAuthenticated(false);
  }
};

const debouncedCheckAuthStatus = debounce(_checkAuthStatus, 500); 

const checkAuthStatus = async () => {
  return new Promise<void>((resolve) => {
    debouncedCheckAuthStatus(setUser, setIsAuthenticated);
    resolve();
  });
};
 useEffect(() => {
  const checkStripeStatus = async () => {
    if (user?.role === 'organizer') {
      await checkAuthStatus();
    }
  };
  checkStripeStatus();
  
}, [navigate]); 
useEffect(() => {
  return () => {
    debouncedCheckAuthStatus.cancel();
  };
}, []);
useEffect(() => {
  checkAuthStatus();
}, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await API.post('/auth/login', { email, password }, { withCredentials: true });
      setUser(res.data.user);
      setIsAuthenticated(true);
      setError(null);
      navigate('/');
    } catch (error: any) {
      setError(error.response?.data?.msg || 'Login failed');
      throw error;
    }
  };

 // In Authcontext.tsx's logout function
const logout = async () => {
  try {
    await API.post('/auth/logout');
  } finally {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authState');
    window.location.reload(); // Force reload to clear cookies
    navigate('/login');
  }
};

  const refreshToken = async () => {
  try {
    await API.post('/auth/refresh-token', {}, { 
      withCredentials: true 
    });
    await checkAuthStatus();
  } catch (error) {
    logout();
  }
};

// Update the upgradeToOrganizer function
const upgradeToOrganizer = async (organizerData: Omit<OrganizerInfo, 'createdAt'>) => {
  try {
    const res = await API.post('/auth/upgrade-to-organizer', organizerData);
    setUser(prev => prev ? {
      ...prev,
    
      organizerInfo: {
        ...res.data.organizerInfo,
        verified: false
      }
    } : null);
    return res.data;
  } catch (error: any) {
    setError(error.response?.data?.msg || 'Organization registration failed');
    throw error;
  }
};
const isVerifiedOrganizer = (user?.role === 'organizer' && 
  user?.organizerInfo?.stripeAccountStatus === 'verified') || false;
  const verifyEmail = async () => {
    try {
      const res = await API.post('/auth/send-verification-email', {}, { withCredentials: true });
      return res.data;
    } catch (error: any) {
      setError(error.response?.data?.msg || 'Failed to send verification email');
      throw error;
    }
  };

  const confirmEmailVerification = async (token: string) => {
    try {
      const response = await API.post('/auth/verify-email', { token });
      
      if (response.data.success) {
        setUser(prev => prev ? { 
          ...prev, 
          isVerified: true 
        } : null);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Verification error:', error.response?.data || error.message);
      throw error;
    }
  };
return (
  <AuthContext.Provider value={{ 
    user, 
    isAuthenticated, 
    login, 
    logout, 
    error, 
    refreshToken, 
    upgradeToOrganizer,
    verifyEmail,
    checkAuthStatus,
    confirmEmailVerification,
    isVerifiedOrganizer,
    updateUser: async (userData: Partial<User>) => {
      setUser(prev => prev ? { ...prev, ...userData } : null);
    }
  }}>
    {children}
  </AuthContext.Provider>
);
}
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};