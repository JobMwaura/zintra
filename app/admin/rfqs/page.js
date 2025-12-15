'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function RFQsRoot() {
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Get counts by status
      const { data: rfqs } = await supabase
        .from('rfqs')
        .select('status, id', { count: 'exact' });

      const pendingApproval = (rfqs || []).filter(r => 
        ['pending', 'needs_verification', 'needs_review', 'needs_fix'].includes(r.status)
      ).length;
      
      const activeRFQs = (rfqs || []).filter(r => 
        ['open', 'active'].includes(r.status)
      ).length;
      
      const closedRFQs = (rfqs || []).filter(r => 
        r.status === 'closed'
      ).length;

      // Get response stats
      const { data: responses } = await supabase
        .from('rfq_responses')
        .select('rfq_id');
      
      const responsesByRfq = {};
      (responses || []).forEach(r => {
        responsesByRfq[r.rfq_id] = (responsesByRfq[r.rfq_id] || 0) + 1;
      });

      const rfqsWithResponses = Object.keys(responsesByRfq).length;
      const avgResponseRate = activeRFQs > 0 
        ? Math.round((rfqsWithResponses / activeRFQs) * 100)
        : 0;

      setStats({
        pendingCount: rfqs?.filter(r => r.status === 'pending').length || 0,
        activeCount: activeRFQs,
        closedCount: closedRFQs,
        totalResponses: responses?.length || 0,
        avgResponseRate,
        pendingApproval,
      });
    } catch (err) {
      console.error('Error loading RFQ stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === 'pending') {
      router.push('/admin/rfqs/pending');
    } else if (tab === 'active') {
      router.push('/admin/rfqs/active');
    } else if (tab === 'analytics') {
      router.push('/admin/rfqs/analytics');
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-sm text-gray-600 font-medium">Response Rate</p>
              <p className="text-3xl font-bold mt-2 text-purple-600">
                {loading ? '...' : stats.avgResponseRate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Avg. across active</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#a855f720' }}>
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow border border-gray-100">
        <div className="border-b border-gray-200 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => handleTabClick('pending')}
              className={`px-6 py-2 font-medium rounded-lg transition-colors ${
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
              onClick={() => handleTabClick('active')}
              className={`px-6 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'active'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={activeTab === 'active' ? { backgroundColor: '#ea8f1e' } : {}}
            >
              Active
              {stats.activeCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  {stats.activeCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabClick('analytics')}
              className={`px-6 py-2 font-medium rounded-lg transition-colors ${
                activeTab === 'analytics'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={activeTab === 'analytics' ? { backgroundColor: '#ea8f1e' } : {}}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
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
                  <span><strong>Active ({stats.activeCount})</strong>: Published RFQs currently accepting vendor responses</span>
                </p>
                <p className="flex items-start">
                  <span className="font-medium mr-3">→</span>
                  <span><strong>Analytics</strong>: View detailed metrics and performance data</span>
                </p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-4">Quick Actions:</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTabClick('pending')}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium transition-colors"
                  >
                    Review Pending ({stats.pendingApproval})
                  </button>
                  <button
                    onClick={() => handleTabClick('active')}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors"
                  >
                    View Active ({stats.activeCount})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back to Dashboard */}
      <Link href="/admin/dashboard" className="text-sm text-orange-700 hover:text-orange-800 font-medium">
        ← Back to Dashboard
      </Link>
    </div>
  );
}