'use client';

import { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Check, X, Download, Filter } from 'lucide-react';

/**
 * ✅ QuoteComparisonTable Component
 * Displays quotes side-by-side with sorting, filtering, and export
 * 
 * Props:
 * - quotes: array of quote objects
 * - vendors: map of vendor data {id: {...}}
 * - onSelectQuote: callback when quote is selected
 * - selectedQuoteId: currently selected quote ID
 */
export default function QuoteComparisonTable({ quotes = [], vendors = {}, onSelectQuote, selectedQuoteId }) {
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all'); // all, submitted, revised, accepted, rejected
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');

  // Filter quotes
  const filteredQuotes = useMemo(() => {
    let result = [...quotes];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(q => q.status === filterStatus);
    }

    // Filter by price range
    if (filterMinPrice || filterMaxPrice) {
      result = result.filter(q => {
        const price = parseFloat(q.amount) || 0;
        const min = filterMinPrice ? parseFloat(filterMinPrice) : 0;
        const max = filterMaxPrice ? parseFloat(filterMaxPrice) : Infinity;
        return price >= min && price <= max;
      });
    }

    return result;
  }, [quotes, filterStatus, filterMinPrice, filterMaxPrice]);

  // Sort quotes
  const sortedQuotes = useMemo(() => {
    const result = [...filteredQuotes];
    
    result.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'price':
          aVal = parseFloat(a.amount) || 0;
          bVal = parseFloat(b.amount) || 0;
          break;
        case 'vendor_rating':
          const vendorA = vendors[a.vendor_id];
          const vendorB = vendors[b.vendor_id];
          aVal = vendorA?.rating || 0;
          bVal = vendorB?.rating || 0;
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [filteredQuotes, sortBy, sortDir, vendors]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Vendor', 'Rating', 'Price', 'Timeline', 'Status', 'Date'];
    const rows = sortedQuotes.map(q => {
      const vendor = vendors[q.vendor_id];
      return [
        vendor?.company_name || 'Unknown',
        vendor?.rating || 'N/A',
        `KSh ${parseFloat(q.amount).toLocaleString()}`,
        q.timeline || 'Not specified',
        q.status || 'submitted',
        new Date(q.created_at).toLocaleDateString(),
      ];
    });

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes-comparison.csv';
    a.click();
  };

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-600">No quotes received yet</p>
        <p className="text-sm text-slate-500 mt-1">Vendors will appear here once they respond</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters & Export */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <Filter className="h-4 w-4 text-slate-600" />
        
        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-400 focus:border-orange-400"
        >
          <option value="all">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="revised">Revised</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Price range filters */}
        <input
          type="number"
          placeholder="Min price"
          value={filterMinPrice}
          onChange={(e) => setFilterMinPrice(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-400 focus:border-orange-400 w-32"
        />
        <span className="text-slate-400">-</span>
        <input
          type="number"
          placeholder="Max price"
          value={filterMaxPrice}
          onChange={(e) => setFilterMaxPrice(e.target.value)}
          className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-400 focus:border-orange-400 w-32"
        />

        {/* Export button */}
        <button
          onClick={exportToCSV}
          className="ml-auto flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-600">
        Showing {sortedQuotes.length} of {quotes.length} quotes
      </p>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('vendor')}
                  className="flex items-center gap-1 font-semibold text-slate-900 hover:text-orange-600 transition"
                >
                  Vendor
                  {sortBy === 'vendor' && (
                    sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('vendor_rating')}
                  className="flex items-center gap-1 font-semibold text-slate-900 hover:text-orange-600 transition"
                >
                  Rating
                  {sortBy === 'vendor_rating' && (
                    sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('price')}
                  className="ml-auto flex items-center gap-1 font-semibold text-slate-900 hover:text-orange-600 transition"
                >
                  Price
                  {sortBy === 'price' && (
                    sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">Timeline</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-900">Submitted</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-900">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedQuotes.map((quote) => {
              const vendor = vendors[quote.vendor_id];
              const isSelected = selectedQuoteId === quote.id;

              return (
                <tr
                  key={quote.id}
                  className={`border-b border-slate-200 hover:bg-orange-50 transition ${
                    isSelected ? 'bg-orange-100' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{vendor?.company_name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{vendor?.phone || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {vendor?.rating ? parseFloat(vendor.rating).toFixed(1) : 'New'}
                      </span>
                      {vendor?.verified && (
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Verified
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    KSh {parseFloat(quote.amount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{quote.timeline || 'Not specified'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      quote.status === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : quote.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : quote.status === 'revised'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {quote.status || 'submitted'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(quote.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onSelectQuote?.(quote.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                        isSelected
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {sortedQuotes.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium">Lowest Price</p>
            <p className="text-lg font-bold text-blue-900">
              KSh {Math.min(...sortedQuotes.map(q => parseFloat(q.amount) || 0)).toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium">Highest Rated</p>
            <p className="text-lg font-bold text-green-900">
              {Math.max(
                ...sortedQuotes.map(q => {
                  const v = vendors[q.vendor_id];
                  return v?.rating ? parseFloat(v.rating) : 0;
                })
              ).toFixed(1)} ⭐
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-600 font-medium">Average Price</p>
            <p className="text-lg font-bold text-orange-900">
              KSh {(sortedQuotes.reduce((sum, q) => sum + (parseFloat(q.amount) || 0), 0) / sortedQuotes.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-xs text-purple-600 font-medium">Total Quotes</p>
            <p className="text-lg font-bold text-purple-900">{sortedQuotes.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
