/**
 * useRfqFormPersistence Hook
 *
 * Persists RFQ form data to localStorage with auto-save capability.
 * Supports different RFQ types (direct, wizard, public) with separate draft keys.
 * Auto-expires drafts after 48 hours.
 *
 * ✅ TWEAKS APPLIED:
 * - Tweak 2: RFQ type in draft key (direct/wizard/public)
 * - Tweak 5: SSR-safe - guards all localStorage with typeof window !== 'undefined'
 *
 * Storage structure:
 * localStorage[`rfq_draft_{rfqType}_{categorySlug}_{jobTypeSlug}`] = {
 *   rfqType: 'direct|wizard|public',
 *   categorySlug,
 *   jobTypeSlug,
 *   templateFields: { fieldName: fieldValue, ... },
 *   sharedFields: { fieldName: fieldValue, ... },
 *   createdAt: timestamp,
 *   lastUpdatedAt: timestamp,
 *   expiresAt: timestamp (48 hours from creation)
 * }
 *
 * Usage:
 * const { saveFormData, loadFormData, createAutoSave } = useRfqFormPersistence();
 * saveFormData('direct', 'architectural', 'arch_new_residential', fields, shared);
 */

const DRAFT_EXPIRY_HOURS = 48;
const AUTO_SAVE_DEBOUNCE_MS = 2000;

export const useRfqFormPersistence = () => {
  // SSR Check: localStorage only exists in browser (Tweak 5)
  const isClient = typeof window !== 'undefined';

  /**
   * Generate storage key for draft
   * Format: rfq_draft_{rfqType}_{categorySlug}_{jobTypeSlug}
   */
  const getDraftKey = (rfqType, categorySlug, jobTypeSlug) => {
    if (!rfqType || !categorySlug || !jobTypeSlug) return null;
    return `rfq_draft_${rfqType}_${categorySlug}_${jobTypeSlug}`;
  };

  /**
   * Save form data to localStorage
   * @param {string} categorySlug - The category slug
   * @param {string} jobTypeSlug - The job type slug
   * @param {object} templateFields - Form fields specific to the template
  /**
   * Save form data to localStorage
   * Includes rfqType in key to support separate drafts for direct/wizard/public RFQs
   *
   * @param {string} rfqType - 'direct', 'wizard', or 'public'
   * @param {string} categorySlug - Category identifier (e.g., 'architectural')
   * @param {string} jobTypeSlug - Job type identifier (e.g., 'arch_new_residential')
   * @param {object} templateFields - Job-type-specific fields
   * @param {object} sharedFields - General project fields (location, budget, etc)
   * @returns {boolean} Success status
   */
  const saveFormData = (
    rfqType,
    categorySlug,
    jobTypeSlug,
    templateFields = {},
    sharedFields = {}
  ) => {
    // Tweak 5: SSR Guard - don't access localStorage on server
    if (!isClient) return null;

    try {
      if (!rfqType || !categorySlug || !jobTypeSlug) {
        console.warn(
          'useRfqFormPersistence: rfqType, categorySlug, and jobTypeSlug are required'
        );
        return false;
      }

      const key = getDraftKey(rfqType, categorySlug, jobTypeSlug);
      const now = new Date().toISOString();

      // Check if draft already exists to preserve createdAt
      let createdAt = now;
      try {
        const existing = localStorage.getItem(key);
        if (existing) {
          const parsed = JSON.parse(existing);
          createdAt = parsed.createdAt || now;
        }
      } catch (e) {
        // Ignore parsing errors
      }

      const draftData = {
        rfqType,
        categorySlug,
        jobTypeSlug,
        templateFields,
        sharedFields,
        createdAt,
        lastUpdatedAt: now,
        expiresAt: new Date(Date.now() + DRAFT_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
      };

      localStorage.setItem(key, JSON.stringify(draftData));
      return true;
    } catch (error) {
      console.error('Error saving RFQ form data to localStorage:', error);
      // Silently fail (e.g., quota exceeded) - don't break the form
      return false;
    }
  };

  /**
   * Load form data from localStorage
   * Checks for expiry (48 hours) and returns null if expired
   *
   * @param {string} rfqType - 'direct', 'wizard', or 'public'
   * @param {string} categorySlug - Category identifier
   * @param {string} jobTypeSlug - Job type identifier
   * @returns {object|null} Saved draft or null if not found/expired
   */
  const loadFormData = (rfqType, categorySlug, jobTypeSlug) => {
    // Tweak 5: SSR Guard - return null on server
    if (!isClient) return null;

    try {
      if (!rfqType || !categorySlug || !jobTypeSlug) {
        return null;
      }

      const key = getDraftKey(rfqType, categorySlug, jobTypeSlug);
      const stored = localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);

      // Check if draft has expired (48 hours)
      const expiresAt = new Date(parsed.expiresAt);
      if (Date.now() > expiresAt.getTime()) {
        clearFormData(rfqType, categorySlug, jobTypeSlug);
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Error loading RFQ form data from localStorage:', error);
      return null;
    }
  };

  /**
   * Delete a specific draft
   *
   * @param {string} rfqType - 'direct', 'wizard', or 'public'
   * @param {string} categorySlug - Category identifier
   * @param {string} jobTypeSlug - Job type identifier
   * @returns {boolean} Success status
   */
  const clearFormData = (rfqType, categorySlug, jobTypeSlug) => {
    // Tweak 5: SSR Guard
    if (!isClient) return false;

    try {
      if (!rfqType || !categorySlug || !jobTypeSlug) {
        return false;
      }

      const key = getDraftKey(rfqType, categorySlug, jobTypeSlug);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error clearing RFQ form data from localStorage:', error);
      return false;
    }
  };

  /**
   * Delete all drafts across all RFQ types
   *
   * @returns {boolean} Success status
   */
  const clearAllDrafts = () => {
    // Tweak 5: SSR Guard
    if (!isClient) return false;

    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith('rfq_draft_')
      );
      keys.forEach((key) => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Error clearing all RFQ drafts:', error);
      return false;
    }
  };

  /**
   * Get all saved drafts (across all RFQ types)
   *
   * @returns {array} Array of all draft objects
   */
  const getAllDrafts = () => {
    // Tweak 5: SSR Guard
    if (!isClient) return [];

    try {
      const drafts = [];
      const now = new Date();

      Object.entries(localStorage)
        .filter(([key]) => key.startsWith('rfq_draft_'))
        .forEach(([key, value]) => {
          try {
            const draft = JSON.parse(value);

            // Filter out expired drafts
            const expiresAt = new Date(draft.expiresAt);
            if (now > expiresAt) {
              localStorage.removeItem(key);
              return;
            }

            drafts.push(draft);
          } catch (e) {
            console.warn(`Failed to parse draft ${key}:`, e);
          }
        });

      return drafts;
    } catch (error) {
      console.error('Error retrieving all RFQ drafts:', error);
      return [];
    }
  };

  /**
   * Check if a draft exists and is not expired
   *
   * @param {string} rfqType - 'direct', 'wizard', or 'public'
   * @param {string} categorySlug - Category identifier
   * @param {string} jobTypeSlug - Job type identifier
   * @returns {boolean}
   */
  const hasDraft = (rfqType, categorySlug, jobTypeSlug) => {
    // Tweak 5: SSR Guard
    if (!isClient) return false;

    try {
      if (!rfqType || !categorySlug || !jobTypeSlug) {
        return false;
      }

      const draft = loadFormData(rfqType, categorySlug, jobTypeSlug);
      return draft !== null;
    } catch (error) {
      console.error('Error checking if draft exists:', error);
      return false;
    }
  };

  /**
   * Create a debounced auto-save function
   *
   * Usage:
   * const autoSave = createAutoSave(2000); // 2 second debounce
   * autoSave(rfqType, categorySlug, jobTypeSlug, templateFields, sharedFields);
   *
   * @param {number} delayMs - Debounce delay in milliseconds (default: 2000)
   * @returns {function} Debounced save function
   */
  const createAutoSave = (delayMs = AUTO_SAVE_DEBOUNCE_MS) => {
    let timeoutId = null;

    return (rfqType, categorySlug, jobTypeSlug, templateFields, sharedFields) => {
      // Clear previous timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Set new timeout
      timeoutId = setTimeout(() => {
        saveFormData(rfqType, categorySlug, jobTypeSlug, templateFields, sharedFields);
      }, delayMs);
    };
  };

  /**
   * Check if localStorage is available (for SSR safety testing)
   *
   * @returns {boolean}
   */
  const isInitialized = () => {
    return isClient;
  };

  return {
    saveFormData,
    loadFormData,
    clearFormData,
    clearAllDrafts,
    getAllDrafts,
    hasDraft,
    createAutoSave,
    isInitialized,
  };
};

