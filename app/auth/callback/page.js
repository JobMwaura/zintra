// File: app/auth/callback/page.js
// Purpose: Handle Supabase password recovery & magic links

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error', 'password-reset'
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from URL
        const hash = window.location.hash;
        console.log('Auth callback hash:', hash);

        if (!hash) {
          setStatus('error');
          setMessage('No authentication token found');
          return;
        }

        // Parse the hash
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const type = params.get('type');

        console.log('Type:', type);
        console.log('Access token:', accessToken ? 'Present' : 'Missing');

        if (!accessToken) {
          setStatus('error');
          setMessage('Invalid or expired authentication link');
          return;
        }

        // Set the session
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: params.get('refresh_token') || '',
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          setStatus('error');
          setMessage('Failed to set session: ' + sessionError.message);
          return;
        }

        console.log('Session set successfully');

        // Handle based on type
        if (type === 'recovery') {
          console.log('Password recovery link detected');
          setStatus('password-reset');
          setShowPasswordForm(true);
          setMessage('Enter your new password');
        } else if (type === 'magiclink') {
          console.log('Magic link detected - logging in');
          setStatus('success');
          setMessage('Login successful! Redirecting...');
          
          // Check URL params for admin flag
          const urlParams = new URLSearchParams(window.location.search);
          const isAdminLogin = urlParams.get('admin') === 'true';
          
          if (isAdminLogin) {
            // Verify user is actually an admin
            const { data: adminData, error: adminError } = await supabase
              .from('admin_users')
              .select('id, status')
              .eq('user_id', data.user.id)
              .eq('status', 'active')
              .maybeSingle();

            if (adminData) {
              const redirectUrl = '/admin/dashboard';
              setTimeout(() => {
                window.location.href = redirectUrl;
              }, 2000);
              return;
            } else {
              setStatus('error');
              setMessage('❌ Unauthorized: Admin access required');
              return;
            }
          }
          
          // Check if user is vendor and redirect accordingly
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          const redirectUrl = vendorData 
            ? `/vendor-profile/${vendorData.id}`
            : '/user-dashboard';

          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 2000);
        } else {
          console.log('Email verification/Other type');
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Check if user is vendor for other auth types too
          const { data: vendorData } = await supabase
            .from('vendors')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          const redirectUrl = vendorData 
            ? `/vendor-profile/${vendorData.id}`
            : '/user-dashboard';

          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 2000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred: ' + error.message);
      }
    };

    handleAuthCallback();
  }, [router]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters');
      return;
    }

    setIsResetting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage('Failed to reset password: ' + error.message);
        setIsResetting(false);
        return;
      }

      setStatus('success');
      setMessage('✅ Password reset successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      setMessage('An error occurred: ' + error.message);
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-gray-600">Processing authentication...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <p className="text-gray-900 font-medium text-center">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-red-600 font-medium text-center">{message}</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
            >
              Back to Login
            </button>
          </div>
        )}

        {status === 'password-reset' && showPasswordForm && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-center text-gray-900">
              Reset Password
            </h2>
            <p className="text-gray-600 text-center">
              Enter your new password
            </p>

            {message && !isResetting && (
              <div className="p-3 bg-blue-100 text-blue-700 rounded text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isResetting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isResetting}
                />
              </div>

              {message && (isResetting || status === 'error') && (
                <div className={`p-3 rounded text-sm ${
                  message.includes('✅') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isResetting}
                className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium"
              >
                {isResetting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}