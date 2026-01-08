'use client';

import { Badge } from 'lucide-react';
import { CANONICAL_CATEGORIES } from '@/lib/categories';

/**
 * CategoryBadges Component
 * 
 * Display vendor's primary and secondary category expertise
 * Shows badges on vendor profile, vendor card, search results, etc.
 * 
 * Phase 3 Feature 2: Vendor expertise badges
 */

export default function CategoryBadges({ 
  primaryCategorySlug, 
  secondaryCategories = [],
  size = 'md',
  showLabel = true,
  maxVisible = 3,
  className = ''
}) {
  // Map slug to category name
  const getCategoryName = (slug) => {
    const category = CANONICAL_CATEGORIES.find(cat => cat.slug === slug);
    return category?.name || slug;
  };

  // Get category color (consistent with brand guidelines)
  const getCategoryColor = (index) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',      // Primary
      'bg-purple-100 text-purple-800 border-purple-200', // Secondary 1
      'bg-pink-100 text-pink-800 border-pink-200',       // Secondary 2
      'bg-amber-100 text-amber-800 border-amber-200',    // Secondary 3
      'bg-green-100 text-green-800 border-green-200',    // Secondary 4
    ];
    return colors[index % colors.length];
  };

  const getPrimaryBadgeColor = () => 'bg-blue-100 text-blue-800 border-blue-200';
  const getSecondaryBadgeColor = () => 'bg-purple-100 text-purple-800 border-purple-200';

  if (!primaryCategorySlug && (!secondaryCategories || secondaryCategories.length === 0)) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2'
  };

  const badges = [];

  // Add primary category
  if (primaryCategorySlug) {
    badges.push({
      slug: primaryCategorySlug,
      name: getCategoryName(primaryCategorySlug),
      type: 'primary',
      color: getPrimaryBadgeColor()
    });
  }

  // Add secondary categories
  if (Array.isArray(secondaryCategories)) {
    secondaryCategories.slice(0, maxVisible - 1).forEach((cat, idx) => {
      // Handle multiple data formats: string, {slug}, or {value}
      const slug = typeof cat === 'string' ? cat : (cat.slug || cat.value);
      if (!slug) return; // Skip invalid entries
      badges.push({
        slug,
        name: getCategoryName(slug),
        type: 'secondary',
        color: getSecondaryBadgeColor()
      });
    });
  }

  // Show more indicator
  const hasMore = (secondaryCategories?.length || 0) > (maxVisible - 1);

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {showLabel && badges.length > 0 && (
        <div className="w-full text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Specializes in:
        </div>
      )}
      
      {badges.map((badge) => (
        <div
          key={badge.slug}
          className={`inline-flex items-center gap-1 border rounded-full font-medium ${sizeClasses[size]} ${badge.color} transition-all hover:shadow-sm`}
          title={badge.name}
        >
          {badge.type === 'primary' && (
            <span className="text-yellow-600">★</span>
          )}
          <span className="truncate">{badge.name}</span>
        </div>
      ))}

      {hasMore && (
        <div
          className={`inline-flex items-center px-2 py-1 rounded-full font-medium text-gray-600 bg-gray-100 border border-gray-200 ${sizeClasses[size]}`}
          title={`+${(secondaryCategories?.length || 0) - (maxVisible - 1)} more`}
        >
          +{(secondaryCategories?.length || 0) - (maxVisible - 1)}
        </div>
      )}
    </div>
  );
}

/**
 * Compact Badge Version (for tight spaces)
 * Shows only primary category with small badge
 */
export function CompactCategoryBadge({ primaryCategorySlug, className = '' }) {
  if (!primaryCategorySlug) return null;

  const getCategoryName = (slug) => {
    const category = CANONICAL_CATEGORIES.find(cat => cat.slug === slug);
    return category?.name || slug;
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 ${className}`}>
      <span className="text-yellow-600">★</span>
      <span className="truncate">{getCategoryName(primaryCategorySlug)}</span>
    </span>
  );
}

/**
 * Detailed Category View (for profile pages)
 * Shows all categories with descriptions
 */
export function DetailedCategoryView({ 
  primaryCategorySlug, 
  secondaryCategories = [] 
}) {
  const getCategoryData = (slug) => {
    return CANONICAL_CATEGORIES.find(cat => cat.slug === slug);
  };

  const primaryData = primaryCategorySlug ? getCategoryData(primaryCategorySlug) : null;

  if (!primaryData && (!secondaryCategories || secondaryCategories.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Primary Category */}
      {primaryData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-blue-700">★</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">Primary Expertise</h4>
              <p className="text-blue-800 font-medium">{primaryData.name}</p>
              {primaryData.description && (
                <p className="text-sm text-blue-700 mt-1">{primaryData.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Secondary Categories */}
      {secondaryCategories && secondaryCategories.length > 0 && (
        <div>
          <h5 className="font-semibold text-gray-900 mb-2">Additional Services</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {secondaryCategories.map((cat) => {
              // Handle multiple data formats: string, {slug}, or {value}
              const slug = typeof cat === 'string' ? cat : (cat.slug || cat.value);
              if (!slug) return null; // Skip invalid entries
              const data = getCategoryData(slug);
              return (
                <div key={slug} className="bg-purple-50 border border-purple-200 rounded p-3">
                  <p className="font-medium text-purple-900">{data?.name || slug}</p>
                  {data?.description && (
                    <p className="text-xs text-purple-700 mt-1">{data.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
