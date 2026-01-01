'use client';

import RFQImageUpload from '../RFQImageUpload';

export default function StepTemplate({
  templateFields,
  fieldMetadata,
  onFieldChange,
  selectedJobType,
  errors,
  referenceImages = [],
  onImagesChange = () => {}
}) {
  if (!fieldMetadata || fieldMetadata.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600">
          {selectedJobType
            ? 'No additional details needed for this job type.'
            : 'Please select a category and job type first.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tell us more about your project
        </h3>

        <div className="space-y-4">
          {fieldMetadata.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-600">*</span>}
              </label>

              {field.description && (
                <p className="text-xs text-gray-500 mb-2">{field.description}</p>
              )}

              {/* Text Input */}
              {field.type === 'text' && (
                <input
                  type="text"
                  value={templateFields[field.name] || ''}
                  onChange={(e) => onFieldChange(field.name, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors[field.name]
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}

              {/* Textarea */}
              {field.type === 'textarea' && (
                <textarea
                  value={templateFields[field.name] || ''}
                  onChange={(e) => onFieldChange(field.name, e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors[field.name]
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}

              {/* Select Dropdown */}
              {field.type === 'select' && (
                <select
                  value={templateFields[field.name] || ''}
                  onChange={(e) => onFieldChange(field.name, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors[field.name]
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Select {field.label.toLowerCase()}...</option>
                  {field.options?.map(opt => (
                    <option key={opt.value || opt} value={opt.value || opt}>
                      {opt.label || opt}
                    </option>
                  ))}
                </select>
              )}

              {/* Number Input */}
              {field.type === 'number' && (
                <input
                  type="number"
                  value={templateFields[field.name] || ''}
                  onChange={(e) => onFieldChange(field.name, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors[field.name]
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter number"
                />
              )}

              {/* Date Input */}
              {field.type === 'date' && (
                <input
                  type="date"
                  value={templateFields[field.name] || ''}
                  onChange={(e) => onFieldChange(field.name, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    errors[field.name]
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                />
              )}

              {/* Error Message */}
              {errors[field.name] && (
                <p className="text-sm text-red-600 mt-1">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Reference Images (Optional)</h4>
        <RFQImageUpload
          images={referenceImages}
          onUpload={(imageData) => {
            onImagesChange([...referenceImages, imageData]);
          }}
          onRemove={(imageKey) => {
            onImagesChange(referenceImages.filter(img => img.key !== imageKey));
          }}
          maxImages={5}
          maxSize={10}
        />
      </div>
    </div>
  );
}
