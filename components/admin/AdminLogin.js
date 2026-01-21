// File: components/admin/AdminLogin.js
// Enhanced with Email OTP Login Option

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { checkRateLimit, recordFailedAttempt, clearRateLimitRecord } from '@/lib/rateLimiter';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'email-otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  // Email OTP state
  const [otpData, setOtpData] = useState({
    email: '',
    step: 1, // 1: Enter email, 2: Check email
    loading: false,
    message: ''
  });

  // Check rate limit on mount and set up interval
  useEffect(() => {
    const checkLock = () => {
      const rateLimitCheck = checkRateLimit();
      setIsLocked(!rateLimitCheck.allowed);
      setRemainingTime(rateLimitCheck.remainingTime);
    };

    checkLock();

    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if currently locked
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      setIsLocked(true);
      setRemainingTime(rateLimitCheck.remainingTime);
      setError(`🔒 Too many failed attempts. Try again in ${rateLimitCheck.remainingTime} seconds.`);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        recordFailedAttempt();
        const check = checkRateLimit();
        setIsLocked(!check.allowed);
        setRemainingTime(check.remainingTime);
        
        if (!check.allowed) {
          setError(`🔒 Too many failed attempts. Try again in ${check.remainingTime} seconds.`);
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        recordFailedAttempt();
        const check = checkRateLimit();
        setIsLocked(!check.allowed);
        setRemainingTime(check.remainingTime);
        
        if (!check.allowed) {
          setError(`🔒 Too many failed attempts. Try again in ${check.remainingTime} seconds.`);
        } else {
          setError('Login failed');
        }
        setLoading(false);
        return;
      }

      console.log('✅ User logged in:', authData.user.id);

      // Step 2: Check if user is admin
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id, role, status')
        .eq('user_id', authData.user.id)
        .single();

      if (adminError || !adminData || adminData.status !== 'active') {
        recordFailedAttempt();
        const check = checkRateLimit();
        setIsLocked(!check.allowed);
        setRemainingTime(check.remainingTime);
        
        console.error('Admin check error:', adminError);
        if (!check.allowed) {
          setError(`🔒 Too many failed attempts. Try again in ${check.remainingTime} seconds.`);
        } else {
          setError('You are not registered as an admin');
        }
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // ✅ Success! Clear rate limit and redirect
      clearRateLimitRecord();
      console.log('✅ Admin verified! Redirecting to dashboard...');
      window.location.href = '/admin/dashboard';

    } catch (err) {
      recordFailedAttempt();
      const check = checkRateLimit();
      setIsLocked(!check.allowed);
      setRemainingTime(check.remainingTime);
      
      console.error('Login error:', err);
      if (!check.allowed) {
        setError(`🔒 Too many failed attempts. Try again in ${check.remainingTime} seconds.`);
      } else {
        setError(err.message || 'An error occurred');
      }
      setLoading(false);
    }
  };

  // Email OTP Login Handler
  const handleSendEmailOTP = async (e) => {
    e.preventDefault();
    
    if (!otpData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpData.email)) {
      setOtpData(prev => ({ ...prev, message: '❌ Please enter a valid email address' }));
      return;
    }

    // Check rate limit for OTP requests too
    const rateLimitCheck = checkRateLimit();
    if (!rateLimitCheck.allowed) {
      setOtpData(prev => ({ 
        ...prev, 
        message: `🔒 Too many attempts. Try again in ${rateLimitCheck.remainingTime} seconds.` 
      }));
      return;
    }

    setOtpData(prev => ({ ...prev, loading: true, message: '' }));

    try {
      // First verify the email belongs to an admin
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id, status')
        .eq('status', 'active')
        .single();

      if (adminError) {
        throw new Error('Admin verification failed');
      }

      // Get the user to check email
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('email')
        .eq('id', adminCheck.user_id)
        .single();

      if (userError || userData.email !== otpData.email) {
        recordFailedAttempt();
        throw new Error('This email is not registered as an admin');
      }

      // Send magic link for admin login
      const { error } = await supabase.auth.signInWithOtp({
        email: otpData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?admin=true`
        }
      });

      if (error) throw error;

      setOtpData(prev => ({ 
        ...prev, 
        step: 2, 
        loading: false,
        message: `✅ Admin login link sent to ${otpData.email}! Check your inbox.`
      }));

    } catch (error) {
      console.error('Admin Email OTP error:', error);
      setOtpData(prev => ({ 
        ...prev, 
        loading: false,
        message: `❌ ${error.message}`
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-center text-gray-900">ZINTRA</h1>
          <p className="text-center text-gray-600 text-sm mt-1">Admin Login</p>
          <p className="text-center text-xs text-red-600 mt-2">🔒 Secure Access Only</p>
        </div>

        {/* Rate Limit Lock Warning */}
        {isLocked && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-700 text-sm font-medium">
              🔒 Account Temporarily Locked
            </p>
            <p className="text-orange-600 text-xs mt-2">
              Too many failed attempts. Remaining time: <strong>{remainingTime}s</strong>
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Login Method Toggle */}
        <div className="mb-6">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                loginMethod === 'password'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('email-otp')}
              className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                loginMethod === 'email-otp'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Email Login
            </button>
          </div>
        </div>

        {/* Password Login Form */}
        {loginMethod === 'password' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLocked}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="admin@zintra.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLocked}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLocked}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:hover:text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Email OTP Login Form */}
        {loginMethod === 'email-otp' && (
          <form onSubmit={handleSendEmailOTP} className="space-y-4">
            {otpData.step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={otpData.email}
                      onChange={(e) => setOtpData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      disabled={isLocked || otpData.loading}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="admin@zintra.com"
                    />
                  </div>
                </div>

                {otpData.message && (
                  <div className={`p-4 rounded-lg text-sm ${
                    otpData.message.startsWith('✅') 
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {otpData.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpData.loading || isLocked}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {otpData.loading ? 'Sending Link...' : 'Send Login Link'}
                </button>
              </>
            )}

            {otpData.step === 2 && (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">
                        Check Your Email
                      </h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>We've sent a secure login link to:</p>
                        <p className="font-medium mt-1">{otpData.email}</p>
                        <p className="mt-2">Click the link in your email to access the admin dashboard.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setOtpData(prev => ({ ...prev, step: 1, message: '' }))}
                  className="text-sm text-blue-600 hover:text-blue-500 underline"
                >
                  ← Use different email
                </button>
              </div>
            )}
          </form>
        )}

        {/* Info Box */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            🔐 This is a secure admin area. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}