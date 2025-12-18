'use client';

import React, { useRef, useEffect, useState } from 'react';

// Simple cn utility inline
function cn(...classes) {
  return classes
    .filter((cls) => typeof cls === 'string')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * OTPInput Component - 6-digit OTP input with auto-focus and paste support
 * 
 * Features:
 * - Individual digit boxes
 * - Auto-focus to next input
 * - Paste from clipboard support
 * - Keyboard navigation
 * - Backspace support
 * - Error state styling
 */
export default function OTPInput({
  value = '',
  onChange = () => {},
  onComplete = null,
  length = 6,
  disabled = false,
  error = false,
  errorMessage = '',
}) {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputRefs = useRef(Array(length).fill(null));

  // Sync internal state with prop value
  useEffect(() => {
    const otpArray = value.split('').slice(0, length);
    setOtp([...otpArray, ...Array(length - otpArray.length).fill('')]);
  }, [value, length]);

  const handleInputChange = (index, inputValue) => {
    // Only allow digits
    const numericValue = inputValue.replace(/\D/g, '');
    
    if (numericValue.length > 1) {
      // Handle paste
      handlePaste(numericValue, index);
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    const otpString = newOtp.join('');
    onChange(otpString);

    // Auto-focus to next input
    if (numericValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all digits are filled
    if (numericValue && otpString.length === length && onComplete) {
      onComplete(otpString);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      
      if (otp[index]) {
        // If current field has value, clear it
        newOtp[index] = '';
      } else if (index > 0) {
        // If current field is empty, go to previous and clear it
        newOtp[index - 1] = '';
        inputRefs.current[index - 1]?.focus();
      }
      
      setOtp(newOtp);
      onChange(newOtp.join(''));
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (pastedValue, startIndex) => {
    const digits = pastedValue.replace(/\D/g, '').slice(0, length - startIndex);
    const newOtp = [...otp];

    digits.split('').forEach((digit, i) => {
      if (startIndex + i < length) {
        newOtp[startIndex + i] = digit;
      }
    });

    setOtp(newOtp);
    const otpString = newOtp.join('');
    onChange(otpString);

    // Focus last filled input
    const lastFilledIndex = Math.min(startIndex + digits.length - 1, length - 1);
    inputRefs.current[lastFilledIndex]?.focus();

    if (otpString.length === length && onComplete) {
      onComplete(otpString);
    }
  };

  const handlePasteEvent = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    handlePaste(pastedText, 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 justify-center sm:justify-start">
        {Array(length)
          .fill(0)
          .map((_, index) => (
            <input
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[index]}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePasteEvent}
              disabled={disabled}
              className={cn(
                // Base styles
                'w-12 h-14 text-center text-lg font-semibold',
                'border-2 rounded-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                
                // Default state
                'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                
                // Disabled state
                disabled && 'bg-gray-100 cursor-not-allowed',
                
                // Error state
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50',
                
                // Filled state (visual feedback)
                otp[index] && !error && 'border-blue-500 bg-blue-50',
              )}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
      </div>

      {errorMessage && (
        <div className="text-sm text-red-600 font-medium text-center sm:text-left">
          {errorMessage}
        </div>
      )}

      {!error && (
        <div className="text-xs text-gray-500 text-center sm:text-left">
          {otp.filter((digit) => digit).length} of {length} digits entered
        </div>
      )}
    </div>
  );
}
