'use client';

/**
 * FilterBar Component
 * 
 * Search, filter, and sort controls for the RFQ dashboard
 * Features: Text search, status filter, date range, sort options
 */

import { Search, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function FilterBar({
  onSearch,
  onStatusFilter,
  onDateRangeFilter,
  onSort,
  searchValue = '',
  statusValue = 'all',
  dateRangeValue = 'all',
  sortValue = 'latest'
}) {
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'quarter', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const sortOptions = [
    { value: 'latest', label: 'Latest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'deadline-soon', label: 'Deadline Soon' },
    { value: 'deadline-far', label: 'Deadline Far' },
    { value: 'quotes-most', label: 'Most Quotes' },
    { value: 'quotes-least', label: 'Fewest Quotes' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'closed', label: 'Closed' }
  ];

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200 p-4 mb-6">
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search RFQs by title, description, category..."
            value={searchValue}
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {searchValue && (
            <button
              onClick={() => onSearch?.('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Status
          </label>
          <select
            value={statusValue}
            onChange={(e) => onStatusFilter?.(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Date Range
          </label>
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-left flex items-center justify-between hover:bg-slate-50"
          >
            <span>{dateRangeOptions.find(o => o.value === dateRangeValue)?.label || 'All Time'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showDateDropdown && (
            <div className="absolute top-full mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg z-10">
              {dateRangeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onDateRangeFilter?.(opt.value);
                    setShowDateDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 hover:bg-slate-100 text-sm ${
                    dateRangeValue === opt.value ? 'bg-orange-50 text-orange-700 font-semibold' : ''
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Sort By
          </label>
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-left flex items-center justify-between hover:bg-slate-50"
          >
            <span>{sortOptions.find(o => o.value === sortValue)?.label || 'Latest First'}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showSortDropdown && (
            <div className="absolute top-full mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg z-10">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onSort?.(opt.value);
                    setShowSortDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 hover:bg-slate-100 text-sm ${
                    sortValue === opt.value ? 'bg-orange-50 text-orange-700 font-semibold' : ''
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex items-end">
          <div className="w-full bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs font-semibold text-slate-600 mb-1">Quick Stats</p>
            <p className="text-sm font-bold text-orange-600">
              Filters Active
            </p>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(searchValue || statusValue !== 'all' || dateRangeValue !== 'all' || sortValue !== 'latest') && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-slate-600">Active Filters:</span>

            {searchValue && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
                <span>Search: "{searchValue}"</span>
                <button
                  onClick={() => onSearch?.('')}
                  className="hover:text-blue-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {statusValue !== 'all' && (
              <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs">
                <span>Status: {statusOptions.find(o => o.value === statusValue)?.label}</span>
                <button
                  onClick={() => onStatusFilter?.('all')}
                  className="hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {dateRangeValue !== 'all' && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs">
                <span>Date: {dateRangeOptions.find(o => o.value === dateRangeValue)?.label}</span>
                <button
                  onClick={() => onDateRangeFilter?.('all')}
                  className="hover:text-green-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {sortValue !== 'latest' && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs">
                <span>Sort: {sortOptions.find(o => o.value === sortValue)?.label}</span>
                <button
                  onClick={() => onSort?.('latest')}
                  className="hover:text-amber-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Clear All */}
            <button
              onClick={() => {
                onSearch?.('');
                onStatusFilter?.('all');
                onDateRangeFilter?.('all');
                onSort?.('latest');
              }}
              className="ml-2 text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
