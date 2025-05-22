import { useState, useEffect } from 'react';
import { useAuth } from '../context/Authcontext';
import toast from 'react-hot-toast';
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiEdit2, FiShield, FiGlobe, FiMapPin, FiPhone } from 'react-icons/fi';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import  Skeleton  from '../components/Skeleton';
import  Tooltip  from '../components/Tooltip';

interface OrganizationData {
  organizationName: string;
  description: string;
  website: string;
  address: string;
  phone: string;
  verified: boolean;
}

export default function RegisterOrganization() {
 
  const { user, upgradeToOrganizer } = useAuth();
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    organizationName: '',
    description: '',
    website: '',
    address: '',
    phone: '',
    verified: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (user?.organizerInfo) {
      setOrganizationData({
        organizationName: user.organizerInfo.organizationName || '',
        description: user.organizerInfo.description || '',
        website: user.organizerInfo.website || '',
        address: user.organizerInfo.address || '',
        phone: user.organizerInfo.phone || '',
        verified: user.organizerInfo.verified || false,
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Skeleton />
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!organizationData.organizationName.trim()) {
      newErrors.organizationName = 'Organization name is required';
    }
    
    if (!organizationData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (organizationData.description.length < 20) {
      newErrors.description = 'Description should be at least 20 characters';
    }
    
    if (!organizationData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!organizationData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(organizationData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    if (organizationData.website && !/^https?:\/\/.+\..+/.test(organizationData.website)) {
      newErrors.website = 'Invalid website URL (include http:// or https://)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string, value: string } }) => {
    const { name, value } = e.target;
    setOrganizationData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    setServerError('');
    
    try {
      await upgradeToOrganizer(organizationData);
      toast.success('Organization profile submitted for verification!');
    } catch (error: any) {
      console.error('Registration error:', error);
      setServerError(error.message || 'Registration failed. Please try again.');
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const resendVerificationEmail = () => {
    toast.success('Verification email has been resent. Please check your inbox.');
  };

  if (user?.organizerInfo?.organizationName && !user.organizerInfo.verified) {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="text-center">
        <FiInfo className="mx-auto h-12 w-12 text-blue-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Verification Pending</h2>
        <p className="mt-2 text-gray-600">
          Your organization profile is pending verification. Please check your email 
          for verification instructions.
        </p>
        <button
          onClick={() => resendVerificationEmail()} 
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Resend Verification Email
        </button>
      </div>
    </div>
  );
}
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 md:text-4xl">
          {user?.organizerInfo ? 'Complete Your Organization Profile' : 'Register Your Organization'}
        </h1>
        <p className="text-gray-600 text-lg">
          Complete your profile to start creating events
        </p>
      </div>

      {serverError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="flex-shrink-0 h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{serverError}</p>
          </div>
        </div>
      )}

      {!user?.isVerified && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center gap-3">
            <FiAlertTriangle className="flex-shrink-0 h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              You need to verify your email address before registering an organization.
            </p>
          </div>
        </div>
      )}

      {user?.organizerInfo?.organizationName && !user.organizerInfo.verified && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center gap-3">
            <FiInfo className="flex-shrink-0 h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Your organization profile is pending verification. You'll be notified once it's approved.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="organizationName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FiShield className="text-gray-500" />
                Organization Name *
              </label>
              <input
                type="text"
                id="organizationName"
                name="organizationName"
                required
                value={organizationData.organizationName}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-lg border ${
                  errors.organizationName ? 'border-red-500' : 'border-gray-300'
                } px-4 py-3 text-sm shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
                  errors.organizationName ? 'focus:ring-red-500' : 'focus:ring-purple-500'
                }`}
                placeholder="Enter organization name"
              />
              {errors.organizationName && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertTriangle className="flex-shrink-0" /> {errors.organizationName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="website" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FiGlobe className="text-gray-500" />
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={organizationData.website}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-lg border ${
                  errors.website ? 'border-red-500' : 'border-gray-300'
                } px-4 py-3 text-sm shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
                  errors.website ? 'focus:ring-red-500' : 'focus:ring-purple-500'
                }`}
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertTriangle className="flex-shrink-0" /> {errors.website}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FiMapPin className="text-gray-500" />
                Address *
              </label>
              <input
          type="text"
          id="address"
          name="address"
          value={organizationData.address}
          onChange={handleChange}
          required
          className={`mt-1 block w-full rounded-lg border ${
            errors.address ? 'border-red-500' : 'border-gray-300'
                } px-4 py-3 text-sm shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
                  errors.address ? 'focus:ring-red-500' : 'focus:ring-purple-500'
                }`}
                placeholder="Enter organization address"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertTriangle className="flex-shrink-0" /> {errors.address}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FiPhone className="text-gray-500" />
                Phone Number *
                <Tooltip message="Include country code (e.g. +1)">
                  <FiInfo className="text-gray-400 h-4 w-4" />
                </Tooltip>
              </label>
              <PhoneInput
                international
                defaultCountry="US"
                value={organizationData.phone}
                onChange={(value) => handleChange({ target: { name: 'phone', value: value || '' } })}
                className={`mt-1 block w-full rounded-lg border ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                } px-4 py-3 text-sm shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
                  errors.phone ? 'focus:ring-red-500' : 'focus:ring-purple-500'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertTriangle className="flex-shrink-0" /> {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FiEdit2 className="text-gray-500" />
                Description *
              </label>
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  value={organizationData.description}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-lg border ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  } px-4 py-3 text-sm shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 ${
                    errors.description ? 'focus:ring-red-500' : 'focus:ring-purple-500'
                  }`}
                  placeholder="Tell us about your organization..."
                  maxLength={500}
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-1">
                  {organizationData.description.length}/500
                </div>
              </div>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertTriangle className="flex-shrink-0" /> {errors.description}
                </p>
              )}
            </div>

          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !user?.isVerified}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <FiCheckCircle className="h-5 w-5" />
                  Submit Organization Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}