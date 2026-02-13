'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, AlertCircle, CheckCircle, XCircle, Ban, Clock, AlertTriangle, Flag, Shield } from 'lucide-react';

/**
 * NegotiationThread Component
 * Displays complete negotiation timeline with counter offers, Q&A, and activities
 * 
 * Props:
 * - negotiation: object - Negotiation thread data (includes round_count, max_rounds, status)
 * - counterOffers: array - List of counter offers
 * - qaItems: array - Q&A items
 * - onSubmitOffer: function(price, scopeChanges, deliveryDate, paymentTerms, notes) - Submit counter offer
 * - onAcceptOffer: function(offerId) - Accept a counter offer
 * - onRejectOffer: function(offerId, reason) - Reject a counter offer
 * - onCancelNegotiation: function(reason) - Cancel the entire negotiation
 * - onAddQuestion: function - Callback to add question
 * - userRole: string - 'buyer' or 'vendor'
 * - userId: string - Current user's UUID
 * - loading: boolean - Loading state
 * - isSubmitting: boolean - Submitting state
 */
export default function NegotiationThread({
  negotiation,
  counterOffers = [],
  qaItems = [],
  onSubmitOffer,
  onAcceptOffer,
  onRejectOffer,
  onCancelNegotiation,
  onAddQuestion,
  userRole,
  userId,
  loading = false,
  isSubmitting = false
}) {
  const [expandedOffer, setExpandedOffer] = useState(null);
  const [expandedQA, setExpandedQA] = useState(null);
  const [selectedTab, setSelectedTab] = useState('offers');
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterFormData, setCounterFormData] = useState({
    proposedPrice: '',
    scopeChanges: '',
    deliveryDate: '',
    paymentTerms: '',
    notes: ''
  });
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null); // offerId or null
  const [actionError, setActionError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMessage, setReportMessage] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Negotiation not found</p>
      </div>
    );
  }

  const isAccepted = negotiation.status === 'accepted' || counterOffers.some(co => co.status === 'accepted');
  const isClosed = ['accepted', 'cancelled', 'expired'].includes(negotiation.status);
  const isExpired = negotiation.status === 'expired';
  const latestPrice = counterOffers[0]?.proposed_price || negotiation.current_price || negotiation.original_price;
  const priceDifference = latestPrice - negotiation.original_price;
  const pricePercentChange = negotiation.original_price ? ((priceDifference / negotiation.original_price) * 100).toFixed(1) : '0';
  const roundCount = negotiation.round_count || counterOffers.length || 0;
  const maxRounds = negotiation.max_rounds || 3;
  const canCounter = !isClosed && roundCount < maxRounds;

  // Helper: time remaining until offer expires
  const getTimeRemaining = (responseByDate) => {
    if (!responseByDate) return null;
    const now = new Date();
    const deadline = new Date(responseByDate);
    const diff = deadline - now;
    if (diff <= 0) return { expired: true, text: 'Expired' };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days > 0) return { expired: false, text: `${days}d ${remainingHours}h remaining` };
    if (hours > 0) return { expired: false, text: `${hours}h remaining` };
    const minutes = Math.floor(diff / (1000 * 60));
    return { expired: false, text: `${minutes}m remaining`, urgent: true };
  };

  // Determine if user can act on a pending offer (the other party must respond)
  const canActOnOffer = (offer) => {
    if (offer.status !== 'pending' || isClosed) return false;
    // The person who DID NOT make the offer is the one who can accept/reject/counter
    return offer.proposed_by !== userId;
  };

  const handleCounterSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);
    const price = parseFloat(counterFormData.proposedPrice);
    if (!price || price <= 0) {
      setActionError('Please enter a valid price');
      return;
    }
    try {
      await onSubmitOffer(price, counterFormData.scopeChanges, counterFormData.deliveryDate, counterFormData.paymentTerms, counterFormData.notes);
      setShowCounterForm(false);
      setCounterFormData({ proposedPrice: '', scopeChanges: '', deliveryDate: '', paymentTerms: '', notes: '' });
    } catch (err) {
      setActionError(err.message || 'Failed to submit counter offer');
    }
  };

  const handleAccept = async (offerId) => {
    setActionError(null);
    try {
      await onAcceptOffer(offerId);
    } catch (err) {
      setActionError(err.message || 'Failed to accept offer');
    }
  };

  const handleReject = async (offerId) => {
    setActionError(null);
    try {
      await onRejectOffer(offerId, rejectReason);
      setShowRejectModal(null);
      setRejectReason('');
    } catch (err) {
      setActionError(err.message || 'Failed to reject offer');
    }
  };

  // Report handler
  const handleReport = async () => {
    if (!reportReason) return;
    setReportSubmitting(true);
    try {
      const res = await fetch('/api/negotiations/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negotiationId: negotiation.id,
          reportedBy: userId,
          reason: reportReason,
          details: reportDetails || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report');
      setReportMessage('✅ Report submitted. Our team will review this.');
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (err) {
      setReportMessage('❌ ' + (err.message || 'Failed to submit report'));
    } finally {
      setReportSubmitting(false);
    }
  };

  // Build chronological audit trail (all events sorted by date)
  const auditTrail = useMemo(() => {
    const events = [];

    // Negotiation started
    events.push({
      id: 'start',
      type: 'started',
      date: negotiation.created_at,
      label: 'Negotiation Started',
      detail: `Initial price: KSh ${negotiation.original_price?.toLocaleString() || 'N/A'}`,
      color: 'bg-blue-500',
      icon: '🤝'
    });

    // Counter offers
    counterOffers.slice().reverse().forEach((offer, index) => {
      const offerBy = offer.proposed_by === userId ? 'You' : (offer.proposed_by === negotiation.user_id ? 'Buyer' : 'Vendor');
      events.push({
        id: `offer-${offer.id}`,
        type: 'offer',
        date: offer.created_at,
        label: `Counter Offer #${index + 1} by ${offerBy}`,
        detail: `KSh ${offer.proposed_price?.toLocaleString()} — ${offer.status}`,
        subDetail: offer.scope_changes ? `Scope: ${offer.scope_changes}` : null,
        color: offer.status === 'accepted' ? 'bg-green-500' :
               offer.status === 'rejected' ? 'bg-red-500' :
               offer.status === 'expired' ? 'bg-amber-500' :
               offer.status === 'cancelled' ? 'bg-gray-400' :
               'bg-orange-500',
        icon: offer.status === 'accepted' ? '✅' :
              offer.status === 'rejected' ? '❌' :
              offer.status === 'expired' ? '⏰' :
              '💰'
      });

      // If offer was accepted/rejected, add that as separate event
      if (offer.status === 'accepted' && offer.updated_at !== offer.created_at) {
        events.push({
          id: `accept-${offer.id}`,
          type: 'accepted',
          date: offer.updated_at,
          label: 'Offer Accepted',
          detail: `Deal agreed at KSh ${offer.proposed_price?.toLocaleString()}`,
          color: 'bg-green-600',
          icon: '🎉'
        });
      }
      if (offer.status === 'rejected' && offer.updated_at !== offer.created_at) {
        events.push({
          id: `reject-${offer.id}`,
          type: 'rejected',
          date: offer.updated_at,
          label: 'Offer Rejected',
          detail: offer.rejected_reason ? `Reason: ${offer.rejected_reason}` : 'No reason given',
          color: 'bg-red-400',
          icon: '↩️'
        });
      }
    });

    // Q&A items
    qaItems.forEach((qa) => {
      events.push({
        id: `q-${qa.id}`,
        type: 'question',
        date: qa.created_at,
        label: 'Question Asked',
        detail: qa.question?.length > 80 ? qa.question.substring(0, 80) + '...' : qa.question,
        color: 'bg-purple-500',
        icon: '❓'
      });
      if (qa.answer) {
        events.push({
          id: `a-${qa.id}`,
          type: 'answer',
          date: qa.answered_at || qa.updated_at || qa.created_at,
          label: 'Question Answered',
          detail: qa.answer?.length > 80 ? qa.answer.substring(0, 80) + '...' : qa.answer,
          color: 'bg-green-400',
          icon: '💬'
        });
      }
    });

    // Thread closure events
    if (negotiation.status === 'cancelled' && negotiation.closed_at) {
      events.push({
        id: 'cancelled',
        type: 'cancelled',
        date: negotiation.closed_at,
        label: 'Negotiation Cancelled',
        detail: '',
        color: 'bg-red-600',
        icon: '🚫'
      });
    }
    if (negotiation.status === 'expired') {
      events.push({
        id: 'expired',
        type: 'expired',
        date: negotiation.closed_at || negotiation.updated_at,
        label: 'Negotiation Expired',
        detail: 'Response deadline passed',
        color: 'bg-amber-600',
        icon: '⏰'
      });
    }

    // Sort chronologically
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    return events;
  }, [negotiation, counterOffers, qaItems, userId]);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with price summary */}
      <div className="border-b p-6 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quote Negotiation
            </h2>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">
                Status: <span className={`font-semibold capitalize ${
                  negotiation.status === 'accepted' ? 'text-green-700' :
                  negotiation.status === 'cancelled' ? 'text-red-700' :
                  'text-blue-700'
                }`}>{negotiation.status}</span>
              </p>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                Round {roundCount}/{maxRounds}
              </span>
            </div>
          </div>
          {isAccepted && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Deal Accepted</span>
            </div>
          )}
          {negotiation.status === 'cancelled' && (
            <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
              <XCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Cancelled</span>
            </div>
          )}
          {isExpired && (
            <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Expired</span>
            </div>
          )}
        </div>

        {/* Price comparison */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Original Price</p>
            <p className="text-lg font-bold text-gray-900">
              KSh {negotiation.original_price?.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Current Price</p>
            <p className="text-lg font-bold text-blue-600">
              KSh {latestPrice?.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Change</p>
            <p className={`text-lg font-bold ${priceDifference > 0 ? 'text-red-600' : priceDifference < 0 ? 'text-green-600' : 'text-gray-600'}`}>
              {priceDifference > 0 ? '+' : ''}{priceDifference.toLocaleString()} ({pricePercentChange}%)
            </p>
          </div>
        </div>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{actionError}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setSelectedTab('offers')}
          className={`flex-1 px-4 py-3 font-medium text-sm border-b-2 transition ${
            selectedTab === 'offers'
              ? 'text-blue-600 border-blue-600 bg-blue-50'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Counter Offers {counterOffers.length > 0 && `(${counterOffers.length})`}
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('qa')}
          className={`flex-1 px-4 py-3 font-medium text-sm border-b-2 transition ${
            selectedTab === 'qa'
              ? 'text-blue-600 border-blue-600 bg-blue-50'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Questions {qaItems.length > 0 && `(${qaItems.length})`}
          </div>
        </button>
        <button
          onClick={() => setSelectedTab('activity')}
          className={`flex-1 px-4 py-3 font-medium text-sm border-b-2 transition ${
            selectedTab === 'activity'
              ? 'text-blue-600 border-blue-600 bg-blue-50'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Activity Timeline
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedTab === 'offers' && (
          <div className="space-y-4">
            {counterOffers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No counter offers yet. Be the first to submit one!</p>
            ) : (
              counterOffers.map((offer, index) => (
                <div key={offer.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                  <button
                    onClick={() => setExpandedOffer(expandedOffer === offer.id ? null : offer.id)}
                    className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                          Offer #{counterOffers.length - index}
                        </span>
                        <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                          offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          offer.status === 'countered' ? 'bg-yellow-100 text-yellow-800' :
                          offer.status === 'expired' ? 'bg-amber-100 text-amber-800' :
                          offer.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 mt-2">
                        KSh {offer.proposed_price?.toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(offer.created_at).toLocaleDateString()} at {new Date(offer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {offer.proposed_by === userId ? ' • You' : ''}
                      </p>
                    </div>
                    {expandedOffer === offer.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  {expandedOffer === offer.id && (
                    <div className="p-4 bg-white border-t space-y-4">
                      {offer.scope_changes && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Scope Changes</h4>
                          <p className="text-gray-600 text-sm">{offer.scope_changes}</p>
                        </div>
                      )}

                      {offer.delivery_date && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Proposed Delivery Date</h4>
                          <p className="text-gray-600 text-sm">{new Date(offer.delivery_date).toLocaleDateString()}</p>
                        </div>
                      )}

                      {offer.payment_terms && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Payment Terms</h4>
                          <p className="text-gray-600 text-sm">{offer.payment_terms}</p>
                        </div>
                      )}

                      {offer.notes && (
                        <div>
                          <h4 className="font-semibold text-sm text-gray-700 mb-2">Notes</h4>
                          <p className="text-gray-600 text-sm">{offer.notes}</p>
                        </div>
                      )}

                      {offer.response_by_date && (
                        <div className={`border rounded p-3 ${
                          (() => {
                            const tr = getTimeRemaining(offer.response_by_date);
                            if (!tr) return 'bg-gray-50 border-gray-200';
                            if (tr.expired || offer.status === 'expired') return 'bg-red-50 border-red-200';
                            if (tr.urgent) return 'bg-amber-50 border-amber-200';
                            return 'bg-yellow-50 border-yellow-200';
                          })()
                        }`}>
                          {(() => {
                            const tr = getTimeRemaining(offer.response_by_date);
                            if (offer.status === 'expired' || (tr && tr.expired)) {
                              return (
                                <p className="text-sm text-red-800 flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span className="font-semibold">Expired</span> — deadline was {new Date(offer.response_by_date).toLocaleDateString()}
                                </p>
                              );
                            }
                            if (tr && offer.status === 'pending') {
                              return (
                                <p className={`text-sm flex items-center gap-1 ${tr.urgent ? 'text-amber-800' : 'text-yellow-800'}`}>
                                  {tr.urgent && <AlertTriangle className="w-4 h-4" />}
                                  {!tr.urgent && <Clock className="w-4 h-4" />}
                                  <span className="font-semibold">Response by:</span> {new Date(offer.response_by_date).toLocaleDateString()} ({tr.text})
                                </p>
                              );
                            }
                            return (
                              <p className="text-sm text-gray-600">
                                <span className="font-semibold">Response requested by:</span> {new Date(offer.response_by_date).toLocaleDateString()}
                              </p>
                            );
                          })()}
                        </div>
                      )}

                      {/* ── FUNCTIONAL ACTION BUTTONS ── */}
                      {canActOnOffer(offer) && (
                        <div className="flex gap-2 pt-4 border-t">
                          <button
                            onClick={() => handleAccept(offer.id)}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                          >
                            {isSubmitting ? 'Processing...' : '✓ Accept'}
                          </button>
                          <button
                            onClick={() => setShowRejectModal(offer.id)}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium disabled:opacity-50"
                          >
                            ✗ Reject
                          </button>
                          {canCounter && (
                            <button
                              onClick={() => {
                                setShowCounterForm(true);
                                setCounterFormData(prev => ({
                                  ...prev,
                                  proposedPrice: offer.proposed_price?.toString() || ''
                                }));
                              }}
                              disabled={isSubmitting}
                              className="flex-1 px-4 py-2 border border-orange-300 text-orange-700 rounded hover:bg-orange-50 transition text-sm font-medium disabled:opacity-50"
                            >
                              ↩ Counter
                            </button>
                          )}
                        </div>
                      )}

                      {/* Reject Reason Modal */}
                      {showRejectModal === offer.id && (
                        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                          <p className="text-sm font-semibold text-red-900">Reason for rejection (optional):</p>
                          <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., Price too high, delivery too slow..."
                            rows={2}
                            className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReject(offer.id)}
                              disabled={isSubmitting}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                              {isSubmitting ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                            <button
                              onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'qa' && (
          <div className="space-y-4">
            {qaItems.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No questions yet. Ask clarification questions here!</p>
            ) : (
              qaItems.map((qa) => (
                <div key={qa.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                  <button
                    onClick={() => setExpandedQA(expandedQA === qa.id ? null : qa.id)}
                    className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{qa.question}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Asked {new Date(qa.created_at).toLocaleDateString()} at {new Date(qa.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {qa.answer && (
                        <div className="flex items-center gap-1 mt-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-semibold">Answered</span>
                        </div>
                      )}
                    </div>
                    {expandedQA === qa.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  {expandedQA === qa.id && (
                    <div className="p-4 bg-white border-t space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Question</h4>
                        <p className="text-gray-600 text-sm">{qa.question}</p>
                      </div>

                      {qa.answer ? (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <h4 className="font-semibold text-sm text-green-800 mb-2">Answer</h4>
                          <p className="text-sm text-green-800">{qa.answer}</p>
                          {qa.answered_at && (
                            <p className="text-xs text-green-700 mt-2">
                              Answered {new Date(qa.answered_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        qa.asked_by !== userId && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
                            <p className="text-sm text-yellow-800">Awaiting answer...</p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'activity' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Full Audit Trail — {auditTrail.length} events</p>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Timeline items */}
              <div className="space-y-4">
                {auditTrail.map((event) => (
                  <div key={event.id} className="flex gap-4 relative z-10">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full ${event.color} flex items-center justify-center text-sm`}>
                      {event.icon}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm">{event.label}</p>
                        <span className="text-xs text-gray-400">
                          {new Date(event.date).toLocaleString()}
                        </span>
                      </div>
                      {event.detail && (
                        <p className="text-xs text-gray-600 mt-0.5">{event.detail}</p>
                      )}
                      {event.subDetail && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">{event.subDetail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── COUNTER OFFER FORM (slides in) ── */}
      {showCounterForm && canCounter && !isClosed && (
        <div className="border-t p-6 bg-orange-50">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Submit Counter Offer (Round {roundCount + 1}/{maxRounds})</h3>
          <form onSubmit={handleCounterSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Proposed Price (KSh) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={counterFormData.proposedPrice}
                  onChange={(e) => setCounterFormData(prev => ({ ...prev, proposedPrice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 50000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Date</label>
                <input
                  type="date"
                  value={counterFormData.deliveryDate}
                  onChange={(e) => setCounterFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Terms</label>
              <select
                value={counterFormData.paymentTerms}
                onChange={(e) => setCounterFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select payment terms...</option>
                <option value="50% upfront, 50% on completion">50% upfront, 50% on completion</option>
                <option value="100% on completion">100% on completion</option>
                <option value="30% upfront, 70% on completion">30% upfront, 70% on completion</option>
                <option value="Net 30 days">Net 30 days</option>
                <option value="Cash on delivery">Cash on delivery</option>
                <option value="Milestone-based">Milestone-based</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Scope Changes / Notes</label>
              <textarea
                value={counterFormData.scopeChanges}
                onChange={(e) => setCounterFormData(prev => ({ ...prev, scopeChanges: e.target.value }))}
                placeholder="Explain what you'd like changed, any conditions..."
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Counter Offer'}
              </button>
              <button
                type="button"
                onClick={() => setShowCounterForm(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── CANCEL NEGOTIATION BUTTON ── */}
      {!isClosed && (
        <div className="border-t p-4 flex justify-between items-center bg-gray-50">
          {canCounter && !showCounterForm && (
            <button
              onClick={() => setShowCounterForm(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition"
            >
              + New Counter Offer
            </button>
          )}
          {!canCounter && (
            <p className="text-sm text-amber-700 font-medium">Maximum rounds ({maxRounds}) reached — accept or reject the latest offer</p>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1 px-3 py-2 text-gray-500 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              title="Report this negotiation"
            >
              <Flag className="w-4 h-4" /> Report
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel this negotiation? This cannot be undone.')) {
                  onCancelNegotiation?.('Cancelled by ' + userRole);
                }
              }}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
            >
              <Ban className="w-4 h-4" /> Cancel Negotiation
            </button>
          </div>
        </div>
      )}

      {/* Report button for closed negotiations too */}
      {isClosed && (
        <div className="border-t p-4 flex justify-end items-center bg-gray-50">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1 px-3 py-2 text-gray-500 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
            title="Report this negotiation"
          >
            <Flag className="w-4 h-4" /> Report
          </button>
        </div>
      )}

      {/* ── REPORT MODAL ── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Report Negotiation</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              If you've encountered suspicious behaviour, harassment, or policy violations, 
              please let us know. Our team will review and take action.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reason *</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Select a reason...</option>
                  <option value="Suspicious pricing">Suspicious pricing</option>
                  <option value="Harassment or threats">Harassment or threats</option>
                  <option value="Spam or fake offers">Spam or fake offers</option>
                  <option value="Unresponsive party">Unresponsive party</option>
                  <option value="Misleading information">Misleading information</option>
                  <option value="Attempted fraud">Attempted fraud</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Details (optional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide additional context..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleReport}
                disabled={!reportReason || reportSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition disabled:opacity-50"
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                onClick={() => { setShowReportModal(false); setReportReason(''); setReportDetails(''); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report message toast */}
      {reportMessage && (
        <div className="border-t p-3 text-center">
          <p className="text-sm font-medium text-gray-700">{reportMessage}</p>
          <button onClick={() => setReportMessage(null)} className="text-xs text-gray-400 mt-1">Dismiss</button>
        </div>
      )}
    </div>
  );
}
