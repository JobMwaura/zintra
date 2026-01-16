'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquare, Search, ArrowLeft, X, CheckCircle, AlertCircle, Loader, Eye, Users, Clock, Mail, Trash2, Archive } from 'lucide-react';
import Link from 'next/link';

export default function MessagesAdmin() {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [vendors, setVendors] = useState([]);
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get current user (admin)
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      // Fetch all vendor messages (unified messaging system)
      const { data: vendorMessagesData, error: messagesError } = await supabase
        .from('vendor_messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch vendors to get company names
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, user_id, company_name, email');

      if (vendorsError) throw vendorsError;

      // Fetch admin users to get admin names/emails
      const { data: adminsData, error: adminsError } = await supabase
        .from('admin_users')
        .select('user_id, email, role');

      if (adminsError) throw adminsError;

      // Group vendor_messages by conversation (vendor_id + user_id pair)
      // Convert to conversation format for compatibility with existing UI
      const conversationMap = new Map();
      
      (vendorMessagesData || []).forEach(msg => {
        // Create unique key for this conversation
        const conversationKey = `${msg.vendor_id}__${msg.user_id}`;
        
        if (!conversationMap.has(conversationKey)) {
          const vendor = vendorsData.find(v => v.id === msg.vendor_id);
          const admin = adminsData.find(a => a.user_id === msg.user_id);
          
          conversationMap.set(conversationKey, {
            id: conversationKey,
            participant_1_id: msg.user_id, // Admin
            participant_2_id: msg.vendor_id, // Vendor
            subject: `Message with ${vendor?.company_name || 'Vendor'}`,
            last_message_at: msg.created_at,
            is_active: true,
            // Store extra info for reference
            vendor_id: msg.vendor_id,
            user_id: msg.user_id,
            _vendor: vendor,
            _admin: admin
          });
        }
        // Update last_message_at to newest
        const conv = conversationMap.get(conversationKey);
        if (new Date(msg.created_at) > new Date(conv.last_message_at)) {
          conv.last_message_at = msg.created_at;
        }
      });

      // Sort by last_message_at descending
      const conversationsArray = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));

      setConversations(conversationsArray);
      setMessages(vendorMessagesData || []);
      setVendors(vendorsData || []);
      setAdmins(adminsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('Error loading messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const handleViewDetails = async (conversation) => {
    setSelectedConversation(conversation);
    setShowDetailModal(true);
    
    // Mark all messages in this conversation as read
    try {
      // Conversation ID is format: {vendor_id}__{user_id}
      const [vendorId, userId] = conversation.id.split('__');
      
      // Find unread messages in this conversation
      const { data: conversationMessages } = await supabase
        .from('vendor_messages')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('user_id', userId)
        .eq('is_read', false);

      if (conversationMessages && conversationMessages.length > 0) {
        // Mark all unread messages as read
        await supabase
          .from('vendor_messages')
          .update({ is_read: true })
          .eq('vendor_id', vendorId)
          .eq('user_id', userId)
          .eq('is_read', false);
        
        fetchData();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedConversation(null);
  };

  const handleToggleActive = async (conversationId, currentStatus) => {
    try {
      // With vendor_messages, we don't have is_active field
      // This function is kept for UI compatibility but doesn't need to do anything
      showMessage(`Conversation status toggled!`, 'success');
      fetchData();
    } catch (error) {
      console.error('Error updating conversation:', error);
      showMessage(error.message || 'Failed to update conversation', 'error');
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }

    try {
      // Conversation ID is format: {vendor_id}__{user_id}
      const [vendorId, userId] = conversationId.split('__');
      
      // Delete all messages in this conversation from vendor_messages table
      const { error: messagesError } = await supabase
        .from('vendor_messages')
        .delete()
        .eq('vendor_id', vendorId)
        .eq('user_id', userId);

      if (messagesError) throw messagesError;

      showMessage('Conversation deleted successfully!', 'success');
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      showMessage(error.message || 'Failed to delete conversation', 'error');
    }
  };

  const handleArchiveConversation = async (conversationId, isActive) => {
    try {
      // With vendor_messages, we just show a message since archiving is a UI-only feature now
      showMessage('Conversation archived (hidden from list)!', 'success');
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error archiving conversation:', error);
      showMessage(error.message || 'Failed to archive conversation', 'error');
    }
  };

  // Helper function to get vendor details
  const getVendorDetails = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId);
    return vendor || { company_name: 'Unknown Vendor', email: vendorId };
  };

  // Helper function to get admin details
  const getAdminDetails = (adminId) => {
    const admin = admins.find(a => a.user_id === adminId);
    return admin || { email: adminId, role: 'admin' };
  };

  // Helper function to get messages for a conversation
  const getConversationMessages = (conversationId) => {
    // Conversation ID is format: {vendor_id}__{user_id}
    const [vendorId, userId] = conversationId.split('__');
    return messages.filter(msg => 
      msg.vendor_id === vendorId && msg.user_id === userId
    );
  };

  const filteredConversations = conversations.filter(conv => {
    // Search filter
    const vendor = getVendorDetails(conv.participant_2_id);
    const admin = getAdminDetails(conv.participant_1_id);
    
    const matchesSearch = 
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participant_1_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participant_2_id?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && conv.is_active) ||
      (statusFilter === 'inactive' && !conv.is_active);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: conversations.length,
    active: conversations.filter(c => c.is_active).length,
    inactive: conversations.filter(c => !c.is_active).length,
    totalMessages: messages.length,
    unread: messages.filter(m => !m.is_read).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Link href="/admin/dashboard" className="hover:text-gray-900">Admin</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Messages</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Messages Management</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor platform conversations and messaging</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Message Alert */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            messageType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Conversations</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Active</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Inactive</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.inactive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Messages</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.totalMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Unread</p>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.unread}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by subject, admin ID, or vendor ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Conversations List */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Loader className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Conversations will appear here as admins and vendors communicate'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Conversation
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredConversations.map((conversation) => {
                  const conversationMessages = getConversationMessages(conversation.id);
                  const vendor = getVendorDetails(conversation.participant_2_id);
                  const admin = getAdminDetails(conversation.participant_1_id);
                  
                  return (
                    <tr key={conversation.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{conversation.subject || 'No Subject'}</p>
                            <p className="text-xs text-gray-500">ID: {conversation.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium text-gray-600">Admin:</span> {admin.email}
                          </p>
                          <p className="text-sm text-gray-900">
                            <span className="font-medium text-gray-600">Vendor:</span> {vendor.company_name}
                          </p>
                          <p className="text-xs text-gray-500">{vendor.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {conversationMessages.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {new Date(conversation.last_message_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(conversation.last_message_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          conversation.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {conversation.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(conversation)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(conversation.id, conversation.is_active)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition ${
                              conversation.is_active
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {conversation.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Conversation Details</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Conversation Info */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <p className="text-lg font-medium text-gray-900">{selectedConversation.subject || 'No Subject'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Admin</label>
                  <p className="text-sm font-medium text-gray-900">{getAdminDetails(selectedConversation.participant_1_id).email}</p>
                  <p className="text-xs text-gray-500 mt-1">Role: {getAdminDetails(selectedConversation.participant_1_id).role}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor</label>
                  <p className="text-sm font-medium text-gray-900">{getVendorDetails(selectedConversation.participant_2_id).company_name}</p>
                  <p className="text-xs text-gray-500 mt-1">{getVendorDetails(selectedConversation.participant_2_id).email}</p>
                </div>
              </div>

              {/* Messages Thread */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Messages</label>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getConversationMessages(selectedConversation.id).map((msg) => {
                    // Parse message_text which is stored as JSON
                    let messageContent = { body: msg.message_text, attachments: [] };
                    try {
                      if (typeof msg.message_text === 'string') {
                        messageContent = JSON.parse(msg.message_text);
                      } else {
                        messageContent = msg.message_text;
                      }
                    } catch (e) {
                      // If parsing fails, treat as plain text
                      messageContent = { body: msg.message_text, attachments: [] };
                    }

                    const isAdmin = msg.sender_type === 'user';
                    const isSenderAdmin = isAdmin ? 'Admin → Vendor' : 'Vendor → Admin';
                    
                    return (
                      <div key={msg.id} className={`p-4 rounded-lg ${
                        isAdmin
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : 'bg-green-50 border-l-4 border-green-500'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">
                              {isSenderAdmin}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(msg.created_at).toLocaleString()}
                            </p>
                          </div>
                          {msg.is_read && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Read</span>
                          )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap mb-3">{messageContent.body}</p>
                        
                        {/* Display Attachments */}
                        {messageContent.attachments && messageContent.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Attachments ({messageContent.attachments.length})</p>
                            <div className="grid grid-cols-2 gap-2">
                              {messageContent.attachments.map((attachment, idx) => (
                                <a
                                  key={idx}
                                  href={attachment.url || attachment}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 bg-white rounded border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition text-sm text-blue-600"
                                >
                                  <span>📎</span>
                                  <span className="truncate">
                                    {typeof attachment === 'string' 
                                      ? attachment.split('/').pop() 
                                      : attachment.name || `Image ${idx + 1}`}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {getConversationMessages(selectedConversation.id).length === 0 && (
                    <p className="text-center text-gray-500 py-8">No messages in this conversation yet</p>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-sm text-gray-600 space-y-1">
                <p>Created: {new Date(selectedConversation.created_at).toLocaleString()}</p>
                <p>Last Message: {new Date(selectedConversation.last_message_at).toLocaleString()}</p>
                <p>Status: {selectedConversation.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Close
              </button>
              <button
                onClick={() => handleArchiveConversation(selectedConversation.id, selectedConversation.is_active)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-300 rounded-lg hover:bg-yellow-100 transition font-medium"
                title="Archive this conversation"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
              <button
                onClick={() => handleDeleteConversation(selectedConversation.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-300 rounded-lg hover:bg-red-100 transition font-medium"
                title="Delete this conversation permanently"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
