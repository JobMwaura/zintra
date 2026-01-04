/**
 * Category Matching Logic
 * 
 * Utilities for matching vendors to RFQs based on:
 * - Category (primary and secondary)
 * - Location (county, town)
 * - Rating/reputation
 * 
 * Phase 3 Feature 1: Category-based vendor filtering
 */

/**
 * Check if vendor matches RFQ category
 * 
 * @param {Object} vendor - Vendor profile with primaryCategorySlug and secondaryCategories
 * @param {string} rfqCategorySlug - The RFQ's primary category slug
 * @returns {boolean} - True if vendor specializes in the RFQ's category
 */
export function vendorMatchesCategory(vendor, rfqCategorySlug) {
  if (!vendor || !rfqCategorySlug) return false;
  
  // Check primary category
  if (vendor.primaryCategorySlug === rfqCategorySlug) return true;
  
  // Check secondary categories
  if (vendor.secondaryCategories && Array.isArray(vendor.secondaryCategories)) {
    return vendor.secondaryCategories.some(cat => 
      typeof cat === 'string' ? cat === rfqCategorySlug : cat.slug === rfqCategorySlug
    );
  }
  
  return false;
}

/**
 * Check if vendor matches RFQ location
 * 
 * @param {Object} vendor - Vendor with county and town fields
 * @param {string} rfqCounty - RFQ county
 * @param {string} rfqTown - RFQ town
 * @returns {boolean} - True if vendor operates in the RFQ's location
 */
export function vendorMatchesLocation(vendor, rfqCounty, rfqTown) {
  if (!vendor) return false;
  
  // Flexible matching - vendor in same county is good
  // Exact town match is better
  const countyMatch = vendor.county && vendor.county.toLowerCase() === (rfqCounty || '').toLowerCase();
  const townMatch = vendor.town && vendor.town.toLowerCase() === (rfqTown || '').toLowerCase();
  
  return countyMatch || townMatch;
}

/**
 * Calculate match score between vendor and RFQ
 * Considers: category match (most important), location, rating
 * 
 * @param {Object} vendor - Vendor profile
 * @param {Object} rfq - RFQ details { categorySlug, county, town, budget }
 * @returns {number} - Score from 0-100 (higher is better match)
 */
export function calculateMatchScore(vendor, rfq) {
  if (!vendor || !rfq) return 0;
  
  let score = 0;
  let maxScore = 100;
  
  // Category match (50 points - most important)
  if (vendorMatchesCategory(vendor, rfq.categorySlug)) {
    score += 50;
  } else {
    return 0; // No category match = not eligible
  }
  
  // Location match (30 points)
  if (vendorMatchesLocation(vendor, rfq.county, rfq.town)) {
    score += 30;
  }
  
  // Rating match (20 points)
  // Vendors with 4+ stars get bonus
  if (vendor.rating && vendor.rating >= 4) {
    score += 20;
  } else if (vendor.rating && vendor.rating >= 3) {
    score += 10;
  }
  
  return Math.min(score, maxScore);
}

/**
 * Filter vendors by category match
 * 
 * @param {Array} vendors - List of vendor profiles
 * @param {string} categorySlug - RFQ category
 * @returns {Array} - Vendors that match the category
 */
export function filterVendorsByCategory(vendors, categorySlug) {
  if (!Array.isArray(vendors) || !categorySlug) return [];
  
  return vendors.filter(vendor => vendorMatchesCategory(vendor, categorySlug));
}

/**
 * Filter vendors by location
 * 
 * @param {Array} vendors - List of vendor profiles
 * @param {string} county - County name
 * @param {string} town - Town name
 * @returns {Array} - Vendors in the location
 */
export function filterVendorsByLocation(vendors, county, town) {
  if (!Array.isArray(vendors)) return [];
  
  return vendors.filter(vendor => vendorMatchesLocation(vendor, county, town));
}

/**
 * Match vendors to RFQ using multiple criteria
 * 
 * Used by Wizard RFQ to auto-suggest vendors
 * 
 * @param {Array} vendors - All vendors
 * @param {Object} rfq - RFQ details { categorySlug, county, town, budget, rating }
 * @param {Object} options - { minScore: 50, maxResults: 10, sortBy: 'score' }
 * @returns {Array} - Matched vendors with scores, sorted by relevance
 */
export function matchVendorsToRFQ(vendors, rfq, options = {}) {
  if (!Array.isArray(vendors) || !rfq) return [];
  
  const {
    minScore = 50,
    maxResults = 10,
    sortBy = 'score'
  } = options;
  
  // Calculate scores for all vendors
  const scored = vendors
    .map(vendor => ({
      ...vendor,
      matchScore: calculateMatchScore(vendor, rfq)
    }))
    .filter(vendor => vendor.matchScore >= minScore);
  
  // Sort by selected criteria
  let sorted = [...scored];
  if (sortBy === 'score') {
    sorted.sort((a, b) => b.matchScore - a.matchScore);
  } else if (sortBy === 'rating') {
    sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sortBy === 'name') {
    sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }
  
  return sorted.slice(0, maxResults);
}

/**
 * Get match reason for UI display
 * 
 * @param {Object} vendor - Vendor profile
 * @param {Object} rfq - RFQ details
 * @returns {string} - Human-readable reason why vendor matches
 */
export function getMatchReason(vendor, rfq) {
  const reasons = [];
  
  if (vendorMatchesCategory(vendor, rfq.categorySlug)) {
    reasons.push(`Specializes in ${rfq.categoryName || rfq.categorySlug}`);
  }
  
  if (vendorMatchesLocation(vendor, rfq.county, rfq.town)) {
    reasons.push(`Operates in ${rfq.town || rfq.county}`);
  }
  
  if (vendor.rating && vendor.rating >= 4) {
    reasons.push(`${vendor.rating.toFixed(1)}★ rated (${vendor.reviewCount || 0} reviews)`);
  }
  
  return reasons.join(' • ');
}

/**
 * Get match confidence level
 * 
 * @param {number} score - Match score (0-100)
 * @returns {Object} - { level: 'high'|'medium'|'low', color: 'green'|'yellow'|'red' }
 */
export function getMatchConfidence(score) {
  if (score >= 80) return { level: 'high', color: 'green' };
  if (score >= 60) return { level: 'medium', color: 'yellow' };
  return { level: 'low', color: 'red' };
}
