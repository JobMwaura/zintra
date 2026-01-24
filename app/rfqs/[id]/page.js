'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, MessageSquare, DollarSign, Clock, MapPin, User, AlertCircle, Check, X } from 'lucide-react';
import Link from 'next/link';
import QuoteDetailCard from '@/components/QuoteDetailCard';

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
  
  // Handle async params (Next.js 15+)
  const [rfqId, setRfqId] = useState(null);
  
  useEffect(() => {
    // Unwrap params promise if needed
    if (params && typeof params === 'object') {
      if (params instanceof Promise) {
        params.then(p => setRfqId(p.id));
      } else {
        setRfqId(params.id);
      }
    }
  }, [params]);

  const [rfq, setRfq] = useState(null);
  const [responses, setResponses] = useState([]);
  const [vendors, setVendors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actingQuoteId, setActingQuoteId] = useState(null);

  useEffect(() => {
    if (user?.id && rfqId) {
      fetchRFQDetails();
    }
  }, [rfqId, user?.id]);

  const fetchRFQDetails = async () => {
    try {
      if (!rfqId) {
        setError('RFQ ID is missing');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);

      // Fetch RFQ
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfqId)
        .single();

      if (rfqError) {
        console.error('RFQ fetch error:', rfqError);
        if (rfqError.code === 'PGRST116') {
          throw new Error('RFQ not found or you do not have permission to view it');
        }
        throw rfqError;
      }

      if (!rfqData) {
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

      if (responsesError) {
        console.error('Responses fetch error:', responsesError);
        throw responsesError;
      }

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
    console.log('DEBUG: handleAcceptQuote called with quoteId:', quoteId);
    console.log('DEBUG: isCreator:', isCreator);
    console.log('DEBUG: user:', user);
    console.log('DEBUG: rfq?.user_id:', rfq?.user_id);
    
    if (!isCreator) {
      console.warn('DEBUG: User is not the RFQ creator');
      setActionMessage('Only the RFQ creator can accept quotes');
      return;
    }

    try {
      setActingQuoteId(quoteId);
      setActionMessage('');

      console.log('DEBUG: Updating quote status in database...');
      const { data, error } = await supabase
        .from('rfq_responses')
        .update({ status: 'accepted' })
        .eq('id', quoteId)
        .select();

      console.log('DEBUG: Update response - data:', data, 'error:', error);
      
      if (error) {
        console.error('DEBUG: Database error:', error);
        throw error;
      }

      console.log('DEBUG: Quote status updated successfully');
      setActionMessage('✅ Quote accepted successfully!');
      
      setTimeout(() => {
        console.log('DEBUG: Refetching RFQ details...');
        fetchRFQDetails();
        setActionMessage('');
      }, 2000);
    } catch (err) {
      console.error('Error accepting quote:', err);
      const errorMessage = err?.message || 'Unknown error occurred';
      console.error('DEBUG: Full error object:', err);
      setActionMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setActingQuoteId(null);
    }
  };

  const handleRejectQuote = async (quoteId) => {
    console.log('DEBUG: handleRejectQuote called with quoteId:', quoteId);
    console.log('DEBUG: isCreator:', isCreator);
    
    if (!isCreator) {
      console.warn('DEBUG: User is not the RFQ creator');
      setActionMessage('Only the RFQ creator can reject quotes');
      return;
    }

    try {
      setActingQuoteId(quoteId);
      setActionMessage('');

      console.log('DEBUG: Updating quote status to rejected in database...');
      const { data, error } = await supabase
        .from('rfq_responses')
        .update({ status: 'rejected' })
        .eq('id', quoteId)
        .select();

      console.log('DEBUG: Update response - data:', data, 'error:', error);
      
      if (error) {
        console.error('DEBUG: Database error:', error);
        throw error;
      }

      console.log('DEBUG: Quote status updated to rejected successfully');
      setActionMessage('✅ Quote rejected successfully!');
      setTimeout(() => {
        console.log('DEBUG: Refetching RFQ details...');
        fetchRFQDetails();
        setActionMessage('');
      }, 2000);
    } catch (err) {
      console.error('Error rejecting quote:', err);
      const errorMessage = err?.message || 'Unknown error occurred';
      console.error('DEBUG: Full error object:', err);
      setActionMessage(`❌ Error: ${errorMessage}`);
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
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Vendor Responses ({responses.length})
              </h2>

              {responses.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
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
                      <div key={response.id}>
                        {/* Use QuoteDetailCard for comprehensive display */}
                        <QuoteDetailCard
                          quote={response}
                          vendor={vendor}
                          isSelected={false}
                          onSelect={() => {}}
                        />

                        {/* Action Buttons (for creator only) - Positioned below the card */}
                        {isCreator && !isAccepted && !isRejected && (
                          <div className="mt-3 flex gap-2 px-6 pb-4 bg-orange-50 rounded-b-lg border border-t-0 border-orange-200">
                            <button
                              onClick={() => handleAcceptQuote(response.id)}
                              disabled={actingQuoteId === response.id}
                              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                              Accept Quote
                            </button>
                            <button
                              onClick={() => handleRejectQuote(response.id)}
                              disabled={actingQuoteId === response.id}
                              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              Reject Quote
                            </button>
                          </div>
                        )}

                        {isAccepted && (
                          <div className="mt-2 px-6 py-3 bg-green-50 border border-green-200 rounded-b-lg flex items-center gap-2 text-green-700 font-semibold">
                            <Check className="w-5 h-5" />
                            Quote Accepted
                          </div>
                        )}

                        {isRejected && (
                          <div className="mt-2 px-6 py-3 bg-red-50 border border-red-200 rounded-b-lg flex items-center gap-2 text-red-700 font-semibold">
                            <X className="w-5 h-5" />
                            Quote Rejected
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
