'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, Send, Loader, MessageCircle } from 'lucide-react';

export default function UserVendorMessages() {
  const [conversations, setConversations] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [messageType, setMessageType] = useState('all'); // 'all', 'vendors', 'admin'
  const messagesEndRef = useRef(null);
  const searchDebounceTimer = useRef(null);

  // Debounce search input (300ms)
  useEffect(() => {
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }
    
    searchDebounceTimer.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, [searchTerm]);

  // Get current user and fetch conversations
  useEffect(() => {
    const initializeMessages = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No user authenticated');
          return;
        }

        setCurrentUser(user);

        // Fetch conversations with pagination (last 20)
        const { data: vendorMessages, error } = await supabase
          .from('vendor_messages')
          .select(`
            vendor_id,
            message_text,
            created_at,
            sender_type,
            is_read
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(500); // Limit to prevent massive datasets

        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        // Group by vendor and get last message and unread count
        const conversationMap = {};
        if (vendorMessages) {
          vendorMessages.forEach(msg => {
            if (!conversationMap[msg.vendor_id]) {
              conversationMap[msg.vendor_id] = {
                vendor_id: msg.vendor_id,
                last_message: msg.message_text,
                last_message_time: msg.created_at,
                unread_count: 0,
              };
            }
            // Count unread messages from vendor
            if (msg.sender_type === 'vendor' && !msg.is_read) {
              conversationMap[msg.vendor_id].unread_count += 1;
            }
          });
        }

        // Fetch vendor details for each conversation (single query with IN)
        const vendorIds = Object.keys(conversationMap);
        if (vendorIds.length > 0) {
          const { data: vendors, error: vendorError } = await supabase
            .from('vendors')
            .select('id, company_name, logo')
            .in('id', vendorIds);

          if (vendorError) {
            console.error('Error fetching vendor details:', vendorError);
            return;
          }

          // Enrich conversations with vendor details
          const enrichedConversations = vendors.map(vendor => ({
            ...conversationMap[vendor.id],
            vendor_name: vendor.company_name,
            vendor_logo: vendor.logo,
          }));

          // Sort by last message time
          enrichedConversations.sort((a, b) => 
            new Date(b.last_message_time) - new Date(a.last_message_time)
          );

          setConversations(enrichedConversations);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error initializing messages:', err);
        setLoading(false);
      }
    };

    initializeMessages();
  }, []);

  // Fetch messages for selected vendor with real-time subscription
  useEffect(() => {
    if (!selectedVendor || !currentUser) return;

    const fetchAndSubscribeMessages = async () => {
      try {
        // Initial fetch (last 100 messages for this conversation)
        const { data: msgs, error } = await supabase
          .from('vendor_messages')
          .select('*')
          .eq('vendor_id', selectedVendor.vendor_id)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        setMessages(msgs || []);

        // Mark vendor messages as read
        await supabase
          .from('vendor_messages')
          .update({ is_read: true })
          .eq('vendor_id', selectedVendor.vendor_id)
          .eq('user_id', currentUser.id)
          .eq('sender_type', 'vendor')
          .eq('is_read', false);

        // Subscribe to new messages for this vendor
        const subscription = supabase
          .channel(`messages:${selectedVendor.vendor_id}:${currentUser.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'vendor_messages',
              filter: `vendor_id=eq.${selectedVendor.vendor_id} AND user_id=eq.${currentUser.id}`,
            },
            (payload) => {
              console.log('🔔 New message received:', payload.new);
              setMessages((prev) => [...prev, payload.new]);
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status);
          });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error in fetchAndSubscribeMessages:', err);
      }
    };

    const unsubscribe = fetchAndSubscribeMessages();
    return () => {
      unsubscribe?.then((unsub) => unsub?.());
    };
  }, [selectedVendor, currentUser]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedVendor || !currentUser || sending) return;

    try {
      setSending(true);

      // Get session token for API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Session expired. Please log in again.');
        return;
      }

      const response = await fetch('/api/vendor/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vendorId: selectedVendor.vendor_id,
          messageText: newMessage,
          senderType: 'user',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error sending message:', result.error);
        alert(`Error: ${result.error}`);
        return;
      }

      // Add message to local state
      setMessages([...messages, result.data[0]]);
      setNewMessage('');

      // Update conversation in list
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.vendor_id === selectedVendor.vendor_id
            ? {
                ...conv,
                last_message: newMessage,
                last_message_time: new Date().toISOString(),
              }
            : conv
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Parse message content from JSON or plain text
  const parseMessageContent = (messageText) => {
    try {
      const parsed = JSON.parse(messageText);
      return parsed.body || messageText;
    } catch {
      return messageText;
    }
  };

  // Filter conversations
  const filteredByType = conversations.filter(conv => {
    if (messageType === 'all') return true;
    if (messageType === 'vendors') return true; // All vendor conversations are vendors
    if (messageType === 'admin') return false; // We don't have admin messages yet
    return true;
  });

  const filteredConversations = filteredByType.filter(conv =>
    conv.vendor_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Messages</h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            {['all', 'vendors', 'admin'].map(tab => (
              <button
                key={tab}
                onClick={() => setMessageType(tab)}
                className={`px-3 py-2 text-sm font-medium capitalize transition border-b-2 ${
                  messageType === tab
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-6 h-6 animate-spin text-amber-600" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">{searchTerm ? 'No conversations found' : 'No messages yet'}</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.vendor_id}
                onClick={() => setSelectedVendor(conv)}
                className={`w-full px-4 py-3 border-b border-gray-100 text-left transition ${
                  selectedVendor?.vendor_id === conv.vendor_id
                    ? 'bg-amber-50 border-l-4 border-l-amber-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Logo */}
                  {conv.vendor_logo ? (
                    <img
                      src={conv.vendor_logo}
                      alt={conv.vendor_name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-amber-800">
                        {conv.vendor_name.charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{conv.vendor_name}</h3>
                      {conv.unread_count > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{parseMessageContent(conv.last_message)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(conv.last_message_time).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedVendor ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-bold text-gray-900">{selectedVendor.vendor_name}</h2>
              <p className="text-sm text-gray-600">Direct message conversation</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>Start a conversation</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender_type === 'user'
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{parseMessageContent(msg.message_text)}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender_type === 'user'
                            ? 'text-amber-100'
                            : 'text-gray-500'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
