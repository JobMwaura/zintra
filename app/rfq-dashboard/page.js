'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
  Plus,
  ChevronRight,
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Trash2,
  RefreshCw
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const statusColors = {
  'submitted': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Clock },
  'approved': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
  'in_review': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Eye },
  'assigned': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: MessageSquare },
  'completed': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
  'cancelled': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertCircle },
  'expired': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: AlertCircle }
};

export default function RFQDashboard() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState([]);
  const [filteredRfqs, setFilteredRfqs] = useState([]);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterStatus, filterType, rfqs]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/auth/login');
        return;
      }

      setUser(session.user);

      // Fetch user's RFQs
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (rfqError) throw rfqError;
      setRfqs(rfqData || []);

      // Fetch quota
      const token = session.access_token;
      const quotaRes = await fetch('/api/rfq/quota', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (quotaRes.ok) {
        const quotaData = await quotaRes.json();
        setQuota(quotaData);
      }

      // Fetch response counts for each RFQ
      if (rfqData && rfqData.length > 0) {
        const rfqIds = rfqData.map(r => r.id);
        const { data: responseCounts } = await supabase
          .from('rfq_responses')
          .select('rfq_id', { count: 'exact' });

        // This is simplified - in production you'd get counts per RFQ
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = rfqs;

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

    setFilteredRfqs(filtered);
  };

  const handleCancel = async (rfqId) => {
    if (!confirm('Are you sure you want to cancel this RFQ?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'cancelled' })
        .eq('id', rfqId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      setSuccess('RFQ cancelled successfully');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your RFQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">RFQ Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your requests for quotation</p>
            </div>
            <button
              onClick={() => router.push('/post-rfq')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <Plus size={20} />
              New RFQ
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
              <CheckCircle size={20} />
              {success}
            </div>
          )}

          {/* Quota Card */}
          {quota && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Free RFQs Remaining</p>
                  <p className="text-3xl font-bold text-blue-600">{quota.free_remaining || 0}</p>
                  <p className="text-gray-500 text-xs mt-1">of 3 per month</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Submitted This Month</p>
                  <div className="flex gap-2">
                    <div className="text-center">
                      <p className="text-xl font-semibold text-gray-700">{quota.by_type?.direct || 0}</p>
                      <p className="text-xs text-gray-500">Direct</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold text-gray-700">{quota.by_type?.wizard || 0}</p>
                      <p className="text-xs text-gray-500">Wizard</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold text-gray-700">{quota.by_type?.public || 0}</p>
                      <p className="text-xs text-gray-500">Public</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 text-sm mb-1">Quota Resets</p>
                  <p className="text-lg font-semibold text-gray-700">{quota.quota_resets_on}</p>
                  <p className="text-gray-500 text-xs mt-1">Next month's quota</p>
                </div>
              </div>
              {quota.free_remaining === 0 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-orange-700 text-sm">
                  <p className="font-semibold">Quota Exhausted</p>
                  <p>You've used all free RFQs this month. Pay KES 300 for each additional RFQ.</p>
                  <button
                    onClick={() => router.push('/rfq/payment')}
                    className="mt-2 text-orange-700 hover:text-orange-800 font-semibold underline"
                  >
                    Buy Additional RFQs →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search RFQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="in_review">In Review</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="direct">Direct</option>
              <option value="wizard">Wizard</option>
              <option value="public">Public</option>
            </select>
            <button
              onClick={handleRefresh}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* RFQ List */}
        {filteredRfqs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No RFQs found</p>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first RFQ to get started'}
            </p>
            <button
              onClick={() => router.push('/post-rfq')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
            >
              Create RFQ
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRfqs.map((rfq) => {
              const statusColor = statusColors[rfq.status];
              const StatusIcon = statusColor?.icon || Clock;
              const expiresAt = new Date(rfq.expires_at);
              const daysUntilExpiry = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={rfq.id}
                  className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${statusColor?.border} hover:shadow-lg transition`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon size={20} className={statusColor?.text} />
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">
                          {rfq.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor?.bg} ${statusColor?.text}`}>
                          {rfq.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {rfq.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="font-semibold text-gray-700 capitalize">
                        {rfq.type}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <p className="font-semibold text-gray-700">
                        {rfq.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget</p>
                      <p className="font-semibold text-gray-700">
                        {rfq.budget_estimate || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Expires In</p>
                      <p className={`font-semibold ${daysUntilExpiry < 3 ? 'text-red-600' : 'text-gray-700'}`}>
                        {daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry} days`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Created {new Date(rfq.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/rfq/${rfq.id}`)}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
                      >
                        View Details
                        <ChevronRight size={18} />
                      </button>
                      {['submitted', 'in_review'].includes(rfq.status) && (
                        <button
                          onClick={() => handleCancel(rfq.id)}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition"
                        >
                          <Trash2 size={18} />
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
