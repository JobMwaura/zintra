/**
 * ============================================================================
 * CATEGORY UTILITY FUNCTIONS
 * ============================================================================
 * 
 * Helper functions for category operations throughout the application
 * 
 * Usage:
 *   import { validateCategorySlug, formatCategoryLabel } from '@/lib/categories/categoryUtils';
 *
 * ============================================================================
 */

import { CANONICAL_CATEGORIES, CATEGORIES_BY_SLUG, CATEGORY_SLUG_TO_LABEL } from './canonicalCategories';

/**
 * Format a category slug to display label
 * @param {string} slug - Category slug
 * @returns {string} Formatted label
 */
export const formatCategoryLabel = (slug) => {
  return CATEGORY_SLUG_TO_LABEL[slug] || slug;
};

/**
 * Get category icon name for display
 * @param {string} slug - Category slug
 * @returns {string|null} Lucide icon name or null
 */
export const getCategoryIcon = (slug) => {
  const category = CATEGORIES_BY_SLUG[slug];
  return category?.icon || null;
};

/**
 * Get category description
 * @param {string} slug - Category slug
 * @returns {string|null} Category description or null
 */
export const getCategoryDescription = (slug) => {
  const category = CATEGORIES_BY_SLUG[slug];
  return category?.description || null;
};

/**
 * Filter array of slugs to only valid categories
 * @param {string[]} slugs - Array of category slugs
 * @returns {string[]} Filtered array of valid slugs
 */
export const filterValidCategorySlugs = (slugs) => {
  if (!Array.isArray(slugs)) return [];
  return slugs.filter((slug) => CATEGORIES_BY_SLUG[slug]);
};

/**
 * Get categories ordered for display (select dropdowns, etc.)
 * @returns {Object[]} Sorted categories with slug, label, icon
 */
export const getCategoriesForDisplay = () => {
  return CANONICAL_CATEGORIES.map((cat) => ({
    value: cat.slug,
    label: cat.label,
    icon: cat.icon,
    description: cat.description,
  })).sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * Validate vendor primary category setting
 * @param {string} slug - Category slug to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export const validatePrimaryCategory = (slug) => {
  if (!slug) {
    return { isValid: false, error: 'Primary category is required' };
  }

  if (typeof slug !== 'string') {
    return { isValid: false, error: 'Category must be a string' };
  }

  if (!CATEGORIES_BY_SLUG[slug]) {
    return { isValid: false, error: `Unknown category: ${slug}` };
  }

  return { isValid: true };
};

/**
 * Validate secondary categories
 * @param {string[]} slugs - Array of category slugs
 * @returns {Object} { isValid: boolean, valid: string[], invalid?: string[] }
 */
export const validateSecondaryCategories = (slugs) => {
  if (!Array.isArray(slugs)) {
    return { isValid: false, valid: [], invalid: slugs };
  }

  const valid = [];
  const invalid = [];

  slugs.forEach((slug) => {
    if (CATEGORIES_BY_SLUG[slug]) {
      valid.push(slug);
    } else {
      invalid.push(slug);
    }
  });

  return {
    isValid: invalid.length === 0,
    valid,
    ...(invalid.length > 0 && { invalid }),
  };
};

/**
 * Validate other services free text
 * @param {string} text - Free text to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export const validateOtherServices = (text) => {
  if (text === null || text === undefined) {
    return { isValid: true }; // Optional field
  }

  if (typeof text !== 'string') {
    return { isValid: false, error: 'Other services must be text' };
  }

  if (text.length > 2000) {
    return { isValid: false, error: 'Other services text too long (max 2000 characters)' };
  }

  return { isValid: true };
};

/**
 * Check if secondary categories conflict with primary
 * @param {string} primarySlug - Primary category slug
 * @param {string[]} secondarySlugs - Array of secondary slugs
 * @returns {Object} { isValid: boolean, error?: string }
 */
export const validateCategoryConflict = (primarySlug, secondarySlugs) => {
  if (!Array.isArray(secondarySlugs)) {
    return { isValid: true };
  }

  if (secondarySlugs.includes(primarySlug)) {
    return {
      isValid: false,
      error: 'Primary category cannot also be secondary',
    };
  }

  return { isValid: true };
};

/**
 * Get vendor category summary
 * @param {string} primarySlug - Primary category slug
 * @param {string[]} secondarySlugs - Secondary category slugs
 * @param {string} otherServices - Other services text
 * @returns {Object} Summary object for display/logging
 */
export const getCategorySummary = (primarySlug, secondarySlugs = [], otherServices = '') => {
  return {
    primary: {
      slug: primarySlug,
      label: formatCategoryLabel(primarySlug),
      icon: getCategoryIcon(primarySlug),
    },
    secondaryCount: Array.isArray(secondarySlugs) ? secondarySlugs.length : 0,
    hasOtherServices: !!(otherServices?.trim()),
    totalCategories: 1 + (Array.isArray(secondarySlugs) ? secondarySlugs.length : 0),
  };
};

export default {
  formatCategoryLabel,
  getCategoryIcon,
  getCategoryDescription,
  filterValidCategorySlugs,
  getCategoriesForDisplay,
  validatePrimaryCategory,
  validateSecondaryCategories,
  validateOtherServices,
  validateCategoryConflict,
  getCategorySummary,
};
