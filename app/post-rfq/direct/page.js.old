'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Check, ArrowRight, ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import LocationSelector from '@/components/LocationSelector';
import TemplateFieldRenderer from '@/components/TemplateFieldRenderer';
import {
  getAllCategories,
  getJobTypesForCategory,
  getFieldsForJobType,
  categoryRequiresJobType,
} from '@/lib/rfqTemplateUtils';

export default function DirectRFQ() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Basic form data
  const [formData, setFormData] = useState({
    projectTitle: '',
    category: '',
    jobType: '', // Job type within the category
    description: '',
    budget_min: '',
    budget_max: '',
    urgency: 'flexible',
    county: '',
    location: '',
    deadline: '',
    paymentTerms: 'upon_completion',
  });

  // Category-specific template fields
  const [templateFields, setTemplateFields] = useState({});
  
  // UI state
  const [categories, setCategories] = useState([]);
  const [jobTypes, setJobTypes] = useState([]);
  const [currentJobTypeFields, setCurrentJobTypeFields] = useState([]);
  const [templateErrors, setTemplateErrors] = useState({});
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [categoryNeedsJobType, setCategoryNeedsJobType] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const steps = [
    { number: 1, name: 'Project Basics' },
    { number: 2, name: 'Details' },
    { number: 3, name: 'Location' },
    { number: 4, name: 'Select Vendors' },
    { number: 5, name: 'Review' }
  ];

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingTemplates(true);
      const cats = await getAllCategories();
      setCategories(cats);
      setLoadingTemplates(false);
    };
    loadCategories();
  }, []);

  // Load vendors on mount
  useEffect(() => {
    const fetchVendors = async () => {
      const { data } = await supabase.from('vendors').select('id, company_name, location, category');
      if (data) setVendors(data);
    };
    fetchVendors();
  }, []);

  // Load job types when category changes
  useEffect(() => {
    const loadJobTypes = async () => {
      if (!formData.category) {
        setJobTypes([]);
        setCurrentJobTypeFields([]);
        setCategoryNeedsJobType(false);
        setFormData(prev => ({ ...prev, jobType: '' }));
        return;
      }

      const needsJobType = await categoryRequiresJobType(formData.category);
      setCategoryNeedsJobType(needsJobType);

      if (needsJobType) {
        const jts = await getJobTypesForCategory(formData.category);
        setJobTypes(jts);
        setFormData(prev => ({ ...prev, jobType: '' }));
        setCurrentJobTypeFields([]);
      } else {
        // Single job type category - load its fields immediately
        const fields = await getFieldsForJobType(formData.category);
        setCurrentJobTypeFields(fields || []);
        setJobTypes([]);
      }

      // Reset template fields when category changes
      setTemplateFields({});
      setTemplateErrors({});
    };

    loadJobTypes();
  }, [formData.category]);

  // Load template fields when job type changes
  useEffect(() => {
    const loadTemplateFields = async () => {
      if (!formData.category) return;

      let fields;
      if (categoryNeedsJobType && !formData.jobType) {
        fields = [];
      } else {
        fields = await getFieldsForJobType(formData.category, formData.jobType);
      }

      setCurrentJobTypeFields(fields || []);
      setTemplateFields({});
      setTemplateErrors({});
    };

    loadTemplateFields();
  }, [formData.jobType, formData.category, categoryNeedsJobType]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({ ...formData, [parent]: { ...formData[parent], [child]: value } });
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const handleTemplateFieldChange = (fieldName, value) => {
    setTemplateFields(prev => ({ ...prev, [fieldName]: value }));
    if (templateErrors[fieldName]) {
      setTemplateErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.projectTitle.trim()) newErrors.projectTitle = 'Required';
      if (!formData.category) newErrors.category = 'Required';
      if (!formData.description.trim()) newErrors.description = 'Required';
      if (!formData.budget_min) newErrors.budget_min = 'Required';
      if (!formData.budget_max) newErrors.budget_max = 'Required';
      if (formData.budget_min && formData.budget_max && parseInt(formData.budget_min) > parseInt(formData.budget_max)) {
        newErrors.budget_min = 'Min budget must be less than max';
      }
      if (!formData.urgency) newErrors.urgency = 'Required';

      // Validate job type if needed
      if (categoryNeedsJobType && !formData.jobType) {
        newErrors.jobType = 'Required';
      }
    }

    if (currentStep === 2) {
      // Validate template-specific fields
      currentJobTypeFields.forEach(field => {
        const value = templateFields[field.name];
        if (field.required && (value === '' || value === undefined || value === null)) {
          newErrors[field.name] = 'Required';
        }
      });
    }

    if (currentStep === 3) {
      if (!formData.county) newErrors.county = 'Required';
      if (!formData.location.trim()) newErrors.location = 'Required';
    }

    if (currentStep === 4) {
      if (selectedVendors.length === 0) newErrors.selectedVendors = 'Select at least one vendor';
    }

    setErrors(newErrors);
    setTemplateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleVendorSelect = (vendorId) => {
    setSelectedVendors(prev => prev.includes(vendorId) ? prev.filter(id => id !== vendorId) : [...prev, vendorId]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrors({ auth: 'Please log in first' });
        setLoading(false);
        return;
      }

      // Prepare RFQ data
      const rfqData = {
        user_id: user.id,
        buyer_id: user.id,
        title: formData.projectTitle,
        description: formData.description,
        category: formData.category,
        job_type: formData.jobType || null,
        location: formData.location,
        county: formData.county,
        budget_min: parseInt(formData.budget_min) || null,
        budget_max: parseInt(formData.budget_max) || null,
        timeline: formData.urgency,
        payment_terms: formData.paymentTerms,
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        rfq_type: 'direct',
        visibility: 'private',
        status: 'open',
        created_at: new Date(),
        published_at: new Date(),
        // Store category-specific template fields as JSON
        details: Object.keys(templateFields).length > 0 ? templateFields : null,
      };

      const { data: insertedRfq, error: rfqError } = await supabase
        .from('rfqs')
        .insert([rfqData])
        .select();

      if (rfqError) throw rfqError;

      if (insertedRfq && insertedRfq[0]) {
        const rfqId = insertedRfq[0].id;

        if (selectedVendors.length > 0) {
          const { error: recipientError } = await supabase
            .from('rfq_recipients')
            .insert(selectedVendors.map(vendorId => ({ rfq_id: rfqId, vendor_id: vendorId, recipient_type: 'direct' })));
          if (recipientError) throw recipientError;
        }

        setSuccess(true);
        setTimeout(() => router.push(`/rfq/${rfqId}`), 2000);
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to create RFQ' });
    } finally {
      setLoading(false);
    }
  };

  if (loadingTemplates) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <Check className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-900 mb-2">RFQ Sent Successfully!</h2>
          <p className="text-green-700 mb-4">Your RFQ has been sent to {selectedVendors.length} vendor(s)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#ea8f1e' }}>zintra</Link>
          <div className="hidden md:flex gap-6">
            <Link href="/browse" className="text-gray-600 hover:text-gray-900">Browse Vendors</Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#5f6466' }}>Send Direct RFQ</h1>
          <p className="text-center text-gray-600 mb-8">Select specific vendors and send them your project request directly</p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Direct RFQ Benefits</p>
                <p>Send your project details directly to specific vendors you've chosen. You control who receives your request.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-12">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => currentStep === step.number || (validateStep() && setCurrentStep(step.number))}
                    disabled={currentStep < step.number}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-600`}
                    style={currentStep >= step.number ? { backgroundColor: '#ea8f1e', color: 'white' } : {}}
                  >
                    {currentStep > step.number ? <Check className="w-6 h-6" /> : step.number}
                  </button>
                  <span className="text-xs mt-2 font-medium text-gray-700 text-center max-w-20">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 transition-colors ${currentStep > step.number ? '' : 'bg-gray-200'}`}
                    style={currentStep > step.number ? { backgroundColor: '#ea8f1e' } : {}} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* ========== STEP 1: Project Basics ========== */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 1: Project Basics</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                  <input
                    type="text"
                    name="projectTitle"
                    placeholder="e.g., Kitchen Renovation"
                    value={formData.projectTitle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                  {errors.projectTitle && <p className="text-red-500 text-sm mt-1">{errors.projectTitle}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.slug} value={cat.label}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                {/* Job Type Selection (if category requires it) */}
                {categoryNeedsJobType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Type *</label>
                    <select
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    >
                      <option value="">Select a job type</option>
                      {jobTypes.map(jt => (
                        <option key={jt.slug} value={jt.label}>
                          {jt.label}
                        </option>
                      ))}
                    </select>
                    {errors.jobType && <p className="text-red-500 text-sm mt-1">{errors.jobType}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Description *</label>
                  <textarea
                    name="description"
                    placeholder="Describe your project..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Budget (KSh) *</label>
                    <input
                      type="number"
                      name="budget_min"
                      placeholder="e.g., 50000"
                      value={formData.budget_min}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                    {errors.budget_min && <p className="text-red-500 text-sm mt-1">{errors.budget_min}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Budget (KSh) *</label>
                    <input
                      type="number"
                      name="budget_max"
                      placeholder="e.g., 500000"
                      value={formData.budget_max}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                    {errors.budget_max && <p className="text-red-500 text-sm mt-1">{errors.budget_max}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency *</label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  >
                    <option value="urgent">Urgent (Within 1 week)</option>
                    <option value="soon">Soon (1-2 weeks)</option>
                    <option value="moderate">Moderate (2-4 weeks)</option>
                    <option value="flexible">Flexible (No deadline)</option>
                  </select>
                  {errors.urgency && <p className="text-red-500 text-sm mt-1">{errors.urgency}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quote Deadline (Optional)</label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* ========== STEP 2: Category-Specific Details ========== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Step 2: {formData.category} Details
                </h2>

                {currentJobTypeFields && currentJobTypeFields.length > 0 ? (
                  <div className="space-y-6">
                    {currentJobTypeFields.map(field => (
                      <TemplateFieldRenderer
                        key={field.name}
                        field={field}
                        value={templateFields[field.name]}
                        onChange={handleTemplateFieldChange}
                        error={templateErrors[field.name]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-600">
                      {categoryNeedsJobType && !formData.jobType
                        ? 'Please select a job type in the previous step to see specific fields.'
                        : 'No additional fields required for this category.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ========== STEP 3: Location ========== */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 3: Location & Site Details</h2>
                
                <LocationSelector
                  county={formData.county}
                  town={formData.location}
                  onCountyChange={(e) => {
                    setFormData({ ...formData, county: e.target.value });
                    setErrors({ ...errors, county: '' });
                  }}
                  onTownChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    setErrors({ ...errors, location: '' });
                  }}
                  required={true}
                  errorMessage={errors.county || errors.location}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  >
                    <option value="upfront">Upfront Payment</option>
                    <option value="upon_completion">Upon Completion</option>
                    <option value="partial">Partial (50/50)</option>
                    <option value="monthly">Monthly Installments</option>
                    <option value="flexible">Flexible/Negotiable</option>
                  </select>
                </div>
              </div>
            )}

            {/* ========== STEP 4: Select Vendors ========== */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 4: Select Vendors</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-900 text-sm"><strong>Choose vendors</strong> to send this RFQ to directly.</p>
                </div>

                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />

                {vendors.length === 0 ? (
                  <div className="text-center py-8 bg-blue-50 rounded-lg">
                    <p className="text-blue-700 font-semibold">No vendors available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vendors.filter(v => vendorSearch === '' || v.company_name?.toLowerCase().includes(vendorSearch.toLowerCase()) || v.location?.toLowerCase().includes(vendorSearch.toLowerCase())).map(vendor => (
                      <label key={vendor.id} className="flex items-start gap-3 p-4 border border-gray-300 rounded-lg hover:bg-orange-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedVendors.includes(vendor.id)}
                          onChange={() => handleVendorSelect(vendor.id)}
                          className="mt-1 w-4 h-4"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">{vendor.company_name}</p>
                          <p className="text-sm text-gray-600">{vendor.location}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {errors.selectedVendors && <p className="text-red-500 text-sm">{errors.selectedVendors}</p>}
                {selectedVendors.length > 0 && <div className="p-3 bg-green-50 border border-green-200 rounded-lg"><p className="text-green-700 font-semibold">{selectedVendors.length} vendor(s) selected</p></div>}
              </div>
            )}

            {/* ========== STEP 5: Review ========== */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Step 5: Review Your RFQ</h2>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3"><span className="text-orange-600">✓</span> Project Details</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-gray-700">Title</dt>
                        <dd className="text-gray-600">{formData.projectTitle}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Category</dt>
                        <dd className="text-gray-600">
                          {formData.category}
                          {formData.jobType && ` > ${formData.jobType}`}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Budget</dt>
                        <dd className="text-gray-600">KSh {parseInt(formData.budget_min).toLocaleString()} - {parseInt(formData.budget_max).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Location</dt>
                        <dd className="text-gray-600">{formData.location}, {formData.county}</dd>
                      </div>
                    </dl>
                  </div>

                  {Object.keys(templateFields).length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-3"><span className="text-orange-600">✓</span> Category-Specific Details</h3>
                      <dl className="space-y-2 text-sm">
                        {Object.entries(templateFields).map(([key, value]) => {
                          const field = currentJobTypeFields.find(f => f.name === key);
                          return (
                            <div key={key}>
                              <dt className="font-medium text-gray-700">{field?.label || key}</dt>
                              <dd className="text-gray-600">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    </div>
                  )}

                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3"><span className="text-orange-600">✓</span> Recipients</h3>
                    <p className="text-sm text-gray-600 mb-3"><strong>{selectedVendors.length}</strong> vendor(s) will receive this RFQ</p>
                    <ul className="space-y-1 text-sm">
                      {vendors.filter(v => selectedVendors.includes(v.id)).map(v => <li key={v.id} className="text-gray-600">• {v.company_name}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-900 text-sm"><strong>Ready to send?</strong> Vendors will be notified and can submit quotes directly to you.</p>
                </div>

                {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}
              </div>
            )}

            {/* Form Navigation */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              {currentStep < 5 ? (
                <button type="button" onClick={nextStep} className="ml-auto flex items-center gap-2 px-6 py-2 text-white rounded-lg hover:opacity-90" style={{ backgroundColor: '#ea8f1e' }}>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={loading} className="ml-auto px-8 py-2 text-white rounded-lg hover:opacity-90 font-semibold disabled:bg-gray-400" style={!loading ? { backgroundColor: '#ea8f1e' } : {}}>
                  {loading ? 'Sending...' : 'Send RFQ'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
