/**
 * useRFQSubmit Hook
 * Handles the complete RFQ submission flow including auth, verification, eligibility, and payment
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRFQFormValidation } from './useRFQFormValidation';

export function useRFQSubmit() {
  const router = useRouter();
  const { validateRFQForm } = useRFQFormValidation();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(null); // 'validating', 'checking-auth', 'checking-verification', 'checking-eligibility', 'submitting'
  const [createdRfqId, setCreatedRfqId] = useState(null);

  /**
   * Submit RFQ with complete flow
   * @param {Object} formData - RFQ form data
   * @param {string} rfqType - RFQ type (direct, wizard, public, vendor-request)
   * @param {Array} categoryFields - Category-specific fields
   * @param {Function} onVerificationNeeded - Callback when verification is needed
   * @param {Function} onPaymentNeeded - Callback when payment is needed
   * @param {Function} onSuccess - Callback on successful submission
   * @returns {Promise<Object>} - { success: boolean, rfqId?: string, error?: string }
   */
  async function handleSubmit(
    formData,
    rfqType,
    categoryFields = [],
    onVerificationNeeded = null,
    onPaymentNeeded = null,
    onSuccess = null
  ) {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      // ========================================================================
      // STEP 1: FORM VALIDATION
      // ========================================================================
      setCurrentStep('validating');
      console.log('[RFQ SUBMIT] Step 1: Validating form...');

      const validationResult = validateRFQForm(formData, rfqType, categoryFields);
      if (!validationResult.isValid) {
        const errorMessage = `Form validation failed: ${validationResult.errors.join(', ')}`;
        setError(errorMessage);
        console.error('[RFQ SUBMIT] Form validation failed:', validationResult.errors);
        setIsLoading(false);
        return {
          success: false,
          error: errorMessage,
          step: 'validation',
          details: validationResult.errors
        };
      }

      console.log('[RFQ SUBMIT] Step 1 ✓: Form is valid');

      // ========================================================================
      // STEP 2: CHECK AUTHENTICATION
      // ========================================================================
      setCurrentStep('checking-auth');
      console.log('[RFQ SUBMIT] Step 2: Checking authentication...');

      let userId = null;
      let authError = null;

      try {
        // Try to get current user from Supabase
        const { data: { user }, error } = await (
          typeof window !== 'undefined' && window.supabaseClient
            ? window.supabaseClient.auth.getUser()
            : { data: { user: null }, error: { message: 'Supabase not available' } }
        );

        if (error || !user) {
          authError = 'Not authenticated. Please log in first.';
          userId = null;
        } else {
          userId = user.id;
          console.log('[RFQ SUBMIT] Step 2 ✓: User authenticated:', userId);
        }
      } catch (err) {
        authError = 'Failed to check authentication';
        console.error('[RFQ SUBMIT] Auth check error:', err);
      }

      if (!userId || authError) {
        const message = authError || 'User not authenticated';
        setError(message);
        setIsLoading(false);
        return {
          success: false,
          error: message,
          step: 'authentication'
        };
      }

      // ========================================================================
      // STEP 3: CHECK VERIFICATION STATUS (if not from verification modal)
      // ========================================================================
      setCurrentStep('checking-verification');
      console.log('[RFQ SUBMIT] Step 3: Checking verification status...');

      // This is handled by the parent component (RFQModal)
      // If user is not verified, show verification modal
      // For now, we assume verification was already checked by parent
      // The create endpoint will also verify this before creating

      console.log('[RFQ SUBMIT] Step 3 ✓: Verification check deferred to create endpoint');

      // ========================================================================
      // STEP 4: CHECK ELIGIBILITY & PAYMENT REQUIREMENT
      // ========================================================================
      setCurrentStep('checking-eligibility');
      console.log('[RFQ SUBMIT] Step 4: Checking eligibility and payment requirement...');

      let eligibilityData = null;

      try {
        const response = await fetch('/api/rfq/check-eligibility', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId
          })
        });

        if (!response.ok) {
          throw new Error(`Eligibility check failed: ${response.status}`);
        }

        eligibilityData = await response.json();
        console.log('[RFQ SUBMIT] Step 4 ✓: Eligibility check complete:', eligibilityData);

        // Check if user is eligible (verified)
        if (!eligibilityData.eligible) {
          const message = 'Your account is not verified. Please verify your email and phone number.';
          setError(message);
          setIsLoading(false);

          // Trigger verification modal callback
          if (onVerificationNeeded) {
            onVerificationNeeded();
          }

          return {
            success: false,
            error: message,
            step: 'verification'
          };
        }

        // Check if payment is required
        if (eligibilityData.requires_payment && eligibilityData.amount > 0) {
          console.log('[RFQ SUBMIT] Step 4: Payment required:', eligibilityData.amount);

          // Trigger payment modal callback
          if (onPaymentNeeded) {
            onPaymentNeeded(eligibilityData.amount, formData, rfqType, categoryFields);
          }

          setIsLoading(false);

          return {
            success: false,
            error: 'Payment required',
            step: 'payment',
            details: eligibilityData
          };
        }
      } catch (err) {
        const message = `Eligibility check failed: ${err.message}`;
        setError(message);
        console.error('[RFQ SUBMIT] Eligibility check error:', err);
        setIsLoading(false);

        return {
          success: false,
          error: message,
          step: 'eligibility'
        };
      }

      // ========================================================================
      // STEP 5: CREATE RFQ
      // ========================================================================
      setCurrentStep('submitting');
      console.log('[RFQ SUBMIT] Step 5: Creating RFQ...');

      try {
        // Prepare RFQ data for submission
        const rfqData = {
          userId,
          rfqType,
          title: formData.projectTitle,
          description: formData.projectSummary,
          category: formData.selectedCategory,
          town: formData.town,
          county: formData.county,
          budgetMin: parseFloat(formData.budgetMin),
          budgetMax: parseFloat(formData.budgetMax),
          // Type-specific fields
          ...(rfqType === 'direct' && { selectedVendors: formData.selectedVendors || [] }),
          ...(rfqType === 'public' && { visibilityScope: formData.visibilityScope || 'county' }),
          ...(rfqType === 'vendor-request' && { selectedVendor: formData.selectedVendor || null }),
          // Template fields
          templateFields: formData.templateFields || {},
          // Draft tracking
          draftSavedAt: formData.draftSavedAt || null
        };

        const response = await fetch('/api/rfq/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(rfqData)
        });

        const responseData = await response.json();

        if (!response.ok) {
          // Handle specific error codes
          if (response.status === 400) {
            throw new Error(`Validation error: ${responseData.message || 'Invalid form data'}`);
          } else if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else if (response.status === 402) {
            throw new Error('Payment required. You have reached your free RFQ limit.');
          } else if (response.status === 403) {
            throw new Error('Your account is not verified. Please verify your email and phone.');
          } else if (response.status === 404) {
            throw new Error('User not found. Please log in again.');
          } else {
            throw new Error(`Submission failed: ${responseData.message || 'Unknown error'}`);
          }
        }

        if (!responseData.success || !responseData.rfqId) {
          throw new Error(responseData.message || 'Failed to create RFQ');
        }

        console.log('[RFQ SUBMIT] Step 5 ✓: RFQ created successfully:', responseData.rfqId);

        // ====================================================================
        // STEP 6: SUCCESS - REDIRECT TO RFQ DETAIL PAGE
        // ====================================================================
        setCreatedRfqId(responseData.rfqId);
        setSuccess(true);
        setCurrentStep(null);

        console.log('[RFQ SUBMIT] ✓ COMPLETE: Redirecting to RFQ detail page...');

        // Call success callback
        if (onSuccess) {
          onSuccess(responseData.rfqId);
        }

        // Redirect to RFQ detail page after a short delay
        setTimeout(() => {
          router.push(`/rfq/${responseData.rfqId}`);
        }, 1000);

        return {
          success: true,
          rfqId: responseData.rfqId,
          message: 'RFQ submitted successfully!'
        };
      } catch (err) {
        const message = err.message || 'Failed to create RFQ';
        setError(message);
        console.error('[RFQ SUBMIT] RFQ creation error:', err);
        setIsLoading(false);

        return {
          success: false,
          error: message,
          step: 'submission'
        };
      }
    } catch (err) {
      const message = err.message || 'An unexpected error occurred';
      setError(message);
      console.error('[RFQ SUBMIT] Unexpected error:', err);
      setIsLoading(false);

      return {
        success: false,
        error: message
      };
    }
  }

  /**
   * Reset submit state
   */
  function resetSubmit() {
    setIsLoading(false);
    setError(null);
    setSuccess(false);
    setCurrentStep(null);
    setCreatedRfqId(null);
  }

  /**
   * Clear error message
   */
  function clearError() {
    setError(null);
  }

  return {
    // State
    isLoading,
    error,
    success,
    currentStep,
    createdRfqId,
    // Methods
    handleSubmit,
    resetSubmit,
    clearError
  };
}

export default useRFQSubmit;
