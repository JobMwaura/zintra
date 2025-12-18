'use client';

/**
 * FavoritesTab Component
 * 
 * Display bookmarked/favorited RFQs
 * Users can save RFQs for quick reference
 */

import { RFQCard } from './index';
import { Star, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function FavoritesTab({
  rfqs = [],
  onViewQuotes,
  onViewDetails,
  onMessage,
  onFavorite,
  isLoading,
  formatDate,
  getDaysUntilDeadline,
  getStatusStyles,
  getPriceStats
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-200 rounded-lg h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (rfqs.length === 0) {
    return (
      <div className="text-center py-16">
        <Star className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No Favorite RFQs Yet
        </h3>
        <p className="text-slate-600 mb-6">
          Star RFQs to save them to your favorites for quick access and reference.
        </p>
        <Link
          href="/post-rfq"
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          <Plus className="w-5 h-5" />
          Create New RFQ
        </Link>
      </div>
    );
  }

  // Categorize favorites by status
  const activeFavorites = rfqs.filter(r => r.rfq_responses.length >= 2);
  const pendingFavorites = rfqs.filter(r => r.rfq_responses.length < 2);

  return (
    <div>
      {/* Tips Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Star className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5 fill-current" />
        <div>
          <h4 className="font-semibold text-yellow-900">Your Saved RFQs</h4>
          <p className="text-sm text-yellow-800 mt-1">
            You have {rfqs.length} starred RFQ{rfqs.length !== 1 ? 's' : ''} saved.
            These are your quick-access favorites for monitoring and reference.
          </p>
        </div>
      </div>

      {/* Active Favorites Section */}
      {activeFavorites.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              🔥 Hot Favorites ({activeFavorites.length})
            </h3>
            <span className="text-sm text-slate-600">
              With active quotes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeFavorites.map(rfq => (
              <RFQCard
                key={rfq.id}
                rfq={rfq}
                onViewQuotes={onViewQuotes}
                onViewDetails={onViewDetails}
                onMessage={onMessage}
                onFavorite={onFavorite}
                formatDate={formatDate}
                getDaysUntilDeadline={getDaysUntilDeadline}
                getStatusStyles={getStatusStyles}
                getPriceStats={getPriceStats}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending Favorites Section */}
      {pendingFavorites.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              ⏰ Pending Favorites ({pendingFavorites.length})
            </h3>
            <span className="text-sm text-slate-600">
              Waiting for quotes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingFavorites.map(rfq => (
              <RFQCard
                key={rfq.id}
                rfq={rfq}
                onViewQuotes={onViewQuotes}
                onViewDetails={onViewDetails}
                onMessage={onMessage}
                onFavorite={onFavorite}
                formatDate={formatDate}
                getDaysUntilDeadline={getDaysUntilDeadline}
                getStatusStyles={getStatusStyles}
                getPriceStats={getPriceStats}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Insights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-600">Total Favorites</p>
          <p className="text-3xl font-bold text-blue-900">{rfqs.length}</p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-green-600">Active (2+ Quotes)</p>
          <p className="text-3xl font-bold text-green-900">{activeFavorites.length}</p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm font-medium text-orange-600">Pending (&lt;2 Quotes)</p>
          <p className="text-3xl font-bold text-orange-900">{pendingFavorites.length}</p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm font-medium text-purple-600">Total Quotes</p>
          <p className="text-3xl font-bold text-purple-900">
            {rfqs.reduce((sum, r) => sum + r.rfq_responses.length, 0)}
          </p>
        </div>
      </div>

      {/* Value Analysis */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-4">Value at a Glance</h4>

        <div className="space-y-4">
          {/* Highest Value */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Highest Quote Value</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">
                {rfqs.reduce((max, r) => {
                  const stats = getPriceStats(r);
                  return stats.max > max.max ? { ...r, max: stats.max } : max;
                }, { title: 'N/A', max: 0 }).title}
              </p>
              <p className="text-sm font-bold text-slate-900">
                KSh {Math.max(...rfqs.map(r => getPriceStats(r).max || 0)).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Lowest Value */}
          <div className="pt-4 border-t border-slate-300">
            <p className="text-xs font-semibold text-slate-600 mb-2">Lowest Quote Value</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-900">
                {rfqs.reduce((min, r) => {
                  const stats = getPriceStats(r);
                  return stats.min && stats.min < (min.min || Infinity) ? { ...r, min: stats.min } : min;
                }, { title: 'N/A', min: Infinity }).title}
              </p>
              <p className="text-sm font-bold text-slate-900">
                KSh {Math.min(...rfqs.map(r => getPriceStats(r).min || Infinity)).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Average Value */}
          <div className="pt-4 border-t border-slate-300">
            <p className="text-xs font-semibold text-slate-600 mb-2">Average Quote Value</p>
            <p className="text-sm font-bold text-slate-900">
              KSh {Math.round(
                rfqs.reduce((sum, r) => sum + (getPriceStats(r).avg || 0), 0) / rfqs.length
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
