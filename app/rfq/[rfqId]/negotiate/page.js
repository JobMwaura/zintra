'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import NegotiationThread from '@/components/NegotiationThread';
import NegotiationQA from '@/components/NegotiationQA';
import { ArrowLeft, MessageSquare, AlertCircle, HelpCircle, CheckCircle, FileText, Clock, Star, Flag } from 'lucide-react';

/**
 * Negotiate Page — /rfq/[rfqId]/negotiate
 * 
 * Buyer or Vendor can:
 * - View all quotes for the RFQ and open a negotiation thread per quote
 * - Submit counter-offers (max 3 rounds)
 * - Accept/Reject offers
 * - Ask/Answer Q&A
 * - Cancel negotiation
 * 
 * On deal acceptance:
 * - Quote status → accepted
 * - Negotiation thread → accepted
 * - Vendor contact revealed
 */
export default function NegotiatePage({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [rfqId, setRfqId] = useState(null);
  const [rfq, setRfq] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [vendors, setVendors] = useState({});
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  // Negotiation state
  const [negotiation, setNegotiation] = useState(null);
  const [counterOffers, setCounterOffers] = useState([]);
  const [qaItems, setQaItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [jobOrder, setJobOrder] = useState(null);

  // Resolve params (Next.js 15+ async params)
  useEffect(() => {
    (async () => {
      const resolved = await params;
      setRfqId(resolved.rfqId);
    })();
  }, [params]);

  // Determine user role
  const isCreator = rfq?.user_id === user?.id;
  const userRole = isCreator ? 'buyer' : 'vendor';

  // ── FETCH RFQ + QUOTES ──
  useEffect(() => {
    if (!rfqId || !user) return;
    fetchRFQAndQuotes();
    // Background expiry check on page load
    fetch('/api/negotiations/check-expiry', { method: 'POST' }).catch(() => {});
  }, [rfqId, user]);

  const fetchRFQAndQuotes = async () => {
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
      setRfq(rfqData);

      // Fetch quotes (rfq_responses)
      const { data: quotesData, error: quotesError } = await supabase
        .from('rfq_responses')
        .select('*')
        .eq('rfq_id', rfqId)
        .order('created_at', { ascending: false });

      if (quotesError) throw quotesError;

      let filteredQuotes = quotesData || [];

      // Vendors only see their own quote
      if (rfqData.user_id !== user.id) {
        filteredQuotes = filteredQuotes.filter(q => q.vendor_id === user.id);
      }

      setQuotes(filteredQuotes);

      // Fetch vendor details
      if (filteredQuotes.length > 0) {
        const vendorIds = [...new Set(filteredQuotes.map(q => q.vendor_id))];
        const { data: vendorData } = await supabase
          .from('vendors')
          .select('id, company_name, phone, email, rating, verified, logo_url')
          .in('id', vendorIds);

        if (vendorData) {
          const map = {};
          vendorData.forEach(v => { map[v.id] = v; });
          setVendors(map);
        }
      }

      // Auto-select the first quote if there's only one, or if vendor
      if (filteredQuotes.length === 1) {
        setSelectedQuoteId(filteredQuotes[0].id);
      }
    } catch (err) {
      console.error('Error fetching RFQ:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── LOAD NEGOTIATION THREAD for selected quote ──
  useEffect(() => {
    if (!selectedQuoteId || !user) return;
    loadNegotiationThread(selectedQuoteId);
  }, [selectedQuoteId, user]);

  const loadNegotiationThread = async (quoteId) => {
    try {
      setLoadingThread(true);
      setNegotiation(null);
      setCounterOffers([]);
      setQaItems([]);
      setJobOrder(null);

      // Check if a thread already exists for this quote
      const { data: existingThreads } = await supabase
        .from('negotiation_threads')
        .select('id, status')
        .eq('rfq_quote_id', quoteId);

      if (existingThreads && existingThreads.length > 0) {
        // Load the full thread
        const res = await fetch(`/api/negotiations/${existingThreads[0].id}`);
        const data = await res.json();

        if (res.ok) {
          setNegotiation(data.thread);
          setCounterOffers(data.counterOffers || []);
          setQaItems(data.qaItems || []);

          // If accepted, fetch the job order
          if (data.thread?.status === 'accepted') {
            try {
              const joRes = await fetch(`/api/job-orders?userId=${user.id}`);
              const joData = await joRes.json();
              if (joRes.ok && joData.orders) {
                const matchingOrder = joData.orders.find(o => o.negotiation_id === existingThreads[0].id);
                if (matchingOrder) setJobOrder(matchingOrder);
              }
            } catch (joErr) {
              console.error('Error fetching job order:', joErr);
            }
          }
        }
      }
      // If no thread, that's fine — user can start one
    } catch (err) {
      console.error('Error loading negotiation:', err);
    } finally {
      setLoadingThread(false);
    }
  };

  // ── START NEGOTIATION ──
  const startNegotiation = async (quoteId) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) throw new Error('Quote not found');

      const originalPrice = parseFloat(quote.total_price_calculated) || parseFloat(quote.quoted_price) || parseFloat(quote.amount) || 0;

      const res = await fetch('/api/negotiations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfqQuoteId: quoteId,
          rfqId,
          userId: rfq.user_id,
          vendorId: quote.vendor_id,
          originalPrice
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start negotiation');

      setMessage('Negotiation started!');
      // Reload the thread
      await loadNegotiationThread(quoteId);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── SUBMIT COUNTER OFFER ──
  const handleSubmitOffer = async (proposedPrice, scopeChanges, deliveryDate, paymentTerms, notes) => {
    if (!negotiation) throw new Error('No active negotiation');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/negotiations/counter-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          negotiationId: negotiation.id,
          quoteId: negotiation.rfq_quote_id,
          proposedBy: user.id,
          proposedPrice,
          scopeChanges: scopeChanges || null,
          deliveryDate: deliveryDate || null,
          paymentTerms: paymentTerms || null,
          notes: notes || null,
          responseByDays: 3
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit counter offer');

      setMessage(`Counter offer submitted! Round ${data.roundCount}/${data.maxRounds}`);
      await loadNegotiationThread(selectedQuoteId);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── ACCEPT OFFER ──
  const handleAcceptOffer = async (offerId) => {
    if (!negotiation) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/negotiations/${negotiation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept_offer',
          offerId,
          userId: user.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to accept offer');

      setMessage('🎉 Offer accepted! Deal confirmed.');
      await loadNegotiationThread(selectedQuoteId);
      // Refresh quotes to reflect status change
      await fetchRFQAndQuotes();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── REJECT OFFER ──
  const handleRejectOffer = async (offerId, reason) => {
    if (!negotiation) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/negotiations/${negotiation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_offer',
          offerId,
          reason: reason || null,
          userId: user.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject offer');

      setMessage('Offer rejected. You can submit a counter offer.');
      await loadNegotiationThread(selectedQuoteId);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── CANCEL NEGOTIATION ──
  const handleCancelNegotiation = async (reason) => {
    if (!negotiation) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/negotiations/${negotiation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason: reason || null,
          userId: user.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel negotiation');

      setMessage('Negotiation cancelled.');
      await loadNegotiationThread(selectedQuoteId);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Q&A HANDLERS ──
  const handleAddQuestion = async (questionText) => {
    if (!negotiation) throw new Error('Start a negotiation first');

    const res = await fetch('/api/negotiations/qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        negotiationId: negotiation.id,
        quoteId: negotiation.rfq_quote_id,
        askedBy: user.id,
        question: questionText
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send question');

    await loadNegotiationThread(selectedQuoteId);
  };

  const handleAnswerQuestion = async (qaId, answerText) => {
    const res = await fetch('/api/negotiations/qa', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qaId,
        answer: answerText,
        answeredBy: user.id
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit answer');

    await loadNegotiationThread(selectedQuoteId);
  };

  // ── LOADING STATE ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-5xl mx-auto text-center py-16">
          <div className="inline-block h-12 w-12 bg-orange-200 rounded-full animate-spin"></div>
          <p className="text-slate-600 mt-4">Loading negotiation...</p>
        </div>
      </div>
    );
  }

  if (error && !rfq) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-orange-600 font-semibold mb-6">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <p className="text-red-900 font-semibold">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedQuote = quotes.find(q => q.id === selectedQuoteId);
  const selectedVendor = selectedQuote ? vendors[selectedQuote.vendor_id] : null;
  const isDealAccepted = negotiation?.status === 'accepted';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-4">
            <ArrowLeft className="w-5 h-5" /> Back to Quotes
          </button>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-slate-900">Negotiate Quotes</h1>
            <p className="text-slate-600 mt-1">
              {rfq?.title || 'RFQ'} — {quotes.length} quote{quotes.length !== 1 ? 's' : ''} received
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{message}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── LEFT: Quote Selector ── */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-orange-600 to-orange-700">
                <h2 className="text-lg font-bold text-white">Quotes</h2>
                <p className="text-orange-100 text-sm">Select a quote to negotiate</p>
              </div>

              <div className="divide-y">
                {quotes.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No quotes yet</p>
                  </div>
                ) : (
                  quotes.map((quote) => {
                    const vendor = vendors[quote.vendor_id];
                    const price = parseFloat(quote.total_price_calculated) || parseFloat(quote.quoted_price) || parseFloat(quote.amount) || 0;
                    const isSelected = selectedQuoteId === quote.id;

                    return (
                      <button
                        key={quote.id}
                        onClick={() => setSelectedQuoteId(quote.id)}
                        className={`w-full p-4 text-left transition hover:bg-gray-50 ${
                          isSelected ? 'bg-orange-50 border-l-4 border-orange-600' : ''
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{vendor?.company_name || 'Vendor'}</p>
                        <p className="text-lg font-bold text-orange-700 mt-1">KSh {price.toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {quote.status || 'submitted'}
                          </span>
                          {vendor?.verified && (
                            <span className="text-xs text-blue-600 font-medium">✓ Verified</span>
                          )}
                        </div>
                        {quote.delivery_timeline && (
                          <p className="text-xs text-gray-500 mt-1">Timeline: {quote.delivery_timeline}</p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Negotiation Area ── */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedQuoteId ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900">Select a quote to start negotiating</p>
                <p className="text-gray-600 mt-2">Click on a vendor quote on the left to begin</p>
              </div>
            ) : (
              <>
                {/* Quote Summary */}
                {selectedQuote && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {selectedVendor?.company_name || 'Vendor'} — Quote
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedQuote.quote_title || selectedQuote.description?.substring(0, 100) || 'No title'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-700">
                          KSh {(parseFloat(selectedQuote.total_price_calculated) || parseFloat(selectedQuote.quoted_price) || parseFloat(selectedQuote.amount) || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Original quote price</p>
                      </div>
                    </div>

                    {/* Vendor Contact — Only show after deal accepted */}
                    {isDealAccepted && selectedVendor && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="text-sm font-bold text-green-900 mb-2">🔓 Vendor Contact (Deal Accepted)</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {selectedVendor.email && (
                            <div>
                              <span className="text-gray-600">Email:</span>{' '}
                              <a href={`mailto:${selectedVendor.email}`} className="text-blue-600 font-medium underline">{selectedVendor.email}</a>
                            </div>
                          )}
                          {selectedVendor.phone && (
                            <div>
                              <span className="text-gray-600">Phone:</span>{' '}
                              <a href={`tel:${selectedVendor.phone}`} className="text-blue-600 font-medium underline">{selectedVendor.phone}</a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* If no deal yet, show privacy note */}
                    {!isDealAccepted && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800">
                          Vendor contact details will be revealed once a deal is accepted. Negotiate freely — your identity is protected.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── JOB ORDER CARD (shown after deal acceptance) ── */}
                {isDealAccepted && jobOrder && (
                  <div className="bg-white rounded-lg shadow-md border-l-4 border-green-500 overflow-hidden">
                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-green-700" />
                          <h3 className="text-lg font-bold text-green-900">Job Order</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          jobOrder.status === 'created' ? 'bg-blue-100 text-blue-700' :
                          jobOrder.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          jobOrder.status === 'in_progress' ? 'bg-orange-100 text-orange-700' :
                          jobOrder.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          jobOrder.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {jobOrder.status === 'in_progress' ? 'In Progress' : jobOrder.status.charAt(0).toUpperCase() + jobOrder.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">Agreed Price</p>
                          <p className="font-bold text-lg text-green-800">KSh {parseFloat(jobOrder.agreed_price).toLocaleString()}</p>
                        </div>
                        {jobOrder.delivery_date && (
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Delivery Date</p>
                            <p className="font-semibold text-gray-900">{new Date(jobOrder.delivery_date).toLocaleDateString()}</p>
                          </div>
                        )}
                        {jobOrder.payment_terms && (
                          <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Payment Terms</p>
                            <p className="font-medium text-gray-800">{jobOrder.payment_terms}</p>
                          </div>
                        )}
                        {jobOrder.scope_summary && (
                          <div className="col-span-2">
                            <p className="text-gray-500 text-xs uppercase tracking-wide">Scope</p>
                            <p className="text-gray-700">{jobOrder.scope_summary}</p>
                          </div>
                        )}
                      </div>

                      {/* Confirmation status */}
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          {jobOrder.confirmed_by_buyer 
                            ? <CheckCircle className="w-4 h-4 text-green-600" /> 
                            : <Clock className="w-4 h-4 text-gray-400" />}
                          <span className={`text-sm ${jobOrder.confirmed_by_buyer ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                            Buyer {jobOrder.confirmed_by_buyer ? 'Confirmed' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {jobOrder.confirmed_by_vendor 
                            ? <CheckCircle className="w-4 h-4 text-green-600" /> 
                            : <Clock className="w-4 h-4 text-gray-400" />}
                          <span className={`text-sm ${jobOrder.confirmed_by_vendor ? 'text-green-700 font-semibold' : 'text-gray-500'}`}>
                            Vendor {jobOrder.confirmed_by_vendor ? 'Confirmed' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {jobOrder.status !== 'cancelled' && jobOrder.status !== 'completed' && jobOrder.status !== 'disputed' && (
                        <div className="mt-4 flex gap-2">
                          {/* Confirm button: only if this user hasn't confirmed */}
                          {((userRole === 'buyer' && !jobOrder.confirmed_by_buyer) || 
                            (userRole === 'vendor' && !jobOrder.confirmed_by_vendor)) && (
                            <button
                              onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                  const res = await fetch('/api/job-orders', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ jobOrderId: jobOrder.id, action: 'confirm', userId: user.id })
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.error);
                                  setMessage(data.bothConfirmed ? '✅ Both parties confirmed! Job can begin.' : '✅ You confirmed the job order.');
                                  await loadNegotiationThread(selectedQuoteId);
                                } catch (err) {
                                  setError(err.message);
                                } finally {
                                  setIsSubmitting(false);
                                }
                              }}
                              disabled={isSubmitting}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 transition disabled:opacity-50"
                            >
                              {isSubmitting ? 'Confirming...' : '✓ Confirm Job Order'}
                            </button>
                          )}

                          {/* Start work: only vendor, only if confirmed */}
                          {userRole === 'vendor' && jobOrder.status === 'confirmed' && (
                            <button
                              onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                  const res = await fetch('/api/job-orders', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ jobOrderId: jobOrder.id, action: 'start', userId: user.id })
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.error);
                                  setMessage('🚀 Work started!');
                                  await loadNegotiationThread(selectedQuoteId);
                                } catch (err) {
                                  setError(err.message);
                                } finally {
                                  setIsSubmitting(false);
                                }
                              }}
                              disabled={isSubmitting}
                              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold text-sm hover:bg-orange-700 transition disabled:opacity-50"
                            >
                              🚀 Start Work
                            </button>
                          )}

                          {/* Complete: either party, only if in_progress */}
                          {jobOrder.status === 'in_progress' && (
                            <button
                              onClick={async () => {
                                if (!confirm('Mark this job as completed?')) return;
                                setIsSubmitting(true);
                                try {
                                  const res = await fetch('/api/job-orders', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ jobOrderId: jobOrder.id, action: 'complete', userId: user.id })
                                  });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.error);
                                  setMessage('✅ Job marked as completed!');
                                  await loadNegotiationThread(selectedQuoteId);
                                } catch (err) {
                                  setError(err.message);
                                } finally {
                                  setIsSubmitting(false);
                                }
                              }}
                              disabled={isSubmitting}
                              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-50"
                            >
                              ✅ Mark Complete
                            </button>
                          )}
                        </div>
                      )}

                      {/* Dispute button for active jobs */}
                      {['confirmed', 'in_progress'].includes(jobOrder.status) && (
                        <div className="mt-3">
                          <button
                            onClick={async () => {
                              const reason = prompt('Describe the issue you want to dispute:');
                              if (!reason) return;
                              setIsSubmitting(true);
                              try {
                                const res = await fetch('/api/job-orders', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ jobOrderId: jobOrder.id, action: 'dispute', userId: user.id, reason })
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error);
                                setMessage('⚠️ Dispute raised. Admin has been notified.');
                                await loadNegotiationThread(selectedQuoteId);
                              } catch (err) {
                                setError(err.message);
                              } finally {
                                setIsSubmitting(false);
                              }
                            }}
                            disabled={isSubmitting}
                            className="text-sm text-red-600 hover:text-red-800 font-medium underline"
                          >
                            ⚠️ Raise a Dispute
                          </button>
                        </div>
                      )}

                      {/* Disputed notice */}
                      {jobOrder.status === 'disputed' && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-semibold text-red-900">⚠️ Dispute Active</p>
                          <p className="text-xs text-red-700 mt-1">
                            A dispute has been raised on this job order. Admin has been notified and will mediate.
                            {jobOrder.metadata?.dispute_reason && (
                              <span className="block mt-1">Reason: {jobOrder.metadata.dispute_reason}</span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Completed — rate vendor prompt (buyer only) */}
                      {jobOrder.status === 'completed' && userRole === 'buyer' && selectedVendor && (
                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Star className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-emerald-900">Job Completed! 🎉</h4>
                              <p className="text-sm text-emerald-800 mt-1">
                                The job has been marked as completed. Consider leaving a rating for{' '}
                                <span className="font-semibold">{selectedVendor.company_name}</span> to help other buyers.
                              </p>
                              <a
                                href={`/vendor-profile/${selectedQuote?.vendor_id}`}
                                className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition"
                              >
                                <Star className="w-4 h-4" />
                                Rate Vendor
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Completed — vendor thank you */}
                      {jobOrder.status === 'completed' && userRole === 'vendor' && (
                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-bold text-emerald-900">Job Completed! 🎉</h4>
                              <p className="text-sm text-emerald-800 mt-1">
                                This job has been completed successfully. The buyer may leave a rating on your profile.
                              </p>
                              <a
                                href="/job-orders"
                                className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
                              >
                                View All Job Orders →
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Expired negotiation notice */}
                {negotiation?.status === 'expired' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 flex items-start gap-3">
                    <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900">Negotiation Expired</h4>
                      <p className="text-sm text-amber-800 mt-1">
                        This negotiation has expired because the last counter-offer was not responded to in time. 
                        You may start a new negotiation if the RFQ is still open.
                      </p>
                    </div>
                  </div>
                )}

                {/* Negotiation Thread or Start Button */}
                {loadingThread ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="inline-block h-8 w-8 bg-orange-200 rounded-full animate-spin"></div>
                    <p className="text-gray-600 mt-3">Loading negotiation...</p>
                  </div>
                ) : negotiation ? (
                  <NegotiationThread
                    negotiation={negotiation}
                    counterOffers={counterOffers}
                    qaItems={qaItems}
                    onSubmitOffer={handleSubmitOffer}
                    onAcceptOffer={handleAcceptOffer}
                    onRejectOffer={handleRejectOffer}
                    onCancelNegotiation={handleCancelNegotiation}
                    onAddQuestion={handleAddQuestion}
                    userRole={userRole}
                    userId={user?.id}
                    loading={false}
                    isSubmitting={isSubmitting}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No negotiation started yet</h3>
                    <p className="text-gray-600 text-sm mb-6">
                      Start a negotiation to submit counter-offers and agree on a price
                    </p>
                    <button
                      onClick={() => startNegotiation(selectedQuoteId)}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
                    >
                      {isSubmitting ? 'Starting...' : 'Start Negotiation'}
                    </button>
                  </div>
                )}

                {/* Q&A Section (only if negotiation is active) */}
                {negotiation && !['cancelled'].includes(negotiation.status) && (
                  <NegotiationQA
                    qaItems={qaItems}
                    onAddQuestion={handleAddQuestion}
                    onAnswerQuestion={handleAnswerQuestion}
                    userRole={userRole}
                    userId={user?.id}
                    isSubmitting={isSubmitting}
                    disabled={negotiation.status === 'accepted'}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
