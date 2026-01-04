'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { CANONICAL_CATEGORIES } from '@/lib/categories/canonicalCategories';

/**
 * Category Selector Component
 * 
 * Allows vendors to:
 * 1. Select a primary category (required)
 * 2. Add multiple secondary categories (optional)
 * 3. Manage and remove categories
 * 4. Search/filter categories
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [showSecondarySelector, setShowSecondarySelector] = useState(false);

  /**
   * Filter categories based on search term
   */
  useEffect(() => {
    const filtered = CANONICAL_CATEGORIES.filter((cat) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        cat.label.toLowerCase().includes(searchLower) ||
        cat.slug.toLowerCase().includes(searchLower) ||
        (cat.description && cat.description.toLowerCase().includes(searchLower))
      );
    });

    setFilteredCategories(filtered);
  }, [searchTerm]);

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
      setSearchTerm('');

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
      if (secondaryCategories.length < maxSecondaryCategories) {
        onSecondaryChange([...secondaryCategories, slug]);
        setSearchTerm('');
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

  /**
   * Render category option
   */
  const renderCategoryOption = (category, isSelected = false, isPrimary = false) => (
    <div
      key={category.slug}
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-medium text-gray-900">{category.label}</p>
          {showDescription && category.description && (
            <p className="text-xs text-gray-600 mt-1">{category.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">{category.slug}</p>
        </div>
        {isSelected && (
          <div className="ml-2 text-blue-600">
            {isPrimary ? (
              <span className="text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded">
                Primary
              </span>
            ) : (
              <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded">
                Secondary
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const primaryCategoryData = getCategoryBySlug(primaryCategory);
  const selectedSecondaryData = secondaryCategories.map(getCategoryBySlug).filter(Boolean);
  const availableSecondary = getAvailableSecondaryCategories();
  const canAddMoreSecondary = secondaryCategories.length < maxSecondaryCategories;

  return (
    <div className="space-y-6">
      {/* Primary Category Section */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Primary Category <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-600 mb-4">
          Select the main category for your services. This is how customers will find you.
        </p>

        <div className="space-y-3">
          {/* Search */}
          {CANONICAL_CATEGORIES.length > 5 && (
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          )}

          {/* Primary Category Display */}
          {primaryCategoryData ? (
            <div className="p-4 border-2 border-blue-600 rounded-lg bg-blue-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{primaryCategoryData.label}</p>
                  {showDescription && primaryCategoryData.description && (
                    <p className="text-sm text-gray-600 mt-1">{primaryCategoryData.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handlePrimaryChange('')}
                  className="ml-2 p-1 hover:bg-blue-200 rounded transition-colors"
                  title="Clear selection"
                >
                  <X className="w-5 h-5 text-blue-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
              No primary category selected yet
            </div>
          )}

          {/* Category Options */}
          {!searchTerm && primaryCategory === '' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {CANONICAL_CATEGORIES.map((category) => (
                <div
                  key={category.slug}
                  onClick={() => handlePrimaryChange(category.slug)}
                  className="cursor-pointer"
                >
                  {renderCategoryOption(category)}
                </div>
              ))}
            </div>
          )}

          {/* Search Results */}
          {searchTerm && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {filteredCategories.map((category) => (
                <div
                  key={category.slug}
                  onClick={() => handlePrimaryChange(category.slug)}
                  className="cursor-pointer"
                >
                  {renderCategoryOption(category)}
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <p className="text-gray-600 text-sm py-4">No categories match your search</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Secondary Categories Section */}
      {primaryCategoryData && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-900">
              Secondary Categories <span className="text-gray-500">(Optional)</span>
            </label>
            <span className="text-xs text-gray-600">
              {secondaryCategories.length} / {maxSecondaryCategories}
            </span>
          </div>

          <p className="text-xs text-gray-600 mb-4">
            Add additional service categories to expand your visibility to customers.
          </p>

          {/* Selected Secondary Categories */}
          {selectedSecondaryData.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-gray-700">Selected:</p>
              <div className="space-y-2">
                {selectedSecondaryData.map((category) => (
                  <div
                    key={category.slug}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{category.label}</p>
                      <p className="text-xs text-gray-600">{category.slug}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveSecondary(category.slug)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="Remove category"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Secondary Category Button/Selector */}
          {canAddMoreSecondary ? (
            <div>
              {!showSecondarySelector && (
                <button
                  onClick={() => setShowSecondarySelector(true)}
                  className="w-full py-2 px-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-blue-600 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Category
                </button>
              )}

              {showSecondarySelector && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-gray-900">Available Categories:</p>
                    <button
                      onClick={() => setShowSecondarySelector(false)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableSecondary.map((category) => (
                      <div
                        key={category.slug}
                        onClick={() => handleAddSecondary(category.slug)}
                        className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                      >
                        <p className="font-medium text-gray-900">{category.label}</p>
                        {showDescription && category.description && (
                          <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                        )}
                      </div>
                    ))}

                    {availableSecondary.length === 0 && (
                      <p className="text-sm text-gray-600 py-4">
                        All other categories have been selected
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                You've reached the maximum of {maxSecondaryCategories} secondary categories
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
