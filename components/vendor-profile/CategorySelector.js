'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { CANONICAL_CATEGORIES } from '@/lib/categories/canonicalCategories';

/**
 * Category Selector Component
 * 
 * Allows vendors to:
 * 1. Select a primary category via dropdown (required)
 * 2. Add multiple secondary categories via dropdown (optional)
 * 3. Manage and remove categories
 * 
 * Props:
 *   primaryCategory: Selected primary category slug
 *   secondaryCategories: Array of secondary category slugs
 *   onPrimaryChange: Callback when primary category changes (receives slug)
 *   onSecondaryChange: Callback when secondary categories change (receives array of slugs)
 *   maxSecondaryCategories: Maximum number of secondary categories (default: 5)
 *   showDescription: Show category descriptions (default: true)
 * 
 * Usage:
 *   <CategorySelector
 *     primaryCategory={primary}
 *     secondaryCategories={secondary}
 *     onPrimaryChange={setPrimary}
 *     onSecondaryChange={setSecondary}
 *   />
 */
export default function CategorySelector({
  primaryCategory = '',
  secondaryCategories = [],
  onPrimaryChange = () => {},
  onSecondaryChange = () => {},
  maxSecondaryCategories = 5,
  showDescription = true,
}) {
  /**
   * Get list of available secondary categories (exclude primary and already selected)
   */
  const getAvailableSecondaryCategories = useCallback(() => {
    return CANONICAL_CATEGORIES.filter(
      (cat) =>
        cat.slug !== primaryCategory && !secondaryCategories.includes(cat.slug)
    );
  }, [primaryCategory, secondaryCategories]);

  /**
   * Handle primary category selection
   */
  const handlePrimaryChange = useCallback(
    (slug) => {
      onPrimaryChange(slug);

      // If primary category is already in secondary, remove it
      if (secondaryCategories.includes(slug)) {
        onSecondaryChange(secondaryCategories.filter((s) => s !== slug));
      }
    },
    [onPrimaryChange, secondaryCategories, onSecondaryChange]
  );

  /**
   * Add secondary category
   */
  const handleAddSecondary = useCallback(
    (slug) => {
      if (slug && secondaryCategories.length < maxSecondaryCategories) {
        onSecondaryChange([...secondaryCategories, slug]);
      }
    },
    [secondaryCategories, maxSecondaryCategories, onSecondaryChange]
  );

  /**
   * Remove secondary category
   */
  const handleRemoveSecondary = useCallback(
    (slug) => {
      onSecondaryChange(secondaryCategories.filter((s) => s !== slug));
    },
    [secondaryCategories, onSecondaryChange]
  );

  /**
   * Get category object by slug
   */
  const getCategoryBySlug = (slug) => CANONICAL_CATEGORIES.find((c) => c.slug === slug);

  const primaryCategoryData = getCategoryBySlug(primaryCategory);
  const selectedSecondaryData = secondaryCategories.map(getCategoryBySlug).filter(Boolean);
  const availableSecondary = getAvailableSecondaryCategories();
  const canAddMoreSecondary = secondaryCategories.length < maxSecondaryCategories;

  return (
    <div className="space-y-6">
      {/* Primary Category Section */}
      <div>
        <label htmlFor="primary-category" className="block text-sm font-semibold text-gray-900 mb-2">
          Primary Category <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-600 mb-3">
          Select the main category for your services. This is how customers will find you.
        </p>

        {/* Primary Category Dropdown */}
        <select
          id="primary-category"
          value={primaryCategory}
          onChange={(e) => handlePrimaryChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
        >
          <option value="">-- Select a Category --</option>
          {CANONICAL_CATEGORIES.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>

        {/* Selected Primary Category Details */}
        {primaryCategoryData && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{primaryCategoryData.label}</p>
                {showDescription && primaryCategoryData.description && (
                  <p className="text-sm text-gray-600 mt-2">{primaryCategoryData.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Slug:</strong> {primaryCategoryData.slug}
                </p>
              </div>
              <span className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded whitespace-nowrap ml-2">
                Primary
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Secondary Categories Section */}
      {primaryCategoryData && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="secondary-category" className="block text-sm font-semibold text-gray-900">
              Secondary Categories <span className="text-gray-500">(Optional)</span>
            </label>
            <span className="text-xs text-gray-600">
              {secondaryCategories.length} / {maxSecondaryCategories}
            </span>
          </div>

          <p className="text-xs text-gray-600 mb-3">
            Add additional service categories to expand your visibility to customers.
          </p>

          {/* Selected Secondary Categories Display */}
          {selectedSecondaryData.length > 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-xs font-medium text-gray-700">Selected Secondary Categories:</p>
              <div className="space-y-2">
                {selectedSecondaryData.map((category) => (
                  <div
                    key={category.slug}
                    className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{category.label}</p>
                      {showDescription && category.description && (
                        <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveSecondary(category.slug)}
                      className="ml-3 p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                      title="Remove category"
                      aria-label={`Remove ${category.label}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Secondary Category Dropdown */}
          {canAddMoreSecondary && (
            <div className="space-y-2">
              <label htmlFor="add-secondary" className="block text-xs font-medium text-gray-700">
                Add Another Category:
              </label>
              <select
                id="add-secondary"
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddSecondary(e.target.value);
                    e.target.value = ''; // Reset dropdown
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="">-- Choose a Category --</option>
                {availableSecondary.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Max Categories Reached Message */}
          {!canAddMoreSecondary && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                You've reached the maximum of {maxSecondaryCategories} secondary categories
              </p>
            </div>
          )}

          {/* No Available Categories Message */}
          {canAddMoreSecondary && availableSecondary.length === 0 && selectedSecondaryData.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                All other categories have been selected or assigned as primary.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
