'use client';

import EnhancedRegistration from '@/components/EnhancedRegistration';

/**
 * Test page for Email + SMS OTP Registration
 * 
 * Access at: /test-email-otp
 * 
 * This page lets you test the enhanced registration system with:
 * - SMS OTP (existing system)
 * - Email OTP (new feature)
 */

export default function TestEmailOTP() {
  const handleSuccess = (data) => {
    console.log('Registration successful:', data);
    alert('Registration successful! Check console for details.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Test Email + SMS OTP Registration
          </h1>
          <p className="text-gray-600 mt-2">
            Choose between SMS or Email verification during signup
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-blue-800 font-medium mb-2">🧪 Testing Features:</h3>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• Choose SMS or Email verification</li>
            <li>• Professional branded emails via EventsGear</li>
            <li>• Fallback options if one method fails</li>
            <li>• Same security standards for both methods</li>
          </ul>
        </div>

        <EnhancedRegistration 
          userType="user" 
          onSuccess={handleSuccess}
        />

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium mb-2">📋 Test Instructions:</h3>
          <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
            <li>Fill out the registration form</li>
            <li>Choose SMS or Email verification</li>
            <li>Check your phone/email for the code</li>
            <li>Enter the 6-digit verification code</li>
            <li>Account will be created automatically</li>
          </ol>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/user-registration" 
            className="text-orange-500 hover:text-orange-600 text-sm"
          >
            ← Back to regular registration
          </a>
        </div>
      </div>
    </div>
  );
}