/**
 * Vendor Category Validation
 * 
 * Validates that vendor categories are from the approved list of 22 categories.
 * As the system evolves, new categories can be added to VALID_VENDOR_CATEGORIES.
 */

import { VENDOR_CATEGORIES } from '@/lib/constructionCategories';

/**
 * Get all valid vendor category slugs
 * @returns {string[]} Array of valid category slugs
 */
export function getValidCategorySlugs() {
  return VENDOR_CATEGORIES.map(cat => cat.value);
}

/**
 * Check if a category slug is valid
 * @param {string} slug - Category slug to validate
 * @returns {boolean} True if slug is in VENDOR_CATEGORIES
 */
export function isValidCategorySlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  return getValidCategorySlugs().includes(slug);
}

/**
 * Validate primary category
 * @param {string} primarySlug - Primary category slug
 * @throws {Error} If slug is invalid
 * @returns {boolean} True if valid
 */
export function validatePrimaryCategory(primarySlug) {
  if (!primarySlug) {
    throw new Error('Primary category is required');
  }
  
  if (!isValidCategorySlug(primarySlug)) {
    throw new Error(
      `Invalid primary category: "${primarySlug}". ` +
      `Must be one of: ${getValidCategorySlugs().join(', ')}`
    );
  }
  
  return true;
}

/**
 * Validate secondary categories
 * @param {string[]} secondaryCategories - Array of category slugs
 * @throws {Error} If any slug is invalid
 * @returns {boolean} True if all valid
 */
export function validateSecondaryCategories(secondaryCategories) {
  if (!Array.isArray(secondaryCategories)) {
    throw new Error('Secondary categories must be an array');
  }
  
  const validSlugs = getValidCategorySlugs();
  const invalidCategories = [];
  
  secondaryCategories.forEach(slug => {
    if (!validSlugs.includes(slug)) {
      invalidCategories.push(slug);
    }
  });
  
  if (invalidCategories.length > 0) {
    throw new Error(
      `Invalid secondary categories: "${invalidCategories.join('", "')}". ` +
      `Must be from: ${validSlugs.join(', ')}`
    );
  }
  
  return true;
}

/**
 * Validate all vendor categories
 * @param {string} primarySlug - Primary category slug
 * @param {string[]} secondaryCategories - Secondary categories array
 * @throws {Error} If any category is invalid
 * @returns {boolean} True if all valid
 */
export function validateVendorCategories(primarySlug, secondaryCategories = []) {
  validatePrimaryCategory(primarySlug);
  
  if (secondaryCategories && secondaryCategories.length > 0) {
    validateSecondaryCategories(secondaryCategories);
  }
  
  return true;
}

/**
 * Get category label from slug
 * @param {string} slug - Category slug
 * @returns {string|null} Category label or null if not found
 */
export function getCategoryLabel(slug) {
  const category = VENDOR_CATEGORIES.find(cat => cat.value === slug);
  return category ? category.label : null;
}

/**
 * Get all valid categories (for UI display)
 * @returns {Array} Array of category objects with value and label
 */
export function getAllValidCategories() {
  return [...VENDOR_CATEGORIES];
}

/**
 * Filter vendor data to only include valid categories
 * Useful for sanitizing vendor data from database
 * @param {Object} vendorData - Vendor object with categories
 * @returns {Object} Vendor data with only valid categories
 */
export function sanitizeVendorCategories(vendorData) {
  if (!vendorData) return vendorData;
  
  const validSlugs = getValidCategorySlugs();
  
  return {
    ...vendorData,
    primaryCategorySlug: (
      vendorData.primaryCategorySlug && 
      validSlugs.includes(vendorData.primaryCategorySlug)
    ) ? vendorData.primaryCategorySlug : null,
    secondaryCategories: (
      Array.isArray(vendorData.secondaryCategories) 
        ? vendorData.secondaryCategories.filter(slug => validSlugs.includes(slug))
        : []
    )
  };
}

/**
 * Current valid categories list
 * Last updated: January 5, 2026
 * Total: 22 categories
 * 
 * Categories:
 * 1. general_contractor
 * 2. architect
 * 3. engineer (Structural Engineer)
 * 4. quantity_surveyor
 * 5. interior_designer
 * 6. electrician
 * 7. plumber
 * 8. carpenter
 * 9. mason (Mason/Bricklayer)
 * 10. painter (Painter & Decorator)
 * 11. tiler
 * 12. roofer
 * 13. welder (Welder/Metal Fabricator)
 * 14. landscaper
 * 15. solar_installer
 * 16. hvac_technician
 * 17. waterproofing (Waterproofing Specialist)
 * 18. security_installer
 * 19. materials_supplier
 * 20. equipment_rental
 * 21. hardware_store
 * 22. other
 * 
 * To add new categories:
 * 1. Add to VENDOR_CATEGORIES in lib/constructionCategories.js
 * 2. This validation will automatically recognize it
 * 3. Update comments above with new count and category name
 */
