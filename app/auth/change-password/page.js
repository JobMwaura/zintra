'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

/**
 * Inner component that uses useSearchParams
 * Wrapped in Suspense boundary to avoid build errors
 */
function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const setupSession = async () => {
      try {
        // Check if we have a token in the URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token) {
          // Try to get from hash (fallback for direct links)
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ 
              access_token, 
              refresh_token 
            });
            
            if (error) {
              console.error('Session error:', error);
              setMessage('Invalid or expired recovery link.');
              setLoading(false);
              return;
            }

            setSessionReady(true);
            setLoading(false);
            return;
          }

          setMessage('No recovery token found. Please request a new password reset link.');
          setLoading(false);
          return;
        }

        // Token was verified by server, session should be ready
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('✅ Session is ready for password update');
          setSessionReady(true);
        } else {
          console.warn('⚠️ No active session found');
          setMessage('Session expired. Please request a new password reset link.');
        }
      } catch (error) {
        console.error('Error setting up session:', error);
        setMessage('An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    setupSession();
  }, [searchParams]);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validation
    if (!password || !confirmPassword) {
      setMessage('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Password update error:', error);
        setMessage('Failed to update password: ' + error.message);
        setIsUpdating(false);
        return;
      }

      setSuccess(true);
      setMessage('✅ Password updated successfully! Redirecting to login...');
      
      // Sign out to force fresh login with new password
      await supabase.auth.signOut();
      
      setTimeout(() => {
        router.push('/login?message=password_updated');
      }, 2000);
    } catch (error) {
      console.error('Unexpected error:', error);
      setMessage('An unexpected error occurred. Please try again.');
      setIsUpdating(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full border border-gray-200">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-gray-600">Validating recovery link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow p-6 max-w-md w-full border border-gray-200">
          <div className="flex flex-col items-center gap-4 mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h1 className="text-xl font-bold text-gray-900">Invalid Recovery Link</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{message || 'The recovery link is invalid or has expired.'}</p>
          </div>

          <div className="space-y-3">
            <a
              href="/forgot-password"
              className="block w-full text-center bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 transition"
            >
              Request New Reset Link
            </a>
            <a
              href="/login"
              className="block text-center text-sm text-orange-600 hover:underline"
            >
              Back to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full border border-gray-200">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <h1 className="text-xl font-bold text-gray-900">Password Updated!</h1>
            <p className="text-gray-600 text-center">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show password change form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow p-6 max-w-md w-full border border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Set New Password</h1>
        <p className="text-sm text-gray-600 mb-6">
          Choose a strong password for your account
        </p>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          {/* New Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter new password"
                disabled={isUpdating}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters
            </p>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Re-enter new password"
                disabled={isUpdating}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error/Success Message */}
          {message && (
            <div
              className={`text-sm rounded-lg px-3 py-2 ${
                message.startsWith('✅')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUpdating}
            className="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Updating Password...
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-sm text-orange-600 hover:underline"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading fallback component
 */
function ChangePasswordLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow p-8 max-w-md w-full border border-gray-200">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Page wrapper with Suspense boundary
 * Solves: useSearchParams() should be wrapped in a suspense boundary
 */
export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<ChangePasswordLoading />}>
      <ChangePasswordForm />
    </Suspense>
  );
}
