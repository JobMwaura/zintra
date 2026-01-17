'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ArrowLeft, Edit2, Trash2, Eye, ChevronDown } from 'lucide-react';

export default function EmployerGigsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, paused, closed
  const [expandedGigId, setExpandedGigId] = useState(null);

  useEffect(() => {
    loadGigs();
  }, []);

  async function loadGigs() {
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

      // Fetch all gigs for THIS EMPLOYER ONLY
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
          duration,
          job_type,
          start_date,
          status,
          type,
          created_at,
          updated_at,
          applications(count)
        `)
        .eq('employer_id', employerProfile.id)
        .eq('type', 'gig')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setGigs(data || []);
    } catch (err) {
      console.error('Error loading gigs:', err);
      setError('Failed to load gigs');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGig(gigId) {
    if (!confirm('Are you sure you want to delete this gig? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', gigId)
        .eq('employer_id', employer.id);

      if (error) {
        throw new Error(error.message);
      }

      setGigs(gigs.filter(g => g.id !== gigId));
      setExpandedGigId(null);
    } catch (err) {
      console.error('Error deleting gig:', err);
      alert('Failed to delete gig. Please try again.');
    }
  }

  async function handleStatusChange(gigId, newStatus) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus })
        .eq('id', gigId)
        .eq('employer_id', employer.id);

      if (error) {
        throw new Error(error.message);
      }

      setGigs(gigs.map(g => g.id === gigId ? { ...g, status: newStatus } : g));
      setExpandedGigId(null);
    } catch (err) {
      console.error('Error updating gig status:', err);
      alert('Failed to update gig status. Please try again.');
    }
  }

  const filteredGigs = filter === 'all' ? gigs : gigs.filter(g => g.status === filter);
  const activeGigs = gigs.filter(g => g.status === 'active').length;
  const pausedGigs = gigs.filter(g => g.status === 'paused').length;
  const closedGigs = gigs.filter(g => g.status === 'closed').length;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !employer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h1 className="text-xl font-bold text-red-900 mb-2">Error</h1>
          <p className="text-red-700 mb-4">{error || 'Failed to load gigs'}</p>
          <button
            onClick={() => loadGigs()}
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
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/careers/employer/dashboard')}
              className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Gigs</h1>
            <button
              onClick={() => router.push('/careers/employer/post-job')}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition"
            >
              Post Gig
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200 -mb-px">
            {[
              { key: 'all', label: 'All Gigs', count: gigs.length },
              { key: 'active', label: 'Active', count: activeGigs },
              { key: 'paused', label: 'Paused', count: pausedGigs },
              { key: 'closed', label: 'Closed', count: closedGigs },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-3 font-medium border-b-2 transition ${
                  filter === tab.key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} <span className="text-sm ml-1">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredGigs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">No gigs yet</h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? 'You haven\'t posted any gigs yet. Start by creating your first gig!'
                : `You don't have any ${filter} gigs.`}
            </p>
            <button
              onClick={() => router.push('/careers/employer/post-job')}
              className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition"
            >
              Post Your First Gig
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGigs.map(gig => (
              <div
                key={gig.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-orange-500 transition"
              >
                {/* Header */}
                <div
                  onClick={() =>
                    setExpandedGigId(expandedGigId === gig.id ? null : gig.id)
                  }
                  className="p-6 cursor-pointer flex items-start justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{gig.title}</h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          gig.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : gig.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {gig.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {gig.location} • {gig.duration || gig.job_type} • {gig.category}
                    </p>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-orange-600">
                      {gig.applications?.[0]?.count || 0}
                    </p>
                    <p className="text-xs text-gray-500">applications</p>
                  </div>

                  <ChevronDown
                    size={20}
                    className={`text-gray-400 transition ml-4 ${
                      expandedGigId === gig.id ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Expanded Details */}
                {expandedGigId === gig.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-4">
                    {/* Description */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Description</p>
                      <p className="text-gray-900 whitespace-pre-wrap text-sm">
                        {gig.description || 'No description provided'}
                      </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Category</p>
                        <p className="text-sm font-bold text-gray-900">{gig.category}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
                        <p className="text-sm font-bold text-gray-900">{gig.location}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Duration</p>
                        <p className="text-sm font-bold text-gray-900">
                          {gig.duration || gig.job_type || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Min Pay</p>
                        <p className="text-sm font-bold text-orange-600">
                          KES {gig.pay_min?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Max Pay</p>
                        <p className="text-sm font-bold text-orange-600">
                          KES {gig.pay_max?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Start Date</p>
                        <p className="text-sm font-bold text-gray-900">
                          {gig.start_date
                            ? new Date(gig.start_date).toLocaleDateString('en-KE')
                            : 'TBD'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() =>
                          router.push(
                            `/careers/employer/edit-job/${gig.id}?type=gig`
                          )
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium rounded-lg transition"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>

                      <button
                        onClick={() => router.push(`/careers/gigs/${gig.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-lg transition"
                      >
                        <Eye size={16} />
                        View
                      </button>

                      {gig.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(gig.id, 'paused')}
                          className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium rounded-lg transition"
                        >
                          ⏸️ Pause
                        </button>
                      ) : gig.status === 'paused' ? (
                        <button
                          onClick={() => handleStatusChange(gig.id, 'active')}
                          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 font-medium rounded-lg transition"
                        >
                          🟢 Reactivate
                        </button>
                      ) : null}

                      {gig.status !== 'closed' && (
                        <button
                          onClick={() => handleStatusChange(gig.id, 'closed')}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-lg transition"
                        >
                          ✅ Close
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteGig(gig.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-medium rounded-lg transition ml-auto"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                      <p>Created: {new Date(gig.created_at).toLocaleString('en-KE')}</p>
                      <p>Updated: {new Date(gig.updated_at).toLocaleString('en-KE')}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
