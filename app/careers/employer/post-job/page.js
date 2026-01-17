'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus, getEmployerCredits } from '@/app/actions/vendor-zcc';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

const JOB_POSTING_COST = 1000; // KES

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

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [credits, setCredits] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    payMin: '',
    payMax: '',
    jobType: 'full-time', // full-time, part-time, gig
    startDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/careers/auth/login');
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

      // Get credits balance
      const creditsResult = await getEmployerCredits(employerProfile.id);
      if (creditsResult.success) {
        setCredits(creditsResult.balance);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
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

      // Check credits
      if (credits < JOB_POSTING_COST) {
        setError(`Insufficient credits. You need ${JOB_POSTING_COST} KES but have ${credits} KES.`);
        return;
      }

      setSubmitting(true);

      const supabase = createClient();

      // Start transaction-like behavior with two operations
      // 1. Create listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          employer_id: employer.id,
          type: 'job', // Always 'job' for career centre listings
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          pay_min: parseInt(formData.payMin),
          pay_max: parseInt(formData.payMax),
          job_type: formData.jobType,
          start_date: formData.startDate || null,
          status: 'active',
        })
        .select()
        .single();

      if (listingError) {
        throw new Error('Failed to create listing: ' + listingError.message);
      }

      // 2. Deduct credits from credits_ledger
      const { error: ledgerError } = await supabase
        .from('credits_ledger')
        .insert({
          employer_id: employer.id,
          amount: -JOB_POSTING_COST,
          credit_type: 'job_posting',
          description: `Job posting: "${formData.title}"`,
        });

      if (ledgerError) {
        throw new Error('Failed to deduct credits: ' + ledgerError.message);
      }

      // 3. Update employer_spending for the month
      const now = new Date();
      const periodMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Try to update existing spending record
      const { data: existingSpending } = await supabase
        .from('employer_spending')
        .select('id')
        .eq('employer_id', employer.id)
        .eq('period_month', periodMonth.toISOString().split('T')[0])
        .single();

      if (existingSpending) {
        // Update existing
        await supabase
          .from('employer_spending')
          .update({
            posting_spent: supabase.rpc('increment_posting_spent', { amount: JOB_POSTING_COST, employer_id: employer.id, month: periodMonth.toISOString().split('T')[0] }),
            total_spent: supabase.rpc('increment_total_spent', { amount: JOB_POSTING_COST, employer_id: employer.id, month: periodMonth.toISOString().split('T')[0] }),
            updated_at: new Date().toISOString(),
          })
          .eq('employer_id', employer.id)
          .eq('period_month', periodMonth.toISOString().split('T')[0]);
      } else {
        // Create new
        await supabase
          .from('employer_spending')
          .insert({
            employer_id: employer.id,
            vendor_id: employer.vendor_id || null,
            period_month: periodMonth.toISOString().split('T')[0],
            posting_spent: JOB_POSTING_COST,
            unlocks_spent: 0,
            boosts_spent: 0,
            messaging_spent: 0,
            total_spent: JOB_POSTING_COST,
          });
      }

      setSuccess(true);
      setCredits(credits - JOB_POSTING_COST);

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
                Credits Required: {JOB_POSTING_COST} KES
              </p>
              <p className={`text-sm mt-1 ${credits >= JOB_POSTING_COST ? 'text-emerald-800' : 'text-yellow-800'}`}>
                Your current balance: {credits} KES
              </p>
              {credits < JOB_POSTING_COST && (
                <button
                  onClick={() => router.push('/careers/employer/buy-credits')}
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

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting || credits < JOB_POSTING_COST}
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
                  <span>Post Job ({JOB_POSTING_COST} KES)</span>
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
