'use client';

import React, { useState, useEffect } from 'react';
import { getUserCreditsBalance } from '@/lib/credits-helpers';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

/**
 * Credits Balance Widget
 * Displays user's current credit balance with option to buy more
 */
export default function CreditsBalance({ userId, variant = 'compact' }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true);
        const data = await getUserCreditsBalance(userId);

        if (data) {
          setBalance(data);
          setError(null);
        } else {
          setError('Unable to load credit balance');
        }
      } catch (err) {
        console.error('Error fetching balance:', err);
        setError('Error loading balance');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchBalance();

      // Refresh balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  if (loading) {
    return (
      <div className={variant === 'compact' ? 'px-4 py-2' : 'p-4'}>
        <div className="bg-gray-100 animate-pulse rounded h-8 w-24" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={variant === 'compact' ? 'px-4 py-2' : 'p-4'}>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!balance) {
    return null;
  }

  const formatNumber = (num) => new Intl.NumberFormat('en-KE').format(num);

  if (variant === 'compact') {
    // Header/navbar version
    return (
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-orange-600">
            {formatNumber(balance.credit_balance)}
          </span>
          <span className="text-xs text-gray-600">credits</span>
        </div>
        <Link
          href="/credits/buy"
          className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold px-3 py-1 rounded transition"
        >
          Buy
        </Link>
      </div>
    );
  }

  // Full version
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Credits</h3>

      {/* Balance Display */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 mb-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">Available Balance</p>
          <p className="text-5xl font-bold text-orange-600 mb-1">
            {formatNumber(balance.credit_balance)}
          </p>
          <p className="text-gray-600 text-sm">KES {formatNumber(balance.credit_balance)}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-1">Purchased</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatNumber(balance.total_purchased)}
          </p>
        </div>
        <div className="text-center border-l border-r border-gray-200">
          <p className="text-gray-600 text-sm mb-1">Used</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatNumber(balance.total_used)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-1">Refunded</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatNumber(balance.total_refunded)}
          </p>
        </div>
      </div>

      {/* Buy Button */}
      <Link
        href="/credits/buy"
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition text-center block"
      >
        Buy More Credits
      </Link>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Credits are used for posting jobs, posting gigs, and applying.
          Buy in bulk packages to save up to 10%.
        </p>
      </div>
    </div>
  );
}
