'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Search, Filter, Eye, Shield, MapPin, Star, X, Lock, ArrowLeft, Clock, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function ActiveRFQs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [rfqs, setRfqs] = useState([]);
  const [responses, setResponses] = useState({});
  const [matches, setMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [vendorsByRfq, setVendorsByRfq] = useState({});
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');

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

  const handleCloseRFQ = async () => {
    if (!selectedRFQ || !closeReason.trim()) {
      setMessage('Please provide a reason for closing');
      return;
    }

    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ 
          status: 'closed', 
          closed_at: new Date().toISOString(),
          rejection_reason: closeReason
        })
        .eq('id', selectedRFQ.id);

      if (error) throw error;
      setMessage('RFQ closed successfully');
      setShowCloseModal(false);
      setCloseReason('');
      setSelectedRFQ(null);
      fetchActive();
    } catch (err) {
      setMessage(`Error closing RFQ: ${err.message}`);
    }
  };

  const getDaysActive = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isStale = (rfq) => {
    return getDaysActive(rfq.created_at) > 30 && (responses[rfq.id] || 0) === 0;
  };

  const filteredRFQs = useMemo(() => {
    return rfqs.filter(rfq =>
      (rfq.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rfq.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rfqs, searchTerm]);

  const totalQuotes = Object.values(responses).reduce((sum, v) => sum + v, 0);
  const avgResponseRate = rfqs.length ? Math.round((Object.keys(responses).length / rfqs.length) * 100) : 0;
  const staleCount = rfqs.filter(r => isStale(r)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb & Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/rfqs" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Link href="/admin/dashboard" className="hover:text-gray-900">Admin</Link>
                  <span>/</span>
                  <Link href="/admin/rfqs" className="hover:text-gray-900">RFQ Management</Link>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">Active RFQs</span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: '#535554' }}>Active RFQs</h1>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-600">Currently Open</p>
              <p className="text-2xl font-bold text-green-600">{filteredRFQs.length}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 border-t border-gray-200">
            <Link 
              href="/admin/rfqs/pending"
              className="px-4 py-3 font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Pending
              </div>
            </Link>
            <Link 
              href="/admin/rfqs/active"
              className="px-4 py-3 font-medium text-green-600 border-b-2 border-green-600 hover:bg-green-50 transition"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Active
              </div>
            </Link>
            <Link 
              href="/admin/rfqs/analytics"
              className="px-4 py-3 font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Analytics
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {message && (
            <div className="mb-4 p-4 rounded-lg border border-green-200 text-sm bg-green-50 text-green-800 font-medium">
              {message}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Total Active</p>
              <p className="text-3xl font-bold mt-2 text-green-600">{filteredRFQs.length}</p>
              <p className="text-xs text-gray-500 mt-1">RFQs accepting responses</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Total Quotes Received</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">{totalQuotes}</p>
              <p className="text-xs text-gray-500 mt-1">From all vendors</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Response Rate</p>
              <p className="text-3xl font-bold mt-2 text-purple-600">{avgResponseRate}%</p>
              {staleCount > 0 && (
                <p className="text-xs text-red-600 mt-1 font-semibold">⚠️ {staleCount} stale RFQs</p>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, category, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>

          {/* RFQ List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                <p className="text-gray-600">Loading RFQs...</p>
              </div>
            </div>
          ) : filteredRFQs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No active RFQs</p>
              <p className="text-sm text-gray-500">All RFQs are either pending, closed, or completed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRFQs.map((rfq) => (
                <div key={rfq.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-green-300 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold" style={{ color: '#535554' }}>
                          {rfq.title}
                        </h3>
                        {isStale(rfq) && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                            ⚠️ Stale
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rfq.category || rfq.auto_category}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {rfq.location || rfq.county || 'N/A'}
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {getDaysActive(rfq.created_at)} days active
                        </span>
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          Status: {rfq.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{responses[rfq.id] || 0}</p>
                      <p className="text-sm text-gray-600">quotes received</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-200 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget</p>
                      <p className="font-semibold text-gray-900">{rfq.budget_range || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Posted</p>
                      <p className="font-semibold text-gray-900">{rfq.created_at ? new Date(rfq.created_at).toLocaleDateString() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Vendors Matched</p>
                      <p className="font-semibold text-gray-900">{matches[rfq.id] || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Response Rate</p>
                      <p className="font-semibold text-gray-900">{responses[rfq.id] ? Math.round((responses[rfq.id] / (matches[rfq.id] || 1)) * 100) : 0}%</p>
                    </div>
                  </div>

                  {(vendorsByRfq[rfq.id] || []).length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-2 font-semibold uppercase">Vendors Matched</p>
                      <div className="flex flex-wrap gap-2">
                        {(vendorsByRfq[rfq.id] || []).slice(0, 4).map((v) => (
                          <span key={v.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 transition">
                            <span>{v.company_name}</span>
                            {v.verified && <Shield className="w-3 h-3 text-emerald-600" />}
                            {v.rating && <span className="inline-flex items-center gap-0.5 text-xs"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {v.rating}</span>}
                          </span>
                        ))}
                        {(vendorsByRfq[rfq.id] || []).length > 4 && (
                          <span className="text-sm text-gray-600 px-3 py-1.5">+{(vendorsByRfq[rfq.id] || []).length - 4} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => {
                        setSelectedRFQ(rfq);
                        setShowCloseModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50 text-red-600 font-medium transition"
                    >
                      <Lock className="w-4 h-4" />
                      Close RFQ
                    </button>
                    <button 
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showCloseModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold" style={{ color: '#535554' }}>
                Close RFQ
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to close <strong>{selectedRFQ.title}</strong>? This RFQ will no longer accept new vendor responses.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason for Closing*</label>
              <textarea
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                rows="3"
                placeholder="e.g., Customer selected a vendor, insufficient responses, budget changed..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setCloseReason('');
                  setSelectedRFQ(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseRFQ}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
              >
                Close RFQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
