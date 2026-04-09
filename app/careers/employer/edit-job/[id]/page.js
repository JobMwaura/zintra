'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

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

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    payMin: '',
    payMax: '',
    jobType: 'full-time',
    startDate: '',
  });

  useEffect(() => {
    loadJob();
  }, []);

  async function loadJob() {
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

      // Fetch job details
      const { data, error: jobError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', jobId)
        .eq('employer_id', employerProfile.id)
        .single();

      if (jobError) {
        throw new Error('Job not found or you do not have permission to edit it');
      }

      // Pre-fill form
      setFormData({
        title: data.title || '',
        description: data.description || '',
        category: data.category || '',
        location: data.location || '',
        payMin: data.pay_min?.toString() || '',
        payMax: data.pay_max?.toString() || '',
        jobType: data.job_type || 'full-time',
        startDate: data.start_date ? data.start_date.split('T')[0] : '',
      });
    } catch (err) {
      console.error('Error loading job:', err);
      setError('Failed to load job details');
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

      setSubmitting(true);

      const supabase = createClient();

      // Update listing
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          pay_min: parseInt(formData.payMin),
          pay_max: parseInt(formData.payMax),
          job_type: formData.jobType,
          start_date: formData.startDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('employer_id', employer.id);

      if (updateError) {
        throw new Error('Failed to update job: ' + updateError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/careers/employer/jobs');
      }, 2000);
    } catch (err) {
      console.error('Error updating job:', err);
      setError(err.message || 'Failed to update job');
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
          <p className="text-red-700 mb-4">{error || 'You must have an employer profile to edit jobs.'}</p>
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
      <div className="bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white hover:text-orange-100 mb-4 transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-3xl font-bold text-white">Edit Job Posting</h1>
          <p className="text-orange-100 mt-1">Update job details, pay range, or other information</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                Job updated successfully! Redirecting...
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
              disabled={submitting}
              className={`flex-1 font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2 ${
                submitting
                  ? 'bg-orange-400 text-white cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer'
              }`}
            >
              {submitting ? (
                <>
                  <span>Updating job...</span>
                </>
              ) : (
                <>
                  <span>Save Changes</span>
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
          <h3 className="font-bold text-blue-900 mb-3">💡 Editing Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Update details as you learn more about what you're looking for</li>
            <li>✓ Adjust pay range if you want to attract more candidates</li>
            <li>✓ Refresh the job listing when you make major updates</li>
            <li>✓ No credits charged for editing an existing job</li>
            <li>✓ Changes take effect immediately</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
