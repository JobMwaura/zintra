'use client';

import React, { useMemo } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';

/**
 * PublicRFQJobTypeSelector
 * Beautiful selector for job types within a selected category
 * Shows available job types with descriptions
 */
export default function PublicRFQJobTypeSelector({
  jobTypes = [],
  onSelect = () => {},
  onBack = () => {},
  selectedJobType = null,
  categoryLabel = '',
  disabled = false,
}) {
  const handleJobTypeClick = (jobType) => {
    if (!disabled) {
      onSelect(jobType);
    }
  };

  if (!jobTypes || jobTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No job types available for this category.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Category Info */}
      <div className="space-y-3">
        <button
          onClick={onBack}
          disabled={disabled}
          className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Categories
        </button>
        
        {categoryLabel && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              <span className="font-semibold">Selected Category:</span> {categoryLabel}
            </p>
          </div>
        )}
      </div>

      {/* Job Types Grid */}
      <div className="space-y-3">
        <p className="text-sm text-gray-600 font-medium">
          What type of work do you need? ({jobTypes.length} options)
        </p>
        
        <div className="grid grid-cols-1 gap-3">
          {jobTypes.map((jobType) => (
            <button
              key={jobType.slug}
              onClick={() => handleJobTypeClick(jobType)}
              disabled={disabled}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${
                  selectedJobType?.slug === jobType.slug
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-400 hover:bg-green-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                group
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Label */}
                  <h4 className="font-semibold text-gray-900">
                    {jobType.label}
                  </h4>
                  
                  {/* Description */}
                  {jobType.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {jobType.description}
                    </p>
                  )}
                </div>

                {/* Arrow Icon */}
                <ChevronRight
                  className={`
                    w-5 h-5 flex-shrink-0 transition-all duration-200
                    ${
                      selectedJobType?.slug === jobType.slug
                        ? 'text-green-600 transform translate-x-1'
                        : 'text-gray-400 group-hover:text-green-500'
                    }
                  `}
                />
              </div>

              {/* Selection Indicator */}
              {selectedJobType?.slug === jobType.slug && (
                <div className="absolute top-2 right-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
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
      </div>
    </div>
  );
}
