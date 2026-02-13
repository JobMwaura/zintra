'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Download,
  Plus,
  Zap,
  Globe,
  Send,
  ShieldCheck,
  XCircle,
  Star,
  MapPin
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const statusColors = {
  'submitted': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Submitted' },
  'pending_approval': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Pending Approval' },
  'needs_admin_review': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: '🚨 Needs Manual Match' },
  'approved': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Approved' },
  'in_review': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'In Review' },
  'assigned': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: 'Assigned' },
  'completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Completed' },
  'cancelled': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Cancelled' },
  'expired': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', label: 'Expired' }
};

const typeIcons = {
  wizard: Zap,
  public: Globe,
  direct: Send,
  'vendor-request': Send,
};

const typeLabels = {
  wizard: 'Wizard (Auto-Matched)',
  public: 'Public (Marketplace)',
  direct: 'Direct',
  'vendor-request': 'Vendor Request',
};

export default function AdminRFQs() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState([]);
  const [filteredRfqs, setFilteredRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [stats, setStats] = useState({
    total_rfqs: 0,
    pending_approval: 0,
    needs_admin_review: 0,
    wizard_count: 0,
    public_count: 0,
    completed: 0,
    revenue: 0
  });

  const [selectedRfqs, setSelectedRfqs] = useState(new Set());
  const [expandedRfq, setExpandedRfq] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionData, setActionData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Manual Match Modal state
  const [showManualMatchModal, setShowManualMatchModal] = useState(false);
  const [manualMatchRfq, setManualMatchRfq] = useState(null);
  const [vendorSearchTerm, setVendorSearchTerm] = useState('');
  const [vendorSearchResults, setVendorSearchResults] = useState([]);
  const [selectedVendorIds, setSelectedVendorIds] = useState(new Set());
  const [vendorSearchLoading, setVendorSearchLoading] = useState(false);
  const [manualMatchLoading, setManualMatchLoading] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchRFQs();
    }
  }, [isAdmin]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterStatus, filterType, sortBy, rfqs]);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      if (!userRole || userRole.role !== 'admin') {
        setError('Admin access required');
        setIsAdmin(false);
        return;
      }

      setIsAdmin(true);
    } catch (err) {
      console.error('Error checking admin access:', err);
      setError('Authentication error');
    }
  };

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();

      const token = session.access_token;
      const rfqRes = await fetch('/api/admin/rfqs?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!rfqRes.ok) {
        throw new Error('Failed to fetch RFQs');
      }

      const rfqData = await rfqRes.json();
      setRfqs(rfqData.rfqs || []);

      setStats({
        total_rfqs: rfqData.rfqs?.length || 0,
        pending_approval: rfqData.summary?.total_pending_approval || rfqData.rfqs?.filter(r => r.status === 'pending_approval').length || 0,
        needs_admin_review: rfqData.summary?.total_needs_admin_review || rfqData.rfqs?.filter(r => r.status === 'needs_admin_review').length || 0,
        wizard_count: rfqData.summary?.total_wizard || rfqData.rfqs?.filter(r => r.type === 'wizard').length || 0,
        public_count: rfqData.summary?.total_public || rfqData.rfqs?.filter(r => r.type === 'public').length || 0,
        completed: rfqData.rfqs?.filter(r => r.status === 'completed').length || 0,
        revenue: rfqData.summary?.revenue_from_paid_rfqs || 0
      });
    } catch (err) {
      console.error('Error fetching RFQs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...rfqs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rfq =>
        (rfq.title || '').toLowerCase().includes(term) ||
        (rfq.description || '').toLowerCase().includes(term) ||
        (rfq.category || '').toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(rfq => rfq.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(rfq => rfq.type === filterType);
    }

    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'most_responses':
        filtered.sort((a, b) => (b.response_count || 0) - (a.response_count || 0));
        break;
      case 'most_vendors':
        filtered.sort((a, b) => (b.recipient_count || 0) - (a.recipient_count || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    setFilteredRfqs(filtered);
  }, [rfqs, searchTerm, filterStatus, filterType, sortBy]);

  const handleSelectRfq = (rfqId) => {
    const newSelected = new Set(selectedRfqs);
    if (newSelected.has(rfqId)) {
      newSelected.delete(rfqId);
    } else {
      newSelected.add(rfqId);
    }
    setSelectedRfqs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRfqs.size === filteredRfqs.length) {
      setSelectedRfqs(new Set());
    } else {
      setSelectedRfqs(new Set(filteredRfqs.map(r => r.id)));
    }
  };

  const handleAction = async (rfqId, action, reason = '') => {
    try {
      setActionLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/admin/rfqs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          rfq_id: rfqId,
          action: action,
          reason: reason
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update RFQ');
      }

      setSuccessMsg(result.message || `RFQ ${action}d successfully`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setShowActionModal(false);
      setActionData(null);
      fetchRFQs();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleExpanded = (rfqId) => {
    setExpandedRfq(expandedRfq === rfqId ? null : rfqId);
  };

  // ── Vendor search for Manual Match modal ──
  const searchVendors = async (query) => {
    if (!query || query.length < 2) {
      setVendorSearchResults([]);
      return;
    }
    setVendorSearchLoading(true);
    try {
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('id, company_name, primary_category_slug, county, rating, email, verified, is_verified')
        .or(`company_name.ilike.%${query}%,primary_category_slug.ilike.%${query}%,county.ilike.%${query}%,email.ilike.%${query}%`)
        .in('status', ['active', 'approved'])
        .order('rating', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Vendor search error:', error);
        // Fallback without status filter
        const { data: fb } = await supabase
          .from('vendors')
          .select('id, company_name, primary_category_slug, county, rating, email, verified, is_verified')
          .or(`company_name.ilike.%${query}%,primary_category_slug.ilike.%${query}%,county.ilike.%${query}%`)
          .limit(20);
        setVendorSearchResults(fb || []);
      } else {
        setVendorSearchResults(vendors || []);
      }
    } catch (err) {
      console.error('Vendor search error:', err);
    } finally {
      setVendorSearchLoading(false);
    }
  };

  // Also load vendors by RFQ's category when opening modal
  const loadCategoryVendors = async (rfq) => {
    setVendorSearchLoading(true);
    try {
      const catSlug = rfq.category_slug || rfq.category || '';
      const county = rfq.county || '';
      let query = supabase
        .from('vendors')
        .select('id, company_name, primary_category_slug, county, rating, email, verified, is_verified')
        .in('status', ['active', 'approved'])
        .order('rating', { ascending: false })
        .limit(30);

      if (catSlug) {
        query = query.or(`primary_category_slug.ilike.%${catSlug}%,category.ilike.%${catSlug}%`);
      }

      const { data, error } = await query;
      if (!error && data?.length) {
        setVendorSearchResults(data);
      } else {
        // Broader query — just all vendors
        const { data: all } = await supabase
          .from('vendors')
          .select('id, company_name, primary_category_slug, county, rating, email, verified, is_verified')
          .order('rating', { ascending: false })
          .limit(30);
        setVendorSearchResults(all || []);
      }
    } catch (err) {
      console.error('Category vendor load error:', err);
    } finally {
      setVendorSearchLoading(false);
    }
  };

  const openManualMatchModal = (rfq) => {
    setManualMatchRfq(rfq);
    setSelectedVendorIds(new Set());
    setVendorSearchTerm('');
    setShowManualMatchModal(true);
    loadCategoryVendors(rfq);
  };

  const toggleVendorSelection = (vendorId) => {
    const newSet = new Set(selectedVendorIds);
    if (newSet.has(vendorId)) {
      newSet.delete(vendorId);
    } else {
      newSet.add(vendorId);
    }
    setSelectedVendorIds(newSet);
  };

  const handleManualMatch = async () => {
    if (!manualMatchRfq || selectedVendorIds.size === 0) return;
    setManualMatchLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/rfqs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          rfq_id: manualMatchRfq.id,
          action: 'manual_match',
          vendor_ids: [...selectedVendorIds],
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to match vendors');

      setSuccessMsg(`✅ Manually matched ${result.vendorCount} vendor(s) to "${manualMatchRfq.title}". User has been notified.`);
      setTimeout(() => setSuccessMsg(''), 8000);
      setShowManualMatchModal(false);
      setManualMatchRfq(null);
      setSelectedVendorIds(new Set());
      fetchRFQs();
    } catch (err) {
      setError(err.message);
    } finally {
      setManualMatchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RFQ Management...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">{error || 'You do not have permission to access this page.'}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">RFQ Management</h1>
              <p className="text-gray-600 mt-2">Monitor wizard auto-matches &amp; approve public RFQs</p>
            </div>
            <button
              onClick={fetchRFQs}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} />
              {successMsg}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-slate-500">
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-slate-700">{stats.total_rfqs}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-amber-500">
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">⏳ Pending Approval</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending_approval}</p>
          </div>
          <div className={`bg-white rounded-lg shadow-md p-5 border-l-4 ${stats.needs_admin_review > 0 ? 'border-red-500 ring-2 ring-red-200 animate-pulse' : 'border-red-300'}`}>
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">🚨 Needs Match</p>
            <p className={`text-2xl font-bold ${stats.needs_admin_review > 0 ? 'text-red-600' : 'text-red-300'}`}>{stats.needs_admin_review}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-violet-500">
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">⚡ Wizard</p>
            <p className="text-2xl font-bold text-violet-600">{stats.wizard_count}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500">
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">🌐 Public</p>
            <p className="text-2xl font-bold text-blue-600">{stats.public_count}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500">
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">✅ Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-emerald-500">
            <p className="text-gray-500 text-xs mb-1 uppercase tracking-wider">Revenue</p>
            <p className="text-2xl font-bold text-emerald-600">KES {(stats.revenue / 1000).toFixed(0)}K</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search RFQs by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Status</option>
              <option value="needs_admin_review">🚨 Needs Manual Match</option>
              <option value="pending_approval">⏳ Pending Approval</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Types</option>
              <option value="wizard">⚡ Wizard (Auto-Matched)</option>
              <option value="public">🌐 Public (Marketplace)</option>
              <option value="direct">📨 Direct</option>
              <option value="vendor-request">📩 Vendor Request</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_responses">Most Responses</option>
              <option value="most_vendors">Most Vendors</option>
            </select>
          </div>
        </div>

        {/* RFQ Cards */}
        {filteredRfqs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No RFQs found</p>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRfqs.map((rfq) => {
              const statusColor = statusColors[rfq.status] || statusColors.submitted;
              const TypeIcon = typeIcons[rfq.type] || Send;
              const isExpanded = expandedRfq === rfq.id;
              const isPendingApproval = rfq.status === 'pending_approval';
              const isNeedsAdminReview = rfq.status === 'needs_admin_review';
              const isPublic = rfq.type === 'public';
              const isWizard = rfq.type === 'wizard';

              return (
                <div
                  key={rfq.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden transition-all ${
                    isNeedsAdminReview ? 'ring-2 ring-red-400 border-l-4 border-red-500' :
                    isPendingApproval ? 'ring-2 ring-amber-300' : ''
                  }`}
                >
                  {/* Main Row */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: RFQ Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-1.5 rounded-md ${
                            isWizard ? 'bg-violet-100 text-violet-600' :
                            isPublic ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            <TypeIcon size={16} />
                          </div>
                          <h3 className="font-semibold text-gray-900 truncate">{rfq.title || 'Untitled RFQ'}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                            {statusColor.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="font-medium text-gray-700">{typeLabels[rfq.type] || rfq.type}</span>
                          {rfq.category && <span>📁 {rfq.category}</span>}
                          {rfq.county && <span>📍 {rfq.county}</span>}
                          <span>📅 {new Date(rfq.created_at).toLocaleDateString()}</span>
                          <span title="Vendors matched">
                            👥 {rfq.recipient_count || 0} vendor{(rfq.recipient_count || 0) !== 1 ? 's' : ''}
                          </span>
                          <span title="Quotes received">
                            💬 {rfq.response_count || 0} quote{(rfq.response_count || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Manual Match button for needs_admin_review wizard RFQs */}
                        {isNeedsAdminReview && (
                          <button
                            onClick={() => openManualMatchModal(rfq)}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50 animate-pulse"
                          >
                            <Users size={14} />
                            Manual Match
                          </button>
                        )}

                        {/* Quick Approve button for pending public RFQs */}
                        {isPendingApproval && isPublic && (
                          <button
                            onClick={() => handleAction(rfq.id, 'approve')}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                          >
                            <ShieldCheck size={14} />
                            Approve
                          </button>
                        )}
                        {isPendingApproval && isPublic && (
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) handleAction(rfq.id, 'reject', reason);
                            }}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold transition border border-red-200 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        )}

                        {/* Expand toggle to view matched vendors */}
                        <button
                          onClick={() => toggleExpanded(rfq.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold transition border border-gray-200"
                        >
                          <Users size={14} />
                          Vendors
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {/* More actions */}
                        <button
                          onClick={() => {
                            setActionData(rfq);
                            setShowActionModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="More Actions"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded: Matched Vendors Panel */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5">
                      <h4 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
                        <Users size={16} />
                        {isWizard
                          ? 'Auto-Matched Vendors (Algorithm)'
                          : isPublic
                            ? 'Target Vendors (Pending Approval)'
                            : 'Assigned Vendors'
                        }
                        <span className="text-gray-400 font-normal">({(rfq.recipients || []).length})</span>
                      </h4>

                      {(rfq.recipients || []).length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No vendors matched yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(rfq.recipients || []).map((recipient, idx) => (
                            <div
                              key={`${recipient.vendor_id}-${idx}`}
                              className={`bg-white rounded-lg p-3 border ${
                                recipient.status === 'sent' ? 'border-green-200' :
                                recipient.status === 'pending_approval' ? 'border-amber-200' :
                                recipient.status === 'cancelled' ? 'border-red-200' :
                                'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="font-semibold text-gray-800 text-sm truncate">
                                  {recipient.vendor_name || 'Unknown Vendor'}
                                </p>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  recipient.status === 'sent' ? 'bg-green-100 text-green-700' :
                                  recipient.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                                  recipient.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {recipient.status === 'sent' ? '✓ Sent' :
                                   recipient.status === 'pending_approval' ? '⏳ Pending' :
                                   recipient.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                {recipient.vendor_county && (
                                  <span className="flex items-center gap-0.5">
                                    <MapPin size={10} /> {recipient.vendor_county}
                                  </span>
                                )}
                                {recipient.vendor_rating > 0 && (
                                  <span className="flex items-center gap-0.5">
                                    <Star size={10} className="text-amber-500" /> {parseFloat(recipient.vendor_rating).toFixed(1)}
                                  </span>
                                )}
                                {recipient.match_score && (
                                  <span className="font-semibold text-violet-600">
                                    Score: {recipient.match_score}/100
                                  </span>
                                )}
                                <span className="text-gray-400 capitalize">{recipient.recipient_type}</span>
                              </div>
                              {recipient.match_reasons && Array.isArray(recipient.match_reasons) && recipient.match_reasons.length > 0 && (
                                <p className="mt-1.5 text-xs text-gray-500 italic">
                                  {recipient.match_reasons.join(' · ')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {filteredRfqs.length} of {rfqs.length} RFQs
        </div>
      </div>

      {/* Manual Match Modal */}
      {showManualMatchModal && manualMatchRfq && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manual Vendor Match</h2>
                <p className="text-sm text-gray-500">Algorithm found 0 qualified vendors. Manually assign vendors to this RFQ.</p>
              </div>
            </div>

            {/* RFQ Info */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">{manualMatchRfq.title || 'Untitled RFQ'}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                {manualMatchRfq.category && <span>📁 {manualMatchRfq.category}</span>}
                {manualMatchRfq.county && <span>📍 {manualMatchRfq.county}</span>}
                <span>📅 {new Date(manualMatchRfq.created_at).toLocaleDateString()}</span>
              </div>
              {manualMatchRfq.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{manualMatchRfq.description}</p>
              )}
            </div>

            {/* Vendor Search */}
            <div className="mb-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors by name, category, county, or email..."
                  value={vendorSearchTerm}
                  onChange={(e) => {
                    setVendorSearchTerm(e.target.value);
                    searchVendors(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Selected count */}
            {selectedVendorIds.size > 0 && (
              <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-semibold text-green-700">
                ✅ {selectedVendorIds.size} vendor{selectedVendorIds.size > 1 ? 's' : ''} selected
              </div>
            )}

            {/* Vendor List */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 max-h-72 overflow-y-auto">
              {vendorSearchLoading ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
                  Searching vendors...
                </div>
              ) : vendorSearchResults.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No vendors found. Try a different search term.
                </div>
              ) : (
                vendorSearchResults.map((vendor) => {
                  const isSelected = selectedVendorIds.has(vendor.id);
                  return (
                    <div
                      key={vendor.id}
                      onClick={() => toggleVendorSelection(vendor.id)}
                      className={`flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${
                        isSelected ? 'bg-green-50 border-l-4 border-green-500' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="h-4 w-4 text-green-600 rounded cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {vendor.company_name || 'Unnamed'}
                          {(vendor.verified || vendor.is_verified) && (
                            <span className="ml-1 text-blue-500" title="Verified">✓</span>
                          )}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {vendor.primary_category_slug && (
                            <span className="bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded">{vendor.primary_category_slug}</span>
                          )}
                          {vendor.county && (
                            <span className="flex items-center gap-0.5"><MapPin size={10} /> {vendor.county}</span>
                          )}
                          {vendor.rating > 0 && (
                            <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-500" /> {parseFloat(vendor.rating).toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setShowManualMatchModal(false); setManualMatchRfq(null); setSelectedVendorIds(new Set()); }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleManualMatch}
                disabled={selectedVendorIds.size === 0 || manualMatchLoading}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {manualMatchLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Matching...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Match {selectedVendorIds.size} Vendor{selectedVendorIds.size > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && actionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">RFQ Actions</h2>
            <p className="text-sm text-gray-500 mb-4 truncate">{actionData.title}</p>

            <div className="space-y-2 mb-6">
              {/* Manual Match for needs_admin_review */}
              {actionData.status === 'needs_admin_review' && (
                <button
                  onClick={() => { setShowActionModal(false); openManualMatchModal(actionData); }}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-lg border-2 border-red-300 text-red-700 font-semibold transition flex items-center gap-2"
                >
                  <Users size={18} /> 🚨 Manual Match Vendors (Algorithm Failed)
                </button>
              )}
              {actionData.status === 'pending_approval' && actionData.type === 'public' && (
                <button
                  onClick={() => handleAction(actionData.id, 'approve')}
                  disabled={actionLoading}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-lg border border-green-200 text-green-700 font-semibold transition flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck size={18} /> Approve &amp; Publish to Marketplace
                </button>
              )}
              {actionData.status !== 'approved' && (
                <button
                  onClick={() => handleAction(actionData.id, 'approve')}
                  disabled={actionLoading}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-lg border border-green-200 text-green-700 font-semibold transition disabled:opacity-50"
                >
                  ✓ Approve RFQ
                </button>
              )}
              <button
                onClick={() => {
                  const reason = prompt('Reason for rejection:');
                  if (reason) handleAction(actionData.id, 'reject', reason);
                }}
                disabled={actionLoading}
                className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-lg border border-red-200 text-red-700 font-semibold transition disabled:opacity-50"
              >
                ✕ Reject RFQ
              </button>
              <button
                onClick={() => handleAction(actionData.id, 'mark_completed')}
                disabled={actionLoading}
                className="w-full text-left px-4 py-3 hover:bg-purple-50 rounded-lg border border-purple-200 text-purple-700 font-semibold transition disabled:opacity-50"
              >
                ✓ Mark Completed
              </button>
              <button
                onClick={() => handleAction(actionData.id, 'cancel', 'Cancelled by admin')}
                disabled={actionLoading}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg border border-gray-200 text-gray-700 font-semibold transition disabled:opacity-50"
              >
                ✕ Cancel RFQ
              </button>
            </div>

            <button
              onClick={() => { setShowActionModal(false); setActionData(null); }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
