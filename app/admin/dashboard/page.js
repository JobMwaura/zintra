// File: app/admin/dashboard/page.js
// Purpose: Comprehensive admin dashboard with integrated RFQ management

'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  AlertCircle, CheckCircle, Clock, TrendingUp, Eye, Shield, X, Search, Filter
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalVendors: 0,
    pendingRFQs: 0,
    activeUsers: 0,
    totalCategories: 0,
    activeSubscriptions: 0,
    totalPlans: 0,
    pendingApproval: 0,
    activeCount: 0,
    closedCount: 0,
    totalResponses: 0,
    avgResponseRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showRFQSection, setShowRFQSection] = useState(false);
  const [rfqs, setRfqs] = useState([]);
  const [rfqsLoading, setRfqsLoading] = useState(false);
  const [activeRFQTab, setActiveRFQTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [message, setMessage] = useState('');

  const pendingStatuses = ['pending', 'needs_verification', 'needs_review', 'needs_fix'];
  const activeStatuses = ['open', 'active'];

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Get vendors count
      const { count: vendorCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      // Get RFQs count
      const { count: rfqCount } = await supabase
        .from('rfqs')
        .select('*', { count: 'exact', head: true });

      // Get users count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get categories count
      const { count: categoryCount } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions count
      const { count: activeSubCount } = await supabase
        .from('vendor_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get plans count
      const { count: plansCount } = await supabase
        .from('subscription_plans')
        .select('*', { count: 'exact', head: true });

      // Get RFQ stats
      const { data: allRfqs } = await supabase
        .from('rfqs')
        .select('*')
        .order('created_at', { ascending: false });

      const pendingCount = (allRfqs || []).filter(r => pendingStatuses.includes(r.status)).length;
      const activeCount = (allRfqs || []).filter(r => activeStatuses.includes(r.status)).length;
      const closedCount = (allRfqs || []).filter(r => r.status === 'closed').length;

      // Get response stats
      const { data: responses } = await supabase
        .from('rfq_responses')
        .select('*');

      const totalResponses = responses?.length || 0;
      const avgResponseRate = (allRfqs && allRfqs.length > 0)
        ? (totalResponses / allRfqs.length * 100).toFixed(1)
        : 0;

      setStats({
        totalVendors: vendorCount || 0,
        pendingRFQs: rfqCount || 0,
        activeUsers: userCount || 0,
        totalCategories: categoryCount || 0,
        activeSubscriptions: activeSubCount || 0,
        totalPlans: plansCount || 0,
        pendingApproval: pendingCount,
        activeCount: activeCount,
        closedCount: closedCount,
        totalResponses: totalResponses,
        avgResponseRate: avgResponseRate,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRFQsData = async () => {
    try {
      setRfqsLoading(true);
      const { data: allRfqs } = await supabase
        .from('rfqs')
        .select('*')
        .order('created_at', { ascending: false });
      setRfqs(allRfqs || []);
    } catch (error) {
      console.error('Error loading RFQs:', error);
    } finally {
      setRfqsLoading(false);
    }
  };

  const handleToggleRFQSection = async () => {
    if (!showRFQSection && rfqs.length === 0) {
      await loadRFQsData();
    }
    setShowRFQSection(!showRFQSection);
  };

  const notifyVendors = async (rfq) => {
    const category = rfq.category || rfq.auto_category;
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, user_id, county, category, rating, verified, status')
      .eq('status', 'active')
      .eq('category', category);

    const matching = (vendors || [])
      .filter(v => {
        const countyOk = !rfq.county || (v.county || '').toLowerCase() === rfq.county.toLowerCase();
        const qualityOk = (v.rating || 0) >= 3.5 && (v.verified || false);
        return countyOk && qualityOk;
      })
      .slice(0, 8);

    if (matching.length === 0) {
      setMessage('⚠️ No matching vendors found');
      return;
    }

    await supabase.from('rfq_requests').insert(
      matching.map(v => ({
        rfq_id: rfq.id,
        vendor_id: v.user_id || v.id,
        status: 'pending',
      }))
    );

    setMessage('✓ RFQ approved and vendors notified');
  };

  const handleApprove = async (rfq) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'open', published_at: new Date().toISOString(), validation_status: 'validated' })
        .eq('id', rfq.id);
      if (error) throw error;
      await notifyVendors(rfq);
      await loadRFQsData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleReject = async (rfq) => {
    if (!rejectReason.trim()) {
      setMessage('Please provide a rejection reason');
      return;
    }
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'rejected', rejection_reason: rejectReason, validation_status: 'rejected' })
        .eq('id', rfq.id);
      if (error) throw error;
      setMessage('✓ RFQ rejected');
      setShowRejectModal(false);
      setRejectReason('');
      await loadRFQsData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleCloseRFQ = async (rfqId) => {
    if (!confirm('Close this RFQ?')) return;
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', rfqId);
      if (error) throw error;
      setMessage('✓ RFQ closed');
      await loadRFQsData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const pendingRFQs = useMemo(() => {
    return (rfqs || [])
      .filter(r => pendingStatuses.includes(r.status))
      .filter(r => 
        !searchTerm || 
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [rfqs, searchTerm]);

  const activeRFQs = useMemo(() => {
    return (rfqs || [])
      .filter(r => activeStatuses.includes(r.status))
      .filter(r => 
        !searchTerm || 
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [rfqs, searchTerm]);

  const displayRFQs = activeRFQTab === 'pending' ? pendingRFQs : activeRFQs;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to ZINTRA Admin Panel</p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.includes('✓')
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-3">
            {message.includes('✓') ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Vendors Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Vendors</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.totalVendors}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4 0a1 1 0 11-2 0 1 1 0 012 0m-5 6a1 1 0 11-2 0 1 1 0 012 0m5 0a1 1 0 11-2 0 1 1 0 012 0" />
              </svg>
            </div>
          </div>
        </div>

        {/* RFQs Card - Click to expand */}
        <div 
          onClick={handleToggleRFQSection}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-orange-300 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending RFQs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.pendingApproval}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-orange-600 font-medium mt-4">Click to expand RFQ management →</p>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.activeUsers}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a3 3 0 003-3v-2a3 3 0 00-3-3H3a3 3 0 00-3 3v2a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Categories Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Categories</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.totalCategories}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Subscriptions Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Subscriptions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.activeSubscriptions}
              </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <a href="/admin/dashboard/subscriptions" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Manage Subscriptions →
          </a>
        </div>
      </div>

      {/* RFQ Management Section - Expandable */}
      {showRFQSection && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">RFQ Management</h2>
            <button
              onClick={handleToggleRFQSection}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 px-6 flex gap-1">
            <button
              onClick={() => setActiveRFQTab('pending')}
              className={`px-4 py-3 font-medium transition ${
                activeRFQTab === 'pending'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Pending ({stats.pendingApproval})
              </div>
            </button>
            <button
              onClick={() => setActiveRFQTab('active')}
              className={`px-4 py-3 font-medium transition ${
                activeRFQTab === 'active'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Active ({stats.activeCount})
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Search */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* RFQ List */}
            {rfqsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-4 text-gray-600">Loading RFQs...</p>
              </div>
            ) : displayRFQs.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No {activeRFQTab} RFQs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayRFQs.map(rfq => (
                  <div key={rfq.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-orange-300 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{rfq.title}</h3>
                        <p className="text-sm text-gray-600">{rfq.category || rfq.auto_category}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        activeRFQTab === 'pending'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {rfq.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{rfq.description}</p>

                    <div className="flex gap-2 flex-wrap mb-3">
                      {rfq.budget_range && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">{rfq.budget_range}</span>}
                      {rfq.county && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">📍 {rfq.county}</span>}
                    </div>

                    {/* Actions */}
                    {activeRFQTab === 'pending' ? (
                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleApprove(rfq)}
                          className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition"
                        >
                          Approve & Notify
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRFQ(rfq);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRFQ(rfq);
                            setShowRejectModal(true);
                          }}
                          className="px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            setSelectedRFQ(rfq);
                            setShowDetailModal(true);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleCloseRFQ(rfq.id)}
                          className="px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="space-y-2">
            <a href="/admin/dashboard/vendors" className="block p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700">
              → Manage Vendors
            </a>
            <a href="/admin/dashboard/rfqs" className="block p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700">
              → Full RFQ Management Page
            </a>
            <a href="/admin/categories" className="block p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700">
              → Manage Categories
            </a>
            <a href="/admin/users" className="block p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700">
              → Manage Users
            </a>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Database: Online</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">API: Online</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Auth: Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedRFQ.title}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Description</p>
                <p className="text-gray-900 mt-1">{selectedRFQ.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Budget Range</p>
                  <p className="text-gray-900 mt-1">{selectedRFQ.budget_range || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Timeline</p>
                  <p className="text-gray-900 mt-1">{selectedRFQ.timeline || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Category</p>
                  <p className="text-gray-900 mt-1">{selectedRFQ.category || selectedRFQ.auto_category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Location</p>
                  <p className="text-gray-900 mt-1">{selectedRFQ.county || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">Reject RFQ</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why you're rejecting this RFQ..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedRFQ)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
