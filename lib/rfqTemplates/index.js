/**
 * ============================================================================
 * RFQ TEMPLATE LOADER SERVICE
 * ============================================================================
 * 
 * Service for loading, validating, and managing RFQ templates
 * 
 * Usage:
 *   import { getRFQTemplate, getAllTemplates } from '@/lib/rfqTemplates';
 *   const template = await getRFQTemplate('architectural_design');
 *
 * ============================================================================
 */

import { getAllCategorySlugs } from '@/lib/categories/canonicalCategories';
import { rfqTemplateSchema } from '@/lib/categories/categoryValidation';

/**
 * In-memory cache for templates
 * @type {Map<string, Object>}
 */
const templateCache = new Map();

/**
 * Load a single RFQ template by category slug
 * @param {string} slug - Category slug (e.g., 'architectural_design')
 * @returns {Promise<Object>} RFQ template object
 * @throws {Error} If template not found or invalid
 */
export async function getRFQTemplate(slug) {
  // Check cache first
  if (templateCache.has(slug)) {
    return templateCache.get(slug);
  }

  try {
    // Dynamic import of template JSON
    const template = await import(`./categories/${slug}.json`, { with: { type: 'json' } });
    const templateData = template.default;

    // Validate template schema
    const validatedTemplate = rfqTemplateSchema.parse(templateData);

    // Cache the result
    templateCache.set(slug, validatedTemplate);

    return validatedTemplate;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes('cannot find module')) {
      throw new Error(`RFQ template not found for category: ${slug}`);
    }
    throw new Error(`Invalid RFQ template for category ${slug}: ${error.message}`);
  }
}

/**
 * Load all RFQ templates
 * @returns {Promise<Object>} Object with slug keys and template values
 */
export async function getAllTemplates() {
  const templates = {};
  const categorySlugs = getAllCategorySlugs();

  for (const slug of categorySlugs) {
    try {
      templates[slug] = await getRFQTemplate(slug);
    } catch (error) {
      console.warn(`Warning: Could not load template for ${slug}:`, error.message);
      // Continue loading other templates
    }
  }

  return templates;
}

/**
 * Get template metadata (lightweight version without all fields)
 * @param {string} slug - Category slug
 * @returns {Promise<Object>} Template metadata
 */
export async function getTemplateMetadata(slug) {
  const template = await getRFQTemplate(slug);

  return {
    slug: template.categorySlug,
    label: template.categoryLabel,
    version: template.templateVersion,
    stepCount: Object.keys(template.steps).length,
    description: template.description,
  };
}

/**
 * Get all template metadata
 * @returns {Promise<Array>} Array of template metadata objects
 */
export async function getAllTemplateMetadata() {
  const templates = await getAllTemplates();

  return Object.values(templates).map((template) => ({
    slug: template.categorySlug,
    label: template.categoryLabel,
    version: template.templateVersion,
    stepCount: Object.keys(template.steps).length,
    description: template.description,
  }));
}

/**
 * Clear template cache (for development/testing)
 */
export function clearTemplateCache() {
  templateCache.clear();
}

/**
 * Validate if a template exists
 * @param {string} slug - Category slug
 * @returns {Promise<boolean>} True if template exists and is valid
 */
export async function templateExists(slug) {
  try {
    await getRFQTemplate(slug);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get template step by number
 * @param {string} slug - Category slug
 * @param {number} stepNumber - Step number (1-6)
 * @returns {Promise<Object>} Step configuration
 */
export async function getTemplateStep(slug, stepNumber) {
  const template = await getRFQTemplate(slug);
  const stepsArray = Object.entries(template.steps);

  const step = stepsArray.find(([, stepData]) => stepData.stepNumber === stepNumber);

  if (!step) {
    throw new Error(`Step ${stepNumber} not found in template for ${slug}`);
  }

  return {
    key: step[0],
    data: step[1],
  };
}

/**
 * Get all steps from a template
 * @param {string} slug - Category slug
 * @returns {Promise<Array>} Array of step objects
 */
export async function getTemplateSteps(slug) {
  const template = await getRFQTemplate(slug);

  return Object.entries(template.steps)
    .map(([key, stepData]) => ({
      key,
      ...stepData,
    }))
    .sort((a, b) => a.stepNumber - b.stepNumber);
}

/**
 * Get template fields for a specific step
 * @param {string} slug - Category slug
 * @param {number} stepNumber - Step number (1-6)
 * @returns {Promise<Array>} Array of field configurations
 */
export async function getTemplateStepFields(slug, stepNumber) {
  const step = await getTemplateStep(slug, stepNumber);
  return step.data.fields || [];
}

/**
 * Validate form data against template
 * @param {string} slug - Category slug
 * @param {Object} formData - Form data to validate
 * @returns {Promise<Object>} Validation result { valid: boolean, errors?: Array }
 */
export async function validateFormDataAgainstTemplate(slug, formData) {
  try {
    const template = await getRFQTemplate(slug);
    const errors = [];

    // Check all required fields across all steps
    for (const step of Object.values(template.steps)) {
      for (const field of step.fields || []) {
        if (field.required && (!formData[field.id] || formData[field.id] === '')) {
          errors.push({
            field: field.id,
            message: `${field.label} is required`,
            step: step.stepNumber,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      ...(errors.length > 0 && { errors }),
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{ message: `Template validation error: ${error.message}` }],
    };
  }
}

export default {
  getRFQTemplate,
  getAllTemplates,
  getTemplateMetadata,
  getAllTemplateMetadata,
  clearTemplateCache,
  templateExists,
  getTemplateStep,
  getTemplateSteps,
  getTemplateStepFields,
  validateFormDataAgainstTemplate,
};
