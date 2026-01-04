/**
 * ============================================================================
 * CATEGORY VALIDATION SCHEMAS - ZOD SCHEMAS FOR CATEGORY OPERATIONS
 * ============================================================================
 * 
 * Zod schemas for validating category-related requests and data
 * 
 * Usage:
 *   import { vendorCategoryUpdateSchema } from '@/lib/categories/categoryValidation';
 *   const result = vendorCategoryUpdateSchema.parse(req.body);
 *
 * ============================================================================
 */

import { z } from 'zod';
import { getAllCategorySlugs } from './canonicalCategories';

/**
 * Valid category slug enum (derived from canonical categories)
 */
const VALID_CATEGORY_SLUGS = getAllCategorySlugs();

/**
 * Schema: Update vendor primary category
 * Used for: POST /api/vendor-profile/update-primary-category
 */
export const updatePrimaryCategorySchema = z.object({
  slug: z.string()
    .min(1, 'Category slug is required')
    .refine(
      (slug) => VALID_CATEGORY_SLUGS.includes(slug),
      'Invalid category slug'
    ),
});

/**
 * Schema: Add secondary category
 * Used for: POST /api/vendor-profile/add-secondary-category
 */
export const addSecondaryCategorySchema = z.object({
  slug: z.string()
    .min(1, 'Category slug is required')
    .refine(
      (slug) => VALID_CATEGORY_SLUGS.includes(slug),
      'Invalid category slug'
    ),
});

/**
 * Schema: Remove secondary category
 * Used for: POST /api/vendor-profile/remove-secondary-category
 */
export const removeSecondaryCategorySchema = z.object({
  slug: z.string()
    .min(1, 'Category slug is required')
    .refine(
      (slug) => VALID_CATEGORY_SLUGS.includes(slug),
      'Invalid category slug'
    ),
});

/**
 * Schema: Update other services
 * Used for: POST /api/vendor-profile/update-other-services
 */
export const updateOtherServicesSchema = z.object({
  text: z.string()
    .max(2000, 'Other services text too long (max 2000 characters)')
    .optional()
    .nullable()
    .default(''),
});

/**
 * Schema: Complete vendor category setup (signup/registration)
 * Used for: POST /api/vendor-profile/setup-categories
 */
export const vendorCategorySetupSchema = z.object({
  primaryCategory: z.string()
    .min(1, 'Primary category is required')
    .refine(
      (slug) => VALID_CATEGORY_SLUGS.includes(slug),
      'Invalid primary category'
    ),
  secondaryCategories: z.array(z.string()).optional().default([]),
  otherServices: z.string()
    .max(2000, 'Other services text too long')
    .optional()
    .default(''),
}).refine(
  (data) => {
    // Primary category cannot be in secondary categories
    return !data.secondaryCategories?.includes(data.primaryCategory);
  },
  {
    message: 'Primary category cannot also be a secondary category',
    path: ['secondaryCategories'],
  }
).refine(
  (data) => {
    // All secondary categories must be valid
    return !data.secondaryCategories?.some(
      (slug) => !VALID_CATEGORY_SLUGS.includes(slug)
    );
  },
  {
    message: 'One or more secondary categories are invalid',
    path: ['secondaryCategories'],
  }
);

/**
 * Schema: RFQ request with category validation
 * Used for: POST /api/rfq/[rfq_id]/response
 */
export const rfqResponseCategorySchema = z.object({
  categorySlug: z.string()
    .min(1, 'Category slug is required')
    .refine(
      (slug) => VALID_CATEGORY_SLUGS.includes(slug),
      'RFQ category must be a valid category'
    ),
  templateVersion: z.number().int().positive().optional(),
  // Additional RFQ fields defined by dynamic template
});

/**
 * Schema: Admin category management
 * Used for: POST/PUT /api/admin/categories
 */
export const adminCategoryManagementSchema = z.object({
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, and underscores'),
  label: z.string()
    .min(3, 'Label must be at least 3 characters')
    .max(100, 'Label must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  icon: z.string()
    .regex(/^[A-Z][a-zA-Z0-9]*$/, 'Icon must be a valid Lucide icon name')
    .optional(),
  order: z.number().int().min(1).max(100).optional(),
});

/**
 * Schema: Template field validation
 * Used internally for validating RFQ template fields
 */
export const templateFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum([
    'text',
    'number',
    'select',
    'radio',
    'checkbox',
    'textarea',
    'email',
    'tel',
    'date',
    'file-upload',
    'location',
  ]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

/**
 * Schema: Complete RFQ template validation
 * Used for: Template JSON file validation + template API responses
 */
export const rfqTemplateSchema = z.object({
  categorySlug: z.string()
    .refine(
      (slug) => VALID_CATEGORY_SLUGS.includes(slug),
      'Template category must be a valid category'
    ),
  categoryLabel: z.string(),
  templateVersion: z.number().int().positive().default(1),
  steps: z.object({
    overview: z.object({
      stepNumber: z.number().default(1),
      title: z.string(),
      description: z.string(),
      fields: z.array(templateFieldSchema),
    }).optional(),
    details: z.object({
      stepNumber: z.number().default(2),
      title: z.string(),
      description: z.string(),
      fields: z.array(templateFieldSchema),
    }).optional(),
    materials: z.object({
      stepNumber: z.number().default(3),
      title: z.string(),
      description: z.string(),
      fields: z.array(templateFieldSchema),
    }).optional(),
    location: z.object({
      stepNumber: z.number().default(4),
      title: z.string(),
      description: z.string(),
      fields: z.array(templateFieldSchema),
    }).optional(),
    budget: z.object({
      stepNumber: z.number().default(5),
      title: z.string(),
      description: z.string(),
      fields: z.array(templateFieldSchema),
    }).optional(),
    review: z.object({
      stepNumber: z.number().default(6),
      title: z.string(),
      description: z.string(),
      fields: z.array(templateFieldSchema),
    }).optional(),
  }),
  sharedSteps: z.object({
    location: z.boolean().default(true),
    budget: z.boolean().default(true),
    review: z.boolean().default(true),
  }).optional(),
});

export default {
  updatePrimaryCategorySchema,
  addSecondaryCategorySchema,
  removeSecondaryCategorySchema,
  updateOtherServicesSchema,
  vendorCategorySetupSchema,
  rfqResponseCategorySchema,
  adminCategoryManagementSchema,
  templateFieldSchema,
  rfqTemplateSchema,
};
