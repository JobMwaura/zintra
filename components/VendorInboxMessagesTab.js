'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Send, Loader, MessageCircle, Search, AlertCircle } from 'lucide-react';

export default function VendorInboxMessagesTab() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

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

        const { data: allMessages, error } = await supabase
          .from('vendor_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        // Group messages by vendor_id (conversation)
        const groupedConversations = {};
        
        (allMessages || []).forEach(msg => {
          const vendorId = msg.vendor_id;
          
          if (!groupedConversations[vendorId]) {
            groupedConversations[vendorId] = {
              conversationId: vendorId,
              messages: [],
              lastMessage: null,
              lastMessageTime: null,
              unreadCount: 0,
            };
          }
          
          groupedConversations[vendorId].messages.push(msg);
          groupedConversations[vendorId].lastMessage = msg;
          groupedConversations[vendorId].lastMessageTime = msg.created_at;
          
          if (!msg.is_read && msg.sender_type === 'user') {
            groupedConversations[vendorId].unreadCount += 1;
          }
        });

        const conversationList = Object.values(groupedConversations).sort(
          (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );

        setConversations(conversationList);
        setLoading(false);
      } catch (err) {
        console.error('Error loading conversations:', err);
        setLoading(false);
      }
    };

    loadConversations();

    const subscription = supabase
      .channel('vendor_inbox')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vendor_messages'
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  useEffect(() => {
    if (selectedConversation) {
      markThreadAsRead(selectedConversation.conversationId);
    }
  }, [selectedConversation]);

  const markThreadAsRead = async (conversationId) => {
    try {
      const { error } = await supabase
        .from('vendor_messages')
        .update({ is_read: true })
        .eq('vendor_id', conversationId)
        .eq('sender_type', 'user')
        .eq('is_read', false);

      if (error) throw error;

      setConversations(prev =>
        prev.map(conv =>
          conv.conversationId === conversationId
            ? { ...conv, unreadCount: 0, messages: conv.messages.map(m => ({ ...m, is_read: true })) }
            : conv
        )
      );

      if (selectedConversation?.conversationId === conversationId) {
        setThreadMessages(prev => prev.map(m => ({ ...m, is_read: true })));
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setThreadMessages(conversation.messages);
    setNewMessage('');
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setThreadMessages([]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser) return;

    try {
      setSending(true);

      const messagePayload = {
        body: newMessage.trim(),
        attachments: []
      };

      const { error } = await supabase
        .from('vendor_messages')
        .insert([
          {
            vendor_id: selectedConversation.conversationId,
            user_id: currentUser.id,
            sender_type: 'vendor',
            message_text: JSON.stringify(messagePayload),
            is_read: false,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      setNewMessage('');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: allMessages } = await supabase
          .from('vendor_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        const updatedMessages = (allMessages || []).filter(
          m => m.vendor_id === selectedConversation.conversationId
        );
        setThreadMessages(updatedMessages);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const parseMessageContent = (messageText) => {
    try {
      const parsed = JSON.parse(messageText);
      if (parsed.body) {
        return parsed;
      }
    } catch (e) {
      // Not JSON
    }
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

  const getTotalUnreadCount = () => {
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  };

  // Conversation list view
  if (!selectedConversation) {
    return (
      <div className="h-full flex flex-col">
        <div className="pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages</h3>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {getTotalUnreadCount() > 0 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700 font-medium">
                {getTotalUnreadCount()} unread message{getTotalUnreadCount() !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No conversations yet</p>
              <p className="text-sm text-gray-500 mt-1">Messages from admin will appear here</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {conversations
                .filter(conv => {
                  if (!searchTerm) return true;
                  const lastMsg = conv.lastMessage;
                  if (!lastMsg) return false;
                  const content = parseMessageContent(lastMsg.message_text);
                  return content.body.toLowerCase().includes(searchTerm.toLowerCase());
                })
                .map((conversation) => {
                  const lastMsg = conversation.lastMessage;
                  if (!lastMsg) return null;

                  const content = parseMessageContent(lastMsg.message_text);
                  const isFromAdmin = lastMsg.sender_type === 'user';
                  const unreadClass = conversation.unreadCount > 0 ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50';

                  return (
                    <button
                      key={conversation.conversationId}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`w-full text-left p-4 border border-gray-200 rounded-lg transition ${unreadClass}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {isFromAdmin ? '👤' : '📧'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {isFromAdmin ? 'From Admin' : 'Your Message'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatTime(lastMsg.created_at)}
                            </p>
                          </div>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full flex-shrink-0 ml-2">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 line-clamp-2 ml-12">
                        {content.body}
                      </p>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Thread view
  return (
    <div className="h-full flex flex-col">
      <div className="pb-4 border-b border-gray-200">
        <button
          onClick={handleBackToList}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm mb-3 flex items-center gap-1"
        >
          ← Back to conversations
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          Conversation with Admin
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {threadMessages.length} message{threadMessages.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 py-4 px-2">
        {threadMessages.map((msg) => {
          const content = parseMessageContent(msg.message_text);
          const isFromAdmin = msg.sender_type === 'user';

          return (
            <div
              key={msg.id}
              className={`flex ${isFromAdmin ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  isFromAdmin
                    ? 'bg-gray-100 text-gray-900 border border-gray-200'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {isFromAdmin && (
                  <p className="text-xs font-semibold text-gray-600 mb-1 uppercase">From Admin</p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{content.body}</p>
                <p className={`text-xs mt-2 ${isFromAdmin ? 'text-gray-600' : 'text-blue-100'}`}>
                  {formatTime(msg.created_at)}
                </p>

                {content.attachments?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
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
                        📎 {typeof attachment === 'string' ? attachment.split('/').pop() : attachment.name || `Attachment ${idx + 1}`}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex gap-2">
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
            placeholder="Reply to admin..."
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center gap-2 font-medium"
          >
            {sending ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Character count: {newMessage.length}
        </p>
      </div>
    </div>
  );
}
