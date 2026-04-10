import { normalizeCategoryName } from '@/lib/constructionCategories';
import {
  CATEGORY_LABEL_TO_SLUG,
  CATEGORY_SLUG_TO_LABEL,
  getCategoryBySlug,
} from '@/lib/categories/canonicalCategories';

export const ADMIN_PENDING_RFQ_STATUSES = [
  'submitted',
  'in_review',
  'pending',
  'pending_approval',
  'needs_admin_review',
  'needs_verification',
  'needs_review',
  'needs_fix',
];

export const ADMIN_ACTIVE_RFQ_STATUSES = [
  'approved',
  'assigned',
  'open',
  'active',
];

export const CLOSED_RFQ_STATUSES = [
  'completed',
  'cancelled',
  'expired',
  'closed',
  'unsuccessful',
];

const currencyFormatter = new Intl.NumberFormat('en-KE', {
  maximumFractionDigits: 0,
});

function parseNumericValue(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value).replace(/[^0-9.-]/g, '');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrencyAmount(amount) {
  if (amount === null) {
    return null;
  }

  return `KES ${currencyFormatter.format(amount)}`;
}

export function getNormalizedRfqType(rfq) {
  return rfq?.type || rfq?.rfq_type || 'public';
}

export function normalizeCategorySlug(categoryValue) {
  if (!categoryValue || typeof categoryValue !== 'string') {
    return null;
  }

  const trimmed = categoryValue.trim();
  if (!trimmed) {
    return null;
  }

  const canonicalCategory = getCategoryBySlug(trimmed);
  if (canonicalCategory) {
    return canonicalCategory.slug;
  }

  const normalizedLabel = normalizeCategoryName(trimmed);
  return CATEGORY_LABEL_TO_SLUG[normalizedLabel] || null;
}

export function getCategoryDisplayName(categoryValue) {
  if (!categoryValue || typeof categoryValue !== 'string') {
    return null;
  }

  const slug = normalizeCategorySlug(categoryValue);
  if (slug) {
    return CATEGORY_SLUG_TO_LABEL[slug] || slug;
  }

  return normalizeCategoryName(categoryValue) || categoryValue;
}

export function getRfqCategorySlug(rfq) {
  return (
    normalizeCategorySlug(rfq?.category_slug) ||
    normalizeCategorySlug(rfq?.category) ||
    normalizeCategorySlug(rfq?.auto_category)
  );
}

export function getRfqCategoryDisplayName(rfq) {
  return (
    getCategoryDisplayName(rfq?.category_slug) ||
    getCategoryDisplayName(rfq?.category) ||
    getCategoryDisplayName(rfq?.auto_category) ||
    'Uncategorized'
  );
}

export function getVendorCategorySlugs(vendor) {
  if (!vendor) {
    return [];
  }

  const rawValues = typeof vendor === 'string'
    ? [vendor]
    : [
        vendor.primary_category_slug,
        vendor.primary_category,
        vendor.category,
        ...(Array.isArray(vendor.secondary_categories) ? vendor.secondary_categories : []),
      ];

  return Array.from(new Set(rawValues.map(normalizeCategorySlug).filter(Boolean)));
}

export function getVendorCategoryDisplayName(vendor) {
  if (!vendor) {
    return null;
  }

  const primaryValue = typeof vendor === 'string'
    ? vendor
    : vendor.primary_category_slug || vendor.primary_category || vendor.category;

  return getCategoryDisplayName(primaryValue);
}

export function rfqMatchesVendorCategory(rfq, vendorOrCategory) {
  const rfqSlug = typeof rfq === 'string' ? normalizeCategorySlug(rfq) : getRfqCategorySlug(rfq);
  const vendorSlugs = getVendorCategorySlugs(vendorOrCategory);

  if (rfqSlug && vendorSlugs.length > 0) {
    return vendorSlugs.includes(rfqSlug);
  }

  const rfqLabel = typeof rfq === 'string' ? getCategoryDisplayName(rfq) : getRfqCategoryDisplayName(rfq);
  const vendorLabel = getVendorCategoryDisplayName(vendorOrCategory);

  return Boolean(
    rfqLabel &&
    vendorLabel &&
    normalizeCategoryName(rfqLabel) === normalizeCategoryName(vendorLabel)
  );
}

export function getRfqBudgetDisplay(rfq) {
  const min = parseNumericValue(rfq?.budget_min);
  const max = parseNumericValue(rfq?.budget_max);

  if (min !== null && max !== null) {
    return `${formatCurrencyAmount(min)} - ${formatCurrencyAmount(max)}`;
  }

  if (max !== null) {
    return `Up to ${formatCurrencyAmount(max)}`;
  }

  if (min !== null) {
    return `From ${formatCurrencyAmount(min)}`;
  }

  if (rfq?.budget_estimate) {
    return String(rfq.budget_estimate);
  }

  if (rfq?.budget_range) {
    return String(rfq.budget_range);
  }

  return 'Not specified';
}

export function getRfqBudgetSortValue(rfq) {
  return (
    parseNumericValue(rfq?.budget_max) ||
    parseNumericValue(rfq?.budget_min) ||
    parseNumericValue(rfq?.budget_estimate) ||
    0
  );
}

export function normalizeRfqRecord(rfq) {
  const normalizedType = getNormalizedRfqType(rfq);
  const categorySlug = getRfqCategorySlug(rfq);
  const categoryDisplay = getRfqCategoryDisplayName(rfq);
  const budgetDisplay = getRfqBudgetDisplay(rfq);

  return {
    ...rfq,
    type: normalizedType,
    rfq_type: normalizedType,
    category_slug: categorySlug,
    category_raw: rfq?.category ?? null,
    category: categoryDisplay,
    category_display: categoryDisplay,
    budget_display: budgetDisplay,
    budget_estimate: budgetDisplay,
    budget_sort_value: getRfqBudgetSortValue(rfq),
  };
}

export function isPendingAdminRfq(rfq) {
  return ADMIN_PENDING_RFQ_STATUSES.includes(rfq?.status);
}

export function isActiveAdminRfq(rfq) {
  return ADMIN_ACTIVE_RFQ_STATUSES.includes(rfq?.status);
}

export function isClosedRfq(rfq) {
  return CLOSED_RFQ_STATUSES.includes(rfq?.status);
}