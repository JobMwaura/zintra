'use client';

import { useState } from 'react';
import Link from 'next/link';
import LocationSelector from '@/components/LocationSelector';
import { ALL_CATEGORIES_FLAT } from '@/lib/constructionCategories';
import AuthGuard from '../../../components/AuthGuard';
import {
  Check,
  Upload,
  X,
  Plus,
  AlertCircle,
  Shield,
  ArrowRight,
  ArrowLeft,
  Info,
  FileText,
  MapPin,
  DollarSign,
  Clock,
  Truck,
  Users,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

function PostPublicRFQContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Project Overview
    projectTitle: '',
    category: '',
    projectType: '',
    description: '',
    specifications: '',
    quantity: '',
    unit: 'units',
    timeline: '',
    startDate: '',
    completionDate: '',

    // Step 2: Budget & Payments
    budgetMin: '',
    budgetMax: '',
    paymentTerms: 'flexible',
    paymentPreference: 'flexible',
    fundsAvailable: 'immediately',

    // Step 3: Location & Site Details
    county: '',
    location: '',
    siteAccessibility: 'easy',
    multiStory: false,
    weatherExposed: false,
    restrictedAccess: false,
    accessDetails: '',
    parkingDetails: '',
    workingHours: 'standard',
    siteConditions: '',

    // Step 4: Detailed Requirements
    specifications_detailed: '',
    materialPreferences: '',
    standardsCompliance: [],
    qualityGrade: 'standard',
    warranty: '',
    includedServices: [],
    excludedItems: '',
    existingConditions: '',
    previousWork: '',

    // Step 5: Project Scope & Constraints
    scopeOfWork: '',
    deliverables: [],
    constraints: '',
    dependencies: '',
    teamSize: '',
    projectManager: '',
    contactPerson: '',
    communicationPreference: 'email',
    responseTimeExpectation: '24hours',

    // Step 6: Insurance & Compliance
    insuranceRequired: false,
    licenseRequired: false,
    permitsIncluded: false,
    safetyRequirements: '',
    specialCertifications: '',

    // Step 7: Attachments
    referenceImages: [],
    techDrawings: [],
    specifications: [],
    previousProjects: [],
    additionalDocuments: [],
    referenceLinks: '',

    // Step 8: Additional Info
    vendorPreferences: '',
    preferredVendors: '',
    additionalNotes: '',
    confidentiality: false
  });

  const [errors, setErrors] = useState({});

  const steps = [
    { number: 1, name: 'Project Overview' },
    { number: 2, name: 'Budget & Payment' },
    { number: 3, name: 'Location & Site' },
    { number: 4, name: 'Requirements' },
    { number: 5, name: 'Scope & Team' },
    { number: 6, name: 'Compliance' },
    { number: 7, name: 'Attachments' },
    { number: 8, name: 'Review' }
  ];

  // Use comprehensive categories from construction categories library
  const categories = ALL_CATEGORIES_FLAT.map(cat => cat.label);

  const projectTypes = [
    { value: 'residential', label: 'Residential', desc: 'Home, apartment, personal property' },
    { value: 'commercial', label: 'Commercial', desc: 'Office, retail, business space' },
    { value: 'industrial', label: 'Industrial', desc: 'Factory, warehouse, production' },
    { value: 'institutional', label: 'Institutional', desc: 'School, hospital, government' },
    { value: 'mixed_use', label: 'Mixed-Use', desc: 'Combination of residential/commercial' }
  ];

  const qualityGrades = [
    { value: 'economy', label: 'Economy', desc: 'Basic, functional, cost-effective' },
    { value: 'standard', label: 'Standard', desc: 'Average quality, good value' },
    { value: 'premium', label: 'Premium', desc: 'High quality, better materials' },
    { value: 'luxury', label: 'Luxury', desc: 'Finest quality, premium materials' }
  ];

  const servicesOptions = [
    'Material Supply Only',
    'Installation/Labor',
    'Design Services',
    'Delivery',
    'Maintenance/After-sales',
    'Training',
    'Warranty Coverage',
    'Site Supervision'
  ];

  const standardsOptions = [
    'ISO Standards',
    'Building Code Compliance',
    'Environmental Standards',
    'Safety Standards',
    'Industry Specific Standards'
  ];

  const deliverablesOptions = [
    'Materials Only',
    'Labor/Services Only',
    'Complete Installation',
    'Testing/Inspection Reports',
    'Warranty Documentation',
    'As-built Drawings',
    'Project Timeline',
    'Quality Certifications'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const toggleArrayItem = (arrayName, item) => {
    setFormData({
      ...formData,
      [arrayName]: formData[arrayName].includes(item)
        ? formData[arrayName].filter(i => i !== item)
        : [...formData[arrayName], item]
    });
  };

  const handleFileUpload = (e, fileType) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      setFormData({
        ...formData,
        [fileType]: [
          ...formData[fileType],
          { name: file.name, size: file.size, type: file.type, id: Math.random() }
        ]
      });
    });
  };

  const removeFile = (fileType, fileId) => {
    setFormData({
      ...formData,
      [fileType]: formData[fileType].filter(f => f.id !== fileId)
    });
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.projectTitle.trim()) newErrors.projectTitle = 'Required';
      if (!formData.category) newErrors.category = 'Required';
      if (!formData.projectType) newErrors.projectType = 'Required';
      if (!formData.description.trim()) newErrors.description = 'Required';
      if (!formData.quantity) newErrors.quantity = 'Required';
      if (!formData.timeline) newErrors.timeline = 'Required';
    }

    if (currentStep === 2) {
      if (!formData.budgetMin) newErrors.budgetMin = 'Required';
      if (!formData.budgetMax) newErrors.budgetMax = 'Required';
      if (parseInt(formData.budgetMin) > parseInt(formData.budgetMax)) {
        newErrors.budgetMax = 'Max budget must be higher than min';
      }
    }

    if (currentStep === 3) {
      if (!formData.county) newErrors.county = 'Required';
      if (!formData.location.trim()) newErrors.location = 'Required';
    }

    if (currentStep === 4) {
      if (!formData.specifications_detailed.trim()) newErrors.specifications_detailed = 'Required';
    }

    if (currentStep === 5) {
      if (!formData.scopeOfWork.trim()) newErrors.scopeOfWork = 'Required';
      if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep = (stepNumber) => {
    if (validateStep()) {
      setCurrentStep(stepNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < 8) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep()) {
      console.log('Public RFQ Data:', formData);
      alert('✅ Public RFQ published! Vendors can now see and bid on your project.');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold" style={{ color: '#ea8f1e' }}>
            zintra
          </Link>
          <div className="hidden md:flex gap-6">
            <Link href="/browse" className="text-gray-600 hover:text-gray-900">Browse Vendors</Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-8 border-b border-orange-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Post a Public RFQ
            </h1>
            <p className="text-gray-700 max-w-2xl">
              Reach all qualified vendors in the marketplace. Provide detailed information upfront so vendors can submit accurate, competitive quotes without needing to contact you for clarification.
            </p>
          </div>

          {/* Quality Notice */}
          <div className="bg-green-50 border-b border-green-200 p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">💡 Pro Tip: More detail = Better quotes</p>
                <p>The more specific information you provide, the more accurate and competitive the vendor quotes will be. This minimizes back-and-forth communication.</p>
              </div>
            </div>
          </div>

          {/* Step Indicator */}
          {/* Desktop Progress Indicator */}
          <div className="bg-white border-b border-gray-200 p-4 sm:p-6 hidden sm:block">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => goToStep(step.number)}
                      disabled={currentStep < step.number}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors cursor-pointer disabled:cursor-not-allowed`}
                      style={
                        currentStep >= step.number
                          ? { backgroundColor: '#ea8f1e', color: 'white' }
                          : { backgroundColor: '#f0f0f0', color: '#999' }
                      }
                    >
                      {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                    </button>
                    <span className="text-xs mt-2 font-medium text-gray-700 text-center max-w-16">
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className="flex-1 h-1 mx-2 transition-colors"
                      style={currentStep > step.number ? { backgroundColor: '#ea8f1e' } : { backgroundColor: '#f0f0f0' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Progress Indicator */}
          <div className="bg-orange-50 border-b border-orange-200 p-4 sm:hidden">
            <div className="text-center mb-2">
              <div className="text-base font-bold text-gray-900">
                Step {currentStep} of {steps.length}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {steps.find(s => s.number === currentStep)?.name}
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6 sm:space-y-8">
            {/* STEP 1: PROJECT OVERVIEW */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 font-bold">1</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Project Overview</h2>
                </div>

                {/* Project Title */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    name="projectTitle"
                    placeholder="e.g., Office Extension - 2 Story, Industrial Warehouse Flooring"
                    value={formData.projectTitle}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400"
                  />
                  {errors.projectTitle && <p className="text-red-500 text-sm mt-1">{errors.projectTitle}</p>}
                </div>

                {/* Category & Project Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Project Type *
                    </label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    >
                      <option value="">Select type</option>
                      {projectTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {errors.projectType && <p className="text-red-500 text-sm mt-1">{errors.projectType}</p>}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Detailed Project Description *
                  </label>
                  <textarea
                    name="description"
                    placeholder="Provide a comprehensive overview. What is the project? What's the context? What are the main objectives? What's the scope?"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="5"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400"
                  />
                  <p className="text-sm text-gray-600 mt-1">💡 Be specific about what you need and why</p>
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                {/* Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="text"
                      name="quantity"
                      placeholder="e.g., 1000, 500 sqm, 50 units"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                    {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Unit *
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    >
                      <option value="units">Units</option>
                      <option value="sqm">Square Meters</option>
                      <option value="sqft">Square Feet</option>
                      <option value="bags">Bags</option>
                      <option value="tons">Tons</option>
                      <option value="liters">Liters</option>
                      <option value="meters">Meters</option>
                      <option value="days">Days (Labor)</option>
                      <option value="hours">Hours (Labor)</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Timeline *
                    </label>
                    <select
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    >
                      <option value="">Select timeline</option>
                      <option value="urgent">Urgent (Within 1 week)</option>
                      <option value="soon">Soon (1-2 weeks)</option>
                      <option value="moderate">Moderate (2-4 weeks)</option>
                      <option value="extended">Extended (1-3 months)</option>
                      <option value="flexible">Flexible (No specific deadline)</option>
                    </select>
                    {errors.timeline && <p className="text-red-500 text-sm mt-1">{errors.timeline}</p>}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Target Completion Date
                    </label>
                    <input
                      type="date"
                      name="completionDate"
                      value={formData.completionDate}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: BUDGET & PAYMENT */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Budget & Payment Terms</h2>
                </div>

                {/* Budget Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Budget Range (KSh) *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="text-xs text-gray-600 mb-1">Minimum Budget</label>
                      <input
                        type="number"
                        name="budgetMin"
                        placeholder="e.g., 100000"
                        value={formData.budgetMin}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                      />
                      {errors.budgetMin && <p className="text-red-500 text-xs mt-1">{errors.budgetMin}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1">Maximum Budget</label>
                      <input
                        type="number"
                        name="budgetMax"
                        placeholder="e.g., 500000"
                        value={formData.budgetMax}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                      />
                      {errors.budgetMax && <p className="text-red-500 text-xs mt-1">{errors.budgetMax}</p>}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">💡 Be realistic - vendors will see this range</p>
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Preferred Payment Terms
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'upfront', label: 'Upfront Payment', desc: 'Full payment before work starts' },
                      { value: 'partial', label: 'Partial Payment (50/50)', desc: 'Half upfront, half on completion' },
                      { value: 'completion', label: 'Upon Completion', desc: 'Payment only after work is done' },
                      { value: 'monthly', label: 'Monthly Installments', desc: 'Spread payments over time' },
                      { value: 'flexible', label: 'Flexible/Negotiable', desc: 'Open to discussion' }
                    ].map(term => (
                      <label key={term.value} className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                        <input
                          type="radio"
                          name="paymentTerms"
                          value={term.value}
                          checked={formData.paymentTerms === term.value}
                          onChange={handleInputChange}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{term.label}</p>
                          <p className="text-sm text-gray-600">{term.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Funds Availability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    When are funds available?
                  </label>
                  <select
                    name="fundsAvailable"
                    value={formData.fundsAvailable}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  >
                    <option value="immediately">Immediately</option>
                    <option value="1week">Within 1 week</option>
                    <option value="2weeks">Within 2 weeks</option>
                    <option value="1month">Within 1 month</option>
                    <option value="tbd">To be determined</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3: LOCATION & SITE DETAILS */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Location & Site Details</h2>
                </div>

                {/* Location */}
                <LocationSelector
                  county={formData.county}
                  town={formData.location}
                  onCountyChange={(e) => {
                    handleInputChange({ target: { name: 'county', value: e.target.value } });
                    setErrors({ ...errors, county: '' });
                  }}
                  onTownChange={(e) => {
                    handleInputChange({ target: { name: 'location', value: e.target.value } });
                    setErrors({ ...errors, location: '' });
                  }}
                  required={true}
                  errorMessage={errors.county || errors.location}
                />

                {/* Site Accessibility */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Site Accessibility
                  </label>
                  <select
                    name="siteAccessibility"
                    value={formData.siteAccessibility}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  >
                    <option value="easy">Easy Access - Ground level, good roads</option>
                    <option value="moderate">Moderate Access - Some restrictions</option>
                    <option value="difficult">Difficult Access - Remote or restricted area</option>
                    <option value="multi_story">Multi-story building - Heights/scaffolding needed</option>
                  </select>
                </div>

                {/* Site Conditions */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Site Conditions
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                      <input
                        type="checkbox"
                        name="multiStory"
                        checked={formData.multiStory}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <span className="text-gray-900">Multi-story building</span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                      <input
                        type="checkbox"
                        name="weatherExposed"
                        checked={formData.weatherExposed}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <span className="text-gray-900">Weather-exposed site</span>
                    </label>
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                      <input
                        type="checkbox"
                        name="restrictedAccess"
                        checked={formData.restrictedAccess}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <span className="text-gray-900">Restricted access (residential/commercial)</span>
                    </label>
                  </div>
                </div>

                {/* Access Details */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Access Details & Parking
                  </label>
                  <textarea
                    name="accessDetails"
                    placeholder="Describe site access. Are there gates? Stairs? Restricted hours? Is there parking for vendor vehicles? Any security requirements?"
                    value={formData.accessDetails}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>

                {/* Working Hours */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Working Hours
                  </label>
                  <select
                    name="workingHours"
                    value={formData.workingHours}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  >
                    <option value="standard">Standard (8am - 5pm, Mon-Fri)</option>
                    <option value="extended">Extended (7am - 6pm, Mon-Fri)</option>
                    <option value="weekends">Weekends allowed</option>
                    <option value="flexible">Flexible - 24/7 access</option>
                    <option value="restricted">Restricted hours - Specify in notes</option>
                  </select>
                </div>

                {/* Site Conditions Description */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Current Site Conditions
                  </label>
                  <textarea
                    name="siteConditions"
                    placeholder="Describe current conditions. Is the site under construction? Occupied? Any hazards? Is utilities access available?"
                    value={formData.siteConditions}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* STEP 4: DETAILED REQUIREMENTS */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Detailed Requirements</h2>
                </div>

                {/* Detailed Specifications */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Detailed Specifications & Requirements *
                  </label>
                  <textarea
                    name="specifications_detailed"
                    placeholder="List all specific requirements. Examples:
- Material type, grade, brand preferences
- Dimensions, measurements, capacity
- Performance standards, features needed
- Color, finish, style preferences
- Certifications required
- Compatibility requirements"
                    value={formData.specifications_detailed}
                    onChange={handleInputChange}
                    rows="6"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400"
                  />
                  {errors.specifications_detailed && <p className="text-red-500 text-sm mt-1">{errors.specifications_detailed}</p>}
                </div>

                {/* Material Preferences */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Material/Brand Preferences
                  </label>
                  <textarea
                    name="materialPreferences"
                    placeholder="Any preferred brands, materials, or suppliers? (e.g., Prefer Nakumatt for building materials, must be certified)"
                    value={formData.materialPreferences}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>

                {/* Quality Grade */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Quality Grade
                  </label>
                  <div className="space-y-3">
                    {qualityGrades.map(grade => (
                      <label key={grade.value} className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                        <input
                          type="radio"
                          name="qualityGrade"
                          value={grade.value}
                          checked={formData.qualityGrade === grade.value}
                          onChange={handleInputChange}
                          className="mt-1 mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{grade.label}</p>
                          <p className="text-sm text-gray-600">{grade.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Warranty & Guarantees */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Warranty & Guarantees Required
                  </label>
                  <input
                    type="text"
                    name="warranty"
                    placeholder="e.g., 1 year parts warranty, 5 year structural guarantee, on-site support"
                    value={formData.warranty}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>

                {/* Standards Compliance */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Standards & Compliance Required
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {standardsOptions.map(standard => (
                      <label key={standard} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                        <input
                          type="checkbox"
                          checked={formData.standardsCompliance.includes(standard)}
                          onChange={() => toggleArrayItem('standardsCompliance', standard)}
                          className="mr-3"
                        />
                        <span className="text-gray-900">{standard}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Services Included */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Services/Support Included
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {servicesOptions.map(service => (
                      <label key={service} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                        <input
                          type="checkbox"
                          checked={formData.includedServices.includes(service)}
                          onChange={() => toggleArrayItem('includedServices', service)}
                          className="mr-3"
                        />
                        <span className="text-gray-900">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Excluded Items */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    What's NOT Included (What vendor should NOT include in quote)
                  </label>
                  <textarea
                    name="excludedItems"
                    placeholder="Specify what should NOT be included in the vendor's quote. E.g., site clearing, permits, architectural design, etc."
                    value={formData.excludedItems}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>

                {/* Previous Work */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Related Previous Work Done
                  </label>
                  <textarea
                    name="previousWork"
                    placeholder="Describe any previous work that's relevant. This helps vendors understand the context and current state."
                    value={formData.previousWork}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* STEP 5: SCOPE & TEAM */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Project Scope & Team</h2>
                </div>

                {/* Scope of Work */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Detailed Scope of Work *
                  </label>
                  <textarea
                    name="scopeOfWork"
                    placeholder="Define exactly what the vendor needs to do:
- Step-by-step breakdown
- What's included
- What's excluded
- Any critical success factors"
                    value={formData.scopeOfWork}
                    onChange={handleInputChange}
                    rows="5"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 placeholder-gray-400"
                  />
                  {errors.scopeOfWork && <p className="text-red-500 text-sm mt-1">{errors.scopeOfWork}</p>}
                </div>

                {/* Deliverables */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Expected Deliverables
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deliverablesOptions.map(deliverable => (
                      <label key={deliverable} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                        <input
                          type="checkbox"
                          checked={formData.deliverables.includes(deliverable)}
                          onChange={() => toggleArrayItem('deliverables', deliverable)}
                          className="mr-3"
                        />
                        <span className="text-gray-900">{deliverable}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Constraints */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Project Constraints & Risks
                  </label>
                  <textarea
                    name="constraints"
                    placeholder="Any constraints vendors should know about? E.g., noise restrictions, limited working space, traffic, weather sensitivity"
                    value={formData.constraints}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>

                {/* Dependencies */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Project Dependencies
                  </label>
                  <textarea
                    name="dependencies"
                    placeholder="Are there other contractors or tasks that need to be done first? E.g., 'Foundation must cure for 7 days before proceeding'"
                    value={formData.dependencies}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>

                {/* Team Size */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Team Size Required
                  </label>
                  <select
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  >
                    <option value="">Select team size</option>
                    <option value="1">1 person (solo work)</option>
                    <option value="2-3">2-3 people</option>
                    <option value="4-5">4-5 people</option>
                    <option value="6-10">6-10 people</option>
                    <option value="10+">10+ people (large team)</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Primary Contact Person *
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      placeholder="Full name"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                    {errors.contactPerson && <p className="text-red-500 text-sm mt-1">{errors.contactPerson}</p>}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Communication Preference
                    </label>
                    <select
                      name="communicationPreference"
                      value={formData.communicationPreference}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="platform">Zintra Platform Only</option>
                    </select>
                  </div>
                </div>

                {/* Response Time */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Response Time Expectation for Vendors
                  </label>
                  <select
                    name="responseTimeExpectation"
                    value={formData.responseTimeExpectation}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  >
                    <option value="2hours">ASAP (within 2 hours)</option>
                    <option value="6hours">Quick (within 6 hours)</option>
                    <option value="24hours">Standard (within 24 hours)</option>
                    <option value="48hours">Flexible (within 48 hours)</option>
                    <option value="flexible">Open timeframe</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 6: COMPLIANCE */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Insurance & Compliance</h2>
                </div>

                {/* Insurance */}
                <div className="space-y-3">
                  <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                    <input
                      type="checkbox"
                      name="insuranceRequired"
                      checked={formData.insuranceRequired}
                      onChange={handleInputChange}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Insurance Required</p>
                      <p className="text-sm text-gray-600">Vendor must have valid insurance coverage</p>
                    </div>
                  </label>

                  <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                    <input
                      type="checkbox"
                      name="licenseRequired"
                      checked={formData.licenseRequired}
                      onChange={handleInputChange}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">License/Certification Required</p>
                      <p className="text-sm text-gray-600">Vendor must have relevant professional licenses</p>
                    </div>
                  </label>

                  <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                    <input
                      type="checkbox"
                      name="permitsIncluded"
                      checked={formData.permitsIncluded}
                      onChange={handleInputChange}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Permits & Approvals Included</p>
                      <p className="text-sm text-gray-600">Vendor responsible for obtaining necessary permits</p>
                    </div>
                  </label>
                </div>

                {/* Safety Requirements */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Safety Requirements
                  </label>
                  <textarea
                    name="safetyRequirements"
                    placeholder="Any specific safety standards or requirements? E.g., must follow OSHA guidelines, site safety induction required, PPE standards"
                    value={formData.safetyRequirements}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>

                {/* Special Certifications */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Special Certifications or Qualifications
                  </label>
                  <textarea
                    name="specialCertifications"
                    placeholder="Any special certifications needed? E.g., electrical installations - must be certified by EBK, plumbing - must be licensed plumber"
                    value={formData.specialCertifications}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>

                {/* Compliance Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">💡 Why this matters:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Clear requirements help vendors understand your expectations</li>
                        <li>Insurance and licensing reduce your risk</li>
                        <li>Safety requirements protect everyone on site</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: ATTACHMENTS */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Attachments & References</h2>
                </div>

                {/* Reference Images */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Reference Images
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-orange-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'referenceImages')}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label htmlFor="imageUpload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-700 font-medium">Click to upload images</p>
                      <p className="text-gray-500 text-sm">or drag and drop</p>
                      <p className="text-gray-400 text-xs mt-1">PNG, JPG up to 5MB each</p>
                    </label>
                  </div>
                  {formData.referenceImages.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.referenceImages.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile('referenceImages', file.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Technical Drawings */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Technical Drawings/Plans
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-orange-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.dwg,.dxf,.cad,.jpg,.png"
                      onChange={(e) => handleFileUpload(e, 'techDrawings')}
                      className="hidden"
                      id="drawingsUpload"
                    />
                    <label htmlFor="drawingsUpload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-700 font-medium">Click to upload drawings</p>
                      <p className="text-gray-500 text-sm">or drag and drop</p>
                      <p className="text-gray-400 text-xs mt-1">PDF, DWG, CAD files up to 10MB</p>
                    </label>
                  </div>
                  {formData.techDrawings.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.techDrawings.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile('techDrawings', file.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Specifications Documents */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Specifications & Documents
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-orange-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={(e) => handleFileUpload(e, 'specifications')}
                      className="hidden"
                      id="specsUpload"
                    />
                    <label htmlFor="specsUpload" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-700 font-medium">Click to upload documents</p>
                      <p className="text-gray-500 text-sm">or drag and drop</p>
                      <p className="text-gray-400 text-xs mt-1">PDF, DOC, XLSX up to 10MB</p>
                    </label>
                  </div>
                  {formData.specifications.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.specifications.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile('specifications', file.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reference Links */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Reference Links
                  </label>
                  <input
                    type="text"
                    name="referenceLinks"
                    placeholder="Comma-separated URLs to products, inspiration, or relevant information"
                    value={formData.referenceLinks}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                    Additional Notes for Vendors
                  </label>
                  <textarea
                    name="additionalNotes"
                    placeholder="Any final information or context vendors should know?"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-3 sm:px-4 py-3 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* STEP 8: REVIEW */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Review Your RFQ</h2>
                </div>

                {/* Summary Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3">Project</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-gray-700">Title</dt>
                        <dd className="text-gray-600">{formData.projectTitle}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Category</dt>
                        <dd className="text-gray-600">{formData.category}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Type</dt>
                        <dd className="text-gray-600">{formData.projectType}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Quantity</dt>
                        <dd className="text-gray-600">{formData.quantity} {formData.unit}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3">Budget & Timeline</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-gray-700">Budget Range</dt>
                        <dd className="text-gray-600">KSh {formData.budgetMin} - {formData.budgetMax}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Timeline</dt>
                        <dd className="text-gray-600">{formData.timeline}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Payment Terms</dt>
                        <dd className="text-gray-600">{formData.paymentTerms}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Target Date</dt>
                        <dd className="text-gray-600">{formData.completionDate || 'Not specified'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-gray-700">County</dt>
                        <dd className="text-gray-600">{formData.county}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Location</dt>
                        <dd className="text-gray-600">{formData.location}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Accessibility</dt>
                        <dd className="text-gray-600">{formData.siteAccessibility}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-3">Attachments</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-gray-700">Images</dt>
                        <dd className="text-gray-600">{formData.referenceImages.length} uploaded</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Drawings</dt>
                        <dd className="text-gray-600">{formData.techDrawings.length} uploaded</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-700">Documents</dt>
                        <dd className="text-gray-600">{formData.specifications.length} uploaded</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Key Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-900">
                      <p className="font-semibold mb-2">✅ Your RFQ is ready to publish!</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Will be visible to all qualified vendors in the marketplace</li>
                        <li>Vendors can submit competitive quotes 24/7</li>
                        <li>You'll receive notifications as vendors respond</li>
                        <li>You can compare all quotes side-by-side</li>
                        <li>You can communicate with vendors directly through the platform</li>
                        <li>You can edit or close the RFQ anytime</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Confidentiality */}
                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-orange-50">
                  <input
                    type="checkbox"
                    name="confidentiality"
                    checked={formData.confidentiality}
                    onChange={handleInputChange}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Mark as Confidential</p>
                    <p className="text-sm text-gray-600">Only vendors you explicitly invite can see this RFQ (if you change your mind)</p>
                  </div>
                </label>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 mt-8 pt-6 border-t border-gray-200">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors w-full sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              {currentStep < 8 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 text-white rounded-lg hover:opacity-90 font-medium transition-opacity w-full sm:w-auto sm:ml-auto"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-white rounded-lg hover:opacity-90 font-semibold text-base sm:text-lg transition-opacity w-full sm:w-auto sm:ml-auto"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Publish to Marketplace
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PostPublicRFQ() {
  return (
    <AuthGuard>
      <PostPublicRFQContent />
    </AuthGuard>
  );
}