'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, Edit2, Trash2, Eye, ChevronDown } from 'lucide-react';

export default function EmployerJobsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, paused, closed
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
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

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);
  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const pausedJobs = jobs.filter(j => j.status === 'paused').length;
  const closedJobs = jobs.filter(j => j.status === 'closed').length;

  if (loading) {
    return <LoadingSpinner />;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white hover:text-orange-100 mb-4 transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="text-4xl font-bold text-white">My Job Postings</h1>
          <p className="text-orange-100 mt-2">Manage and edit all your job listings</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Jobs"
            value={jobs.length}
            icon="📋"
            onClick={() => setFilter('all')}
            active={filter === 'all'}
          />
          <StatCard
            label="Active"
            value={activeJobs}
            icon="🟢"
            onClick={() => setFilter('active')}
            active={filter === 'active'}
          />
          <StatCard
            label="Paused"
            value={pausedJobs}
            icon="⏸️"
            onClick={() => setFilter('paused')}
            active={filter === 'paused'}
          />
          <StatCard
            label="Closed"
            value={closedJobs}
            icon="✅"
            onClick={() => setFilter('closed')}
            active={filter === 'closed'}
          />
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 text-lg mb-4">
                {jobs.length === 0
                  ? "You haven't posted any jobs yet."
                  : `No ${filter} jobs to show.`}
              </p>
              {jobs.length === 0 && (
                <button
                  onClick={() => router.push('/careers/employer/post-job')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition"
                >
                  Post Your First Job
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  expanded={expandedJobId === job.id}
                  onToggleExpand={() =>
                    setExpandedJobId(expandedJobId === job.id ? null : job.id)
                  }
                  onEdit={() => {
                    setEditingJobId(job.id);
                    router.push(`/careers/employer/edit-job/${job.id}`);
                  }}
                  onDelete={() => handleDeleteJob(job.id)}
                  onStatusChange={(newStatus) => handleStatusChange(job.id, newStatus)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-3">💡 Job Management Tips</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✓ Keep jobs active to receive applications</li>
            <li>✓ Pause jobs temporarily if you're overwhelmed with applications</li>
            <li>✓ Edit jobs to add more details or adjust pay range</li>
            <li>✓ Close jobs once you've hired someone</li>
            <li>✓ Each job posting costs 1000 KES in credits</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-lg font-semibold text-center transition ${
        active
          ? 'bg-orange-100 border-2 border-orange-500 text-orange-900'
          : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-orange-300'
      }`}
    >
      <p className="text-3xl mb-2">{icon}</p>
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </button>
  );
}

function JobCard({ job, expanded, onToggleExpand, onEdit, onDelete, onStatusChange }) {
  const applicationCount = job.applications?.[0]?.count || 0;
  const daysAgo = Math.floor(
    (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="p-6 hover:bg-slate-50 transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              job.status === 'active'
                ? 'bg-emerald-100 text-emerald-800'
                : job.status === 'paused'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-slate-100 text-slate-800'
            }`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
          <p className="text-sm text-slate-600">{job.location}</p>
        </div>
        <button
          onClick={onToggleExpand}
          className="p-2 hover:bg-slate-200 rounded-lg transition"
        >
          <ChevronDown
            size={20}
            className={`text-slate-600 transition ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Summary Row */}
      <div className="flex items-center gap-6 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-lg">💼</span>
          <span className="text-sm font-medium text-slate-700">
            {job.job_type === 'full-time'
              ? 'Full Time'
              : job.job_type === 'part-time'
              ? 'Part Time'
              : 'Gig'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <span className="text-sm font-medium text-slate-700">
            {job.pay_min?.toLocaleString()} - {job.pay_max?.toLocaleString()} KES
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">📬</span>
          <span className="text-sm font-medium text-slate-700">
            {applicationCount} {applicationCount === 1 ? 'Application' : 'Applications'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🕐</span>
          <span className="text-sm text-slate-500">
            {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-slate-200 pt-4 mt-4">
          {/* Description */}
          <div className="mb-6">
            <h4 className="font-semibold text-slate-900 mb-2">Description</h4>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
            <DetailItem label="Category" value={job.category} />
            <DetailItem label="Type" value={job.type === 'job' ? 'Job' : 'Gig'} />
            <DetailItem
              label="Start Date"
              value={job.start_date ? new Date(job.start_date).toLocaleDateString() : 'Not specified'}
            />
            <DetailItem label="Posted" value={new Date(job.created_at).toLocaleDateString()} />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {job.status === 'active' ? (
              <button
                onClick={() => onStatusChange('paused')}
                className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium rounded-lg transition flex items-center gap-2"
              >
                ⏸️ Pause Job
              </button>
            ) : job.status === 'paused' ? (
              <button
                onClick={() => onStatusChange('active')}
                className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-medium rounded-lg transition flex items-center gap-2"
              >
                🟢 Reactivate
              </button>
            ) : null}

            {job.status !== 'closed' && (
              <button
                onClick={() => onStatusChange('closed')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg transition flex items-center gap-2"
              >
                ✅ Close Job
              </button>
            )}

            <button
              onClick={onEdit}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium rounded-lg transition flex items-center gap-2"
            >
              <Edit2 size={16} />
              Edit
            </button>

            <button
              onClick={() => window.open(`/careers/jobs/${job.id}`, '_blank')}
              className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-medium rounded-lg transition flex items-center gap-2"
            >
              <Eye size={16} />
              View
            </button>

            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 font-medium rounded-lg transition flex items-center gap-2 ml-auto"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 uppercase mb-1">{label}</p>
      <p className="text-sm text-slate-900 font-medium">{value}</p>
    </div>
  );
}
