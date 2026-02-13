'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Clock, CheckCircle, AlertCircle, TrendingUp, X, Mail, Phone, User, MapPin, Calendar, DollarSign, FileText, Eye, MessageCircle, Send, Scale } from 'lucide-react';

const RFQ_TYPE_COLORS = {
  direct: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800', label: 'Direct RFQ' },
  matched: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800', label: 'Admin-Matched' },
  wizard: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', label: 'Wizard' },
  public: { bg: 'bg-cyan-50', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-800', label: 'Public RFQ' },
  'vendor-request': { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-800', label: 'Vendor Request' },
};

export default function RFQInboxTab({ vendor, currentUser }) {
  const router = useRouter();
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
  const [negotiationStatuses, setNegotiationStatuses] = useState({}); // { quoteId: { threadId, status } }

  // Modal states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [contactBuyer, setContactBuyer] = useState(null);
  const [assignmentRfq, setAssignmentRfq] = useState(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [assignmentTab, setAssignmentTab] = useState('rfq'); // 'rfq' or 'quote'
  
  // Chat states
  const [showChatMode, setShowChatMode] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);

  useEffect(() => {
    fetchRFQs();
    fetchMyQuotes();
    fetchNegotiationStatuses();
  }, [vendor.id]);

  // Fetch negotiation thread statuses for all vendor's quotes
  const fetchNegotiationStatuses = async () => {
    try {
      const { data: threads, error } = await supabase
        .from('negotiation_threads')
        .select('id, rfq_quote_id, status, round_count, max_rounds, current_price')
        .eq('vendor_id', vendor.id);

      if (error) {
        console.error('Error fetching negotiation statuses:', error);
        return;
      }

      if (threads && threads.length > 0) {
        const map = {};
        threads.forEach(t => {
          map[t.rfq_quote_id] = {
            threadId: t.id,
            status: t.status,
            roundCount: t.round_count || 0,
            maxRounds: t.max_rounds || 3,
            currentPrice: t.current_price
          };
        });
        setNegotiationStatuses(map);
      }
    } catch (err) {
      console.error('Error in fetchNegotiationStatuses:', err);
    }
  };

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

  // Handle Contact Buyer - open modal for messaging (buyer identity stays hidden)
  const handleContactBuyer = async (quote) => {
    setSelectedQuote(quote);
    setLoadingModal(true);
    setShowContactModal(true);
    setShowChatMode(false);
    setChatMessage('');
    setMessageSent(false);
    
    try {
      const buyerId = quote.rfqs?.user_id;
      if (!buyerId) {
        setContactBuyer({ error: 'Buyer information not available' });
        setLoadingModal(false);
        return;
      }

      // Set buyer reference for messaging — but keep identity anonymous
      setContactBuyer({
        id: buyerId,
        full_name: 'Zintra User',   // Anonymized
        email: null,                 // Hidden
      });
    } catch (err) {
      console.error('Error setting up contact:', err);
      setContactBuyer({ error: 'Error loading contact details' });
    }
    setLoadingModal(false);
  };

  // Send message to buyer
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !contactBuyer?.id || !vendor?.id) return;
    
    setSendingMessage(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/vendor/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          messageText: chatMessage,
          senderType: 'vendor',
          userId: contactBuyer.id
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setMessageSent(true);
        setChatMessage('');
      } else {
        alert('Failed to send message: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    }
    setSendingMessage(false);
  };

  // Handle View Assignment - open modal with full RFQ details (buyer stays anonymous)
  const handleViewAssignment = async (quote) => {
    setSelectedQuote(quote);
    setLoadingModal(true);
    setShowAssignmentModal(true);
    
    try {
      // Fetch full RFQ details
      const { data: rfqData, error: rfqError } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', quote.rfq_id)
        .maybeSingle();

      if (rfqError || !rfqData) {
        setAssignmentRfq({ error: 'Could not load RFQ details' });
      } else {
        // Anonymize buyer info — vendor sees project details, not the buyer identity
        setAssignmentRfq({
          ...rfqData,
          buyer: { id: rfqData.user_id, full_name: 'Zintra User', email: null, phone: null }
        });
      }
    } catch (err) {
      console.error('Error fetching RFQ:', err);
      setAssignmentRfq({ error: 'Error loading RFQ details' });
    }
    setLoadingModal(false);
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

      // Fetch buyer information for RFQs — BUT anonymize for vendor privacy
      // Vendors should NOT see buyer's real name or email
      // They communicate via the platform messaging system
      const requesterIds = [
        ...new Set(allRfqs.map(r => r.requester_id_for_fetch || r.requester_id).filter(Boolean))
      ];
      
      if (requesterIds.length > 0) {
        try {
          // Only fetch the user_id so messaging still works — name stays hidden
          allRfqs.forEach(rfq => {
            rfq.requester_email = null; // Hidden from vendor
            rfq.requester_name = 'Zintra User'; // Anonymized
          });
        } catch (err) {
          console.warn('Could not process buyer information:', err);
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
        <a
          href="/job-orders"
          className="px-4 py-2 rounded-t-lg font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
        >
          📋 Job Orders
        </a>
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

                    <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200 mb-4">
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

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleViewAssignment(quote)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Assignment
                      </button>
                      <button
                        onClick={() => router.push(`/rfq/${quote.rfq_id}/negotiate`)}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition flex items-center justify-center gap-2"
                      >
                        <Scale className="w-4 h-4" />
                        View Negotiation
                      </button>
                      <button
                        onClick={() => handleContactBuyer(quote)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition flex items-center justify-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Contact Buyer
                      </button>
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
                      <div className="flex items-center gap-2">
                        {negotiationStatuses[quote.id] && (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            negotiationStatuses[quote.id].status === 'active' ? 'bg-blue-100 text-blue-700' :
                            negotiationStatuses[quote.id].status === 'expired' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            💬 {negotiationStatuses[quote.id].status === 'active' 
                              ? `Negotiating (${negotiationStatuses[quote.id].roundCount}/${negotiationStatuses[quote.id].maxRounds})` 
                              : negotiationStatuses[quote.id].status.charAt(0).toUpperCase() + negotiationStatuses[quote.id].status.slice(1)}
                          </span>
                        )}
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">
                          ⏳ Pending
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Submitted: {new Date(quote.created_at).toLocaleDateString()}</p>
                    
                    {/* Negotiate / View Negotiation button */}
                    {negotiationStatuses[quote.id] && (
                      <div className="mt-3 pt-3 border-t border-yellow-100">
                        <button
                          onClick={() => router.push(`/rfq/${quote.rfq_id}/negotiate`)}
                          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium text-sm transition flex items-center justify-center gap-2"
                        >
                          <Scale className="w-4 h-4" />
                          {negotiationStatuses[quote.id].status === 'active' ? 'Continue Negotiation' : 'View Negotiation'}
                        </button>
                      </div>
                    )}
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

      {/* ========== CONTACT BUYER MODAL ========== */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-md w-full overflow-hidden max-h-[90vh] my-4 sm:my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    {showChatMode ? <MessageCircle className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{showChatMode ? 'Send Message' : 'Message Buyer'}</h2>
                    <p className="text-blue-100 text-sm truncate max-w-[200px]">{selectedQuote?.rfqs?.title || 'Project'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setContactBuyer(null);
                    setSelectedQuote(null);
                    setShowChatMode(false);
                    setChatMessage('');
                    setMessageSent(false);
                  }}
                  className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              {loadingModal ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading buyer details...</p>
                </div>
              ) : contactBuyer?.error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-gray-600">{contactBuyer.error}</p>
                </div>
              ) : contactBuyer ? (
                <div className="space-y-4">
                  {/* Buyer Profile */}
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0">
                      {(contactBuyer.full_name || contactBuyer.email || 'B').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{contactBuyer.full_name || 'Buyer'}</p>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">Project Owner</p>
                    </div>
                  </div>

                  {/* Chat Mode */}
                  {showChatMode ? (
                    <div className="space-y-4">
                      {messageSent ? (
                        <div className="text-center py-6">
                          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          </div>
                          <p className="font-semibold text-green-900">Message Sent!</p>
                          <p className="text-sm text-gray-600 mt-1">The buyer will see your message in their inbox</p>
                          <p className="text-xs text-blue-600 mt-2">📧 An email notification has been sent to the buyer</p>
                          <button
                            onClick={() => {
                              setShowChatMode(false);
                              setMessageSent(false);
                            }}
                            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            ← Back to contact options
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                            💬 Your message will be sent to the buyer's inbox on Zintra
                          </div>
                          <textarea
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            placeholder={`Hi ${contactBuyer.full_name || 'there'},\n\nThank you for accepting my quote for "${selectedQuote?.rfqs?.title || 'your project'}".\n\nI'm excited to work with you...`}
                            className="w-full h-32 sm:h-40 px-3 py-2.5 sm:py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                          />
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={() => setShowChatMode(false)}
                              className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm sm:text-base transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSendMessage}
                              disabled={!chatMessage.trim() || sendingMessage}
                              className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm sm:text-base transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {sendingMessage ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  Send Message
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Contact Options */
                    <div className="space-y-3">
                      {/* Primary: In-App Message */}
                      <button
                        onClick={() => setShowChatMode(true)}
                        className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition group text-left"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 group-hover:bg-orange-200 rounded-full flex items-center justify-center transition flex-shrink-0">
                          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-orange-900 text-sm sm:text-base">Send Message</p>
                          <p className="text-xs sm:text-sm text-orange-600">Chat via Zintra inbox</p>
                        </div>
                        <span className="text-orange-400 flex-shrink-0">→</span>
                      </button>

                      {/* Email notification info */}
                      <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-blue-50 rounded-xl">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-blue-900 text-sm sm:text-base">Email Notification</p>
                          <p className="text-xs sm:text-sm text-blue-600">Buyer will be notified via email when you send a message</p>
                        </div>
                      </div>

                      {contactBuyer.phone && (
                        <a
                          href={`tel:${contactBuyer.phone}`}
                          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-green-50 hover:bg-green-100 rounded-xl transition group text-left"
                        >
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center transition flex-shrink-0">
                            <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-green-900 text-sm sm:text-base">Call Now</p>
                            <p className="text-xs sm:text-sm text-green-600">{contactBuyer.phone}</p>
                          </div>
                          <span className="text-green-400 flex-shrink-0">→</span>
                        </a>
                      )}

                      {!contactBuyer.phone && (
                        <div className="text-center py-2 text-gray-500 text-xs sm:text-sm">
                          <p>No phone number available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            {!showChatMode && (
              <div className="px-5 pb-5">
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setContactBuyer(null);
                    setSelectedQuote(null);
                  }}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== VIEW ASSIGNMENT MODAL ========== */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm sm:max-w-lg w-full my-4 sm:my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-xl sm:text-2xl flex-shrink-0">🎉</span>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold">Assignment Details</h2>
                    <p className="text-green-100 text-xs sm:text-sm truncate">{assignmentRfq?.title || selectedQuote?.rfqs?.title || 'Project'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setAssignmentRfq(null);
                    setSelectedQuote(null);
                    setAssignmentTab('rfq');
                  }}
                  className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setAssignmentTab('rfq')}
                className={`flex-1 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition ${
                  assignmentTab === 'rfq' 
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 RFQ Request
              </button>
              <button
                onClick={() => setAssignmentTab('quote')}
                className={`flex-1 py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium transition ${
                  assignmentTab === 'quote' 
                    ? 'text-green-600 border-b-2 border-green-600 bg-green-50' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                💰 Your Quote
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 max-h-[55vh] overflow-y-auto">
              {loadingModal ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading details...</p>
                </div>
              ) : assignmentRfq?.error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-gray-600">{assignmentRfq.error}</p>
                </div>
              ) : assignmentRfq ? (
                <>
                  {/* RFQ Tab Content */}
                  {assignmentTab === 'rfq' && (
                    <div className="space-y-4">
                      {/* Buyer's RFQ Request Details */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Project Description</h4>
                        <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{assignmentRfq.description || 'No description provided'}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <p className="text-xs text-gray-500 mb-1">📍 Location</p>
                          <p className="text-sm sm:text-base font-medium text-gray-900 break-words">
                            {assignmentRfq.location && assignmentRfq.county 
                              ? `${assignmentRfq.location}, ${assignmentRfq.county}`
                              : assignmentRfq.county || assignmentRfq.location || 'Not specified'}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <p className="text-xs text-gray-500 mb-1">📁 Category</p>
                          <p className="text-sm sm:text-base font-medium text-gray-900 break-words">{assignmentRfq.category || assignmentRfq.category_slug || 'General'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <p className="text-xs text-gray-500 mb-1">💰 Budget Range</p>
                          <p className="text-sm sm:text-base font-medium text-gray-900 break-words">
                            {assignmentRfq.budget_min || assignmentRfq.budget_max 
                              ? `KSh ${(assignmentRfq.budget_min || 0).toLocaleString()} - ${(assignmentRfq.budget_max || 0).toLocaleString()}`
                              : assignmentRfq.budget 
                                ? `KSh ${parseFloat(assignmentRfq.budget).toLocaleString()}`
                                : 'Not specified'}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <p className="text-xs text-gray-500 mb-1">⚡ Urgency</p>
                          <p className="text-sm sm:text-base font-medium text-gray-900 capitalize">{assignmentRfq.urgency || 'Normal'}</p>
                        </div>
                      </div>

                      {/* Buyer Info */}
                      {assignmentRfq.buyer && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                            <User className="w-4 h-4" /> Buyer
                          </h4>
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{assignmentRfq.buyer.full_name || 'Buyer'}</p>
                              {assignmentRfq.buyer.email && <p className="text-xs sm:text-sm text-gray-600 truncate">{assignmentRfq.buyer.email}</p>}
                              {assignmentRfq.buyer.phone && <p className="text-xs sm:text-sm text-gray-600">{assignmentRfq.buyer.phone}</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 text-center pt-2">
                        RFQ Created: {new Date(assignmentRfq.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* Quote Tab Content */}
                  {assignmentTab === 'quote' && (
                    <div className="space-y-4">
                      {/* Accepted Quote Amount */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-sm text-green-700 mb-1">Accepted Amount</p>
                        <p className="text-3xl font-bold text-green-700">
                          KSh {parseFloat(selectedQuote?.total_price_calculated || selectedQuote?.quoted_price || selectedQuote?.amount || 0).toLocaleString()}
                        </p>
                        <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          ✓ Accepted
                        </span>
                      </div>

                      {/* Quote Details */}
                      {(selectedQuote?.quote_title || selectedQuote?.intro_text) && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          {selectedQuote?.quote_title && (
                            <h4 className="font-semibold text-gray-900 mb-2">{selectedQuote.quote_title}</h4>
                          )}
                          {selectedQuote?.intro_text && (
                            <p className="text-sm text-gray-700">{selectedQuote.intro_text}</p>
                          )}
                        </div>
                      )}

                      {/* Pricing Breakdown */}
                      {(selectedQuote?.labour_cost || selectedQuote?.transport_cost || selectedQuote?.other_charges) && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h4>
                          <div className="space-y-2 text-sm">
                            {selectedQuote?.labour_cost > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Labour</span>
                                <span className="font-medium">KSh {parseFloat(selectedQuote.labour_cost).toLocaleString()}</span>
                              </div>
                            )}
                            {selectedQuote?.transport_cost > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Transport</span>
                                <span className="font-medium">KSh {parseFloat(selectedQuote.transport_cost).toLocaleString()}</span>
                              </div>
                            )}
                            {selectedQuote?.other_charges > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Other Charges</span>
                                <span className="font-medium">KSh {parseFloat(selectedQuote.other_charges).toLocaleString()}</span>
                              </div>
                            )}
                            {selectedQuote?.vat_amount > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">VAT</span>
                                <span className="font-medium">KSh {parseFloat(selectedQuote.vat_amount).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Timeline & Delivery */}
                      <div className="grid grid-cols-2 gap-3">
                        {selectedQuote?.delivery_timeline && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">📅 Delivery</p>
                            <p className="text-sm font-medium text-gray-900">{selectedQuote.delivery_timeline}</p>
                          </div>
                        )}
                        {selectedQuote?.validity_days && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">⏰ Valid For</p>
                            <p className="text-sm font-medium text-gray-900">{selectedQuote.validity_days} days</p>
                          </div>
                        )}
                        {selectedQuote?.warranty && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">🛡️ Warranty</p>
                            <p className="text-sm font-medium text-gray-900">{selectedQuote.warranty}</p>
                          </div>
                        )}
                        {selectedQuote?.payment_terms && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">💳 Payment</p>
                            <p className="text-sm font-medium text-gray-900">{selectedQuote.payment_terms}</p>
                          </div>
                        )}
                      </div>

                      {/* Inclusions/Exclusions */}
                      {(selectedQuote?.inclusions || selectedQuote?.exclusions) && (
                        <div className="space-y-3">
                          {selectedQuote?.inclusions && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="text-xs font-medium text-green-800 mb-1">✓ Includes</p>
                              <p className="text-sm text-green-700">{selectedQuote.inclusions}</p>
                            </div>
                          )}
                          {selectedQuote?.exclusions && (
                            <div className="bg-red-50 rounded-lg p-3">
                              <p className="text-xs font-medium text-red-800 mb-1">✗ Excludes</p>
                              <p className="text-sm text-red-700">{selectedQuote.exclusions}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message */}
                      {(selectedQuote?.message || selectedQuote?.description) && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Your Message</h4>
                          <p className="text-sm text-gray-700">{selectedQuote?.message || selectedQuote?.description}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 text-center pt-2">
                        Submitted: {new Date(selectedQuote?.created_at).toLocaleDateString()} • 
                        Accepted: {selectedQuote?.updated_at ? new Date(selectedQuote.updated_at).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-5 pb-5 flex gap-3">
              {assignmentRfq?.buyer && (
                <button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setContactBuyer(assignmentRfq.buyer);
                    setShowContactModal(true);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contact Buyer
                </button>
              )}
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setAssignmentRfq(null);
                  setSelectedQuote(null);
                  setAssignmentTab('rfq');
                }}
                className={`${assignmentRfq?.buyer ? 'flex-1' : 'w-full'} px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition`}
              >
                Close
              </button>
            </div>
          </div>
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
