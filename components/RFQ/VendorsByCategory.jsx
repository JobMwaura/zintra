'use client';

import { useState, useEffect } from 'react';
import { Star, MapPin, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { filterVendorsByCategory, getMatchReason, getMatchConfidence } from '@/lib/matching/categoryMatcher';
import Link from 'next/link';

/**
 * VendorsByCategory Component
 * 
 * Displays vendors that match the RFQ's category
 * Used in RFQ details page to show relevant vendors
 * 
 * Phase 3 Feature 1: Category-based vendor filtering
 */

export default function VendorsByCategory({ 
  rfqCategorySlug, 
  rfqCategoryName,
  allVendors = [],
  loading = false,
  onVendorSelect = null 
}) {
  const [matchedVendors, setMatchedVendors] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Filter vendors when category or vendors list changes
  useEffect(() => {
    if (!rfqCategorySlug || !Array.isArray(allVendors)) {
      setMatchedVendors([]);
      return;
    }

    setIsFiltering(true);
    
    // Simulate async operation
    setTimeout(() => {
      const filtered = filterVendorsByCategory(allVendors, rfqCategorySlug);
      setMatchedVendors(filtered);
      setIsFiltering(false);
    }, 200);
  }, [rfqCategorySlug, allVendors]);

  // Show loading state
  if (loading || isFiltering) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <Loader className="w-5 h-5 text-blue-500 animate-spin" />
          <p className="text-gray-600">Finding vendors in this category...</p>
        </div>
      </div>
    );
  }

  // No vendors found
  if (matchedVendors.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900">No vendors in this category</h3>
            <p className="text-sm text-gray-600 mt-1">
              {rfqCategoryName ? `No vendors specialize in ${rfqCategoryName} yet.` : 'No vendors match this category.'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Try a different category or post a public RFQ to reach all vendors.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Vendors in {rfqCategoryName || 'This Category'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {matchedVendors.length} vendor{matchedVendors.length !== 1 ? 's' : ''} specialize in this category
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Category Match</span>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matchedVendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            categoryName={rfqCategoryName}
            onSelect={onVendorSelect}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual vendor card with category match info
 */
function VendorCard({ vendor, categoryName, onSelect }) {
  const handleViewProfile = () => {
    window.location.href = `/vendor-profile/${vendor.id}`;
  };

  const handleContact = () => {
    if (onSelect) {
      onSelect(vendor);
    }
  };

  const matchReason = getMatchReason(vendor, { categorySlug: vendor.primaryCategorySlug, categoryName });
  const confidence = getMatchConfidence(80); // Assuming category match = 80+ score

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-5">
      {/* Vendor Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm truncate">
            {vendor.name || 'Unnamed Vendor'}
          </h4>
          <p className="text-xs text-gray-500 truncate">
            {vendor.businessType || 'Service Provider'}
          </p>
        </div>
        {vendor.isVerified && (
          <div className="flex-shrink-0 ml-2">
            <div className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        )}
      </div>

      {/* Category Match Badge */}
      {vendor.primaryCategorySlug && (
        <div className="mb-3 inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded border border-green-200">
          <span className="text-xs font-medium text-green-700">
            {categoryName || vendor.primaryCategorySlug}
          </span>
        </div>
      )}

      {/* Location */}
      {(vendor.town || vendor.county) && (
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
          <MapPin className="w-3 h-3" />
          <span>{vendor.town || vendor.county}</span>
        </div>
      )}

      {/* Rating */}
      {vendor.rating !== undefined && (
        <div className="flex items-center gap-1 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(vendor.rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-gray-700">
            {vendor.rating?.toFixed(1) || 'N/A'}
          </span>
          {vendor.reviewCount && (
            <span className="text-xs text-gray-500">
              ({vendor.reviewCount} reviews)
            </span>
          )}
        </div>
      )}

      {/* Match Reason */}
      {matchReason && (
        <p className="text-xs text-gray-600 mb-4 line-clamp-2">
          {matchReason}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={handleViewProfile}
          className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
        >
          View Profile
        </button>
        <button
          onClick={handleContact}
          className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
        >
          Contact
        </button>
      </div>
    </div>
  );
}
