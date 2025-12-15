'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Search, Filter, Eye, Shield, MapPin, Star } from 'lucide-react';

export default function ActiveRFQs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [rfqs, setRfqs] = useState([]);
  const [responses, setResponses] = useState({});
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [vendorsByRfq, setVendorsByRfq] = useState({});

  useEffect(() => {
    fetchActive();
  }, []);

  const fetchActive = async () => {
    try {
      setLoading(true);
      setMessage('');
      const { data, error } = await supabase
        .from('rfqs')
        .select('*')
        .in('status', ['open', 'active'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRfqs(data || []);

      const ids = (data || []).map((r) => r.id);
      if (ids.length) {
        const { data: resp } = await supabase.from('rfq_responses').select('rfq_id');
        const respCount = (resp || []).reduce((acc, r) => {
          acc[r.rfq_id] = (acc[r.rfq_id] || 0) + 1;
          return acc;
        }, {});
        setResponses(respCount);

        const { data: reqs } = await supabase
          .from('rfq_requests')
          .select('rfq_id, vendor:vendors(id, company_name, user_id, rating, verified, county)');
        const matchCount = (reqs || []).reduce((acc, r) => {
          acc[r.rfq_id] = (acc[r.rfq_id] || 0) + 1;
          return acc;
        }, {});
        setMatches(matchCount);

        const grouped = {};
        (reqs || []).forEach((r) => {
          if (!grouped[r.rfq_id]) grouped[r.rfq_id] = [];
          if (r.vendor) grouped[r.rfq_id].push(r.vendor);
        });
        setVendorsByRfq(grouped);
      }
    } catch (err) {
      setMessage(`Error loading RFQs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredRFQs = useMemo(() => {
    return rfqs.filter(rfq =>
      (rfq.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rfq.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rfqs, searchTerm]);

  const totalQuotes = Object.values(responses).reduce((sum, v) => sum + v, 0);
  const avgResponseRate = rfqs.length ? Math.round((Object.keys(responses).length / rfqs.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#5f6466' }}>Active RFQs</h1>
          <p className="text-gray-600">{filteredRFQs.length} approved RFQs currently active</p>
        </div>
        <Link href="/admin/dashboard" className="text-sm text-orange-700 hover:text-orange-800">← Dashboard</Link>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded border text-sm" style={{ borderColor: '#f97316', color: '#c2410c', background: '#fff7ed' }}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Active</p>
          <p className="text-2xl font-bold" style={{ color: '#5f6466' }}>{filteredRFQs.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Quotes</p>
          <p className="text-2xl font-bold text-green-600">{totalQuotes}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <p className="text-sm text-gray-600 mb-1">Avg Response Rate</p>
          <p className="text-2xl font-bold" style={{ color: '#ea8f1e' }}>{avgResponseRate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search RFQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-5 h-5 mr-2" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RFQ Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-6 text-center text-gray-600">Loading RFQs...</td></tr>
              ) : filteredRFQs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-6 text-center text-gray-600">No active RFQs.</td></tr>
              ) : (
                filteredRFQs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{rfq.title}</p>
                        <p className="text-sm text-gray-600">{rfq.category || rfq.auto_category}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" /> {rfq.location || rfq.county || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{rfq.budget_range}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : '—'}</p>
                      <p className="text-xs text-gray-500">Status: {rfq.status}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-gray-900">{responses[rfq.id] || 0} quotes</p>
                        <p className="text-gray-600">{matches[rfq.id] || 0} vendors matched</p>
                        <div className="flex flex-wrap gap-1">
                          {(vendorsByRfq[rfq.id] || []).map((v) => (
                            <span key={v.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
                              {v.company_name}
                              {v.verified && <Shield className="w-3 h-3 text-emerald-600" />}
                              {v.rating && <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {v.rating}</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 hover:bg-gray-100 rounded" title="View Details">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
