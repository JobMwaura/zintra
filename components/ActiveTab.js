'use client';

/**
 * ActiveTab Component
 * 
 * Display RFQs with quotes (2+ responses)
 * Shows price statistics and vendor competition
 */

import { RFQCard } from './index';
import { TrendingUp, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ActiveTab({
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
        <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No Active RFQs
        </h3>
        <p className="text-slate-600 mb-6">
          Create a new RFQ to start receiving quotes from vendors.
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

  // Calculate aggregate statistics
  const totalQuotes = rfqs.reduce((sum, r) => sum + r.rfq_responses.length, 0);
  const avgQuotesPerRFQ = (totalQuotes / rfqs.length).toFixed(1);
  const hotRFQs = rfqs.filter(r => r.rfq_responses.length >= 5).length;

  return (
    <div>
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-green-900">Getting Quotes!</h4>
          <p className="text-sm text-green-800 mt-1">
            You have {rfqs.length} RFQ{rfqs.length !== 1 ? 's' : ''} with active quotes from vendors. 
            Review and compare quotes to find the best deal.
          </p>
        </div>
      </div>

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

      {/* Statistics Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-600 mb-1">Active RFQs</p>
          <p className="text-3xl font-bold text-blue-900">{rfqs.length}</p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm font-medium text-purple-600 mb-1">Total Quotes Received</p>
          <p className="text-3xl font-bold text-purple-900">{totalQuotes}</p>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm font-medium text-orange-600 mb-1">Avg Quotes/RFQ</p>
          <p className="text-3xl font-bold text-orange-900">{avgQuotesPerRFQ}</p>
        </div>

        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm font-medium text-red-600 mb-1">🔥 Hot (5+ Quotes)</p>
          <p className="text-3xl font-bold text-red-900">{hotRFQs}</p>
        </div>
      </div>

      {/* Competition Insight */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Competition Insight</h4>
        <div className="space-y-3">
          {rfqs
            .sort((a, b) => b.rfq_responses.length - a.rfq_responses.length)
            .slice(0, 3)
            .map((rfq, idx) => (
              <div key={rfq.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{rfq.title}</p>
                  <p className="text-xs text-slate-500">
                    {rfq.rfq_responses.length} vendor{rfq.rfq_responses.length !== 1 ? 's' : ''} competing
                  </p>
                </div>
                <div className="flex gap-1">
                  {[...Array(Math.min(rfq.rfq_responses.length, 5))].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-8 bg-gradient-to-t from-orange-400 to-orange-600 rounded"
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
