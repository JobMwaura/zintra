'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { hasActiveAdminAccess } from '@/lib/adminAccess';
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
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Download,
  Plus,
  MapPin,
  Star,
  ShieldCheck
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const statusColors = {
  'submitted': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'pending_approval': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'needs_admin_review': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'approved': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'in_review': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'assigned': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'cancelled': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'expired': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
};

export default function AdminRFQs() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState([]);
  const [filteredRfqs, setFilteredRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [stats, setStats] = useState({
    total_rfqs: 0,
    pending_approval: 0,
    in_review: 0,
    completed: 0,
    revenue: 0
  });

  const [selectedRfqs, setSelectedRfqs] = useState(new Set());
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionData, setActionData] = useState(null);
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
        router.push('/admin/login');
        return;
      }

      setUser(session.user);

      // Check if user is admin
      const { isAdmin } = await hasActiveAdminAccess(supabase, session.user.id);

      if (!isAdmin) {
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
      const { data: { session } } = await supabase.auth.getSession();

      // Fetch RFQs
      const token = session.access_token;
      const rfqRes = await fetch('/api/admin/rfqs?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!rfqRes.ok) {
        throw new Error('Failed to fetch RFQs');
      }

      const rfqData = await rfqRes.json();
      setRfqs(rfqData.rfqs || []);

      // Update stats
      setStats({
        total_rfqs: rfqData.pagination?.total || rfqData.rfqs?.length || 0,
        pending_approval: rfqData.summary?.total_pending_approval || rfqData.summary?.total_pending || 0,
        in_review: rfqData.summary?.total_needs_admin_review || rfqData.rfqs?.filter(r => r.status === 'in_review').length || 0,
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

  const applyFilters = () => {
    let filtered = [...rfqs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(rfq =>
        rfq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(rfq => rfq.status === filterStatus);
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(rfq => rfq.type === filterType);
    }

    // Sorting
    switch (sortBy) {
      case 'oldest':
        filtered = filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'most_responses':
        filtered = filtered.sort((a, b) => (b.response_count || 0) - (a.response_count || 0));
        break;
      case 'newest':
      default:
        filtered = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    setFilteredRfqs(filtered);
  };

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

  const handleAction = async (rfqId, action, reason = '', assignedVendorId = null) => {
    try {
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
          reason: reason,
          assigned_vendor_id: assignedVendorId,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update RFQ');
      }

      setShowActionModal(false);
      setActionData(null);
      fetchRFQs();
    } catch (err) {
      setError(err.message);
    }
  };

  const searchVendors = async (term = '', rfq = manualMatchRfq) => {
    try {
      setVendorSearchLoading(true);

      let query = supabase
        .from('vendors')
        .select('id, company_name, county, rating, primary_category_slug, category, verified, is_verified')
        .limit(40);

      if (term.trim()) {
        query = query.or(
          `company_name.ilike.%${term}%,county.ilike.%${term}%,primary_category_slug.ilike.%${term}%,category.ilike.%${term}%`
        );
      }

      const { data, error: vendorError } = await query;

      if (vendorError) {
        throw vendorError;
      }

      const rfqCategory = String(rfq?.category_slug || rfq?.category || '').toLowerCase();
      const filtered = (data || []).filter((vendor) => {
        if (!rfqCategory) return true;

        const vendorCategory = String(vendor.primary_category_slug || vendor.category || '').toLowerCase();
        return vendorCategory.includes(rfqCategory) || rfqCategory.includes(vendorCategory);
      });

      setVendorSearchResults(filtered);
    } catch (err) {
      setError(err.message || 'Failed to load vendors');
    } finally {
      setVendorSearchLoading(false);
    }
  };

  const openManualMatchModal = (rfq) => {
    setManualMatchRfq(rfq);
    setVendorSearchTerm('');
    setSelectedVendorIds(new Set());
    setShowActionModal(false);
    setShowManualMatchModal(true);
    searchVendors('', rfq);
  };

  const toggleVendorSelection = (vendorId) => {
    const nextSelected = new Set(selectedVendorIds);
    if (nextSelected.has(vendorId)) {
      nextSelected.delete(vendorId);
    } else {
      nextSelected.add(vendorId);
    }
    setSelectedVendorIds(nextSelected);
  };

  const handleManualMatch = async () => {
    if (!manualMatchRfq || selectedVendorIds.size === 0) {
      return;
    }

    try {
      setManualMatchLoading(true);
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
          vendor_ids: Array.from(selectedVendorIds),
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to match vendors');
      }

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RFQs...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-6">{error || 'You do not have permission to access this page.'}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">RFQ Management</h1>
              <p className="text-gray-600 mt-2">Admin dashboard for all requests for quotation</p>
            </div>
            <button
              onClick={fetchRFQs}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total RFQs</p>
                <p className="text-3xl font-bold text-indigo-600">{stats.total_rfqs}</p>
              </div>
              <BarChart3 size={32} className="text-indigo-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending Approval</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending_approval}</p>
              </div>
              <Clock size={32} className="text-orange-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">In Review</p>
                <p className="text-3xl font-bold text-purple-600">{stats.in_review}</p>
              </div>
              <TrendingUp size={32} className="text-purple-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle size={32} className="text-green-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Revenue</p>
                <p className="text-3xl font-bold text-blue-600">KES {(stats.revenue / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign size={32} className="text-blue-200" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search RFQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="needs_admin_review">Needs Manual Match</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="direct">Direct</option>
              <option value="wizard">Wizard</option>
              <option value="public">Public</option>
              <option value="vendor-request">Vendor Request</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_responses">Most Responses</option>
            </select>
          </div>
        </div>

        {/* RFQ Table */}
        {filteredRfqs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No RFQs found</p>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRfqs.size === filteredRfqs.length && filteredRfqs.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Responses</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRfqs.map((rfq) => {
                    const statusColor = statusColors[rfq.status];

                    return (
                      <tr key={rfq.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedRfqs.has(rfq.id)}
                            onChange={() => handleSelectRfq(rfq.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900 truncate">{rfq.title}</p>
                            <p className="text-sm text-gray-500 truncate">{rfq.category}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900 capitalize">
                            {rfq.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor?.bg} ${statusColor?.text}`}>
                            {rfq.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-900">{rfq.response_count || 0}</span>
                            <span className="text-sm text-gray-500">quote{(rfq.response_count || 0) !== 1 ? 's' : ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(rfq.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {rfq.status === 'needs_admin_review' && (
                              <button
                                onClick={() => openManualMatchModal(rfq)}
                                className="text-red-600 hover:text-red-700 font-semibold"
                                title="Manual Match"
                              >
                                <Users size={18} />
                              </button>
                            )}
                            {rfq.status === 'pending_approval' && rfq.type === 'public' && (
                              <button
                                onClick={() => handleAction(rfq.id, 'approve')}
                                className="text-green-600 hover:text-green-700 font-semibold"
                                title="Approve Public RFQ"
                              >
                                <ShieldCheck size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/rfq/${rfq.id}`)}
                              className="text-indigo-600 hover:text-indigo-700 font-semibold"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setActionData(rfq);
                                setShowActionModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 font-semibold"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredRfqs.length}</span> of{' '}
                <span className="font-semibold">{stats.total_rfqs}</span> RFQs
              </p>
              <button className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-1">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && actionData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">RFQ Actions</h2>

            <div className="space-y-2 mb-6">
              {actionData.status === 'needs_admin_review' && (
                <button
                  onClick={() => openManualMatchModal(actionData)}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-lg border border-red-200 text-red-700 font-semibold transition"
                >
                  Manual Match Vendors
                </button>
              )}
              {actionData.status === 'pending_approval' && actionData.type === 'public' && (
                <button
                  onClick={() => handleAction(actionData.id, 'approve')}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-lg border border-green-200 text-green-700 font-semibold transition"
                >
                  Approve & Publish to Marketplace
                </button>
              )}
              <button
                onClick={() => handleAction(actionData.id, 'approve')}
                className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-lg border border-green-200 text-green-700 font-semibold transition"
              >
                ✓ Approve RFQ
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Reason for rejection:');
                  if (reason) handleAction(actionData.id, 'reject', reason);
                }}
                className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-lg border border-red-200 text-red-700 font-semibold transition"
              >
                ✕ Reject RFQ
              </button>
              <button
                onClick={() => {
                  // Show vendor selection UI - simplified for demo
                  const vendorId = prompt('Enter vendor ID to assign:');
                  if (vendorId) handleAction(actionData.id, 'assign_vendor', '', vendorId);
                }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg border border-blue-200 text-blue-700 font-semibold transition"
              >
                → Assign to Vendor
              </button>
              <button
                onClick={() => handleAction(actionData.id, 'mark_completed')}
                className="w-full text-left px-4 py-3 hover:bg-purple-50 rounded-lg border border-purple-200 text-purple-700 font-semibold transition"
              >
                ✓ Mark Completed
              </button>
            </div>

            <button
              onClick={() => setShowActionModal(false)}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showManualMatchModal && manualMatchRfq && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manual Vendor Match</h2>
                <p className="text-sm text-gray-500">Select vendors to attach to this RFQ.</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">{manualMatchRfq.title || 'Untitled RFQ'}</h3>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                {manualMatchRfq.category && <span>{manualMatchRfq.category}</span>}
                {manualMatchRfq.county && <span>{manualMatchRfq.county}</span>}
                <span>{new Date(manualMatchRfq.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendors by name, category, or county..."
                  value={vendorSearchTerm}
                  onChange={(e) => {
                    setVendorSearchTerm(e.target.value);
                    searchVendors(e.target.value, manualMatchRfq);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {selectedVendorIds.size > 0 && (
              <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-semibold text-green-700">
                {selectedVendorIds.size} vendor{selectedVendorIds.size === 1 ? '' : 's'} selected
              </div>
            )}

            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4 max-h-72 overflow-y-auto">
              {vendorSearchLoading ? (
                <div className="p-6 text-center text-gray-500">Loading vendors...</div>
              ) : vendorSearchResults.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No vendors found for this search.</div>
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
                          {vendor.company_name || 'Unnamed vendor'}
                          {(vendor.verified || vendor.is_verified) && (
                            <span className="ml-1 text-blue-500" title="Verified">✓</span>
                          )}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          {(vendor.primary_category_slug || vendor.category) && (
                            <span>{vendor.primary_category_slug || vendor.category}</span>
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

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setShowManualMatchModal(false);
                  setManualMatchRfq(null);
                  setSelectedVendorIds(new Set());
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleManualMatch}
                disabled={selectedVendorIds.size === 0 || manualMatchLoading}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {manualMatchLoading ? 'Matching...' : `Match ${selectedVendorIds.size} Vendor${selectedVendorIds.size === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
