'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import { getEmployerJobsWithApplicants } from '@/app/actions/zcc-pipeline';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  ArrowLeft, Users, Briefcase, Zap, ChevronRight, Search,
  Filter, Clock,
} from 'lucide-react';

const STATUS_DOTS = {
  applied: { color: 'bg-blue-500', label: 'Applied' },
  screened: { color: 'bg-indigo-500', label: 'Screened' },
  shortlisted: { color: 'bg-yellow-500', label: 'Shortlisted' },
  interview: { color: 'bg-purple-500', label: 'Interview' },
  offer: { color: 'bg-orange-500', label: 'Offer' },
  hired: { color: 'bg-green-500', label: 'Hired' },
  rejected: { color: 'bg-red-400', label: 'Rejected' },
};

export default function ApplicantsHubPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, job, gig
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, paused, closed

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

      const roleResult = await getUserRoleStatus(user.id);
      if (!roleResult.roles.employer) {
        router.push('/careers/onboarding');
        return;
      }

      const result = await getEmployerJobsWithApplicants(user.id);
      if (result.success) {
        setJobs(result.jobs);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error loading applicants hub:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // Filter jobs
  const filteredJobs = jobs
    .filter(j => {
      if (typeFilter !== 'all' && j.type !== typeFilter) return false;
      if (statusFilter !== 'all' && j.status !== statusFilter) return false;
      if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      // Sort by applicant count (most first), then by date
      const aCount = a.application_count || 0;
      const bCount = b.application_count || 0;
      if (bCount !== aCount) return bCount - aCount;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  // Stats
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.application_count || 0), 0);
  const jobsWithApplicants = jobs.filter(j => (j.application_count || 0) > 0).length;
  const newApplicants = jobs.reduce((sum, j) => sum + (j.status_counts?.applied || 0), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/careers/employer/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition text-sm"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Applicants</h1>
          <p className="text-gray-500 mt-1">Manage applications across all your listings</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Total Applicants</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalApplicants}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">New (Unreviewed)</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{newApplicants}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">Jobs with Applicants</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{jobsWithApplicants}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by job title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Types</option>
            <option value="job">💼 Jobs</option>
            <option value="gig">⚡ Gigs</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">🟢 Active</option>
            <option value="paused">⏸️ Paused</option>
            <option value="closed">🔴 Closed</option>
          </select>
        </div>

        {/* Jobs List */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No listings found</h3>
            <p className="text-gray-500 text-sm mb-4">
              {jobs.length === 0
                ? 'Post a job or gig to start receiving applications.'
                : 'Try adjusting your filters.'}
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => router.push('/careers/employer/post-job')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-lg transition"
              >
                Post a Job
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map(job => (
              <JobApplicantCard key={job.id} job={job} onClick={() => router.push(`/careers/employer/applicants/${job.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function JobApplicantCard({ job, onClick }) {
  const appCount = job.application_count || 0;
  const sc = job.status_counts || {};
  const daysAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-md transition group"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{job.type === 'gig' ? '⚡' : '💼'}</span>
            <h3 className="text-lg font-bold text-gray-900 truncate">{job.title}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              job.status === 'active'
                ? 'bg-green-100 text-green-800'
                : job.status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {job.status}
            </span>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            {job.location && <span>{job.location}</span>}
            {job.category && <span>• {job.category}</span>}
            <span className="flex items-center gap-1">
              <Clock size={13} /> {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
            </span>
          </div>

          {/* Pipeline dots */}
          {appCount > 0 && (
            <div className="flex items-center gap-2 mt-3">
              {Object.entries(STATUS_DOTS).map(([status, config]) => {
                const count = sc[status] || 0;
                if (count === 0) return null;
                return (
                  <span
                    key={status}
                    className="flex items-center gap-1 text-xs text-gray-500"
                    title={config.label}
                  >
                    <span className={`w-2 h-2 rounded-full ${config.color}`} />
                    {count} {config.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className={`text-2xl font-bold ${appCount > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
              {appCount}
            </p>
            <p className="text-xs text-gray-500">applicant{appCount !== 1 ? 's' : ''}</p>
          </div>
          <ChevronRight size={20} className="text-gray-400 group-hover:text-orange-500 transition" />
        </div>
      </div>
    </button>
  );
}
