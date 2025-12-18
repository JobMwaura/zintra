/**
 * ============================================================================
 * BUYER REPUTATION PROFILE COMPONENT
 * ============================================================================
 * Displays comprehensive reputation information for a buyer
 * 
 * Props:
 * - buyerId: string (UUID of the buyer)
 * - showRecalculate: boolean (default: false)
 * - onRecalculate: function (callback when recalculated)
 * 
 * Features:
 * - Shows reputation badge and score
 * - Displays metric breakdown
 * - Shows tier information
 * - Progress bar to next tier
 * - Recalculation trigger (if enabled)
 * 
 * Usage:
 * <BuyerReputationProfile buyerId={userId} showRecalculate={false} />
 * 
 * ============================================================================
 */

'use client';

import { useState } from 'react';
import { useBuyerReputation } from '@/hooks/useBuyerReputation';
import BuyerReputationBadge from './BuyerReputationBadge';
import { Loader, AlertCircle, RefreshCw } from 'lucide-react';

export default function BuyerReputationProfile({
  buyerId,
  showRecalculate = false,
  onRecalculate = null
}) {
  const { reputation, loading, error, recalculate } = useBuyerReputation(buyerId);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const result = await recalculate(buyerId);
      if (result && onRecalculate) {
        onRecalculate(result);
      }
    } finally {
      setIsRecalculating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading reputation data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Failed to Load Reputation</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reputation) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
        <p className="text-gray-700">No reputation data available</p>
      </div>
    );
  }

  // Calculate progress to next tier
  const getProgressToNextTier = () => {
    const score = reputation.reputation_score;
    if (score < 25) return { current: score, next: 25, percentage: (score / 25) * 100 };
    if (score < 50) return { current: score - 25, next: 25, percentage: ((score - 25) / 25) * 100 };
    if (score < 75) return { current: score - 50, next: 25, percentage: ((score - 50) / 25) * 100 };
    return { current: score - 75, next: 25, percentage: ((score - 75) / 25) * 100 };
  };

  const progress = getProgressToNextTier();

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-blue-600';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getNextTierLabel = () => {
    const score = reputation.reputation_score;
    if (score < 25) return 'Silver';
    if (score < 50) return 'Gold';
    if (score < 75) return 'Platinum';
    return 'Maximum';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-6">
      {/* Header with Badge */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Buyer Reputation</h3>
          <p className="text-sm text-gray-600">Public reputation profile</p>
        </div>
        <BuyerReputationBadge
          tier={reputation.badge_tier}
          score={reputation.reputation_score}
          size="lg"
        />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total RFQs */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
            RFQs Posted
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {reputation.total_rfqs}
          </p>
          <p className="text-xs text-gray-600 mt-1">Contribution to score: +{Math.min(reputation.total_rfqs * 2, 30)}</p>
        </div>

        {/* Response Rate */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
            Response Rate
          </p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {reputation.response_rate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">Contribution: +{(reputation.response_rate / 100 * 35).toFixed(1)}</p>
        </div>

        {/* Acceptance Rate */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
            Acceptance Rate
          </p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {reputation.acceptance_rate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">Contribution: +{(reputation.acceptance_rate / 100 * 35).toFixed(1)}</p>
        </div>
      </div>

      {/* Overall Score Progress */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Overall Score</span>
          <span className="text-sm font-bold text-gray-900">
            {reputation.reputation_score}/100
          </span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${getProgressColor(reputation.reputation_score)} transition-all duration-500`}
            style={{ width: `${reputation.reputation_score}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {progress.current}/{progress.next} points to {getNextTierLabel()}
        </p>
      </div>

      {/* Tier Information Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Tier</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Range</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[
              { tier: 'Bronze', range: '0-24', emoji: '🥉' },
              { tier: 'Silver', range: '25-49', emoji: '🥈' },
              { tier: 'Gold', range: '50-74', emoji: '🥇' },
              { tier: 'Platinum', range: '75-100', emoji: '👑' }
            ].map(({ tier, range, emoji }) => {
              const isCurrentTier = tier.toLowerCase() === reputation.badge_tier;
              return (
                <tr
                  key={tier}
                  className={isCurrentTier ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}
                >
                  <td className="px-4 py-3 text-sm">
                    <span className="text-lg mr-2">{emoji}</span>
                    <span className={isCurrentTier ? 'font-bold text-blue-700' : 'text-gray-900'}>
                      {tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{range} points</td>
                  <td className="px-4 py-3 text-sm">
                    {isCurrentTier && (
                      <span className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                        Current
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recalculate Button */}
      {showRecalculate && (
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          {isRecalculating ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Recalculating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Recalculate Reputation
            </>
          )}
        </button>
      )}

      {/* Last Updated */}
      <p className="text-xs text-gray-500 text-center">
        Last updated: {new Date(reputation.updated_at).toLocaleString()}
      </p>
    </div>
  );
}
