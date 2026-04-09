'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleStatus } from '@/app/actions/vendor-zcc';
import { getEmployerJobOrders } from '@/app/actions/zcc-pipeline';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  ArrowLeft, Briefcase, MapPin, Calendar, DollarSign, User,
  CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight, FileText
} from 'lucide-react';

const ORDER_STATUS = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  disputed: { label: 'Disputed', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
};

export default function JobOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.push('/login'); return; }

      const roleResult = await getUserRoleStatus(user.id);
      if (!roleResult.roles.employer) { router.push('/careers/onboarding'); return; }

      const result = await getEmployerJobOrders(user.id);
      if (result.success) {
        setOrders(result.orders);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load job orders');
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = filterStatus
    ? orders.filter(o => o.status === filterStatus)
    : orders;

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/careers/employer/dashboard" className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-4 transition">
            <ArrowLeft size={20} />
            Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-1">Job Orders</h1>
          <p className="text-orange-100">
            {orders.length} total order{orders.length !== 1 ? 's' : ''} · {statusCounts.active || 0} active
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${!filterStatus ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
          >
            All ({orders.length})
          </button>
          {Object.entries(ORDER_STATUS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap ${filterStatus === key ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
            >
              {config.label} ({statusCounts[key] || 0})
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {orders.length === 0 ? 'No job orders yet' : 'No orders match this filter'}
            </h3>
            <p className="text-gray-500">
              Job orders are created when you hire a candidate from the applicant pipeline.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const sc = ORDER_STATUS[order.status] || ORDER_STATUS.active;
              const StatusIcon = sc.icon;
              const milestones = Array.isArray(order.milestones) ? order.milestones : [];

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{order.listing_title}</h3>
                        <span className="text-sm text-gray-500">{order.listing_type === 'gig' ? 'Gig' : 'Job'}</span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${sc.color}`}>
                        <StatusIcon size={12} />
                        {sc.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User size={16} className="text-orange-500" />
                        <span>{order.candidate_name}</span>
                      </div>

                      {order.agreed_amount && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign size={16} className="text-orange-500" />
                          <span>KES {Number(order.agreed_amount).toLocaleString()}</span>
                        </div>
                      )}

                      {order.start_date && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={16} className="text-orange-500" />
                          <span>{new Date(order.start_date).toLocaleDateString('en-KE')}</span>
                        </div>
                      )}

                      {(order.county || order.town) && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={16} className="text-orange-500" />
                          <span>{[order.town, order.county].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Milestones */}
                    {milestones.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-2">Milestones</p>
                        <div className="flex gap-2 flex-wrap">
                          {milestones.map((m, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              {m.label || m.title || `Milestone ${i + 1}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Created {new Date(order.created_at).toLocaleDateString('en-KE')}
                      </span>
                      <Link
                        href={`/careers/employer/applicants`}
                        className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                      >
                        View Pipeline <ChevronRight size={14} />
                      </Link>
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
