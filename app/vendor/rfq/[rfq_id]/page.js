'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  DollarSign,
  MapPin,
  User,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle,
  X,
  XCircle,
  ThumbsDown,
  Ban
} from 'lucide-react';

export default function VendorRFQDetails() {
  const router = useRouter();
  const params = useParams();
  const { user: authUser, loading: authLoading } = useAuth();
  const supabase = createClient();
  const rfqId = params.rfq_id;

  const [rfq, setRfq] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [responseCount, setResponseCount] = useState(0);
  const [userResponse, setUserResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Decline modal state
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineNotes, setDeclineNotes] = useState('');
  const [declining, setDeclining] = useState(false);
  const [declineError, setDeclineError] = useState(null);
  const [declineSuccess, setDeclineSuccess] = useState(false);

  const DECLINE_REASONS = [
    'Outside my service area',
    'Currently at full capacity',
    'Budget does not match our pricing',
    'Not within my area of expertise',
    'Timeline is too tight',
    'Project scope is unclear',
    'Other'
  ];

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return;
    }

    if (!authUser) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [rfqId, authUser, authLoading, router]);

  const fetchData = async () => {
    try {
      let isMounted = true;
      setLoading(true);

      if (!authUser) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      setUser(authUser);

      // Fetch all data with timeout
      await Promise.race([
        (async () => {
          try {
            // Fetch vendor profile
            const { data: vendor } = await supabase
              .from('vendors')
              .select('*')
              .eq('user_id', authUser.id)
              .single();

            if (isMounted) {
              setVendorProfile(vendor);
            }

            // Fetch RFQ
            const { data: rfqData, error: rfqError } = await supabase
              .from('rfqs')
              .select('*')
              .eq('id', rfqId)
              .single();

            if (rfqError || !rfqData) {
              if (isMounted) {
                setError('RFQ not found');
              }
              return;
            }

            if (isMounted) {
              setRfq(rfqData);
            }

            // Fetch response count
            const { count } = await supabase
              .from('rfq_responses')
              .select('id', { count: 'exact' })
              .eq('rfq_id', rfqId);

            if (isMounted) {
              setResponseCount(count || 0);
            }

            // Check if user already responded
            if (vendor) {
              const { data: userResp } = await supabase
                .from('rfq_responses')
                .select('*')
                .eq('rfq_id', rfqId)
                .eq('vendor_id', vendor.id)
                .maybeSingle();

              if (isMounted) {
                setUserResponse(userResp);
              }
            }
          } catch (err) {
            console.error('Error in data fetch:', err);
            if (isMounted) {
              setError(err.message);
            }
          }
        })(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Data fetch timeout')), 15000)
        )
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.message === 'Data fetch timeout') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason) {
      setDeclineError('Please select a reason for declining');
      return;
    }

    try {
      setDeclining(true);
      setDeclineError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setDeclineError('You must be logged in');
        return;
      }

      const res = await fetch('/api/vendor/rfq/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          rfq_id: rfqId,
          reason: declineReason,
          additional_notes: declineNotes || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setDeclineError(data.error || 'Failed to decline RFQ');
        return;
      }

      setDeclineSuccess(true);
      setShowDeclineModal(false);

      // Update local state to reflect decline
      setUserResponse({
        status: 'declined',
        description: `Decline reason: ${declineReason}`,
        created_at: new Date().toISOString()
      });

    } catch (err) {
      console.error('Error declining RFQ:', err);
      setDeclineError(err.message || 'Something went wrong');
    } finally {
      setDeclining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.push('/vendor/rfq-dashboard')}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-semibold transition"
          >
            <ArrowLeft size={20} />
            Back to Opportunities
          </button>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">RFQ Not Found</h2>
            <p className="text-gray-600">{error || 'Unable to load this RFQ'}</p>
          </div>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(rfq.expires_at);
  const daysUntilExpiry = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
  const hasExpired = daysUntilExpiry < 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/vendor/rfq-dashboard')}
          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-6 font-semibold transition"
        >
          <ArrowLeft size={20} />
          Back to Opportunities
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - RFQ Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{rfq.title}</h1>
                  <p className="text-gray-600 text-sm">
                    Posted {new Date(rfq.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 capitalize">
                  {rfq.type} Request
                </span>
              </div>

              {hasExpired && (
                <div className="bg-red-50 border border-red-200 rounded p-3 flex items-center gap-2 text-red-700">
                  <X size={20} />
                  <span className="font-semibold">This RFQ has expired</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-xs text-gray-500 mb-2">Budget</p>
                <p className="text-lg font-bold text-gray-900">{rfq.budget_estimate || 'N/A'}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-xs text-gray-500 mb-2">Category</p>
                <p className="text-lg font-bold text-gray-900">{rfq.category}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-xs text-gray-500 mb-2">Expires In</p>
                <p className={`text-lg font-bold ${hasExpired ? 'text-red-600' : 'text-gray-900'}`}>
                  {hasExpired ? 'Expired' : `${daysUntilExpiry} days`}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4">
                <p className="text-xs text-gray-500 mb-2">Responses</p>
                <p className="text-lg font-bold text-gray-900">{responseCount}</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Project Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {rfq.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Project Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rfq.location && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-gray-400" />
                      <p className="font-semibold text-gray-900">{rfq.location}</p>
                    </div>
                  </div>
                )}
                {rfq.county && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">County</p>
                    <p className="font-semibold text-gray-900">{rfq.county}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Urgency Level</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    rfq.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                    rfq.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                    rfq.urgency === 'normal' ? 'bg-gray-100 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {rfq.urgency ? rfq.urgency.charAt(0).toUpperCase() + rfq.urgency.slice(1) : 'Normal'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Quotes</p>
                  <p className="font-semibold text-gray-900">{responseCount} vendor{responseCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Your Response */}
            {userResponse && userResponse.status === 'declined' && (
              <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Ban size={24} className="text-gray-500 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-700 mb-2">You Declined This RFQ</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-semibold">Declined:</span> {new Date(userResponse.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {userResponse && userResponse.status !== 'declined' && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">Your Quote Submitted</h3>
                    <div className="space-y-2 text-sm text-green-800">
                      <p><span className="font-semibold">Price:</span> {userResponse.currency} {userResponse.quoted_price}</p>
                      <p><span className="font-semibold">Timeline:</span> {userResponse.delivery_timeline}</p>
                      <p><span className="font-semibold">Status:</span> {userResponse.status}</p>
                      <p><span className="font-semibold">Submitted:</span> {new Date(userResponse.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Timeline Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Posted</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(rfq.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expires</p>
                  <p className={`font-semibold ${hasExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    {expiresAt.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Time Remaining</p>
                  <p className={`font-semibold ${hasExpired ? 'text-red-600' : 'text-emerald-600'}`}>
                    {hasExpired ? 'Expired' : `${daysUntilExpiry} days`}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Card */}
            {!userResponse && !hasExpired && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-emerald-900 mb-4">Ready to Quote?</h2>
                <button
                  onClick={() => router.push(`/vendor/rfq/${rfqId}/respond`)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                >
                  <TrendingUp size={20} />
                  Submit Your Quote
                </button>
                <p className="text-xs text-emerald-700 mt-3 text-center">
                  Quick response increases your chances of winning
                </p>

                {/* Decline / Not Interested */}
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <button
                    onClick={() => {
                      setShowDeclineModal(true);
                      setDeclineError(null);
                      setDeclineReason('');
                      setDeclineNotes('');
                    }}
                    className="w-full bg-white hover:bg-gray-50 text-gray-600 hover:text-red-600 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 border border-gray-300 hover:border-red-300 text-sm"
                  >
                    <XCircle size={16} />
                    Not Interested
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Opt out if this project isn&apos;t a good fit
                  </p>
                </div>
              </div>
            )}

            {userResponse && userResponse.status === 'declined' && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Ban size={20} className="text-gray-500" />
                  <p className="text-sm text-gray-700 font-semibold">You declined this RFQ</p>
                </div>
                <p className="text-xs text-gray-500">
                  This RFQ has been removed from your active opportunities.
                </p>
              </div>
            )}

            {userResponse && userResponse.status !== 'declined' && (
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
                <p className="text-sm text-emerald-700 font-semibold">✓ You have submitted a quote</p>
              </div>
            )}

            {hasExpired && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                <p className="text-sm text-gray-600 font-semibold text-center">
                  This RFQ is no longer accepting responses
                </p>
              </div>
            )}

            {/* Competition Stats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Competition</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Quotes Received</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-blue-600">{responseCount}</p>
                    <p className="text-sm text-gray-600">vendor{responseCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {responseCount > 0 && (
                  <p className="text-xs text-orange-700 font-semibold pt-3 border-t border-gray-200">
                    ⚡ Quick response can give you a competitive edge!
                  </p>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-blue-900 mb-2 text-sm">💡 Quick Tips</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>✓ Submit quotes quickly</li>
                <li>✓ Match requester budget</li>
                <li>✓ Highlight your expertise</li>
                <li>✓ Provide clear timeline</li>
                <li>✓ Be professional & specific</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle size={20} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Decline RFQ</h2>
                  <p className="text-xs text-gray-500">Let us know why this isn&apos;t a good fit</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeclineModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* RFQ Title Reference */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Declining</p>
                <p className="font-semibold text-gray-900 text-sm">{rfq.title}</p>
              </div>

              {/* Reason Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Why are you declining? <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {DECLINE_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        declineReason === reason
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="declineReason"
                        value={reason}
                        checked={declineReason === reason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                        className="text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder="Any additional context you'd like to share..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{declineNotes.length}/500</p>
              </div>

              {/* Error */}
              {declineError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {declineError}
                </div>
              )}

              {/* Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <span className="font-semibold">Note:</span> The buyer will be notified that you&apos;ve opted out. This RFQ will be removed from your active opportunities. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition text-sm"
                disabled={declining}
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={declining || !declineReason}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-medium transition text-sm flex items-center justify-center gap-2"
              >
                {declining ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Declining...
                  </>
                ) : (
                  <>
                    <ThumbsDown size={16} />
                    Confirm Decline
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Success Toast */}
      {declineSuccess && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-fade-in">
          <CheckCircle size={20} className="text-green-400" />
          <span className="text-sm font-medium">RFQ declined successfully</span>
          <button
            onClick={() => setDeclineSuccess(false)}
            className="ml-2 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
