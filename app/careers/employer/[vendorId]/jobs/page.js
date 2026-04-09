'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, Edit2, Trash2, Eye, ChevronDown } from 'lucide-react';

export default function EmployerJobsPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, paused, closed
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const vendorId = params?.vendorId; // Get vendor UUID from URL

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
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

      // Verify the URL vendor ID matches the logged-in employer
      if (vendorId && vendorId !== employerProfile.id) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      // Fetch all jobs for this employer
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          category,
          location,
          pay_min,
          pay_max,
          job_type,
          start_date,
          status,
          type,
          created_at,
          updated_at,
          applications(count)
        `)
        .eq('employer_id', employerProfile.id)
        .eq('type', 'job')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setJobs(data || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', jobId)
        .eq('employer_id', employer.id);

      if (error) {
        throw new Error(error.message);
      }

      setJobs(jobs.filter(j => j.id !== jobId));
      setExpandedJobId(null);
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job. Please try again.');
    }
  }

  async function handleStatusChange(jobId, newStatus) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', jobId)
        .eq('employer_id', employer.id);

      if (error) {
        throw new Error(error.message);
      }

      setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      setExpandedJobId(null);
    } catch (err) {
      console.error('Error updating job status:', err);
      alert('Failed to update job status. Please try again.');
    }
  }

  function handleEditJob(jobId) {
    router.push(`/careers/employer/${vendorId}/edit-job/${jobId}`);
  }

  function handleViewJob(jobId) {
    window.open(`/careers/jobs/${jobId}`, '_blank');
  }

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);
  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const pausedJobs = jobs.filter(j => j.status === 'paused').length;
  const closedJobs = jobs.filter(j => j.status === 'closed').length;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-900 mb-2">Unauthorized</h1>
          <p className="text-red-700 mb-4">You don't have access to this vendor's jobs.</p>
          <button
            onClick={() => router.push('/careers/employer/dashboard')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error || !employer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-bold text-red-900 mb-2">Error</h1>
          <p className="text-red-700 mb-4">{error || 'Failed to load jobs'}</p>
          <button
            onClick={() => loadJobs()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Job Postings</h1>
            <button
              onClick={() => router.push('/careers/employer/post-job')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Post New Job
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-semibold">Total Jobs</p>
              <p className="text-3xl font-bold text-blue-900">{jobs.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 font-semibold">Active</p>
              <p className="text-3xl font-bold text-green-900">{activeJobs}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-600 font-semibold">Paused</p>
              <p className="text-3xl font-bold text-yellow-900">{pausedJobs}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-semibold">Closed</p>
              <p className="text-3xl font-bold text-gray-900">{closedJobs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          {['all', 'active', 'paused', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-lg font-semibold transition capitalize ${
                filter === f
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-500'
              }`}
            >
              {f === 'all' ? 'All Jobs' : f}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 font-medium mb-4">No {filter !== 'all' ? filter : ''} jobs found</p>
            <button
              onClick={() => router.push('/careers/employer/post-job')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition"
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-orange-500 hover:shadow-lg transition-all"
              >
                {/* Job Card Header */}
                <button
                  onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                  className="w-full flex items-start justify-between p-6 hover:bg-gray-50 transition"
                >
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.category}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          job.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : job.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {job.applications?.[0]?.count || 0} application{(job.applications?.[0]?.count || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-gray-400 transition-transform ${
                        expandedJobId === job.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedJobId === job.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
                    {/* Job Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Description</p>
                        <p className="text-sm text-gray-700">{job.description || 'No description'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Location</p>
                        <p className="text-sm text-gray-700">{job.location}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Pay Range</p>
                        <p className="text-sm text-gray-700">
                          {job.pay_min && job.pay_max
                            ? `KES ${job.pay_min.toLocaleString()} - ${job.pay_max.toLocaleString()}`
                            : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Job Type</p>
                        <p className="text-sm text-gray-700 capitalize">{job.job_type || 'Full-time'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Start Date</p>
                        <p className="text-sm text-gray-700">
                          {job.start_date
                            ? new Date(job.start_date).toLocaleDateString('en-KE')
                            : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Posted</p>
                        <p className="text-sm text-gray-700">
                          {new Date(job.created_at).toLocaleDateString('en-KE')}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewJob(job.id)}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                      >
                        <Eye size={16} />
                        View Public
                      </button>
                      <button
                        onClick={() => handleEditJob(job.id)}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>

                      {job.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(job.id, 'paused')}
                          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                        >
                          ⏸️ Pause
                        </button>
                      )}

                      {job.status === 'paused' && (
                        <button
                          onClick={() => handleStatusChange(job.id, 'active')}
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                        >
                          🟢 Reactivate
                        </button>
                      )}

                      {job.status !== 'closed' && (
                        <button
                          onClick={() => handleStatusChange(job.id, 'closed')}
                          className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                        >
                          ✅ Close
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition ml-auto"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
