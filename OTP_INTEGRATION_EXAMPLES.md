// ============================================================================
// OTP SERVICE - INTEGRATION EXAMPLES
// ============================================================================
// Ready-to-use code snippets for integrating OTP into Zintra pages
// Copy and adapt these examples for your specific use cases
// ============================================================================

// ============================================================================
// EXAMPLE 1: SIMPLE PHONE VERIFICATION COMPONENT
// ============================================================================

/**
 * PhoneVerification.tsx
 * Reusable component for phone verification flow
 */

'use client';

import { useState } from 'react';
import { Phone, Check, AlertCircle, Loader } from 'lucide-react';

interface PhoneVerificationProps {
  onVerificationComplete: (phoneNumber: string) => void;
  onError?: (error: string) => void;
}

export default function PhoneVerification({
  onVerificationComplete,
  onError
}: PhoneVerificationProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpId, setOtpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [expiresIn, setExpiresIn] = useState(0);

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          type: 'registration',
          channel: 'sms'
        })
      });

      const data = await response.json();

      if (data.success) {
        setOtpId(data.otpId);
        setExpiresIn(data.expiresIn);
        setStep('otp');
      } else {
        setError(data.error || 'Failed to send OTP');
        onError?.(data.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otpId,
          otpCode
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        onVerificationComplete(phoneNumber);
      } else {
        setError(data.error || 'Invalid OTP');
        setRemainingAttempts(data.remainingAttempts || 0);
        onError?.(data.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Check className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">Phone Verified!</h3>
            <p className="text-sm text-green-700">{phoneNumber}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {step === 'phone' ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </div>
            </label>
            <input
              type="tel"
              placeholder="+254712345678 or 0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll send a verification code via SMS
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phoneNumber}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
            Send OTP
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              placeholder="000000"
              value={otpCode}
              onChange={(e) =>
                setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
              }
              maxLength={6}
              className="w-full px-4 py-2 text-2xl tracking-widest border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">
                {error}
                {remainingAttempts > 0 && (
                  <> ({remainingAttempts} attempts remaining)</>
                )}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
            Verify Code
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setOtpCode('');
              setError('');
            }}
            className="w-full text-orange-600 hover:text-orange-700 font-medium py-2"
          >
            Change Phone Number
          </button>
        </form>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: REGISTRATION FORM WITH PHONE VERIFICATION
// ============================================================================

/**
 * RegistrationForm.tsx
 * Complete registration flow with phone verification
 */

'use client';

import { useState } from 'react';
import PhoneVerification from '@/components/PhoneVerification';
import { supabase } from '@/lib/supabaseClient';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneVerified: false,
    verifiedPhoneNumber: ''
  });

  const [step, setStep] = useState<'form' | 'phone' | 'complete'>('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Move to phone verification
      setStep('phone');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneVerified = async (phoneNumber: string) => {
    setLoading(true);
    try {
      // 1. Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      });

      if (authError) throw authError;

      // 2. Create user profile with verified phone
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user?.id,
        email: formData.email,
        full_name: formData.fullName,
        phone: phoneNumber,
        phone_verified: true,
        phone_verified_at: new Date().toISOString()
      });

      if (userError) throw userError;

      setFormData((prev) => ({
        ...prev,
        phoneVerified: true,
        verifiedPhoneNumber: phoneNumber
      }));

      setStep('complete');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error';
      setError(message);
      setStep('phone');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'complete') {
    return (
      <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <h2 className="text-xl font-bold text-green-900 mb-2">
          Registration Complete!
        </h2>
        <p className="text-green-700 mb-4">
          Your account has been created with verified phone number:
        </p>
        <p className="font-semibold text-green-900 mb-6">
          {formData.verifiedPhoneNumber}
        </p>
        <a
          href="/login"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg"
        >
          Go to Login
        </a>
      </div>
    );
  }

  if (step === 'phone') {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6">Verify Your Phone</h2>
        <PhoneVerification
          onVerificationComplete={handlePhoneVerified}
          onError={setError}
        />
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create Account</h2>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) =>
              setFormData({ ...formData, fullName: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !formData.fullName || !formData.email || !formData.password}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
        >
          {loading ? 'Loading...' : 'Next: Verify Phone'}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-orange-600 hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: VENDOR REGISTRATION WITH PHONE VERIFICATION
// ============================================================================

/**
 * Vendor registration step with phone verification
 */

async function verifyVendorPhone(businessPhone: string): Promise<boolean> {
  try {
    // 1. Send OTP
    const sendResponse = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: businessPhone,
        type: 'registration'
      })
    });

    const { otpId } = await sendResponse.json();

    // 2. Show OTP input dialog (implement your own modal)
    const otpCode = await showOTPModal(); // Your modal implementation

    // 3. Verify OTP
    const verifyResponse = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        otpId,
        otpCode
      })
    });

    const result = await verifyResponse.json();
    return result.success;
  } catch (error) {
    console.error('Phone verification error:', error);
    return false;
  }
}

