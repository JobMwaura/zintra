'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

const RFQ_TYPE_COLORS = {
  direct: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800', label: 'Direct RFQ' },
  matched: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800', label: 'Admin-Matched' },
  wizard: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', label: 'Wizard' },
  public: { bg: 'bg-cyan-50', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-800', label: 'Public RFQ' },
};

export default function RFQInboxTab({ vendor, currentUser }) {
  const [rfqs, setRfqs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    pending: 0,
    direct: 0,
    matched: 0,
    wizard: 0,
    public: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRFQs();
  }, [vendor.id]);

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_vendor_rfq_inbox', {
        p_vendor_id: vendor.id
      });

      if (error) throw error;

      setRfqs(data || []);

      // Calculate stats
      const statsData = {
        total: data?.length || 0,
        unread: data?.filter((r) => !r.viewed_at).length || 0,
        pending: data?.filter((r) => r.status === 'pending').length || 0,
        direct: data?.filter((r) => r.rfq_type === 'direct').length || 0,
        matched: data?.filter((r) => r.rfq_type === 'matched').length || 0,
        wizard: data?.filter((r) => r.rfq_type === 'wizard').length || 0,
        public: data?.filter((r) => r.rfq_type === 'public').length || 0,
      };

      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch RFQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const canView = currentUser?.id === vendor.user_id;

  if (!canView) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">Only vendors can view their RFQ inbox</p>
      </div>
    );
  }

  const filteredRfqs =
    filter === 'all' ? rfqs : rfqs.filter((r) => r.rfq_type === filter);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total RFQs"
          value={stats.total}
          icon={<TrendingUp className="w-5 h-5" />}
          bgColor="bg-blue-50"
          textColor="text-blue-700"
        />
        <StatCard
          title="Unread"
          value={stats.unread}
          icon={<AlertCircle className="w-5 h-5" />}
          bgColor="bg-red-50"
          textColor="text-red-700"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={<Clock className="w-5 h-5" />}
          bgColor="bg-orange-50"
          textColor="text-orange-700"
        />
        <StatCard
          title="With Quotes"
          value={rfqs.filter((r) => r.quote_count > 0).length}
          icon={<CheckCircle className="w-5 h-5" />}
          bgColor="bg-green-50"
          textColor="text-green-700"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'direct', 'matched', 'wizard', 'public'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
              filter === type
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {type === 'all' ? `All (${stats.total})` : `${RFQ_TYPE_COLORS[type].label} (${stats[type]})`}
          </button>
        ))}
      </div>

      {/* RFQ List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading RFQs...</p>
        </div>
      ) : filteredRfqs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
          <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-lg">No RFQs found</p>
          <p className="text-slate-500 text-sm mt-1">
            {filter === 'all'
              ? 'Check back soon for new RFQs'
              : `No ${RFQ_TYPE_COLORS[filter].label.toLowerCase()} RFQs`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRfqs.map((rfq) => (
            <RFQCard key={rfq.id} rfq={rfq} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, bgColor, textColor }) {
  return (
    <div className={`${bgColor} rounded-lg p-4 border border-slate-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-600 font-semibold uppercase">{title}</p>
          <p className={`text-2xl font-bold ${textColor} mt-1`}>{value}</p>
        </div>
        <div className={`${textColor} opacity-70`}>{icon}</div>
      </div>
    </div>
  );
}

function RFQCard({ rfq }) {
  const router = useRouter();
  const rfqTypeConfig = RFQ_TYPE_COLORS[rfq.rfq_type] || RFQ_TYPE_COLORS.public;

  const handleViewDetails = () => {
    router.push(`/vendor/rfq/${rfq.id}`);
  };

  const handleSubmitQuote = () => {
    router.push(`/vendor/rfq/${rfq.id}/respond`);
  };

  return (
    <div className={`${rfqTypeConfig.bg} border ${rfqTypeConfig.border} rounded-lg p-4 hover:shadow-md transition`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-slate-900">{rfq.title}</h4>
            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full font-semibold ${rfqTypeConfig.badge}`}>
              {rfqTypeConfig.label}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Category: <span className="font-semibold">{rfq.category}</span>
            {rfq.county && (
              <>
                {' '}
                • Location: <span className="font-semibold">{rfq.county}</span>
              </>
            )}
          </p>
        </div>
        {!rfq.viewed_at && (
          <div className="w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0" title="Unread" />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-700 line-clamp-2 mb-3">{rfq.description}</p>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4 text-slate-600">
          <span>
            Quotes: <span className="font-semibold text-slate-900">{rfq.quote_count || 0}</span>
          </span>
          <span>
            Total Quotes: <span className="font-semibold text-slate-900">{rfq.total_quotes || 0}</span>
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {new Date(rfq.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-3 pt-3 border-t border-current border-opacity-10 flex gap-2">
        <button 
          onClick={handleViewDetails}
          className="flex-1 px-3 py-2 bg-white hover:bg-slate-100 rounded text-slate-700 font-semibold text-sm transition"
        >
          View Details
        </button>
        {rfq.quote_count === 0 && (
          <button 
            onClick={handleSubmitQuote}
            className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-sm transition"
          >
            Submit Quote
          </button>
        )}
      </div>
    </div>
  );
}
