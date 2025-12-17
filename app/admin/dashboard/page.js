// File: app/admin/dashboard/page.js
// Purpose: Unified admin dashboard with integrated RFQ management

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Eye, Shield, MapPin, Star, Lock, X, Search, Filter } from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [stats, setStats] = useState({
    totalVendors: 0,
    pendingRFQs: 0,
    activeUsers: 0,
    totalCategories: 0,
    activeSubscriptions: 0,
    totalPlans: 0,
    pendingApproval: 0,
    directCount: 0,
    matchedCount: 0,
    publicCount: 0,
    activeCount: 0,
    totalResponses: 0,
  });
  const [allRfqs, setAllRfqs] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [rfqsLoading, setRfqsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  useEffect(() => {
    if (activeTab === 'overview') {
      loadDashboardStats();
    } else if (activeTab.startsWith('rfqs')) {
      loadRFQsData();
    }
  }, [activeTab]);

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

      setStats(prev => ({
        ...prev,
        totalVendors: vendorCount || 0,
        pendingRFQs: rfqCount || 0,
        activeUsers: userCount || 0,
        totalCategories: categoryCount || 0,
        activeSubscriptions: activeSubCount || 0,
        totalPlans: plansCount || 0,
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRFQsData = async () => {
    try {
      setRfqsLoading(true);

      // Get all RFQs
      const { data: rfqs } = await supabase
        .from('rfqs')
        .select('*')
        .order('created_at', { ascending: false });

      setAllRfqs(rfqs || []);

      // Calculate stats
      if (rfqs) {
        const pendingCount = rfqs.filter(r => r.status === 'pending_approval').length;
        const activeCount = rfqs.filter(r => r.status === 'active').length;
        const directCount = rfqs.filter(r => r.rfq_type === 'direct').length;
        const matchedCount = rfqs.filter(r => r.rfq_type === 'matched').length;
        const publicCount = rfqs.filter(r => r.rfq_type === 'public').length;

        setStats(prev => ({
          ...prev,
          pendingApproval: pendingCount,
          activeCount: activeCount,
          directCount: directCount,
          matchedCount: matchedCount,
          publicCount: publicCount,
        }));
      }

      // Get response counts for each RFQ
      if (rfqs && rfqs.length > 0) {
        const rfqIds = rfqs.map(r => r.id);
        const { data: allResponses } = await supabase
          .from('rfq_responses')
          .select('rfq_id', { count: 'exact' })
          .in('rfq_id', rfqIds);

        const responseCounts = {};
        rfqs.forEach(rfq => {
          responseCounts[rfq.id] = allResponses?.filter(r => r.rfq_id === rfq.id).length || 0;
        });
        setResponses(responseCounts);
      }
    } catch (error) {
      console.error('Error loading RFQs:', error);
    } finally {
      setRfqsLoading(false);
    }
  };

  const handleCloseRFQ = async () => {
    if (!selectedRFQ || !closeReason) return;

    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'closed', close_reason: closeReason })
        .eq('id', selectedRFQ.id);

      if (error) throw error;

      setShowCloseModal(false);
      setSelectedRFQ(null);
      setCloseReason('');
      loadRFQsData();
    } catch (error) {
      console.error('Error closing RFQ:', error);
    }
  };

  const getRFQsByTab = () => {
    if (!allRfqs) return [];
    
    if (activeTab === 'rfqs-pending') {
      return allRfqs.filter(r => r.status === 'pending_approval');
    } else if (activeTab === 'rfqs-direct') {
      return allRfqs.filter(r => r.rfq_type === 'direct');
    } else if (activeTab === 'rfqs-matched') {
      return allRfqs.filter(r => r.rfq_type === 'matched');
    } else if (activeTab === 'rfqs-public') {
      return allRfqs.filter(r => r.rfq_type === 'public');
    }
    return allRfqs;
  };

  const filteredRfqs = getRFQsByTab().filter(
    rfq => !searchTerm || rfq.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Overview Tab Content
  const OverviewContent = () => (
    <div className="space-y-8">
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

        {/* RFQs Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending RFQs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {loading ? '...' : stats.pendingRFQs}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <button 
            onClick={() => router.push('/admin/dashboard?tab=rfqs-pending')}
            className="mt-4 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            View Pending →
          </button>
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
          <button 
            onClick={() => router.push('/admin/dashboard?tab=subscriptions')}
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Manage Subscriptions →
          </button>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
          <div className="space-y-2">
            <button 
              onClick={() => router.push('/admin/dashboard?tab=rfqs-direct')}
              className="block w-full text-left p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700"
            >
              → View RFQs (Direct)
            </button>
            <button 
              onClick={() => router.push('/admin/dashboard?tab=rfqs-matched')}
              className="block w-full text-left p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700"
            >
              → View RFQs (Matched)
            </button>
            <button 
              onClick={() => router.push('/admin/dashboard?tab=rfqs-public')}
              className="block w-full text-left p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700"
            >
              → View RFQs (Public)
            </button>
            <a href="/admin/vendors" className="block p-3 hover:bg-gray-50 rounded-lg transition text-blue-600 hover:text-blue-700">
              → Manage Vendors
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
    </div>
  );

  // RFQ Content Component
  const RFQContent = () => {
    const displayRfqs = filteredRfqs.slice(0, 50);

    if (rfqsLoading) {
      return <div className="text-center py-8">Loading RFQs...</div>;
    }

    return (
      <div className="space-y-6">
        {/* RFQ Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Pending Approval</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingApproval}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Active</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Direct</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.directCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 font-medium">Matched</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.matchedCount}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search RFQs by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* RFQ List */}
        {displayRfqs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No RFQs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayRfqs.map(rfq => (
              <div key={rfq.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{rfq.title || 'Untitled RFQ'}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rfq.rfq_type === 'direct' ? 'bg-blue-100 text-blue-700' :
                        rfq.rfq_type === 'matched' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rfq.rfq_type?.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rfq.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                        rfq.status === 'active' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {rfq.status?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rfq.description?.substring(0, 100)}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{responses[rfq.id] || 0} responses</span>
                      <span>{rfq.category || 'N/A'}</span>
                    </div>
                  </div>
                  {rfq.status !== 'closed' && (
                    <button
                      onClick={() => {
                        setSelectedRFQ(rfq);
                        setShowCloseModal(true);
                      }}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to ZINTRA Admin Panel</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8 overflow-x-auto">
          <button
            onClick={() => router.push('/admin/dashboard?tab=overview')}
            className={`px-1 py-4 font-medium border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => router.push('/admin/dashboard?tab=rfqs-pending')}
            className={`px-1 py-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'rfqs-pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            RFQs - Pending
          </button>
          <button
            onClick={() => router.push('/admin/dashboard?tab=rfqs-direct')}
            className={`px-1 py-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'rfqs-direct'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            RFQs - Direct
          </button>
          <button
            onClick={() => router.push('/admin/dashboard?tab=rfqs-matched')}
            className={`px-1 py-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'rfqs-matched'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            RFQs - Matched
          </button>
          <button
            onClick={() => router.push('/admin/dashboard?tab=rfqs-public')}
            className={`px-1 py-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'rfqs-public'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            RFQs - Public
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' ? <OverviewContent /> : <RFQContent />}

      {/* Close RFQ Modal */}
      {showCloseModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Close RFQ</h2>
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setSelectedRFQ(null);
                  setCloseReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to close "{selectedRFQ?.title}"? Please provide a reason.
            </p>
            <textarea
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="Reason for closing..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows="4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCloseModal(false);
                  setSelectedRFQ(null);
                  setCloseReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseRFQ}
                disabled={!closeReason}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 rounded-lg transition font-medium"
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

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}