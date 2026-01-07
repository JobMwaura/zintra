import React, { useState, useCallback } from 'react';

/**
 * RfqFormRenderer
 *
 * Dynamically renders form fields based on template field specifications.
 * Supports: text, select, textarea, date, file, number, multiselect fields
 * Manages form state and provides validation.
 *
 * Props:
 * - fields: Array of field objects with name, label, type, options, etc.
 * - onFieldChange: Callback when field value changes: (fieldName, value)
 * - onChange: Alternative callback for parent component state sync
 * - onFieldError: Callback when field validation fails: (fieldName, errorMessage)
 * - initialValues: Object with initial field values
 * - values: Current values from parent component (overrides internal state for display)
 * - disabled: Boolean to disable all fields
 *
 * Returns:
 * - Form values object: { fieldName: value, ... }
 * - Error tracking: { fieldName: errorMessage, ... }
 */
export const RfqFormRenderer = React.forwardRef(
  ({ fields, onFieldChange, onChange, onFieldError, initialValues = {}, values = {}, disabled = false }, ref) => {
    const [formValues, setFormValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [filePreview, setFilePreview] = useState({});
    
    // Use values from parent if provided, otherwise use internal formValues
    const currentValues = Object.keys(values).length > 0 ? values : formValues;

    // Validate field value based on field spec
    const validateField = useCallback((field, value) => {
      // Required check
      if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
        return `${field.label} is required`;
      }

      // Type-specific validations
      if (field.type === 'number' && value !== '') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return `${field.label} must be a number`;
        }
        if (field.min !== undefined && numValue < field.min) {
          return `${field.label} must be at least ${field.min}`;
        }
        if (field.max !== undefined && numValue > field.max) {
          return `${field.label} must be at most ${field.max}`;
        }
      }

      if (field.type === 'date' && value) {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return `${field.label} is not a valid date`;
        }
      }

      return null;
    }, []);

    // Handle field value changes
    const handleFieldChange = useCallback(
      (fieldName, value) => {
        const field = fields.find((f) => f.name === fieldName);

        // Validate
        const error = validateField(field, value);
        if (error) {
          setErrors((prev) => ({ ...prev, [fieldName]: error }));
          onFieldError?.(fieldName, error);
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
          });
          onFieldError?.(fieldName, null);
        }

        // Update internal value
        setFormValues((prev) => ({ ...prev, [fieldName]: value }));
        
        // Call both callbacks for parent component sync
        onFieldChange?.(fieldName, value);
        onChange?.(fieldName, value);  // For WizardRFQModal compatibility
      },
      [fields, validateField, onFieldChange, onChange, onFieldError]
    );

    // Handle file uploads
    const handleFileChange = useCallback(
      (fieldName, files) => {
        if (!files) {
          handleFieldChange(fieldName, null);
          return;
        }

        // Create preview URLs
        const previews = Array.from(files).map((file) => ({
          name: file.name,
          size: (file.size / 1024).toFixed(2) + ' KB',
          url: URL.createObjectURL(file),
        }));

        setFilePreview((prev) => ({ ...prev, [fieldName]: previews }));
        handleFieldChange(fieldName, files);
      },
      [handleFieldChange]
    );

    // Expose form methods via ref
    React.useImperativeHandle(ref, () => ({
      getValues: () => currentValues,
      getErrors: () => errors,
      isValid: () => Object.keys(errors).length === 0,
      setFieldValue: (fieldName, value) => handleFieldChange(fieldName, value),
      clearErrors: () => setErrors({}),
    }));

    // Render individual field
    const renderField = (field) => {
      const fieldId = `rfq-field-${field.name}`;
      const fieldError = errors[field.name];
      const fieldValue = currentValues[field.name] ?? '';

      const baseClasses =
        'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition';
      const errorClasses = fieldError ? 'border-red-500 bg-red-50' : 'border-gray-300';

      switch (field.type) {
        case 'text':
          return (
            <div key={field.name} className="mb-6">
              <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                id={fieldId}
                type="text"
                value={fieldValue}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder || ''}
                disabled={disabled}
                className={`${baseClasses} ${errorClasses} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              />
              {fieldError && <p className="text-red-500 text-sm mt-1">{fieldError}</p>}
            </div>
          );

        case 'number':
          return (
            <div key={field.name} className="mb-6">
              <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                id={fieldId}
                type="number"
                value={fieldValue}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                min={field.min}
                max={field.max}
                step={field.step || 1}
                placeholder={field.placeholder || ''}
                disabled={disabled}
                className={`${baseClasses} ${errorClasses} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              />
              {fieldError && <p className="text-red-500 text-sm mt-1">{fieldError}</p>}
            </div>
          );

        case 'select':
          const isOtherSelected = fieldValue === 'Other';
          const customValueKey = `${field.name}_custom`;
          const customFieldValue = currentValues[customValueKey] || '';
          
          return (
            <div key={field.name} className="mb-6">
              <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                id={fieldId}
                value={fieldValue}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                disabled={disabled}
                className={`${baseClasses} ${errorClasses} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              >
                <option value="">Select an option</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {/* Conditional text input when "Other" is selected */}
              {isOtherSelected && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <label htmlFor={customValueKey} className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify:
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id={customValueKey}
                    type="text"
                    value={customFieldValue}
                    onChange={(e) => handleFieldChange(customValueKey, e.target.value)}
                    placeholder={`Please explain your choice for "${field.label.toLowerCase()}"`}
                    disabled={disabled}
                    className={`${baseClasses} bg-white ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                  <p className="text-xs text-blue-600 mt-2">
                    💡 Help vendors understand your specific needs
                  </p>
                </div>
              )}

              {fieldError && <p className="text-red-500 text-sm mt-1">{fieldError}</p>}
            </div>
          );

        case 'multiselect':
          return (
            <div key={field.name} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="space-y-2 p-3 border border-gray-300 rounded-lg bg-white">
                {field.options?.map((option) => {
                  const currentArray = Array.isArray(fieldValue) ? fieldValue : [];
                  return (
                    <label key={option} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentArray.includes(option) || false}
                        onChange={(e) => {
                          const current = Array.isArray(fieldValue) ? fieldValue : [];
                          const updated = e.target.checked
                            ? [...current, option]
                            : current.filter((item) => item !== option);
                          handleFieldChange(field.name, updated);
                        }}
                        disabled={disabled}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className={`ml-2 text-sm text-gray-700 ${disabled ? 'text-gray-400' : ''}`}>
                        {option}
                      </span>
                    </label>
                  );
                })}
              </div>
              {fieldError && <p className="text-red-500 text-sm mt-1">{fieldError}</p>}
            </div>
          );

        case 'textarea':
          return (
            <div key={field.name} className="mb-6">
              <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                id={fieldId}
                value={fieldValue}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder || ''}
                disabled={disabled}
                rows={field.rows || 4}
                className={`${baseClasses} ${errorClasses} resize-none ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              />
              {fieldError && <p className="text-red-500 text-sm mt-1">{fieldError}</p>}
            </div>
          );

        case 'date':
          return (
            <div key={field.name} className="mb-6">
              <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                id={fieldId}
                type="date"
                value={fieldValue}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                disabled={disabled}
                className={`${baseClasses} ${errorClasses} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              />
              {fieldError && <p className="text-red-500 text-sm mt-1">{fieldError}</p>}
            </div>
          );

        case 'file':
          return (
            <div key={field.name} className="mb-6">
              <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor={fieldId}
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <p className="text-sm text-gray-500 mt-2">Click to upload</p>
                  </div>
                  <input
                    id={fieldId}
                    type="file"
                    multiple={field.multiple || false}
                    onChange={(e) => handleFileChange(field.name, e.target.files)}
                    disabled={disabled}
                    className="hidden"
                    accept={field.accept || '*/*'}
                  />
                </label>
              </div>

              {/* File previews */}
              {filePreview[field.name] && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Uploaded files:</p>
                  {filePreview[field.name].map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-100 rounded-lg"
                    >
                      <div className="flex items-center flex-1">
                        <svg
                          className="w-5 h-5 text-gray-500 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8 16.5a1 1 0 11-2 0 1 1 0 012 0zM15 7a2 2 0 11-4 0 2 2 0 014 0zM6.5 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFilePreview((prev) => {
                            const updated = { ...prev };
                            updated[field.name] = updated[field.name].filter((_, i) => i !== idx);
                            if (updated[field.name].length === 0) delete updated[field.name];
                            return updated;
                          });
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {fieldError && <p className="text-red-500 text-sm mt-1">{fieldError}</p>}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="space-y-6">
        {fields.map((field) => renderField(field))}
      </div>
    );
  }
);

RfqFormRenderer.displayName = 'RfqFormRenderer';

export default RfqFormRenderer;
