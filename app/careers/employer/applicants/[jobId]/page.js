'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import { getApplicationsForJob, updateApplicationStatus, createJobOrder } from '@/app/actions/zcc-pipeline';
import { unlockCandidateContact, getWalletBalance } from '@/app/actions/zcc-wallet';
import { ZCC_APP_STATUS_FLOW, ZCC_COSTS } from '@/lib/zcc/credit-config';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  ArrowLeft, ChevronRight, Phone, Mail, MapPin, Star, Shield,
  Briefcase, Clock, User, Unlock, Lock, X, Check, AlertCircle,
  MessageSquare, FileText, DollarSign, ChevronDown, ChevronUp,
} from 'lucide-react';

const STATUS_CONFIG = {
  applied: {
    label: 'Applied',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    headerColor: 'bg-blue-50 border-blue-200',
    icon: '📬',
    description: 'New applications',
  },
  screened: {
    label: 'Screened',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    headerColor: 'bg-indigo-50 border-indigo-200',
    icon: '👁️',
    description: 'Reviewed by you',
  },
  shortlisted: {
    label: 'Shortlisted',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    headerColor: 'bg-yellow-50 border-yellow-200',
    icon: '⭐',
    description: 'Top candidates',
  },
  interview: {
    label: 'Interview',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    headerColor: 'bg-purple-50 border-purple-200',
    icon: '🗓️',
    description: 'Scheduled interviews',
  },
  offer: {
    label: 'Offer',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    headerColor: 'bg-orange-50 border-orange-200',
    icon: '📋',
    description: 'Offer extended',
  },
  hired: {
    label: 'Hired',
    color: 'bg-green-100 text-green-800 border-green-300',
    headerColor: 'bg-green-50 border-green-200',
    icon: '✅',
    description: 'Successfully hired',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-300',
    headerColor: 'bg-red-50 border-red-200',
    icon: '❌',
    description: 'Not selected',
  },
};

