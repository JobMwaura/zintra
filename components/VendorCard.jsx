'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import Link from 'next/link';
import { Star, MapPin, Clock, CheckCircle2 } from 'lucide-react';

// Lazy-load RFQ modal — only downloads when user clicks "Request Quote"
const RFQModal = lazy(() => import('@/components/RFQModal/RFQModal.jsx'));

/**
 * Enhanced VendorCard Component (v2)
 * 
 * Improvements:
 * ✓ Reduced header heigh          <Link href={`/post-rfq?vendor_id=${id}`} className="flex-1">
            <button className="w-full px-3 py-2 sm:py-2.5 text-white font-semibold rounded-lg transition-colors text-xs sm:text-sm shadow-sm" style={{ backgroundColor: 'rgba(234, 143, 30, 0.37)' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(212, 122, 11, 0.37)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(234, 143, 30, 0.37)'}}>
              Request Quotecompact, not wasted space)
 * ✓ Professional category labels (no underscores, humanized)
 * ✓ Better logo display (proper aspect ratio, no cropping)
 * ✓ "New" badge for vendors with no reviews (not "0.0")
 * ✓ Trust badges visible at glance (Verified in header)
 * ✓ Stronger primary CTA (Request Quote filled, Profile outline)
 * ✓ Cleaner description (single tagline, not chip)
 * ✓ Better alignment & micro-spacing
 * ✓ Pulls data directly from vendor profiles
 */

// Category display name mapping (humanize underscores, title case)
const CATEGORY_LABELS = {
  'plumbing_drainage': 'Plumbing & Drainage',
  'doors_windows_glass': 'Doors, Windows & Glass',
  'construction_services': 'Construction Services',
  'electrical_services': 'Electrical Services',
  'carpentry_joinery': 'Carpentry & Joinery',
  'steel_fabrication': 'Steel Fabrication',
  'roofing_services': 'Roofing Services',
  'painting_services': 'Painting Services',
  'flooring_services': 'Flooring Services',
  'hvac_services': 'HVAC Services',
  'plumbing-drainage': 'Plumbing & Drainage',
  'doors-windows-glass': 'Doors, Windows & Glass',
  'construction-services': 'Construction Services',
  'electrical-services': 'Electrical Services',
  'carpentry-joinery': 'Carpentry & Joinery',
  'steel-fabrication': 'Steel Fabrication',
  'roofing-services': 'Roofing Services',
  'painting-services': 'Painting Services',
  'flooring-services': 'Flooring Services',
  'hvac-services': 'HVAC Services',
};

