'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Send, Search, Clock, User, AlertCircle, ArrowLeft, MessageCircle } from 'lucide-react';

export default function VendorInboxMessagesTabV2() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Fetch conversations and group by admin
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('No user authenticated');
          return;
        }

        setCurrentUser(user);

        // Fetch all messages for this vendor
        const { data: messages, error } = await supabase
          .from('vendor_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        // Group by conversation (vendor_id represents the "thread" with admin)
        const grouped = {};
        let totalUnread = 0;

        (messages || []).forEach(msg => {
          const vendorId = msg.vendor_id;
          
          if (!grouped[vendorId]) {
            grouped[vendorId] = {
              id: vendorId,
              messages: [],
              lastMessage: null,
              lastMessageTime: null,
              unreadCount: 0,
              adminLabel: 'Platform Admin',
            };
          }

          grouped[vendorId].messages.push(msg);

          // Update last message
          if (!grouped[vendorId].lastMessage || new Date(msg.created_at) > new Date(grouped[vendorId].lastMessage.created_at)) {
            grouped[vendorId].lastMessage = msg;
            grouped[vendorId].lastMessageTime = msg.created_at;
          }

          // Count unread admin messages
          if (!msg.is_read && msg.sender_type === 'user') {
            grouped[vendorId].unreadCount += 1;
            totalUnread += 1;
          }
        });

        const conversationList = Object.values(grouped).sort(
          (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );

        setConversations(conversationList);
        setUnreadCount(totalUnread);
        setLoading(false);
      } catch (err) {
        console.error('Error loading conversations:', err);
        setLoading(false);
      }
    };

    loadConversations();

    // Set up polling as PRIMARY mechanism (every 2 seconds)
    // This ensures messages update even if real-time subscription has issues
    const pollInterval = setInterval(() => {
      loadConversations();
    }, 2000);

    // Set up real-time subscription as BACKUP for instant updates
    const subscription = supabase
      .channel('vendor_inbox_v2')
      .on('postgres_changes', {
        event: 'INSERT',  // Only listen to new messages
        schema: 'public',
        table: 'vendor_messages'
      }, () => {
        console.log('🔔 New message detected in inbox');
        loadConversations(); // Refresh conversation list immediately
      })
      .subscribe((status) => {
        console.log('Inbox subscription status:', status);
      });

    return () => {
      clearInterval(pollInterval);
      subscription?.unsubscribe();
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (selectedConversation) {
      markThreadAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  const markThreadAsRead = async (vendorId) => {
    try {
      await supabase
        .from('vendor_messages')
        .update({ is_read: true })
        .eq('vendor_id', vendorId)
        .eq('sender_type', 'user')
        .eq('is_read', false);

      // Update local state
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === vendorId) {
            return {
              ...conv,
              unreadCount: 0,
              messages: conv.messages.map(m => ({ ...m, is_read: true }))
            };
          }
          return conv;
        })
      );

      if (selectedConversation?.id === vendorId) {
        setSelectedConversation(prev => ({
          ...prev,
          unreadCount: 0,
          messages: prev.messages.map(m => ({ ...m, is_read: true }))
        }));
      }

      // Recalculate total unread
      const newTotal = conversations.reduce((sum, conv) => {
        if (conv.id === vendorId) return sum;
        return sum + conv.unreadCount;
      }, 0);
      setUnreadCount(newTotal);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const parseMessageContent = (messageText) => {
    try {
      // If it's already an object, return it
      if (typeof messageText === 'object' && messageText !== null) {
        if (messageText.body && Array.isArray(messageText.attachments)) {
          return messageText;
        }
        // If it's an object but not our format, wrap it
        return {
          body: JSON.stringify(messageText),
          attachments: []
        };
      }
      
      // If it's a string, try to parse it
      if (typeof messageText === 'string') {
        const parsed = JSON.parse(messageText);
        if (parsed.body && Array.isArray(parsed.attachments)) {
          return parsed;
        }
        // If it parsed to something else, wrap it
        return {
          body: typeof parsed === 'string' ? parsed : JSON.stringify(parsed),
          attachments: []
        };
      }
    } catch (e) {
      // Not JSON or parse error
    }
    
    // Fallback: treat as plain text
    return {
      body: messageText || '',
      attachments: []
    };
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Helper function to show message age (e.g., "2m ago", "1h ago")
  const getMessageAge = (createdAt) => {
    const now = new Date();
    const msgTime = new Date(createdAt);
    const diffSeconds = Math.floor((now - msgTime) / 1000);

    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`;
    return formatTime(createdAt);
  };

  // Check if message is "new" (less than 30 seconds old)
  const isNewMessage = (createdAt) => {
    const now = new Date();
    const msgTime = new Date(createdAt);
    const diffSeconds = Math.floor((now - msgTime) / 1000);
    return diffSeconds < 30;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      setSending(true);

      const messagePayload = {
        body: newMessage.trim(),
        attachments: []
      };

      await supabase
        .from('vendor_messages')
        .insert([
          {
            vendor_id: selectedConversation.id,
            user_id: currentUser.id,
            sender_type: 'vendor',
            message_text: JSON.stringify(messagePayload),
            is_read: false,
            created_at: new Date().toISOString()
          }
        ]);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Conversation list view
  if (!selectedConversation) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
            <p className="text-sm text-gray-600 mt-1">Conversations with Platform Admin</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Unread Alert */}
          {unreadCount > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-gray-600">Loading conversations...</p>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No conversations yet</h3>
                <p className="text-gray-600">Messages from admin will appear here</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations
                .filter(conv => {
                  if (!searchTerm) return true;
                  const lastMsg = conv.lastMessage;
                  if (!lastMsg) return false;
                  const content = parseMessageContent(lastMsg.message_text);
                  return (
                    content.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    conv.adminLabel.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                })
                .map((conversation) => {
                  const lastMsg = conversation.lastMessage;
                  if (!lastMsg) return null;

                  const content = parseMessageContent(lastMsg.message_text);
                  const isLastFromAdmin = lastMsg.sender_type === 'user';

                  return (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className="w-full text-left p-4 sm:p-5 hover:bg-blue-50 transition-colors duration-200 flex items-center gap-4 border-l-4 border-transparent hover:border-blue-500"
                    >
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                        👤
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">{conversation.adminLabel}</h3>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(lastMsg.created_at)}
                          </span>
                        </div>

                        <p className={`text-sm line-clamp-1 ${
                          isLastFromAdmin ? 'text-gray-700' : 'text-gray-600'
                        }`}>
                          {isLastFromAdmin ? '👤 ' : '📤 '}
                          {content.body}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Thread/Conversation view
  const messages = selectedConversation.messages || [];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200 p-4 sm:p-6">
        <button
          onClick={() => setSelectedConversation(null)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-3 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to conversations
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-lg font-bold">
            👤
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{selectedConversation.adminLabel}</h2>
            <p className="text-sm text-gray-600">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages in this conversation</p>
          </div>
        ) : (
          messages
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            .map((msg) => {
              const content = parseMessageContent(msg.message_text);
              const isFromAdmin = msg.sender_type === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex ${isFromAdmin ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs sm:max-w-sm lg:max-w-md px-4 py-3 rounded-2xl ${
                      isFromAdmin
                        ? 'bg-white border border-gray-200 text-gray-900'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {isFromAdmin && (
                      <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                        From Admin
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{content.body}</p>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <p
                        className={`text-xs ${
                          isFromAdmin ? 'text-gray-500' : 'text-blue-100'
                        }`}
                      >
                        {getMessageAge(msg.created_at)}
                      </p>
                      {isNewMessage(msg.created_at) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                          🆕 NEW
                        </span>
                      )}
                    </div>

                    {/* Attachments */}
                    {content.attachments && content.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300 space-y-1">
                        {content.attachments.map((attachment, idx) => (
                          <a
                            key={idx}
                            href={typeof attachment === 'string' ? attachment : attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs underline block ${
                              isFromAdmin ? 'text-blue-600' : 'text-blue-100'
                            }`}
                          >
                            📎 {typeof attachment === 'string'
                              ? attachment.split('/').pop()
                              : attachment.name || `Attachment ${idx + 1}`}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="bg-white border-t border-gray-200 p-4 sm:p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your reply..."
            disabled={sending}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
