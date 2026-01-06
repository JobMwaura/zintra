/**
 * useRFQFormValidation Hook
 * Validates RFQ form data based on RFQ type and category requirements
 */

export function useRFQFormValidation() {
  /**
   * Validate RFQ form data
   * @param {Object} formData - Form data to validate
   * @param {string} rfqType - Type of RFQ (direct, wizard, public, vendor-request)
   * @param {Array} categoryFields - Category-specific required fields
   * @returns {Object} - { isValid: boolean, errors: string[] }
   */
  function validateRFQForm(formData, rfqType, categoryFields = []) {
    const errors = [];

    // ========================================================================
    // 1. VALIDATE SHARED FIELDS (required for all RFQ types)
    // ========================================================================
    
    // Project title
    if (!formData.projectTitle || formData.projectTitle.trim() === '') {
      errors.push('Project title is required');
    } else if (formData.projectTitle.length < 5) {
      errors.push('Project title must be at least 5 characters');
    } else if (formData.projectTitle.length > 200) {
      errors.push('Project title must be less than 200 characters');
    }

    // Project summary
    if (!formData.projectSummary || formData.projectSummary.trim() === '') {
      errors.push('Project summary is required');
    } else if (formData.projectSummary.length < 10) {
      errors.push('Project summary must be at least 10 characters');
    } else if (formData.projectSummary.length > 5000) {
      errors.push('Project summary must be less than 5000 characters');
    }

    // Category
    if (!formData.selectedCategory || formData.selectedCategory.trim() === '') {
      errors.push('Category is required');
    }

    // County
    if (!formData.county || formData.county.trim() === '') {
      errors.push('County is required');
    }

    // Town
    if (!formData.town || formData.town.trim() === '') {
      errors.push('Town is required');
    }

    // Budget
    if (formData.budgetMin === undefined || formData.budgetMin === null || formData.budgetMin === '') {
      errors.push('Minimum budget is required');
    } else if (isNaN(parseFloat(formData.budgetMin))) {
      errors.push('Minimum budget must be a number');
    } else if (parseFloat(formData.budgetMin) < 0) {
      errors.push('Budget cannot be negative');
    }

    if (formData.budgetMax === undefined || formData.budgetMax === null || formData.budgetMax === '') {
      errors.push('Maximum budget is required');
    } else if (isNaN(parseFloat(formData.budgetMax))) {
      errors.push('Maximum budget must be a number');
    } else if (parseFloat(formData.budgetMax) < 0) {
      errors.push('Budget cannot be negative');
    }

    // Budget min <= max
    if (
      formData.budgetMin !== undefined &&
      formData.budgetMax !== undefined &&
      !isNaN(parseFloat(formData.budgetMin)) &&
      !isNaN(parseFloat(formData.budgetMax))
    ) {
      if (parseFloat(formData.budgetMin) > parseFloat(formData.budgetMax)) {
        errors.push('Minimum budget cannot exceed maximum budget');
      }
    }

    // ========================================================================
    // 2. VALIDATE TYPE-SPECIFIC FIELDS
    // ========================================================================

    // Direct RFQ: Must select at least one vendor
    if (rfqType === 'direct') {
      if (!formData.selectedVendors || formData.selectedVendors.length === 0) {
        errors.push('Select at least one vendor for Direct RFQ');
      }
    }

    // Public RFQ: Visibility scope required
    if (rfqType === 'public') {
      if (!formData.visibilityScope || !['county', 'nationwide'].includes(formData.visibilityScope)) {
        errors.push('Select visibility scope (County or Nationwide) for Public RFQ');
      }
    }

    // Vendor Request: Must select a vendor
    if (rfqType === 'vendor-request') {
      if (!formData.selectedVendor || formData.selectedVendor.trim() === '') {
        errors.push('Select a vendor for Vendor Request RFQ');
      }
    }

    // ========================================================================
    // 3. VALIDATE CATEGORY-SPECIFIC TEMPLATE FIELDS
    // ========================================================================

    if (categoryFields && Array.isArray(categoryFields)) {
      for (const field of categoryFields) {
        // Check required fields
        if (field.required) {
          const fieldValue = formData.templateFields?.[field.name];
          
          if (
            fieldValue === undefined ||
            fieldValue === null ||
            fieldValue === '' ||
            (typeof fieldValue === 'string' && fieldValue.trim() === '')
          ) {
            errors.push(`${field.label} is required`);
          }

          // Validate field type if specified
          if (field.type === 'number' && fieldValue) {
            if (isNaN(parseFloat(fieldValue))) {
              errors.push(`${field.label} must be a number`);
            }
          }

          if (field.type === 'email' && fieldValue) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(fieldValue)) {
              errors.push(`${field.label} must be a valid email address`);
            }
          }

          if (field.type === 'phone' && fieldValue) {
            // Simple phone validation (10+ digits)
            const phoneRegex = /^\d{10,}$/;
            if (!phoneRegex.test(fieldValue.replace(/\D/g, ''))) {
              errors.push(`${field.label} must be a valid phone number`);
            }
          }

          if (field.type === 'url' && fieldValue) {
            try {
              new URL(fieldValue);
            } catch {
              errors.push(`${field.label} must be a valid URL`);
            }
          }
        }
      }
    }

    // ========================================================================
    // RETURN VALIDATION RESULT
    // ========================================================================

    return {
      isValid: errors.length === 0,
      errors: errors,
      errorCount: errors.length,
      hasSharedFieldErrors: errors.some(e => 
        e.includes('title') || e.includes('summary') || e.includes('category') ||
        e.includes('County') || e.includes('Town') || e.includes('budget') ||
        e.includes('County') || e.includes('Nationwide')
      ),
      hasTemplateFieldErrors: errors.some(e => 
        !e.includes('title') && !e.includes('summary') && !e.includes('category') &&
        !e.includes('County') && !e.includes('Town') && !e.includes('budget') &&
        !e.includes('vendor') && !e.includes('visibility')
      ),
      hasVendorErrors: errors.some(e => e.includes('vendor') || e.includes('visibility'))
    };
  }

  /**
   * Get field error message
   * @param {Array} errors - All validation errors
   * @param {string} fieldName - Field name to get error for
   * @returns {string|null} - Error message or null
   */
  function getFieldError(errors, fieldName) {
    const lowerFieldName = fieldName.toLowerCase();
    return errors.find(e => e.toLowerCase().includes(lowerFieldName)) || null;
  }

  /**
   * Check if form has errors
   * @param {Array} errors - All validation errors
   * @param {string} fieldName - Optional: field name to check specific field
   * @returns {boolean}
   */
  function hasError(errors, fieldName = null) {
    if (!fieldName) {
      return errors.length > 0;
    }
    return !!getFieldError(errors, fieldName);
  }

  return {
    validateRFQForm,
    getFieldError,
    hasError
  };
}

export default useRFQFormValidation;
