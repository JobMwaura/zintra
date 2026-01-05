import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';

/**
 * RfqContext
 * 
 * Global state management for the RFQ form across multiple steps:
 * 1. Category Selection
 * 2. Job Type Selection
 * 3. Job-Specific Fields
 * 4. Shared General Fields
 * 5. Auth Verification & Submit
 * 
 * This context ensures form data is preserved during:
 * - Page navigation (guest mode)
 * - Guest to authenticated user transition
 * - Browser refresh (with localStorage integration)
 */
const RfqContext = createContext();

export function RfqProvider({ children }) {
  // Category & Job Type Selection
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedJobType, setSelectedJobType] = useState(null);
  const [rfqType, setRfqType] = useState('direct'); // TWEAK 2: 'direct' | 'wizard' | 'public' - used for draft key separation
  const [selectedVendors, setSelectedVendors] = useState([]); // Vendor selection for wizard mode

  // Form Data
  const [templateFields, setTemplateFields] = useState({});
  const [sharedFields, setSharedFields] = useState({});

  // User & Auth State
  const [isGuestMode, setIsGuestMode] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const [userId, setUserId] = useState(null);
  const [guestPhone, setGuestPhone] = useState(null); // TWEAK 4: Phone verification for guests
  const [guestPhoneVerified, setGuestPhoneVerified] = useState(false); // TWEAK 4: OTP verification status

  // UI State
  const [currentStep, setCurrentStep] = useState('category'); // category | jobtype | template | shared | auth | submit
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  /**
   * Initialize RFQ - Restore from localStorage if available
   */
  const initializeRfq = useCallback((categorySlug, jobTypeSlug, savedData = null) => {
    setSelectedCategory(categorySlug);
    setSelectedJobType(jobTypeSlug);

    if (savedData) {
      setTemplateFields(savedData.templateFields || {});
      setSharedFields(savedData.sharedFields || {});
    }

    setCurrentStep('template');
  }, []);

  /**
   * Reset RFQ form (start fresh)
   */
  const resetRfq = useCallback(() => {
    setSelectedCategory(null);
    setSelectedJobType(null);
    setTemplateFields({});
    setSharedFields({});
    setSelectedVendors([]);
    setCurrentStep('category');
    setIsGuestMode(true);
    setUserEmail(null);
    setSubmitError(null);
  }, []);

  /**
   * Update a single template field
   */
  const updateTemplateField = useCallback((fieldName, value) => {
    setTemplateFields((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  /**
   * Update multiple template fields at once
   */
  const updateTemplateFields = useCallback((fields) => {
    setTemplateFields((prev) => ({
      ...prev,
      ...fields,
    }));
  }, []);

  /**
   * Update a single shared field
   */
  const updateSharedField = useCallback((fieldName, value) => {
    setSharedFields((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  }, []);

  /**
   * Update multiple shared fields at once
   */
  const updateSharedFields = useCallback((fields) => {
    setSharedFields((prev) => ({
      ...prev,
      ...fields,
    }));
  }, []);

  /**
   * Get all form data (template + shared)
   */
  const getAllFormData = useCallback(() => {
    return {
      rfqType, // TWEAK 2: Include RFQ type for draft key
      categorySlug: selectedCategory,
      jobTypeSlug: selectedJobType,
      templateFields,
      sharedFields,
      selectedVendors, // Wizard mode only
      isGuestMode,
      userEmail,
      userId,
    };
  }, [rfqType, selectedCategory, selectedJobType, templateFields, sharedFields, selectedVendors, isGuestMode, userEmail, userId]);

  /**
   * Set user as authenticated (after login/signup)
   */
  const setUserAuthenticated = useCallback((user) => {
    setIsGuestMode(false);
    setUserId(user.id);
    setUserEmail(user.email);
  }, []);

  /**
   * Handle guest submission (email + phone capture) - TWEAK 4: Phone verification
   */
  const submitAsGuest = useCallback((guestEmail, phoneNumber = null) => {
    setUserEmail(guestEmail);
    if (phoneNumber) {
      setGuestPhone(phoneNumber);
      setGuestPhoneVerified(true); // Phone was verified via OTP
    }
    // isGuestMode stays true
  }, []);

  /**
   * Clear form error
   */
  const clearError = useCallback(() => {
    setSubmitError(null);
  }, []);

  /**
   * Toggle vendor selection (for wizard mode)
   */
  const toggleVendor = useCallback((vendorId) => {
    setSelectedVendors((prev) => {
      if (prev.includes(vendorId)) {
        return prev.filter((id) => id !== vendorId);
      } else {
        return [...prev, vendorId];
      }
    });
  }, []);

  /**
   * Set multiple vendors at once
   */
  const setVendors = useCallback((vendorIds) => {
    setSelectedVendors(vendorIds);
  }, []);

  /**
   * Get completion status of form fields
   */
  const getFormCompleteness = useCallback(() => {
    const templateFieldCount = Object.keys(templateFields).length;
    const sharedFieldCount = Object.keys(sharedFields).length;
    const hasCategory = !!selectedCategory;
    const hasJobType = !!selectedJobType;

    return {
      category: hasCategory,
      jobType: hasJobType,
      templateFieldsFilled: templateFieldCount > 0,
      sharedFieldsFilled: sharedFieldCount > 0,
      totalProgress: Math.round(
        ((hasCategory ? 1 : 0) +
          (hasJobType ? 1 : 0) +
          (templateFieldCount > 0 ? 1 : 0) +
          (sharedFieldCount > 0 ? 1 : 0)) /
          4 *
          100
      ),
    };
  }, [selectedCategory, selectedJobType, templateFields, sharedFields]);

  const value = {
    // Selection State
    selectedCategory,
    setSelectedCategory,
    selectedJobType,
    setSelectedJobType,
    rfqType,
    setRfqType,
    selectedVendors,
    toggleVendor,
    setVendors,

    // Form Data
    templateFields,
    setTemplateFields,
    updateTemplateField,
    updateTemplateFields,
    sharedFields,
    setSharedFields,
    updateSharedField,
    updateSharedFields,

    // User State
    isGuestMode,
    setIsGuestMode,
    userEmail,
    setUserEmail,
    userId,
    setUserId,
    guestPhone,
    setGuestPhone,
    guestPhoneVerified,
    setGuestPhoneVerified,

    // UI State
    currentStep,
    setCurrentStep,
    isSubmitting,
    setIsSubmitting,
    submitError,
    setSubmitError,

    // Actions
    initializeRfq,
    resetRfq,
    getAllFormData,
    setUserAuthenticated,
    submitAsGuest,
    clearError,
    getFormCompleteness,
  };

  return (
    <RfqContext.Provider value={value}>
      {children}
    </RfqContext.Provider>
  );
}

/**
 * Hook to use the RFQ context
 */
export function useRfqContext() {
  const context = useContext(RfqContext);

  if (!context) {
    throw new Error('useRfqContext must be used within RfqProvider');
  }

  return context;
}

/**
 * Usage Examples:
 * 
 * Example 1: Wrap Your App with Provider
 * ```javascript
 * // In pages/_app.js or root component
 * import { RfqProvider } from '@/context/RfqContext';
 * 
 * function MyApp({ Component, pageProps }) {
 *   return (
 *     <RfqProvider>
 *       <Component {...pageProps} />
 *     </RfqProvider>
 *   );
 * }
 * ```
 * 
 * Example 2: Access Context in Component
 * ```javascript
 * import { useRfqContext } from '@/context/RfqContext';
 * 
 * function RfqCategoryStep() {
 *   const { selectedCategory, setSelectedCategory } = useRfqContext();
 * 
 *   return (
 *     <button onClick={() => setSelectedCategory('architectural')}>
 *       Select Architectural
 *     </button>
 *   );
 * }
 * ```
 * 
 * Example 3: Update Form Fields
 * ```javascript
 * function RfqFormFields() {
 *   const { 
 *     templateFields, 
 *     updateTemplateField,
 *     sharedFields,
 *     updateSharedField 
 *   } = useRfqContext();
 * 
 *   return (
 *     <>
 *       <input
 *         value={templateFields.property_description || ''}
 *         onChange={(e) => updateTemplateField('property_description', e.target.value)}
 *       />
 *       <input
 *         value={sharedFields.location || ''}
 *         onChange={(e) => updateSharedField('location', e.target.value)}
 *       />
 *     </>
 *   );
 * }
 * ```
 * 
 * Example 4: Handle Auth Transition
 * ```javascript
 * async function handleUserLogin(user) {
 *   const { setUserAuthenticated, currentStep } = useRfqContext();
 *   
 *   // Set user as authenticated
 *   setUserAuthenticated(user);
 *   
 *   // If on auth step, proceed to submit
 *   if (currentStep === 'auth') {
 *     // Form data is preserved, user is now authenticated
 *     submitRfqForm();
 *   }
 * }
 * ```
 * 
 * Example 5: Get Form Progress
 * ```javascript
 * function RfqProgressBar() {
 *   const { getFormCompleteness } = useRfqContext();
 *   const completeness = getFormCompleteness();
 * 
 *   return (
 *     <div className="progress-bar">
 *       <div style={{ width: `${completeness.totalProgress}%` }} />
 *       <p>{completeness.totalProgress}% Complete</p>
 *     </div>
 *   );
 * }
 * ```
 * 
 * Example 6: Restore from localStorage
 * ```javascript
 * function RfqForm() {
 *   const { initializeRfq } = useRfqContext();
 *   const { loadFormData } = useRfqFormPersistence();
 * 
 *   useEffect(() => {
 *     const saved = loadFormData('architectural', 'new-house');
 *     if (saved) {
 *       initializeRfq('architectural', 'new-house', saved);
 *     }
 *   }, []);
 * }
 * ```
 */

export default RfqContext;