// ============================================================================
// EXAMPLE 4: API CLIENT HOOK
// ============================================================================

/**
 * useOTP.ts
 * React hook for managing OTP flow
 */

'use client';

import { useState } from 'react';

interface OTPState {
  otpId: string | null;
  sending: boolean;
  verifying: boolean;
  error: string | null;
  expiresIn: number;
}

export function useOTP() {
  const [state, setState] = useState<OTPState>({
    otpId: null,
    sending: false,
    verifying: false,
    error: null,
    expiresIn: 0
  });

  const sendOTP = async (
    phoneNumber: string,
    type: 'registration' | 'login' | 'payment' = 'registration'
  ) => {
    setState((prev) => ({ ...prev, sending: true, error: null }));

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          type,
          channel: 'sms'
        })
      });

      const data = await response.json();

      if (data.success) {
        setState((prev) => ({
          ...prev,
          otpId: data.otpId,
          expiresIn: data.expiresIn
        }));
        return data;
      } else {
        setState((prev) => ({ ...prev, error: data.error }));
        throw new Error(data.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      setState((prev) => ({ ...prev, error: message }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, sending: false }));
    }
  };

  const verifyOTP = async (otpCode: string) => {
    setState((prev) => ({ ...prev, verifying: true, error: null }));

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otpId: state.otpId,
          otpCode
        })
      });

      const data = await response.json();

      if (data.success) {
        setState((prev) => ({ ...prev, otpId: null }));
        return data;
      } else {
        setState((prev) => ({ ...prev, error: data.error }));
        throw new Error(data.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      setState((prev) => ({ ...prev, error: message }));
      throw error;
    } finally {
      setState((prev) => ({ ...prev, verifying: false }));
    }
  };

  const reset = () => {
    setState({
      otpId: null,
      sending: false,
      verifying: false,
      error: null,
      expiresIn: 0
    });
  };

  return {
    ...state,
    sendOTP,
    verifyOTP,
    reset
  };
}

// Usage:
// const otp = useOTP();
// await otp.sendOTP('+254712345678');
// await otp.verifyOTP('123456');

// ============================================================================
// EXAMPLE 5: UTILITY FUNCTIONS
// ============================================================================

/**
 * Utility functions for OTP handling
 */

// Normalize phone number to +254 format
export function normalizePhoneNumber(phone: string): string {
  // Remove any non-digits except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Handle different formats
  if (cleaned.startsWith('+254')) return cleaned;
  if (cleaned.startsWith('254')) return '+' + cleaned;
  if (cleaned.startsWith('0')) return '+254' + cleaned.slice(1);

  return '+254' + cleaned;
}

// Validate phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^\+254\d{9}$/.test(normalized);
}

// Format phone for display
export function formatPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  // +254 712 345 678
  return normalized.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
}

// ============================================================================
// EXAMPLE 6: SERVER ACTION FOR OTP
// ============================================================================

/**
 * actions/otpActions.ts
 * Server actions for OTP handling
 */

'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function serverSendOTP(
  phoneNumber: string,
  userId?: string
): Promise<{ success: boolean; otpId?: string; error?: string }> {
  try {
    const response = await fetch('https://your-domain.com/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, userId })
    });

    return response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error'
    };
  }
}

export async function serverVerifyOTP(
  otpId: string,
  otpCode: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const response = await fetch('https://your-domain.com/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otpId, otpCode })
    });

    return response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error'
    };
  }
}

// ============================================================================
// END OF EXAMPLES
// ============================================================================

/**
 * HOW TO USE THESE EXAMPLES:
 *
 * 1. PhoneVerification Component:
 *    - Drop-in component for phone verification
 *    - Use in any page that needs phone verification
 *    - Customize styling to match your app
 *
 * 2. RegistrationForm Component:
 *    - Complete registration form with phone verification
 *    - Multi-step process (form → phone → complete)
 *    - Integrates with Supabase auth
 *
 * 3. Vendor Registration:
 *    - Simple async function for vendor phone verification
 *    - Shows how to handle OTP in a separate step
 *
 * 4. useOTP Hook:
 *    - Reusable React hook for any OTP flow
 *    - Manages all OTP state
 *    - Easy to integrate into any component
 *
 * 5. Utility Functions:
 *    - Phone number normalization and validation
 *    - Display formatting
 *    - Use in forms and validation
 *
 * 6. Server Actions:
 *    - Next.js server actions for OTP
 *    - Call from client components
 *    - Better security and performance
 *
 * CUSTOMIZE AS NEEDED:
 * - Colors: Change 'orange-600' to your brand color
 * - Messages: Update error and success messages
 * - Styling: Replace Tailwind classes with your CSS
 * - Behavior: Add your own custom logic and flows
 */
