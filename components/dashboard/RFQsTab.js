'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Search, Filter, Plus, Eye, Send, DollarSign, Calendar, MapPin, AlertCircle, Check, X, User, Clock, Mail, Phone } from 'lucide-react';

export default function RFQsTab() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  
  // RFQ data states
  const [userRFQs, setUserRFQs] = useState([]); // From rfq_requests (user → vendor)
  const [adminRFQs, setAdminRFQs] = useState([]); // From rfqs (admin broadcast)
  const [myResponses, setMyResponses] = useState([]); // From rfq_responses
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('user-rfqs'); // 'user-rfqs', 'admin-rfqs', 'my-responses'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseData, setResponseData] = useState({
    amount: '',
    message: '',
    attachment_url: '',
  });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  
  // Contact Buyer Modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactBuyer, setContactBuyer] = useState(null);
  const [contactRfqTitle, setContactRfqTitle] = useState('');
  const [loadingContact, setLoadingContact] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage('');

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        setMessage('❌ Please log in');
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Get vendor profile
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (vendorData) {
        setVendor(vendorData);
      }

      // ===== FETCH USER RFQs (from rfq_requests) =====
      const { data: userRfqRequests, error: userRfqError } = await supabase
        .from('rfq_requests')
        .select(`
          *,
          rfqs:rfq_id (*)
        `)
        .eq('vendor_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (userRfqError) {
        console.error('Error fetching user RFQs:', userRfqError);
      } else {
        setUserRFQs(userRfqRequests || []);
      }

      // ===== FETCH ADMIN RFQs (broadcast by category) =====
      if (vendorData?.category) {
        const { data: adminRfqs, error: adminRfqError } = await supabase
          .from('rfqs')
          .select('*')
          .eq('status', 'open')
          .eq('category', vendorData.category)
          .order('created_at', { ascending: false });

        if (adminRfqError) {
          console.error('Error fetching admin RFQs:', adminRfqError);
        } else {
          setAdminRFQs(adminRfqs || []);
        }
      }

      // ===== FETCH MY RESPONSES =====
      // Use vendor.id (from vendors table), not currentUser.id (auth user)
      if (vendorData?.id) {
        console.log('DEBUG: Fetching responses for vendor_id:', vendorData.id);
        const { data: responses, error: responseError } = await supabase
          .from('rfq_responses')
          .select(`
            *,
            rfqs:rfq_id (*),
            rfq_requests:rfq_id (*)
          `)
          .eq('vendor_id', vendorData.id)
          .order('created_at', { ascending: false });

        console.log('DEBUG: Responses fetched:', responses?.length, 'responses');
        console.log('DEBUG: Response statuses:', responses?.map(r => ({ id: r.id, status: r.status })));

        if (responseError) {
          console.error('Error fetching responses:', responseError);
        } else {
          setMyResponses(responses || []);
        }
      } else {
        console.log('DEBUG: No vendor profile found, cannot fetch responses');
        setMyResponses([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage(`❌ Error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();

    // Validate amount (must be a positive number)
    const amount = parseFloat(responseData.amount);
    if (!responseData.amount || isNaN(amount) || amount <= 0) {
      setMessage('❌ Please enter a valid quote amount (must be greater than 0)');
      return;
    }

    if (!responseData.message.trim()) {
      setMessage('❌ Please write a message');
      return;
    }

    try {
      setSending(true);
      setMessage('');

      const { error } = await supabase
        .from('rfq_responses')
        .insert([{
          rfq_id: selectedRFQ.rfq_id || selectedRFQ.id,
          vendor_id: user.id,
          amount: amount,
          message: responseData.message,
          attachment_url: responseData.attachment_url || null,
        }]);

      if (error) {
        console.error('Error submitting response:', error);
        setMessage(`❌ Error: ${error.message}`);
        setSending(false);
        return;
      }

      setMessage('✅ Quote submitted successfully!');
      setShowResponseForm(false);
      setSelectedRFQ(null);
      setResponseData({ amount: '', message: '', attachment_url: '' });
      
      setTimeout(() => {
        fetchData();
      }, 2000);

      setSending(false);
    } catch (err) {
      console.error('Error submitting response:', err);
      setMessage(`❌ Error: ${err.message}`);
      setSending(false);
    }
  };

  // Handle Contact Buyer button click
  const handleContactBuyer = async (response) => {
    setLoadingContact(true);
    setShowContactModal(true);
    setContactRfqTitle(response.rfqs?.title || 'Project');
    
    try {
      // Get buyer info from the RFQ
      const buyerId = response.rfqs?.user_id;
      
      if (!buyerId) {
        setContactBuyer({ error: 'Buyer information not available' });
        setLoadingContact(false);
        return;
      }

      // Fetch buyer profile
      const { data: buyerData, error: buyerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', buyerId)
        .maybeSingle();

      if (buyerError || !buyerData) {
        setContactBuyer({ error: 'Could not load buyer details' });
      } else {
        setContactBuyer(buyerData);
      }
    } catch (err) {
      console.error('Error fetching buyer:', err);
      setContactBuyer({ error: 'Error loading buyer details' });
    }
    
    setLoadingContact(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading RFQs...</p>
        </div>
      </div>
    );
  }

  // ========================================
  // USER RFQs TAB (Individual users sent to you)
  // ========================================
  if (activeTab === 'user-rfqs') {
    return (
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('user-rfqs')}
            className={`pb-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'user-rfqs'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            User RFQs ({userRFQs.length})
          </button>
          <button
            onClick={() => setActiveTab('admin-rfqs')}
            className={`pb-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'admin-rfqs'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Admin RFQs ({adminRFQs.length})
          </button>
          <button
            onClick={() => setActiveTab('my-responses')}
            className={`pb-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'my-responses'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Quotes ({myResponses.length})
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.includes('✅') ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search RFQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* User RFQs List */}
        {userRFQs.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <p className="text-blue-900 font-medium mb-2">No RFQs from Users</p>
            <p className="text-blue-700 text-sm">
              Users can send you individual RFQs. They'll appear here when they do!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userRFQs
              .filter(rfq =>
                rfq.rfqs?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rfq.rfqs?.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rfq.rfqs?.location?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(rfqReq => (
                <div
                  key={rfqReq.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 border-blue-600 p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{rfqReq.rfqs?.title || 'Project'}</h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        From: {rfqReq.rfqs?.buyer_id ? 'User' : 'Unknown'}
                      </p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      Direct Invite
                    </span>
                  </div>

                  {/* RFQ Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-t border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget</p>
                      <p className="font-semibold text-gray-900">{rfqReq.rfqs?.budget_range || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Location
                      </p>
                      <p className="font-semibold text-gray-900">{rfqReq.rfqs?.location || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Timeline
                      </p>
                      <p className="font-semibold text-gray-900">{rfqReq.rfqs?.timeline || 'Flexible'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Sent</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(rfqReq.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {rfqReq.rfqs?.description && (
                    <p className="text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded">
                      {rfqReq.rfqs.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedRFQ({ ...rfqReq.rfqs, rfq_id: rfqReq.rfq_id });
                        setShowResponseForm(true);
                      }}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Submit Quote
                    </button>
                    <button
                      onClick={() => setSelectedRFQ(rfqReq.rfqs)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Response Form Modal */}
        {showResponseForm && selectedRFQ && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Submit Quote</h3>
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseData({ amount: '', message: '', attachment_url: '' });
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitResponse} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quote Amount (KSh) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={responseData.amount}
                      onChange={(e) => setResponseData({ ...responseData, amount: e.target.value })}
                      placeholder="Enter your quote amount"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Proposal Message *</label>
                  <textarea
                    value={responseData.message}
                    onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                    placeholder="Describe your approach, timeline, and why you're the best fit..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Link (Optional)</label>
                  <input
                    type="url"
                    value={responseData.attachment_url}
                    onChange={(e) => setResponseData({ ...responseData, attachment_url: e.target.value })}
                    placeholder="Link to your portfolio or document"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
                  >
                    {sending ? 'Submitting...' : 'Submit Quote'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResponseForm(false);
                      setResponseData({ amount: '', message: '', attachment_url: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // ADMIN RFQs TAB (Broadcast by category)
  // ========================================
  if (activeTab === 'admin-rfqs') {
    return (
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('user-rfqs')}
            className={`pb-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'user-rfqs'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            User RFQs ({userRFQs.length})
          </button>
          <button
            onClick={() => setActiveTab('admin-rfqs')}
            className={`pb-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'admin-rfqs'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Admin RFQs ({adminRFQs.length})
          </button>
          <button
            onClick={() => setActiveTab('my-responses')}
            className={`pb-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'my-responses'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Quotes ({myResponses.length})
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.includes('✅') ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Admin RFQs List */}
        {adminRFQs.length === 0 ? (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-8 text-center">
            <FileText className="w-12 h-12 text-purple-600 mx-auto mb-3" />
            <p className="text-purple-900 font-medium mb-2">No Admin RFQs in Your Category</p>
            <p className="text-purple-700 text-sm">
              Admin will broadcast RFQs in your category here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {adminRFQs
              .filter(rfq =>
                rfq.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rfq.category?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(rfq => (
                <div
                  key={rfq.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 border-purple-600 p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{rfq.title || 'Project'}</h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Broadcast from Admin
                      </p>
                    </div>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                      Broadcast
                    </span>
                  </div>

                  {/* RFQ Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-t border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget</p>
                      <p className="font-semibold text-gray-900">{rfq.budget_range || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Location
                      </p>
                      <p className="font-semibold text-gray-900">{rfq.location || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Timeline
                      </p>
                      <p className="font-semibold text-gray-900">{rfq.timeline || 'Flexible'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Posted</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(rfq.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {rfq.description && (
                    <p className="text-sm text-gray-700 mb-4 p-3 bg-gray-50 rounded">
                      {rfq.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedRFQ(rfq);
                        setShowResponseForm(true);
                      }}
                      className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Submit Quote
                    </button>
                    <button
                      onClick={() => setSelectedRFQ(rfq)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Response Form Modal */}
        {showResponseForm && selectedRFQ && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Submit Quote</h3>
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setResponseData({ amount: '', message: '', attachment_url: '' });
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitResponse} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quote Amount (KSh) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={responseData.amount}
                      onChange={(e) => setResponseData({ ...responseData, amount: e.target.value })}
                      placeholder="Enter your quote amount"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Proposal Message *</label>
                  <textarea
                    value={responseData.message}
                    onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                    placeholder="Describe your approach, timeline, and why you're the best fit..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Portfolio Link (Optional)</label>
                  <input
                    type="url"
                    value={responseData.attachment_url}
                    onChange={(e) => setResponseData({ ...responseData, attachment_url: e.target.value })}
                    placeholder="Link to your portfolio or document"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={sending}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium"
                  >
                    {sending ? 'Submitting...' : 'Submit Quote'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowResponseForm(false);
                      setResponseData({ amount: '', message: '', attachment_url: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // MY RESPONSES TAB (All submitted quotes)
  // ========================================
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('user-rfqs')}
          className={`pb-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'user-rfqs'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          User RFQs ({userRFQs.length})
        </button>
        <button
          onClick={() => setActiveTab('admin-rfqs')}
          className={`pb-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'admin-rfqs'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Admin RFQs ({adminRFQs.length})
        </button>
        <button
          onClick={() => setActiveTab('my-responses')}
          className={`pb-3 px-4 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'my-responses'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          My Quotes ({myResponses.length})
        </button>
      </div>

      {/* My Responses List - Organized by Status */}
      {myResponses.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-green-900 font-medium mb-2">No Quotes Submitted Yet</p>
          <p className="text-green-700 text-sm mb-4">
            Go to "User RFQs" or "Admin RFQs" and submit your first quote!
          </p>
          <button
            onClick={() => setActiveTab('user-rfqs')}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
          >
            Browse RFQs
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ACCEPTED QUOTES SECTION - Highlighted First */}
          {(() => {
            const acceptedQuotes = myResponses.filter(r => r.status === 'accepted');
            if (acceptedQuotes.length === 0) return null;
            
            return (
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
                  {acceptedQuotes.map(response => (
                    <div
                      key={response.id}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition border-l-4 border-green-500 p-6"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="text-green-600">✓</span>
                            {response.rfqs?.title || 'Project'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Quote: <span className="font-semibold text-gray-900">KSh {parseFloat(response.amount).toLocaleString()}</span>
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
                            Great news! The buyer has accepted your quote and will be in touch soon with next steps.
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{response.message}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200 mb-4">
                        <span>📅 {new Date(response.created_at).toLocaleDateString()}</span>
                        {response.attachment_url && (
                          <a 
                            href={response.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:underline font-medium"
                          >
                            View Portfolio
                          </a>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => router.push(`/vendor/assignment/${response.id}`)}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Assignment
                        </button>
                        <button 
                          onClick={() => handleContactBuyer(response)}
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
            );
          })()}

          {/* PENDING QUOTES SECTION */}
          {(() => {
            const pendingQuotes = myResponses.filter(r => r.status === 'submitted');
            if (pendingQuotes.length === 0) return null;
            
            return (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⏳</span>
                  <h2 className="text-2xl font-bold text-yellow-900">Pending Responses</h2>
                  <span className="ml-auto bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full font-semibold text-sm">
                    {pendingQuotes.length}
                  </span>
                </div>
                <p className="text-yellow-700 font-medium mb-6">Waiting for buyers to review your quotes...</p>
                
                <div className="space-y-4">
                  {pendingQuotes.map(response => (
                    <div
                      key={response.id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 border-yellow-400 p-6"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {response.rfqs?.title || 'Project'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Quote: <span className="font-semibold text-gray-900">KSh {parseFloat(response.amount).toLocaleString()}</span>
                          </p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-2">
                          ⏳ Pending
                        </span>
                      </div>

                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{response.message}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200">
                        <span>📅 {new Date(response.created_at).toLocaleDateString()}</span>
                        {response.attachment_url && (
                          <a 
                            href={response.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:underline font-medium"
                          >
                            View Portfolio
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* REJECTED QUOTES SECTION */}
          {(() => {
            const rejectedQuotes = myResponses.filter(r => r.status === 'rejected');
            if (rejectedQuotes.length === 0) return null;
            
            return (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✗</span>
                  <h2 className="text-2xl font-bold text-red-900">Rejected</h2>
                  <span className="ml-auto bg-red-200 text-red-800 px-3 py-1 rounded-full font-semibold text-sm">
                    {rejectedQuotes.length}
                  </span>
                </div>
                <p className="text-red-700 font-medium mb-6">Better luck next time! You can still submit a new quote.</p>
                
                <div className="space-y-4">
                  {rejectedQuotes.map(response => (
                    <div
                      key={response.id}
                      className="bg-white rounded-lg shadow hover:shadow-lg transition border-l-4 border-red-300 p-6 opacity-90"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {response.rfqs?.title || 'Project'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Quote: <span className="font-semibold text-gray-900">KSh {parseFloat(response.amount).toLocaleString()}</span>
                          </p>
                        </div>
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-2">
                          ✗ Rejected
                        </span>
                      </div>

                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{response.message}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200">
                        <span>📅 {new Date(response.created_at).toLocaleDateString()}</span>
                        {response.attachment_url && (
                          <a 
                            href={response.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-600 hover:underline font-medium"
                          >
                            View Portfolio
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Contact Buyer Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Contact Buyer</h2>
                    <p className="text-blue-100 text-sm">{contactRfqTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowContactModal(false);
                    setContactBuyer(null);
                  }}
                  className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {loadingContact ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading buyer details...</p>
                </div>
              ) : contactBuyer?.error ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-gray-600">{contactBuyer.error}</p>
                </div>
              ) : contactBuyer ? (
                <div className="space-y-4">
                  {/* Buyer Profile */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {(contactBuyer.full_name || contactBuyer.email || 'B').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">
                        {contactBuyer.full_name || 'Buyer'}
                      </p>
                      <p className="text-sm text-gray-500">Project Owner</p>
                    </div>
                  </div>

                  {/* Contact Options */}
                  <div className="space-y-3">
                    {contactBuyer.email && (
                      <a
                        href={`mailto:${contactBuyer.email}?subject=Re: ${contactRfqTitle} - Quote Accepted&body=Hi ${contactBuyer.full_name || 'there'},%0D%0A%0D%0AThank you for accepting my quote for "${contactRfqTitle}".%0D%0A%0D%0AI'm excited to work with you on this project. Let's discuss the next steps.%0D%0A%0D%0ABest regards`}
                        className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition group"
                      >
                        <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center transition">
                          <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900">Send Email</p>
                          <p className="text-sm text-blue-600">{contactBuyer.email}</p>
                        </div>
                        <span className="text-blue-400">→</span>
                      </a>
                    )}

                    {contactBuyer.phone && (
                      <a
                        href={`tel:${contactBuyer.phone}`}
                        className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition group"
                      >
                        <div className="w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center transition">
                          <Phone className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-green-900">Call Now</p>
                          <p className="text-sm text-green-600">{contactBuyer.phone}</p>
                        </div>
                        <span className="text-green-400">→</span>
                      </a>
                    )}

                    {!contactBuyer.email && !contactBuyer.phone && (
                      <div className="text-center py-4 text-gray-500">
                        <p>No contact information available</p>
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-amber-800 font-medium text-sm mb-2">💡 Tips for first contact:</p>
                    <ul className="text-amber-700 text-sm space-y-1">
                      <li>• Introduce yourself professionally</li>
                      <li>• Confirm project requirements</li>
                      <li>• Discuss timeline and deliverables</li>
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactBuyer(null);
                }}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition"
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