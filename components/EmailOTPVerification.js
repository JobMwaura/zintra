// File: components/EmailOTPVerification.js
// Purpose: Email OTP verification component for registration

'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import useOTP from '@/components/hooks/useOTP';

export default function EmailOTPVerification({ 
  email,
  onVerified,
  isVerified = false,
  className = ""
}) {
  const { sendOTP, verifyOTP } = useOTP();
  
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Enter Code

  const handleSendEmailOTP = async () => {
    if (!email?.trim()) {
      setMessage('Email is required for verification');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await sendOTP(email, 'email', 'registration');
      if (result.success) {
        setStep(2);
        setMessage('✓ Verification code sent to your email! Check your inbox.');
      } else {
        setMessage(result.error || 'Failed to send verification email');
      }
    } catch (err) {
      setMessage('Error sending verification email: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!otpCode.trim()) {
      setMessage('Please enter the verification code');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await verifyOTP(email, otpCode, 'email');
      if (result.success) {
        setMessage('✓ Email verified successfully!');
        onVerified(true);
      } else {
        setMessage(result.error || 'Invalid verification code');
      }
    } catch (err) {
      setMessage('Error verifying email: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    setOtpCode('');
    setMessage('');
    handleSendEmailOTP();
  };

  if (isVerified) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 flex items-center ${className}`}>
        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">Email Verified!</p>
          <p className="text-xs text-green-600">Your email address has been successfully verified</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Email Display */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-gray-50 text-gray-600"
        />
        <p className="text-xs text-gray-500 mt-1">We'll send a verification code to this email</p>
      </div>

      {/* Send OTP Step */}
      {step === 1 && (
        <button
          type="button"
          onClick={handleSendEmailOTP}
          disabled={loading}
          className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition ${
            !loading
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading ? 'Sending Code...' : 'Send Verification Code'}
        </button>
      )}

      {/* Enter Code Step */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength="6"
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setOtpCode(val.slice(0, 6));
              }}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-widest font-mono rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-xs text-gray-600 mt-2">Check your email for the verification code</p>
          </div>

          <button
            type="button"
            onClick={handleVerifyEmailOTP}
            disabled={!otpCode.trim() || loading}
            className={`w-full px-4 py-2.5 rounded-lg font-medium text-sm transition ${
              otpCode.trim() && !loading
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading}
            className="w-full text-orange-600 text-sm hover:text-orange-700 transition"
          >
            Didn't receive code? Resend
          </button>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          message.startsWith('✓') 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}