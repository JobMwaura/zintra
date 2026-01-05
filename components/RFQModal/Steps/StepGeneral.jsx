'use client';

import { useState, useEffect, useMemo } from 'react';
import LocationSelector from '@/components/LocationSelector';
import { suggestCategories } from '@/lib/matching/categorySuggester';
import { Lightbulb, X } from 'lucide-react';

export default function StepGeneral({
  formData,
  onFieldChange,
  errors
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState([]);

  // Phase 3: Smart category suggestions based on project title
  useEffect(() => {
    if (formData.projectTitle && formData.projectTitle.trim().length > 2) {
      try {
        const suggestions = suggestCategories(formData.projectTitle, 4);
        setCategorySuggestions(suggestions || []);
        setShowSuggestions(suggestions && suggestions.length > 0);
      } catch (error) {
        console.error('Error getting category suggestions:', error);
        setCategorySuggestions([]);
      }
    } else {
      setCategorySuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.projectTitle]);
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const budgetMin = parseInt(formData.budgetMin) || 0;
  const budgetMax = parseInt(formData.budgetMax) || 0;
  const budgetRange = budgetMin && budgetMax ? `${formatCurrency(budgetMin)} - ${formatCurrency(budgetMax)}` : '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
          Project Overview
        </h2>
        <p className="text-gray-600 text-sm">
          Give vendors a clear understanding of your project
        </p>
      </div>

      <div className="space-y-6">
        {/* Project Title */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.projectTitle || ''}
            onChange={(e) => onFieldChange('projectTitle', e.target.value)}
            className={`w-full px-4 py-2.5 text-base border-2 rounded-xl transition-all focus:outline-none ${
              errors.projectTitle
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
            }`}
            placeholder="e.g., Kitchen Renovation"
          />
          {errors.projectTitle && (
            <p className="text-sm text-red-600 font-medium">{errors.projectTitle}</p>
          )}

          {/* Phase 3: Category Suggestions */}
          {showSuggestions && categorySuggestions.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-900 mb-2">Suggested Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categorySuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.slug || index}
                        type="button"
                        onClick={() => {
                          // Note: This passes the category slug - parent component should handle setting category
                          console.log('Suggested category:', suggestion.slug);
                          setShowSuggestions(false);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                      >
                        <span>{suggestion.name}</span>
                        <span className="text-blue-500 text-xs">({suggestion.relevance}%)</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    💡 These categories match your project. Selected category is set in Step 1.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  className="flex-shrink-0 text-blue-400 hover:text-blue-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Project Summary */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            Project Summary
          </label>
          <textarea
            value={formData.projectSummary || ''}
            onChange={(e) => onFieldChange('projectSummary', e.target.value)}
            rows={3}
            className={`w-full px-4 py-2.5 text-base border-2 rounded-xl transition-all resize-none font-sans focus:outline-none ${
              errors.projectSummary
                ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
            }`}
            placeholder="Describe your project in detail..."
          />
          {errors.projectSummary && (
            <p className="text-sm text-red-600 font-medium">{errors.projectSummary}</p>
          )}
        </div>

        {/* Location Grid */}
        <LocationSelector
          county={formData.county}
          town={formData.town}
          onCountyChange={(e) => onFieldChange('county', e.target.value)}
          onTownChange={(e) => onFieldChange('town', e.target.value)}
          countyError={errors.county}
          townError={errors.town}
          countyLabel="County"
          townLabel="Town/City"
          required={true}
          layout="row"
          size="default"
        />

        {/* Directions */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            Special Instructions
          </label>
          <textarea
            value={formData.directions || ''}
            onChange={(e) => onFieldChange('directions', e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 text-base border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none font-sans transition-all"
            placeholder="Access instructions, site conditions, or other details..."
          />
        </div>

        {/* Budget Section */}
        <div className="pt-2 border-t border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Budget</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                Minimum <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">$</span>
                <input
                  type="number"
                  value={formData.budgetMin || ''}
                  onChange={(e) => onFieldChange('budgetMin', e.target.value)}
                  className={`w-full px-4 py-2.5 text-base border-2 rounded-xl transition-all focus:outline-none pl-8 ${
                    errors.budgetMin
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
                  }`}
                  placeholder="10000"
                />
              </div>
              {errors.budgetMin && (
                <p className="text-sm text-red-600 font-medium">{errors.budgetMin}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-900">
                Maximum <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">$</span>
                <input
                  type="number"
                  value={formData.budgetMax || ''}
                  onChange={(e) => onFieldChange('budgetMax', e.target.value)}
                  className={`w-full px-4 py-2.5 text-base border-2 rounded-xl transition-all focus:outline-none pl-8 ${
                    errors.budgetMax
                      ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
                  }`}
                  placeholder="50000"
                />
              </div>
              {errors.budgetMax && (
                <p className="text-sm text-red-600 font-medium">{errors.budgetMax}</p>
              )}
            </div>
          </div>

          {/* Budget Display */}
          {budgetRange && (
            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-sm text-orange-900 font-medium">
                Budget Range: {budgetRange}
              </p>
            </div>
          )}
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            Desired Start Date
          </label>
          <input
            type="date"
            value={formData.desiredStartDate || ''}
            onChange={(e) => onFieldChange('desiredStartDate', e.target.value)}
            className="w-full px-4 py-2.5 text-base border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