export default useRfqFormPersistence;

/**
 * Usage Examples:
 * 
 * Example 1: Basic Save & Load
 * ```javascript
 * import { useRfqFormPersistence } from '@/hooks/useRfqFormPersistence';
 * 
 * function RfqForm() {
 *   const { saveFormData, loadFormData } = useRfqFormPersistence();
 *   const [formData, setFormData] = useState({});
 * 
 *   // Load saved data on mount
 *   useEffect(() => {
 *     const saved = loadFormData('architectural', 'new-house');
 *     if (saved) {
 *       setFormData({
 *         ...saved.templateFields,
 *         ...saved.sharedFields
 *       });
 *     }
 *   }, []);
 * 
 *   // Save on submit
 *   const handleSubmit = () => {
 *     saveFormData('architectural', 'new-house', templateFields, sharedFields);
 *   };
 * }
 * ```
 * 
 * Example 2: Auto-Save on Field Change (Debounced)
 * ```javascript
 * function RfqForm() {
 *   const { createAutoSave, loadFormData } = useRfqFormPersistence();
 *   const autoSave = createAutoSave(2000); // Save 2 seconds after last change
 * 
 *   const handleFieldChange = (fieldName, value) => {
 *     setFormData(prev => ({ ...prev, [fieldName]: value }));
 *     
 *     // Auto-save (debounced)
 *     autoSave('architectural', 'new-house', formData, sharedFields);
 *   };
 * }
 * ```
 * 
 * Example 3: Check for Existing Draft
 * ```javascript
 * function RfqStart() {
 *   const { hasDraft, loadFormData } = useRfqFormPersistence();
 * 
 *   const resumePreviousDraft = () => {
 *     if (hasDraft('architectural', 'new-house')) {
 *       const draft = loadFormData('architectural', 'new-house');
 *       // Prompt user to resume or start fresh
 *       showResumeDraftModal(draft);
 *     }
 *   };
 * }
 * ```
 * 
 * Example 4: Clear After Submission
 * ```javascript
 * async function handleRfqSubmit(rfqId) {
 *   const { clearFormData } = useRfqFormPersistence();
 *   
 *   const response = await fetch('/api/rfq/create', {
 *     method: 'POST',
 *     body: JSON.stringify(formData)
 *   });
 * 
 *   if (response.ok) {
 *     // Clear the draft after successful submission
 *     clearFormData('architectural', 'new-house');
 *     showSuccessMessage(`RFQ ${rfqId} submitted!`);
 *   }
 * }
 * ```
 */
