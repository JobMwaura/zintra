// File: components/VerificationMethodToggle.js
// Purpose: Toggle between SMS and Email OTP verification during registration

'use client';

import { useState } from 'react';

export default function VerificationMethodToggle({ 
  currentMethod, 
  onMethodChange,
  showEmailVerified = false,
  emailVerified = false,
  className = ""
}) {
  return (
    <div className={`mb-6 ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">Choose Verification Method</h3>
      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => onMethodChange('sms')}
          className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
            currentMethod === 'sms'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📱 SMS Verification
        </button>
        <button
          type="button"
          onClick={() => onMethodChange('email')}
          className={`flex-1 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
            currentMethod === 'email'
              ? 'bg-white text-orange-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📧 Email Verification
          {showEmailVerified && emailVerified && (
            <span className="ml-1 text-green-600">✓</span>
          )}
        </button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        {currentMethod === 'sms' ? (
          <>📱 We'll send a verification code to your phone number</>
        ) : (
          <>📧 We'll send a verification code to your email address</>
        )}
      </div>
    </div>
  );
}