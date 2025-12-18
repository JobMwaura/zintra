'use client';

import React, { useState, useEffect } from 'react';
import { Phone, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * PhoneNumberInput Component - Kenya phone number input with validation
 * 
 * Features:
 * - Country code selector (Kenya default)
 * - Phone format validation
 * - Real-time validation feedback
 * - Helps with Kenya phone formats
 */
export default function PhoneNumberInput({
  value = '',
  onChange = () => {},
  error = '',
  placeholder = 'Enter phone number',
  disabled = false,
  label = 'Phone Number',
  hint = 'Format: +254712345678 or 0712345678',
  required = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validate phone number
  const validatePhone = (phone) => {
    // Remove all non-digits except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Check if it's a valid Kenya number
    // Format: +254712345678 or 0712345678
    const kenyanRegex = /^(\+254|0)[17]\d{8}$/;
    return kenyanRegex.test(cleaned);
  };

  // Format input as user types
  const handleChange = (e) => {
    let inputValue = e.target.value;

    // Remove all non-digits
    const digitsOnly = inputValue.replace(/\D/g, '');

    // Auto-format as user types
    let formatted = '';
    if (digitsOnly.startsWith('254')) {
      formatted = `+${digitsOnly}`;
    } else if (digitsOnly.startsWith('0')) {
      formatted = digitsOnly;
    } else if (digitsOnly.length > 0) {
      // Assume Kenya country code
      if (digitsOnly.length <= 9) {
        formatted = digitsOnly;
      } else {
        formatted = `+${digitsOnly}`;
      }
    }

    onChange(formatted);

    // Validate
    if (formatted) {
      setIsValid(validatePhone(formatted));
    } else {
      setIsValid(false);
    }
  };

  // Quick format buttons
  const handleQuickFormat = (format) => {
    onChange(format);
    setIsValid(validatePhone(format));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="space-y-2">
        {/* Input */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Phone size={18} />
          </div>
          <input
            type="tel"
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder={placeholder}
            className={`
              w-full pl-10 pr-10 py-2.5 rounded-lg border-2 transition-all duration-200
              text-gray-900 placeholder-gray-500
              focus:outline-none
              ${
                error
                  ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200 bg-red-50'
                  : isValid && value
                  ? 'border-green-500 focus:border-green-600 focus:ring-2 focus:ring-green-200 bg-green-50'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }
              ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}
            `}
          />

          {/* Validation icon */}
          {!error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValid && value ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <div className="w-5 h-5"></div>
              )}
            </div>
          )}
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle size={20} />
            </div>
          )}
        </div>

        {/* Help text and examples */}
        {!error && isFocused && (
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-semibold">Accepted formats:</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickFormat('+254712345678')}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono transition-colors"
              >
                +254712345678
              </button>
              <button
                type="button"
                onClick={() => handleQuickFormat('0712345678')}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-mono transition-colors"
              >
                0712345678
              </button>
            </div>
            <p className="text-gray-500">(Safaricom, Airtel, Vodafone)</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex gap-2 items-start">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Success message */}
      {isValid && value && !error && (
        <div className="text-sm text-green-600 font-medium">✓ Valid Kenya phone number</div>
      )}

      {/* Hint */}
      {!isValid && !error && value && hint && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}
