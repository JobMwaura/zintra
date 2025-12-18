'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingDown, TrendingUp } from 'lucide-react';

/**
 * RevisionTimeline Component
 * Visual timeline of all quote revisions and price changes during negotiation
 * 
 * Props:
 * - revisions: array - List of quote revisions
 * - originalPrice: number - Original quote price
 * - currentPrice: number - Current negotiation price
 * - loading: boolean - Loading state
 */
export default function RevisionTimeline({
  revisions = [],
  originalPrice,
  currentPrice,
  loading = false
}) {
  const [expandedRevision, setExpandedRevision] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Sort revisions by date
  const sortedRevisions = [...revisions].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  // Calculate statistics
  const lowestPrice = Math.min(...sortedRevisions.map(r => r.price || originalPrice), originalPrice);
  const highestPrice = Math.max(...sortedRevisions.map(r => r.price || originalPrice), originalPrice);
  const averagePrice = sortedRevisions.length > 0
    ? (sortedRevisions.reduce((sum, r) => sum + (r.price || 0), originalPrice) / (sortedRevisions.length + 1))
    : originalPrice;

  const maxSavings = originalPrice - lowestPrice;
  const maxSavingsPercent = ((maxSavings / originalPrice) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quote Revision History</h3>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded p-3 border">
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Revisions</p>
            <p className="text-lg font-bold text-gray-900">{sortedRevisions.length}</p>
          </div>
          <div className="bg-white rounded p-3 border">
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Original Price</p>
            <p className="text-lg font-bold text-gray-900">₹{originalPrice?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded p-3 border">
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Highest Revision</p>
            <p className="text-lg font-bold text-red-600">₹{highestPrice?.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded p-3 border">
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Lowest Revision</p>
            <p className="text-lg font-bold text-green-600">₹{lowestPrice?.toLocaleString()}</p>
          </div>
        </div>

        {/* Savings Summary */}
        {maxSavings > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-800">
                <span className="font-semibold">Maximum potential savings:</span> ₹{maxSavings.toLocaleString()} ({maxSavingsPercent}%)
              </p>
            </div>
          </div>
        )}

        {maxSavings < 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-800">
                <span className="font-semibold">Price increase:</span> ₹{Math.abs(maxSavings).toLocaleString()} ({Math.abs(maxSavingsPercent)}%)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="p-6">
        {sortedRevisions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No revisions yet. This is the original quote.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Original quote entry */}
            <div className="relative">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-bold text-blue-700">0</span>
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Original Quote</h4>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded font-semibold">
                        Starting Point
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mb-2">₹{originalPrice?.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">This is the initial quoted price</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Revisions */}
            {sortedRevisions.map((revision, index) => {
              const previousPrice = index === 0 ? originalPrice : (sortedRevisions[index - 1]?.price || originalPrice);
              const priceDifference = revision.price - previousPrice;
              const percentChange = ((priceDifference / previousPrice) * 100).toFixed(1);
              const isExpanded = expandedRevision === revision.id;

              return (
                <div key={revision.id} className="relative">
                  {/* Timeline dot */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        priceDifference < 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {priceDifference < 0 ? (
                          <TrendingDown className={`w-5 h-5 text-green-700`} />
                        ) : (
                          <TrendingUp className={`w-5 h-5 text-red-700`} />
                        )}
                      </div>
                    </div>

                    {/* Card */}
                    <div className="flex-1">
                      <button
                        onClick={() => setExpandedRevision(isExpanded ? null : revision.id)}
                        className="w-full text-left p-4 rounded-lg border hover:shadow-md transition bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">
                                Revision #{revision.revision_number}
                              </h4>
                              <span className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${
                                priceDifference < 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {priceDifference < 0 ? '−' : '+'}₹{Math.abs(priceDifference).toLocaleString()} ({percentChange}%)
                              </span>
                            </div>
                            <p className="text-2xl font-bold mb-1">₹{revision.price?.toLocaleString()}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(revision.created_at).toLocaleDateString()} at {new Date(revision.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {revision.change_reason && (
                              <p className="text-sm text-gray-700 mt-2">Reason: {revision.change_reason}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Price Change</p>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-2xl font-bold ${priceDifference < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {priceDifference >= 0 ? '+' : '−'}₹{Math.abs(priceDifference).toLocaleString()}
                              </span>
                              <span className={`text-lg font-semibold ${priceDifference < 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ({percentChange}%)
                              </span>
                            </div>
                          </div>

                          {revision.scope_summary && (
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Scope Summary</p>
                              <p className="text-sm text-gray-900">{revision.scope_summary}</p>
                            </div>
                          )}

                          {revision.delivery_date && (
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Delivery Date</p>
                              <p className="text-sm text-gray-900">{new Date(revision.delivery_date).toLocaleDateString()}</p>
                            </div>
                          )}

                          {revision.payment_terms && (
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Payment Terms</p>
                              <p className="text-sm text-gray-900">{revision.payment_terms}</p>
                            </div>
                          )}

                          {revision.revision_notes && (
                            <div>
                              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Notes</p>
                              <p className="text-sm text-gray-900">{revision.revision_notes}</p>
                            </div>
                          )}

                          <div className="pt-2 border-t border-gray-300">
                            <p className="text-xs text-gray-600">
                              Changed by user on {new Date(revision.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Progression Chart */}
      {sortedRevisions.length > 0 && (
        <div className="border-t p-6 bg-gray-50">
          <h4 className="font-semibold text-gray-900 mb-4">Price Progression</h4>
          <div className="space-y-2">
            {[originalPrice, ...sortedRevisions.map(r => r.price)].map((price, index) => {
              const range = highestPrice - lowestPrice;
              const percentage = range === 0 ? 50 : ((price - lowestPrice) / range) * 100;
              const label = index === 0 ? 'Original' : `Rev ${index}`;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <span className="text-xs font-semibold text-gray-900">₹{price?.toLocaleString()}</span>
                  </div>
                  <div className="h-6 bg-white rounded border border-gray-300 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        index === 0 ? 'bg-blue-400' : (price < originalPrice ? 'bg-green-400' : 'bg-red-400')
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
