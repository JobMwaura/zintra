'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Search, Plus, Send, Paperclip, AlertCircle, Check } from 'lucide-react';

export default function VendorMessages() {
  // Message type filter
  const [messageType, setMessageType] = useState('all'); // 'all', 'customers', 'admin'
  
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(''); // Status message

  useEffect(() => {
    fetchConversations();
  }, []);

  // ✅ FIXED: Better conversation fetching with error handling
  const fetchConversations = async () => {
    try {
      setLoading(true);
      setMessage('');

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('Auth error:', userError);
        setMessage('❌ Error: Please log in again');
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // ✅ Get conversations (adjust table name if different)
      const { data: allConversations, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_1_id,
          participant_2_id,
          conversation_type,
          last_message_at,
          created_at
        `)
        .or(`participant_1_id.eq.${currentUser.id},participant_2_id.eq.${currentUser.id}`)
        .order('last_message_at', { ascending: false });

      if (convError) {
        console.error('Error fetching conversations:', convError);
        setMessage(`❌ Error loading conversations: ${convError.message}`);
        setLoading(false);
        return;
      }

      if (allConversations && allConversations.length > 0) {
        // ✅ FIXED: Query profiles table instead of admin.getUserById
        const enrichedConvs = await Promise.all(
          allConversations.map(async (conv) => {
            const otherId = conv.participant_1_id === currentUser.id 
              ? conv.participant_2_id 
              : conv.participant_1_id;

            // ✅ FIXED: Get user info from vendor_profiles or similar table instead of admin API
            let otherEmail = 'Unknown User';
            let otherName = 'Unknown';
            try {
              // Try to get from vendor_profiles table
              const { data: profile } = await supabase
                .from('vendor_profiles') // UPDATE THIS IF YOUR TABLE IS DIFFERENT
                .select('email, company_name')
                .eq('user_id', otherId)
                .maybeSingle();

              if (profile?.email) {
                otherEmail = profile.email;
                otherName = profile.company_name || profile.email;
              }
            } catch (e) {
              console.warn('Could not fetch user profile:', e);
            }

            // Get last message
            const { data: lastMsg, error: msgError } = await supabase
              .from('messages')
              .select('body, created_at, sender_id, is_read, message_type')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (msgError && msgError.code !== 'PGRST116') {
              console.warn('Error fetching last message:', msgError);
            }

            // Count unread
            const { count: unreadCount, error: countError } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .eq('is_read', false)
              .neq('sender_id', currentUser.id);

            if (countError && countError.code !== 'PGRST116') {
              console.warn('Error counting unread:', countError);
            }

            return {
              id: conv.id,
              otherUserId: otherId,
              otherEmail: otherEmail,
              otherName: otherName,
              lastMessage: lastMsg?.body || 'No messages',
              lastMessageTime: lastMsg?.created_at,
              unreadCount: unreadCount || 0,
              created_at: conv.created_at,
              conversation_type: conv.conversation_type || 'customer', // 'customer' or 'admin'
              messageType: lastMsg?.message_type || 'vendor_to_customer'
            };
          })
        );

        setConversations(enrichedConvs);
      } else {
        setConversations([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error in fetchConversations:', err);
      setMessage(`❌ Unexpected error: ${err.message}`);
      setLoading(false);
    }
  };

  // ✅ FIXED: Better message fetching
  const fetchMessages = async (conversationId) => {
    try {
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setMessage(`❌ Error loading messages: ${error.message}`);
        return;
      }

      setMessages(msgs || []);

      // Mark messages as read
      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user?.id);

      if (updateError) {
        console.warn('Error marking as read:', updateError);
      }
    } catch (err) {
      console.error('Error:', err);
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  // Filter conversations by type
  const filteredByType = conversations.filter(conv => {
    if (messageType === 'all') return true;
    if (messageType === 'customers') return conv.conversation_type === 'customer' || !conv.conversation_type;
    if (messageType === 'admin') return conv.conversation_type === 'admin';
    return true;
  });

  // Filter by search
  const filteredConversations = filteredByType.filter(conv =>
    conv.otherEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.otherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setMessage('');
    fetchMessages(conv.id);
  };

  // ✅ FIXED: Better message sending
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !selectedConversation || !user) {
      setMessage('❌ Please enter a message');
      return;
    }

    try {
      setSending(true);
      setMessage('');

      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          recipient_id: selectedConversation.otherUserId,
          body: messageText,
          is_read: false,
          message_type: selectedConversation.messageType || 'vendor_to_customer'
        }]);

      if (error) {
        console.error('Error sending message:', error);
        setMessage(`❌ Error sending message: ${error.message}`);
        setSending(false);
        return;
      }

      // Update last message time in conversation
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      if (updateError) {
        console.warn('Error updating conversation:', updateError);
      }

      setMessageText('');
      setMessage('✅ Message sent!');
      
      // Refresh messages and conversations
      await fetchMessages(selectedConversation.id);
      await fetchConversations();
      
      // Clear success message after 2 seconds
      setTimeout(() => setMessage(''), 2000);
      
      setSending(false);
    } catch (err) {
      console.error('Error:', err);
      setMessage(`❌ Error: ${err.message}`);
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
          
          {/* ✅ NEW: Message Type Filter Tabs */}
          <div className="flex gap-2 mb-3 border-b border-gray-200 pb-2">
            <button
              onClick={() => setMessageType('all')}
              className={`text-xs font-medium px-3 py-1 rounded transition ${
                messageType === 'all'
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMessageType('customers')}
              className={`text-xs font-medium px-3 py-1 rounded transition ${
                messageType === 'customers'
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setMessageType('admin')}
              className={`text-xs font-medium px-3 py-1 rounded transition ${
                messageType === 'admin'
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Mail className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">
                {messageType === 'all' ? 'No conversations yet' : `No ${messageType} conversations`}
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedConversation?.id === conv.id
                      ? 'bg-orange-100'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">
                          {conv.otherName}
                        </p>
                        {/* ✅ Badge showing message type */}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          conv.conversation_type === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {conv.conversation_type === 'admin' ? '👨‍💼 Admin' : '👤 Customer'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-1">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span 
                        className="ml-2 px-2 py-1 rounded-full text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: '#ea8f1e' }}
                      >
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {conv.lastMessageTime 
                      ? new Date(conv.lastMessageTime).toLocaleDateString()
                      : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New Message Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            className="w-full px-4 py-2 rounded-lg text-white font-medium flex items-center justify-center gap-2"
            style={{ backgroundColor: '#ea8f1e' }}
          >
            <Plus className="w-5 h-5" />
            New Conversation
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
            {/* Status Message */}
            {message && (
              <div className={`p-4 flex items-center gap-2 ${
                message.includes('✅')
                  ? 'bg-green-50 text-green-700 border-b border-green-200'
                  : 'bg-red-50 text-red-700 border-b border-red-200'
              }`}>
                {message.includes('✅') ? (
                  <Check className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span>{message}</span>
              </div>
            )}

            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedConversation.otherName}
                    </h3>
                    {/* ✅ Message type badge in header */}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedConversation.conversation_type === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedConversation.conversation_type === 'admin' ? '👨‍💼 Admin' : '👤 Customer'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Conversation started {new Date(selectedConversation.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No messages yet</p>
                  <p className="text-sm text-gray-500">Start the conversation below</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender_id === user?.id
                          ? 'text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                      style={msg.sender_id === user?.id ? { backgroundColor: '#ea8f1e' } : {}}
                    >
                      <p className="text-sm">{msg.body}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender_id === user?.id
                          ? 'text-orange-100'
                          : 'text-gray-500'
                      }`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="p-2 rounded-lg text-white disabled:opacity-50 transition"
                  style={{ backgroundColor: '#ea8f1e' }}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No conversation selected</p>
              <p className="text-gray-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}