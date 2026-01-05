/**
 * RFQ Template Loading & Lookup Utilities
 * 
 * These utilities help load the hierarchical template JSON and extract
 * category-specific or job-type-specific field definitions
 * 
 * Also includes Supabase-based utilities for dynamic category/field loading
 */

import { supabase } from './supabaseClient';

let cachedTemplates = null;

/**
 * Load the hierarchical RFQ templates from the bundled JSON file.
 * Using a static import avoids client-side fetch failures and hydration spins.
 */
export async function loadTemplates() {
  if (cachedTemplates) return cachedTemplates;

  try {
    // Static import is bundled by Next.js and works both server/client
    const data = await import('../public/data/rfq-templates-v2-hierarchical.json');
    cachedTemplates = data.default || data;
    return cachedTemplates;
  } catch (error) {
    console.error('Error loading RFQ templates (static import):', error);
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

/**
 * ============================================================
 * SUPABASE-BASED UTILITIES (for dynamic category/field loading)
 * ============================================================
 */

/**
 * Fetch all available RFQ categories from Supabase
 * @returns {Promise<Array>} Array of category objects with id, name, description, requires_job_type
 */
export async function getAllCategoriesFromDB() {
  try {
    const { data, error } = await supabase
      .from('rfq_categories')
      .select('id, name, description, requires_job_type')
      .order('name');

    if (error) {
      console.error('Error fetching categories from DB:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllCategoriesFromDB:', error);
    return [];
  }
}

/**
 * Fetch job types for a specific category from Supabase
 * @param {string} categoryId - The category ID
 * @returns {Promise<Array>} Array of job type objects
 */
export async function getJobTypesForCategoryFromDB(categoryId) {
  try {
    const { data, error } = await supabase
      .from('job_types')
      .select('id, name, description')
      .eq('category_id', categoryId)
      .order('name');

    if (error) {
      console.error('Error fetching job types from DB:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getJobTypesForCategoryFromDB:', error);
    return [];
  }
}

/**
 * Fetch template fields for a job type from Supabase
 * @param {string} categoryId - The category ID
 * @param {string} jobTypeId - Optional job type ID
 * @returns {Promise<Array>} Array of field metadata objects
 */
export async function getFieldsForJobTypeFromDB(categoryId, jobTypeId = null) {
  try {
    let query = supabase
      .from('template_fields')
      .select('id, field_name, field_type, required, label, description, options, display_order');

    if (jobTypeId) {
      query = query.eq('job_type_id', jobTypeId);
    } else {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query.order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching template fields from DB:', error);
      return [];
    }

    return (data || []).map(field => ({
      name: field.field_name,
      type: field.field_type,
      required: field.required || false,
      label: field.label || field.field_name,
      description: field.description,
      options: field.options
    }));
  } catch (error) {
    console.error('Error in getFieldsForJobTypeFromDB:', error);
    return [];
  }
}
