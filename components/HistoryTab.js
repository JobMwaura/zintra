'use client';

/**
 * HistoryTab Component
 * 
 * Display closed/completed RFQs
 * Shows final quotes and spending analytics
 */

import { RFQCard } from './index';
import { CheckCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function HistoryTab({
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
        <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No Completed RFQs Yet
        </h3>
        <p className="text-slate-600 mb-6">
          Your completed RFQs will appear here. Start by creating and closing RFQs.
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

  // Calculate spending analytics
  const totalSpent = rfqs.reduce((sum, r) => {
    const selectedQuote = r.rfq_responses.find(q => q.selected);
    return sum + (selectedQuote?.quote_price || 0);
  }, 0);

  const avgSpentPerRFQ = rfqs.length > 0 ? totalSpent / rfqs.length : 0;
  const totalQuotesReceived = rfqs.reduce((sum, r) => sum + r.rfq_responses.length, 0);
  const completedThisMonth = rfqs.filter(r => {
    const createdDate = new Date(r.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div>
      {/* Completion Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-emerald-900">RFQ History</h4>
          <p className="text-sm text-emerald-800 mt-1">
            You have completed {rfqs.length} RFQ{rfqs.length !== 1 ? 's' : ''}. 
            Review your purchase history and find trending products.
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

      {/* Spending Analytics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-600 mb-1">Completed RFQs</p>
          <p className="text-3xl font-bold text-blue-900">{rfqs.length}</p>
          <p className="text-xs text-blue-700 mt-2">{completedThisMonth} this month</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-green-600 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-green-900">KSh {Math.round(totalSpent).toLocaleString()}</p>
          <p className="text-xs text-green-700 mt-2">On {rfqs.length} purchases</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <p className="text-sm font-medium text-orange-600 mb-1">Avg Per RFQ</p>
          <p className="text-2xl font-bold text-orange-900">KSh {Math.round(avgSpentPerRFQ).toLocaleString()}</p>
          <p className="text-xs text-orange-700 mt-2">Across all RFQs</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <p className="text-sm font-medium text-purple-600 mb-1">Total Quotes</p>
          <p className="text-3xl font-bold text-purple-900">{totalQuotesReceived}</p>
          <p className="text-xs text-purple-700 mt-2">Avg {(totalQuotesReceived / rfqs.length).toFixed(1)}/RFQ</p>
        </div>
      </div>

      {/* Top Vendors */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Top Vendors</h4>
        <div className="space-y-3">
          {(() => {
            // Get vendor frequency
            const vendorMap = new Map();
            rfqs.forEach(rfq => {
              rfq.rfq_responses.forEach(quote => {
                const vendorName = quote.vendor_name || 'Unknown';
                vendorMap.set(vendorName, (vendorMap.get(vendorName) || 0) + 1);
              });
            });

            // Sort by frequency
            const topVendors = Array.from(vendorMap.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5);

            if (topVendors.length === 0) {
              return <p className="text-sm text-slate-600">No vendor data available</p>;
            }

            return topVendors.map(([vendor, count], idx) => (
              <div key={vendor} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{vendor}</p>
                    <p className="text-xs text-slate-500">{count} quote{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {((count / totalQuotesReceived) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <h4 className="font-semibold text-slate-900 mb-3">Category Breakdown</h4>
        <div className="space-y-3">
          {(() => {
            // Get category frequency
            const categoryMap = new Map();
            rfqs.forEach(rfq => {
              const category = rfq.category || 'Uncategorized';
              categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
            });

            // Sort by frequency
            const topCategories = Array.from(categoryMap.entries())
              .sort((a, b) => b[1] - a[1]);

            if (topCategories.length === 0) {
              return <p className="text-sm text-slate-600">No category data available</p>;
            }

            return topCategories.map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">{category}</p>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                      style={{ width: `${(count / rfqs.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-slate-900 w-12 text-right">
                    {count}
                  </p>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
