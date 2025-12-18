'use client';

import { useState, useEffect } from 'react';

/**
 * PhoneInput Component
 * Provides country code selection with phone number input
 * Automatically formats phone number with selected country code
 * 
 * Usage:
 * <PhoneInput 
 *   value={phoneNumber}
 *   onChange={setPhoneNumber}
 *   country="KE"
 *   onCountryChange={setCountry}
 *   label="Phone Number"
 * />
 */

const COUNTRIES = [
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼' },
  { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼' },
  { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦' },
  { code: 'CD', name: 'Democratic Republic of Congo', dialCode: '+243', flag: '🇨🇩' },
];

export default function PhoneInput({
  value = '',
  onChange = () => {},
  country = 'KE',
  onCountryChange = () => {},
  label = 'Phone Number',
  placeholder = '721829148',
  disabled = false,
  error = null,
  required = false,
  className = '',
  style = {},
}) {
  const [selectedCountry, setSelectedCountry] = useState(null);

  // Initialize selected country
  useEffect(() => {
    const foundCountry = COUNTRIES.find(c => c.code === country);
    setSelectedCountry(foundCountry || COUNTRIES[0]);
  }, [country]);

  const handleCountryChange = (e) => {
    const newCountry = COUNTRIES.find(c => c.code === e.target.value);
    if (newCountry) {
      setSelectedCountry(newCountry);
      onCountryChange?.(newCountry);
      // Clear phone when changing country
      onChange('');
    }
  };

  const handlePhoneChange = (e) => {
    let input = e.target.value;
    
    // Remove all non-digit characters
    let phoneDigits = input.replace(/\D/g, '');
    
    // Limit to reasonable length (max 15 digits is international standard)
    phoneDigits = phoneDigits.slice(0, 15);

    if (phoneDigits) {
      // Format with country code
      const formatted = `${selectedCountry.dialCode}${phoneDigits}`;
      onChange(formatted);
    } else {
      onChange('');
    }
  };

  // Extract just the phone number part (without country code) for display
  const displayPhone = value 
    ? value.replace(selectedCountry?.dialCode || '', '')
    : '';

  return (
    <div className={`phone-input-wrapper ${className}`} style={style}>
      {label && (
        <label className="phone-input-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <div className="phone-input-container">
        <select
          value={selectedCountry?.code || 'KE'}
          onChange={handleCountryChange}
          disabled={disabled}
          className="country-code-select"
          title="Select country"
        >
          <option value="">Select country</option>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name} ({c.dialCode})
            </option>
          ))}
        </select>

        <div className="phone-input-group">
          <span className="dial-code">{selectedCountry?.dialCode}</span>
          <input
            type="tel"
            inputMode="numeric"
            placeholder={placeholder}
            value={displayPhone}
            onChange={handlePhoneChange}
            disabled={disabled}
            className="phone-input-field"
            maxLength="15"
            title="Enter phone number"
          />
        </div>
      </div>

      {value && (
        <div className="phone-formatted">
          <small>Formatted: {value}</small>
        </div>
      )}

      {error && (
        <div className="phone-error">
          <small style={{ color: '#dc2626' }}>{error}</small>
        </div>
      )}

      <style jsx>{`
        .phone-input-wrapper {
          margin-bottom: 16px;
        }

        .phone-input-label {
          display: block;
          font-weight: 500;
          margin-bottom: 6px;
          color: #333;
        }

        .required {
          color: #dc2626;
          margin-left: 4px;
        }

        .phone-input-container {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }

        .country-code-select {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px 0 0 6px;
          background-color: white;
          font-size: 14px;
          cursor: pointer;
          min-width: 140px;
          transition: border-color 0.2s;
        }

        .country-code-select:hover:not(:disabled) {
          border-color: #cbd5e1;
        }

        .country-code-select:focus {
          outline: none;
          border-color: #c28a3a;
          box-shadow: 0 0 0 3px rgba(194, 138, 58, 0.1);
        }

        .country-code-select:disabled {
          background-color: #f1f5f9;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .phone-input-group {
          flex: 1;
          display: flex;
          align-items: center;
          border: 1px solid #e2e8f0;
          border-radius: 0 6px 6px 0;
          padding: 0 12px;
          background-color: white;
          transition: border-color 0.2s;
        }

        .phone-input-group:focus-within {
          border-color: #c28a3a;
          box-shadow: 0 0 0 3px rgba(194, 138, 58, 0.1);
        }

        .dial-code {
          font-weight: 500;
          color: #64748b;
          margin-right: 6px;
          white-space: nowrap;
        }

        .phone-input-field {
          flex: 1;
          border: none;
          padding: 8px 0;
          font-size: 14px;
          font-family: inherit;
          outline: none;
        }

        .phone-input-field::placeholder {
          color: #cbd5e1;
        }

        .phone-input-field:disabled {
          background-color: transparent;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .phone-formatted {
          margin-top: 6px;
          color: #64748b;
        }

        .phone-error {
          margin-top: 6px;
          color: #dc2626;
        }

        @media (max-width: 640px) {
          .phone-input-container {
            flex-direction: column;
            gap: 6px;
          }

          .country-code-select,
          .phone-input-group {
            border-radius: 6px;
          }

          .country-code-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
