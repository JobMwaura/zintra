'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ChevronRight, ChevronLeft, Check, Upload, Image as ImageIcon } from 'lucide-react';

const brand = {
  primary: '#c28a3a',
  primaryDark: '#a9742f',
  slate: '#475569',
  border: '#e2e8f0',
  bg: '#f8fafc',
};

const steps = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Business Details' },
  { id: 3, label: 'Services & Portfolio' },
  { id: 4, label: 'Subscription' },
  { id: 5, label: 'Complete' },
];

const categories = [
  'Building & Structural Materials',
  'Doors, Windows & Hardware',
  'Electrical & Lighting',
  'Plumbing & Sanitation',
  'Flooring & Wall Finishes',
  'Wood & Timber Solutions',
  'Roofing & Waterproofing',
  'Kitchen & Interior Fittings',
  'HVAC & Climate',
];

const plans = [
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

  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    email: '',
    password: '',
    confirmPassword: '',
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
    selectedPlan: 'free',
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

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
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
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
      if (formData.selectedCategories.length === 0) {
        newErrors.selectedCategories = 'Select at least 1 category';
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

      // If not signed in, create an account first
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
          location: formData.specificLocation || null,
          plan: formData.selectedPlan || 'premium',
          whatsapp: formData.whatsappNumber || null,
          website: formData.websiteUrl || null,
          categories: formData.selectedCategories.length ? formData.selectedCategories : null,
          price_min: formData.priceRangeMin ? parseInt(formData.priceRangeMin, 10) : null,
          price_max: formData.priceRangeMax ? parseInt(formData.priceRangeMax, 10) : null,
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
      setCurrentStep(5);

      setTimeout(() => {
        router.push('/dashboard/vendor');
      }, 1600);
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
            <label className="text-sm font-medium text-slate-700">Account</label>
            <p className="text-sm text-slate-500 mt-1">
              {user?.email
                ? <>You are signed in as <span className="font-semibold text-slate-800">{user.email}</span></>
                : 'Create your account to publish your profile (email verification required).'}
            </p>
          </div>

          <div className="space-y-4">
            {!user?.email && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-800 mb-1">Email*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className={`w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] focus:border-[#c28a3a] ${
                      errors.email ? 'border-red-400' : 'border-slate-200'
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
                    placeholder="Create a password"
                    className={`w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] focus:border-[#c28a3a] ${
                      errors.password ? 'border-red-400' : 'border-slate-200'
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
                    className={`w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] focus:border-[#c28a3a] ${
                      errors.confirmPassword ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">Business Name*</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Enter your business name"
                className={`w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] focus:border-[#c28a3a] ${
                  errors.businessName ? 'border-red-400' : 'border-slate-200'
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
                rows={3}
                placeholder="Describe your business, services, and expertise..."
                className={`w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] focus:border-[#c28a3a] ${
                  errors.businessDescription ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {errors.businessDescription && (
                <p className="text-xs text-red-500 mt-1">{errors.businessDescription}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800">Business Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">County*</label>
              <input
                type="text"
                name="county"
                value={formData.county}
                onChange={handleInputChange}
                placeholder="Select county"
                className={`w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] focus:border-[#c28a3a] ${
                  errors.county ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {errors.county && <p className="text-xs text-red-500">{errors.county}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Specific Location*</label>
              <input
                type="text"
                name="specificLocation"
                value={formData.specificLocation}
                onChange={handleInputChange}
                placeholder="e.g., Westlands, CBD"
                className={`w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a] focus:border-[#c28a3a] ${
                  errors.specificLocation ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {errors.specificLocation && <p className="text-xs text-red-500">{errors.specificLocation}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+254..."
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">WhatsApp Number</label>
              <input
                type="tel"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleInputChange}
                placeholder="+254..."
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Facebook Page</label>
              <input
                type="text"
                name="facebookPage"
                value={formData.facebookPage}
                onChange={handleInputChange}
                placeholder="facebook.com/yourpage"
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Instagram Handle</label>
              <input
                type="text"
                name="instagramHandle"
                value={formData.instagramHandle}
                onChange={handleInputChange}
                placeholder="@yourhandle"
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800">Website URL</label>
            <input
              type="url"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              placeholder="https://www.example.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Business Logo</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl px-4 py-6 text-center bg-slate-50">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                <Upload className="h-5 w-5 text-slate-500" />
              </div>
              <p className="mt-3 text-sm text-slate-700">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500">SVG, PNG, or JPG (max 800x400px)</p>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800">Services & Portfolio</h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-800">Select Categories (up to 5)*</label>
              <span className="text-xs text-slate-500">{formData.selectedCategories.length}/5 selected</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  key={category}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition ${
                    formData.selectedCategories.includes(category)
                      ? 'border-[#c28a3a] bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="h-4 w-4 rounded border-slate-300 text-[#c28a3a] focus:ring-[#c28a3a]"
                  />
                  <span className="text-slate-800">{category}</span>
                </label>
              ))}
            </div>
            {errors.selectedCategories && <p className="text-xs text-red-500">{errors.selectedCategories}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Price Range (Min)</label>
              <input
                type="number"
                name="priceRangeMin"
                value={formData.priceRangeMin}
                onChange={handleInputChange}
                placeholder="e.g., 5,000"
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-800">Price Range (Max)</label>
              <input
                type="number"
                name="priceRangeMax"
                value={formData.priceRangeMax}
                onChange={handleInputChange}
                placeholder="e.g., 50,000"
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#c28a3a]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-800">Portfolio Images (Upload 3-6 photos)</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500"
                >
                  <div className="flex flex-col items-center gap-1">
                    <ImageIcon className="h-5 w-5" />
                    <span>Upload Image</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-800">Certifications (Optional)</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl px-4 py-5 text-center bg-slate-50">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <Upload className="h-4 w-4 text-slate-500" />
              </div>
              <p className="mt-2 text-sm text-slate-700">Upload certifications or qualifications (PDF, JPG)</p>
            </div>
          </div>
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-800">Choose Your Subscription Plan</h3>
          <p className="text-sm text-slate-600">
            Select a plan to publish your vendor profile and start receiving client requests.
          </p>

          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const isSelected = formData.selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, selectedPlan: plan.id })}
                  className={`relative flex h-full flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    isSelected ? 'border-[#c28a3a] ring-2 ring-[#c28a3a] ring-offset-0' : 'border-slate-200'
                  }`}
                >
                  {plan.tag && (
                    <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {plan.tag}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{plan.name}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        {plan.price} <span className="text-base font-medium text-slate-500">{plan.period}</span>
                      </p>
                    </div>
                    {isSelected && (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-500" />
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Payment Successful!</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">Vendor profile created</h3>
          <p className="mt-2 text-slate-600">
            Your vendor account has been created and your profile is now live.
          </p>
          {message && <p className="mt-2 text-emerald-600 font-semibold">{message}</p>}
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3">
          <h4 className="font-semibold text-slate-800">Next Steps</h4>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>1. Complete your profile</li>
            <li>2. Respond to RFQs</li>
            <li>3. Share your profile</li>
          </ul>
        </div>
        <button
          type="button"
          onClick={() => router.push('/dashboard/vendor')}
          className="inline-flex items-center justify-center rounded-lg bg-[#c28a3a] px-5 py-3 text-white font-semibold shadow-sm hover:bg-[#a9742f]"
        >
          Go to Vendor Dashboard
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: brand.bg }}>
      <div className="mx-auto max-w-5xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white shadow-lg border border-slate-200 p-6 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Vendor Registration</h1>
            <p className="mt-2 text-slate-600">
              Join Zintra and connect with customers looking for your services
            </p>
          </div>

          <div className="mb-10 grid grid-cols-5 gap-3">
            {steps.map((step) => {
              const isDone = currentStep > step.id;
              const isActive = currentStep === step.id;
              return (
                <div key={step.id} className="flex flex-col items-center gap-2">
                  <div className="flex items-center w-full">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                        isDone || isActive
                          ? 'bg-[#c28a3a] border-[#c28a3a] text-white'
                          : 'bg-white border-slate-200 text-slate-500'
                      }`}
                    >
                      {isDone ? <Check className="h-5 w-5" /> : step.id}
                    </div>
                    {step.id < steps.length && (
                      <div
                        className="ml-2 h-1 flex-1 rounded-full"
                        style={{
                          backgroundColor: currentStep > step.id ? '#c28a3a' : '#e2e8f0',
                        }}
                      ></div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-700 text-center">{step.label}</p>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {renderStepContent()}

            {message && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  message.includes('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {message}
              </div>
            )}

            {currentStep < 5 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                      Back
                    </button>
                  )}
                </div>
                <div className="flex gap-3 sm:ml-auto">
                  {currentStep < 4 && (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c28a3a] px-5 py-3 font-semibold text-white shadow-sm hover:bg-[#a9742f]"
                    >
                      Continue
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                  {currentStep === 4 && (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c28a3a] px-5 py-3 font-semibold text-white shadow-sm hover:bg-[#a9742f] disabled:opacity-60"
                    >
                      {isLoading ? 'Submitting...' : 'Continue to Complete'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
