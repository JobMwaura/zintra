'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Clock, AlertCircle } from 'lucide-react';

export default function RFQAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalRFQs: 0,
    approvalRate: 0,
    rejectionRate: 0,
    avgTimeToResponse: 0,
    categoryPerformance: [],
    countyHotspots: [],
    budgetDistribution: [],
    vendorResponseRates: [],
    spamDetectionAccuracy: 0,
    pendingByStatus: {},
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days'); // 7days, 30days, 90days, all

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate = new Date(2020, 0, 1); // all time
      }

      // Get all RFQs in range
      const { data: rfqs } = await supabase
        .from('rfqs')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const allRFQs = rfqs || [];
      const totalRFQs = allRFQs.length;

      // Calculate approval/rejection rates
      const approved = allRFQs.filter(r => ['open', 'active', 'closed'].includes(r.status)).length;
      const rejected = allRFQs.filter(r => r.status === 'rejected').length;
      const approvalRate = totalRFQs > 0 ? Math.round((approved / totalRFQs) * 100) : 0;
      const rejectionRate = totalRFQs > 0 ? Math.round((rejected / totalRFQs) * 100) : 0;

      // Get pending breakdown
      const pendingByStatus = {
        pending: allRFQs.filter(r => r.status === 'pending').length,
        needs_verification: allRFQs.filter(r => r.status === 'needs_verification').length,
        needs_review: allRFQs.filter(r => r.status === 'needs_review').length,
        needs_fix: allRFQs.filter(r => r.status === 'needs_fix').length,
      };

      // Category performance
      const categoryStats = {};
      allRFQs.forEach(rfq => {
        const cat = rfq.category || rfq.auto_category || 'Uncategorized';
        if (!categoryStats[cat]) {
          categoryStats[cat] = { total: 0, responses: 0 };
        }
        categoryStats[cat].total++;
      });

      // Get responses for each RFQ
      const { data: responses } = await supabase
        .from('rfq_responses')
        .select('rfq_id, created_at');

      responses?.forEach(resp => {
        const rfq = allRFQs.find(r => r.id === resp.rfq_id);
        if (rfq) {
          const cat = rfq.category || rfq.auto_category || 'Uncategorized';
          if (categoryStats[cat]) {
            categoryStats[cat].responses++;
          }
        }
      });

      const categoryPerformance = Object.entries(categoryStats)
        .map(([name, stats]) => ({
          name,
          total: stats.total,
          responses: stats.responses,
          responseRate: stats.total > 0 ? Math.round((stats.responses / stats.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // County hotspots
      const countyStats = {};
      allRFQs.forEach(rfq => {
        const county = rfq.county || 'Unknown';
        countyStats[county] = (countyStats[county] || 0) + 1;
      });

      const countyHotspots = Object.entries(countyStats)
        .map(([county, count]) => ({ county, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Budget distribution
      const budgetRanges = {
        '< 50K': 0,
        '50K - 100K': 0,
        '100K - 500K': 0,
        '500K - 1M': 0,
        '> 1M': 0,
      };

      allRFQs.forEach(rfq => {
        const budget = rfq.budget_range || '';
        if (budget.includes('Custom')) {
          // Parse custom budget - would need more sophisticated parsing
          budgetRanges['100K - 500K']++;
        } else if (budget.includes('50') && !budget.includes('100')) {
          budgetRanges['< 50K']++;
        } else if (budget.includes('100') && !budget.includes('500')) {
          budgetRanges['50K - 100K']++;
        } else if (budget.includes('500') && !budget.includes('1M')) {
          budgetRanges['100K - 500K']++;
        } else if (budget.includes('1M')) {
          budgetRanges['500K - 1M']++;
        } else {
          budgetRanges['100K - 500K']++;
        }
      });

      const budgetDistribution = Object.entries(budgetRanges)
        .map(([range, count]) => ({ range, count, percentage: totalRFQs > 0 ? Math.round((count / totalRFQs) * 100) : 0 }));

      // Vendor response rates (for requests)
      const { data: requests } = await supabase
        .from('rfq_requests')
        .select('vendor_id, rfq_id');

      const vendorStats = {};
      requests?.forEach(req => {
        if (!vendorStats[req.vendor_id]) {
          vendorStats[req.vendor_id] = { requests: 0, responses: 0 };
        }
        vendorStats[req.vendor_id].requests++;
      });

      responses?.forEach(resp => {
        if (vendorStats[resp.vendor_id]) {
          vendorStats[resp.vendor_id].responses++;
        }
      });

      const vendorResponseRates = Object.entries(vendorStats)
        .map(([vendorId, stats]) => ({
          vendorId,
          requests: stats.requests,
          responses: stats.responses,
          responseRate: stats.requests > 0 ? Math.round((stats.responses / stats.requests) * 100) : 0,
        }))
        .sort((a, b) => b.responseRate - a.responseRate)
        .slice(0, 10);

      // Spam detection accuracy (approvals vs rejections)
      const rejectedSpamCount = allRFQs.filter(r => r.status === 'rejected' && (r.spam_score || 0) > 50).length;
      const spamDetectionAccuracy = rejected > 0 ? Math.round((rejectedSpamCount / rejected) * 100) : 0;

      // Average time to response
      const activeRFQs = allRFQs.filter(r => ['open', 'active'].includes(r.status));
      let avgTimeToResponse = 0;
      if (activeRFQs.length > 0) {
        const responseTimes = activeRFQs.map(rfq => {
          const firstResponse = responses?.find(r => r.rfq_id === rfq.id);
          if (firstResponse) {
            return Math.floor((new Date(firstResponse.created_at) - new Date(rfq.created_at)) / (1000 * 60 * 60 * 24));
          }
          return 0;
        });
        avgTimeToResponse = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      }

      setAnalytics({
        totalRFQs,
        approvalRate,
        rejectionRate,
        avgTimeToResponse,
        categoryPerformance,
        countyHotspots,
        budgetDistribution,
        vendorResponseRates,
        spamDetectionAccuracy,
        pendingByStatus,
      });
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#535554' }}>
            RFQ Analytics
          </h1>
          <p className="text-gray-600">Detailed metrics and performance insights</p>
        </div>
        <Link href="/admin/dashboard" className="text-sm text-orange-700 hover:text-orange-800">← Dashboard</Link>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
        <label className="text-sm font-medium text-gray-700 mr-4">Time Period:</label>
        <div className="inline-flex gap-2">
          {['7days', '30days', '90days', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === range
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={dateRange === range ? { backgroundColor: '#ea8f1e' } : {}}
            >
              {range === '7days' ? 'Last 7 Days' : range === '30days' ? 'Last 30 Days' : range === '90days' ? 'Last 90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total RFQs</p>
              <p className="text-3xl font-bold mt-2" style={{ color: '#535554' }}>
                {loading ? '...' : analytics.totalRFQs}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Approval Rate</p>
              <p className="text-3xl font-bold mt-2 text-green-600">
                {loading ? '...' : analytics.approvalRate}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg Days to Response</p>
              <p className="text-3xl font-bold mt-2 text-purple-600">
                {loading ? '...' : analytics.avgTimeToResponse}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Spam Detection</p>
              <p className="text-3xl font-bold mt-2 text-orange-600">
                {loading ? '...' : analytics.spamDetectionAccuracy}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-100">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Breakdown */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#535554' }}>Pending Status Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">Awaiting Initial Review</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '...' : analytics.pendingByStatus.pending || 0}</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">Needs Verification</p>
            <p className="text-2xl font-bold text-yellow-600 mt-2">{loading ? '...' : analytics.pendingByStatus.needs_verification || 0}</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">Needs Review</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">{loading ? '...' : analytics.pendingByStatus.needs_review || 0}</p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600">Needs Fix</p>
            <p className="text-2xl font-bold text-red-600 mt-2">{loading ? '...' : analytics.pendingByStatus.needs_fix || 0}</p>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#535554' }}>Top Categories by RFQ Volume</h2>
        <div className="space-y-3">
          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : analytics.categoryPerformance.length === 0 ? (
            <p className="text-gray-600">No data available</p>
          ) : (
            analytics.categoryPerformance.map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{cat.name}</p>
                  <p className="text-sm text-gray-600">{cat.responses} responses from {cat.total} RFQs</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{cat.responseRate}%</p>
                  <p className="text-xs text-gray-500">response rate</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* County Hotspots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#535554' }}>Geographic Hotspots</h2>
          <div className="space-y-2">
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : analytics.countyHotspots.length === 0 ? (
              <p className="text-gray-600">No data available</p>
            ) : (
              analytics.countyHotspots.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2">
                  <p className="text-gray-900 font-medium">{item.county}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(item.count / (analytics.countyHotspots[0]?.count || 1)) * 100}%`,
                          backgroundColor: '#ea8f1e',
                        }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 w-12 text-right">{item.count}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Budget Distribution */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#535554' }}>Budget Distribution</h2>
          <div className="space-y-2">
            {loading ? (
              <p className="text-gray-600">Loading...</p>
            ) : analytics.budgetDistribution.length === 0 ? (
              <p className="text-gray-600">No data available</p>
            ) : (
              analytics.budgetDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2">
                  <p className="text-gray-900 font-medium text-sm">{item.range}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: '#10b981',
                        }}
                      />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 w-12 text-right">{item.percentage}%</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Responding Vendors */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: '#535554' }}>Top Responding Vendors</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vendor ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Requests</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Responses</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Response Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-600">Loading...</td></tr>
              ) : analytics.vendorResponseRates.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-600">No vendor data available</td></tr>
              ) : (
                analytics.vendorResponseRates.map((vendor, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{vendor.vendorId.slice(0, 8)}...</td>
                    <td className="px-4 py-3 text-gray-900">{vendor.requests}</td>
                    <td className="px-4 py-3 text-gray-900">{vendor.responses}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-semibold">
                        {vendor.responseRate}%
                      </span>
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
