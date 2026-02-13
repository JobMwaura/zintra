'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, AlertCircle, CheckCircle, XCircle, Ban } from 'lucide-react';

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
  const latestPrice = counterOffers[0]?.proposed_price || negotiation.current_price || negotiation.original_price;
  const priceDifference = latestPrice - negotiation.original_price;
  const pricePercentChange = negotiation.original_price ? ((priceDifference / negotiation.original_price) * 100).toFixed(1) : '0';
  const roundCount = negotiation.round_count || counterOffers.length || 0;
  const maxRounds = negotiation.max_rounds || 3;
  const canCounter = !isClosed && roundCount < maxRounds;

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
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <p className="text-sm text-yellow-800">
                            <span className="font-semibold">Response requested by:</span> {new Date(offer.response_by_date).toLocaleDateString()}
                          </p>
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
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              {/* Timeline items */}
              <div className="space-y-4">
                {/* Initial creation */}
                <div className="flex gap-4 relative z-10">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Negotiation Started</p>
                    <p className="text-sm text-gray-600">{new Date(negotiation.created_at).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Initial price: KSh {negotiation.original_price?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Counter offers */}
                {counterOffers.map((offer, index) => (
                  <div key={offer.id} className="flex gap-4 relative z-10">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      offer.status === 'accepted' ? 'bg-green-500' :
                      offer.status === 'rejected' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Counter Offer #{counterOffers.length - index}
                      </p>
                      <p className="text-sm text-gray-600">{new Date(offer.created_at).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        New price: KSh {offer.proposed_price?.toLocaleString()} ({offer.status})
                      </p>
                    </div>
                  </div>
                ))}

                {/* Q&A items */}
                {qaItems.slice(0, 3).map((qa) => (
                  <div key={qa.id} className="flex gap-4 relative z-10">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      qa.answer ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {qa.answer ? 'Question Answered' : 'Question Asked'}
                      </p>
                      <p className="text-sm text-gray-600">{new Date(qa.created_at).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{qa.question}</p>
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
      )}
    </div>
  );
}
