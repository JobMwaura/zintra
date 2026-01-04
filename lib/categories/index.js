/**
 * ============================================================================
 * CATEGORIES MODULE - BARREL EXPORT
 * ============================================================================
 * 
 * Central import point for all category-related utilities
 * 
 * Usage:
 *   import { CANONICAL_CATEGORIES, getCategoryBySlug } from '@/lib/categories';
 *
 * ============================================================================
 */

export {
  CANONICAL_CATEGORIES,
  getCategoryBySlug,
  getCategoryByLabel,
  isValidCategorySlug,
  getAllCategorySlugs,
  getCategoriesSorted,
  CATEGORY_SLUG_TO_LABEL,
  CATEGORY_LABEL_TO_SLUG,
  CATEGORY_SLUG_TO_ICON,
  CATEGORIES_BY_SLUG,
} from './canonicalCategories';

export {
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
} from './categoryUtils';

export {
  updatePrimaryCategorySchema,
  addSecondaryCategorySchema,
  removeSecondaryCategorySchema,
  updateOtherServicesSchema,
  vendorCategorySetupSchema,
  rfqResponseCategorySchema,
  adminCategoryManagementSchema,
  templateFieldSchema,
  rfqTemplateSchema,
} from './categoryValidation';
