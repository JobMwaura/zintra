'use client';

/**
 * ============================================================================
 * MULTI-COUNTRY LOCATION SELECTOR
 * ============================================================================
 * Reusable dropdown selector for Kenya, South Africa, and Zimbabwe
 *
 * Features:
 * - Country selection
 * - Province/County selection (based on country)
 * - City/Town selection (based on province/county)
 * - Auto-filters based on selections
 * - Validates selections
 * - Responsive design
 *
 * Usage:
 *   import MultiCountryLocationSelector from '@/components/MultiCountryLocationSelector';
 *
 *   <MultiCountryLocationSelector
 *     country={formData.country}
 *     region={formData.region}
 *     city={formData.city}
 *     onCountryChange={(e) => handleChange('country', e.target.value)}
 *     onRegionChange={(e) => handleChange('region', e.target.value)}
 *     onCityChange={(e) => handleChange('city', e.target.value)}
 *     required={true}
 *   />
 * ============================================================================
 */

import { Globe, MapPin } from 'lucide-react';

// Import all location data
import { KENYA_COUNTIES, KENYA_TOWNS_BY_COUNTY } from '@/lib/kenyaLocations';
import { SA_PROVINCES, SA_CITIES_BY_PROVINCE } from '@/lib/southAfricaLocations';
import { ZW_PROVINCES, ZW_CITIES_BY_PROVINCE } from '@/lib/zimbabweLocations';

// ============================================================================
// COUNTRIES CONFIGURATION
// ============================================================================

const COUNTRIES = [
  { value: 'kenya', label: 'Kenya', flag: '🇰🇪', currency: 'KSh' },
  { value: 'south_africa', label: 'South Africa', flag: '🇿🇦', currency: 'ZAR' },
  { value: 'zimbabwe', label: 'Zimbabwe', flag: '🇿🇼', currency: 'USD/ZWL' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MultiCountryLocationSelector({
  country = '',
  region = '',
  city = '',
  onCountryChange,
  onRegionChange,
  onCityChange,
  countryError = '',
  regionError = '',
  cityError = '',
  countryLabel = 'Country',
  regionLabel = 'Province/County',
  cityLabel = 'City/Town',
  countryPlaceholder = 'Select country',
  regionPlaceholder = 'Select province/county',
  cityPlaceholder = 'Select city/town',
  required = false,
  disabled = false,
  className = '',
  layout = 'column', // 'row' or 'column'
  showFlags = true,
}) {
  // Get regions based on selected country
  const getRegions = () => {
    switch (country) {
      case 'kenya':
        return KENYA_COUNTIES;
      case 'south_africa':
        return SA_PROVINCES;
      case 'zimbabwe':
        return ZW_PROVINCES;
      default:
        return [];
    }
  };

  // Get cities based on selected region and country
  const getCities = () => {
    if (!region) return [];

    switch (country) {
      case 'kenya':
        return KENYA_TOWNS_BY_COUNTY[region] || [];
      case 'south_africa':
        return SA_CITIES_BY_PROVINCE[region] || [];
      case 'zimbabwe':
        return ZW_CITIES_BY_PROVINCE[region] || [];
      default:
        return [];
    }
  };

  const regions = getRegions();
  const cities = getCities();

  // Get region label based on country
  const getRegionLabel = () => {
    switch (country) {
      case 'kenya':
        return 'County';
      case 'south_africa':
      case 'zimbabwe':
        return 'Province';
      default:
        return regionLabel;
    }
  };

  const baseSelectClass = `
    w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500
    ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-900'}
  `;

  const getInputClass = (hasError) => `
    ${baseSelectClass}
    ${hasError ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}
  `;

  return (
    <div className={`${layout === 'row' ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'space-y-4'} ${className}`}>
      {/* Country Select */}
      <div>
        <label className="block text-sm font-medium text-slate-800 mb-1">
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-slate-500" />
            {countryLabel}
            {required && <span className="text-red-500">*</span>}
          </div>
        </label>
        <select
          value={country}
          onChange={(e) => {
            onCountryChange(e);
            // Reset region and city when country changes
            if (onRegionChange) {
              const syntheticEvent = { target: { value: '' } };
              onRegionChange(syntheticEvent);
            }
            if (onCityChange) {
              const syntheticEvent = { target: { value: '' } };
              onCityChange(syntheticEvent);
            }
          }}
          disabled={disabled}
          className={getInputClass(countryError)}
          required={required}
        >
          <option value="">{countryPlaceholder}</option>
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>
              {showFlags ? `${c.flag} ${c.label}` : c.label}
            </option>
          ))}
        </select>
        {countryError && (
          <p className="text-xs text-red-500 mt-1">{countryError}</p>
        )}
      </div>

      {/* Region/Province/County Select */}
      <div>
        <label className="block text-sm font-medium text-slate-800 mb-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-500" />
            {getRegionLabel()}
            {required && country && <span className="text-red-500">*</span>}
          </div>
        </label>
        <select
          value={region}
          onChange={(e) => {
            onRegionChange(e);
            // Reset city when region changes
            if (onCityChange && city) {
              const syntheticEvent = { target: { value: '' } };
              onCityChange(syntheticEvent);
            }
          }}
          disabled={disabled || !country}
          className={getInputClass(regionError)}
          required={required && country}
        >
          <option value="">
            {country ? regionPlaceholder : 'Select country first'}
          </option>
          {regions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {regionError && (
          <p className="text-xs text-red-500 mt-1">{regionError}</p>
        )}
        {!country && (
          <p className="text-xs text-slate-500 mt-1">
            Please select a country first
          </p>
        )}
      </div>

      {/* City Select */}
      <div>
        <label className="block text-sm font-medium text-slate-800 mb-1">
          {cityLabel}
          {required && region && <span className="text-red-500">*</span>}
        </label>
        <select
          value={city}
          onChange={onCityChange}
          disabled={disabled || !region}
          className={getInputClass(cityError)}
          required={required && region}
        >
          <option value="">
            {region ? cityPlaceholder : `Select ${getRegionLabel().toLowerCase()} first`}
          </option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {cityError && (
          <p className="text-xs text-red-500 mt-1">{cityError}</p>
        )}
        {!region && country && (
          <p className="text-xs text-slate-500 mt-1">
            Please select a {getRegionLabel().toLowerCase()} first
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// VARIANT: Country Select Only
// ============================================================================

export function CountrySelect({
  value = '',
  onChange,
  error = '',
  label = 'Country',
  placeholder = 'Select country',
  required = false,
  disabled = false,
  className = '',
  showFlags = true,
  includeAllOption = false,
  allOptionLabel = 'All Countries',
}) {
  const inputClass = `
    w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500
    ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-900'}
  `;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-800 mb-1">
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-slate-500" />
            {label}
            {required && <span className="text-red-500">*</span>}
          </div>
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={inputClass}
        required={required}
      >
        <option value="">{includeAllOption ? allOptionLabel : placeholder}</option>
        {COUNTRIES.map((country) => (
          <option key={country.value} value={country.value}>
            {showFlags ? `${country.flag} ${country.label}` : country.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ============================================================================
// HELPER: Get country display name
// ============================================================================

export function getCountryLabel(countryValue) {
  const country = COUNTRIES.find(c => c.value === countryValue);
  return country ? country.label : countryValue;
}

export function getCountryFlag(countryValue) {
  const country = COUNTRIES.find(c => c.value === countryValue);
  return country ? country.flag : '';
}

// ============================================================================
// EXPORT COUNTRIES
// ============================================================================

export { COUNTRIES };
