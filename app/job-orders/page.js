'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Clock, CheckCircle, AlertCircle, XCircle,
  Search, Filter, ChevronRight, TrendingUp, Briefcase, Star,
  AlertTriangle, MessageSquare, RefreshCw
} from 'lucide-react';

/**
 * Job Orders Dashboard — /job-orders
 * 
 * Buyers and vendors can:
 * - View all their job orders in one place
 * - Filter by status (created, confirmed, in_progress, completed, disputed, cancelled)
 * - Search by vendor/buyer name or scope
 * - Quick actions (confirm, start, complete, dispute, cancel)
 * - Click through to the full negotiation page
 */
export default function JobOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'buyer', 'vendor', or 'both'
  const [vendorMap, setVendorMap] = useState({});
  const [buyerMap, setBuyerMap] = useState({});

  useEffect(() => {
    if (user) {
      fetchJobOrders();
      detectUserRole();
    }
  }, [user]);

  const detectUserRole = async () => {
    try {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      setUserRole(vendor ? 'vendor' : 'buyer');
    } catch {
      setUserRole('buyer');
    }
  };

  const fetchJobOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/job-orders?userId=${user.id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to fetch job orders');

      const fetchedOrders = data.orders || [];
      setOrders(fetchedOrders);

      // Fetch vendor names
      const vendorIds = [...new Set(fetchedOrders.map(o => o.vendor_id).filter(Boolean))];
      const buyerIds = [...new Set(fetchedOrders.map(o => o.buyer_id).filter(Boolean))];

      if (vendorIds.length > 0) {
        const { data: vendors } = await supabase
          .from('vendors')
          .select('id, company_name, logo_url, verified')
          .in('id', vendorIds);
        if (vendors) {
          const map = {};
          vendors.forEach(v => { map[v.id] = v; });
          setVendorMap(map);
        }
      }

      if (buyerIds.length > 0) {
        const { data: buyers } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', buyerIds);
        if (buyers) {
          const map = {};
          buyers.forEach(b => { map[b.id] = b; });
          setBuyerMap(map);
        }
      }
    } catch (err) {
      console.error('Error fetching job orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter + search
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (filterStatus !== 'all') {
      result = result.filter(o => o.status === filterStatus);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => {
        const vendorName = vendorMap[o.vendor_id]?.company_name || '';
        const buyerName = buyerMap[o.buyer_id]?.full_name || '';
        const scope = o.scope_summary || '';
        return vendorName.toLowerCase().includes(q) ||
               buyerName.toLowerCase().includes(q) ||
               scope.toLowerCase().includes(q);
      });
    }

    return result;
  }, [orders, filterStatus, searchQuery, vendorMap, buyerMap]);

  // Stats
  const stats = useMemo(() => ({
    total: orders.length,
    active: orders.filter(o => ['created', 'confirmed', 'in_progress'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    disputed: orders.filter(o => o.status === 'disputed').length,
    totalValue: orders.reduce((sum, o) => sum + parseFloat(o.agreed_price || 0), 0)
  }), [orders]);

  // Quick action handler
  const handleAction = async (jobOrderId, action, reason) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/job-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobOrderId, action, userId: user.id, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      const actionMessages = {
        confirm: data.bothConfirmed ? '✅ Both parties confirmed! Work can begin.' : '✅ You confirmed the job order.',
        start: '🚀 Work started!',
        complete: '✅ Job marked as completed!',
        cancel: 'Job order cancelled.',
        dispute: '⚠️ Dispute raised. Admin has been notified.'
      };
      setMessage(actionMessages[action] || 'Action completed');
      await fetchJobOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      created: { label: 'Awaiting Confirmation', color: 'bg-blue-100 text-blue-800', icon: <Clock className="w-4 h-4" /> },
      confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      in_progress: { label: 'In Progress', color: 'bg-orange-100 text-orange-800', icon: <TrendingUp className="w-4 h-4" /> },
      completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-4 h-4" /> },
      disputed: { label: 'Disputed', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-4 h-4" /> },
      cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-4 h-4" /> }
    };
    return configs[status] || configs.created;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Please log in to view your job orders.</p>
          <Link href="/login" className="text-orange-600 font-semibold mt-2 inline-block">Log In →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-semibold mb-4">
            <ArrowLeft className="w-5 h-5" /> Back
          </button>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-7 h-7 text-orange-600" />
                  Job Orders
                </h1>
                <p className="text-slate-600 mt-1">Track and manage all your deals in one place</p>
              </div>
              <button
                onClick={fetchJobOrders}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{message}</p>
            <button onClick={() => setMessage(null)} className="ml-auto text-green-600 hover:text-green-800">✕</button>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">✕</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
            <p className="text-2xl font-bold text-orange-700">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-emerald-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Completed</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Disputed</p>
            <p className="text-2xl font-bold text-red-700">{stats.disputed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500 col-span-2 md:col-span-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Value</p>
            <p className="text-lg font-bold text-green-800">KSh {stats.totalValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="created">Awaiting Confirmation</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="disputed">Disputed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by vendor, buyer, or scope..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block h-10 w-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading job orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {orders.length === 0 ? 'No Job Orders Yet' : 'No matching orders'}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {orders.length === 0
                ? 'Job orders are created when a negotiation is accepted. Post an RFQ to get started!'
                : 'Try adjusting your filters or search terms.'}
            </p>
            {orders.length === 0 && (
              <Link href="/post-rfq" className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition">
                Post an RFQ
              </Link>
            )}
          </div>
        ) : (
          /* Job Order Cards */
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const vendor = vendorMap[order.vendor_id];
              const buyer = buyerMap[order.buyer_id];
              const isBuyer = order.buyer_id === user.id;
              const counterparty = isBuyer
                ? (vendor?.company_name || 'Vendor')
                : (buyer?.full_name || buyer?.email?.split('@')[0] || 'Buyer');

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      {/* Left: Main info */}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mt-2">
                          KSh {parseFloat(order.agreed_price).toLocaleString()}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {isBuyer ? 'Vendor' : 'Buyer'}: <span className="font-semibold text-gray-800">{counterparty}</span>
                          {vendor?.verified && isBuyer && <span className="text-blue-600 ml-1">✓</span>}
                        </p>
                        {order.scope_summary && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{order.scope_summary}</p>
                        )}
                      </div>

                      {/* Right: Details */}
                      <div className="text-right text-sm space-y-1">
                        {order.delivery_date && (
                          <p className="text-gray-600">
                            <span className="text-gray-400">Delivery:</span>{' '}
                            <span className="font-medium">{new Date(order.delivery_date).toLocaleDateString()}</span>
                          </p>
                        )}
                        {order.payment_terms && (
                          <p className="text-gray-600">
                            <span className="text-gray-400">Payment:</span>{' '}
                            <span className="font-medium">{order.payment_terms}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 justify-end mt-2">
                          <span className={`text-xs ${order.confirmed_by_buyer ? 'text-green-600' : 'text-gray-400'}`}>
                            Buyer {order.confirmed_by_buyer ? '✓' : '○'}
                          </span>
                          <span className={`text-xs ${order.confirmed_by_vendor ? 'text-green-600' : 'text-gray-400'}`}>
                            Vendor {order.confirmed_by_vendor ? '✓' : '○'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                      {/* View full negotiation */}
                      {order.rfq_id && (
                        <Link
                          href={`/rfq/${order.rfq_id}/negotiate`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          View Negotiation
                        </Link>
                      )}

                      {/* Confirm */}
                      {order.status === 'created' &&
                        ((isBuyer && !order.confirmed_by_buyer) || (!isBuyer && !order.confirmed_by_vendor)) && (
                        <button
                          onClick={() => handleAction(order.id, 'confirm')}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Confirm
                        </button>
                      )}

                      {/* Start work (vendor only) */}
                      {!isBuyer && order.status === 'confirmed' && (
                        <button
                          onClick={() => handleAction(order.id, 'start')}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          Start Work
                        </button>
                      )}

                      {/* Complete */}
                      {order.status === 'in_progress' && (
                        <button
                          onClick={() => {
                            if (confirm('Mark this job as completed?')) handleAction(order.id, 'complete');
                          }}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Mark Complete
                        </button>
                      )}

                      {/* Dispute */}
                      {['confirmed', 'in_progress'].includes(order.status) && (
                        <button
                          onClick={() => {
                            const reason = prompt('Describe the issue:');
                            if (reason) handleAction(order.id, 'dispute', reason);
                          }}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Raise Dispute
                        </button>
                      )}

                      {/* Cancel */}
                      {['created', 'confirmed'].includes(order.status) && (
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for cancellation (optional):');
                            if (confirm('Cancel this job order?')) handleAction(order.id, 'cancel', reason || undefined);
                          }}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      )}

                      {/* Rate vendor (buyer only, completed jobs) */}
                      {isBuyer && order.status === 'completed' && (
                        <Link
                          href={`/vendor-profile/${order.vendor_id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Rate Vendor
                        </Link>
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