export function VendorCard({ vendor, className = '' }) {
  const [showRFQModal, setShowRFQModal] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [freshLogoUrl, setFreshLogoUrl] = useState(null);
  
  // Generate fresh presigned URL if logo_url is stored as S3 key
  useEffect(() => {
    if (!vendor?.logo_url) return;

    // Supabase URLs or full URLs — use as-is
    if (vendor.logo_url.startsWith('http') || vendor.logo_url.includes('supabase.co')) {
      setFreshLogoUrl(vendor.logo_url);
      return;
    }

    // S3 key — need to generate presigned URL
    const controller = new AbortController();
    fetch(`/api/vendor-profile/get-image-url?key=${encodeURIComponent(vendor.logo_url)}`, {
      signal: controller.signal
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.url) setFreshLogoUrl(data.url); else setFreshLogoUrl(vendor.logo_url); })
      .catch(() => setFreshLogoUrl(vendor.logo_url));

    return () => controller.abort();
  }, [vendor?.logo_url]);
  
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
  } = vendor;

  // Get category display name from lookup or humanize
  const getCategoryLabel = () => {
    const slug = primary_category_slug || category;
    if (!slug) return 'Construction';
    
    // Check lookup table first
    if (CATEGORY_LABELS[slug]) {
      return CATEGORY_LABELS[slug];
    }
    
    // Fallback: humanize slug
    return slug
      .split(/[_-]/)
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
  const hasReviews = rating_count > 0;
  const ratingDisplay = hasReviews ? `${rating.toFixed(1)}` : 'New';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full ${className}`}>
      {/* COMPACT Header: Reduced from h-32/h-40 to h-20/h-24 */}
      <div className="relative h-20 sm:h-24 flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'rgba(234, 143, 30, 0.37)' }}>
        {/* Subtle diagonal pattern (minimal visual noise) */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
          }}
        />

        {/* Trust Badges: Top-right corner (Verified visible at glance) */}
        {is_verified && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-blue-600">Verified</span>
          </div>
        )}

        {/* Logo Circle: Better aspect ratio, proper padding, no cropping */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          {/* Outer ring around logo (brand color) - centered in header */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'rgba(234, 143, 30, 0.37)' }}>
            {freshLogoUrl && !logoError ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={freshLogoUrl}
                  alt={company_name}
                  className="w-full h-full object-contain p-2.5"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white bg-white shadow-lg flex items-center justify-center font-bold text-base sm:text-lg flex-shrink-0" style={{ color: 'rgba(234, 143, 30, 0.37)' }}>
                {getInitials()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section: Tighter spacing */}
      <div className="px-4 sm:px-5 pt-10 sm:pt-12 pb-3 sm:pb-4 flex-1 flex flex-col">
        {/* Vendor Name: Line clamp 2, slightly tighter */}
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {company_name}
        </h3>

        {/* Category: Single chip only (cleaner, professional) */}
        <div className="mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#fff4e6', borderColor: '#e8dcc8', color: '#b87a1b', border: '1px solid' }}>
            {categoryLabel}
          </span>
        </div>

        {/* Tagline: Plain text (no chip), one line, optional */}
        {description && (
          <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-1 leading-relaxed">
            {description}
          </p>
        )}

        {/* Rating & Response Time: On one line, consistent baseline */}
        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 mb-2">
          {/* Rating Section */}
          <div className="flex items-center gap-1 whitespace-nowrap">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-current flex-shrink-0" />
            <span className="font-semibold text-gray-900">
              {ratingDisplay}
            </span>
            {hasReviews && (
              <span className="text-gray-500">
                ({rating_count})
              </span>
            )}
          </div>

          {/* Separator */}
          <span className="text-gray-300">•</span>

          {/* Response Time Section */}
          <div className="flex items-center gap-1 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{response_time_minutes}m</span>
          </div>
        </div>

        {/* Location & Delivery: Compact, one line */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1 whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{location || county || 'Kenya'}</span>
          </div>

          {delivery_available && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-green-700 font-medium whitespace-nowrap">✓ Delivery</span>
            </>
          )}
        </div>

        {/* CTA Buttons: PRIMARY (Request Quote) + SECONDARY (View Profile) */}
        <div className="flex gap-2 sm:gap-2.5 mt-auto pt-2">
          {/* PRIMARY: Request Quote (FILLED, dominates) - Opens RFQ modal */}
          <button
            onClick={() => setShowRFQModal(true)}
            className="flex-1 w-full px-3 py-2.5 sm:py-2.5 text-white font-semibold rounded-lg transition-colors text-xs sm:text-sm shadow-sm min-h-[44px]"
            style={{ backgroundColor: '#ea8f1e' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d47a0b'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ea8f1e'}
          >
            Request Quote
          </button>

          {/* SECONDARY: View Profile (Zintra gray) - Opens vendor profile */}
          <Link href={`/vendor-profile/${id}`} className="flex-1 block">
            <span className="flex items-center justify-center w-full px-3 py-2.5 sm:py-2.5 text-white font-medium rounded-lg transition-colors text-xs sm:text-sm shadow-sm min-h-[44px] cursor-pointer" style={{ backgroundColor: '#aaabaa' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#919192'} onMouseLeave={(e) => e.target.style.backgroundColor = '#aaabaa'}>
              View Profile
            </span>
          </Link>
        </div>
      </div>

      {/* RFQ Modal — lazy loaded */}
      {showRFQModal && (
        <Suspense fallback={null}>
          <RFQModal
            rfqType="direct"
            isOpen={showRFQModal}
            onClose={() => setShowRFQModal(false)}
            vendorId={id}
            vendorCategories={[primary_category_slug].filter(Boolean)}
            vendorName={company_name}
          />
        </Suspense>
      )}
    </div>
  );
}

export default VendorCard;
