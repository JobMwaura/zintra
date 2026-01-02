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
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
          <span className="text-xl">📋</span>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          {selectedJobType
            ? 'No additional details needed for this type.'
            : 'Please select a category first.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">
          Project Details
        </h2>
        <p className="text-gray-600 text-sm">
          Help us understand your specific needs
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {fieldMetadata.map(field => (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.description && (
              <p className="text-xs text-gray-500 leading-relaxed">{field.description}</p>
            )}

            {/* Text Input */}
            {field.type === 'text' && (
              <input
                type="text"
                value={templateFields[field.name] || ''}
                onChange={(e) => onFieldChange(field.name, e.target.value)}
                className={`w-full px-4 py-2.5 text-base border-2 rounded-xl transition-all focus:outline-none ${
                  errors[field.name]
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
                }`}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              />
            )}

            {/* Textarea */}
            {field.type === 'textarea' && (
              <textarea
                value={templateFields[field.name] || ''}
                onChange={(e) => onFieldChange(field.name, e.target.value)}
                rows={4}
                className={`w-full px-4 py-2.5 text-base border-2 rounded-xl transition-all resize-none focus:outline-none font-sans ${
                  errors[field.name]
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
                }`}
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              />
            )}

            {/* Select Dropdown */}
            {field.type === 'select' && (
              <select
                value={templateFields[field.name] || ''}
                onChange={(e) => onFieldChange(field.name, e.target.value)}
                className={`w-full px-4 py-2.5 text-base border-2 rounded-xl transition-all appearance-none bg-white cursor-pointer focus:outline-none ${
                  errors[field.name]
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem'
                }}
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
                className={`w-full px-4 py-2.5 text-base border-2 rounded-xl transition-all focus:outline-none ${
                  errors[field.name]
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
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
                className={`w-full px-4 py-2.5 text-base border-2 rounded-xl transition-all focus:outline-none ${
                  errors[field.name]
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
                }`}
              />
            )}

            {/* Radio Buttons */}
            {field.type === 'radio' && (
              <div className="space-y-3">
                {field.options?.map(option => (
                  <label key={option.value || option} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="radio"
                        name={field.name}
                        value={option.value || option}
                        checked={templateFields[field.name] === (option.value || option)}
                        onChange={(e) => onFieldChange(field.name, e.target.value)}
                        className="w-4 h-4 accent-orange-600 cursor-pointer"
                      />
                    </div>
                    <span className="text-base text-gray-700 group-hover:text-gray-900 transition-colors">
                      {option.label || option}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Error Message */}
            {errors[field.name] && (
              <p className="text-sm text-red-600 font-medium">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>

      {/* Image Upload Section */}
      <div className="pt-6 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Reference Images</h3>
        <p className="text-xs text-gray-600 mb-4">Optional • Max 5 images, 10MB each</p>
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
