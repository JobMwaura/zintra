'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function VendorRegistration() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    phone: '',
    county: '',
    specificLocation: '',
    selectedCategories: [],
    priceRangeMin: '',
    priceRangeMax: '',
    whatsappNumber: '',
    instagramHandle: '',
    facebookPage: '',
    websiteUrl: '',
    selectedPlan: 'premium'
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          router.push('/login');
          return;
        }

        setUser(currentUser);
        setLoading(false);
      } catch (err) {
        console.error('Error getting user:', err);
        setLoading(false);
      }
    };

    getCurrentUser();
  }, [router]);

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

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required';
      }
      if (!formData.businessDescription.trim()) {
        newErrors.businessDescription = 'Business description is required';
      }
    } else if (currentStep === 2) {
      if (!formData.county) {
        newErrors.county = 'County is required';
      }
      if (!formData.specificLocation.trim()) {
        newErrors.specificLocation = 'Location is required';
      }
    } else if (currentStep === 3) {
      // All fields optional on step 3
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;
    setIsLoading(true);
    setMessage('');

    try {
      if (!user) {
        alert('You must be logged in to create a vendor profile.');
        setIsLoading(false);
        return;
      }

      if (!user.id) {
        alert('Error: Invalid user ID. Please log in again.');
        setIsLoading(false);
        return;
      }

      if (!formData.businessName || !user.email) {
        alert('Please fill in Business Name.');
        setIsLoading(false);
        return;
      }

      console.log('Creating vendor with user_id:', user.id);

      // Call API endpoint to create vendor
      const response = await fetch('/api/vendor/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          company_name: formData.businessName,
          description: formData.businessDescription || null,
          phone: formData.phone || null,
          email: user.email, // Use email from authenticated user
          county: formData.county || null,
          location: formData.specificLocation || null,
          plan: formData.selectedPlan || 'premium',
          whatsapp: formData.whatsappNumber || null,
          website: formData.websiteUrl || null,
          categories: formData.selectedCategories && formData.selectedCategories.length > 0 ? formData.selectedCategories : null,
          price_min: formData.priceRangeMin ? parseInt(formData.priceRangeMin) : null,
          price_max: formData.priceRangeMax ? parseInt(formData.priceRangeMax) : null,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('API error:', responseData.error);
        alert('Error: ' + (responseData.error || 'Failed to create vendor profile'));
        setIsLoading(false);
        return;
      }

      console.log('✅ Vendor profile created successfully!');
      setMessage('✅ Vendor profile created successfully!');
      alert('✅ Vendor profile created successfully!');
      
      setTimeout(() => {
        router.push('/dashboard/vendor');
      }, 1500);
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Error: ' + (err.message || 'Something went wrong'));
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold" style={{ color: '#5f6466' }}>
              Vendor Registration
            </h1>
            <p className="text-gray-600 mt-2">Join Zintra and connect with customers looking for your services</p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-8">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: currentStep >= step ? '#ea8f1e' : '#e5e7eb' }}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div
                    className="flex-1 h-1 mx-2"
                    style={{ backgroundColor: currentStep > step ? '#ea8f1e' : '#e5e7eb' }}
                  ></div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mb-8">
            <p className="text-sm text-gray-600">
              {currentStep === 1 && 'Step 1: Business Information'}
              {currentStep === 2 && 'Step 2: Location'}
              {currentStep === 3 && 'Step 3: Additional Details'}
              {currentStep === 4 && 'Step 4: Review'}
              {currentStep === 5 && 'Step 5: Complete'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Business Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#5f6466' }}>Business Information</h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Email Address*
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your registered email (cannot be changed)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Business Name*
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Enter your business name"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.businessName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Business Description*
                  </label>
                  <textarea
                    name="businessDescription"
                    value={formData.businessDescription}
                    onChange={handleInputChange}
                    placeholder="Describe your business and services"
                    rows="4"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.businessDescription ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.businessDescription && <p className="text-red-500 text-xs mt-1">{errors.businessDescription}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#5f6466' }}>Location</h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    County*
                  </label>
                  <select
                    name="county"
                    value={formData.county}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.county ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select county</option>
                    <option value="Nairobi">Nairobi</option>
                    <option value="Mombasa">Mombasa</option>
                    <option value="Kisumu">Kisumu</option>
                    <option value="Nakuru">Nakuru</option>
                    <option value="Kiambu">Kiambu</option>
                  </select>
                  {errors.county && <p className="text-red-500 text-xs mt-1">{errors.county}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Specific Location*
                  </label>
                  <input
                    type="text"
                    name="specificLocation"
                    value={formData.specificLocation}
                    onChange={handleInputChange}
                    placeholder="e.g., Westlands, Downtown"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      errors.specificLocation ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.specificLocation && <p className="text-red-500 text-xs mt-1">{errors.specificLocation}</p>}
                </div>
              </div>
            )}

            {/* Step 3: Additional Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#5f6466' }}>Additional Details</h2>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleInputChange}
                    placeholder="+254..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    name="instagramHandle"
                    value={formData.instagramHandle}
                    onChange={handleInputChange}
                    placeholder="@yourhandle"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Website URL
                  </label>
                  <input
                    type="url"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Min Price (KSh)
                  </label>
                  <input
                    type="number"
                    name="priceRangeMin"
                    value={formData.priceRangeMin}
                    onChange={handleInputChange}
                    placeholder="e.g., 5000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#5f6466' }}>
                    Max Price (KSh)
                  </label>
                  <input
                    type="number"
                    name="priceRangeMax"
                    value={formData.priceRangeMax}
                    onChange={handleInputChange}
                    placeholder="e.g., 50000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#5f6466' }}>Review Your Profile</h2>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p className="font-medium">{formData.businessName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="font-medium">{formData.businessDescription}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{formData.specificLocation}, {formData.county}</p>
                  </div>
                  {formData.websiteUrl && (
                    <div>
                      <p className="text-sm text-gray-600">Website</p>
                      <p className="font-medium">{formData.websiteUrl}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Complete */}
            {currentStep === 5 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <span className="text-3xl">✅</span>
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#5f6466' }}>Almost Done!</h2>
                <p className="text-gray-600">Click "Submit" to complete your vendor registration</p>
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('✅') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              } mt-4`}>
                {message}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              
              {currentStep < 5 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {currentStep === 5 && (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-lg text-white font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  {isLoading ? 'Creating Vendor...' : 'Submit'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}