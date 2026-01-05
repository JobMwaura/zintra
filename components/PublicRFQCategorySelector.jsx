'use client';

import React, { useState, useMemo } from 'react';
import { ChevronRight, Search } from 'lucide-react';

/**
 * PublicRFQCategorySelector
 * Beautiful, functional category selector for public RFQ forms
 * Shows categories with icons, descriptions, and smooth interactions
 */
export default function PublicRFQCategorySelector({
  categories = [],
  onSelect = () => {},
  selectedCategory = null,
  disabled = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    
    const query = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.label.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  const handleCategoryClick = (category) => {
    if (!disabled) {
      onSelect(category);
    }
  };

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No categories available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories... (e.g., construction, plumbing)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map((category) => (
          <button
            key={category.slug}
            onClick={() => handleCategoryClick(category)}
            disabled={disabled}
            className={`
              relative p-5 rounded-lg border-2 transition-all duration-200 text-left
              ${
                selectedCategory?.slug === category.slug
                  ? 'border-green-500 bg-green-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              group
            `}
          >
            {/* Icon & Content */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {/* Icon */}
                {category.icon && (
                  <div className="text-3xl mb-2">
                    {category.icon}
                  </div>
                )}
                
                {/* Label */}
                <h3 className="font-bold text-gray-900 text-lg">
                  {category.label}
                </h3>
                
                {/* Description */}
                {category.description && (
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    {category.description}
                  </p>
                )}
              </div>

              {/* Arrow Icon */}
              <ChevronRight
                className={`
                  w-6 h-6 flex-shrink-0 transition-all duration-200
                  ${
                    selectedCategory?.slug === category.slug
                      ? 'text-green-600 transform translate-x-1'
                      : 'text-gray-400 group-hover:text-green-500'
                  }
                `}
              />
            </div>

            {/* Selection Indicator */}
            {selectedCategory?.slug === category.slug && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* No Results Message */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No categories match your search. Try different keywords.
          </p>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600 text-center">
        Showing {filteredCategories.length} of {categories.length} categories
      </div>
    </div>
  );
}
