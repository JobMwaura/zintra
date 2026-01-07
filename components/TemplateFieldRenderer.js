'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * TemplateFieldRenderer
 * Dynamically renders form fields based on template field definitions
 * 
 * Supports: text, number, select, textarea, checkbox, file, date, email
 * 
 * @param {Object} field - Field definition from template JSON
 * @param {string} field.name - Field name/key
 * @param {string} field.label - Display label
 * @param {string} field.type - Field type (text, number, select, textarea, etc.)
 * @param {string} field.placeholder - Placeholder text
 * @param {boolean} field.required - Is field required?
 * @param {Array} field.options - Options for select/radio fields
 * @param {number} field.min - Min value for number fields
 * @param {number} field.max - Max value for number fields
 * @param {boolean} field.multiple - Allow multiple file uploads
 * @param {*} value - Current field value
 * @param {Function} onChange - Handler: onChange(name, value)
 * @param {string} error - Error message to display
 */
export default function TemplateFieldRenderer({
  field,
  value,
  onChange,
  error,
}) {
  if (!field) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-red-700">Invalid field configuration</p>
      </div>
    );
  }

  const {
    name,
    label,
    type = 'text',
    placeholder,
    required = false,
    options = [],
    min,
    max,
    multiple = false,
  } = field;

  const commonInputClasses =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900';

  const baseWrapperClasses = 'mb-6';
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-2';
  const errorClasses = 'text-red-500 text-sm mt-1';

  // TEXT INPUT
  if (type === 'text' || type === 'email') {
    return (
      <div className={baseWrapperClasses}>
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          className={commonInputClasses}
        />
        {error && <p className={errorClasses}>{error}</p>}
      </div>
    );
  }

  // NUMBER INPUT
  if (type === 'number') {
    return (
      <div className={baseWrapperClasses}>
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="number"
          name={name}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          min={min}
          max={max}
          className={commonInputClasses}
        />
        {error && <p className={errorClasses}>{error}</p>}
      </div>
    );
  }

  // DATE INPUT
  if (type === 'date') {
    return (
      <div className={baseWrapperClasses}>
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="date"
          name={name}
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          className={commonInputClasses}
        />
        {error && <p className={errorClasses}>{error}</p>}
      </div>
    );
  }

  // TEXTAREA
  if (type === 'textarea') {
    return (
      <div className={baseWrapperClasses}>
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          name={name}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          rows="4"
          className={commonInputClasses}
        />
        {error && <p className={errorClasses}>{error}</p>}
      </div>
    );
  }

  // SELECT DROPDOWN (with conditional "Other" text input)
  if (type === 'select') {
    const isOtherSelected = value === 'Other';
    const customValueKey = `${name}_custom`;

    return (
      <div className={baseWrapperClasses}>
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {/* Main select dropdown */}
        <select
          name={name}
          value={value || ''}
          onChange={(e) => onChange(name, e.target.value)}
          className={commonInputClasses}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option, idx) => (
            <option key={idx} value={option}>
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
              name={customValueKey}
              placeholder={`Please explain your choice for "${label.toLowerCase()}"`}
              onChange={(e) => onChange(customValueKey, e.target.value)}
              className={`${commonInputClasses} bg-white`}
            />
            <p className="text-xs text-blue-600 mt-2">
              💡 Help vendors understand your specific needs
            </p>
          </div>
        )}

        {error && <p className={errorClasses}>{error}</p>}
      </div>
    );
  }

  // CHECKBOX
  if (type === 'checkbox') {
    return (
      <div className={baseWrapperClasses}>
        <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            name={name}
            checked={value || false}
            onChange={(e) => onChange(name, e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
        {error && <p className={errorClasses}>{error}</p>}
      </div>
    );
  }

  // FILE UPLOAD
  if (type === 'file') {
    return (
      <div className={baseWrapperClasses}>
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="file"
          name={name}
          multiple={multiple}
          onChange={(e) => {
            if (multiple) {
              onChange(name, Array.from(e.target.files || []));
            } else {
              onChange(name, e.target.files?.[0] || null);
            }
          }}
          className={`block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-orange-50 file:text-orange-700
            hover:file:bg-orange-100
            cursor-pointer`}
        />
        <p className="text-xs text-gray-500 mt-1">
          {multiple ? 'You can upload multiple files' : 'Upload a single file'}
        </p>
        {error && <p className={errorClasses}>{error}</p>}
      </div>
    );
  }

  // RADIO BUTTONS (for smaller option sets)
  if (type === 'radio') {
    return (
      <div className={baseWrapperClasses}>
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="space-y-2">
          {options.map((option, idx) => (
            <label key={idx} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 rounded">
              <input
                type="radio"
                name={name}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(name, e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          ))}
        </div>
        {error && <p className={errorClasses}>{error}</p>}
      </div>
    );
  }

  // UNKNOWN TYPE
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-yellow-700">Unknown field type: {type}</p>
    </div>
  );
}
