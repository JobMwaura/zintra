'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, MessageSquare, DollarSign, Clock, MapPin, User, AlertCircle, Check, X } from 'lucide-react';
import Link from 'next/link';

/**
 * RFQ Details Page
 * Displays full RFQ details and vendor responses
 * - Shows RFQ information (title, description, category, budget, etc.)
 * - Lists all vendor responses/quotes for the RFQ
 * - Allows RFQ creator to accept/reject quotes
 */
export default function RFQDetailsPage({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const { id: rfqId } = params;

  const [rfq, setRfq] = useState(null);
  const [responses, setResponses] = useState([]);
  const [vendors, setVendors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actingQuoteId, setActingQuoteId] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchRFQDetails();
    }
  }, [rfqId, user?.id]);

  const fetchRFQDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfqId)
        .single();

      if (rfqError || !rfqData) {
        throw new Error('RFQ not found');
      }

      // Check if user is the RFQ creator
      const isOwner = rfqData.user_id === user?.id;
      setIsCreator(isOwner);

      setRfq(rfqData);

      // Fetch all responses for this RFQ
      const { data: responsesData, error: responsesError } = await supabase
        .from('rfq_responses')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false });

      if (responsesError) throw responsesError;

      setResponses(responsesData || []);

      // Fetch vendor details for all responses
      if (responsesData && responsesData.length > 0) {
        const vendorIds = [...new Set(responsesData.map(r => r.vendor_id))];
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id, company_name, location, rating, verified, phone, email')
          .in('id', vendorIds);

        if (!vendorError && vendorData) {
          const vendorMap = {};
          vendorData.forEach(v => {
            vendorMap[v.id] = v;
          });
          setVendors(vendorMap);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching RFQ details:', err);
      setError(err.message || 'Failed to load RFQ details');
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    if (!isCreator) {
      setActionMessage('Only the RFQ creator can accept quotes');
      return;
    }

    try {
      setActingQuoteId(quoteId);
      setActionMessage('');

      const { error } = await supabase
        .from('rfq_responses')
        .update({ status: 'accepted' })
        .eq('id', quoteId);

      if (error) throw error;

      setActionMessage('✅ Quote accepted successfully!');
      setTimeout(() => {
        fetchRFQDetails();
        setActionMessage('');
      }, 2000);
    } catch (err) {
      console.error('Error accepting quote:', err);
      setActionMessage(`❌ Error: ${err.message}`);
    } finally {
      setActingQuoteId(null);
    }
  };

  const handleRejectQuote = async (quoteId) => {
    if (!isCreator) {
      setActionMessage('Only the RFQ creator can reject quotes');
      return;
    }

    try {
      setActingQuoteId(quoteId);
      setActionMessage('');

      const { error } = await supabase
        .from('rfq_responses')
        .update({ status: 'rejected' })
        .eq('id', quoteId);

      if (error) throw error;

      setActionMessage('✅ Quote rejected successfully!');
      setTimeout(() => {
        fetchRFQDetails();
        setActionMessage('');
      }, 2000);
    } catch (err) {
      console.error('Error rejecting quote:', err);
      setActionMessage(`❌ Error: ${err.message}`);
    } finally {
      setActingQuoteId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDaysUntilDeadline = (expiresAt) => {
    const now = new Date();
    const deadline = new Date(expiresAt);
    const diff = deadline - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => router.push('/my-rfqs')}
                className="mt-4 text-orange-600 hover:text-orange-700 font-semibold underline"
              >
                Return to My RFQs
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-6 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">RFQ not found</p>
          </div>
        </div>
      </div>
    );
  }

  const daysUntilDeadline = getDaysUntilDeadline(rfq.expires_at);
  const isExpired = daysUntilDeadline < 0;
  const isClosingSoon = daysUntilDeadline >= 0 && daysUntilDeadline <= 3;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 mb-4 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-slate-900">{rfq.title}</h1>
          <p className="text-slate-600 mt-2">{rfq.category}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Message */}
        {actionMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            actionMessage.startsWith('✅') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {actionMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* RFQ Details - Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">RFQ Details</h2>

              {/* Description */}
              {rfq.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-slate-600 mb-2">Description</h3>
                  <p className="text-slate-700">{rfq.description}</p>
                </div>
              )}

              {/* Key Information Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Location */}
                {rfq.location && (
                  <div>
                    <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Location
                    </p>
                    <p className="text-sm font-semibold text-slate-900">{rfq.location}</p>
                  </div>
                )}

                {/* County */}
                {rfq.county && (
                  <div>
                    <p className="text-xs text-slate-600 font-medium">County</p>
                    <p className="text-sm font-semibold text-slate-900">{rfq.county}</p>
                  </div>
                )}

                {/* Budget Min */}
                {rfq.budget_min && (
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Min Budget</p>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(rfq.budget_min)}</p>
                  </div>
                )}

                {/* Budget Max */}
                {rfq.budget_max && (
                  <div>
                    <p className="text-xs text-slate-600 font-medium">Max Budget</p>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(rfq.budget_max)}</p>
                  </div>
                )}
              </div>

              {/* Attachments / Additional Data */}
              {rfq.attachments && Object.keys(rfq.attachments).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-3">Additional Information</h3>
                  <div className="bg-slate-50 rounded p-4 space-y-2">
                    {Object.entries(rfq.attachments).map(([key, value]) => {
                      if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
                        return null;
                      }
                      return (
                        <div key={key}>
                          <p className="text-xs font-medium text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-sm text-slate-700">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Vendor Responses Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Vendor Responses ({responses.length})
              </h2>

              {responses.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No vendor responses yet</p>
                  {isExpired && (
                    <p className="text-sm text-slate-500 mt-2">This RFQ has expired and is no longer accepting responses</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {responses.map((response) => {
                    const vendor = vendors[response.vendor_id];
                    const isAccepted = response.status === 'accepted';
                    const isRejected = response.status === 'rejected';

                    return (
                      <div
                        key={response.id}
                        className={`border-2 rounded-lg p-4 transition ${
                          isAccepted
                            ? 'border-green-200 bg-green-50'
                            : isRejected
                            ? 'border-red-200 bg-red-50'
                            : 'border-slate-200 hover:border-orange-200'
                        }`}
                      >
                        {/* Vendor Info & Quote Price */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900">
                                {vendor?.company_name || 'Unknown Vendor'}
                              </h3>
                              {vendor?.verified && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">✓ Verified</span>
                              )}
                            </div>
                            {vendor?.location && (
                              <p className="text-sm text-slate-500 mt-1">{vendor.location}</p>
                            )}
                          </div>

                          {/* Quote Price */}
                          <div className="text-right">
                            <p className="text-xs text-slate-600 font-medium">Quoted Price</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {formatCurrency(response.quoted_price)}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isAccepted && (
                          <div className="mb-3 flex items-center gap-2 text-green-700 font-semibold">
                            <Check className="w-5 h-5" />
                            Accepted
                          </div>
                        )}
                        {isRejected && (
                          <div className="mb-3 flex items-center gap-2 text-red-700 font-semibold">
                            <X className="w-5 h-5" />
                            Rejected
                          </div>
                        )}

                        {/* Response Details */}
                        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                          {response.delivery_timeline && (
                            <div>
                              <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Delivery Timeline
                              </p>
                              <p className="text-slate-700">{response.delivery_timeline}</p>
                            </div>
                          )}
                          {vendor?.rating && (
                            <div>
                              <p className="text-xs text-slate-600 font-medium">Vendor Rating</p>
                              <p className="text-slate-700">⭐ {vendor.rating.toFixed(1)}/5</p>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {response.description && (
                          <div className="mb-3 p-3 bg-white rounded border border-slate-200">
                            <p className="text-sm text-slate-700">{response.description}</p>
                          </div>
                        )}

                        {/* Response Metadata */}
                        <div className="text-xs text-slate-500 mb-4">
                          Responded on {formatDate(response.created_at)}
                        </div>

                        {/* Action Buttons (for creator only) */}
                        {isCreator && !isAccepted && !isRejected && (
                          <div className="flex gap-2 pt-3 border-t border-slate-200">
                            <button
                              onClick={() => handleAcceptQuote(response.id)}
                              disabled={actingQuoteId === response.id}
                              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectQuote(response.id)}
                              disabled={actingQuoteId === response.id}
                              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - RFQ Status & Summary */}
          <div>
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Status</h3>

              {/* Response Summary */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-slate-600">Total Responses</p>
                  <p className="text-2xl font-bold text-slate-900">{responses.length}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-slate-600">Accepted</p>
                  <p className="text-lg font-semibold text-green-600">
                    {responses.filter(r => r.status === 'accepted').length}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-slate-600">Pending</p>
                  <p className="text-lg font-semibold text-yellow-600">
                    {responses.filter(r => r.status === 'submitted').length}
                  </p>
                </div>
              </div>

              <hr className="my-4" />

              {/* Deadline Info */}
              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-medium">DEADLINE</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatDate(rfq.expires_at)}
                </p>
                <p className={`text-sm font-bold ${
                  isExpired ? 'text-red-600' :
                  isClosingSoon ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {isExpired
                    ? `Overdue by ${Math.abs(daysUntilDeadline)} day${Math.abs(daysUntilDeadline) !== 1 ? 's' : ''}`
                    : `${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} left`
                  }
                </p>
              </div>

              {isClosingSoon && !isExpired && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-xs font-semibold text-orange-800">⚠️ This RFQ is closing soon!</p>
                </div>
              )}

              {isExpired && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-xs font-semibold text-red-800">⛔ This RFQ has expired</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link
                href={`/quote-comparison/${rfqId}`}
                className="block w-full text-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Compare Quotes
              </Link>
              <button
                onClick={() => router.push(`/messages?rfq=${rfqId}`)}
                className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold transition"
              >
                <MessageSquare className="w-4 h-4" />
                Message Vendors
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
