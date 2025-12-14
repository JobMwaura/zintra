'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Simple password reset page that handles Supabase recovery links.
export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleRecovery = async () => {
      // Supabase sends access_token and refresh_token in the hash.
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (!access_token || !refresh_token) {
        setMessage('Recovery link is invalid or missing tokens.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        setMessage('Error restoring session: ' + error.message);
        setLoading(false);
        return;
      }

      setSessionReady(true);
      setLoading(false);
    };

    handleRecovery();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setMessage('Passwords do not match.');
      return;
    }
    setMessage('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage('Error updating password: ' + error.message);
      return;
    }
    setMessage('✅ Password updated. You can now log in with your new password.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow p-6 max-w-md w-full border border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-sm text-gray-600 mb-4">
          Enter a new password for your account.
        </p>

        {loading && <p className="text-gray-600 text-sm">Validating recovery link...</p>}

        {!loading && !sessionReady && (
          <p className="text-sm text-red-600">{message || 'Recovery link invalid.'}</p>
        )}

        {!loading && sessionReady && (
          <form className="space-y-4" onSubmit={handleUpdate}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Re-enter new password"
              />
            </div>
            {message && <p className="text-sm text-red-600">{message}</p>}
            <button
              type="submit"
              className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition"
            >
              Update Password
            </button>
          </form>
        )}

        {!loading && sessionReady && message.startsWith('✅') && (
          <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
