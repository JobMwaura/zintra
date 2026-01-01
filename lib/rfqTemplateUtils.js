/**
 * RFQ Template Loading & Lookup Utilities
 * 
 * These utilities help load the hierarchical template JSON and extract
 * category-specific or job-type-specific field definitions
 */

let cachedTemplates = null;

/**
 * Load the hierarchical RFQ templates from the public JSON file
 * Results are cached to avoid repeated file reads
 * 
 * @returns {Promise<Object>} Templates object with majorCategories array
 */
export async function loadTemplates() {
  if (cachedTemplates) {
    return cachedTemplates;
  }

  try {
    const response = await fetch('/data/rfq-templates-v2-hierarchical.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to load templates`);
    }
    const data = await response.json();
    cachedTemplates = data;
    return data;
  } catch (error) {
    console.error('Error loading RFQ templates:', error);
    return null;
  }
}

/**
 * Get a specific category by label or slug
 * 
 * @param {string} identifier - Category label or slug
 * @returns {Promise<Object|null>} Category object or null if not found
 */
export async function getCategoryByLabel(identifier) {
  const templates = await loadTemplates();
  if (!templates?.majorCategories) return null;

  return (
    templates.majorCategories.find(
      (cat) => cat.label === identifier || cat.slug === identifier
    ) || null
  );
}

/**
 * Get a specific job type within a category
 * 
 * @param {string} categoryIdentifier - Category label or slug
 * @param {string} jobTypeIdentifier - Job type label or slug
 * @returns {Promise<Object|null>} Job type object or null if not found
 */
export async function getJobTypeByLabel(categoryIdentifier, jobTypeIdentifier) {
  const category = await getCategoryByLabel(categoryIdentifier);
  if (!category?.jobTypes) return null;

  return (
    category.jobTypes.find(
      (jt) => jt.label === jobTypeIdentifier || jt.slug === jobTypeIdentifier
    ) || null
  );
}

/**
 * Get field definitions for a specific job type
 * If no job type is specified, use the first one in the category
 * 
 * @param {string} categoryIdentifier - Category label or slug
 * @param {string} jobTypeIdentifier - (Optional) Job type label or slug
 * @returns {Promise<Array|null>} Array of field definitions or null
 */
export async function getFieldsForJobType(categoryIdentifier, jobTypeIdentifier) {
  let jobType;

  if (jobTypeIdentifier) {
    jobType = await getJobTypeByLabel(categoryIdentifier, jobTypeIdentifier);
  } else {
    // Use first job type in category
    const category = await getCategoryByLabel(categoryIdentifier);
    jobType = category?.jobTypes?.[0] || null;
  }

  return jobType?.fields || null;
}

/**
 * Get all categories for dropdown/selection UI
 * 
 * @returns {Promise<Array>} Array of {label, slug, icon} objects
 */
export async function getAllCategories() {
  const templates = await loadTemplates();
  if (!templates?.majorCategories) return [];

  return templates.majorCategories.map((cat) => ({
    label: cat.label,
    slug: cat.slug,
    icon: cat.icon,
    description: cat.description,
  }));
}

/**
 * Get all job types within a category
 * 
 * @param {string} categoryIdentifier - Category label or slug
 * @returns {Promise<Array>} Array of {label, slug} objects
 */
export async function getJobTypesForCategory(categoryIdentifier) {
  const category = await getCategoryByLabel(categoryIdentifier);
  if (!category?.jobTypes) return [];

  return category.jobTypes.map((jt) => ({
    label: jt.label,
    slug: jt.slug,
    description: jt.description,
  }));
}

/**
 * Check if a category requires a job type selection
 * (i.e., does it have multiple job types?)
 * 
 * @param {string} categoryIdentifier - Category label or slug
 * @returns {Promise<boolean>} True if category has multiple job types
 */
export async function categoryRequiresJobType(categoryIdentifier) {
  const jobTypes = await getJobTypesForCategory(categoryIdentifier);
  return jobTypes.length > 1;
}
