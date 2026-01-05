'use client';

import { LogIn } from 'lucide-react';

export default function StepAuth({ user, onUserChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Verify Your Account
        </h3>

        {user ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-900">Account Verified</p>
                <p className="text-sm text-green-800 mt-1">{user.email}</p>
                <p className="text-xs text-green-700 mt-2">
                  You're logged in and ready to submit your RFQ.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <LogIn className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Sign In Required</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Please log in or create an account to submit your RFQ.
                  </p>
                  <p className="text-xs text-blue-700 mt-2">
                    We need to verify your identity before sending RFQs to vendors.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors">
                Sign In
              </button>
              <button className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Create Account
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Your information is secure and will never be shared with vendors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
