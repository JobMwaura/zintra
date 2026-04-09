'use client';

import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

/**
 * Intermediate page that handles the password reset link click
 * This page extracts the token and redirects to server-side verification
 */
export default function ConfirmPage() {
  const [tokenPresent, setTokenPresent] = useState(false);
  const [message, setMessage] = useState('Preparing...');

  useEffect(() => {
    const url = new URL(window.location.href);
    const code =
      url.searchParams.get('code') ||
      url.searchParams.get('token') ||
      url.searchParams.get('token_hash') ||
      url.searchParams.get('oob') ||
      url.searchParams.get('t');

    if (code) {
      setTokenPresent(true);
      setMessage('Click Continue to securely confirm your password reset.');
    } else {
      setTokenPresent(false);
      setMessage('No recovery token found in the link.');
    }
  }, []);

  function handleContinue() {
    // Navigate to the server confirm endpoint which performs the verify and redirects.
    // Use the same query string so server gets the code/type.
    const currentUrl = window.location.href;
    const newUrl = currentUrl.replace('/auth/confirm', '/api/auth/confirm');
    window.location.href = newUrl;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow p-6 max-w-md w-full border border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Confirm Password Reset</h1>
        <p className="text-sm text-gray-600 mb-6">{message}</p>

        {tokenPresent ? (
          <div className="space-y-4">
            <button
              onClick={handleContinue}
              className="w-full bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 transition"
            >
              Continue
            </button>
            <p className="text-xs text-gray-500 text-center">
              You'll be securely redirected to set your new password
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">
                The recovery link is invalid or expired.
              </p>
            </div>
            <a
              href="/forgot-password"
              className="block w-full text-center bg-orange-500 text-white font-semibold py-3 rounded-lg hover:bg-orange-600 transition"
            >
              Request New Recovery Email
            </a>
            <a
              href="/login"
              className="block text-center text-sm text-orange-600 hover:underline"
            >
              Back to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
