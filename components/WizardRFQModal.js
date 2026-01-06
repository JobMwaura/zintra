'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRfqContext } from '@/context/RfqContext';
import { useRfqFormPersistence } from '@/hooks/useRfqFormPersistence';
import RfqCategorySelector from '@/components/RfqCategorySelector';
import RfqJobTypeSelector from '@/components/RfqJobTypeSelector';
import RfqFormRenderer from '@/components/RfqFormRenderer';
import AuthInterceptor from '@/components/AuthInterceptor';
import templates from '@/public/data/rfq-templates-v2-hierarchical.json';

export default function WizardRFQModal({ isOpen = false, onClose = () => {}, onSuccess = () => {} }) {
  const {
    rfqType,
    setRfqType,
    selectedCategory,
    setSelectedCategory,
    selectedJobType,
    setSelectedJobType,
    templateFields,
    updateTemplateField,
    updateTemplateFields,
    sharedFields,
    updateSharedField,
    updateSharedFields,
    selectedVendors,
    toggleVendor,
    setVendors,
    isGuestMode,
    setUserAuthenticated,
    guestPhone,
    guestPhoneVerified,
    getAllFormData,
    resetRfq,
  } = useRfqContext();

  const { saveFormData, loadFormData, clearFormData, hasDraft, createAutoSave, isInitialized } =
    useRfqFormPersistence();

  const [currentStep, setCurrentStep] = useState('category');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showResumeOption, setShowResumeOption] = useState(false);
  const [savedDraft, setSavedDraft] = useState(null);
  const [availableVendors, setAvailableVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  const autoSaveRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    setRfqType('wizard');

    if (isInitialized() && selectedCategory && selectedJobType) {
      const hasSavedDraft = hasDraft('wizard', selectedCategory, selectedJobType);
      if (hasSavedDraft) {
        const draft = loadFormData('wizard', selectedCategory, selectedJobType);
        if (draft) {
          setSavedDraft(draft);
          setShowResumeOption(true);
        }
      }
    }

    autoSaveRef.current = createAutoSave(2000);
  }, [isOpen, selectedCategory, selectedJobType, setRfqType, isInitialized, hasDraft, loadFormData, createAutoSave]);

  // Fetch available vendors when job type is selected
  useEffect(() => {
    if (currentStep === 'vendors' && selectedJobType) {
      fetchVendors();
    }
  }, [currentStep, selectedJobType]);

  const fetchVendors = async () => {
    setLoadingVendors(true);
    setError('');

    try {
      const response = await fetch(`/api/vendors/by-jobtype?jobType=${selectedJobType}`);
      const data = await response.json();

      if (response.ok) {
        setAvailableVendors(data.vendors || []);
      } else {
        setError(data.message || 'Failed to load vendors');
        setAvailableVendors([]);
      }
    } catch (err) {
      console.error('Fetch vendors error:', err);
      setError('Network error loading vendors');
      setAvailableVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.slug);
    setSelectedJobType(null);
    setVendors([]);
    setCurrentStep('jobtype');
    setError('');
  };

  const handleJobTypeSelect = (jobType) => {
    setSelectedJobType(jobType.slug);
    setCurrentStep('vendors');
    setError('');
  };

  const handleTemplateFieldChange = (fieldName, value) => {
    updateTemplateField(fieldName, value);

    if (autoSaveRef.current) {
      autoSaveRef.current('wizard', selectedCategory, selectedJobType, 
        { ...templateFields, [fieldName]: value }, 
        sharedFields
      );
    }
  };

  const handleSharedFieldChange = (fieldName, value) => {
    updateSharedField(fieldName, value);

    if (autoSaveRef.current) {
      autoSaveRef.current('wizard', selectedCategory, selectedJobType, 
        templateFields, 
        { ...sharedFields, [fieldName]: value }
      );
    }
  };

  const handleProceedFromShared = () => {
    if (selectedVendors.length === 0) {
      setError('Please select at least one vendor');
      return;
    }

    saveFormData('wizard', selectedCategory, selectedJobType, templateFields, sharedFields);

    if (isGuestMode) {
      setShowAuthModal(true);
      return;
    }

    submitRfq();
  };

  const handleAuthSuccess = (user) => {
    setShowAuthModal(false);
    setUserAuthenticated(user);
    submitRfq();
  };

  const handleGuestSubmit = () => {
    setShowAuthModal(false);
    submitRfq();
  };

  const submitRfq = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const formData = getAllFormData();

      const response = await fetch('/api/rfq/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          guestPhone: guestPhone,
          guestPhoneVerified: guestPhoneVerified,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setError("You've reached your monthly RFQ limit. Please upgrade your plan.");
          setIsSubmitting(false);
          return;
        }

        if (response.status === 429) {
          setError('Too many requests. Please wait a moment and try again.');
          setIsSubmitting(false);
          return;
        }

        setError(result.message || 'Failed to submit RFQ. Please try again.');
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage('RFQ submitted successfully! Selected vendors will be contacted.');
      clearFormData('wizard', selectedCategory, selectedJobType);
      resetRfq();

      setTimeout(() => {
        onSuccess(result);
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('RFQ submission error:', err);
      setError('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handlePrevStep = () => {
    saveFormData('wizard', selectedCategory, selectedJobType, templateFields, sharedFields);

    switch (currentStep) {
      case 'jobtype':
        setSelectedJobType(null);
        setVendors([]);
        setCurrentStep('category');
        break;
      case 'vendors':
        setCurrentStep('jobtype');
        break;
      case 'template':
        setCurrentStep('vendors');
        break;
      case 'shared':
        setCurrentStep('template');
        break;
      default:
        break;
    }
    setError('');
  };

  const handleClose = () => {
    if (selectedCategory && selectedJobType) {
      saveFormData('wizard', selectedCategory, selectedJobType, templateFields, sharedFields);
    }
    resetRfq();
    setCurrentStep('category');
    setError('');
    setSuccessMessage('');
    onClose();
  };

  const handleResumeDraft = () => {
    if (savedDraft) {
      updateTemplateFields(savedDraft.templateFields);
      updateSharedFields(savedDraft.sharedFields);
      if (savedDraft.selectedVendors) {
        setVendors(savedDraft.selectedVendors);
      }
    }
    setShowResumeOption(false);
  };

  const handleStartFresh = () => {
    setShowResumeOption(false);
  };

  const getProgressPercentage = () => {
    const steps = ['category', 'jobtype', 'vendors', 'template', 'shared'];
    const currentIndex = steps.indexOf(currentStep);
    return Math.round(((currentIndex + 1) / steps.length) * 100);
  };

  const getCategoryName = () => {
    const category = templates.majorCategories.find((c) => c.slug === selectedCategory);
    return category ? category.label : 'Unknown';
  };

  const getJobTypeName = () => {
    if (!selectedCategory || !selectedJobType) return '';
    const category = templates.majorCategories.find((c) => c.slug === selectedCategory);
    if (!category) return '';
    const jobType = category.jobTypes.find((jt) => jt.slug === selectedJobType);
    return jobType ? jobType.label : '';
  };

  const getTemplateFields = () => {
    if (!selectedCategory || !selectedJobType) return [];
    const category = templates.majorCategories.find((c) => c.slug === selectedCategory);
    if (!category) return [];
    const jobType = category.jobTypes.find((jt) => jt.slug === selectedJobType);
    return jobType ? jobType.fields : [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex justify-between items-start gap-4 border-b border-purple-800">
          <div>
            <h2 className="text-2xl font-bold">Get Vendor Quotes</h2>
            <p className="text-purple-100 text-sm mt-1">Wizard Mode - Step {['category', 'jobtype', 'vendors', 'template', 'shared'].indexOf(currentStep) + 1} of 5</p>
          </div>
          <button
            onClick={handleClose}
            className="text-purple-100 hover:text-white text-2xl leading-none"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {!['category'].includes(currentStep) && (
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        )}

        {showResumeOption && (
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 m-4 rounded">
            <p className="text-sm text-gray-700 mb-3">
              📝 We found a saved draft. Would you like to resume?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleResumeDraft}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded font-medium"
              >
                Resume Draft
              </button>
              <button
                onClick={handleStartFresh}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded font-medium"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 m-4 rounded">
            <p className="text-green-700 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        <div className="p-6">
          
          {currentStep === 'category' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">What type of project do you have?</h3>
              <p className="text-sm text-gray-600">Select a category that matches your project.</p>
              <RfqCategorySelector
                categories={templates.majorCategories}
                onSelect={handleCategorySelect}
                selectedCategory={selectedCategory}
              />
            </div>
          )}

          {currentStep === 'jobtype' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <p className="text-sm"><strong>Category:</strong> {getCategoryName()}</p>
              </div>
              <h3 className="text-lg font-semibold">What type of job is it?</h3>
              <RfqJobTypeSelector
                jobTypes={templates.majorCategories.find((c) => c.slug === selectedCategory)?.jobTypes || []}
                onSelect={handleJobTypeSelect}
                selectedJobType={selectedJobType}
              />
            </div>
          )}

          {currentStep === 'vendors' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-3 rounded border border-purple-200">
                <p className="text-sm"><strong>Category:</strong> {getCategoryName()}</p>
                <p className="text-sm"><strong>Job Type:</strong> {getJobTypeName()}</p>
              </div>
              <h3 className="text-lg font-semibold">Select vendors to contact</h3>
              <p className="text-sm text-gray-600">Choose one or more vendors you'd like to quote this project.</p>

              {loadingVendors ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">Loading vendors...</span>
                </div>
              ) : availableVendors.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <p className="text-yellow-800 text-sm">
                    No vendors available for this job type yet. Please try another category or continue.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableVendors.map((vendor) => (
                    <label
                      key={vendor.id}
                      className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.id)}
                        onChange={() => toggleVendor(vendor.id)}
                        className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                          {vendor.rating && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              ⭐ {vendor.rating}
                            </span>
                          )}
                        </div>
                        {vendor.description && (
                          <p className="text-sm text-gray-600 mt-1">{vendor.description}</p>
                        )}
                        {vendor.location && (
                          <p className="text-xs text-gray-500 mt-1">📍 {vendor.location}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedVendors.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 rounded border border-purple-200">
                  <p className="text-sm text-purple-900">
                    ✓ {selectedVendors.length} vendor{selectedVendors.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
          )}

          {currentStep === 'template' && (
            <div className="space-y-4">
              <div className="bg-purple-50 p-3 rounded border border-purple-200 space-y-1">
                <p className="text-sm"><strong>Category:</strong> {getCategoryName()}</p>
                <p className="text-sm"><strong>Job Type:</strong> {getJobTypeName()}</p>
                <p className="text-sm"><strong>Vendors:</strong> {selectedVendors.length} selected</p>
              </div>
              <h3 className="text-lg font-semibold">Tell us about your project</h3>
              <RfqFormRenderer
                fields={getTemplateFields()}
                values={templateFields}
                onChange={handleTemplateFieldChange}
              />
            </div>
          )}

          {currentStep === 'shared' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Details</h3>
              <RfqFormRenderer
                fields={templates.sharedFields}
                values={sharedFields}
                onChange={handleSharedFieldChange}
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 'category' || isSubmitting}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 rounded-lg font-medium"
          >
            ← Back
          </button>

          {currentStep !== 'shared' && (
            <button
              onClick={() => {
                if (currentStep === 'category') setCurrentStep('jobtype');
                else if (currentStep === 'jobtype') setCurrentStep('vendors');
                else if (currentStep === 'vendors') setCurrentStep('template');
                else if (currentStep === 'template') {
                  saveFormData('wizard', selectedCategory, selectedJobType, templateFields, sharedFields);
                  setCurrentStep('shared');
                }
              }}
              disabled={
                (currentStep === 'category' && !selectedCategory) ||
                (currentStep === 'jobtype' && !selectedJobType) ||
                (currentStep === 'vendors' && selectedVendors.length === 0) ||
                isSubmitting
              }
              className="flex-1 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
            >
              Next →
            </button>
          )}

          {currentStep === 'shared' && (
            <button
              onClick={handleProceedFromShared}
              disabled={isSubmitting || selectedVendors.length === 0}
              className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit RFQ'}
            </button>
          )}
        </div>
      </div>

      <AuthInterceptor
        isOpen={showAuthModal}
        onLoginSuccess={handleAuthSuccess}
        onGuestSubmit={handleGuestSubmit}
        onCancel={() => setShowAuthModal(false)}
      />
    </div>
  );
}
