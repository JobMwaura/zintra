/**
 * Category Suggester
 * 
 * Auto-suggest categories based on RFQ title and description keywords
 * Used in Step 3 (Project Details) of RFQ modal
 * 
 * Phase 3 Feature 4: Smart category recommendations
 */

import { CANONICAL_CATEGORIES } from '@/lib/categories';

/**
 * Build keyword map for all categories
 * Maps keywords to category slugs for faster lookup
 */
export function buildCategoryKeywordMap() {
  const map = {};

  CANONICAL_CATEGORIES.forEach(category => {
    // Add category name
    const nameWords = category.label.toLowerCase().split(/\s+/);
    nameWords.forEach(word => {
      if (!map[word]) map[word] = [];
      map[word].push(category.slug);
    });

    // Add keywords if available
    if (category.keywords && Array.isArray(category.keywords)) {
      category.keywords.forEach(keyword => {
        const words = keyword.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (!map[word]) map[word] = [];
          if (!map[word].includes(category.slug)) {
            map[word].push(category.slug);
          }
        });
      });
    }
  });

  return map;
}

/**
 * Extract words from text
 * Removes stop words and normalizes
 */
function extractWords(text) {
  if (!text) return [];

  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'need', 'want', 'require', 'project', 'work', 'service', 'help', 'please'
  ]);

  return text
    .toLowerCase()
    .split(/\s+|,|\./)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Score a category based on keyword matches
 */
function scoreCategoryMatch(category, words, keywordMap) {
  let score = 0;

  // Check category name
  const categoryNameWords = category.label.toLowerCase().split(/\s+/);
  const nameMatches = words.filter(word => 
    categoryNameWords.some(catWord => catWord.includes(word) || word.includes(catWord))
  );
  score += nameMatches.length * 5;

  // Check keywords
  if (category.keywords && Array.isArray(category.keywords)) {
    const keywordMatches = words.filter(word =>
      category.keywords.some(kw => 
        kw.toLowerCase().includes(word) || word.includes(kw.toLowerCase())
      )
    );
    score += keywordMatches.length * 3;
  }

  return score;
}

/**
 * Suggest categories based on title and description
 * 
 * @param {string} title - RFQ title (high weight)
 * @param {string} description - RFQ description/summary (medium weight)
 * @param {Object} options - { maxSuggestions: 5, minScore: 1 }
 * @returns {Array} - Array of suggested categories with scores
 */
export function suggestCategories(title, description, options = {}) {
  const {
    maxSuggestions = 5,
    minScore = 1
  } = options;

  if (!title && !description) return [];

  const keywordMap = buildCategoryKeywordMap();

  // Extract and weight words
  const titleWords = extractWords(title);
  const descriptionWords = extractWords(description);

  // Score each category
  const scores = CANONICAL_CATEGORIES.map(category => ({
    slug: category.slug,
    name: category.label,
    score: (
      scoreCategoryMatch(category, titleWords, keywordMap) * 2 + // Title weight
      scoreCategoryMatch(category, descriptionWords, keywordMap)   // Description weight
    )
  }));

  // Filter, sort, and limit
  return scores
    .filter(item => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);
}

/**
 * Suggest a single top category
 * (For auto-fill scenarios)
 * 
 * @param {string} title - RFQ title
 * @param {string} description - RFQ description
 * @returns {Object|null} - Top category or null
 */
export function suggestTopCategory(title, description) {
  const suggestions = suggestCategories(title, description, { maxSuggestions: 1 });
  return suggestions.length > 0 ? suggestions[0] : null;
}

/**
 * Get category by name or slug
 * (For matching suggestions to actual categories)
 */
export function getCategoryBySlug(slug) {
  return CANONICAL_CATEGORIES.find(cat => cat.slug === slug);
}

/**
 * Example usage in component:
 * 
 * const [suggestions, setSuggestions] = useState([]);
 * 
 * const handleTitleChange = (title) => {
 *   const suggested = suggestCategories(title, description);
 *   setSuggestions(suggested);
 * };
 * 
 * Then show as a dropdown:
 * {suggestions.map(cat => (
 *   <div key={cat.slug} onClick={() => selectCategory(cat.slug)}>
 *     {cat.name} (match: {cat.score})
 *   </div>
 * ))}
 */

/**
 * Example keywords for common categories (if not already in CANONICAL_CATEGORIES)
 * 
 * {
 *   slug: 'electrical',
 *   name: 'Electrical',
 *   keywords: [
 *     'wiring', 'circuit', 'power', 'breaker', 'cable',
 *     'light', 'outlet', 'switch', 'voltage', 'amp'
 *   ]
 * },
 * {
 *   slug: 'plumbing',
 *   name: 'Plumbing',
 *   keywords: [
 *     'pipe', 'water', 'drain', 'sewer', 'tap', 'toilet',
 *     'faucet', 'leak', 'fixture', 'install'
 *   ]
 * }
 */
