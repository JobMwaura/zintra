'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Upload, X, Plus } from 'lucide-react';

export default function VendorRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Account
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Business Details
    businessName: '',
    businessDescription: '',
    country: 'Kenya',
    specificLocation: '',
    businessLogo: null,
    whatsappNumber: '',
    instagramHandle: '',
    facebookPage: '',
    websiteUrl: '',
    
    // Step 3: Services & Portfolio
    selectedCategories: [],
    priceRangeMin: '',
    priceRangeMax: '',
    portfolioImages: [],
    certifications: [],
    
    // Step 4: Subscription
    selectedPlan: 'premium',
  });

  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);

  const steps = [
    { number: 1, name: 'Account' },
    { number: 2, name: 'Verification' },
    { number: 3, name: 'Business Details' },
    { number: 4, name: 'Services & Portfolio' },
    { number: 5, name: 'Complete' },
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

  const subscriptionPlans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 'KSh 3,000',
      period: '/month',
      features: [
        'List in 2 categories',
        'Standard search visibility',
        '5 RFQ responses per month',
        'Basic profile badge'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'KSh 5,000',
      period: '/month',
      popular: true,
      features: [
        'List in 5 categories',
        'Priority search visibility',
        '20 RFQ responses per month',
        'Enhanced profile badge',
        'Featured in category listings'
      ]
    },
    {
      id: 'diamond',
      name: 'Diamond',
      price: 'KSh 8,000',
      period: '/month',
      features: [
        'List in all categories',
        'Top search visibility',
        'Unlimited RFQ responses',
        'Diamond profile badge',
        'Featured on homepage'
      ]
    }
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCategoryToggle = (category) => {
    const maxCategories = formData.selectedPlan === 'basic' ? 2 : 
                          formData.selectedPlan === 'premium' ? 5 : 999;
    
    if (formData.selectedCategories.includes(category)) {
      setFormData({
        ...formData,
        selectedCategories: formData.selectedCategories.filter(c => c !== category)
      });
    } else if (formData.selectedCategories.length < maxCategories) {
      setFormData({
        ...formData,
        selectedCategories: [...formData.selectedCategories, category]
      });
    }
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'portfolio') {
      setFormData({
        ...formData,
        portfolioImages: [...formData.portfolioImages, ...files].slice(0, 6)
      });
    } else if (type === 'logo') {
      setFormData({
        ...formData,
        businessLogo: files[0]
      });
    } else if (type === 'certifications') {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, ...files]
      });
    }
  };

  const removeFile = (index, type) => {
    if (type === 'portfolio') {
      setFormData({
        ...formData,
        portfolioImages: formData.portfolioImages.filter((_, i) => i !== index)
      });
    } else if (type === 'certifications') {
      setFormData({
        ...formData,
        certifications: formData.certifications.filter((_, i) => i !== index)
      });
    }
  };

  const handleVerificationCodeChange = (index, value) => {
    if (value.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`code-${index + 1}`)?.focus();
      }
    }
  };

  const handleContinue = () => {
    // Add validation here
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img 
                src="/zintra-svg-logo.svg" 
                alt="Zintra" 
                className="h-8 w-auto"
              />
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-gray-900 font-medium">Home</Link>
              <Link href="/browse" className="text-gray-700 hover:text-gray-900 font-medium">Browse</Link>
              <Link href="/post-rfq" className="text-gray-700 hover:text-gray-900 font-medium">Post RFQ</Link>
              <Link href="/about" className="text-gray-700 hover:text-gray-900 font-medium">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900 font-medium">Contact</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <button className="text-gray-700 hover:text-gray-900 font-medium">Login</button>
              </Link>
              <Link href="/vendor-registration">
                <button className="text-white px-4 py-2 rounded-lg font-medium hover:opacity-90" style={{ backgroundColor: '#ea8f1e' }}>
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Registration Form */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2" style={{ color: '#5f6466' }}>Vendor Registration</h1>
          <p className="text-center text-gray-600 mb-8">Join Zintra and connect with customers looking for your services</p>

          {/* Step Indicator */}
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
                  <span className="text-sm mt-2 font-medium text-gray-700">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 transition-colors ${currentStep > step.number ? 'bg-orange-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Account Creation */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#5f6466' }}>Create Your Account</h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>First Name*</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Last Name*</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Email Address*</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">📧</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Phone Number*</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">📱</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+254 700 000 000"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Password*</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters with letters and numbers</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Confirm Password*</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
              </div>

              <div className="flex items-center mb-6">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-gray-600">
                  I agree to the <Link href="/about" className="hover:underline" style={{ color: '#ea8f1e' }}>Terms of Service</Link> and <Link href="/about" className="hover:underline" style={{ color: '#ea8f1e' }}>Privacy Policy</Link>
                </span>
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

          {/* Step 2: Verification */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: '#5f6466' }}>Verify Your Account</h2>
              <p className="text-center text-gray-600 mb-8">
                We've sent a verification code to {formData.email}
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-4 text-center" style={{ color: '#5f6466' }}>
                  Enter the 6-digit code
                </label>
                <div className="flex justify-center gap-2">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                      className="w-12 h-12 text-center text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                    />
                  ))}
                </div>
              </div>

              <div className="text-center mb-6">
                <p className="text-sm text-gray-600">
                  Didn't receive the code? <button className="font-medium hover:underline" style={{ color: '#ea8f1e' }}>Resend Code</button>
                </p>
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
                  Verify
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Business Details */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6" style={{ color: '#5f6466' }}>Business Details</h2>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Business Name*</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  placeholder="Enter your business name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Business Description*</label>
                <textarea
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Describe your business, services, and expertise..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>County*</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  >
                    <option>Nairobi</option>
                    <option>Mombasa</option>
                    <option>Kisumu</option>
                    <option>Nakuru</option>
                    <option>Eldoret</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Specific Location*</label>
                  <input
                    type="text"
                    name="specificLocation"
                    value={formData.specificLocation}
                    onChange={handleInputChange}
                    placeholder="e.g., Westlands, CBD, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Business Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {formData.businessLogo ? (
                    <div className="flex items-center justify-center">
                      <span className="text-sm text-gray-600">{formData.businessLogo.name}</span>
                      <button
                        onClick={() => setFormData({ ...formData, businessLogo: null })}
                        className="ml-2 text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">SVG, PNG, JPG or JPEG (MAX. 800x400px)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'logo')}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="inline-block mt-2 text-white px-4 py-2 rounded-lg cursor-pointer hover:opacity-90"
                        style={{ backgroundColor: '#ea8f1e' }}
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Business Social Media (Optional)</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-400">📱</span>
                      <input
                        type="text"
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleInputChange}
                        placeholder="WhatsApp Number"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-400">📷</span>
                      <input
                        type="text"
                        name="instagramHandle"
                        value={formData.instagramHandle}
                        onChange={handleInputChange}
                        placeholder="Instagram Handle"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-400">👥</span>
                      <input
                        type="text"
                        name="facebookPage"
                        value={formData.facebookPage}
                        onChange={handleInputChange}
                        placeholder="Facebook Page"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-400">🌐</span>
                      <input
                        type="text"
                        name="websiteUrl"
                        value={formData.websiteUrl}
                        onChange={handleInputChange}
                        placeholder="Website URL"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                      />
                    </div>
                  </div>
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

          {/* Step 4: Services & Portfolio */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#5f6466' }}>Services & Portfolio</h2>
              <p className="text-sm text-gray-600 mb-6">
                Choose your subscription plan first to see how many categories you can select
              </p>

              {/* Subscription Plan Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#5f6466' }}>Choose Your Subscription Plan</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {subscriptionPlans.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => setFormData({ ...formData, selectedPlan: plan.id, selectedCategories: [] })}
                      className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                        formData.selectedPlan === plan.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="text-white text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#ea8f1e' }}>
                            POPULAR
                          </span>
                        </div>
                      )}
                      <div className="text-center">
                        <h4 className="text-lg font-bold mb-2" style={{ color: '#5f6466' }}>{plan.name}</h4>
                        <div className="mb-4">
                          <span className="text-3xl font-bold" style={{ color: '#5f6466' }}>{plan.price}</span>
                          <span className="text-gray-600">{plan.period}</span>
                        </div>
                        <ul className="text-left space-y-2 text-sm">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#ea8f1e' }} />
                              <span className="text-gray-600">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2" style={{ color: '#5f6466' }}>
                  Select Categories* 
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    (Choose up to {formData.selectedPlan === 'basic' ? '2' : formData.selectedPlan === 'premium' ? '5' : 'all'})
                  </span>
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <div
                      key={category}
                      onClick={() => handleCategoryToggle(category)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.selectedCategories.includes(category)
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.selectedCategories.includes(category)}
                          onChange={() => {}}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">{category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>Price Range*</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    name="priceRangeMin"
                    value={formData.priceRangeMin}
                    onChange={handleInputChange}
                    placeholder="Minimum (KSh)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                  <input
                    type="number"
                    name="priceRangeMax"
                    value={formData.priceRangeMax}
                    onChange={handleInputChange}
                    placeholder="Maximum (KSh)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter a price range for your services or products</p>
              </div>

              {/* Portfolio Images */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Portfolio Images (Upload 3-6 photos)*
                </label>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {formData.portfolioImages.map((file, index) => (
                    <div key={index} className="relative border-2 border-gray-300 rounded-lg p-2">
                      <button
                        onClick={() => removeFile(index, 'portfolio')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="aspect-square bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-600 text-center p-2">{file.name}</span>
                      </div>
                    </div>
                    ))}
                  {formData.portfolioImages.length < 6 && (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, 'portfolio')}
                        className="hidden"
                        id="portfolio-upload"
                      />
                      <label
                        htmlFor="portfolio-upload"
                        className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400"
                      >
                        <Plus className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-600">Upload Image</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                  Certifications (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">Upload any certifications or qualifications (PDF, JPG)</p>
                
                {formData.certifications.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {formData.certifications.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <button
                          onClick={() => removeFile(index, 'certifications')}
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
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'certifications')}
                  className="hidden"
                  id="cert-upload"
                />
                <label
                  htmlFor="cert-upload"
                  className="inline-block text-white px-4 py-2 rounded-lg cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Upload Certifications
                </label>
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
                  Continue to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#fef3e2' }}>
                <Check className="w-8 h-8" style={{ color: '#ea8f1e' }} />
              </div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#5f6466' }}>Payment Successful!</h2>
              <p className="text-gray-600 mb-2">Your vendor account has been created and your profile is now live.</p>
              
              <div className="bg-gray-50 rounded-lg p-6 my-8 max-w-md mx-auto text-left">
                <h3 className="font-semibold mb-4" style={{ color: '#5f6466' }}>Subscription Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium capitalize text-gray-900">{formData.selectedPlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-gray-900">
                      {formData.selectedPlan === 'basic' ? 'KSh 3,000' : 
                       formData.selectedPlan === 'premium' ? 'KSh 5,000' : 'KSh 8,000'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium text-gray-900">M-Pesa</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Next Billing Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-md mx-auto text-left">
                <h3 className="font-semibold mb-3" style={{ color: '#5f6466' }}>Next Steps</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold mr-2" style={{ color: '#ea8f1e' }}>1.</span>
                    <span>Complete your profile - Add more details to make your profile stand out</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2" style={{ color: '#ea8f1e' }}>2.</span>
                    <span>Monitor dashboard - Check your dashboard regularly for new client requests</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2" style={{ color: '#ea8f1e' }}>3.</span>
                    <span>Share your profile - Promote your Zintra profile on social media</span>
                  </li>
                </ol>
              </div>

              <Link href="/">
                <button className="text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 mb-4" style={{ backgroundColor: '#ea8f1e' }}>
                  Go to Dashboard
                </button>
              </Link>
              
              <div>
                <Link href="/vendor-registration">
                  <button className="text-gray-600 hover:text-gray-800 text-sm">
                    Submit Another Vendor
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