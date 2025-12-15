'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Check, X, Loader2, AlertCircle, Shield, Star } from 'lucide-react';

export default function MyRFQsPage() {
  const [rfqs, setRfqs] = useState([]);
  const [vendorMap, setVendorMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [acting, setActing] = useState(null);

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
          map[v.user_id || v.id] = v;
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

  const updateResponseStatus = async (responseId, newStatus, rfqId) => {
    try {
      setActing(responseId);
      await supabase.from('rfq_responses').update({ status: newStatus }).eq('id', responseId);
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
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">RFQ</p>
                  <p className="font-semibold text-slate-900">{rfq.title}</p>
                  <p className="text-sm text-slate-600">{rfq.category} • {rfq.location || rfq.county || 'N/A'}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                  {rfq.status}
                </span>
              </div>
              <p className="text-sm text-slate-700 mb-3">{rfq.description}</p>

              <div className="space-y-3">
                {(rfq.rfq_responses || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No quotes yet.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-slate-600">Vendor</th>
                            <th className="px-3 py-2 text-left text-slate-600">Price</th>
                            <th className="px-3 py-2 text-left text-slate-600">Timeline</th>
                            <th className="px-3 py-2 text-left text-slate-600">Terms</th>
                            <th className="px-3 py-2 text-left text-slate-600">Trust</th>
                            <th className="px-3 py-2 text-left text-slate-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rfq.rfq_responses
                            .slice()
                            .sort((a, b) => (a.amount || 0) - (b.amount || 0))
                            .map((resp) => {
                              const vendor = vendorMap[resp.vendor_id];
                              return (
                                <tr key={resp.id} className="hover:bg-slate-50">
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-slate-900">{vendor?.company_name || 'Vendor'}</span>
                                      {vendor?.verified && <Shield className="w-4 h-4 text-emerald-600" />}
                                      {vendor?.rating ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {vendor.rating}
                                        </span>
                                      ) : null}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-slate-900">KSh {resp.amount?.toLocaleString?.() || resp.amount}</td>
                                  <td className="px-3 py-2 text-slate-700">{resp.timeline || 'N/A'}</td>
                                  <td className="px-3 py-2 text-slate-700">{resp.terms || 'N/A'}</td>
                                  <td className="px-3 py-2 text-slate-700">
                                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                      {resp.trust_level || 'neutral'}
                                    </span>
                                    {resp.risk_flag && <span className="ml-2 text-xs text-red-600">⚠️ check details</span>}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => updateResponseStatus(resp.id, 'accepted', rfq.id)}
                                        disabled={acting === resp.id}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 text-white text-xs font-semibold disabled:opacity-60"
                                      >
                                        <Check className="w-4 h-4" /> Accept
                                      </button>
                                      <button
                                        onClick={() => updateResponseStatus(resp.id, 'declined', rfq.id)}
                                        disabled={acting === resp.id}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded border border-slate-300 text-slate-700 text-xs font-semibold disabled:opacity-60"
                                      >
                                        <X className="w-4 h-4" /> Decline
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
