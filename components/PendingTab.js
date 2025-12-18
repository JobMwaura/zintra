'use client';

/**
 * PendingTab Component
 * 
 * Display RFQs waiting for quotes (< 2 responses)
 * Shows countdown to deadline and quick actions
 */

import { RFQCard } from './index';
import { AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function PendingTab({
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
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No Pending RFQs
        </h3>
        <p className="text-slate-600 mb-6">
          All your RFQs either have quotes or are closed. Great job!
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

  return (
    <div>
      {/* Info Banner */}
      {rfqs.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-yellow-900">Awaiting Quotes</h4>
            <p className="text-sm text-yellow-800 mt-1">
              You have {rfqs.length} RFQ{rfqs.length !== 1 ? 's' : ''} with fewer than 2 quotes. 
              Consider sending reminders to vendors to get more competitive bids.
            </p>
          </div>
        </div>
      )}

      {/* RFQs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rfqs.map(rfq => (
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

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <p className="text-sm font-medium text-slate-600">Total Pending</p>
          <p className="text-2xl font-bold text-slate-900">{rfqs.length}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600">Closing Soon (≤3 days)</p>
          <p className="text-2xl font-bold text-orange-600">
            {rfqs.filter(r => {
              const daysLeft = getDaysUntilDeadline(r.deadline);
              return daysLeft >= 0 && daysLeft <= 3;
            }).length}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600">Average Quotes Per RFQ</p>
          <p className="text-2xl font-bold text-slate-900">
            {rfqs.length > 0
              ? (rfqs.reduce((sum, r) => sum + r.rfq_responses.length, 0) / rfqs.length).toFixed(1)
              : '0'}
          </p>
        </div>
      </div>
    </div>
  );
}
