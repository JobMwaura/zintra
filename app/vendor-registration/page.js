'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronRight, ChevronLeft, Check, Upload, Image as ImageIcon, AlertCircle, HelpCircle, Plus, X } from 'lucide-react';
import LocationSelector from '@/components/LocationSelector';
import { ALL_CATEGORIES_FLAT } from '@/lib/constructionCategories';

const brand = {
  primary: '#c28a3a',
  primaryDark: '#a9742f',
  slate: '#475569',
  border: '#e2e8f0',
  bg: '#f8fafc',
};

const steps = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Business Info' },
  { id: 3, label: 'Categories' },
  { id: 4, label: 'Details' },
  { id: 5, label: 'Plan' },
  { id: 6, label: 'Complete' },
];

// Create categories from comprehensive construction categories
const categories = ALL_CATEGORIES_FLAT.map((cat) => ({
  name: cat.label,
  requiresProducts: true, // All categories require at least profile info
  requiresPortfolio: false,
  requiresServices: false,
}));

const plans = [
  {
    id: 'free',
    name: 'Free (for now)',
    tag: 'New',
    price: 'KSh 0',
    period: '/month',
    features: [
      'List in 1 category',
      'Standard search visibility',
      '3 RFQ responses per month',
      'Basic profile badge',
      'Great for trying Zintra risk-free',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 'KSh 1,000',
    period: '/month',
    features: [
      'List in 2 categories',
      'Standard search visibility',
      '5 RFQ responses per month',
      'Basic profile badge',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tag: 'Popular',
    price: 'KSh 2,500',
    period: '/month',
    features: [
      'List in 5 categories',
      'Priority search visibility',
      '20 RFQ responses per month',
      'Premium profile badge',
      'Featured in category listings',
    ],
  },
  {
    id: 'diamond',
    name: 'Diamond',
    price: 'KSh 5,000',
    period: '/month',
    features: [
      'List in all categories',
      'Top search visibility',
      'Unlimited RFQ responses',
      'Diamond profile badge',
      'Featured on homepage',
    ],
  },
];

export default function VendorRegistration() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    whatsappNumber: '',
    county: '',
    location: '',
    selectedCategories: [],
    websiteUrl: '',
    facebookPage: '',
    instagramHandle: '',
    selectedPlan: 'free',
    
    // Conditional fields
    services: [],
    newService: '',
    products: [],
    productForm: {
      name: '',
      description: '',
      price: '',
      sale_price: '',
      category: '',
      unit: '',
      offer_label: '',
    },
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  // Determine which fields are required based on selected categories
  const selectedCategoryObjects = categories.filter(c => formData.selectedCategories.includes(c.name));
  const needsProducts = selectedCategoryObjects.some(c => c.requiresProducts);
  const needsPortfolio = selectedCategoryObjects.some(c => c.requiresPortfolio);
  const needsServices = selectedCategoryObjects.some(c => c.requiresServices);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const toggleCategory = (category) => {
    setFormData((prev) => {
      const alreadySelected = prev.selectedCategories.includes(category);
      if (alreadySelected) {
        return {
          ...prev,
          selectedCategories: prev.selectedCategories.filter((c) => c !== category),
        };
      }

      if (prev.selectedCategories.length >= 5) {
        return prev;
      }

      return { ...prev, selectedCategories: [...prev.selectedCategories, category] };
    });
    if (errors.selectedCategories) {
      setErrors({ ...errors, selectedCategories: '' });
    }
  };

  const addService = () => {
    if (formData.newService.trim()) {
      setFormData({
        ...formData,
        services: [...formData.services, formData.newService],
        newService: '',
      });
    }
  };

  const removeService = (index) => {
    setFormData({
      ...formData,
      services: formData.services.filter((_, i) => i !== index),
    });
  };

  const addProduct = () => {
    const { name, price, category } = formData.productForm;
    
    if (!name.trim() || !price.trim() || !category.trim()) {
      setErrors({
        ...errors,
        productForm: 'Product name, price, and category are required',
      });
      return;
    }

    if (formData.products.length >= 5) {
      setErrors({
        ...errors,
        products: 'Maximum 5 products allowed',
      });
      return;
    }

    const newProduct = {
      ...formData.productForm,
      id: Date.now(),
    };

    setFormData({
      ...formData,
      products: [...formData.products, newProduct],
      productForm: {
        name: '',
        description: '',
        price: '',
        sale_price: '',
        category: '',
        unit: '',
        offer_label: '',
      },
    });

    setShowProductModal(false);
    setErrors({ ...errors, productForm: '', products: '' });
  };

  const removeProduct = (id) => {
    setFormData({
      ...formData,
      products: formData.products.filter((p) => p.id !== id),
    });
  };

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!user?.email) {
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Enter a valid email';
        }
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8 || !/[0-9]/.test(formData.password) || !/[A-Za-z]/.test(formData.password)) {
          newErrors.password = 'Use 8+ characters with letters and numbers';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords must match';
        }
      }
    }

    if (currentStep === 2) {
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required';
      }
      if (!formData.businessDescription.trim()) {
        newErrors.businessDescription = 'Business description is required';
      }
      if (!formData.county.trim()) {
        newErrors.county = 'County is required';
      }
      if (!formData.location.trim()) {
        newErrors.location = 'Location is required';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      }
    }

    if (currentStep === 3) {
      if (formData.selectedCategories.length === 0) {
        newErrors.selectedCategories = 'Select at least 1 category';
      }
    }

    if (currentStep === 4) {
      if (needsServices && formData.services.length === 0) {
        newErrors.services = 'Add at least one service for your selected categories';
      }
      if (needsProducts && formData.products.length === 0) {
        newErrors.products = 'Add at least one product for your selected categories';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep((s) => Math.min(s + 1, steps.length));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;
    setIsLoading(true);
    setMessage('');

    try {
      let userId = user?.id || null;
      let userEmail = user?.email || null;

      if (!user?.id) {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (error) {
          setMessage('Error creating account: ' + error.message);
          setIsLoading(false);
          return;
        }

        userId = data?.user?.id || null;
        userEmail = data?.user?.email || formData.email.trim();

        if (!userId) {
          setMessage('Account created. Please verify your email, then sign in to complete your vendor profile.');
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch('/api/vendor/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          company_name: formData.businessName,
          description: formData.businessDescription || null,
          phone: formData.phone || null,
          email: userEmail,
          county: formData.county || null,
          location: formData.location || null,
          plan: formData.selectedPlan || 'free',
          whatsapp: formData.whatsappNumber || null,
          website: formData.websiteUrl || null,
          category: formData.selectedCategories.length ? formData.selectedCategories.join(', ') : null,
          services: formData.services.length ? formData.services.join(', ') : null,
          products: formData.products.length ? formData.products : null,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('API error:', responseData.error);
        setMessage('Error: ' + (responseData.error || 'Failed to create vendor profile'));
        setIsLoading(false);
        return;
      }

      setMessage(
        user?.id
          ? '✅ Vendor profile created successfully!'
          : '✅ Account created. Check your email to verify and activate your profile.'
      );
      setCurrentStep(6);

      const createdId = responseData?.data?.[0]?.id;
      if (createdId) {
        setTimeout(() => {
          router.push(`/vendor-profile/${createdId}`);
        }, 1200);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage('Error: ' + (err.message || 'Something went wrong'));
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

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Account Setup</h3>
            <p className="text-sm text-slate-500 mt-2">
              {user?.email
                ? <>You are signed in as <span className="font-semibold text-slate-800">{user.email}</span></>
                : 'Create your account to get started on Zintra.'}
            </p>
          </div>

          {!user?.email && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] ${
                    errors.email ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">Password*</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] ${
                    errors.password ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-800 mb-1">Confirm Password*</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter password"
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] ${
                    errors.confirmPassword ? 'border-red-400' : 'border-slate-300'
                  }`}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Business Information</h3>
            <p className="text-sm text-slate-500 mt-2">Help buyers understand your business</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Business Name*</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              placeholder="Your business name"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] ${
                errors.businessName ? 'border-red-400' : 'border-slate-300'
              }`}
            />
            {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Business Description*</label>
            <textarea
              name="businessDescription"
              value={formData.businessDescription}
              onChange={handleInputChange}
              rows={4}
              placeholder="Tell buyers about your business, expertise, and what makes you special..."
              className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] ${
                errors.businessDescription ? 'border-red-400' : 'border-slate-300'
              }`}
            />
            {errors.businessDescription && <p className="text-xs text-red-500 mt-1">{errors.businessDescription}</p>}
          </div>

          <div>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Phone Number*</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+254 712 345 678"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] ${
                  errors.phone ? 'border-red-400' : 'border-slate-300'
                }`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">WhatsApp Number</label>
              <input
                type="tel"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleInputChange}
                placeholder="+254 712 345 678"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Website URL</label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                placeholder="https://www.example.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Facebook Page</label>
              <input
                type="text"
                name="facebookPage"
                value={formData.facebookPage}
                onChange={handleInputChange}
                placeholder="facebook.com/yourpage"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800 mb-1">Instagram Handle</label>
            <input
              type="text"
              name="instagramHandle"
              value={formData.instagramHandle}
              onChange={handleInputChange}
              placeholder="@yourhandle"
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
            />
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">What do you offer?</h3>
            <p className="text-sm text-slate-500 mt-2">Select all categories that apply to your business</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-800">Categories (up to 5)*</label>
              <span className="text-xs text-slate-500">{formData.selectedCategories.length}/5</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => toggleCategory(cat.name)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                    formData.selectedCategories.includes(cat.name)
                      ? 'border-[#c28a3a] bg-amber-50'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className={`mt-1 h-5 w-5 rounded border flex items-center justify-center ${
                    formData.selectedCategories.includes(cat.name)
                      ? 'bg-[#c28a3a] border-[#c28a3a]'
                      : 'border-slate-300'
                  }`}>
                    {formData.selectedCategories.includes(cat.name) && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{cat.name}</p>
                  </div>
                </button>
              ))}
            </div>
            {errors.selectedCategories && <p className="text-xs text-red-500">{errors.selectedCategories}</p>}
          </div>

          {formData.selectedCategories.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Based on your selection, we'll ask you to {needsServices && 'list your services'}{needsServices && needsPortfolio && ', '}{needsPortfolio && 'showcase your portfolio'}{needsProducts && needsServices && ', and'}{needsProducts && 'list your products'} in the next step.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Additional Details</h3>
            <p className="text-sm text-slate-500 mt-2">Tell buyers what you specialize in</p>
          </div>

          {needsServices && (
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">Services You Offer*</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.newService}
                    onChange={(e) => setFormData({ ...formData, newService: e.target.value })}
                    placeholder="e.g., Installation, Consultation, Delivery"
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addService();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addService}
                    className="px-4 py-2 bg-[#c28a3a] text-white rounded-lg font-medium hover:bg-[#a9742f] text-sm"
                  >
                    Add
                  </button>
                </div>
                {formData.services.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {formData.services.map((service, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                        <span className="text-sm text-slate-800">{service}</span>
                        <button
                          type="button"
                          onClick={() => removeService(idx)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.services && <p className="text-xs text-red-500 mt-1">{errors.services}</p>}
            </div>
          )}

          {needsProducts && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-800">Your Top 5 Products* ({formData.products.length}/5)</label>
                <button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  disabled={formData.products.length >= 5}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#c28a3a] text-white rounded-lg font-medium hover:bg-[#a9742f] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {formData.products.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.products.map((product) => (
                    <div key={product.id} className="flex items-start justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{product.category}</p>
                        <p className="text-sm font-semibold text-slate-800 mt-1">KSh {Number(product.price).toLocaleString()}</p>
                        {product.description && (
                          <p className="text-xs text-slate-600 mt-1">{product.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="ml-3 text-red-500 hover:text-red-700 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.products.length === 0 && (
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-4 text-center mb-4">
                  <p className="text-sm text-slate-600">No products added yet</p>
                </div>
              )}

              {errors.products && <p className="text-xs text-red-500 mt-1">{errors.products}</p>}
              {errors.productForm && <p className="text-xs text-red-500 mt-1">{errors.productForm}</p>}
            </div>
          )}

          {needsPortfolio && (
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-3">Portfolio Images (Optional)</label>
              <p className="text-sm text-slate-600 mb-3">Upload 3-6 photos of your work to build trust with buyers</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition"
                  >
                    <div className="flex flex-col items-center gap-1 text-slate-500">
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-xs">Photo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!needsServices && !needsPortfolio && !needsProducts && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900">
                <HelpCircle className="w-4 h-4 inline mr-2" />
                You're all set! Move to the next step to choose your subscription plan.
              </p>
            </div>
          )}
        </div>
      );
    }

    if (currentStep === 5) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Choose Your Subscription Plan</h3>
            <p className="text-sm text-slate-500 mt-2">
              Select a plan to publish your vendor profile and start receiving client requests.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {plans.map((plan) => {
              const isSelected = formData.selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, selectedPlan: plan.id })}
                  className={`relative flex h-full flex-col rounded-xl border bg-white p-6 text-left shadow-sm transition hover:shadow-md ${
                    isSelected ? 'border-[#c28a3a] ring-2 ring-[#c28a3a]' : 'border-slate-200'
                  }`}
                >
                  {plan.tag && (
                    <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {plan.tag}
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900">{plan.name}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-2">
                        {plan.price} <span className="text-base font-medium text-slate-500">{plan.period}</span>
                      </p>
                    </div>
                    {isSelected && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c28a3a] text-white">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-8 w-8" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Success!</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">Vendor profile created</h3>
          <p className="mt-2 text-slate-600">
            Your vendor account has been created and your profile is now live on Zintra.
          </p>
          {message && <p className="mt-3 text-emerald-600 font-semibold text-sm">{message}</p>}
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3 max-w-sm mx-auto">
          <h4 className="font-semibold text-slate-900">Next Steps</h4>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>✓ Complete your profile with photos and details</li>
            <li>✓ Respond to RFQs from interested buyers</li>
            <li>✓ Build your reputation with positive reviews</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: brand.bg }}>
      <div className="mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white shadow-lg border border-slate-200 p-6 sm:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900">Vendor Registration</h1>
            <p className="mt-2 text-slate-600">
              Join Zintra and connect with customers looking for your services
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-10">
            <div className="flex items-center gap-2 overflow-x-auto">
              {steps.map((step, idx) => {
                const isDone = currentStep > step.id;
                const isActive = currentStep === step.id;
                return (
                  <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold flex-shrink-0 ${
                        isDone || isActive
                          ? 'bg-[#c28a3a] border-[#c28a3a] text-white'
                          : 'bg-white border-slate-300 text-slate-500'
                      }`}
                    >
                      {isDone ? <Check className="h-5 w-5" /> : step.id}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className="h-0.5 w-6 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor: currentStep > step.id ? '#c28a3a' : '#e2e8f0',
                        }}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-slate-600 mt-3 text-center">Step {currentStep} of {steps.length}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {renderStepContent()}

            {message && currentStep !== 6 && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  message.includes('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {message}
              </div>
            )}

            {currentStep < 6 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4 border-t border-slate-200">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                      Back
                    </button>
                  )}
                </div>
                <div className="flex gap-3 sm:ml-auto">
                  {currentStep < 5 && (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c28a3a] px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-[#a9742f]"
                    >
                      Continue
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                  {currentStep === 5 && (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c28a3a] px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-[#a9742f] disabled:opacity-60"
                    >
                      {isLoading ? 'Creating Profile...' : 'Complete Registration'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>

          {/* PRODUCT MODAL */}
          {showProductModal && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Add Product</h3>
                  <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4 mb-6">
                  <input
                    value={formData.productForm.name}
                    onChange={(e) => setFormData({ ...formData, productForm: { ...formData.productForm, name: e.target.value } })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
                    placeholder="Product name"
                  />
                  <textarea
                    rows={2}
                    value={formData.productForm.description}
                    onChange={(e) => setFormData({ ...formData, productForm: { ...formData.productForm, description: e.target.value } })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
                    placeholder="Description (optional)"
                  />
                  <input
                    value={formData.productForm.price}
                    onChange={(e) => setFormData({ ...formData, productForm: { ...formData.productForm, price: e.target.value } })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
                    placeholder="Price"
                  />
                  <input
                    value={formData.productForm.sale_price}
                    onChange={(e) => setFormData({ ...formData, productForm: { ...formData.productForm, sale_price: e.target.value } })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
                    placeholder="Sale price (optional)"
                  />
                  <input
                    value={formData.productForm.category}
                    onChange={(e) => setFormData({ ...formData, productForm: { ...formData.productForm, category: e.target.value } })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
                    placeholder="Category"
                  />
                  <input
                    value={formData.productForm.unit}
                    onChange={(e) => setFormData({ ...formData, productForm: { ...formData.productForm, unit: e.target.value } })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
                    placeholder="Unit (e.g., bag, sq.ft)"
                  />
                  <input
                    value={formData.productForm.offer_label}
                    onChange={(e) => setFormData({ ...formData, productForm: { ...formData.productForm, offer_label: e.target.value } })}
                    className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
                    placeholder="Offer label (e.g., 20% off)"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="flex-1 px-4 py-2 bg-[#c28a3a] text-white rounded-lg font-medium hover:bg-[#a9742f]"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}