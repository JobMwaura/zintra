'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * NegotiationThread Component
 * Displays complete negotiation timeline with counter offers, Q&A, and activities
 * 
 * Props:
 * - negotiation: object - Negotiation thread data
 * - counterOffers: array - List of counter offers
 * - qaItems: array - Q&A items
 * - onSubmitOffer: function - Callback to submit counter offer
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
  onAddQuestion,
  userRole,
  userId,
  loading = false,
  isSubmitting = false
}) {
  const [expandedOffer, setExpandedOffer] = useState(null);
  const [expandedQA, setExpandedQA] = useState(null);
  const [selectedTab, setSelectedTab] = useState('offers'); // 'offers', 'qa', 'activity'

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

  const isAccepted = counterOffers.some(co => co.status === 'accepted');
  const latestPrice = counterOffers[0]?.proposed_price || negotiation.original_price;
  const priceDifference = latestPrice - negotiation.original_price;
  const pricePercentChange = ((priceDifference / negotiation.original_price) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with price summary */}
      <div className="border-b p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Quote Negotiation Thread
            </h2>
            <p className="text-sm text-gray-600">
              Status: <span className="font-semibold capitalize">{negotiation.status}</span>
            </p>
          </div>
          {isAccepted && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Quote Accepted</span>
            </div>
          )}
        </div>

        {/* Price comparison */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Original Price</p>
            <p className="text-lg font-bold text-gray-900">
              ₹{negotiation.original_price?.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Current Price</p>
            <p className="text-lg font-bold text-blue-600">
              ₹{latestPrice?.toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Change</p>
            <p className={`text-lg font-bold ${priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {priceDifference > 0 ? '+' : ''}{priceDifference.toLocaleString()} ({pricePercentChange}%)
            </p>
          </div>
        </div>
      </div>

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
                        ₹{offer.proposed_price?.toLocaleString() || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(offer.created_at).toLocaleDateString()} at {new Date(offer.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

                      {offer.status === 'pending' && userRole === (offer.proposed_by === negotiation.buyer_id ? 'vendor' : 'buyer') && (
                        <div className="flex gap-2 pt-4">
                          <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium">
                            Accept
                          </button>
                          <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium">
                            Reject
                          </button>
                          <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-sm font-medium">
                            Counter
                          </button>
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
                    <p className="text-xs text-gray-500 mt-1">Initial price: ₹{negotiation.original_price?.toLocaleString()}</p>
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
                        New price: ₹{offer.proposed_price?.toLocaleString()} ({offer.status})
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
    </div>
  );
}
