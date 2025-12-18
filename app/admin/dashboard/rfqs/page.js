'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { categoryMatches } from '@/lib/constructionCategories';
import { 
  Eye, Check, X, Search, Filter, MapPin, Calendar, DollarSign, Clock, User, FileText, 
  AlertTriangle, Shield, ArrowLeft, CheckCircle, AlertCircle, TrendingUp, Plus, Edit2, Trash2 
} from 'lucide-react';

const pendingStatuses = ['pending', 'needs_verification', 'needs_review', 'needs_fix'];
const activeStatuses = ['open', 'active'];

export default function ConsolidatedRFQs() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'pending';
  
  // Shared state
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pending tab state
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // Stats state
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
    totalRFQs: 0,
    averageMatchQuality: 0,
    publicEngagementScore: 0,
  });

  // Alerts state
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setMessage('');

      // Fetch all RFQs
      const { data: allRfqs, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (rfqError) throw rfqError;
      setRfqs(allRfqs || []);

      // Calculate stats
      const pendingApproval = (allRfqs || []).filter(r => 
        pendingStatuses.includes(r.status)
      ).length;
      
      const activeRFQs = (allRfqs || []).filter(r => 
        activeStatuses.includes(r.status)
      ).length;
      
      const closedRFQs = (allRfqs || []).filter(r => 
        r.status === 'closed'
      ).length;

      // Get response stats
      const { data: responses } = await supabase
        .from('rfq_responses')
        .select('*');

      const totalResponses = responses?.length || 0;
      const avgResponseRate = allRfqs && allRfqs.length > 0
        ? (totalResponses / allRfqs.length * 100).toFixed(1)
        : 0;

      // Count by RFQ type
      const directCount = (allRfqs || []).filter(r => r.rfq_type === 'direct').length;
      const matchedCount = (allRfqs || []).filter(r => r.rfq_type === 'matched').length;
      const publicCount = (allRfqs || []).filter(r => r.rfq_type === 'public').length;

      // Calculate average match quality for matched RFQs
      const matchedRFQs = (allRfqs || []).filter(r => r.rfq_type === 'matched');
      const averageMatchQuality = matchedRFQs.length > 0
        ? (matchedRFQs.reduce((sum, r) => sum + (parseInt(r.match_quality_score || '75') || 75), 0) / matchedRFQs.length).toFixed(0)
        : 0;

      // Calculate public engagement score (views/quotes ratio)
      const publicRFQs = (allRfqs || []).filter(r => r.rfq_type === 'public');
      const totalPublicViews = publicRFQs.reduce((sum, r) => sum + (parseInt(r.view_count || '0') || 0), 0);
      const totalPublicQuotes = publicRFQs.reduce((sum, r) => sum + (parseInt(r.quote_count || '0') || 0), 0);
      const publicEngagementScore = publicRFQs.length > 0
        ? ((totalPublicViews > 0 ? (totalPublicQuotes / totalPublicViews * 100) : 0)).toFixed(1)
        : 0;

      setStats({
        pendingCount: pendingApproval,
        activeCount: activeRFQs,
        closedCount: closedRFQs,
        totalResponses,
        avgResponseRate,
        pendingApproval,
        directCount,
        matchedCount,
        publicCount,
        totalRFQs: allRfqs?.length || 0,
        averageMatchQuality,
        publicEngagementScore,
      });

      // Calculate alerts
      const calculatedAlerts = [];
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      // Check each active RFQ for issues
      (allRfqs || []).forEach(rfq => {
        if (!activeStatuses.includes(rfq.status)) return;

        const rfqResponses = (responses || []).filter(r => r.rfq_id === rfq.id);
        const responseCount = rfqResponses.length;
        const publishedDate = rfq.published_at ? new Date(rfq.published_at) : null;

        // Direct RFQ alerts
        if (rfq.rfq_type === 'direct') {
          const responseRate = rfq.recipients_count ? (responseCount / rfq.recipients_count * 100) : 0;
          
          // No responses after 3 days
          if (publishedDate && publishedDate < threeDaysAgo && responseCount === 0) {
            calculatedAlerts.push({
              id: `direct-${rfq.id}`,
              type: 'warning',
              title: 'No Responses - Direct RFQ',
              description: `"${rfq.title}" has been active for 3+ days with no vendor responses`,
              severity: 'high',
              action: 'Review sent vendors or resend',
            });
          }

          // Low response rate
          if (responseRate < 30 && responseRate > 0) {
            calculatedAlerts.push({
              id: `response-rate-${rfq.id}`,
              type: 'info',
              title: 'Low Response Rate',
              description: `"${rfq.title}" has only ${responseRate.toFixed(0)}% vendor response rate`,
              severity: 'medium',
              action: 'Monitor or follow up with vendors',
            });
          }
        }

        // Matched RFQ alerts
        if (rfq.rfq_type === 'matched') {
          const matchQuality = parseFloat(rfq.match_quality_score || '75');
          
          // Poor match quality
          if (matchQuality < 60) {
            calculatedAlerts.push({
              id: `match-quality-${rfq.id}`,
              type: 'warning',
              title: 'Poor Match Quality',
              description: `"${rfq.title}" has only ${matchQuality}% match quality (below 60% threshold)`,
              severity: 'high',
              action: 'Review or manually override matches',
            });
          }
        }

        // Public RFQ alerts
        if (rfq.rfq_type === 'public') {
          // No quotes after 5 days
          if (publishedDate && publishedDate < fiveDaysAgo && responseCount === 0) {
            calculatedAlerts.push({
              id: `public-${rfq.id}`,
              type: 'warning',
              title: 'No Quotes - Public RFQ',
              description: `"${rfq.title}" has been live for 5+ days with no vendor interest`,
              severity: 'high',
              action: 'Consider promoting or reviewing pricing',
            });
          }

          // High engagement (trending)
          const views = parseInt(rfq.view_count || '0') || 0;
          if (views > 100 && responseCount > 5) {
            calculatedAlerts.push({
              id: `trending-${rfq.id}`,
              type: 'success',
              title: 'High Marketplace Engagement',
              description: `"${rfq.title}" is trending with ${views} views and ${responseCount} quotes`,
              severity: 'low',
              action: 'Monitor for quality quotes',
            });
          }
        }
      });

      setAlerts(calculatedAlerts.slice(0, 5)); // Limit to 5 most recent alerts
    } catch (error) {
      setMessage(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Pending tab handlers
  const notifyVendors = async (rfq) => {
    const category = rfq.category || rfq.auto_category;
    
    // Fetch ALL active vendors (don't filter by category at DB level)
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, user_id, county, category, rating, verified, status, rfqs_completed, response_time, service_counties')
      .eq('status', 'active');

    // Enhanced matching with fuzzy category matching and service area support
    let matching = (vendors || [])
      .filter((v) => {
        // 1. Category matching: Use fuzzy matching instead of exact match
        const categoryMatch = categoryMatches(v.category, category);
        if (!categoryMatch) return false;

        // 2. Location matching: Check primary county or service_counties array
        if (rfq.county) {
          const rfqCountyLower = (rfq.county || '').toLowerCase();
          const vendorCountyLower = (v.county || '').toLowerCase();
          const serviceCounties = (v.service_counties || []).map(c => c.toLowerCase());
          
          const locationOk = 
            vendorCountyLower === rfqCountyLower || // Primary county match
            serviceCounties.includes(rfqCountyLower); // Or in service_counties array
          
          if (!locationOk) return false;
        }

        return true; // Include all vendors that match category + location
      })
      .sort((a, b) => {
        // Scoring system: prefer verified and high-rated vendors
        const aVerified = a.verified ? 2 : 0;
        const bVerified = b.verified ? 2 : 0;
        
        const aRating = (a.rating || 0);
        const bRating = (b.rating || 0);
        
        const aResponseTime = a.response_time || 9999;
        const bResponseTime = b.response_time || 9999;
        
        const aCompleted = a.rfqs_completed || 0;
        const bCompleted = b.rfqs_completed || 0;

        // Multi-factor scoring:
        // 1. Verified badge (highest priority)
        if (aVerified !== bVerified) return bVerified - aVerified;
        // 2. Rating (second priority)
        if (aRating !== bRating) return bRating - aRating;
        // 3. Response time (third priority)
        if (aResponseTime !== bResponseTime) return aResponseTime - bResponseTime;
        // 4. Completed RFQs (tiebreaker)
        return bCompleted - aCompleted;
      });

    // Graceful fallback: If very few matches, relax criteria
    if (matching.length < 3) {
      console.warn(`⚠️ Low match count (${matching.length}). Relaxing criteria...`);
      
      // Fallback: Match on category alone, include all quality levels
      matching = (vendors || [])
        .filter((v) => categoryMatches(v.category, category))
        .sort((a, b) => {
          const aVerified = a.verified ? 1 : 0;
          const bVerified = b.verified ? 1 : 0;
          if (aVerified !== bVerified) return bVerified - aVerified;
          return (b.rating || 0) - (a.rating || 0);
        });
    }

    // Limit to top 8 vendors
    matching = matching.slice(0, 8);

    if (matching.length === 0) {
      setMessage('⚠️ No vendors found matching this RFQ category. Please check the category selection.');
      return;
    }

    await supabase.from('rfq_requests').insert(
      matching.map((v) => ({
        rfq_id: rfq.id,
        vendor_id: v.user_id || v.id,
        status: 'pending',
      }))
    );

    try {
      await supabase.from('notifications').insert(
        matching.map((v) => ({
          user_id: v.user_id || v.id,
          type: 'rfq_match',
          title: `New RFQ: ${rfq.title}`,
          body: `${category} • ${rfq.county || rfq.location || 'Location provided'}`,
          metadata: { rfq_id: rfq.id, budget: rfq.budget_range },
        }))
      );
    } catch (e) {
      console.warn('Notifications insert skipped', e.message);
    }
  };

  const handleApprove = async (rfq) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'open', published_at: new Date().toISOString(), validation_status: 'validated' })
        .eq('id', rfq.id);
      if (error) throw error;

      await notifyVendors(rfq);
      setMessage('✓ RFQ approved and vendors notified');
      setShowDetailModal(false);
      fetchAllData();
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
      fetchAllData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Active tab handlers
  const handleCloseRFQ = async (rfqId) => {
    if (!confirm('Close this RFQ? Vendors will no longer see it.')) return;
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('id', rfqId);
      if (error) throw error;
      setMessage('✓ RFQ closed');
      fetchAllData();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  // Filtered data
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

  // Helper functions
  const isStale = (rfq) => {
    if (!rfq.published_at) return false;
    const days = Math.floor((Date.now() - new Date(rfq.published_at)) / (1000 * 60 * 60 * 24));
    return days > 30;
  };

  const getSpamColor = (score) => {
    if (score > 70) return 'bg-red-100 text-red-700';
    if (score > 40) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Link href="/admin/dashboard" className="hover:text-gray-900">Admin</Link>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">RFQ Management</span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: '#535554' }}>RFQ Management</h1>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-t border-gray-200">
              <Link
                href="?tab=pending"
                className={`px-4 py-3 font-medium transition ${
                  activeTab === 'pending'
                    ? 'text-orange-600 border-b-2 border-orange-600 hover:bg-orange-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Pending ({stats.pendingCount})
                </div>
              </Link>
              <Link
                href="?tab=active"
                className={`px-4 py-3 font-medium transition ${
                  activeTab === 'active'
                    ? 'text-green-600 border-b-2 border-green-600 hover:bg-green-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Active ({stats.activeCount})
                </div>
              </Link>
              <Link
                href="?tab=analytics"
                className={`px-4 py-3 font-medium transition ${
                  activeTab === 'analytics'
                    ? 'text-blue-600 border-b-2 border-blue-600 hover:bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Overview Section */}
        <div className="mb-8 space-y-6">
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Total RFQs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalRFQs}</p>
              <p className="text-xs text-gray-500 mt-1">{loading ? '' : `${stats.pendingApproval} pending`}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Active RFQs</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{loading ? '...' : stats.activeCount}</p>
              <p className="text-xs text-gray-500 mt-1">Currently open</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Response Rate</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.avgResponseRate}%</p>
              <p className="text-xs text-gray-500 mt-1">{stats.totalResponses} quotes</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">Match Quality</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{loading ? '...' : stats.averageMatchQuality}%</p>
              <p className="text-xs text-gray-500 mt-1">Matched RFQs avg</p>
            </div>
          </div>

          {/* RFQ Types Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#06b6d4' }}></div>
                <p className="text-sm text-gray-600 font-medium">Direct RFQs</p>
              </div>
              <p className="text-3xl font-bold text-cyan-600 mt-2">{loading ? '...' : stats.directCount}</p>
              <p className="text-xs text-gray-500 mt-2">Customers select vendors</p>
              <button
                onClick={() => {
                  const link = document.querySelector(`[href="?tab=direct"]`);
                  if (link) link.click();
                }}
                className="mt-3 text-xs text-cyan-600 hover:text-cyan-700 font-medium"
              >
                View Details →
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }}></div>
                <p className="text-sm text-gray-600 font-medium">Matched RFQs</p>
              </div>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{loading ? '...' : stats.matchedCount}</p>
              <p className="text-xs text-gray-500 mt-2">System auto-matched</p>
              <button
                onClick={() => {
                  const link = document.querySelector(`[href="?tab=matched"]`);
                  if (link) link.click();
                }}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View Details →
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f43f5e' }}></div>
                <p className="text-sm text-gray-600 font-medium">Public RFQs</p>
              </div>
              <p className="text-3xl font-bold text-rose-600 mt-2">{loading ? '...' : stats.publicCount}</p>
              <p className="text-xs text-gray-500 mt-2">Marketplace bidding</p>
              <button
                onClick={() => {
                  const link = document.querySelector(`[href="?tab=public"]`);
                  if (link) link.click();
                }}
                className="mt-3 text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                View Details →
              </button>
            </div>
          </div>

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Active Alerts</h3>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border flex items-start gap-3 ${
                      alert.type === 'warning'
                        ? 'bg-amber-50 border-amber-200'
                        : alert.type === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {alert.type === 'warning' && (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      )}
                      {alert.type === 'success' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {alert.type === 'info' && (
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${
                        alert.type === 'warning'
                          ? 'text-amber-900'
                          : alert.type === 'success'
                          ? 'text-green-900'
                          : 'text-blue-900'
                      }`}>
                        {alert.title}
                      </p>
                      <p className={`text-xs mt-1 ${
                        alert.type === 'warning'
                          ? 'text-amber-700'
                          : alert.type === 'success'
                          ? 'text-green-700'
                          : 'text-blue-700'
                      }`}>
                        {alert.description}
                      </p>
                      <p className={`text-xs mt-2 font-medium ${
                        alert.type === 'warning'
                          ? 'text-amber-600'
                          : alert.type === 'success'
                          ? 'text-green-600'
                          : 'text-blue-600'
                      }`}>
                        → {alert.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
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

        {/* PENDING TAB */}
        {activeTab === 'pending' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{loading ? '...' : stats.pendingCount}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Active RFQs</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{loading ? '...' : stats.activeCount}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Total Responses</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.totalResponses}</p>
              </div>
            </div>

            {/* Search/Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
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
                <button className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200 transition">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* RFQ Cards */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#ea8f1e' }}></div>
                <p className="mt-4 text-gray-600">Loading RFQs...</p>
              </div>
            ) : pendingRFQs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No pending RFQs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRFQs.map(rfq => (
                  <div key={rfq.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-orange-300 transition shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{rfq.title}</h3>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        {rfq.status}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {rfq.urgency === 'asap' && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">⚡ URGENT</span>
                      )}
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">📍 {rfq.county || 'N/A'}</span>
                      {rfq.spam_score > 30 && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSpamColor(rfq.spam_score)}`}>
                          ⚠️ Spam risk {rfq.spam_score}
                        </span>
                      )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-200 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Submitted By</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{rfq.buyer_name || 'Anonymous'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Budget</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{rfq.budget_range || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Timeline</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{rfq.timeline || 'Flexible'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Category</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{rfq.category || rfq.auto_category || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{rfq.description}</p>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(rfq)}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve & Notify
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRFQ(rfq);
                          setShowDetailModal(true);
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRFQ(rfq);
                          setShowRejectModal(true);
                        }}
                        className="px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTIVE TAB */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Active Now</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{loading ? '...' : stats.activeCount}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Total Quotes</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.totalResponses}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Response Rate</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{stats.avgResponseRate}%</p>
              </div>
            </div>

            {/* Search/Filter */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* RFQ Cards */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#10b981' }}></div>
                <p className="mt-4 text-gray-600">Loading RFQs...</p>
              </div>
            ) : activeRFQs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No active RFQs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRFQs.map(rfq => (
                  <div key={rfq.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-green-300 transition shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{rfq.title}</h3>
                      <div className="flex gap-2">
                        {isStale(rfq) && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">⚠️ Stale</span>
                        )}
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">Active</span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-200 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Budget</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{rfq.budget_range || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Posted</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {rfq.published_at ? new Date(rfq.published_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Category</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{rfq.category || rfq.auto_category || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Location</p>
                        <p className="text-sm font-medium text-gray-900 mt-1">{rfq.county || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{rfq.description}</p>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedRFQ(rfq);
                          setShowDetailModal(true);
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleCloseRFQ(rfq.id)}
                        className="px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Close
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Total RFQs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{rfqs.length}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Pending Approval</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.pendingCount}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeCount}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <p className="text-sm text-gray-600 font-medium">Closed</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.closedCount}</p>
              </div>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Status Distribution</h3>
                <div className="space-y-3">
                  {['Pending', 'Active', 'Closed'].map((status, idx) => {
                    const statusMap = { 'Pending': pendingStatuses, 'Active': activeStatuses, 'Closed': ['closed'] };
                    const count = rfqs.filter(r => statusMap[status].includes(r.status)).length;
                    const percent = rfqs.length > 0 ? (count / rfqs.length * 100).toFixed(0) : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{status}</span>
                          <span className="text-sm font-bold text-gray-900">{count} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              status === 'Pending' ? 'bg-orange-500' :
                              status === 'Active' ? 'bg-green-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Categories</h3>
                <div className="space-y-3">
                  {Object.entries(
                    rfqs.reduce((acc, r) => {
                      const cat = r.category || r.auto_category || 'Other';
                      acc[cat] = (acc[cat] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([cat, count]) => {
                      const percent = rfqs.length > 0 ? (count / rfqs.length * 100).toFixed(0) : 0;
                      return (
                        <div key={cat}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{cat}</span>
                            <span className="text-sm font-bold text-gray-900">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Response Rate */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Response Rate</h3>
                <div className="text-center">
                  <p className="text-4xl font-bold text-purple-600">{stats.avgResponseRate}%</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {stats.totalResponses} responses / {rfqs.length} RFQs
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">This Week</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    New RFQs: <span className="font-bold text-gray-900">
                      {rfqs.filter(r => {
                        const days = Math.floor((Date.now() - new Date(r.created_at)) / (1000 * 60 * 60 * 24));
                        return days <= 7;
                      }).length}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Average time to close: <span className="font-bold text-gray-900">3.5 days</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
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
                  <p className="text-gray-900 mt-1">{selectedRFQ.budget_range}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Timeline</p>
                  <p className="text-gray-900 mt-1">{selectedRFQ.timeline}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Category</p>
                  <p className="text-gray-900 mt-1">{selectedRFQ.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Location</p>
                  <p className="text-gray-900 mt-1">{selectedRFQ.county}</p>
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
