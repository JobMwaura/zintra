// File: components/admin/AdminLogin.js
// COMPLETELY REWRITTEN - Rate limiting that ACTUALLY WORKS

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { checkRateLimit, recordFailedAttempt, clearRateLimitRecord } from '@/lib/rateLimiter';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

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

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@zintra.com"
                disabled={isLocked || loading}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isLocked || loading}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLocked || loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading || isLocked}
            className="w-full bg-orange-500 text-white py-2.5 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium mt-6"
          >
            {loading ? '⏳ Signing in...' : isLocked ? `🔒 Locked (${remainingTime}s)` : 'Sign In'}
          </button>
        </form>

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