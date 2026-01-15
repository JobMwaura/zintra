'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  CheckCircle, XCircle, Clock, FileText, ExternalLink, 
  AlertCircle, MessageSquare, Eye, Download 
} from 'lucide-react';

export default function AdminVerificationDashboard() {
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'pending_update' | 'all' | 'approved' | 'rejected'
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(''); // 'approve' | 'approve_update' | 'reject' | 'request_info'
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestedInfo, setRequestedInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('vendor_verification_documents')
        .select(`
          *,
          vendors (
            id,
            company_name,
            business_name,
            business_logo,
            location,
            contact_email,
            contact_phone
          )
        `)
        .order('submitted_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVerifications(data || []);
    } catch (err) {
      console.error('Error fetching verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (verification, action) => {
    setSelectedVerification(verification);
    setReviewAction(action);
    setAdminNotes('');
    setRejectionReason('');
    setRequestedInfo('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedVerification) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get admin user ID
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!adminUser) {
        alert('You are not authorized to review verifications');
        return;
      }

      // Update verification document
      const updateData = {
        reviewed_at: new Date().toISOString(),
        reviewed_by_admin_id: adminUser.id,
        admin_notes: adminNotes,
      };

      if (reviewAction === 'approve') {
        updateData.status = 'approved';
      } else if (reviewAction === 'approve_update') {
        // Use the approve_verification_update function for updates
        const { data: result, error: approveError } = await supabase
          .rpc('approve_verification_update', {
            update_document_id: selectedVerification.id,
            admin_id: adminUser.id
          });

        if (approveError) throw approveError;
        
        if (result && result[0]?.success) {
          alert('Verification update approved successfully!');
          setShowReviewModal(false);
          fetchVerifications();
        } else {
          throw new Error(result?.[0]?.message || 'Failed to approve update');
        }
        setSubmitting(false);
        return;
      } else if (reviewAction === 'reject') {
        updateData.status = 'rejected';
        updateData.rejection_reason = rejectionReason;
      } else if (reviewAction === 'request_info') {
        updateData.status = 'more_info_needed';
        updateData.requested_additional_info = requestedInfo;
      }

      const { error } = await supabase
        .from('vendor_verification_documents')
        .update(updateData)
        .eq('id', selectedVerification.id);

      if (error) throw error;

      // Refresh list
      await fetchVerifications();
      setShowReviewModal(false);
      setSelectedVerification(null);

      // TODO: Send email notification to vendor
      alert(`Verification ${reviewAction === 'approve' ? 'approved' : reviewAction === 'reject' ? 'rejected' : 'info requested'}!`);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending Review' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rejected' },
      more_info_needed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: AlertCircle, label: 'Info Needed' },
      pending_update: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Clock, label: 'Update Pending' },
      superseded: { bg: 'bg-gray-100', text: 'text-gray-600', icon: FileText, label: 'Superseded' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Verification</h1>
        <p className="text-gray-600 mt-2">Review and approve vendor business documents</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {['pending', 'pending_update', 'all', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'pending_update' ? 'Updates' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Verifications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading verifications...</p>
        </div>
      ) : verifications.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No verifications to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((verification) => (
            <div
              key={verification.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {verification.vendors?.company_name || verification.vendors?.business_name}
                    </h3>
                    {getStatusBadge(verification.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    Submitted {new Date(verification.submitted_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Document Type</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {verification.document_type.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registered Business Name</p>
                  <p className="font-medium text-gray-900">{verification.registered_business_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Registration Number</p>
                  <p className="font-medium text-gray-900">{verification.registration_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Country</p>
                  <p className="font-medium text-gray-900">{verification.country_of_registration}</p>
                </div>
              </div>

              {verification.business_address && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Business Address</p>
                  <p className="font-medium text-gray-900">{verification.business_address}</p>
                </div>
              )}

              {verification.rejection_reason && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-900">Rejection Reason:</p>
                  <p className="text-sm text-red-700 mt-1">{verification.rejection_reason}</p>
                </div>
              )}

              {verification.admin_notes && (
                <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-900">Admin Notes:</p>
                  <p className="text-sm text-gray-700 mt-1">{verification.admin_notes}</p>
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={verification.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  <Eye className="w-4 h-4" />
                  View Document
                  <ExternalLink className="w-3 h-3" />
                </a>

                {verification.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleReview(verification, 'approve')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(verification, 'reject')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleReview(verification, 'request_info')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Request Info
                    </button>
                  </>
                )}

                {verification.status === 'pending_update' && (
                  <>
                    <button
                      onClick={() => handleReview(verification, 'approve_update')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Update
                    </button>
                    <button
                      onClick={() => handleReview(verification, 'reject')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Update
                    </button>
                    <button
                      onClick={() => handleReview(verification, 'request_info')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Request Info
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {reviewAction === 'approve' && 'Approve Verification'}
                {reviewAction === 'approve_update' && 'Approve Verification Update'}
                {reviewAction === 'reject' && 'Reject Verification'}
                {reviewAction === 'request_info' && 'Request Additional Information'}
              </h2>
              <p className="text-gray-600 mt-1">
                {selectedVerification.vendors?.company_name || selectedVerification.vendors?.business_name}
              </p>
              {reviewAction === 'approve_update' && (
                <p className="text-sm text-purple-600 mt-1">
                  This is an update to existing verification documents
                </p>
              )}
            </div>

            <div className="p-6 space-y-4">
              {reviewAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows="4"
                    placeholder="Explain why the verification is being rejected..."
                    required
                  />
                </div>
              )}

              {reviewAction === 'request_info' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Information Required *
                  </label>
                  <textarea
                    value={requestedInfo}
                    onChange={(e) => setRequestedInfo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="4"
                    placeholder="Specify what additional information or documents are needed..."
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Internal notes for reference..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submitting || (reviewAction === 'reject' && !rejectionReason) || (reviewAction === 'request_info' && !requestedInfo)}
                className={`px-6 py-2 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  reviewAction === 'approve' || reviewAction === 'approve_update' ? 'bg-green-600 hover:bg-green-700' :
                  reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {submitting ? 'Submitting...' : 
                  reviewAction === 'approve_update' ? 'Approve Update' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
