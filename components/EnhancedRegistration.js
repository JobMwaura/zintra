'use client';

import { useState } from 'react';
import { useOTP } from '@/components/hooks/useOTP';
import PhoneInput from '@/components/PhoneInput';
import { createClient } from '@/lib/supabase/client';

/**
 * Enhanced Registration Component with SMS + Email OTP Choice
 * 
 * Features:
 * - User can choose between SMS or Email verification
 * - Professional UI with Zintra branding
 * - Seamless integration with existing OTP infrastructure
 * - Fallback options if one method fails
 */

export default function EnhancedRegistration({ userType = 'user', onSuccess }) {
  const supabase = createClient();
  const { sendOTP, verifyOTP, loading } = useOTP();

  const [step, setStep] = useState(1); // 1: Form, 2: Choose Method, 3: Verify OTP
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [otpMethod, setOtpMethod] = useState('sms'); // 'sms' | 'email'
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [verified, setVerified] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Move to OTP method selection
    setStep(2);
  };

  const handleSendOTP = async () => {
    setOtpLoading(true);
    setOtpMessage('');

    try {
      const contact = otpMethod === 'sms' ? formData.phone : formData.email;
      const result = await sendOTP(contact, otpMethod, 'registration');

      if (result.success) {
        setStep(3);
        setOtpMessage(
          otpMethod === 'sms' 
            ? `✓ SMS sent to ${formData.phone}` 
            : `✓ Email sent to ${formData.email}`
        );
      } else {
        setOtpMessage(`❌ Failed to send ${otpMethod.toUpperCase()}: ${result.error}`);
      }
    } catch (error) {
      setOtpMessage(`❌ Error: ${error.message}`);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpMessage('Please enter a valid 6-digit code');
      return;
    }

    setOtpLoading(true);
    setOtpMessage('');

    try {
      const identifier = otpMethod === 'sms' ? formData.phone : formData.email;
      const result = await verifyOTP(otpCode, identifier);

      if (result.verified || result.success) {
        setVerified(true);
        setOtpMessage('✓ Verification successful!');
        
        // Create account in Supabase
        setTimeout(() => {
          handleCreateAccount();
        }, 1000);
      } else {
        setOtpMessage(`❌ Invalid code: ${result.error}`);
      }
    } catch (error) {
      setOtpMessage(`❌ Error: ${error.message}`);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone_number: formData.phone,
            phone_verified: otpMethod === 'sms',
            email_verified: otpMethod === 'email',
            verification_method: otpMethod
          }
        }
      });

      if (error) throw error;

      // Success! Redirect or call success callback
      if (onSuccess) {
        onSuccess(data);
      } else {
        window.location.href = userType === 'vendor' ? '/vendor-dashboard' : '/user-dashboard';
      }
      
    } catch (error) {
      setOtpMessage(`❌ Account creation failed: ${error.message}`);
    }
  };

  // Step 1: Registration Form
  if (step === 1) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <img 
            src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
            alt="Zintra" 
            className="h-12 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">
            Create {userType === 'vendor' ? 'Vendor' : 'User'} Account
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <PhoneInput
              value={formData.phone}
              onChange={(phone) => setFormData(prev => ({...prev, phone}))}
              country="KE"
              error={errors.phone}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({...prev, confirmPassword: e.target.value}))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 font-medium transition"
          >
            Next: Choose Verification Method
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-orange-500 hover:text-orange-600">
              Sign in
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Choose OTP Method
  if (step === 2) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <img 
            src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
            alt="Zintra" 
            className="h-12 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">Choose Verification Method</h2>
          <p className="text-gray-600 mt-2">
            How would you like to receive your verification code?
          </p>
        </div>

        <div className="space-y-4">
          {/* SMS Option */}
          <div 
            onClick={() => setOtpMethod('sms')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              otpMethod === 'sms' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">📱</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">SMS (Text Message)</div>
                <div className="text-sm text-gray-600">
                  Code sent to: {formData.phone}
                </div>
                <div className="text-xs text-gray-500">
                  ✓ Instant delivery • ✓ Works offline
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                otpMethod === 'sms' 
                  ? 'border-orange-500 bg-orange-500' 
                  : 'border-gray-300'
              }`}>
                {otpMethod === 'sms' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Email Option */}
          <div 
            onClick={() => setOtpMethod('email')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              otpMethod === 'email' 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">📧</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Email</div>
                <div className="text-sm text-gray-600">
                  Code sent to: {formData.email}
                </div>
                <div className="text-xs text-gray-500">
                  ✓ Professional delivery • ✓ Always accessible
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${
                otpMethod === 'email' 
                  ? 'border-orange-500 bg-orange-500' 
                  : 'border-gray-300'
              }`}>
                {otpMethod === 'email' && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {otpMessage && (
            <div className={`p-3 rounded-md text-sm ${
              otpMessage.startsWith('✓') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {otpMessage}
            </div>
          )}

          <button
            onClick={handleSendOTP}
            disabled={otpLoading}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50 font-medium transition"
          >
            {otpLoading 
              ? `Sending ${otpMethod.toUpperCase()}...` 
              : `Send Verification ${otpMethod === 'sms' ? 'SMS' : 'Email'}`
            }
          </button>

          <button
            onClick={() => setStep(1)}
            className="w-full text-gray-600 hover:text-gray-800 py-2 transition"
          >
            ← Back to form
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Verify OTP
  if (step === 3) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <img 
            src="https://zintra-images-prod.s3.us-east-1.amazonaws.com/logos/logo.png" 
            alt="Zintra" 
            className="h-12 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">Enter Verification Code</h2>
          <p className="text-gray-600 mt-2">
            We sent a 6-digit code to your {otpMethod === 'sms' ? 'phone' : 'email'}
          </p>
          <div className="text-sm text-gray-500 mt-1">
            {otpMethod === 'sms' ? formData.phone : formData.email}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-wider font-mono px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={6}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              Enter the 6-digit code you received
            </p>
          </div>

          {otpMessage && (
            <div className={`p-3 rounded-md text-sm ${
              otpMessage.startsWith('✓') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {otpMessage}
            </div>
          )}

          <button
            onClick={handleVerifyOTP}
            disabled={otpLoading || otpCode.length !== 6 || verified}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50 font-medium transition"
          >
            {verified ? '✓ Creating Account...' : (otpLoading ? 'Verifying...' : 'Verify Code')}
          </button>

          <div className="text-center space-y-2">
            <button
              onClick={handleSendOTP}
              disabled={otpLoading || verified}
              className="text-orange-500 hover:text-orange-600 text-sm transition"
            >
              Resend code
            </button>
            <br />
            <button
              onClick={() => setStep(2)}
              disabled={verified}
              className="text-gray-600 hover:text-gray-800 text-sm transition"
            >
              ← Choose different method
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}