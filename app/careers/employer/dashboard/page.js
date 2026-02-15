'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus, getEmployerStats, getEmployerJobs, getEmployerApplications } from '@/app/actions/vendor-zcc';
import { getWalletBalance } from '@/app/actions/zcc-wallet';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function EmployerDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [credits, setCredits] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
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

      // Load all dashboard data in parallel
      const [statsResult, jobsResult, appsResult, walletResult] = await Promise.all([
        getEmployerStats(employerProfile.id),
        getEmployerJobs(employerProfile.id, 5),
        getEmployerApplications(employerProfile.id, 5),
        getWalletBalance(user.id),
      ]);

      if (statsResult.success) {
        setStats(statsResult.stats);
      }

      if (jobsResult.success) {
        setJobs(jobsResult.jobs);
      }

      if (appsResult.success) {
        setApplications(appsResult.applications);
      }

      if (walletResult.success) {
        setCredits(walletResult.balance);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !employer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-bold text-red-900 mb-2">Error</h1>
          <p className="text-red-700 mb-4">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={() => loadDashboard()}
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
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {employer.company_name}
              </h1>
              <p className="text-slate-600 mt-1">
                {employer.is_vendor_employer ? '✓ Verified Vendor' : 'Employer Account'}
              </p>
            </div>
            <button
              onClick={() => router.push('/careers/employer/post-job')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition flex items-center gap-2"
            >
              <span>+</span> Post New Job
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Applicant Alert Banner */}
        {(stats?.pending_applications || 0) > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📬</span>
              <div>
                <p className="font-semibold text-blue-900">
                  {stats.pending_applications} new application{stats.pending_applications !== 1 ? 's' : ''} waiting
                </p>
                <p className="text-sm text-blue-700">Review and move candidates through your pipeline</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/careers/employer/applicants')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
            >
              View Applicants →
            </button>
          </div>
        )}
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Credits Balance"
            value={credits}
            icon="💳"
            action={{
              text: 'Buy Credits',
              onClick: () => router.push('/careers/credits'),
            }}
          />
          <StatCard
            label="Active Jobs"
            value={stats?.active_jobs || 0}
            icon="💼"
          />
          <StatCard
            label="Pending Applications"
            value={stats?.pending_applications || 0}
            icon="📬"
          />
          <StatCard
            label="Total Hired"
            value={stats?.total_hired || 0}
            icon="✅"
          />
        </div>

        {/* Spending & Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Spending */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Monthly Spending</h2>
            <div className="space-y-3">
              <SpendingRow
                label="Job Postings"
                amount={stats?.posting_spent || 0}
                icon="📝"
              />
              <SpendingRow
                label="Contact Unlocks"
                amount={stats?.unlocks_spent || 0}
                icon="🔓"
              />
              <SpendingRow
                label="Job Boosts"
                amount={stats?.boosts_spent || 0}
                icon="⭐"
              />
              <div className="border-t border-slate-200 pt-3 mt-3">
                <SpendingRow
                  label="Total Spent"
                  amount={stats?.month_spending || 0}
                  bold
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <ActionButton
                icon="📝"
                label="Post Job"
                onClick={() => router.push('/careers/employer/post-job')}
              />
              <ActionButton
                icon="⚡"
                label="Post Gig"
                onClick={() => router.push('/careers/employer/post-gig')}
              />
              <ActionButton
                icon="👥"
                label="View Applicants"
                onClick={() => router.push('/careers/employer/applicants')}
              />
              <ActionButton
                icon="💳"
                label="Buy Credits"
                onClick={() => router.push('/careers/credits')}
              />
              <ActionButton
                icon="📊"
                label="View All Jobs"
                onClick={() => router.push('/careers/employer/jobs')}
              />
              <ActionButton
                icon="⚙️"
                label="Company Settings"
                onClick={() => router.push('/careers/me/employer')}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Jobs */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Recent Jobs</h2>
              {jobs.length > 0 && (
                <button
                  onClick={() => router.push('/careers/employer/jobs')}
                  className="text-orange-600 hover:text-orange-700 font-semibold text-sm"
                >
                  View All →
                </button>
              )}
            </div>
            {jobs.length === 0 ? (
              <p className="text-slate-600 py-8 text-center">
                No jobs posted yet.{' '}
                <button
                  onClick={() => router.push('/careers/employer/post-job')}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Post your first job
                </button>
              </p>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <JobRow key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Recent Applications</h2>
              {applications.length > 0 && (
                <button
                  onClick={() => router.push('/careers/employer/applicants')}
                  className="text-orange-600 hover:text-orange-700 font-semibold text-sm"
                >
                  View All →
                </button>
              )}
            </div>
            {applications.length === 0 ? (
              <p className="text-slate-600 py-8 text-center">
                No applications yet. Applications will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <ApplicationRow key={app.id} application={app} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, action }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded font-medium transition"
          >
            {action.text}
          </button>
        )}
      </div>
      <p className="text-slate-600 text-sm mb-1">{label}</p>
      <p className="text-4xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function SpendingRow({ label, amount, icon, bold }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span>{label}</span>
      </div>
      <span>{amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 })}</span>
    </div>
  );
}

function ActionButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition text-left font-medium text-slate-900"
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function JobRow({ job }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{job.title}</p>
        <p className="text-sm text-slate-600">
          {job.status === 'active' ? '🟢 Active' : '⚪ ' + job.status}
        </p>
      </div>
      <p className="text-sm font-medium text-slate-900">
        {job.applications?.count || 0} applications
      </p>
    </div>
  );
}

function ApplicationRow({ application }) {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex-1">
        <p className="font-semibold text-slate-900">
          {application.listings?.title}
        </p>
        <p className="text-sm text-slate-600">
          {application.status === 'applied'
            ? '📬 New Application'
            : application.status === 'shortlisted'
            ? '⭐ Shortlisted'
            : '✅ ' + application.status}
        </p>
      </div>
      <p className="text-xs text-slate-500">
        {new Date(application.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}
