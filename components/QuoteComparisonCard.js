'use client';

import Link from 'next/link';
import { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, DollarSign } from 'lucide-react';

/**
 * QuoteComparisonCard Component
 * Shows a preview of quote comparison for an RFQ
 * Used on my-rfqs, dashboard, and summary pages
 */
export default function QuoteComparisonCard({ rfq, quotes = [] }) {
  if (!quotes || quotes.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-center">
        <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-600">No quotes to compare</p>
      </div>
    );
  }

  const prices = quotes.map(q => parseFloat(q.amount) || 0);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const priceRange = highestPrice - lowestPrice;
  const priceVariance = ((priceRange / averagePrice) * 100).toFixed(1);

  const acceptedCount = quotes.filter(q => q.status === 'accepted').length;
  const rejectedCount = quotes.filter(q => q.status === 'rejected').length;
  const pendingCount = quotes.filter(q => q.status === 'submitted').length;

  return (
    <Link href={`/quote-comparison/${rfq.id}`}>
      <div className="bg-white rounded-lg border border-slate-200 hover:border-orange-400 hover:shadow-lg transition p-4 cursor-pointer group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition">
              Quote Analysis
            </h3>
            <p className="text-xs text-slate-500">{quotes.length} quote{quotes.length !== 1 ? 's' : ''} received</p>
          </div>
          <BarChart3 className="w-5 h-5 text-orange-500 opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Price Statistics */}
        <div className="space-y-3 mb-4">
          {/* Lowest Price */}
          <div className="flex items-center justify-between p-2.5 bg-green-50 rounded border border-green-200">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Lowest</span>
            </div>
            <span className="text-sm font-bold text-green-900">
              KSh {lowestPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Highest Price */}
          <div className="flex items-center justify-between p-2.5 bg-red-50 rounded border border-red-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-700 font-medium">Highest</span>
            </div>
            <span className="text-sm font-bold text-red-900">
              KSh {highestPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Average Price */}
          <div className="flex items-center justify-between p-2.5 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">Average</span>
            </div>
            <span className="text-sm font-bold text-blue-900">
              KSh {averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Variance */}
        <div className="mb-4 p-2 bg-slate-50 rounded border border-slate-200">
          <p className="text-xs text-slate-600 mb-1">Price Variance</p>
          <div className="flex items-center justify-between">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden mr-2">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{ width: `${Math.min(priceVariance, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-slate-900">{priceVariance}%</span>
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex gap-2 text-xs">
          {acceptedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
              ✓ {acceptedCount} Accepted
            </span>
          )}
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
              ⧖ {pendingCount} Pending
            </span>
          )}
          {rejectedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
              ✕ {rejectedCount} Rejected
            </span>
          )}
        </div>

        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-xs text-orange-600 font-semibold group-hover:text-orange-700">
            View Comparison →
          </p>
        </div>
      </div>
    </Link>
  );
}
