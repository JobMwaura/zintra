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
  'vendor-request': { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-800', label: 'Vendor Request' },
};

export default function RFQInboxTab({ vendor, currentUser }) {
  const [rfqs, setRfqs] = useState([]);
  const [myQuotes, setMyQuotes] = useState([]); // Vendor's submitted quotes
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    pending: 0,
    direct: 0,
    matched: 0,
    wizard: 0,
    public: 0,
    'vendor-request': 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeSection, setActiveSection] = useState('inbox'); // 'inbox' or 'my-quotes'

  useEffect(() => {
    fetchRFQs();
    fetchMyQuotes();
  }, [vendor.id]);

  // Fetch vendor's submitted quotes/responses
  const fetchMyQuotes = async () => {
    try {
      console.log('DEBUG: Fetching quotes for vendor_id:', vendor.id);
      const { data: quotes, error } = await supabase
        .from('rfq_responses')
        .select(`
          *,
          rfqs:rfq_id (
            id,
            title,
            description,
            category,
            county,
            user_id
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my quotes:', error);
        return;
      }

      console.log('DEBUG: Fetched quotes:', quotes?.length, 'quotes');
      console.log('DEBUG: Quote statuses:', quotes?.map(q => ({ id: q.id, status: q.status })));
      setMyQuotes(quotes || []);
    } catch (err) {
      console.error('Error in fetchMyQuotes:', err);
    }
  };

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      // Query 1: RFQs from rfq_recipients table (includes direct, wizard, matched, vendor-request)
      const { data: recipientRfqs, error: recipientError } = await supabase
        .from('rfq_recipients')
        .select(`
          id,
          rfq_id,
          recipient_type,
          viewed_at,
          created_at,
          rfqs (
            id,
            title,
            description,
            category,
            county,
            created_at,
            status,
            user_id
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (recipientError) {
        console.error('Error fetching RFQs from recipients:', recipientError);
      }

      // Query 2: RFQs directly assigned to this vendor via assigned_vendor_id
      const { data: assignedRfqs, error: assignedError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('assigned_vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (assignedError) {
        console.error('Error fetching assigned RFQs:', assignedError);
      }

      // Query 3: Legacy rfq_requests for backward compatibility
      const { data: directRfqs, error: directError } = await supabase
        .from('rfq_requests')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (directError) {
        console.error('Error fetching direct RFQs:', directError);
      }

      // Track all RFQ IDs to avoid duplicates
      const allRfqIds = new Set();

      // Map assignedRfqs FIRST (most reliable data)
      const assignedMappedRfqs = (assignedRfqs || []).map(rfq => {
        allRfqIds.add(rfq.id);
        return {
          id: rfq.id,
          rfq_id: rfq.id,
          requester_id: rfq.user_id,
          vendor_id: vendor.id,
          title: rfq.title || rfq.project_title || 'Untitled RFQ',
          description: rfq.description,
          category: rfq.category || 'General',
          county: rfq.county || rfq.location || 'Not specified',
          created_at: rfq.created_at,
          status: rfq.status || 'pending',
          rfq_type: rfq.type || 'direct',
          rfq_type_label: (rfq.type || 'direct') === 'direct' ? 'Direct RFQ' : 'Public RFQ',
          requester_name: 'Loading...',
          requester_email: 'Loading...',
          requester_id_for_fetch: rfq.user_id,
          viewed_at: rfq.viewed_at,
          quote_count: rfq.quote_count || 0,
          total_quotes: rfq.total_quotes || 0,
          budget_range: rfq.budget_range,
          deadline: rfq.deadline,
        };
      });

      // Map recipientRfqs (new system) - skip if already added
      const recipientMappedRfqs = (recipientRfqs || [])
        .filter(recipient => recipient.rfqs && !allRfqIds.has(recipient.rfqs.id))
        .map(recipient => {
          allRfqIds.add(recipient.rfqs.id);
          return {
            id: recipient.id,
            rfq_id: recipient.rfqs.id,
            requester_id: recipient.rfqs.user_id,
            vendor_id: vendor.id,
            title: recipient.rfqs.title,
            description: recipient.rfqs.description,
            category: recipient.rfqs.category,
            county: recipient.rfqs.county,
            created_at: recipient.rfqs.created_at,
            status: recipient.rfqs.status,
            rfq_type: recipient.recipient_type,
            rfq_type_label: recipient.recipient_type.charAt(0).toUpperCase() + recipient.recipient_type.slice(1),
            requester_name: 'Loading...',
            requester_email: 'Loading...',
            requester_id_for_fetch: recipient.rfqs.user_id,
            viewed_at: recipient.viewed_at,
            quote_count: 0,
            total_quotes: 0,
          };
        });

      // Map directRfqs (legacy system) - only add if not already present
      const directMappedRfqs = (directRfqs || [])
        .filter(rfq => !allRfqIds.has(rfq.rfq_id) && !allRfqIds.has(rfq.id))
        .map(rfq => {
          const rfqId = rfq.rfq_id || rfq.id;
          allRfqIds.add(rfqId);
          return {
            id: rfq.id,
            rfq_id: rfqId,
            requester_id: rfq.user_id,
            vendor_id: rfq.vendor_id,
            title: rfq.project_title,
            description: rfq.project_description,
            category: rfq.category,
            county: rfq.county,
            created_at: rfq.created_at,
            status: rfq.status,
            rfq_type: 'direct',
            rfq_type_label: 'Direct RFQ',
            requester_name: rfq.requester_name || 'Unknown',
            requester_email: rfq.requester_email || 'unknown@zintra.co.ke',
            viewed_at: null,
            quote_count: 0,
            total_quotes: 0,
          };
        });

      // Combine all sources: assigned + recipients + legacy direct
      const allRfqs = [...assignedMappedRfqs, ...recipientMappedRfqs, ...directMappedRfqs];
      allRfqs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Fetch buyer information for RFQs that need it
      const requesterIds = [
        ...new Set(allRfqs.map(r => r.requester_id_for_fetch || r.requester_id).filter(Boolean))
      ];
      
      if (requesterIds.length > 0) {
        try {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', requesterIds);
          
          const usersMap = {};
          (usersData || []).forEach(user => {
            usersMap[user.id] = {
              email: user.email || 'unknown@zintra.co.ke',
              full_name: user.full_name || 'Unknown'
            };
          });

          // Update RFQs with fetched buyer info
          allRfqs.forEach(rfq => {
            const requesterId = rfq.requester_id_for_fetch || rfq.requester_id;
            if (usersMap[requesterId]) {
              rfq.requester_email = usersMap[requesterId].email;
              rfq.requester_name = usersMap[requesterId].full_name;
            }
          });
        } catch (err) {
          console.warn('Could not fetch buyer information:', err);
        }
      }

      setRfqs(allRfqs);

      // Calculate stats for ALL types
      const statsData = {
        total: allRfqs.length,
        unread: allRfqs.filter(r => !r.viewed_at).length,
        pending: allRfqs.filter(r => r.status === 'pending').length,
        direct: allRfqs.filter(r => r.rfq_type === 'direct').length,
        matched: allRfqs.filter(r => r.rfq_type === 'matched').length,
        wizard: allRfqs.filter(r => r.rfq_type === 'wizard').length,
        public: allRfqs.filter(r => r.rfq_type === 'public').length,
        'vendor-request': allRfqs.filter(r => r.rfq_type === 'vendor-request').length,
      };

      setStats(statsData);
      console.log('RFQInboxTab Stats:', statsData);
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

  // Calculate quote stats
  const acceptedQuotes = myQuotes.filter(q => q.status === 'accepted');
  const pendingQuotes = myQuotes.filter(q => q.status === 'submitted');
  const rejectedQuotes = myQuotes.filter(q => q.status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Section Toggle - RFQ Inbox vs My Quotes */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSection('inbox')}
          className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition ${
            activeSection === 'inbox'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          📥 RFQ Inbox ({stats.total})
        </button>
        <button
          onClick={() => setActiveSection('my-quotes')}
          className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition ${
            activeSection === 'my-quotes'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          } ${acceptedQuotes.length > 0 ? 'animate-pulse ring-2 ring-green-400' : ''}`}
        >
          📝 My Quotes ({myQuotes.length})
          {acceptedQuotes.length > 0 && (
            <span className="ml-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs">
              🎉 {acceptedQuotes.length} Accepted!
            </span>
          )}
        </button>
      </div>

      {/* ========== MY QUOTES SECTION ========== */}
      {activeSection === 'my-quotes' && (
        <div className="space-y-6">
          {/* Accepted Quotes - CELEBRATION SECTION */}
          {acceptedQuotes.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">🎉</span>
                <h2 className="text-2xl font-bold text-green-900">Accepted Quotes</h2>
                <span className="ml-auto bg-green-200 text-green-800 px-3 py-1 rounded-full font-semibold text-sm">
                  {acceptedQuotes.length}
                </span>
              </div>
              <p className="text-green-700 font-medium mb-6">Congratulations! These quotes were accepted by buyers.</p>
              
              <div className="space-y-4">
                {acceptedQuotes.map(quote => (
                  <div
                    key={quote.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-green-500 p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          {quote.rfqs?.title || 'Project'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Your Quote: <span className="font-semibold text-gray-900">KSh {parseFloat(quote.amount || 0).toLocaleString()}</span>
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ml-2">
                        ✓ Accepted
                      </span>
                    </div>

                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">🎉</span>
                      <div className="flex-1">
                        <p className="font-semibold text-green-900">Quote Accepted!</p>
                        <p className="text-sm text-green-700 mt-1">
                          Great news! The buyer has accepted your quote and will be in touch soon.
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{quote.message}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200">
                      <span>📅 {new Date(quote.created_at).toLocaleDateString()}</span>
                      {quote.attachment_url && (
                        <a 
                          href={quote.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:underline font-medium"
                        >
                          View Attachment
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Quotes */}
          {pendingQuotes.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⏳</span>
                <h2 className="text-xl font-bold text-yellow-900">Pending Quotes</h2>
                <span className="ml-auto bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full font-semibold text-sm">
                  {pendingQuotes.length}
                </span>
              </div>
              <p className="text-yellow-700 font-medium mb-4">Waiting for buyer review...</p>
              
              <div className="space-y-3">
                {pendingQuotes.map(quote => (
                  <div
                    key={quote.id}
                    className="bg-white rounded-lg border border-yellow-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{quote.rfqs?.title || 'Project'}</h4>
                        <p className="text-sm text-gray-600">Quote: KSh {parseFloat(quote.amount || 0).toLocaleString()}</p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">
                        ⏳ Pending
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Submitted: {new Date(quote.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Quotes */}
          {rejectedQuotes.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✗</span>
                <h2 className="text-xl font-bold text-red-900">Rejected Quotes</h2>
                <span className="ml-auto bg-red-200 text-red-800 px-3 py-1 rounded-full font-semibold text-sm">
                  {rejectedQuotes.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {rejectedQuotes.map(quote => (
                  <div
                    key={quote.id}
                    className="bg-white rounded-lg border border-red-200 p-4 opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-700">{quote.rfqs?.title || 'Project'}</h4>
                        <p className="text-sm text-gray-500">Quote: KSh {parseFloat(quote.amount || 0).toLocaleString()}</p>
                      </div>
                      <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold">
                        ✗ Rejected
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Quotes */}
          {myQuotes.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <span className="text-4xl mb-4 block">📝</span>
              <p className="text-slate-600 text-lg font-medium">No Quotes Submitted Yet</p>
              <p className="text-slate-500 text-sm mt-1">Submit quotes to RFQs in your inbox to see them here</p>
              <button
                onClick={() => setActiveSection('inbox')}
                className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium"
              >
                Go to RFQ Inbox
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== RFQ INBOX SECTION ========== */}
      {activeSection === 'inbox' && (
        <>
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
        {['all', 'direct', 'matched', 'wizard', 'public', 'vendor-request'].map((type) => (
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
        </>
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
