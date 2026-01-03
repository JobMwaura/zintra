'use client';

/**
 * Improved Dashboard Layout Component
 * 
 * Implements Phase 1 UX improvements:
 * - Simplified filter bar (quick filters + advanced toggle)
 * - Better statistics display
 * - Empty state handling
 * - Cleaner overall layout
 */

import { useState } from 'react';
import { ChevronDown, X, Settings } from 'lucide-react';

export default function ImprovedDashboardLayout({
  children,
  stats,
  searchValue,
  onSearch,
  statusValue,
  onStatusFilter,
  sortValue,
  onSort,
  hasRFQs,
  isLoading
}) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Get active filters count
  const activeFiltersCount = [
    statusValue !== 'all' ? 1 : 0,
    sortValue !== 'latest' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Simplified Statistics */}
      {hasRFQs && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pending RFQs - Alert */}
          {stats?.pending > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⏳</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900">
                    {stats.pending} Awaiting Quotes
                  </h3>
                  <p className="text-sm text-yellow-800 mt-1">
                    Waiting for vendor responses
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Active RFQs - Good News */}
          {stats?.active > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✅</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">
                    {stats.active} Getting Quotes
                  </h3>
                  <p className="text-sm text-blue-800 mt-1">
                    Vendors are responding
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Completed RFQs */}
          {stats?.completed > 0 && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎉</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900">
                    {stats.completed} Completed
                  </h3>
                  <p className="text-sm text-green-800 mt-1">
                    Closed or in progress
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simplified Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by title, category..."
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          {/* Status Filter */}
          <select
            value={statusValue}
            onChange={(e) => onStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortValue}
            onChange={(e) => onSort(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="deadline-soon">Deadline Soon</option>
            <option value="quotes-most">Most Quotes</option>
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Advanced
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Active Filters Pills */}
        {activeFiltersCount > 0 && (
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-600 font-medium">Active Filters:</span>
            {statusValue !== 'all' && (
              <button
                onClick={() => onStatusFilter('all')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium hover:bg-orange-200"
              >
                Status: {statusValue}
                <X className="w-3 h-3" />
              </button>
            )}
            {sortValue !== 'latest' && (
              <button
                onClick={() => onSort('latest')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium hover:bg-orange-200"
              >
                Sort: {sortValue}
                <X className="w-3 h-3" />
              </button>
            )}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  onStatusFilter('all');
                  onSort('latest');
                  onSearch('');
                }}
                className="text-xs text-orange-600 hover:text-orange-800 font-medium underline"
              >
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Advanced Filters (Collapsed by default) */}
        {showAdvancedFilters && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600">
              Advanced filters coming soon...
            </p>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div>
        {children}
      </div>
    </div>
  );
}
