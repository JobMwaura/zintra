'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Search, Filter, MapPin, Star, CheckCircle, AlertTriangle, Eye, X, 
  Mail, Shield, User, Download, MessageSquare, ArrowLeft, TrendingUp,
  AlertCircle, Phone, Building2
} from 'lucide-react';

export default function ConsolidatedVendors() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'pending';

  // Shared state
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [countyFilter, setCountyFilter] = useState('all');

  // Stats
  const [stats, setStats] = useState({
    totalVendors: 0,
    pendingCount: 0,
    activeCount: 0,
    rejectedCount: 0,
    suspendedCount: 0,
  });

  useEffect(() => {
    fetchAllVendors();
  }, []);

  const fetchAllVendors = async () => {
    try {
      setLoading(true);
      setMessage('');
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVendors(data || []);

      // Calculate stats
      const pending = (data || []).filter(v => v.status === 'pending').length;
      const active = (data || []).filter(v => v.status === 'active').length;
      const rejected = (data || []).filter(v => v.status === 'rejected').length;
      const suspended = (data || []).filter(v => v.status === 'suspended').length;

      setStats({
        totalVendors: data?.length || 0,
        pendingCount: pending,
        activeCount: active,
        rejectedCount: rejected,
        suspendedCount: suspended,
      });
    } catch (error) {
      setMessage(`Error loading vendors: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const updateVendorStatus = async (vendorId, status) => {
    try {
      const payload = { status };
      if (status === 'rejected' && rejectReason.trim()) {
        payload.rejection_reason = rejectReason.trim();
      }
      const { error } = await supabase
        .from('vendors')
        .update(payload)
        .eq('id', vendorId);

      if (error) throw error;

      setMessage(`✓ Vendor status updated to ${status}`);
      setShowDetailModal(false);
      setShowRejectModal(false);
      setRejectReason('');
      fetchAllVendors();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleApprove = async (vendorId) => {
    await updateVendorStatus(vendorId, 'active');
  };

  const handleReject = async (vendorId) => {
    if (!rejectReason.trim()) {
      setMessage('Please provide a rejection reason');
      return;
    }
    await updateVendorStatus(vendorId, 'rejected');
  };

  const handleSuspend = async (vendorId) => {
    if (!confirm('Suspend this vendor? They will not be able to respond to RFQs.')) return;
    await updateVendorStatus(vendorId, 'suspended');
  };

  const handleReactivate = async (vendorId) => {
    if (!confirm('Reactivate this vendor?')) return;
    await updateVendorStatus(vendorId, 'active');
  };

  // Filtered vendors
  const pendingVendors = useMemo(() => {
    return (vendors || [])
      .filter(v => v.status === 'pending')
      .filter(v => !searchTerm || v.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || v.category?.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(v => categoryFilter === 'all' || v.category === categoryFilter)
      .filter(v => countyFilter === 'all' || v.county === countyFilter);
  }, [vendors, searchTerm, categoryFilter, countyFilter]);

  const activeVendors = useMemo(() => {
    return (vendors || [])
      .filter(v => v.status === 'active')
      .filter(v => !searchTerm || v.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || v.category?.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(v => categoryFilter === 'all' || v.category === categoryFilter)
      .filter(v => countyFilter === 'all' || v.county === countyFilter);
  }, [vendors, searchTerm, categoryFilter, countyFilter]);

  const rejectedVendors = useMemo(() => {
    return (vendors || [])
      .filter(v => v.status === 'rejected')
      .filter(v => !searchTerm || v.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || v.category?.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(v => categoryFilter === 'all' || v.category === categoryFilter)
      .filter(v => countyFilter === 'all' || v.county === countyFilter);
  }, [vendors, searchTerm, categoryFilter, countyFilter]);

  // Get unique categories and counties
  const categories = useMemo(() => {
    const cats = new Set((vendors || []).map(v => v.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [vendors]);

  const counties = useMemo(() => {
    const cs = new Set((vendors || []).map(v => v.county).filter(Boolean));
    return Array.from(cs).sort();
  }, [vendors]);

  const renderVendorCard = (vendor) => (
    <div key={vendor.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-orange-300 transition shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{vendor.company_name || 'Unnamed'}</h3>
          <p className="text-sm text-gray-600 mt-1">{vendor.category || 'N/A'}</p>
        </div>
        <div className="flex gap-2">
          {vendor.verified && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Verified
            </span>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            vendor.status === 'active' ? 'bg-green-100 text-green-700' :
            vendor.status === 'pending' ? 'bg-orange-100 text-orange-700' :
            vendor.status === 'rejected' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {vendor.status}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-200 mb-4">
        <div>
          <p className="text-xs text-gray-500 font-medium">Location</p>
          <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {vendor.county || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Rating</p>
          <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1">
            {vendor.rating ? (
              <>
                <Star className="w-3 h-3 text-yellow-500" />
                {vendor.rating.toFixed(1)}
              </>
            ) : (
              'No rating'
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">RFQs Completed</p>
          <p className="text-sm font-medium text-gray-900 mt-1">{vendor.rfqs_completed || 0}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Joined</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-600 font-medium mb-2">Contact Information</p>
        <div className="space-y-1 text-sm text-gray-700">
          {vendor.contact_email && (
            <p className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              {vendor.contact_email}
            </p>
          )}
          {vendor.phone && (
            <p className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              {vendor.phone}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {activeTab === 'pending' && (
          <>
            <button
              onClick={() => handleApprove(vendor.id)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => {
                setSelectedVendor(vendor);
                setShowDetailModal(true);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center gap-2 text-sm"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => {
                setSelectedVendor(vendor);
                setShowRejectModal(true);
              }}
              className="px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition text-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}

        {activeTab === 'active' && (
          <>
            <button
              onClick={() => {
                setSelectedVendor(vendor);
                setShowDetailModal(true);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => handleSuspend(vendor.id)}
              className="px-4 py-2 border border-yellow-300 rounded-lg text-yellow-600 hover:bg-yellow-50 transition flex items-center gap-2 text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              Suspend
            </button>
          </>
        )}

        {activeTab === 'rejected' && (
          <>
            <button
              onClick={() => {
                setSelectedVendor(vendor);
                setShowDetailModal(true);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-2 text-sm"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <button
              onClick={() => handleReactivate(vendor.id)}
              className="px-4 py-2 border border-green-300 rounded-lg text-green-600 hover:bg-green-50 transition flex items-center gap-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Reactivate
            </button>
          </>
        )}
      </div>
    </div>
  );

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
                  <span className="text-gray-900 font-medium">Vendor Management</span>
                </div>
                <h1 className="text-2xl font-bold" style={{ color: '#535554' }}>Vendor Management</h1>
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
                href="?tab=rejected"
                className={`px-4 py-3 font-medium transition ${
                  activeTab === 'rejected'
                    ? 'text-red-600 border-b-2 border-red-600 hover:bg-red-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  Rejected ({stats.rejectedCount})
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 font-medium">Total Vendors</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.totalVendors}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 font-medium">Pending</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{loading ? '...' : stats.pendingCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 font-medium">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{loading ? '...' : stats.activeCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 font-medium">Rejected</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{loading ? '...' : stats.rejectedCount}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors by name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">County</label>
                <select
                  value={countyFilter}
                  onChange={(e) => setCountyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Counties</option>
                  {counties.map(county => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Vendor Cards */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#ea8f1e' }}></div>
            <p className="mt-4 text-gray-600">Loading vendors...</p>
          </div>
        ) : (
          <>
            {activeTab === 'pending' && (
              <div>
                {pendingVendors.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No pending vendors</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingVendors.map(renderVendorCard)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'active' && (
              <div>
                {activeVendors.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No active vendors</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeVendors.map(renderVendorCard)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rejected' && (
              <div>
                {rejectedVendors.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <X className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No rejected vendors</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rejectedVendors.map(renderVendorCard)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedVendor.company_name}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">Company Description</p>
                <p className="text-gray-900">{selectedVendor.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Category</p>
                  <p className="text-gray-900 mt-1">{selectedVendor.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">County</p>
                  <p className="text-gray-900 mt-1">{selectedVendor.county || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Rating</p>
                  <p className="text-gray-900 mt-1">{selectedVendor.rating ? selectedVendor.rating.toFixed(1) : 'No rating'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">RFQs Completed</p>
                  <p className="text-gray-900 mt-1">{selectedVendor.rfqs_completed || 0}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 font-medium mb-3">Contact Information</p>
                <div className="space-y-2 text-sm">
                  {selectedVendor.contact_email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedVendor.contact_email}
                    </p>
                  )}
                  {selectedVendor.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedVendor.phone}
                    </p>
                  )}
                </div>
              </div>

              {selectedVendor.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 font-medium">Rejection Reason</p>
                  <p className="text-red-600 mt-1">{selectedVendor.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900">Reject Vendor</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why you're rejecting this vendor..."
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
                  onClick={() => handleReject(selectedVendor.id)}
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
