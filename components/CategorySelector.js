'use client';

/**
 * ============================================================================
 * CONSTRUCTION CATEGORY SELECTOR
 * ============================================================================
 * Reusable component for selecting construction categories, services, and materials
 *
 * Features:
 * - RFQ Category selection
 * - Vendor Category selection
 * - Professional Services selection
 * - Materials selection
 * - Search functionality
 * - Grouped display with icons
 *
 * Usage:
 *   import { RFQCategorySelect, VendorCategorySelect } from '@/components/CategorySelector';
 *
 *   <RFQCategorySelect
 *     value={formData.category}
 *     onChange={(e) => handleChange('category', e.target.value)}
 *     required={true}
 *   />
 * ============================================================================
 */

import { Package, Briefcase, Hammer, Search } from 'lucide-react';
import {
  RFQ_CATEGORIES,
  VENDOR_CATEGORIES,
  CONSTRUCTION_PROFESSIONALS,
  MATERIALS_CATEGORIES,
} from '@/lib/constructionCategories';

// ============================================================================
// RFQ CATEGORY SELECT
// ============================================================================

export function RFQCategorySelect({
  value = '',
  onChange,
  error = '',
  label = 'Category',
  placeholder = 'Select category',
  required = false,
  disabled = false,
  className = '',
  showIcons = true,
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
            <Package className="w-4 h-4 text-slate-500" />
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
        <option value="">{placeholder}</option>
        {RFQ_CATEGORIES.map((category) => (
          <option key={category.value} value={category.value}>
            {showIcons ? `${category.icon} ${category.label}` : category.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ============================================================================
// VENDOR CATEGORY SELECT
// ============================================================================

export function VendorCategorySelect({
  value = '',
  onChange,
  error = '',
  label = 'Business Category',
  placeholder = 'Select your category',
  required = false,
  disabled = false,
  className = '',
  multiple = false,
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
            <Briefcase className="w-4 h-4 text-slate-500" />
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
        multiple={multiple}
      >
        <option value="">{placeholder}</option>
        {VENDOR_CATEGORIES.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {multiple && (
        <p className="text-xs text-slate-500 mt-1">
          Hold Ctrl/Cmd to select multiple categories
        </p>
      )}
    </div>
  );
}

// ============================================================================
// PROFESSIONAL SERVICES SELECT (GROUPED)
// ============================================================================

export function ProfessionalServicesSelect({
  value = '',
  onChange,
  error = '',
  label = 'Professional Service',
  placeholder = 'Select service',
  required = false,
  disabled = false,
  className = '',
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
            <Hammer className="w-4 h-4 text-slate-500" />
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
        <option value="">{placeholder}</option>
        {CONSTRUCTION_PROFESSIONALS.map((category) => (
          <optgroup key={category.category} label={category.category}>
            {category.subcategories.map((sub) =>
              sub.services.map((service) => (
                <option
                  key={service}
                  value={service.toLowerCase().replace(/\s+/g, '_')}
                >
                  {service}
                </option>
              ))
            )}
          </optgroup>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ============================================================================
// MATERIALS SELECT (GROUPED)
// ============================================================================

export function MaterialsSelect({
  value = '',
  onChange,
  error = '',
  label = 'Material',
  placeholder = 'Select material',
  required = false,
  disabled = false,
  className = '',
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
        <option value="">{placeholder}</option>
        {MATERIALS_CATEGORIES.map((category) => (
          <optgroup key={category.category} label={category.category}>
            {category.items.map((item) => (
              <option
                key={item}
                value={item.toLowerCase().replace(/\s+/g, '_')}
              >
                {item}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ============================================================================
// CATEGORY CARDS DISPLAY (For browse/filter pages)
// ============================================================================

export function CategoryCards({ onCategorySelect, selectedCategory = '' }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {RFQ_CATEGORIES.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategorySelect(category.value)}
          className={`
            p-4 rounded-lg border-2 transition-all text-center
            ${
              selectedCategory === category.value
                ? 'border-amber-500 bg-amber-50'
                : 'border-slate-200 bg-white hover:border-amber-300'
            }
          `}
        >
          <div className="text-3xl mb-2">{category.icon}</div>
          <div className="text-xs font-medium text-slate-700">
            {category.label}
          </div>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// VENDOR CATEGORY CARDS
// ============================================================================

export function VendorCategoryCards({ onCategorySelect, selectedCategories = [] }) {
  const isSelected = (value) => selectedCategories.includes(value);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {VENDOR_CATEGORIES.map((category) => (
        <button
          key={category.value}
          onClick={() => onCategorySelect(category.value)}
          className={`
            p-3 rounded-lg border-2 transition-all text-left
            ${
              isSelected(category.value)
                ? 'border-amber-500 bg-amber-50'
                : 'border-slate-200 bg-white hover:border-amber-300'
            }
          `}
        >
          <div className="text-sm font-medium text-slate-800">
            {category.label}
          </div>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// CATEGORY FILTER (For browse pages with "All" option)
// ============================================================================

export function CategoryFilter({
  value = '',
  onChange,
  label = 'Category',
  includeAllOption = true,
  allOptionLabel = 'All Categories',
  className = '',
}) {
  const selectClass = `
    w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500
    bg-white text-gray-900
  `;

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <select value={value} onChange={onChange} className={selectClass}>
        {includeAllOption && <option value="">{allOptionLabel}</option>}
        {RFQ_CATEGORIES.map((category) => (
          <option key={category.value} value={category.value}>
            {category.icon} {category.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// SEARCHABLE CATEGORY SELECT (Advanced)
// ============================================================================

export function SearchableCategorySelect({
  value = '',
  onChange,
  type = 'rfq', // 'rfq', 'vendor', 'service', 'material'
  label = 'Category',
  placeholder = 'Search or select...',
  required = false,
  className = '',
}) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  const getOptions = () => {
    switch (type) {
      case 'rfq':
        return RFQ_CATEGORIES;
      case 'vendor':
        return VENDOR_CATEGORIES;
      default:
        return [];
    }
  };

  const options = getOptions();
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-800 mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange({ target: { value: option.value } });
                setSearchTerm(option.label);
                setIsOpen(false);
              }}
              className={`
                w-full text-left px-3 py-2 text-sm hover:bg-amber-50 transition
                ${value === option.value ? 'bg-amber-50 text-amber-700' : 'text-slate-700'}
              `}
            >
              {type === 'rfq' && option.icon && (
                <span className="mr-2">{option.icon}</span>
              )}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
