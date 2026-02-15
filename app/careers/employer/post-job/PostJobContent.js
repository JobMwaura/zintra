'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import { getWalletBalance, publishJobWithCredits } from '@/app/actions/zcc-wallet';
import { ZCC_COSTS } from '@/lib/zcc/credit-config';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const JOB_POSTING_COST = ZCC_COSTS.JOB_POST; // credits (not KES)

const JOB_CATEGORIES = [
  'Construction',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Landscaping',
  'HVAC',
  'Roofing',
  'Masonry',
  'Cleaning',
  'Other',
];

export default function PostJobContent({ searchParams }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [credits, setCredits] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    payMin: '',
    payMax: '',
    jobType: 'full-time', // full-time, part-time, gig
    startDate: '',
    isRealOpportunity: false, // Verify job is a real opportunity
    featuredOption: null, // null, '7d', '14d', '30d'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Check role status
      const roleResult = await getUserRoleStatus(user.id);

      if (!roleResult.roles.employer) {
        router.push('/careers/onboarding');
        return;
      }

      const employerProfile = roleResult.profiles.employerProfile;
      setEmployer(employerProfile);

      // ✅ NEW: Get vendor profile to check verification status
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, company_name, phone_verified, email_verified, phone, email')
        .eq('user_id', user.id)
        .single();

      if (vendorError || !vendorData) {
        // Vendor doesn't exist in vendors table - redirect to registration
        console.log('Vendor not found in vendors table, redirecting to registration');
        router.push('/vendor-registration');
        return;
      }

      setVendor(vendorData);

      // ✅ NEW: Check verification status from URL params
      const verifyParam = searchParams?.get('verify');
      
      if (verifyParam === 'phone' && !vendorData.phone_verified) {
        // Phone verification is required
        setShowPhoneVerification(true);
      } else if (verifyParam === 'email' && !vendorData.email_verified) {
        // Email verification is required
        setShowEmailVerification(true);
      } else if (!verifyParam) {
        // No verify param - check if vendor is actually unverified
        if (!vendorData.phone_verified) {
          setShowPhoneVerification(true);
          setLoading(false);
          return; // Don't load form until verified
        } else if (!vendorData.email_verified) {
          setShowEmailVerification(true);
          setLoading(false);
          return; // Don't load form until verified
        }
      }

      // Get credits balance (only if not showing verification modals)
      if (!showPhoneVerification && !showEmailVerification) {
        const walletResult = await getWalletBalance(user.id);
        if (walletResult.success) {
          setCredits(walletResult.balance);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  }

  // ✅ NEW: Handle phone verification success
  async function handlePhoneVerificationSuccess() {
    setShowPhoneVerification(false);
    
    // Update vendor record
    const supabase = createClient();
    await supabase
      .from('vendors')
      .update({
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
      })
      .eq('id', vendor.id);

    // Check if email also needs verification
    if (!vendor.email_verified) {
      setShowEmailVerification(true);
    } else {
      // All verified, reload to show form
      setVendor({ ...vendor, phone_verified: true });
    }
  }

  // ✅ NEW: Handle email verification success
  async function handleEmailVerificationSuccess() {
    setShowEmailVerification(false);
    
    // Update vendor record
    const supabase = createClient();
    await supabase
      .from('vendors')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq('id', vendor.id);

    // All verified, reload page to show form
    setVendor({ ...vendor, email_verified: true });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        setError('Job title is required');
        return;
      }
      if (!formData.description.trim()) {
        setError('Job description is required');
        return;
      }
      if (!formData.category) {
        setError('Please select a category');
        return;
      }
      if (!formData.location.trim()) {
        setError('Location is required');
        return;
      }
      if (!formData.payMin || !formData.payMax) {
        setError('Pay range is required');
        return;
      }
      if (parseInt(formData.payMin) >= parseInt(formData.payMax)) {
        setError('Minimum pay must be less than maximum pay');
        return;
      }
      if (!formData.isRealOpportunity) {
        setError('Please confirm this is a real opportunity');
        return;
      }

      // Calculate total credit cost
      const totalCost = JOB_POSTING_COST + (
        formData.featuredOption === '7d' ? ZCC_COSTS.FEATURED_JOB_7D :
        formData.featuredOption === '14d' ? ZCC_COSTS.FEATURED_JOB_14D :
        formData.featuredOption === '30d' ? ZCC_COSTS.FEATURED_JOB_30D : 0
      );

      // Check credits
      if (credits < totalCost) {
        setError(`Insufficient credits. You need ${totalCost} credits but have ${credits}.`);
        return;
      }

      setSubmitting(true);

      // Use the new atomic wallet-based publish flow
      const result = await publishJobWithCredits(
        user.id,
        {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          payMin: formData.payMin,
          payMax: formData.payMax,
          startDate: formData.startDate || null,
          contractType: formData.jobType,
          duration: null,
          requirements: null,
        },
        formData.featuredOption // null, '7d', '14d', or '30d'
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to publish job');
      }

      setSuccess(true);
      setCredits(result.balance);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/careers/employer/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error posting job:', err);
      setError(err.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  // ✅ NEW: Show phone verification modal if needed
  if (showPhoneVerification && vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify Your Phone Number</h2>
          <p className="text-gray-600 mb-6">
            Before you can post a job, please verify your phone number. We sent an OTP to {vendor.phone}.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> You should have received an SMS with a 6-digit code. Enter it below.
            </p>
          </div>
          
          <input
            type="text"
            placeholder="Enter 6-digit OTP code"
            maxLength="6"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#ea8f1e]"
          />
          
          <button
            onClick={handlePhoneVerificationSuccess}
            className="w-full bg-[#ea8f1e] hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition mb-3"
          >
            Verify Phone
          </button>
          
          <button
            onClick={() => setShowPhoneVerification(false)}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
          >
            Skip for Now
          </button>
        </div>
      </div>
    );
  }

  // ✅ NEW: Show email verification modal if needed
  if (showEmailVerification && vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify Your Email Address</h2>
          <p className="text-gray-600 mb-6">
            Before you can post a job, please verify your email address. We sent a verification code to {vendor.email}.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Check your email for a verification code. Enter it below.
            </p>
          </div>
          
          <input
            type="text"
            placeholder="Enter verification code"
            maxLength="6"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#ea8f1e]"
          />
          
          <button
            onClick={handleEmailVerificationSuccess}
            className="w-full bg-[#ea8f1e] hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition mb-3"
          >
            Verify Email
          </button>
          
          <button
            onClick={() => setShowEmailVerification(false)}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-lg transition"
          >
            Skip for Now
          </button>
        </div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-bold text-red-900 mb-2">Error</h1>
          <p className="text-red-700 mb-4">You must have an employer profile to post jobs.</p>
          <button
            onClick={() => router.push('/careers/onboarding')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Go to Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Post a New Job</h1>
          <p className="text-slate-600 mt-1">Reach qualified candidates and grow your team</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Credits Warning */}
        <div className={`rounded-lg p-6 mb-8 border-l-4 ${
          credits >= JOB_POSTING_COST
            ? 'bg-emerald-50 border-emerald-500'
            : 'bg-yellow-50 border-yellow-500'
        }`}>
          <div className="flex items-start gap-3">
            {credits >= JOB_POSTING_COST ? (
              <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
            ) : (
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            )}
            <div>
              <p className={`font-semibold ${credits >= JOB_POSTING_COST ? 'text-emerald-900' : 'text-yellow-900'}`}>
                Credits Required: {JOB_POSTING_COST} credits
              </p>
              <p className={`text-sm mt-1 ${credits >= JOB_POSTING_COST ? 'text-emerald-800' : 'text-yellow-800'}`}>
                Your current balance: {credits} credits
              </p>
              {credits < JOB_POSTING_COST && (
                <button
                  onClick={() => router.push('/careers/credits')}
                  className="text-sm font-semibold text-yellow-700 hover:text-yellow-900 mt-2 underline"
                >
                  Buy credits →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-medium flex items-center gap-2">
                <AlertCircle size={18} />
                {error}
              </p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
              <p className="text-emerald-700 font-medium flex items-center gap-2">
                <CheckCircle size={18} />
                Job posted successfully! Redirecting to dashboard...
              </p>
            </div>
          )}

          {/* Job Title */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Experienced Plumber Needed"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              disabled={submitting}
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              disabled={submitting}
            >
              <option value="">Select a category</option>
              {JOB_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Job Type */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Job Type *
            </label>
            <div className="flex gap-4">
              {[
                { value: 'full-time', label: 'Full Time' },
                { value: 'part-time', label: 'Part Time' },
                { value: 'gig', label: 'Gig / One-off' },
              ].map(type => (
                <label key={type.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="jobType"
                    value={type.value}
                    checked={formData.jobType === type.value}
                    onChange={handleChange}
                    disabled={submitting}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Westlands, Nairobi"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              disabled={submitting}
            />
          </div>

          {/* Pay Range */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Min Pay (KES) *
              </label>
              <input
                type="number"
                name="payMin"
                value={formData.payMin}
                onChange={handleChange}
                placeholder="e.g., 5000"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Max Pay (KES) *
              </label>
              <input
                type="number"
                name="payMax"
                value={formData.payMax}
                onChange={handleChange}
                placeholder="e.g., 10000"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Start Date (optional) */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Preferred Start Date (Optional)
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              disabled={submitting}
            />
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Job Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the job, responsibilities, requirements, etc."
              rows={8}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              disabled={submitting}
            />
            <p className="text-xs text-slate-500 mt-2">
              Be clear about what you're looking for. Include requirements, responsibilities, and any special skills needed.
            </p>
          </div>

          {/* Opportunity Verification Checkbox */}
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isRealOpportunity"
                checked={formData.isRealOpportunity}
                onChange={handleChange}
                disabled={submitting}
                className="w-5 h-5 mt-1 text-orange-600 border-slate-300 rounded focus:ring-orange-500 cursor-pointer"
              />
              <div>
                <p className="font-semibold text-slate-900">
                  This is a real job opportunity
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  I confirm that this is a genuine job opportunity and I am authorized to post it. Fake or misleading job postings violate our terms and may result in account suspension.
                </p>
              </div>
            </label>
          </div>

          {/* Featured Job Add-on */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">⭐ Feature This Job (Optional)</h3>
            <p className="text-sm text-blue-700 mb-3">
              Featured jobs appear at the top of search results and on the homepage.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition">
                <input
                  type="radio"
                  name="featuredOption"
                  value=""
                  checked={!formData.featuredOption}
                  onChange={() => setFormData(prev => ({ ...prev, featuredOption: null }))}
                  disabled={submitting}
                  className="w-4 h-4"
                />
                <span className="text-slate-700">No featured add-on</span>
                <span className="ml-auto text-sm font-medium text-slate-500">+0 credits</span>
              </label>
              {[
                { value: '7d', label: 'Featured 7 days', cost: ZCC_COSTS.FEATURED_JOB_7D },
                { value: '14d', label: 'Featured 14 days', cost: ZCC_COSTS.FEATURED_JOB_14D },
                { value: '30d', label: 'Featured 30 days', cost: ZCC_COSTS.FEATURED_JOB_30D },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition">
                  <input
                    type="radio"
                    name="featuredOption"
                    value={opt.value}
                    checked={formData.featuredOption === opt.value}
                    onChange={() => setFormData(prev => ({ ...prev, featuredOption: opt.value }))}
                    disabled={submitting}
                    className="w-4 h-4"
                  />
                  <span className="text-slate-700">{opt.label}</span>
                  <span className="ml-auto text-sm font-bold text-blue-700">+{opt.cost} credits</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="mb-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-2">Cost Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-700">
                <span>Job posting</span>
                <span>{JOB_POSTING_COST} credits</span>
              </div>
              {formData.featuredOption && (
                <div className="flex justify-between text-slate-700">
                  <span>Featured add-on ({formData.featuredOption})</span>
                  <span>
                    {formData.featuredOption === '7d' ? ZCC_COSTS.FEATURED_JOB_7D :
                     formData.featuredOption === '14d' ? ZCC_COSTS.FEATURED_JOB_14D :
                     ZCC_COSTS.FEATURED_JOB_30D} credits
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1 mt-1">
                <span>Total</span>
                <span>
                  {JOB_POSTING_COST + (
                    formData.featuredOption === '7d' ? ZCC_COSTS.FEATURED_JOB_7D :
                    formData.featuredOption === '14d' ? ZCC_COSTS.FEATURED_JOB_14D :
                    formData.featuredOption === '30d' ? ZCC_COSTS.FEATURED_JOB_30D : 0
                  )} credits
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || credits < (JOB_POSTING_COST + (
                formData.featuredOption === '7d' ? ZCC_COSTS.FEATURED_JOB_7D :
                formData.featuredOption === '14d' ? ZCC_COSTS.FEATURED_JOB_14D :
                formData.featuredOption === '30d' ? ZCC_COSTS.FEATURED_JOB_30D : 0
              ))}
              className={`flex-1 font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 ${
                credits < JOB_POSTING_COST
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : submitting
                  ? 'bg-orange-400 text-white cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer'
              }`}
            >
              {submitting ? (
                <>
                  <span>Posting job...</span>
                </>
              ) : (
                <>
                  <span>Post Job ({JOB_POSTING_COST + (
                    formData.featuredOption === '7d' ? ZCC_COSTS.FEATURED_JOB_7D :
                    formData.featuredOption === '14d' ? ZCC_COSTS.FEATURED_JOB_14D :
                    formData.featuredOption === '30d' ? ZCC_COSTS.FEATURED_JOB_30D : 0
                  )} credits)</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:bg-gray-300 text-slate-900 font-bold py-3 px-6 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-3">💡 Tips for a Great Job Post</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Use a clear, descriptive job title</li>
            <li>✓ Set a competitive pay range to attract talent</li>
            <li>✓ Include specific requirements and responsibilities</li>
            <li>✓ Be honest about location and job type</li>
            <li>✓ Respond quickly to applications to improve hiring success</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
