'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, Upload, X, Plus, AlertCircle, Lock, Shield, UserCheck } from 'lucide-react';

export default function PostRFQ() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isVerified, setIsVerified] = useState(true);
  const [userReputation, setUserReputation] = useState('new');
  const [rfqsThisMonth, setRfqsThisMonth] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    projectTitle: '',
    category: '',
    description: '',
    timeline: '',
    budgetRange: '',
    customBudgetMin: '',
    customBudgetMax: '',
    projectType: '',
    urgency: 'flexible',
    materialRequirements: '',
    dimensions: { length: '', width: '', height: '' },
    additionalMeasurements: '',
    qualityPreference: '',
    ecoFriendly: false,
    budgetFriendly: false,
    premiumQuality: false,
    additionalSpecs: '',
    servicesRequired: [],
    county: '',
    specificLocation: '',
    locationDetails: '',
    siteAccessibility: 'easy',
    multiStory: false,
    requiresEquipment: false,
    deliveryPreference: 'pickup',
    referenceImages: [],
    documents: [],
    referenceLinks: '',
    additionalNotes: '',
    confirmGenuine: false,
    agreedToTerms: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // TODO: Replace with actual auth check
  }, []);

  const getRfqLimit = () => {
    switch(userReputation) {
      case 'new': return 3;
      case 'bronze': return 5;
      case 'silver': return 10;
      case 'gold': return 999;
      default: return 3;
    }
  };

  const rfqLimit = getRfqLimit();
  const rfqsRemaining = rfqLimit - rfqsThisMonth;

  const steps = [
    { number: 1, name: 'Project Basics' },
    { number: 2, name: 'Specifications' },
    { number: 3, name: 'Location' },
    { number: 4, name: 'Attachments' },
    { number: 5, name: 'Review' }
  ];

  const categories = [
    'Building & Structural Materials',
    'Wood & Timber Solutions',
    'Roofing & Waterproofing',
    'Doors, Windows & Hardware',
    'Flooring & Wall Finishes',
    'Plumbing & Sanitation',
    'Electrical & Lighting',
    'Kitchen & Interior Fittings',
    'HVAC & Climate Solutions'
  ];

  const budgetRanges = [
    'Under KSh 50,000',
    'KSh 50,000 - 100,000',
    'KSh 100,000 - 500,000',
    'KSh 500,000 - 1,000,000',
    'Over KSh 1,000,000',
    'Custom Range'
  ];

  const projectTypes = [
    { value: 'residential', label: 'Residential', desc: 'Home, apartment, or personal property' },
    { value: 'commercial', label: 'Commercial', desc: 'Office, retail, or business space' },
    { value: 'industrial', label: 'Industrial', desc: 'Factory, warehouse, or production facility' },
    { value: 'institutional', label: 'Institutional', desc: 'School, hospital, or government building' }
  ];

  const services = [
    'Material Supply Only',
    'Installation/Labor',
    'Delivery',
    'Design Services',
    'Maintenance/Warranty',
    'Consultation'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleDimensionChange = (dimension, value) => {
    setFormData({
      ...formData,
      dimensions: { ...formData.dimensions, [dimension]: value }
    });
  };

  const handleServiceToggle = (service) => {
    const services = formData.servicesRequired.includes(service)
      ? formData.servicesRequired.filter(s => s !== service)
      : [...formData.servicesRequired, service];
    setFormData({ ...formData, servicesRequired: services });
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'images') {
      setFormData({
        ...formData,
        referenceImages: [...formData.referenceImages, ...files].slice(0, 6)
      });
    } else if (type === 'documents') {
      setFormData({
        ...formData,
        documents: [...formData.documents, ...files]
      });
    }
  };

  const removeFile = (index, type) => {
    if (type === 'images') {
      setFormData({
        ...formData,
        referenceImages: formData.referenceImages.filter((_, i) => i !== index)
      });
    } else if (type === 'documents') {
      setFormData({
        ...formData,
        documents: formData.documents.filter((_, i) => i !== index)
      });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.projectTitle.trim()) newErrors.projectTitle = 'Project title is required';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    } else if (formData.description.trim().length < 100) {
      newErrors.description = 'Please provide at least 100 characters of description for better quotes';
    }
    if (!formData.timeline) newErrors.timeline = 'Please select a timeline';
    if (!formData.budgetRange) newErrors.budgetRange = 'Please select a budget range';
    if (formData.budgetRange === 'Custom Range' && (!formData.customBudgetMin || !formData.customBudgetMax)) {
      newErrors.customBudget = 'Please enter both minimum and maximum budget';
    }
    if (!formData.projectType) newErrors.projectType = 'Please select a project type';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.county) newErrors.county = 'County is required';
    if (!formData.specificLocation.trim()) newErrors.specificLocation = 'Specific location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = () => {
    const newErrors = {};
    if (!formData.confirmGenuine) newErrors.confirmGenuine = 'Please confirm this is a genuine request';
    if (!formData.agreedToTerms) newErrors.agreedToTerms = 'Please agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 3 && !validateStep3()) return;
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (!validateStep5()) return;
    console.log('RFQ Submitted:', formData);
    if (userReputation === 'new' && rfqsThisMonth === 0) {
      setCurrentStep(7);
    } else {
      setCurrentStep(6);
    }
  };

  // Login Gate
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center">
                <img src="/zintra-svg-logo.svg" alt="Zintra" className="h-8 w-auto" />
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
                <Link href="/browse" className="text-gray-700 hover:text-gray-900 font-medium">Browse</Link>
                <Link href="/post-rfq" className="font-medium" style={{ color: '#ea8f1e' }}>Post RFQ</Link>
                <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">About</Link>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/login?returnUrl=/post-rfq">
                  <button className="text-gray-700 hover:text-gray-900 font-medium">Login</button>
                </Link>
                <Link href="/user-registration?returnUrl=/post-rfq">
                  <button className="text-white px-4 py-2 rounded-lg font-medium hover:opacity-90" style={{ backgroundColor: '#ea8f1e' }}>
                    Sign Up
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#fef3e2' }}>
              <Lock className="w-10 h-10" style={{ color: '#ea8f1e' }} />
            </div>
            <h1 className="text-3xl font-bold mb-4" style={{ color: '#5f6466' }}>Sign In Required</h1>
            <p className="text-gray-600 mb-8">You need to create an account or sign in to submit a Request for Quotation (RFQ). This helps us ensure quality for our vendors and protect against abuse.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900 mb-2">Why do I need to sign in?</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Ensures vendors receive genuine requests only</li>
                    <li>✓ Allows you to track your RFQs and quotes</li>
                    <li>✓ Enables direct communication with vendors</li>
                    <li>✓ Builds your reputation for future projects</li>
                    <li>✓ Free to create an account</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Link href="/user-registration?returnUrl=/post-rfq">
                <button className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#ea8f1e' }}>
                  Create Free Account
                </button>
              </Link>
              <Link href="/login?returnUrl=/post-rfq">
                <button className="w-full py-3 border-2 rounded-lg font-semibold hover:bg-gray-50" style={{ borderColor: '#ea8f1e', color: '#ea8f1e' }}>
                  Sign In
                </button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Already have an account? <Link href="/login?returnUrl=/post-rfq" className="hover:underline" style={{ color: '#ea8f1e' }}>Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Verification Gate
  if (isLoggedIn && !isVerified) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center">
                <img src="/zintra-svg-logo.svg" alt="Zintra" className="h-8 w-auto" />
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
                <Link href="/browse" className="text-gray-700 hover:text-gray-900 font-medium">Browse</Link>
                <Link href="/post-rfq" className="font-medium" style={{ color: '#ea8f1e' }}>Post RFQ</Link>
                <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">About</Link>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</Link>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome!</span>
                <button className="text-gray-700 hover:text-gray-900 font-medium">Logout</button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#fef3e2' }}>
              <UserCheck className="w-10 h-10" style={{ color: '#ea8f1e' }} />
            </div>
            <h1 className="text-3xl font-bold mb-4" style={{ color: '#5f6466' }}>Verify Your Account</h1>
            <p className="text-gray-600 mb-8">Please verify your phone number or email address to submit RFQs. This quick step helps protect our vendors from spam.</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-yellow-800">
                <strong>One-time verification:</strong> You only need to do this once. After verification, you can submit RFQs anytime.
              </p>
            </div>
            <button 
              onClick={() => setIsVerified(true)}
              className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90 mb-4" 
              style={{ backgroundColor: '#ea8f1e' }}
            >
              Verify Phone Number
            </button>
            <button className="w-full py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
              Verify Email Instead
            </button>
          </div>
        </div>
      </div>
    );
  }
  // RFQ Limit Gate
  if (rfqsRemaining <= 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center">
                <img src="/zintra-svg-logo.svg" alt="Zintra" className="h-8 w-auto" />
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
                <Link href="/browse" className="text-gray-700 hover:text-gray-900 font-medium">Browse</Link>
                <Link href="/post-rfq" className="font-medium" style={{ color: '#ea8f1e' }}>Post RFQ</Link>
                <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">About</Link>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</Link>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome!</span>
                <button className="text-gray-700 hover:text-gray-900 font-medium">Logout</button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4" style={{ color: '#5f6466' }}>Monthly RFQ Limit Reached</h1>
            <p className="text-gray-600 mb-6">You've submitted {rfqLimit} RFQs this month (your current limit). Your limit will reset on the 1st of next month.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto mb-8 text-left">
              <p className="font-semibold text-blue-900 mb-3">How to increase your limit:</p>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>✓ Complete your current projects to build reputation</li>
                <li>✓ Bronze users (1-2 completed projects): 5 RFQs/month</li>
                <li>✓ Silver users (3-5 completed projects): 10 RFQs/month</li>
                <li>✓ Gold users (6+ completed projects): Unlimited</li>
              </ul>
            </div>
            <div className="space-y-3">
              <Link href="/browse">
                <button className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#ea8f1e' }}>
                  Browse Vendors Instead
                </button>
              </Link>
              <button className="w-full py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50">
                Contact Support for Limit Increase
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              Current reputation: <span className="font-semibold capitalize">{userReputation}</span> • Next reset: 1st of next month
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main RFQ Form
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img src="/zintra-svg-logo.svg" alt="Zintra" className="h-8 w-auto" />
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
              <Link href="/browse" className="text-gray-700 hover:text-gray-900 font-medium">Browse</Link>
              <Link href="/post-rfq" className="font-medium" style={{ color: '#ea8f1e' }}>Post RFQ</Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#fef3e2', color: '#ea8f1e' }}>
                  {rfqsRemaining} RFQs remaining
                </div>
                <span className="text-gray-700">Welcome!</span>
              </div>
              <button className="text-gray-700 hover:text-gray-900 font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#5f6466' }}>Submit a Request for Quotation (RFQ)</h1>
          <p className="text-center text-gray-600 mb-4">Get competitive quotes from qualified vendors for your construction project</p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">Your RFQ will be matched with 5-7 qualified vendors</p>
                <p>We carefully select vendors based on location, expertise, and availability to ensure you get quality responses.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-12">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors ${
                    currentStep === step.number ? 'text-white' : 
                    currentStep > step.number ? 'text-white' : 
                    'bg-gray-200 text-gray-600'
                  }`} style={currentStep >= step.number ? { backgroundColor: '#ea8f1e' } : {}}>
                    {currentStep > step.number ? <Check className="w-6 h-6" /> : step.number}
                  </div>
                  <span className="text-xs mt-2 font-medium text-gray-700 text-center">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 transition-colors ${currentStep > step.number ? 'bg-orange-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Project Basics */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#5f6466' }}>Project Basics</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Project Title* <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="projectTitle"
                  value={formData.projectTitle}
                  onChange={handleInputChange}
                  placeholder="e.g., Kitchen Renovation, Office Partitioning"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 ${
                    errors.projectTitle ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.projectTitle && <p className="text-red-500 text-xs mt-1">{errors.projectTitle}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Project Category* <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Project Description* <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Describe your project requirements in detail..."
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Minimum 100 characters. Be specific about materials, dimensions, and requirements.</p>
                  <p className="text-xs text-gray-500">{formData.description.length}/100</p>
                </div>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Project Timeline* <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="timeline"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 ${
                      errors.timeline ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select timeline</option>
                    <option value="urgent">Urgent (Within 1 week)</option>
                    <option value="short">Short-term (1-4 weeks)</option>
                    <option value="medium">Medium-term (1-3 months)</option>
                    <option value="long">Long-term (3+ months)</option>
                    <option value="flexible">Flexible</option>
                  </select>
                  {errors.timeline && <p className="text-red-500 text-xs mt-1">{errors.timeline}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Urgency</label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  >
                    <option value="flexible">Flexible</option>
                    <option value="asap">ASAP - Need quotes within 24 hours</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Budget Range (KSh)* <span className="text-red-500">*</span>
                </label>
                <select
                  name="budgetRange"
                  value={formData.budgetRange}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 ${
                    errors.budgetRange ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select budget range</option>
                  {budgetRanges.map((range) => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
                {errors.budgetRange && <p className="text-red-500 text-xs mt-1">{errors.budgetRange}</p>}
              </div>

              {formData.budgetRange === 'Custom Range' && (
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Minimum Budget (KSh)</label>
                    <input
                      type="number"
                      name="customBudgetMin"
                      value={formData.customBudgetMin}
                      onChange={handleInputChange}
                      placeholder="e.g., 50000"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 ${
                        errors.customBudget ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Maximum Budget (KSh)</label>
                    <input
                      type="number"
                      name="customBudgetMax"
                      value={formData.customBudgetMax}
                      onChange={handleInputChange}
                      placeholder="e.g., 200000"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 ${
                        errors.customBudget ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.customBudget && <p className="text-red-500 text-xs mt-1 col-span-2">{errors.customBudget}</p>}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: '#5f6466' }}>
                  Project Type* <span className="text-red-500">*</span>
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  {projectTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, projectType: type.value })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.projectType === type.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{type.label}</p>
                      <p className="text-sm text-gray-600 mt-1">{type.desc}</p>
                    </button>
                  ))}
                </div>
                {errors.projectType && <p className="text-red-500 text-xs mt-1">{errors.projectType}</p>}
              </div>

              <button
                onClick={handleContinue}
                className="w-full text-white py-3 rounded-lg font-semibold hover:opacity-90"
                style={{ backgroundColor: '#ea8f1e' }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Specifications */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#5f6466' }}>Project Specifications</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Material Requirements (Optional)
                </label>
                <textarea
                  name="materialRequirements"
                  value={formData.materialRequirements}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="List specific materials needed (e.g., brand, quality, etc.)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Dimensions/Quantities (Optional)
                </label>
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <input
                    type="text"
                    value={formData.dimensions.length}
                    onChange={(e) => handleDimensionChange('length', e.target.value)}
                    placeholder="Length (m)"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                  <input
                    type="text"
                    value={formData.dimensions.width}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    placeholder="Width (m)"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                  <input
                    type="text"
                    value={formData.dimensions.height}
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    placeholder="Height (m)"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
                <textarea
                  name="additionalMeasurements"
                  value={formData.additionalMeasurements}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Any other measurements, tile counts, sq ft of tiles, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-3" style={{ color: '#5f6466' }}>Quality Requirements</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="premiumQuality"
                      checked={formData.premiumQuality}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Premium/High-quality materials</p>
                      <p className="text-sm text-gray-600">Imported materials</p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="budgetFriendly"
                      checked={formData.budgetFriendly}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Budget-friendly options</p>
                      <p className="text-sm text-gray-600">Cost-effective solutions</p>
                    </div>
                  </label>

                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ecoFriendly"
                      checked={formData.ecoFriendly}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Eco-friendly/Locally sourced</p>
                      <p className="text-sm text-gray-600">Sustainable materials</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Additional Specifications (Optional)
                </label>
                <textarea
                  name="additionalSpecs"
                  value={formData.additionalSpecs}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Any other specific requirements or details..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-3" style={{ color: '#5f6466' }}>Services Required</label>
                <div className="grid md:grid-cols-2 gap-3">
                  {services.map((service) => (
                    <label
                      key={service}
                      className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.servicesRequired.includes(service)}
                        onChange={() => handleServiceToggle(service)}
                        className="mr-3"
                      />
                      <span className="text-gray-900">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 text-white py-3 rounded-lg font-semibold hover:opacity-90"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#5f6466' }}>Project Location</h2>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    County* <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="county"
                    value={formData.county}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 ${
                      errors.county ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select County</option>
                    <option value="Nairobi">Nairobi</option>
                    <option value="Mombasa">Mombasa</option>
                    <option value="Kisumu">Kisumu</option>
                    <option value="Nakuru">Nakuru</option>
                    <option value="Eldoret">Eldoret</option>
                    <option value="Kiambu">Kiambu</option>
                    <option value="Machakos">Machakos</option>
                  </select>
                  {errors.county && <p className="text-red-500 text-xs mt-1">{errors.county}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Specific Location/Neighborhood* <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="specificLocation"
                    value={formData.specificLocation}
                    onChange={handleInputChange}
                    placeholder="e.g., Westlands, CBD, etc."
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900 ${
                      errors.specificLocation ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.specificLocation && <p className="text-red-500 text-xs mt-1">{errors.specificLocation}</p>}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Detailed Location Information (Optional)
                </label>
                <textarea
                  name="locationDetails"
                  value={formData.locationDetails}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Provide any additional location details (e.g., landmarks, building name)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Site Accessibility</label>
                <div className="grid md:grid-cols-3 gap-3">
                  <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all"
                    style={formData.siteAccessibility === 'easy' ? { borderColor: '#ea8f1e', backgroundColor: '#fef3e2' } : { borderColor: '#d1d5db' }}
                  >
                    <input
                      type="radio"
                      name="siteAccessibility"
                      value="easy"
                      checked={formData.siteAccessibility === 'easy'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-gray-900 text-sm">Easy vehicle access</span>
                  </label>

                  <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all"
                    style={formData.siteAccessibility === 'limited' ? { borderColor: '#ea8f1e', backgroundColor: '#fef3e2' } : { borderColor: '#d1d5db' }}
                  >
                    <input
                      type="radio"
                      name="siteAccessibility"
                      value="limited"
                      checked={formData.siteAccessibility === 'limited'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-gray-900 text-sm">Limited access</span>
                  </label>

                  <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all"
                    style={formData.siteAccessibility === 'difficult' ? { borderColor: '#ea8f1e', backgroundColor: '#fef3e2' } : { borderColor: '#d1d5db' }}
                  >
                    <input
                      type="radio"
                      name="siteAccessibility"
                      value="difficult"
                      checked={formData.siteAccessibility === 'difficult'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-gray-900 text-sm">Difficult access</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-3" style={{ color: '#5f6466' }}>Site Conditions</label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="multiStory"
                      checked={formData.multiStory}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="text-gray-900">Multi-story building</span>
                  </label>

                  <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requiresEquipment"
                      checked={formData.requiresEquipment}
                      onChange={handleInputChange}
                      className="mr-3"
                    />
                    <span className="text-gray-900">Requires special equipment</span>
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Delivery Preferences</label>
                <select
                  name="deliveryPreference"
                  value={formData.deliveryPreference}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                >
                  <option value="pickup">I will arrange pickup</option>
                  <option value="delivery">Vendor must arrange delivery</option>
                  <option value="flexible">Flexible - will discuss</option>
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 text-white py-3 rounded-lg font-semibold hover:opacity-90"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Attachments */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#5f6466' }}>Attachments & References</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Reference Images (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-3">Upload images to help vendors understand your requirements better</p>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {formData.referenceImages.map((file, index) => (
                    <div key={index} className="relative border-2 border-gray-300 rounded-lg p-2">
                      <button
                        type="button"
                        onClick={() => removeFile(index, 'images')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-600 text-center p-2">{file.name}</span>
                      </div>
                    </div>
                  ))}
                  
                  {formData.referenceImages.length < 6 && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, 'images')}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400"
                      >
                        <Plus className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-600">Upload Image</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Documents (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-3">Upload any relevant documents (plans, specifications, etc.)</p>
                
                {formData.documents.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {formData.documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index, 'documents')}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'documents')}
                  className="hidden"
                  id="doc-upload"
                />
                <label
                  htmlFor="doc-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="w-5 h-5 mr-2 text-gray-600" />
                  <span className="text-gray-700">Upload Documents</span>
                </label>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Reference Links (Optional)
                </label>
                <input
                  type="text"
                  name="referenceLinks"
                  value={formData.referenceLinks}
                  onChange={handleInputChange}
                  placeholder="e.g., Pinterest board, website, or other references"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Additional Notes for Vendors (Optional)
                </label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Any other information that might help vendors provide accurate quotes..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 text-white py-3 rounded-lg font-semibold hover:opacity-90"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Continue to Review
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#5f6466' }}>Review Your RFQ</h2>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-4" style={{ color: '#5f6466' }}>Project Summary</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project Title:</span>
                    <span className="font-medium text-gray-900">{formData.projectTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium text-gray-900">{formData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project Type:</span>
                    <span className="font-medium text-gray-900 capitalize">{formData.projectType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Timeline:</span>
                    <span className="font-medium text-gray-900 capitalize">{formData.timeline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget Range:</span>
                    <span className="font-medium text-gray-900">
                      {formData.budgetRange === 'Custom Range' 
                        ? `KSh ${formData.customBudgetMin} - ${formData.customBudgetMax}`
                        : formData.budgetRange}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-gray-900">{formData.specificLocation}, {formData.county}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 text-sm mb-2">Description:</p>
                  <p className="text-gray-900">{formData.description}</p>
                </div>

                {formData.servicesRequired.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-600 text-sm mb-2">Services Required:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.servicesRequired.map((service, index) => (
                        <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(formData.referenceImages.length > 0 || formData.documents.length > 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-gray-600 text-sm mb-2">Attachments:</p>
                    <p className="text-gray-900">{formData.referenceImages.length} image(s), {formData.documents.length} document(s)</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">What happens next?</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>1. Your RFQ will be matched with 5-7 qualified vendors in your area</li>
                      <li>2. {userReputation === 'new' && rfqsThisMonth === 0 ? 'Our team will review your first RFQ within 2-4 hours' : 'Vendors will receive your RFQ immediately'}</li>
                      <li>3. You'll receive email notifications as quotes arrive</li>
                      <li>4. Compare quotes and select the best vendor for your project</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer ${
                  errors.confirmGenuine ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}>
                  <input
                    type="checkbox"
                    name="confirmGenuine"
                    checked={formData.confirmGenuine}
                    onChange={handleInputChange}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">I confirm this is a genuine request</p>
                    <p className="text-sm text-gray-600">I have an actual project and budget available, and I'm not gathering market research or price comparisons without intent to hire.</p>
                  </div>
                </label>
                {errors.confirmGenuine && <p className="text-red-500 text-xs">{errors.confirmGenuine}</p>}

                <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer ${
                  errors.agreedToTerms ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}>
                  <input
                    type="checkbox"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleInputChange}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <p className="font-medium text-gray-900">I agree to the terms</p>
                    <p className="text-sm text-gray-600">
                      I agree to respond to vendor quotes within 7 days and close this RFQ when I make a decision. I understand that repeatedly ignoring vendor responses may limit my future RFQ submissions.
                    </p>
                  </div>
                </label>
                {errors.agreedToTerms && <p className="text-red-500 text-xs">{errors.agreedToTerms}</p>}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 text-white py-3 rounded-lg font-semibold hover:opacity-90"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Submit RFQ
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Success */}
          {currentStep === 6 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#fef3e2' }}>
                <Check className="w-8 h-8" style={{ color: '#ea8f1e' }} />
              </div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#5f6466' }}>RFQ Submitted Successfully!</h2>
              <p className="text-gray-600 mb-8">Your request has been sent to qualified vendors in your area.</p>
              
              <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-8 text-left">
                <h3 className="font-semibold mb-3" style={{ color: '#5f6466' }}>Next Steps</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold mr-2" style={{ color: '#ea8f1e' }}>1.</span>
                    <span>We've matched your RFQ with 5-7 qualified vendors</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2" style={{ color: '#ea8f1e' }}>2.</span>
                    <span>You'll receive email notifications as quotes arrive</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2" style={{ color: '#ea8f1e' }}>3.</span>
                    <span>Compare quotes and select your preferred vendor</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2" style={{ color: '#ea8f1e' }}>4.</span>
                    <span>Remember to close this RFQ once you make a decision</span>
                  </li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/browse">
                  <button className="px-8 py-3 border-2 rounded-lg font-semibold hover:bg-gray-50" style={{ borderColor: '#ea8f1e', color: '#ea8f1e' }}>
                    Browse Vendors
                  </button>
                </Link>
                <button
                  onClick={() => window.location.href = '/post-rfq'}
                  className="text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90" 
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Submit Another RFQ
                </button>
              </div>
            </div>
          )}

          {/* Step 7: Pending Review */}
          {currentStep === 7 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#5f6466' }}>RFQ Under Review</h2>
              <p className="text-gray-600 mb-8">Thanks for submitting your first RFQ! Our team is reviewing it to ensure quality for our vendors.</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto mb-8 text-left">
                <p className="font-semibold text-blue-900 mb-3">What's happening now?</p>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>✓ Your RFQ has been received</li>
                  <li>⏳ Our team will review it within 2-4 hours</li>
                  <li>✓ Once approved, it will be sent to 5-7 qualified vendors</li>
                  <li>✓ You'll receive an email confirmation when approved</li>
                  <li>✓ Future RFQs will be approved automatically</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto mb-8">
                <p className="text-sm text-yellow-800">
                  <strong>Why the review?</strong> We review first-time RFQs to protect our vendors from spam and ensure they receive only genuine requests. This is a one-time process.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/browse">
                  <button className="px-8 py-3 border-2 rounded-lg font-semibold hover:bg-gray-50" style={{ borderColor: '#ea8f1e', color: '#ea8f1e' }}>
                    Browse Vendors
                  </button>
                </Link>
                <Link href="/">
                  <button className="text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90" style={{ backgroundColor: '#ea8f1e' }}>
                    Go to Home
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}