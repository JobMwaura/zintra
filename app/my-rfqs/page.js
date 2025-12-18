'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Check, X, Loader2, AlertCircle, Shield, Star, ChevronDown, ChevronUp } from 'lucide-react';
import QuoteComparisonTable from '@/components/QuoteComparisonTable';

export default function MyRFQsPage() {
  const [rfqs, setRfqs] = useState([]);
  const [vendorMap, setVendorMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [acting, setActing] = useState(null);
  const [expandedRfqId, setExpandedRfqId] = useState(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  useEffect(() => {
    fetchRFQs();
  }, []);

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('Please sign in to view your RFQs');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('rfqs')
        .select('*, rfq_responses(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setMessage(`Error loading RFQs: ${error.message}`);
        setLoading(false);
        return;
      }

      const rfqsData = data || [];
      setRfqs(rfqsData);

      // fetch vendor profiles for responses
      const vendorIds = Array.from(
        new Set(
          rfqsData.flatMap((r) => (r.rfq_responses || []).map((resp) => resp.vendor_id)).filter(Boolean)
        )
      );
      if (vendorIds.length) {
        const { data: vendors } = await supabase
          .from('vendors')
          .select('id, user_id, company_name, rating, verified, phone, email');
        const map = {};
        (vendors || []).forEach((v) => {
          // Map both by id and user_id for flexibility
          map[v.id] = v;
          if (v.user_id) map[v.user_id] = v;
        });
        setVendorMap(map);
      } else {
        setVendorMap({});
      }
      setLoading(false);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  const updateResponseStatus = async (responseId, newStatus, rfqId, note) => {
    try {
      setActing(responseId);
      await supabase
        .from('rfq_responses')
        .update({ status: newStatus, revision_note: note || null })
        .eq('id', responseId);
      if (newStatus === 'accepted' && rfqId) {
        await supabase.from('rfqs').update({ status: 'accepted' }).eq('id', rfqId);
      }
      setMessage('Updated successfully');
      fetchRFQs();
      setActing(null);
    } catch (err) {
      setMessage(`Error: ${err.message}`);
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">My RFQs</p>
            <h1 className="text-2xl font-bold text-slate-900">Requests & Quotes</h1>
          </div>
          <Link href="/post-rfq" className="text-amber-700 font-semibold hover:underline">
            Post another RFQ
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            {message}
          </div>
        )}

        {rfqs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-700">You have not posted any RFQs yet.</p>
          </div>
        ) : (
          rfqs.map((rfq) => (
            <div key={rfq.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setExpandedRfqId(expandedRfqId === rfq.id ? null : rfq.id)}
                  className="flex items-center gap-3 flex-1 hover:text-orange-600 transition"
                >
                  {expandedRfqId === rfq.id ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-xs uppercase tracking-wide text-slate-500">RFQ</p>
                    <p className="font-semibold text-slate-900">{rfq.title}</p>
                    <p className="text-sm text-slate-600">{rfq.category} • {rfq.location || rfq.county || 'N/A'}</p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                    {rfq.status}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                    {(rfq.rfq_responses || []).length} quotes
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-3">{rfq.description}</p>

              {expandedRfqId === rfq.id && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                  {(rfq.rfq_responses || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No quotes yet.</p>
                  ) : (
                    <>
                      <QuoteComparisonTable
                        quotes={rfq.rfq_responses || []}
                        vendors={vendorMap}
                        onSelectQuote={(quoteId) => setSelectedQuoteId(quoteId)}
                        selectedQuoteId={selectedQuoteId}
                      />

                      {/* Actions for selected quote */}
                      {selectedQuoteId && (
                        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                          <p className="text-sm font-semibold text-slate-900">Actions for selected quote:</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => {
                                const quote = rfq.rfq_responses.find(r => r.id === selectedQuoteId);
                                updateResponseStatus(selectedQuoteId, 'accepted', rfq.id);
                              }}
                              disabled={acting === selectedQuoteId}
                              className="inline-flex items-center gap-1 px-4 py-2 rounded bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-emerald-700 transition"
                            >
                              <Check className="w-4 h-4" /> Accept
                            </button>
                            <button
                              onClick={() => {
                                updateResponseStatus(selectedQuoteId, 'rejected', rfq.id);
                              }}
                              disabled={acting === selectedQuoteId}
                              className="inline-flex items-center gap-1 px-4 py-2 rounded border border-slate-300 text-slate-700 text-sm font-semibold disabled:opacity-60 hover:bg-slate-50 transition"
                            >
                              <X className="w-4 h-4" /> Reject
                            </button>
                            <button
                              onClick={() => {
                                const note = prompt('What would you like revised? (e.g., price, timeline, scope)');
                                if (note !== null) {
                                  updateResponseStatus(selectedQuoteId, 'revised', rfq.id, note);
                                }
                              }}
                              disabled={acting === selectedQuoteId}
                              className="inline-flex items-center gap-1 px-4 py-2 rounded border border-amber-300 text-amber-700 text-sm font-semibold disabled:opacity-60 hover:bg-amber-50 transition"
                            >
                              Request Revision
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
