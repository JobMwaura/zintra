import React, { useState, useEffect } from 'react';
import { useRfqContext } from '@/context/RfqContext';

/**
 * AuthInterceptor Component
 * 
 * Shown before final RFQ submission if user is not authenticated.
 * Allows guest user to:
 * - Login with email/password
 * - Sign up for a new account
 * - Continue as guest (email capture)
 * - Cancel without losing form data
 * 
 * Props:
 * - onLoginSuccess: Callback after successful login/signup
 * - onGuestSubmit: Callback if user wants to submit as guest
 * - onCancel: Callback if user cancels auth
 * - isOpen: Control modal visibility
 */
export default function AuthInterceptor({
  onLoginSuccess,
  onGuestSubmit,
  onCancel,
  isOpen = true,
}) {
  const { isGuestMode, setUserAuthenticated, submitAsGuest } = useRfqContext();

  const [authMode, setAuthMode] = useState('login'); // login | signup | guest
  const [guestPhoneMode, setGuestPhoneMode] = useState(null); // phone | otp (for guest flow with phone verification - Tweak 4)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Reset form when auth mode changes
  useEffect(() => {
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [authMode]);

  /**
   * Handle login
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error('Please enter email and password');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();

      // Set user as authenticated
      setUserAuthenticated({
        id: data.user.id,
        email: data.user.email,
      });

      // Call callback
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle signup
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate inputs
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Signup failed');
      }

      const data = await response.json();

      // Set user as authenticated
      setUserAuthenticated({
        id: data.user.id,
        email: data.user.email,
      });

      // Call callback
      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle guest phone submission - TWEAK 4: Send OTP
   */
  const handleGuestPhoneSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!guestEmail) {
      setError('Please enter your email address');
      return;
    }

    if (!guestEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    // Basic phone validation (must be 10+ digits)
    const phoneDigitsOnly = phoneNumber.replace(/\D/g, '');
    if (phoneDigitsOnly.length < 10) {
      setError('Phone number must be at least 10 digits');
      return;
    }

    setIsLoading(true);

    try {
      // Send OTP to phone number
      const response = await fetch('/api/auth/send-sms-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneDigitsOnly,
          email: guestEmail
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send OTP. Please try again.');
      }

      // OTP sent successfully
      setOtpSent(true);
      setGuestPhoneMode('otp');
      setError(null);
    } catch (err) {
      setError(err.message || 'Network error sending OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle guest OTP verification - TWEAK 4: Verify OTP
   */
  const handleGuestOtpVerify = async (e) => {
    e.preventDefault();
    setError(null);

    if (!otpCode) {
      setError('Please enter the OTP code');
      return;
    }

    if (otpCode.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      // Verify OTP
      const response = await fetch('/api/auth/verify-sms-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          otpCode,
          email: guestEmail
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Invalid OTP. Please try again.');
      }

      // OTP verified successfully
      // Mark guest as phone-verified and submit
      submitAsGuest(guestEmail, phoneNumber);

      // Call callback
      if (onGuestSubmit) {
        onGuestSubmit(guestEmail);
      }
    } catch (err) {
      setError(err.message || 'Network error verifying OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle guest submission (without phone) - Original flow
   */
  const handleGuestSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!guestEmail) {
      setError('Please enter your email address');
      return;
    }

    if (!guestEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    // Store guest email in context
    submitAsGuest(guestEmail);

    // Call callback
    if (onGuestSubmit) {
      onGuestSubmit(guestEmail);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            Complete Your RFQ Request
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {authMode === 'guest'
              ? 'Get vendor quotes without creating an account'
              : 'Create an account or login to submit your RFQ'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Mode Tabs */}
          {authMode !== 'guest' && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  authMode === 'login'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                  authMode === 'signup'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          )}

          {/* Signup Form */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Guest Form - TWEAK 4: Phone Verification */}
          {authMode === 'guest' && !guestPhoneMode && (
            <form onSubmit={handleGuestPhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Your Email Address
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+254 7xx xxx xxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-600 mt-1">We'll send a verification code to this number</p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {/* Guest OTP Verification - TWEAK 4 */}
          {authMode === 'guest' && guestPhoneMode === 'otp' && otpSent && (
            <form onSubmit={handleGuestOtpVerify} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm text-gray-600">
                  We sent a code to <strong>{phoneNumber}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest font-mono"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {isLoading ? 'Verifying...' : 'Verify & Submit RFQ'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setGuestPhoneMode(null);
                  setOtpCode('');
                  setOtpSent(false);
                }}
                className="w-full text-gray-600 hover:text-gray-900 text-sm font-medium py-2"
                disabled={isLoading}
              >
                Didn't receive code? Change phone number
              </button>
            </form>
          )}

          {/* Switch to Guest Mode */}
          {authMode !== 'guest' && (
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setAuthMode('guest')}
                className="w-full text-center text-gray-600 hover:text-gray-900 text-sm font-medium py-2"
              >
                Continue as Guest →
              </button>
            </div>
          )}

          {/* Switch from Guest */}
          {authMode === 'guest' && (
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setAuthMode('login')}
                className="w-full text-center text-gray-600 hover:text-gray-900 text-sm font-medium py-2"
              >
                ← Login / Sign Up Instead
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 bg-gray-50 rounded-b-lg flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Usage Examples:
 * 
 * Example: Modal in RFQ Form
 * ```javascript
 * import AuthInterceptor from '@/components/AuthInterceptor';
 * import { useRfqContext } from '@/context/RfqContext';
 * 
 * function RfqForm() {
 *   const [showAuth, setShowAuth] = useState(false);
 *   const { isGuestMode, getAllFormData } = useRfqContext();
 * 
 *   const handleSubmit = async () => {
 *     // Check if user is authenticated
 *     if (isGuestMode) {
 *       setShowAuth(true); // Show auth modal
 *       return;
 *     }
 * 
 *     // User is authenticated, proceed with submission
 *     const formData = getAllFormData();
 *     await submitRfq(formData);
 *   };
 * 
 *   const handleAuthSuccess = (user) => {
 *     setShowAuth(false);
 *     // Form data is preserved, user is now authenticated
 *     // Auto-submit or wait for user to click submit again
 *     submitRfq(getAllFormData());
 *   };
 * 
 *   return (
 *     <>
 *       <button onClick={handleSubmit}>Submit RFQ</button>
 *       
 *       <AuthInterceptor
 *         isOpen={showAuth}
 *         onLoginSuccess={handleAuthSuccess}
 *         onGuestSubmit={(email) => {
 *           setShowAuth(false);
 *           submitRfq(getAllFormData());
 *         }}
 *         onCancel={() => setShowAuth(false)}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
