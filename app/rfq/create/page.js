'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Loader,
  Info,
  Users,
  Wand2,
  Globe,
  ChevronDown
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Roofing',
  'HVAC',
  'Masonry',
  'Landscaping',
  'Flooring',
  'Windows & Doors',
  'Kitchen & Bath',
  'General Construction',
  'Other'
];

const RFQ_TYPES = [
  {
    id: 'direct',
    name: 'Direct Request',
    description: 'Request a quote from a specific vendor directly',
    icon: Users,
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'wizard',
    name: 'Auto-Match',
    description: 'System automatically matches qualified vendors',
    icon: Wand2,
    color: 'bg-purple-50 border-purple-200'
  },
  {
    id: 'public',
    name: 'Public Request',
    description: 'Post publicly for any vendor to respond',
    icon: Globe,
    color: 'bg-green-50 border-green-200'
  }
];

export default function RFQCreate() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Type, 2: Details, 3: Review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [quota, setQuota] = useState(null);
  const [vendors, setVendors] = useState([]);

  const [formData, setFormData] = useState({
    type: 'wizard',
    title: '',
    description: '',
    category: '',
    location: '',
    county: '',
    budget_estimate: '',
    urgency: 'normal',
    assigned_vendor_id: null
  });

  useEffect(() => {
    fetchUserAndQuota();
  }, []);

  const fetchUserAndQuota = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Fetch quota
      const quotaRes = await fetch('/api/rfq/quota', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (quotaRes.ok) {
        const quotaData = await quotaRes.json();
        setQuota(quotaData);
      }

      // Fetch vendors for direct RFQ
      const { data: vendorData } = await supabase
        .from('vendor_profiles')
        .select('id, business_name, category, location, rating')
        .order('rating', { ascending: false })
        .limit(50);

      if (vendorData) {
        setVendors(vendorData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load form data');
    }
  };

  const handleTypeSelect = (type) => {
    setFormData({ ...formData, type });
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => {
    // Validate current step
    if (step === 2) {
      if (!formData.title.trim()) {
        setError('Please enter an RFQ title');
        return;
      }
      if (!formData.description.trim()) {
        setError('Please enter a description');
        return;
      }
      if (!formData.category) {
        setError('Please select a category');
        return;
      }
      if (formData.type === 'direct' && !formData.assigned_vendor_id) {
        setError('Please select a vendor for direct request');
        return;
      }
      setError(null);
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Call submit endpoint
      const response = await fetch('/api/rfq/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location || null,
          county: formData.county || null,
          budget_estimate: formData.budget_estimate || null,
          type: formData.type,
          assigned_vendor_id: formData.assigned_vendor_id || null,
          urgency: formData.urgency || 'normal'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          // Payment required
          sessionStorage.setItem('payment_required', JSON.stringify({
            amount: data.payment_required.amount,
            currency: data.payment_required.currency,
            rfq_type: formData.type
          }));
          router.push('/rfq/payment');
          return;
        }
        throw new Error(data.error || 'Failed to submit RFQ');
      }

      setSuccess(true);

      // Show success message and redirect
      setTimeout(() => {
        router.push('/rfq-dashboard');
      }, 2000);

    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              router.push('/rfq-dashboard');
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 font-semibold transition"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Create a New RFQ</h1>
        </div>

        {/* Quota Warning */}
        {quota && quota.free_remaining === 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900">Free Quota Exhausted</h3>
                <p className="text-orange-800 text-sm mt-1">
                  You've used all 3 free RFQs this month. Each additional RFQ costs KES 300.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">RFQ Submitted!</h3>
              <p className="text-green-800 text-sm">Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        {/* Step 1: Select Type */}
        {step === 1 && (
          <div className="space-y-4">
            {RFQ_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleTypeSelect(type.id);
                  }}
                  className={`w-full p-6 rounded-lg border-2 transition text-left cursor-pointer ${type.color} hover:shadow-lg hover:border-current`}
                >
                  <div className="flex items-start gap-4">
                    <Icon size={32} className="text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {type.name}
                      </h3>
                      <p className="text-gray-700">{type.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Enter Details */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {RFQ_TYPES.find(t => t.id === formData.type)?.name}
              </h2>
              <p className="text-gray-600">
                {RFQ_TYPES.find(t => t.id === formData.type)?.description}
              </p>
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  RFQ Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="E.g., 'Bathroom Renovation', 'Fix Electrical Outlet'"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the work needed in detail. Include specifications, timeline expectations, and any other relevant information."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Location & County */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="E.g., Nairobi"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    County
                  </label>
                  <input
                    type="text"
                    name="county"
                    value={formData.county}
                    onChange={handleInputChange}
                    placeholder="E.g., Nairobi County"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Budget & Urgency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Budget Estimate
                  </label>
                  <input
                    type="text"
                    name="budget_estimate"
                    value={formData.budget_estimate}
                    onChange={handleInputChange}
                    placeholder="E.g., KES 5,000 - 10,000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Urgency
                  </label>
                  <select
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Vendor Selection for Direct */}
              {formData.type === 'direct' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Vendor *
                  </label>
                  <select
                    name="assigned_vendor_id"
                    value={formData.assigned_vendor_id || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.business_name} ({vendor.category}) - Rating: {(vendor.rating || 0).toFixed(1)}★
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Tips for better responses:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Be specific about what you need</li>
                    <li>Include a realistic budget range</li>
                    <li>Set realistic timelines</li>
                    <li>Add any special requirements or preferences</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setStep(1);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleNext();
                }}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                Review
                <ChevronDown size={20} className="rotate-180" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your RFQ</h2>

            <div className="space-y-6 mb-8">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Title</p>
                    <p className="font-semibold text-gray-900">{formData.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{formData.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Category</p>
                    <p className="font-semibold text-gray-900">{formData.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Budget</p>
                    <p className="font-semibold text-gray-900">{formData.budget_estimate || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Location</p>
                    <p className="font-semibold text-gray-900">{formData.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Urgency</p>
                    <p className="font-semibold text-gray-900 capitalize">{formData.urgency}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Description</p>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                  {formData.description}
                </p>
              </div>

              {/* Vendor Info */}
              {formData.type === 'direct' && formData.assigned_vendor_id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-600 mb-2 font-semibold">DIRECT REQUEST</p>
                  <p className="text-sm text-blue-900">
                    This RFQ will be sent directly to {vendors.find(v => v.id === formData.assigned_vendor_id)?.business_name}
                  </p>
                </div>
              )}
            </div>

            {/* Quota Usage */}
            {quota && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <p className="text-sm text-blue-900 mb-2">
                  <span className="font-semibold">After submission:</span> {quota.free_remaining - 1} free RFQs remaining this month
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setStep(2);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Submit RFQ
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
