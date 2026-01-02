'use client';

import { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';
import StepIndicator from './StepIndicator';
import StepCategory from './Steps/StepCategory';
import StepTemplate from './Steps/StepTemplate';
import StepGeneral from './Steps/StepGeneral';
import StepRecipients from './Steps/StepRecipients';
import StepAuth from './Steps/StepAuth';
import StepReview from './Steps/StepReview';
import StepSuccess from './Steps/StepSuccess';
import RFQImageUpload from './RFQImageUpload';
import { getAllCategories, getJobTypesForCategory, getFieldsForJobType, categoryRequiresJobType } from '@/lib/rfqTemplateUtils';

export default function RFQModal({ rfqType = 'direct', isOpen = false, onClose = () => {} }) {
  const [currentStep, setCurrentStep] = useState('category');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Form Data
  const [formData, setFormData] = useState({
    // Step 1
    selectedCategory: '',
    selectedJobType: '',
    
    // Step 2
    templateFields: {},
    referenceImages: [],
    
    // Step 3
    projectTitle: '',
    projectSummary: '',
    county: '',
    town: '',
    directions: '',
    budgetMin: '',
    budgetMax: '',
    budgetLevel: '',
    desiredStartDate: '',
    
    // Step 4 - Type specific
    selectedVendors: [],
    allowOtherVendors: false,
    visibilityScope: 'category',
    responseLimit: 5,
  });

  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [templateFieldsMetadata, setTemplateFieldsMetadata] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categoryNeedsJobType, setCategoryNeedsJobType] = useState(false);
  const [rfqId, setRfqId] = useState(null);

  const steps = [
    { number: 1, name: 'category' },
    { number: 2, name: 'details' },
    { number: 3, name: 'project' },
    { number: 4, name: 'recipients' },
    { number: 5, name: 'auth' },
    { number: 6, name: 'review' },
    { number: 7, name: 'success' }
  ];

  // Load user and templates on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingTemplates(true);
      
      // Load user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      
      // Load categories
      const cats = await getAllCategories();
      setCategories(cats);
      
      // Load vendors
      const { data: vendorData } = await supabase.from('vendors').select('id, company_name, location, county, categories, rating, verified');
      if (vendorData) setVendors(vendorData);
      
      setLoadingTemplates(false);
    };
    
    loadInitialData();
  }, []);

  // Load job types when category changes
  useEffect(() => {
    const loadJobTypes = async () => {
      if (!formData.selectedCategory) {
        setJobTypes([]);
        setTemplateFieldsMetadata([]);
        setCategoryNeedsJobType(false);
        setFormData(prev => ({ ...prev, selectedJobType: '' }));
        return;
      }

      const needsJobType = await categoryRequiresJobType(formData.selectedCategory);
      setCategoryNeedsJobType(needsJobType);

      if (needsJobType) {
        const jts = await getJobTypesForCategory(formData.selectedCategory);
        setJobTypes(jts);
        setFormData(prev => ({ ...prev, selectedJobType: '' }));
        setTemplateFieldsMetadata([]);
      } else {
        const fields = await getFieldsForJobType(formData.selectedCategory);
        setTemplateFieldsMetadata(fields || []);
      }

      setFormData(prev => ({ ...prev, templateFields: {} }));
      setErrors({});
    };

    loadJobTypes();
  }, [formData.selectedCategory]);

  // Load template fields when job type changes
  useEffect(() => {
    const loadTemplateFields = async () => {
      if (!formData.selectedCategory) return;

      let fields = [];
      if (categoryNeedsJobType && !formData.selectedJobType) {
        fields = [];
      } else {
        fields = await getFieldsForJobType(formData.selectedCategory, formData.selectedJobType);
      }

      setTemplateFieldsMetadata(fields || []);
      setFormData(prev => ({ ...prev, templateFields: {} }));
      setErrors({});
    };

    loadTemplateFields();
  }, [formData.selectedJobType, categoryNeedsJobType]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTemplateFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      templateFields: { ...prev.templateFields, [fieldName]: value }
    }));
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 'category') {
      if (!formData.selectedCategory) newErrors.selectedCategory = 'Required';
      if (categoryNeedsJobType && !formData.selectedJobType) newErrors.selectedJobType = 'Required';
    }

    if (currentStep === 'details') {
      templateFieldsMetadata.forEach(field => {
        const value = formData.templateFields[field.name];
        if (field.required && (value === '' || value === undefined || value === null)) {
          newErrors[field.name] = 'Required';
        }
      });
    }

    if (currentStep === 'project') {
      if (!formData.county) newErrors.county = 'Required';
      if (!formData.town) newErrors.town = 'Required';
      if (!formData.budgetMin) newErrors.budgetMin = 'Required';
      if (!formData.budgetMax) newErrors.budgetMax = 'Required';
      if (formData.budgetMin && formData.budgetMax && parseInt(formData.budgetMin) > parseInt(formData.budgetMax)) {
        newErrors.budgetMin = 'Min must be less than max';
      }
    }

    if (currentStep === 'recipients') {
      if (rfqType === 'direct' || rfqType === 'wizard') {
        if (rfqType === 'direct' && formData.selectedVendors.length === 0) {
          newErrors.selectedVendors = 'Select at least one vendor';
        }
        if (rfqType === 'wizard' && formData.selectedVendors.length === 0 && !formData.allowOtherVendors) {
          newErrors.recipients = 'Select vendors or allow others';
        }
      }
    }

    if (currentStep === 'auth') {
      if (!user) newErrors.auth = 'Please log in or create account';
    }

    if (currentStep === 'review') {
      // Data already validated
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) {
      // Show error feedback
      const errorMessages = Object.values(errors).filter(Boolean);
      if (errorMessages.length > 0) {
        setError(`Please fix: ${errorMessages.join(', ')}`);
        setTimeout(() => setError(null), 5000); // Clear after 5 seconds
      }
      return;
    }

    const stepIndex = steps.findIndex(s => s.name === currentStep);
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].name);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    const stepIndex = steps.findIndex(s => s.name === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].name);
      setErrors({});
      setError(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setErrors({ auth: 'Please log in first' });
        setLoading(false);
        return;
      }

      const payload = {
        // Map to actual database columns from RFQ_SYSTEM_COMPLETE.sql
        title: formData.projectTitle || formData.selectedCategory,
        description: formData.projectSummary,
        category: formData.selectedCategory,
        location: formData.town,
        county: formData.county,
        budget_min: formData.budgetMin ? parseInt(formData.budgetMin.replace(/,/g, ''), 10) : null,
        budget_max: formData.budgetMax ? parseInt(formData.budgetMax.replace(/,/g, ''), 10) : null,
        type: rfqType === 'direct' ? 'direct' : rfqType === 'wizard' ? 'matched' : 'public',
        urgency: 'normal',
        // Store all additional form data as JSON in attachments JSONB column
        attachments: {
          projectTitle: formData.projectTitle || formData.selectedCategory,
          projectSummary: formData.projectSummary,
          selectedCategory: formData.selectedCategory,
          selectedJobType: formData.selectedJobType || null,
          town: formData.town,
          county: formData.county,
          budgetMin: parseInt(formData.budgetMin) || null,
          budgetMax: parseInt(formData.budgetMax) || null,
          directions: formData.directions || null,
          desiredStartDate: formData.desiredStartDate || null,
          budgetLevel: formData.budgetLevel || null,
          templateFields: Object.keys(formData.templateFields).length > 0 ? formData.templateFields : null,
          referenceImages: formData.referenceImages.length > 0 ? formData.referenceImages : [],
          selectedVendors: rfqType === 'direct' || rfqType === 'wizard' ? formData.selectedVendors : [],
          allowOtherVendors: rfqType === 'wizard' ? formData.allowOtherVendors : false,
          visibilityScope: rfqType === 'public' ? formData.visibilityScope : null,
          responseLimit: rfqType === 'public' ? formData.responseLimit : 5,
        }
      };

      const { data, error: rfqError } = await supabase
        .from('rfqs')
        .insert([payload])
        .select();

      if (rfqError) throw rfqError;

      if (data && data[0]) {
        const newRfqId = data[0].id;
        setRfqId(newRfqId);

        // Create recipients for Direct and Wizard
        if ((rfqType === 'direct' || rfqType === 'wizard') && formData.selectedVendors.length > 0) {
          const recipients = formData.selectedVendors.map(vendorId => ({
            rfq_id: newRfqId,
            vendor_id: vendorId,
            recipient_type: rfqType === 'direct' ? 'direct' : 'suggested',
          }));
          
          const { error: recipientError } = await supabase
            .from('rfq_recipients')
            .insert(recipients);
          
          if (recipientError) console.error('Error creating recipients:', recipientError);
        }

        setSuccess(true);
        setCurrentStep('success');
      }
    } catch (err) {
      setError(err.message || 'Failed to create RFQ');
      setErrors({ submit: err.message || 'Failed to create RFQ' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loadingTemplates) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (success && currentStep === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
          <StepSuccess rfqType={rfqType} rfqId={rfqId} onClose={onClose} recipientCount={formData.selectedVendors.length} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <ModalHeader rfqType={rfqType} onClose={onClose} />

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-6 sm:px-8 py-3">
            <p className="text-sm text-red-700 font-medium flex items-center gap-2">
              <span className="text-base">⚠️</span>
              {error}
            </p>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {currentStep === 'category' && (
            <StepCategory
              selectedCategory={formData.selectedCategory}
              selectedJobType={formData.selectedJobType}
              categories={categories}
              jobTypes={jobTypes}
              categoryNeedsJobType={categoryNeedsJobType}
              onCategoryChange={(cat) => handleInputChange('selectedCategory', cat)}
              onJobTypeChange={(jt) => handleInputChange('selectedJobType', jt)}
              errors={errors}
            />
          )}

          {currentStep === 'details' && (
            <StepTemplate
              templateFields={formData.templateFields}
              fieldMetadata={templateFieldsMetadata}
              onFieldChange={handleTemplateFieldChange}
              selectedJobType={formData.selectedJobType}
              referenceImages={formData.referenceImages}
              onImagesChange={(images) => handleInputChange('referenceImages', images)}
              errors={errors}
            />
          )}

          {currentStep === 'project' && (
            <StepGeneral
              formData={formData}
              onFieldChange={handleInputChange}
              errors={errors}
            />
          )}

          {currentStep === 'recipients' && (
            <StepRecipients
              rfqType={rfqType}
              selectedVendors={formData.selectedVendors}
              allowOtherVendors={formData.allowOtherVendors}
              visibilityScope={formData.visibilityScope}
              responseLimit={formData.responseLimit}
              vendors={vendors}
              category={formData.selectedCategory}
              county={formData.county}
              onVendorToggle={(vendorId) => {
                setFormData(prev => ({
                  ...prev,
                  selectedVendors: prev.selectedVendors.includes(vendorId)
                    ? prev.selectedVendors.filter(id => id !== vendorId)
                    : [...prev.selectedVendors, vendorId]
                }));
              }}
              onAllowOthersChange={(allow) => handleInputChange('allowOtherVendors', allow)}
              onVisibilityScopeChange={(scope) => handleInputChange('visibilityScope', scope)}
              onResponseLimitChange={(limit) => handleInputChange('responseLimit', limit)}
              errors={errors}
            />
          )}

          {currentStep === 'auth' && (
            <StepAuth user={user} onUserChange={setUser} />
          )}

          {currentStep === 'review' && (
            <StepReview
              rfqType={rfqType}
              formData={formData}
              templateFieldsMetadata={templateFieldsMetadata}
              vendors={vendors}
            />
          )}
        </div>

        {/* Footer */}
        <ModalFooter
          currentStep={currentStep}
          steps={steps}
          onBack={prevStep}
          onNext={nextStep}
          onSubmit={handleSubmit}
          loading={loading}
          isValid={!Object.keys(errors).length}
        />
      </div>
    </div>
  );
}
