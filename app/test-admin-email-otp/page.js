// File: app/test-admin-email-otp/page.js
// Purpose: Test admin Email OTP login functionality

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestAdminEmailOTP() {
  const [testEmail, setTestEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testAdminEmailOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      // Test sending admin Email OTP
      const { error } = await supabase.auth.signInWithOtp({
        email: testEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?admin=true`
        }
      });

      if (error) {
        setStatus(`❌ Error: ${error.message}`);
      } else {
        setStatus(`✅ Admin login link sent to ${testEmail}! Check your inbox.`);
      }
    } catch (error) {
      setStatus(`❌ Unexpected error: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Email OTP Test
          </h1>
          <p className="text-gray-600">
            Test the admin Email OTP login functionality
          </p>
        </div>

        {/* Test Form */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            🧪 Test Admin Email OTP
          </h2>
          
          <form onSubmit={testAdminEmailOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="admin@zintra.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Sending...' : 'Send Admin Login Link'}
            </button>
          </form>

          {status && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              status.startsWith('✅') 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {status}
            </div>
          )}
        </div>

        {/* Implementation Guide */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Admin Email OTP Implementation
          </h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900">✅ Completed Features:</h3>
              <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                <li>Login method toggle (Password/Email OTP)</li>
                <li>Email OTP delivery via EventsGear SMTP</li>
                <li>Admin verification and rate limiting</li>
                <li>Magic link callback with admin routing</li>
                <li>Professional UI matching regular login</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">🔧 Test Steps:</h3>
              <ol className="list-decimal list-inside mt-2 text-gray-700 space-y-1">
                <li>Enter admin email above and click "Send Admin Login Link"</li>
                <li>Check email inbox for login link from noreply@eventsgear.co.ke</li>
                <li>Click the link to test admin dashboard routing</li>
                <li>Verify rate limiting works with multiple attempts</li>
              </ol>
            </div>

            <div>
              <h3 className="font-medium text-gray-900">🚀 Access Points:</h3>
              <ul className="list-disc list-inside mt-2 text-gray-700 space-y-1">
                <li><strong>Admin Login:</strong> /admin/login (has Email OTP toggle)</li>
                <li><strong>Regular Login:</strong> /login (has Email OTP toggle)</li>
                <li><strong>Registration:</strong> /register (SMS/Email choice)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center space-x-4">
          <a
            href="/admin/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            → Admin Login
          </a>
          <a
            href="/test-email-otp"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            → User Email OTP Test
          </a>
          <a
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            → Home
          </a>
        </div>
      </div>
    </div>
  );
}