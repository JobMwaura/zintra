'use client';

/**
 * ============================================================================
 * LOCATION SELECTOR COMPONENT
 * ============================================================================
 * Reusable dropdown selector for Kenya counties and towns
 *
 * Features:
 * - Two-level selection (County → Town)
 * - Auto-filters towns based on selected county
 * - Validates selections
 * - Responsive design
 * - Error state handling
 *
 * Usage:
 *   import LocationSelector from '@/components/LocationSelector';
 *
 *   <LocationSelector
 *     county={formData.county}
 *     town={formData.town}
 *     onCountyChange={(e) => handleChange('county', e.target.value)}
 *     onTownChange={(e) => handleChange('town', e.target.value)}
 *     countyError={errors.county}
 *     townError={errors.town}
 *     required={true}
 *   />
 * ============================================================================
 */

import { KENYA_COUNTIES, KENYA_TOWNS_BY_COUNTY } from '@/lib/kenyaLocations';
import { MapPin } from 'lucide-react';

export default function LocationSelector({
  county = '',
  town = '',
  onCountyChange,
  onTownChange,
  countyError = '',
  townError = '',
  countyLabel = 'County',
  townLabel = 'Town/City',
  countyPlaceholder = 'Select county',
  townPlaceholder = 'Select town',
  required = false,
  disabled = false,
  className = '',
  layout = 'row', // 'row' or 'column'
  size = 'default', // 'default' or 'compact'
}) {
  const availableTowns = county ? KENYA_TOWNS_BY_COUNTY[county] || [] : [];

  const baseSelectClass = `
    w-full rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500
    ${size === 'compact' ? 'py-2' : 'py-2.5'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-900'}
  `;

  const getInputClass = (hasError) => `
    ${baseSelectClass}
    ${hasError ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}
  `;

  return (
    <div className={`${layout === 'row' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'} ${className}`}>
      {/* County Select */}
      <div>
        <label className="block text-sm font-medium text-slate-800 mb-1">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-slate-500" />
            {countyLabel}
            {required && <span className="text-red-500">*</span>}
          </div>
        </label>
        <select
          value={county}
          onChange={(e) => {
            onCountyChange(e);
            // Reset town when county changes
            if (onTownChange && town) {
              const syntheticEvent = {
                target: { value: '' },
              };
              onTownChange(syntheticEvent);
            }
          }}
          disabled={disabled}
          className={getInputClass(countyError)}
          required={required}
        >
          <option value="">{countyPlaceholder}</option>
          {KENYA_COUNTIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        {countyError && (
          <p className="text-xs text-red-500 mt-1">{countyError}</p>
        )}
      </div>

      {/* Town Select */}
      <div>
        <label className="block text-sm font-medium text-slate-800 mb-1">
          {townLabel}
          {required && county && <span className="text-red-500">*</span>}
        </label>
        <select
          value={town}
          onChange={onTownChange}
          disabled={disabled || !county}
          className={getInputClass(townError)}
          required={required && county}
        >
          <option value="">
            {county ? townPlaceholder : 'Select county first'}
          </option>
          {availableTowns.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {townError && (
          <p className="text-xs text-red-500 mt-1">{townError}</p>
        )}
        {!county && (
          <p className="text-xs text-slate-500 mt-1">
            Please select a county first
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * VARIANT: Single County Select (for filters and simple forms)
 * ============================================================================
 */
export function CountySelect({
  value = '',
  onChange,
  error = '',
  label = 'County',
  placeholder = 'Select county',
  required = false,
  disabled = false,
  className = '',
  includeAllOption = false,
  allOptionLabel = 'All Counties',
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
          {label}
          {required && <span className="text-red-500">*</span>}
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
        {KENYA_COUNTIES.map((county) => (
          <option key={county.value} value={county.value}>
            {county.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/**
 * ============================================================================
 * VARIANT: Single Town Select (for when county is already known)
 * ============================================================================
 */
export function TownSelect({
  county,
  value = '',
  onChange,
  error = '',
  label = 'Town/City',
  placeholder = 'Select town',
  required = false,
  disabled = false,
  className = '',
}) {
  const availableTowns = county ? KENYA_TOWNS_BY_COUNTY[county] || [] : [];

  const inputClass = `
    w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500
    ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}
    ${disabled || !county ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-900'}
  `;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-800 mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled || !county}
        className={inputClass}
        required={required}
      >
        <option value="">
          {county ? placeholder : 'Select county first'}
        </option>
        {availableTowns.map((town) => (
          <option key={town} value={town}>
            {town}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {!county && (
        <p className="text-xs text-slate-500 mt-1">
          Please select a county first
        </p>
      )}
    </div>
  );
}

/**
 * ============================================================================
 * VARIANT: County + Town Filter (for browse/search pages with "All" options)
 * ============================================================================
 */
export function CountyTownFilter({
  county = '',
  town = '',
  onCountyChange,
  onTownChange,
  countyLabel = 'County',
  townLabel = 'Specific Location',
  countyPlaceholder = 'All Counties',
  townPlaceholder = 'All Locations',
  className = '',
}) {
  const availableTowns = county ? KENYA_TOWNS_BY_COUNTY[county] || [] : [];

  const selectClass = `
    w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500
    bg-white text-gray-900
  `;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${className}`}>
      {/* County Select */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {countyLabel}
        </label>
        <select
          value={county}
          onChange={(e) => {
            onCountyChange(e);
            // Reset town when county changes
            if (onTownChange && town) {
              const syntheticEvent = {
                target: { value: '' },
              };
              onTownChange(syntheticEvent);
            }
          }}
          className={selectClass}
        >
          <option value="">{countyPlaceholder}</option>
          {KENYA_COUNTIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Town Select */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {townLabel}
        </label>
        <select
          value={town}
          onChange={onTownChange}
          disabled={!county}
          className={`${selectClass} ${!county ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
        >
          <option value="">{townPlaceholder}</option>
          {availableTowns.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {!county && (
          <p className="text-xs text-slate-500 mt-1">
            Select a county first to filter locations
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * VARIANT: Grouped County Select (grouped by region)
 * ============================================================================
 */
export function GroupedCountySelect({
  value = '',
  onChange,
  error = '',
  label = 'County',
  placeholder = 'Select county',
  required = false,
  disabled = false,
  className = '',
}) {
  const regions = [
    { name: 'Nairobi', counties: KENYA_COUNTIES.filter(c => c.region === 'Nairobi') },
    { name: 'Central', counties: KENYA_COUNTIES.filter(c => c.region === 'Central') },
    { name: 'Coast', counties: KENYA_COUNTIES.filter(c => c.region === 'Coast') },
    { name: 'Eastern', counties: KENYA_COUNTIES.filter(c => c.region === 'Eastern') },
    { name: 'Western', counties: KENYA_COUNTIES.filter(c => c.region === 'Western') },
    { name: 'Nyanza', counties: KENYA_COUNTIES.filter(c => c.region === 'Nyanza') },
    { name: 'Rift Valley', counties: KENYA_COUNTIES.filter(c => c.region === 'Rift Valley') },
    { name: 'North Eastern', counties: KENYA_COUNTIES.filter(c => c.region === 'North Eastern') },
  ];

  const inputClass = `
    w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500
    ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-900'}
  `;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-800 mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={inputClass}
        required={required}
      >
        <option value="">{placeholder}</option>
        {regions.map((region) => (
          <optgroup key={region.name} label={region.name}>
            {region.counties.map((county) => (
              <option key={county.value} value={county.value}>
                {county.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
