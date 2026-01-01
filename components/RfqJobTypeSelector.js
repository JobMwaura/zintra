import React, { useState } from 'react';

/**
 * RfqJobTypeSelector Component
 * 
 * Displays job type options within a selected RFQ category.
 * Allows users to select a specific job type before filling out template fields.
 * 
 * Props:
 * - jobTypes: Array of job type objects from the category
 * - onSelect: Callback function (jobType) => void when user selects a job type
 * - selectedJobType: Currently selected job type slug (for controlled component)
 * - isLoading: Show loading state
 */
export default function RfqJobTypeSelector({
  jobTypes = [],
  onSelect,
  selectedJobType = null,
  isLoading = false,
}) {
  const [hovered, setHovered] = useState(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!jobTypes || jobTypes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No job types available for this category.</p>
      </div>
    );
  }

  if (jobTypes.length === 1) {
    // If only one job type, auto-select it and show confirmation
    React.useEffect(() => {
      if (onSelect) {
        onSelect(jobTypes[0]);
      }
    }, []);

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-900 text-sm">
          <span className="font-semibold">Selected:</span> {jobTypes[0].label}
        </p>
        <p className="text-blue-800 text-xs mt-1">{jobTypes[0].description}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {jobTypes.map((jobType) => {
          const isSelected = selectedJobType === jobType.slug;
          const isHovered = hovered === jobType.slug;

          return (
            <button
              key={jobType.slug}
              onClick={() => onSelect && onSelect(jobType)}
              onMouseEnter={() => setHovered(jobType.slug)}
              onMouseLeave={() => setHovered(null)}
              className={`
                relative p-4 rounded-lg border-2 transition-all text-left
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : isHovered
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }
              `}
            >
              {/* Selection indicator */}
              <div className="absolute top-3 right-3">
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center
                    transition-all
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {isSelected && (
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
                  )}
                </div>
              </div>

              {/* Job type label */}
              <h3
                className={`
                  font-semibold text-sm pr-8
                  ${isSelected ? 'text-blue-900' : 'text-gray-900'}
                `}
              >
                {jobType.label}
              </h3>

              {/* Job type description */}
              <p
                className={`
                  text-xs mt-2 leading-relaxed
                  ${isSelected ? 'text-blue-700' : 'text-gray-600'}
                `}
              >
                {jobType.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Selection confirmation message */}
      {selectedJobType && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✓ You selected:{' '}
            <span className="font-semibold">
              {jobTypes.find((jt) => jt.slug === selectedJobType)?.label}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Usage Example:
 * 
 * import RfqJobTypeSelector from '@/components/RfqJobTypeSelector';
 * 
 * function MyComponent() {
 *   const [selectedJobType, setSelectedJobType] = useState(null);
 *   
 *   const jobTypes = [
 *     {
 *       slug: 'new-house',
 *       label: 'New house / residential design',
 *       description: 'Design for a new residential property from scratch'
 *     },
 *     {
 *       slug: 'extension',
 *       label: 'Extension / renovation',
 *       description: 'Plans for extending or modifying existing structure'
 *     }
 *   ];
 *   
 *   const handleSelectJobType = (jobType) => {
 *     setSelectedJobType(jobType.slug);
 *     console.log('Selected:', jobType);
 *   };
 *   
 *   return (
 *     <RfqJobTypeSelector
 *       jobTypes={jobTypes}
 *       onSelect={handleSelectJobType}
 *       selectedJobType={selectedJobType}
 *     />
 *   );
 * }
 */