export default function ApplicantPipelinePage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId;

  const [loading, setLoading] = useState(true);
  const [employer, setEmployer] = useState(null);
  const [listing, setListing] = useState(null);
  const [applications, setApplications] = useState([]);
  const [pipeline, setPipeline] = useState({});
  const [counts, setCounts] = useState({});
  const [creditBalance, setCreditBalance] = useState(0);
  const [error, setError] = useState(null);

  // UI state
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showJobOrderModal, setShowJobOrderModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [showRejected, setShowRejected] = useState(false);

  useEffect(() => {
    loadPipeline();
  }, [jobId]);

  async function loadPipeline() {
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

      setEmployer(roleResult.profiles.employerProfile);

      // Load pipeline data + wallet balance in parallel
      const [pipelineResult, walletResult] = await Promise.all([
        getApplicationsForJob(user.id, jobId),
        getWalletBalance(user.id),
      ]);

      if (!pipelineResult.success) {
        setError(pipelineResult.error);
        return;
      }

      setListing(pipelineResult.listing);
      setApplications(pipelineResult.applications);
      setPipeline(pipelineResult.pipeline);
      setCounts(pipelineResult.counts);

      if (walletResult.success) {
        setCreditBalance(walletResult.balance);
      }
    } catch (err) {
      console.error('Error loading pipeline:', err);
      setError('Failed to load applicant pipeline');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(applicationId, newStatus) {
    setUpdatingStatus(applicationId);
    try {
      const result = await updateApplicationStatus(
        employer.id,
        applicationId,
        newStatus
      );

      if (!result.success) {
        alert(result.error || 'Failed to update status');
        return;
      }

      // Reload pipeline data
      await loadPipeline();
    } catch (err) {
      console.error('Error changing status:', err);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleUnlockContact(app) {
    setSelectedApp(app);
    setShowUnlockModal(true);
  }

  async function confirmUnlockContact() {
    if (!selectedApp) return;
    setUnlocking(true);

    try {
      const result = await unlockCandidateContact(
        employer.id,
        selectedApp.candidate_id,
        listing.id,
        selectedApp.id
      );

      if (!result.success) {
        alert(result.error || 'Failed to unlock contact');
        return;
      }

      if (result.alreadyUnlocked) {
        alert('Contact was already unlocked!');
      }

      // Refresh pipeline to show updated contact info
      await loadPipeline();
      setShowUnlockModal(false);
      setSelectedApp(null);
    } catch (err) {
      console.error('Error unlocking contact:', err);
      alert('Failed to unlock contact');
    } finally {
      setUnlocking(false);
    }
  }

  async function handleCreateJobOrder(app) {
    setSelectedApp(app);
    setShowJobOrderModal(true);
  }

  async function confirmCreateJobOrder(orderData) {
    if (!selectedApp) return;

    try {
      const result = await createJobOrder(employer.id, selectedApp.id, orderData);

      if (!result.success) {
        alert(result.error || 'Failed to create job order');
        return;
      }

      alert(`Job order created for ${result.listingTitle}!`);
      await loadPipeline();
      setShowJobOrderModal(false);
      setSelectedApp(null);
    } catch (err) {
      console.error('Error creating job order:', err);
      alert('Failed to create job order');
    }
  }

  // Filter applications
  const filteredApps = activeFilter === 'all'
    ? applications.filter(a => showRejected || a.status !== 'rejected')
    : applications.filter(a => a.status === activeFilter);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/careers/employer/applicants')}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Back to All Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.push('/careers/employer/applicants')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition text-sm"
          >
            <ArrowLeft size={16} />
            All Jobs
          </button>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{listing?.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {listing?.type === 'gig' ? '⚡ Gig' : '💼 Job'} • {counts.total} applicant{counts.total !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <span className="text-xs text-blue-600 font-medium">Credits Balance</span>
                <p className="text-lg font-bold text-blue-900">{creditBalance}</p>
              </div>
              <button
                onClick={() => router.push('/careers/credits')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Buy Credits
              </button>
            </div>
          </div>

          {/* Pipeline Status Counts */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            <FilterPill
              label={`All (${counts.total})`}
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />
            {ZCC_APP_STATUS_FLOW.map(status => (
              <FilterPill
                key={status}
                label={`${STATUS_CONFIG[status].icon} ${STATUS_CONFIG[status].label} (${counts[status] || 0})`}
                active={activeFilter === status}
                onClick={() => setActiveFilter(status)}
                color={STATUS_CONFIG[status].color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredApps.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {activeFilter === 'all' ? 'No applicants yet' : `No ${STATUS_CONFIG[activeFilter]?.label || activeFilter} applicants`}
            </h3>
            <p className="text-gray-500 text-sm">
              Applications will appear here when candidates apply.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map(app => (
              <ApplicantCard
                key={app.id}
                app={app}
                onStatusChange={handleStatusChange}
                onUnlockContact={handleUnlockContact}
                onCreateJobOrder={handleCreateJobOrder}
                updatingStatus={updatingStatus}
                creditBalance={creditBalance}
              />
            ))}
          </div>
        )}

        {/* Toggle rejected */}
        {activeFilter === 'all' && (counts.rejected || 0) > 0 && (
          <button
            onClick={() => setShowRejected(!showRejected)}
            className="mt-6 text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 mx-auto"
          >
            {showRejected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {showRejected ? 'Hide' : 'Show'} {counts.rejected} rejected applicant{counts.rejected !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Unlock Contact Modal */}
      {showUnlockModal && selectedApp && (
        <Modal onClose={() => { setShowUnlockModal(false); setSelectedApp(null); }}>
          <div className="text-center">
            <Unlock className="w-12 h-12 text-orange-500 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Unlock Contact Info</h3>
            <p className="text-gray-600 mb-4">
              Reveal <strong>{selectedApp.candidate?.full_name}</strong>&apos;s phone number and email?
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-900">
                <strong>{ZCC_COSTS.CONTACT_UNLOCK} credits</strong> will be deducted from your balance.
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Current balance: {creditBalance} credits
              </p>
            </div>
            {creditBalance < ZCC_COSTS.CONTACT_UNLOCK ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-700 font-medium">
                  Insufficient credits. You need {ZCC_COSTS.CONTACT_UNLOCK} credits.
                </p>
                <button
                  onClick={() => { setShowUnlockModal(false); router.push('/careers/credits'); }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline font-medium"
                >
                  Buy credits →
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowUnlockModal(false); setSelectedApp(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUnlockContact}
                  disabled={unlocking}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {unlocking ? 'Unlocking...' : `Unlock (${ZCC_COSTS.CONTACT_UNLOCK} credits)`}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Job Order Modal */}
      {showJobOrderModal && selectedApp && (
        <JobOrderModal
          app={selectedApp}
          listing={listing}
          onClose={() => { setShowJobOrderModal(false); setSelectedApp(null); }}
          onConfirm={confirmCreateJobOrder}
        />
      )}
    </div>
  );
}

// ============================================
// APPLICANT CARD COMPONENT
// ============================================

function ApplicantCard({ app, onStatusChange, onUnlockContact, onCreateJobOrder, updatingStatus, creditBalance }) {
  const [expanded, setExpanded] = useState(false);
  const candidate = app.candidate || {};
  const isUpdating = updatingStatus === app.id;
  const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;

  // Get next possible statuses
  const currentIdx = ZCC_APP_STATUS_FLOW.indexOf(app.status);
  const nextStatuses = [];
  if (currentIdx >= 0 && currentIdx < ZCC_APP_STATUS_FLOW.length - 1) {
    nextStatuses.push(ZCC_APP_STATUS_FLOW[currentIdx + 1]);
  }
  if (app.status !== 'rejected' && app.status !== 'hired') {
    nextStatuses.push('rejected');
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Main Row */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {candidate.avatar_url ? (
              <img src={candidate.avatar_url} alt={candidate.full_name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900">{candidate.full_name}</h3>
              {candidate.verified_id && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  <Shield size={12} /> Verified
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusConfig.color}`}>
                {statusConfig.icon} {statusConfig.label}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 flex-wrap">
              {candidate.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {candidate.location}
                </span>
              )}
              {candidate.experience_years > 0 && (
                <span className="flex items-center gap-1">
                  <Briefcase size={14} /> {candidate.experience_years}y exp
                </span>
              )}
              {candidate.completed_gigs > 0 && (
                <span className="flex items-center gap-1">
                  <Check size={14} /> {candidate.completed_gigs} completed
                </span>
              )}
              {candidate.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-500" /> {candidate.rating}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={14} /> {new Date(app.created_at).toLocaleDateString()}
              </span>
            </div>

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {candidate.skills.slice(0, 5).map((skill, i) => (
                  <span key={i} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
                {candidate.skills.length > 5 && (
                  <span className="text-gray-400 text-xs">+{candidate.skills.length - 5} more</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Contact unlock button */}
            {candidate.contact_unlocked ? (
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
                  <Unlock size={14} /> Contact Unlocked
                </div>
                {candidate.phone && (
                  <a href={`tel:${candidate.phone}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-0.5">
                    <Phone size={12} /> {candidate.phone}
                  </a>
                )}
                {candidate.email && (
                  <a href={`mailto:${candidate.email}`} className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-0.5">
                    <Mail size={12} /> {candidate.email}
                  </a>
                )}
              </div>
            ) : (
              <button
                onClick={() => onUnlockContact(app)}
                className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium text-sm px-3 py-2 rounded-lg border border-orange-200 transition"
              >
                <Lock size={14} /> Unlock ({ZCC_COSTS.CONTACT_UNLOCK}cr)
              </button>
            )}

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
          {nextStatuses.map(nextStatus => {
            const config = STATUS_CONFIG[nextStatus];
            if (!config) return null;

            const isReject = nextStatus === 'rejected';
            return (
              <button
                key={nextStatus}
                onClick={() => onStatusChange(app.id, nextStatus)}
                disabled={isUpdating}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${
                  isReject
                    ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                }`}
              >
                <ChevronRight size={14} />
                {isUpdating ? 'Updating...' : `Move to ${config.label}`}
              </button>
            );
          })}

          {/* Create Job Order (only for hired/offer) */}
          {['offer', 'hired'].includes(app.status) && (
            <button
              onClick={() => onCreateJobOrder(app)}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border bg-green-50 hover:bg-green-100 text-green-700 border-green-200 transition"
            >
              <FileText size={14} /> Create Job Order
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-5 space-y-4">
          {/* Cover Letter */}
          {app.cover_letter && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <MessageSquare size={14} /> Cover Letter
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white rounded-lg border border-gray-200 p-3">
                {app.cover_letter}
              </p>
            </div>
          )}

          {/* Candidate Bio */}
          {candidate.bio && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">About</h4>
              <p className="text-sm text-gray-600">{candidate.bio}</p>
            </div>
          )}

          {/* Status History */}
          {app.status_history && app.status_history.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Status History</h4>
              <div className="space-y-1">
                {app.status_history.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium">{STATUS_CONFIG[entry.from]?.label || entry.from}</span>
                    <ChevronRight size={12} />
                    <span className="font-medium">{STATUS_CONFIG[entry.to]?.label || entry.to}</span>
                    <span>• {new Date(entry.at).toLocaleDateString()}</span>
                    {entry.notes && <span className="text-gray-400">— {entry.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employer Notes */}
          {app.employer_notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">Your Notes</h4>
              <p className="text-sm text-gray-600 bg-white rounded-lg border border-gray-200 p-3">
                {app.employer_notes}
              </p>
            </div>
          )}

          {/* All Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1.5">All Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill, i) => (
                  <span key={i} className="bg-white text-gray-700 text-xs px-2.5 py-1 rounded border border-gray-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// FILTER PILL COMPONENT
// ============================================

function FilterPill({ label, active, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

// ============================================
// MODAL COMPONENT
// ============================================

function Modal({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

// ============================================
// JOB ORDER MODAL COMPONENT
// ============================================

function JobOrderModal({ app, listing, onClose, onConfirm }) {
  const [agreedAmount, setAgreedAmount] = useState(listing?.pay_max || '');
  const [startDate, setStartDate] = useState('');
  const [county, setCounty] = useState(listing?.location || '');
  const [town, setTown] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onConfirm({
        agreedAmount: agreedAmount ? parseInt(agreedAmount) : null,
        startDate: startDate || null,
        county,
        town,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div>
        <FileText className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900 mb-1 text-center">Create Job Order</h3>
        <p className="text-sm text-gray-500 text-center mb-4">
          Formalize the agreement with <strong>{app.candidate?.full_name}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agreed Pay (KES)</label>
            <input
              type="number"
              value={agreedAmount}
              onChange={e => setAgreedAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. 25000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
              <input
                type="text"
                value={county}
                onChange={e => setCounty(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Nairobi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Town</label>
              <input
                type="text"
                value={town}
                onChange={e => setTown(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Westlands"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
