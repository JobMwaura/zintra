'use client';

import { useState } from 'react';

/**
 * SelectWithOther
 * Reusable dropdown component that includes "Other" option with conditional text input
 * 
 * Props:
 * - label: Label text for the field
 * - options: Array of option values
 * - value: Current selected value
 * - onChange: Callback when selection changes
 * - onOtherChange: Callback when "Other" text input changes
 * - otherValue: Current "Other" text input value
 * - placeholder: Placeholder for "Other" text input
 * - required: Whether field is required
 * - helpText: Helper text below the field
 */
export default function SelectWithOther({
  label,
  options = [],
  value,
  onChange,
  onOtherChange,
  otherValue = '',
  placeholder = 'Please specify...',
  required = false,
  helpText = '',
  disabled = false,
}) {
  const isOtherSelected = value === 'other';

  return (
    <div className="w-full">
      {/* Dropdown */}
      <label className="block text-sm font-medium text-slate-800 mb-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value="other">Other (Please specify)</option>
      </select>

      {helpText && !isOtherSelected && (
        <p className="text-xs text-gray-600 mt-1">{helpText}</p>
      )}

      {/* Conditional "Other" Text Input */}
      {isOtherSelected && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <label className="block text-sm font-medium text-slate-800 mb-2">
            Please specify{required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={otherValue}
            onChange={(e) => onOtherChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
          />
          <p className="text-xs text-gray-600 mt-2">
            {required ? 'This field is required when selecting "Other"' : 'Add your custom option'}
          </p>
        </div>
      )}
    </div>
  );
}
