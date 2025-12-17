'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Eye, Shield, MapPin, Star, Lock, ArrowLeft, X, Search, Filter } from 'lucide-react';

function RFQsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  
  const [stats, setStats] = useState({
    pendingCount: 0,
    activeCount: 0,
    closedCount: 0,
    totalResponses: 0,
    avgResponseRate: 0,
    pendingApproval: 0,
    directCount: 0,
    matchedCount: 0,
    publicCount: 0,
  });
  const [allRfqs, setAllRfqs] = useState([]);
  const [responses, setResponses] = useState({});
  const [matches, setMatches] = useState({});
  const [vendorsByRfq, setVendorsByRfq] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Get all RFQs with their types
      const { data: rfqs } = await supabase
        .from('rfqs')
        .select('*')
        .order('created_at', { ascending: false });

      setAllRfqs(rfqs || []);

      const pendingApproval = (rfqs || []).filter(r => 
        ['pending', 'needs_verification', 'needs_review', 'needs_fix'].includes(r.status)
      ).length;
      
      const activeRFQs = (rfqs || []).filter(r => 
        ['open', 'active'].includes(r.status)
      ).length;
      
      const closedRFQs = (rfqs || []).filter(r => 
        r.status === 'closed'
      ).length;

      // Count by type
      const directCount = (rfqs || []).filter(r => r.rfq_type === 'direct').length;
      const matchedCount = (rfqs || []).filter(r => r.rfq_type === 'matched').length;
      const publicCount = (rfqs || []).filter(r => r.rfq_type === 'public').length;

      // Get response stats
      const { data: responses_data } = await supabase
        .from('rfq_responses')
        .select('rfq_id');
      
      const responsesByRfq = {};
      (responses_data || []).forEach(r => {
        responsesByRfq[r.rfq_id] = (responsesByRfq[r.rfq_id] || 0) + 1;
      });
      setResponses(responsesByRfq);

      const rfqsWithResponses = Object.keys(responsesByRfq).length;
      const avgResponseRate = activeRFQs > 0 
        ? Math.round((rfqsWithResponses / activeRFQs) * 100)
        : 0;

      // Get vendor matches
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

      setStats({
        pendingCount: rfqs?.filter(r => r.status === 'pending').length || 0,
        activeCount: activeRFQs,
        closedCount: closedRFQs,
        totalResponses: responses_data?.length || 0,
        avgResponseRate,
        pendingApproval,
        directCount,
        matchedCount,
        publicCount,
      });
    } catch (err) {
      console.error('Error loading RFQ stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === 'pending') {
      router.push('/admin/rfqs?tab=pending');
    } else if (tab === 'direct') {
      router.push('/admin/rfqs?tab=direct');
    } else if (tab === 'matched') {
      router.push('/admin/rfqs?tab=matched');
    } else if (tab === 'public') {
      router.push('/admin/rfqs?tab=public');
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

  const handleCloseRFQ = async () => {
    if (!selectedRFQ || !closeReason.trim()) {
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
      setShowCloseModal(false);
      setCloseReason('');
      setSelectedRFQ(null);
      loadStats();
    } catch (err) {
      console.error('Error closing RFQ:', err);
    }
  };

  // Filter RFQs by type and search term
  const pendingRFQs = useMemo(() => {
    return allRfqs.filter(r => 
      ['pending', 'needs_verification', 'needs_review', 'needs_fix'].includes(r.status) &&
      ((r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (r.category || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allRfqs, searchTerm]);

  const directRFQs = useMemo(() => {
    return allRfqs.filter(r => 
      r.rfq_type === 'direct' && ['open', 'active'].includes(r.status) &&
      ((r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (r.category || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allRfqs, searchTerm]);

  const matchedRFQs = useMemo(() => {
    return allRfqs.filter(r => 
      r.rfq_type === 'matched' && ['open', 'active'].includes(r.status) &&
      ((r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (r.category || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allRfqs, searchTerm]);

  const publicRFQs = useMemo(() => {
    return allRfqs.filter(r => 
      r.rfq_type === 'public' && ['open', 'active'].includes(r.status) &&
      ((r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
       (r.category || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allRfqs, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900" style={{ color: '#535554' }}>
          RFQ Management
        </h1>
        <p className="text-gray-600 mt-2">Manage customer requests for quotes</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending Approval</p>
              <p className="text-3xl font-bold mt-2" style={{ color: '#ea8f1e' }}>
                {loading ? '...' : stats.pendingApproval}
              </p>
              <p className="text-xs text-gray-500 mt-1">Needs review</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#ea8f1e20' }}>
              <AlertCircle className="w-6 h-6" style={{ color: '#ea8f1e' }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active RFQs</p>
              <p className="text-3xl font-bold mt-2" style={{ color: '#10b981' }}>
                {loading ? '...' : stats.activeCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">Currently open</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#10b98120' }}>
              <Clock className="w-6 h-6" style={{ color: '#10b981' }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Responses</p>
              <p className="text-3xl font-bold mt-2 text-blue-600">
                {loading ? '...' : stats.totalResponses}
              </p>
              <p className="text-xs text-gray-500 mt-1">Vendor quotes</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#3b82f620' }}>
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Direct RFQs</p>
              <p className="text-3xl font-bold mt-2 text-cyan-600">
                {loading ? '...' : stats.directCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">Selected vendors</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#06b6d420' }}>
              <Shield className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Matched RFQs</p>
              <p className="text-3xl font-bold mt-2 text-indigo-600">
                {loading ? '...' : stats.matchedCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">Auto-matched</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#4f46e520' }}>
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Public RFQs</p>
              <p className="text-3xl font-bold mt-2 text-rose-600">
                {loading ? '...' : stats.publicCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">Marketplace</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4324420' }}>
              <Eye className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow border border-gray-100">
        <div className="border-b border-gray-200 p-4 overflow-x-auto">
          <div className="flex gap-2">
            <button
              onClick={() => handleTabClick('pending')}
              className={`px-6 py-2 font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={activeTab === 'pending' ? { backgroundColor: '#ea8f1e' } : {}}
            >
              Pending Review
              {stats.pendingApproval > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                  {stats.pendingApproval}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabClick('direct')}
              className={`px-6 py-2 font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'direct'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={activeTab === 'direct' ? { backgroundColor: '#ea8f1e' } : {}}
            >
              Direct ({stats.directCount})
            </button>
            <button
              onClick={() => handleTabClick('matched')}
              className={`px-6 py-2 font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'matched'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={activeTab === 'matched' ? { backgroundColor: '#ea8f1e' } : {}}
            >
              Matched ({stats.matchedCount})
            </button>
            <button
              onClick={() => handleTabClick('public')}
              className={`px-6 py-2 font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'public'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={activeTab === 'public' ? { backgroundColor: '#ea8f1e' } : {}}
            >
              Public ({stats.publicCount})
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* PENDING TAB */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending RFQs - Admin Review</h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by title or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>
              </div>
              {pendingRFQs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No pending RFQs</p>
                  <p className="text-sm text-gray-500">All RFQs have been reviewed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRFQs.map((rfq) => (
                    <div key={rfq.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-orange-300 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{rfq.title}</h3>
                          <p className="text-sm text-gray-600">{rfq.category}</p>
                        </div>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          {rfq.status}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <button className="flex-1 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition text-sm">
                          ✓ Approve
                        </button>
                        <button className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition text-sm">
                          ✗ Reject
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DIRECT TAB */}
          {activeTab === 'direct' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Direct RFQs - Selected Vendors</h2>
                <p className="text-sm text-gray-600 mb-4">RFQs sent to specific vendors chosen by customers</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by title or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>
              </div>
              {directRFQs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No active direct RFQs</p>
                  <p className="text-sm text-gray-500">Direct RFQs appear here once customers select vendors</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {directRFQs.map((rfq) => (
                    <div key={rfq.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-cyan-300 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{rfq.title}</h3>
                          <p className="text-sm text-gray-600">{rfq.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-cyan-600">{responses[rfq.id] || 0}</p>
                          <p className="text-xs text-gray-600">quotes</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 py-3 border-y border-gray-200 mb-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Vendors Sent</p>
                          <p className="font-semibold">{matches[rfq.id] || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Responses</p>
                          <p className="font-semibold">{responses[rfq.id] || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Days Active</p>
                          <p className="font-semibold">{getDaysActive(rfq.created_at)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedRFQ(rfq);
                          setShowCloseModal(true);
                        }}
                        className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 font-medium transition text-sm"
                      >
                        Close RFQ
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MATCHED TAB */}
          {activeTab === 'matched' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Matched RFQs - Auto-Matched Vendors</h2>
                <p className="text-sm text-gray-600 mb-4">RFQs automatically matched to suitable vendors by the system</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by title or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>
              </div>
              {matchedRFQs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No active matched RFQs</p>
                  <p className="text-sm text-gray-500">Matched RFQs will appear here once customers use the system matching</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matchedRFQs.map((rfq) => (
                    <div key={rfq.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-300 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{rfq.title}</h3>
                          <p className="text-sm text-gray-600">{rfq.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{responses[rfq.id] || 0}</p>
                          <p className="text-xs text-gray-600">quotes</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 py-3 border-y border-gray-200 mb-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Matched Count</p>
                          <p className="font-semibold">{matches[rfq.id] || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Responses</p>
                          <p className="font-semibold">{responses[rfq.id] || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Days Active</p>
                          <p className="font-semibold">{getDaysActive(rfq.created_at)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedRFQ(rfq);
                          setShowCloseModal(true);
                        }}
                        className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 font-medium transition text-sm"
                      >
                        Close RFQ
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PUBLIC TAB */}
          {activeTab === 'public' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Public RFQs - Marketplace Bidding</h2>
                <p className="text-sm text-gray-600 mb-4">Open marketplace RFQs where any qualified vendor can bid</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by title or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                    />
                  </div>
                </div>
              </div>
              {publicRFQs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No active public RFQs</p>
                  <p className="text-sm text-gray-500">Public RFQs will appear here once customers post to the marketplace</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publicRFQs.map((rfq) => (
                    <div key={rfq.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-rose-300 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{rfq.title}</h3>
                          <p className="text-sm text-gray-600">{rfq.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-rose-600">{responses[rfq.id] || 0}</p>
                          <p className="text-xs text-gray-600">quotes</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 py-3 border-y border-gray-200 mb-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Views</p>
                          <p className="font-semibold">—</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Responses</p>
                          <p className="font-semibold">{responses[rfq.id] || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Days Active</p>
                          <p className="font-semibold">{getDaysActive(rfq.created_at)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedRFQ(rfq);
                          setShowCloseModal(true);
                        }}
                        className="w-full px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 font-medium transition text-sm"
                      >
                        Close RFQ
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">RFQ Pipeline Overview</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <p className="flex items-start">
                  <span className="font-medium mr-3">→</span>
                  <span><strong>Pending Review ({stats.pendingApproval})</strong>: RFQs awaiting admin approval before being shown to vendors</span>
                </p>
                <p className="flex items-start">
                  <span className="font-medium mr-3">→</span>
                  <span><strong>Direct ({stats.directCount})</strong>: RFQs sent to specific vendors selected by customers</span>
                </p>
                <p className="flex items-start">
                  <span className="font-medium mr-3">→</span>
                  <span><strong>Matched ({stats.matchedCount})</strong>: RFQs automatically matched to suitable vendors by the system</span>
                </p>
                <p className="flex items-start">
                  <span className="font-medium mr-3">→</span>
                  <span><strong>Public ({stats.publicCount})</strong>: Open marketplace RFQs where any qualified vendor can bid</span>
                </p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-4">Quick Actions:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleTabClick('pending')}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium transition-colors text-sm"
                  >
                    Review Pending ({stats.pendingApproval})
                  </button>
                  <button
                    onClick={() => handleTabClick('direct')}
                    className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 font-medium transition-colors text-sm"
                  >
                    View Direct ({stats.directCount})
                  </button>
                  <button
                    onClick={() => handleTabClick('matched')}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium transition-colors text-sm"
                  >
                    View Matched ({stats.matchedCount})
                  </button>
                  <button
                    onClick={() => handleTabClick('public')}
                    className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 font-medium transition-colors text-sm"
                  >
                    View Public ({stats.publicCount})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close RFQ Modal */}
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

      {/* Back to Dashboard */}
      <Link href="/admin/dashboard" className="text-sm text-orange-700 hover:text-orange-800 font-medium">
        ← Back to Dashboard
      </Link>
    </div>
  );
}

export default function RFQsRoot() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#ea8f1e' }}></div>
          <p className="mt-4 text-gray-600">Loading RFQs...</p>
        </div>
      </div>
    }>
      <RFQsContent />
    </Suspense>
  );
}