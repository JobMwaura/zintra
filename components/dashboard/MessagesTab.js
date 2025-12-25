'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Mail, Search, Plus, Send, Paperclip, AlertCircle, Check } from 'lucide-react';

export default function VendorMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [token, setToken] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage('');

      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        console.error('❌ Auth error:', userError);
        setMessage('❌ Error: Please log in again');
        setLoading(false);
        return;
      }

      console.log('✅ Current user:', currentUser?.id);
      setUser(currentUser);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setToken(session.access_token);
      }

      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, user_id, company_name')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (vendorError) {
        console.error('❌ Error fetching vendor:', vendorError);
        setMessage('❌ Error loading vendor profile');
        setLoading(false);
        return;
      }

      if (!vendorData) {
        console.warn('⚠️  No vendor profile found for user:', currentUser.id);
        setMessage('❌ You must have a vendor profile to use messages');
        setLoading(false);
        return;
      }

      console.log('✅ Vendor data:', vendorData);
      setVendor(vendorData);

      const { data: allMessages, error: messagesError } = await supabase
        .from('vendor_messages')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('❌ Error fetching messages:', messagesError);
        setMessage(`❌ Error loading messages: ${messagesError.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ Total messages fetched:', allMessages?.length || 0, allMessages);

      const conversationMap = {};
      if (allMessages) {
        for (const msg of allMessages) {
          const userId = msg.user_id;
          if (!conversationMap[userId]) {
            conversationMap[userId] = [];
          }
          conversationMap[userId].push(msg);
        }
      }

      console.log('📦 Conversation map keys:', Object.keys(conversationMap));

      const convList = Object.keys(conversationMap).map(userId => {
        const msgs = conversationMap[userId];
        const lastMsg = msgs[0];
        const unreadCount = msgs.filter(m => m.is_read === false && m.sender_type === 'user').length;

        return {
          userId,
          vendorId: vendorData.id,
          userEmail: 'User',
          lastMessage: lastMsg?.message_text || 'No messages',
          lastMessageTime: lastMsg?.created_at,
          unreadCount,
          created_at: lastMsg?.created_at,
          senderType: lastMsg?.sender_type
        };
      });

      convList.sort((a, b) => {
        const timeA = new Date(a.lastMessageTime || 0);
        const timeB = new Date(b.lastMessageTime || 0);
        return timeB - timeA;
      });

      console.log('💬 Final conversation list:', convList);
      setConversations(convList);
      setLoading(false);
    } catch (err) {
      console.error('Error in fetchData:', err);
      setMessage(`❌ Unexpected error: ${err.message}`);
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    if (!vendor) return;

    try {
      console.log('🔄 Fetching messages for userId:', userId, 'vendorId:', vendor.id);
      const { data: msgs, error } = await supabase
        .from('vendor_messages')
        .select('*')
        .eq('vendor_id', vendor.id)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching messages:', error);
        setMessage(`❌ Error loading messages: ${error.message}`);
        return;
      }

      console.log('✅ Messages fetched:', msgs?.length || 0, msgs);
      setMessages(msgs || []);

      const { error: updateError } = await supabase
        .from('vendor_messages')
        .update({ is_read: true })
        .eq('vendor_id', vendor.id)
        .eq('user_id', userId)
        .eq('sender_type', 'user');

      if (updateError) {
        console.warn('Error marking as read:', updateError);
      }
    } catch (err) {
      console.error('Error:', err);
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setMessage('');
    fetchMessages(conv.userId);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !selectedConversation || !vendor || !token) {
      setMessage('❌ Please enter a message');
      return;
    }

    try {
      setSending(true);
      setMessage('');

      const response = await fetch('/api/vendor/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          userId: selectedConversation.userId,
          messageText: messageText,
          senderType: 'vendor'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error sending message:', result.error);
        setMessage(`❌ Error sending message: ${result.error}`);
        setSending(false);
        return;
      }

      setMessageText('');
      setMessage('✅ Message sent!');
      
      await fetchMessages(selectedConversation.userId);
      await fetchData();
      
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
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
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

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Mail className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.userId}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedConversation?.userId === conv.userId
                      ? 'bg-orange-100'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {conv.userEmail}
                      </p>
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

      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedConversation ? (
          <>
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

            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedConversation.userEmail}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Conversation started {new Date(selectedConversation.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

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
                    className={`flex ${msg.sender_type === 'vendor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender_type === 'vendor'
                          ? 'text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                      style={msg.sender_type === 'vendor' ? { backgroundColor: '#ea8f1e' } : {}}
                    >
                      <p className={`text-xs font-semibold mb-1 ${
                        msg.sender_type === 'vendor'
                          ? 'text-orange-100'
                          : 'text-gray-700'
                      }`}>
                        {msg.sender_name || (msg.sender_type === 'vendor' ? 'You' : 'User')}
                      </p>
                      <p className="text-sm">{msg.message_text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender_type === 'vendor'
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
