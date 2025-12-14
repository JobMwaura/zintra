'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Mail, FileText, Settings, LogOut, Home, CreditCard, BarChart3, User, 
  Save, AlertCircle, Check, Send, Search, Plus, Calendar, Eye, Users, 
  Zap, TrendingUp, Eye as EyeIcon, X, Clock, MapPin, DollarSign
} from 'lucide-react';

export default function AdminDashboard() {
  // Main state
  const [activeMenu, setActiveMenu] = useState('home');
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // RFQ Management State
  const [pendingRFQs, setPendingRFQs] = useState([]);
  const [activeRFQs, setActiveRFQs] = useState([]);
  const [closedRFQs, setClosedRFQs] = useState([]);
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [vendorStats, setVendorStats] = useState({});
  const [rfqsLoading, setRFQsLoading] = useState(false);

  // Create RFQ State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    category: 'General',
    budget_range: '',
    location: '',
    timeline: '',
    description: '',
  });
  const [creatingRFQ, setCreatingRFQ] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalVendors: 0,
    totalRFQs: 0,
    totalResponses: 0,
    averageResponseRate: 0,
  });

  // Initial load
  useEffect(() => {
    fetchAdminData();
    fetchAllRFQs();
    fetchAnalytics();
  }, []);

  // Fetch admin profile - FIXED VERSION
  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('User error:', userError);
        setMessage('Error: Please log in again');
        setLoading(false);
        return;
      }

      console.log('Current user ID:', currentUser.id);
      setUser(currentUser);

      // FIXED: Use maybeSingle and better error handling
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id, user_id, role, status')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      console.log('Admin query response:', { adminData, error: adminError });

      // Only show error if it's not a "no rows" error
      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Admin fetch error:', adminError);
        setMessage(`Access denied: ${adminError.message}`);
        setLoading(false);
        return;
      }

      if (!adminData) {
        console.error('No admin record found for user:', currentUser.id);
        setMessage('Access denied: You are not registered as an admin');
        setLoading(false);
        return;
      }

      if (adminData.status !== 'active') {
        console.error('Admin status is not active:', adminData.status);
        setMessage('Access denied: Your admin account is not active');
        setLoading(false);
        return;
      }

      console.log('Admin access granted:', adminData);
      setAdmin(adminData);
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchAdminData:', err);
      setMessage(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  // Fetch all RFQs by status
  const fetchAllRFQs = async () => {
    try {
      setRFQsLoading(true);

      // Fetch pending RFQs
      const { data: pending } = await supabase
        .from('rfqs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Fetch active RFQs
      const { data: active } = await supabase
        .from('rfqs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      // Fetch closed RFQs
      const { data: closed } = await supabase
        .from('rfqs')
        .select('*')
        .eq('status', 'closed')
        .order('created_at', { ascending: false });

      setPendingRFQs(pending || []);
      setActiveRFQs(active || []);
      setClosedRFQs(closed || []);

      // Fetch vendor stats for each RFQ
      const statsMap = {};
      
      // Get stats for all RFQs
      const allRFQs = [...(pending || []), ...(active || []), ...(closed || [])];
      
      for (const rfq of allRFQs) {
        // Count how many vendors got this RFQ
        const { count: requestCount } = await supabase
          .from('rfq_requests')
          .select('*', { count: 'exact', head: true })
          .eq('rfq_id', rfq.id);

        // Count how many responded
        const { count: responseCount } = await supabase
          .from('rfq_responses')
          .select('*', { count: 'exact', head: true })
          .eq('rfq_id', rfq.id);

        statsMap[rfq.id] = {
          vendorsSent: requestCount || 0,
          responsesReceived: responseCount || 0,
          responseRate: requestCount > 0 ? Math.round((responseCount / requestCount) * 100) : 0,
        };
      }

      setVendorStats(statsMap);
      setRFQsLoading(false);
    } catch (err) {
      console.error('Error fetching RFQs:', err);
      setMessage(`Error loading RFQs: ${err.message}`);
      setRFQsLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      // Total vendors
      const { count: vendorCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      // Total RFQs
      const { count: rfqCount } = await supabase
        .from('rfqs')
        .select('*', { count: 'exact', head: true });

      // Total responses
      const { count: responseCount } = await supabase
        .from('rfq_responses')
        .select('*', { count: 'exact', head: true });

      // Total requests sent
      const { count: requestCount } = await supabase
        .from('rfq_requests')
        .select('*', { count: 'exact', head: true });

      const avgResponseRate = requestCount > 0 ? Math.round((responseCount / requestCount) * 100) : 0;

      setAnalytics({
        totalVendors: vendorCount || 0,
        totalRFQs: rfqCount || 0,
        totalResponses: responseCount || 0,
        averageResponseRate: avgResponseRate,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Create new RFQ
  const handleCreateRFQ = async (e) => {
    e.preventDefault();

    try {
      setCreatingRFQ(true);
      setMessage('');

      if (!createFormData.title.trim()) {
        setMessage('❌ Title is required');
        setCreatingRFQ(false);
        return;
      }

      const { error } = await supabase
        .from('rfqs')
        .insert([{
          ...createFormData,
          user_id: user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
        }]);

      if (error) {
        setMessage(`❌ Error creating RFQ: ${error.message}`);
        setCreatingRFQ(false);
        return;
      }

      setMessage('✅ RFQ created! Now approve it to broadcast to vendors.');
      setCreateFormData({
        title: '',
        category: 'General',
        budget_range: '',
        location: '',
        timeline: '',
        description: '',
      });
      setShowCreateModal(false);
      
      setTimeout(() => {
        fetchAllRFQs();
      }, 1500);

      setCreatingRFQ(false);
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
      setCreatingRFQ(false);
    }
  };

  // Approve RFQ and broadcast to vendors
  const handleApproveAndBroadcast = async (rfq) => {
    try {
      setMessage('');

      // Step 1: Update RFQ status to 'open'
      const { error: updateError } = await supabase
        .from('rfqs')
        .update({ status: 'open' })
        .eq('id', rfq.id);

      if (updateError) {
        setMessage(`❌ Error approving RFQ: ${updateError.message}`);
        return;
      }

      // Step 2: Get all vendors with matching category
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, user_id')
        .eq('category', rfq.category)
        .eq('status', 'active');

      if (vendorError) {
        setMessage(`❌ Error fetching vendors: ${vendorError.message}`);
        return;
      }

      if (!vendors || vendors.length === 0) {
        setMessage('⚠️ No active vendors in this category to broadcast to');
        return;
      }

      // Step 3: Create rfq_requests for each vendor
      const rfqRequests = vendors.map(vendor => ({
        rfq_id: rfq.id,
        vendor_id: vendor.user_id || vendor.id,
        user_id: user.id,
        status: 'pending',
        created_at: new Date().toISOString(),
      }));

      const { error: requestError } = await supabase
        .from('rfq_requests')
        .insert(rfqRequests);

      if (requestError) {
        setMessage(`❌ Error broadcasting to vendors: ${requestError.message}`);
        return;
      }

      setMessage(`✅ RFQ approved and sent to ${vendors.length} vendors in the ${rfq.category} category!`);
      setShowBroadcastModal(false);
      setSelectedRFQ(null);

      // Refresh data
      setTimeout(() => {
        fetchAllRFQs();
        fetchAnalytics();
      }, 1500);
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  // Reject RFQ
  const handleRejectRFQ = async (rfqId) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'rejected' })
        .eq('id', rfqId);

      if (error) {
        setMessage(`❌ Error rejecting RFQ: ${error.message}`);
        return;
      }

      setMessage('✅ RFQ rejected');
      setSelectedRFQ(null);

      setTimeout(() => {
        fetchAllRFQs();
      }, 1500);
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  // Close RFQ
  const handleCloseRFQ = async (rfqId) => {
    try {
      const { error } = await supabase
        .from('rfqs')
        .update({ status: 'closed' })
        .eq('id', rfqId);

      if (error) {
        setMessage(`❌ Error closing RFQ: ${error.message}`);
        return;
      }

      setMessage('✅ RFQ closed');
      setSelectedRFQ(null);

      setTimeout(() => {
        fetchAllRFQs();
      }, 1500);
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (err) {
      setMessage(`❌ Error logging out: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">Access Denied</p>
          <p className="text-gray-600 text-sm">You don't have admin access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">RFQ Management System</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200'
              : message.includes('⚠️')
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow p-4 sticky top-24">
              <ul className="space-y-2">
                {[
                  { id: 'home', label: 'Dashboard', icon: Home },
                  { id: 'pending', label: 'Pending RFQs', icon: Clock },
                  { id: 'active', label: 'Active RFQs', icon: Zap },
                  { id: 'closed', label: 'Closed RFQs', icon: FileText },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { id: 'vendors', label: 'Vendors', icon: Users },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map(item => {
                  const IconComponent = item.icon;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveMenu(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                          activeMenu === item.id
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3 space-y-6">
            {/* HOME TAB - Dashboard Overview */}
            {activeMenu === 'home' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
                    <p className="text-sm text-gray-600 mb-1">Total Vendors</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalVendors}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
                    <p className="text-sm text-gray-600 mb-1">Total RFQs</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalRFQs}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
                    <p className="text-sm text-gray-600 mb-1">Total Responses</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.totalResponses}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
                    <p className="text-sm text-gray-600 mb-1">Avg Response Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{analytics.averageResponseRate}%</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      Create New RFQ
                    </button>
                    <button
                      onClick={() => setActiveMenu('pending')}
                      className="flex items-center gap-3 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                    >
                      <Clock className="w-5 h-5" />
                      Review Pending ({pendingRFQs.length})
                    </button>
                    <button
                      onClick={() => setActiveMenu('analytics')}
                      className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      <BarChart3 className="w-5 h-5" />
                      View Analytics
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent RFQs</h3>
                  {rfqsLoading ? (
                    <p className="text-gray-600">Loading...</p>
                  ) : pendingRFQs.length > 0 ? (
                    <div className="space-y-3">
                      {pendingRFQs.slice(0, 5).map(rfq => (
                        <div key={rfq.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{rfq.title}</p>
                            <p className="text-sm text-gray-600">{rfq.category}</p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                            Pending
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-center py-8">No pending RFQs</p>
                  )}
                </div>
              </div>
            )}

            {/* PENDING RFQs TAB */}
            {activeMenu === 'pending' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Pending RFQs ({pendingRFQs.length})</h2>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    New RFQ
                  </button>
                </div>

                {rfqsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : pendingRFQs.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-blue-900 font-medium">No Pending RFQs</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRFQs.map(rfq => (
                      <div key={rfq.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-600">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{rfq.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{rfq.description}</p>
                          </div>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                            Pending Review
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 py-4 border-t border-b border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500">Category</p>
                            <p className="font-semibold text-gray-900">{rfq.category}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Budget</p>
                            <p className="font-semibold text-gray-900">{rfq.budget_range}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="font-semibold text-gray-900">{rfq.location}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Timeline</p>
                            <p className="font-semibold text-gray-900">{rfq.timeline}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedRFQ(rfq);
                              setShowBroadcastModal(true);
                            }}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Approve & Broadcast
                          </button>
                          <button
                            onClick={() => handleRejectRFQ(rfq.id)}
                            className="flex-1 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ACTIVE RFQs TAB */}
            {activeMenu === 'active' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Active RFQs ({activeRFQs.length})</h2>

                {rfqsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : activeRFQs.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <Zap className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-blue-900 font-medium">No Active RFQs</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeRFQs.map(rfq => {
                      const stats = vendorStats[rfq.id] || { vendorsSent: 0, responsesReceived: 0, responseRate: 0 };
                      return (
                        <div key={rfq.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{rfq.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{rfq.description}</p>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              Active
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 py-4 border-t border-b border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500">Vendors Sent</p>
                              <p className="text-lg font-bold text-gray-900">{stats.vendorsSent}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Responses</p>
                              <p className="text-lg font-bold text-green-600">{stats.responsesReceived}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Response Rate</p>
                              <p className="text-lg font-bold text-blue-600">{stats.responseRate}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Posted</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(rfq.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCloseRFQ(rfq.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                          >
                            Close RFQ
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CLOSED RFQs TAB */}
            {activeMenu === 'closed' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Closed RFQs ({closedRFQs.length})</h2>

                {rfqsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  </div>
                ) : closedRFQs.length === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
                    <FileText className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-blue-900 font-medium">No Closed RFQs</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {closedRFQs.map(rfq => {
                      const stats = vendorStats[rfq.id] || { vendorsSent: 0, responsesReceived: 0, responseRate: 0 };
                      return (
                        <div key={rfq.id} className="bg-white rounded-lg shadow p-6 border-l-4 border-gray-600">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{rfq.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{rfq.description}</p>
                            </div>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                              Closed
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-4 border-t border-b border-gray-100">
                            <div>
                              <p className="text-xs text-gray-500">Vendors Sent</p>
                              <p className="text-lg font-bold text-gray-900">{stats.vendorsSent}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Responses</p>
                              <p className="text-lg font-bold text-green-600">{stats.responsesReceived}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Response Rate</p>
                              <p className="text-lg font-bold text-blue-600">{stats.responseRate}%</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Closed</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(rfq.updated_at || rfq.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeMenu === 'analytics' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics & Reports</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Vendors:</span>
                        <span className="font-bold text-gray-900">{analytics.totalVendors}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total RFQs:</span>
                        <span className="font-bold text-gray-900">{analytics.totalRFQs}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Active RFQs:</span>
                        <span className="font-bold text-gray-900">{activeRFQs.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Pending RFQs:</span>
                        <span className="font-bold text-gray-900">{pendingRFQs.length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Responses:</span>
                        <span className="font-bold text-gray-900">{analytics.totalResponses}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg Response Rate:</span>
                        <span className="font-bold text-green-600">{analytics.averageResponseRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-bold text-blue-600">Healthy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VENDORS TAB */}
            {activeMenu === 'vendors' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Vendor Management</h2>
                <p className="text-gray-600">Vendor management features coming soon...</p>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeMenu === 'settings' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
                <p className="text-gray-600">Admin settings coming soon...</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Create RFQ Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Create New RFQ</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateRFQ} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={createFormData.title}
                  onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                  placeholder="e.g., Office Renovation"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={createFormData.category}
                  onChange={(e) => setCreateFormData({ ...createFormData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="General">General</option>
                  <option value="Construction Materials">Construction Materials</option>
                  <option value="Hardware & Tools">Hardware & Tools</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Paint & Coatings">Paint & Coatings</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                <input
                  type="text"
                  value={createFormData.budget_range}
                  onChange={(e) => setCreateFormData({ ...createFormData, budget_range: e.target.value })}
                  placeholder="e.g., KSh 100,000 - KSh 500,000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={createFormData.location}
                  onChange={(e) => setCreateFormData({ ...createFormData, location: e.target.value })}
                  placeholder="e.g., Nairobi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
                <input
                  type="text"
                  value={createFormData.timeline}
                  onChange={(e) => setCreateFormData({ ...createFormData, timeline: e.target.value })}
                  placeholder="e.g., 2 weeks"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  placeholder="Detailed description of the project..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={creatingRFQ}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  {creatingRFQ ? 'Creating...' : 'Create RFQ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Confirmation Modal */}
      {showBroadcastModal && selectedRFQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve & Broadcast RFQ?</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-2"><strong>Title:</strong> {selectedRFQ.title}</p>
                <p className="text-sm text-gray-600 mb-2"><strong>Category:</strong> {selectedRFQ.category}</p>
                <p className="text-sm text-gray-600"><strong>Action:</strong> Will be sent to all active vendors in the {selectedRFQ.category} category</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApproveAndBroadcast(selectedRFQ)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  Approve & Broadcast
                </button>
                <button
                  onClick={() => {
                    setShowBroadcastModal(false);
                    setSelectedRFQ(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
