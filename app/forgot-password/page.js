'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!email.trim()) {
      setMessage('Please enter your email.');
      return;
    }
    setLoading(true);
    
    // Use the new secure flow: email → /auth/confirm → server verification → /auth/change-password
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm`,
    });
    
    setLoading(false);
    if (error) {
      setMessage('Error sending reset email: ' + error.message);
      return;
    }
    setMessage('✅ Check your email for a reset link. The link will expire in 1 hour.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow p-6 max-w-md w-full border border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Forgot Password</h1>
        <p className="text-sm text-gray-600 mb-4">
          Enter your account email and we will send you a password reset link.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="you@example.com"
            />
          </div>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg hover:bg-orange-600 transition disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="mt-4 text-sm">
          <a href="/login" className="text-orange-600 hover:underline">
            Back to login
          </a>
        </div>
      </div>
    </div>
  );
}
