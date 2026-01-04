/**
 * ============================================================================
 * CANONICAL CATEGORY SYSTEM - SYSTEM SOURCE OF TRUTH
 * ============================================================================
 * 
 * These 20 categories are used for ALL of the following:
 * - Vendor identity & discovery
 * - Vendor signup classification
 * - RFQ template selection
 * - Dynamic "Request Quote" modals
 * - Analytics & admin insights
 * 
 * Usage:
 *   import { CANONICAL_CATEGORIES, getCategoryBySlug } from '@/lib/categories/canonicalCategories';
 *
 * Version: 1.0
 * Last Updated: January 4, 2026
 * ============================================================================
 */

/**
 * CANONICAL_CATEGORIES - Master list of all 20 categories
 * 
 * Every category MUST have:
 * - slug: Unique identifier (kebab-case, immutable)
 * - label: Display name
 * - description: Brief description for UX
 * - icon: Lucide React icon name
 * - order: Display order (1-20)
 */
export const CANONICAL_CATEGORIES = [
  {
    slug: 'architectural_design',
    label: 'Architectural & Design',
    description: 'Architectural design, 3D rendering, building plans',
    icon: 'Pencil',
    order: 1,
  },
  {
    slug: 'building_masonry',
    label: 'Building & Masonry',
    description: 'Construction, walling, concrete works',
    icon: 'Hammer',
    order: 2,
  },
  {
    slug: 'roofing_waterproofing',
    label: 'Roofing & Waterproofing',
    description: 'Roof installation, repair, waterproofing solutions',
    icon: 'Home',
    order: 3,
  },
  {
    slug: 'doors_windows_glass',
    label: 'Doors, Windows & Glass',
    description: 'Doors, windows, glass installations and supplies',
    icon: 'Square',
    order: 4,
  },
  {
    slug: 'flooring_wall_finishes',
    label: 'Flooring & Wall Finishes',
    description: 'Flooring, wall tiles, paint, decorative finishes',
    icon: 'Grid',
    order: 5,
  },
  {
    slug: 'plumbing_drainage',
    label: 'Plumbing & Drainage',
    description: 'Plumbing installation, repairs, drainage solutions',
    icon: 'Droplets',
    order: 6,
  },
  {
    slug: 'electrical_solar',
    label: 'Electrical & Solar',
    description: 'Electrical wiring, solar installations, power solutions',
    icon: 'Zap',
    order: 7,
  },
  {
    slug: 'hvac_climate',
    label: 'HVAC & Climate Control',
    description: 'Air conditioning, ventilation, climate control systems',
    icon: 'Wind',
    order: 8,
  },
  {
    slug: 'carpentry_joinery',
    label: 'Carpentry & Joinery',
    description: 'Custom woodwork, cabinetry, joinery services',
    icon: 'Hammer',
    order: 9,
  },
  {
    slug: 'kitchens_wardrobes',
    label: 'Kitchens & Wardrobes',
    description: 'Kitchen design, fitted wardrobes, storage solutions',
    icon: 'Box',
    order: 10,
  },
  {
    slug: 'painting_decorating',
    label: 'Painting & Decorating',
    description: 'Interior/exterior painting, wallpaper, decorating',
    icon: 'Palette',
    order: 11,
  },
  {
    slug: 'pools_water_features',
    label: 'Swimming Pools & Water Features',
    description: 'Pool construction, fountains, water features',
    icon: 'Waves',
    order: 12,
  },
  {
    slug: 'landscaping_outdoor',
    label: 'Landscaping & Outdoor Works',
    description: 'Garden design, landscaping, outdoor construction',
    icon: 'Leaf',
    order: 13,
  },
  {
    slug: 'fencing_gates',
    label: 'Fencing & Gates',
    description: 'Fence installation, gates, boundary works',
    icon: 'Grid3x3',
    order: 14,
  },
  {
    slug: 'security_smart',
    label: 'Security & Smart Systems',
    description: 'CCTV, alarm systems, smart home technology',
    icon: 'Shield',
    order: 15,
  },
  {
    slug: 'interior_decor',
    label: 'Interior Design & Décor',
    description: 'Interior design, styling, décor consultation',
    icon: 'Sofa',
    order: 16,
  },
  {
    slug: 'project_management_qs',
    label: 'Project Management & QS',
    description: 'Project management, quantity surveying, cost estimation',
    icon: 'CheckCircle',
    order: 17,
  },
  {
    slug: 'equipment_hire',
    label: 'Equipment Hire & Scaffolding',
    description: 'Equipment rental, scaffolding, machinery hire',
    icon: 'Truck',
    order: 18,
  },
  {
    slug: 'waste_cleaning',
    label: 'Waste Management & Site Cleaning',
    description: 'Waste removal, site cleaning, debris management',
    icon: 'Trash2',
    order: 19,
  },
  {
    slug: 'special_structures',
    label: 'Special Structures (tanks, steel, etc.)',
    description: 'Tanks, steel structures, specialized construction',
    icon: 'Factory',
    order: 20,
  },
];

/**
 * Utility: Get category by slug
 * @param {string} slug - Category slug (e.g., 'architectural_design')
 * @returns {Object|undefined} Category object or undefined if not found
 */
export const getCategoryBySlug = (slug) => {
  return CANONICAL_CATEGORIES.find((cat) => cat.slug === slug);
};

/**
 * Utility: Get category by label
 * @param {string} label - Category label (e.g., 'Architectural & Design')
 * @returns {Object|undefined} Category object or undefined if not found
 */
export const getCategoryByLabel = (label) => {
  return CANONICAL_CATEGORIES.find((cat) => cat.label === label);
};

/**
 * Utility: Check if slug is valid
 * @param {string} slug - Category slug to validate
 * @returns {boolean} True if slug exists in CANONICAL_CATEGORIES
 */
export const isValidCategorySlug = (slug) => {
  return CANONICAL_CATEGORIES.some((cat) => cat.slug === slug);
};

/**
 * Utility: Get all category slugs
 * @returns {string[]} Array of all valid slugs
 */
export const getAllCategorySlugs = () => {
  return CANONICAL_CATEGORIES.map((cat) => cat.slug);
};

/**
 * Utility: Get all categories sorted by order
 * @returns {Object[]} Categories sorted by order field
 */
export const getCategoriesSorted = () => {
  return [...CANONICAL_CATEGORIES].sort((a, b) => a.order - b.order);
};

/**
 * Lookup map: slug → label (for quick lookups)
 * @type {Object}
 */
export const CATEGORY_SLUG_TO_LABEL = Object.fromEntries(
  CANONICAL_CATEGORIES.map((cat) => [cat.slug, cat.label])
);

/**
 * Lookup map: label → slug (for quick lookups)
 * @type {Object}
 */
export const CATEGORY_LABEL_TO_SLUG = Object.fromEntries(
  CANONICAL_CATEGORIES.map((cat) => [cat.label, cat.slug])
);

/**
 * Lookup map: slug → icon (for quick lookups)
 * @type {Object}
 */
export const CATEGORY_SLUG_TO_ICON = Object.fromEntries(
  CANONICAL_CATEGORIES.map((cat) => [cat.slug, cat.icon])
);

/**
 * Export as grouped object for quick access
 * @type {Object}
 */
export const CATEGORIES_BY_SLUG = Object.fromEntries(
  CANONICAL_CATEGORIES.map((cat) => [cat.slug, cat])
);

/**
 * Default export
 */
export default CANONICAL_CATEGORIES;
