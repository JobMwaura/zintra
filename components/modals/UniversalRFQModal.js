'use client';

import { useState, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Universal RFQ Modal Component
 * 
 * Renders a dynamic 6-step RFQ form based on template data
 * Handles all field types: text, select, radio, checkbox, textarea, file, etc.
 * 
 * Props:
 *   template: RFQ template object with steps and fields
 *   categorySlug: Category slug (e.g., 'architectural_design')
 *   vendorId: Optional vendor ID for attribution
 *   onClose: Callback when user closes modal
 *   onSubmit: Callback when user submits form (receives formData)
 * 
 * Usage:
 *   <UniversalRFQModal
 *     template={template}
 *     categorySlug="architectural_design"
 *     onClose={handleClose}
 *     onSubmit={handleSubmit}
 *   />
 */
export default function UniversalRFQModal({
  template,
  categorySlug,
  vendorId,
  onClose,
  onSubmit,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const steps = useMemo(() => {
    if (!template || !template.steps) return [];
    return Array.isArray(template.steps) ? template.steps : Object.values(template.steps);
  }, [template]);

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  /**
   * Validate a single field value
   */
  const validateField = useCallback((field, value) => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (!value) return null;

    switch (field.type) {
      case 'email':
        if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          return 'Please enter a valid email address';
        }
        break;

      case 'tel':
      case 'phone':
        if (!value.match(/^\+?[\d\s\-()]{10,}$/)) {
          return 'Please enter a valid phone number';
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          return 'Please enter a valid number';
        }
        if (field.min !== undefined && Number(value) < field.min) {
          return `Must be at least ${field.min}`;
        }
        if (field.max !== undefined && Number(value) > field.max) {
          return `Must be at most ${field.max}`;
        }
        break;

      case 'date':
        if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return 'Please enter a valid date (YYYY-MM-DD)';
        }
        break;

      default:
        break;
    }

    return null;
  }, []);

  /**
   * Validate all fields in current step
   */
  const validateStep = useCallback(() => {
    const errors = {};
    let isValid = true;

    currentStepData?.fields?.forEach((field) => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        errors[field.id] = error;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  }, [currentStepData, formData, validateField]);

  /**
   * Handle field value changes
   */
  const handleFieldChange = useCallback((fieldId, value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear error for this field
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  }, []);

  /**
   * Handle file uploads
   */
  const handleFileChange = useCallback((fieldId, files) => {
    if (files && files.length > 0) {
      handleFieldChange(fieldId, files[0]);
    }
  }, [handleFieldChange]);

  /**
   * Navigate to next step
   */
  const handleNextStep = useCallback(() => {
    if (validateStep()) {
      setError(null);
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  }, [validateStep, totalSteps]);

  /**
   * Navigate to previous step
   */
  const handlePrevStep = useCallback(() => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async () => {
    if (!validateStep()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const submissionData = {
        ...formData,
        categorySlug,
        templateVersion: template.templateVersion,
        vendorId: vendorId || undefined,
        submittedAt: new Date().toISOString(),
      };

      await onSubmit(submissionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateStep, categorySlug, template.templateVersion, vendorId, onSubmit]);

  /**
   * Render form field based on type
   */
  const renderField = (field) => {
    const value = formData[field.id] || '';
    const fieldError = fieldErrors[field.id];

    const baseInputClasses =
      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900';
    const errorClasses = fieldError ? 'border-red-500' : 'border-gray-300';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-sm font-medium text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              id={field.id}
              type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`${baseInputClasses} ${errorClasses}`}
              min={field.type === 'number' ? field.min : undefined}
              max={field.type === 'number' ? field.max : undefined}
            />
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
            {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-sm font-medium text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`${baseInputClasses} ${errorClasses} min-h-24 resize-none`}
            />
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
            {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-sm font-medium text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={`${baseInputClasses} ${errorClasses}`}
            >
              <option value="">{field.placeholder || 'Select an option'}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
            {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    id={`${field.id}-${option.value}`}
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="mr-2 cursor-pointer"
                  />
                  <label
                    htmlFor={`${field.id}-${option.value}`}
                    className="font-normal cursor-pointer text-gray-900"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
            {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`${field.id}-${option.value}`}
                    checked={Array.isArray(value) ? value.includes(option.value) : false}
                    onChange={(e) => {
                      const newValue = Array.isArray(value) ? [...value] : [];
                      if (e.target.checked) {
                        newValue.push(option.value);
                      } else {
                        newValue.splice(newValue.indexOf(option.value), 1);
                      }
                      handleFieldChange(field.id, newValue);
                    }}
                    className="mr-2 cursor-pointer"
                  />
                  <label
                    htmlFor={`${field.id}-${option.value}`}
                    className="font-normal cursor-pointer text-gray-900"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
            {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
          </div>
        );

      case 'file-upload':
        return (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-sm font-medium text-gray-900">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              id={field.id}
              type="file"
              onChange={(e) => handleFileChange(field.id, e.target.files)}
              accept={field.accept}
              className={`${baseInputClasses} ${errorClasses}`}
            />
            {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
            {field.helpText && <p className="text-xs text-gray-500">{field.helpText}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{template.categoryLabel}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentStep + 1} of {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Step Progress */}
        <div className="px-6 pt-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {currentStepData && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentStepData.title}</h3>
                {currentStepData.description && (
                  <p className="text-sm text-gray-600 mt-2">{currentStepData.description}</p>
                )}
              </div>

              <div className="space-y-4">
                {currentStepData.fields?.map((field) => renderField(field))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between gap-3">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-gray-700 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
            >
              Cancel
            </button>

            {currentStep === totalSteps - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium"
              >
                {isSubmitting ? 'Submitting...' : 'Submit RFQ'}
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
