'use client';

import Link from 'next/link';
import { Star, MapPin, Clock, Zap } from 'lucide-react';
import { VerificationMini } from '@/app/components/VerificationBadge';

/**
 * Enhanced VendorCard Component
 * 
 * Layout:
 * [Cover/Gradient + Logo Circle]
 * [Featured/Verified Chip]
 * Vendor Name
 * Category Chips
 * ⭐ Rating (avg) • Responds in X mins
 * 📍 Location • Delivery available
 * [Request Quote] [View Profile]
 * 
 * Pulls data directly from vendor profile
 */
export function VendorCard({ vendor, className = '' }) {
  if (!vendor) return null;

  const {
    id,
    company_name,
    primary_category_slug,
    category,
    rating = 0,
    rating_count = 0,
    response_time_minutes = 30,
    location,
    county,
    logo_url,
    is_verified = false,
    featured = false,
    description,
    delivery_available = false,
    cover_image,
  } = vendor;

  // Get category display name
  const getCategoryLabel = () => {
    if (!primary_category_slug && !category) return 'Construction';
    const slug = primary_category_slug || category;
    return slug
      ?.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get initials for fallback logo
  const getInitials = () => {
    return company_name
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'V';
  };

  const categoryLabel = getCategoryLabel();

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full ${className}`}>
      {/* Cover/Gradient + Logo Circle */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden">
        {/* Decorative pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
          }}
        />

        {/* Logo Circle - Positioned at bottom-center-ish */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 z-10">
          {logo_url ? (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center overflow-hidden">
              <img
                src={logo_url}
                alt={company_name}
                className="w-full h-full object-contain p-2"
              />
            </div>
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center font-bold text-lg sm:text-2xl text-orange-600">
              {getInitials()}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 sm:px-6 pt-14 sm:pt-16 pb-4 sm:pb-6 flex-1 flex flex-col">
        {/* Featured/Verified Chip */}
        <div className="flex items-center gap-2 mb-3">
          {featured && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-semibold text-yellow-700">
              <Zap className="w-3.5 h-3.5" />
              Featured
            </span>
          )}
          {is_verified && (
            <VerificationMini size="sm" className="flex-shrink-0" />
          )}
        </div>

        {/* Vendor Name */}
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {company_name}
        </h3>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full text-xs font-medium text-orange-700">
            {categoryLabel}
          </span>
          {description && (
            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 line-clamp-1">
              {description.split(' ').slice(0, 3).join(' ')}
            </span>
          )}
        </div>

        {/* Rating & Response Time */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="ml-1 font-semibold text-gray-900">
                {rating.toFixed(1)}
              </span>
              {rating_count > 0 && (
                <span className="ml-1 text-gray-500">
                  ({rating_count})
                </span>
              )}
            </div>
          </div>

          {/* Response Time */}
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Responds in {response_time_minutes}m</span>
          </div>
        </div>

        {/* Location & Delivery */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 flex-wrap">
          {/* Location */}
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">{location || county || 'Kenya'}</span>
          </div>

          {/* Delivery Available */}
          {delivery_available && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700">
              ✓ Delivery available
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-auto">
          {/* Request Quote Button */}
          <Link href={`/post-rfq?vendor_id=${id}`} className="flex-1">
            <button className="w-full px-4 py-2.5 sm:py-3 bg-white border-2 border-orange-500 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors text-sm">
              Request Quote
            </button>
          </Link>

          {/* View Profile Button */}
          <Link href={`/vendor-profile/${id}`} className="flex-1">
            <button className="w-full px-4 py-2.5 sm:py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors text-sm">
              View Profile
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VendorCard;
