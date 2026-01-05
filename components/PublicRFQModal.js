'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Loader } from 'lucide-react';
import { useRfqContext } from '@/context/RfqContext';
import { useRfqFormPersistence } from '@/hooks/useRfqFormPersistence';
import PublicRFQCategorySelector from './PublicRFQCategorySelector';
import PublicRFQJobTypeSelector from './PublicRFQJobTypeSelector';
import RfqFormRenderer from './RfqFormRenderer';
import AuthInterceptor from './AuthInterceptor';
import templates from '@/public/data/rfq-templates-v2-hierarchical.json';

export default function PublicRFQModal({ isOpen = false, onClose = () => {}, onSuccess = () => {} }) {
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
    guestPhone,
    guestPhoneVerified,
    getAllFormData,
    resetRfq,
  } = useRfqContext();

  const { saveFormData, loadFormData, clearFormData, hasDraft, createAutoSave, isInitialized } =
    useRfqFormPersistence();

  // Local State
  const [currentStep, setCurrentStep] = useState('category');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showResumeOption, setShowResumeOption] = useState(false);
  const [savedDraft, setSavedDraft] = useState(null);
  const autoSaveRef = useRef(null);

  // Initialize on modal open
  useEffect(() => {
    if (!isOpen) return;

    setRfqType('public');
    setError('');
    setSuccessMessage('');

    // Check for saved draft
    if (isInitialized() && selectedCategory && selectedJobType) {
      const hasSavedDraft = hasDraft('public', selectedCategory, selectedJobType);
      if (hasSavedDraft) {
        const draft = loadFormData('public', selectedCategory, selectedJobType);
        if (draft) {
          setSavedDraft(draft);
          setShowResumeOption(true);
        }
      }
    }

    // Setup auto-save
    autoSaveRef.current = createAutoSave(2000);

    return () => {
      if (autoSaveRef.current?.stop) {
        autoSaveRef.current.stop();
      }
    };
  }, [isOpen, selectedCategory, selectedJobType, setRfqType, isInitialized, hasDraft, loadFormData, createAutoSave]);

  // Handlers
  const handleCategorySelect = (category) => {
    setSelectedCategory(category.slug);
    setSelectedJobType(null);
    setCurrentStep('jobtype');
    setError('');
    setShowResumeOption(false);
  };

  const handleJobTypeSelect = (jobType) => {
    setSelectedJobType(jobType.slug);
    setCurrentStep('template');
    setError('');
  };

  const handleTemplateFieldChange = (fieldName, value) => {
    updateTemplateField(fieldName, value);

    if (autoSaveRef.current) {
      autoSaveRef.current('public', selectedCategory, selectedJobType, 
        { ...templateFields, [fieldName]: value }, 
        sharedFields
      );
    }
  };

  const handleSharedFieldChange = (fieldName, value) => {
    updateSharedField(fieldName, value);

    if (autoSaveRef.current) {
      autoSaveRef.current('public', selectedCategory, selectedJobType, 
        templateFields, 
        { ...sharedFields, [fieldName]: value }
      );
    }
  };

  const handleProceedFromShared = () => {
    saveFormData('public', selectedCategory, selectedJobType, templateFields, sharedFields);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
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

      setSuccessMessage('RFQ posted successfully! Vendors will view and respond to your request.');
      clearFormData('public', selectedCategory, selectedJobType);
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
    saveFormData('public', selectedCategory, selectedJobType, templateFields, sharedFields);

    switch (currentStep) {
      case 'jobtype':
        setSelectedJobType(null);
        setCurrentStep('category');
        break;
      case 'template':
        setCurrentStep('jobtype');
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
      saveFormData('public', selectedCategory, selectedJobType, templateFields, sharedFields);
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
    }
    setShowResumeOption(false);
  };

  const handleStartFresh = () => {
    setShowResumeOption(false);
  };

  const getProgressPercentage = () => {
    const steps = ['category', 'jobtype', 'template', 'shared'];
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
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-6 flex justify-between items-start gap-4 border-b border-green-800">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Post Your Project</h2>
            <p className="text-green-100 text-sm mt-2">
              Step {['category', 'jobtype', 'template', 'shared'].indexOf(currentStep) + 1} of 4
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-green-100 hover:text-white transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        {!['category'].includes(currentStep) && (
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        )}

        {/* Resume Draft Option */}
        {showResumeOption && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 m-4 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-3">
              📝 We found a saved draft. Would you like to resume it?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleResumeDraft}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded font-medium transition"
              >
                Resume Draft
              </button>
              <button
                onClick={handleStartFresh}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded font-medium transition"
              >
                Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 m-4 rounded-lg">
            <p className="text-green-700 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Step 1: Category Selection */}
          {currentStep === 'category' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">What type of project do you have?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select the category that best matches your needs to get tailored questions.
                </p>
              </div>
              <PublicRFQCategorySelector
                categories={templates.majorCategories}
                onSelect={handleCategorySelect}
                selectedCategory={selectedCategory}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Step 2: Job Type Selection */}
          {currentStep === 'jobtype' && (
            <div className="space-y-4">
              <PublicRFQJobTypeSelector
                jobTypes={getCategoryObject()?.jobTypes || []}
                onSelect={handleJobTypeSelect}
                onBack={() => {
                  setSelectedCategory(null);
                  setCurrentStep('category');
                  setError('');
                }}
                selectedJobType={selectedJobType}
                categoryLabel={getCategoryObject()?.label}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Step 3: Template Fields */}
          {currentStep === 'template' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  <span className="font-semibold">Category:</span> {getCategoryObject()?.label}
                </p>
                <p className="text-sm text-green-900">
                  <span className="font-semibold">Work Type:</span> {getJobTypeObject()?.label}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Tell us about your project</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Fill in the details specific to your {getJobTypeObject()?.label.toLowerCase()}.
                </p>
              </div>
              <RfqFormRenderer
                fields={getTemplateFields()}
                values={templateFields}
                onChange={handleTemplateFieldChange}
              />
            </div>
          )}

          {/* Step 4: Shared Fields */}
          {currentStep === 'shared' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Project Details</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Add the final details about your project.
                </p>
              </div>
              <RfqFormRenderer
                fields={templates.sharedFields}
                values={sharedFields}
                onChange={handleSharedFieldChange}
              />
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 'category' || isSubmitting}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg font-medium transition disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          {currentStep !== 'shared' && (
            <button
              onClick={() => {
                if (currentStep === 'category') {
                  if (selectedCategory) {
                    setCurrentStep('jobtype');
                  } else {
                    setError('Please select a category');
                  }
                } else if (currentStep === 'jobtype') {
                  if (selectedJobType) {
                    setCurrentStep('template');
                  } else {
                    setError('Please select a job type');
                  }
                } else if (currentStep === 'template') {
                  saveFormData('public', selectedCategory, selectedJobType, templateFields, sharedFields);
                  setCurrentStep('shared');
                }
              }}
              disabled={
                (currentStep === 'category' && !selectedCategory) ||
                (currentStep === 'jobtype' && !selectedJobType) ||
                isSubmitting
              }
              className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg font-medium transition disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Next →'
              )}
            </button>
          )}

          {currentStep === 'shared' && (
            <button
              onClick={handleProceedFromShared}
              disabled={isSubmitting}
              className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-lg font-medium transition disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                '✓ Post Project'
              )}
            </button>
          )}
        </div>
      </div>

      <AuthInterceptor
        isOpen={showAuthModal}
        onLoginSuccess={() => {
          setShowAuthModal(false);
          submitRfq();
        }}
        onGuestSubmit={handleGuestSubmit}
        onCancel={() => setShowAuthModal(false)}
      />
    </div>
  );
}
