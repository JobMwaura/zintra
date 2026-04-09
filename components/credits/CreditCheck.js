'use client';

import React, { useState, useEffect } from 'react';
import { checkSufficientCredits } from '@/lib/credits-helpers';
import Link from 'next/link';

/**
 * Credit Check Modal
 * Shows before posting a job/gig or applying
 * Ensures user has sufficient credits before proceeding
 */
export default function CreditCheck({
  userId,
  actionType,
  actionLabel,
  onProceed,
  onCancel,
}) {
  const [checking, setChecking] = useState(true);
  const [creditStatus, setCreditStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkCredits = async () => {
      try {
        const status = await checkSufficientCredits(userId, actionType);
        setCreditStatus(status);
        setError(null);
      } catch (err) {
        console.error('Error checking credits:', err);
        setError('Unable to verify credits');
      } finally {
        setChecking(false);
      }
    };

    if (userId && actionType) {
      checkCredits();
    }
  }, [userId, actionType]);

  if (checking) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex justify-center mb-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
          </div>
          <p className="text-center text-gray-600">Verifying your credits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h3 className="text-lg font-bold text-red-600 mb-2">Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={onCancel}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!creditStatus) {
    return null;
  }

  const { hasSufficient, balance, cost } = creditStatus;

  if (hasSufficient) {
    // User has sufficient credits - show confirmation
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Action</h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700 mb-3">
              You're about to <strong>{actionLabel}</strong>.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Cost:</span>
                <span className="font-semibold text-orange-600">{cost} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Balance:</span>
                <span className="font-semibold text-green-600">{balance} credits</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">After Action:</span>
                <span className="font-semibold text-blue-600">{balance - cost} credits</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 rounded transition"
            >
              Cancel
            </button>
            <button
              onClick={onProceed}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded transition"
            >
              Proceed
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Insufficient credits
  const creditsNeeded = cost - balance;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-red-600 mb-2">Insufficient Credits</h3>
        <p className="text-gray-700 mb-6">
          You don't have enough credits to {actionLabel}.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Credits Needed:</span>
              <span className="font-semibold text-red-600">{cost}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Your Balance:</span>
              <span className="font-semibold text-gray-600">{balance}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold text-gray-900">Still Need:</span>
              <span className="font-bold text-red-600">{creditsNeeded}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>Available Packages:</strong>
            <br />
            Starter: 1,000 credits for KES 1,000
            <br />
            Professional: 5,000 credits for KES 4,500 (10% off)
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold py-2 rounded transition"
          >
            Cancel
          </button>
          <Link
            href="/credits/buy"
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded transition text-center"
          >
            Buy Credits
          </Link>
        </div>
      </div>
    </div>
  );
}
