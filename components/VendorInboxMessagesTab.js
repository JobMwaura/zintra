'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, Send, Loader, MessageCircle, Download, ExternalLink } from 'lucide-react';

export default function VendorInboxMessagesTab() {
  const [allMessages, setAllMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  // Get current user and fetch ALL messages (admin + vendor)
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

        // Fetch ALL messages (admin messages have sender_type='user', vendor messages have sender_type='vendor')
        const { data: vendorMessages, error } = await supabase
          .from('vendor_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching messages:', error);
          return;
        }

        setAllMessages(vendorMessages || []);

        // Count unread messages
        const unread = (vendorMessages || []).filter(m => !m.is_read).length;
        setUnreadCount(unread);

        setLoading(false);
      } catch (err) {
        console.error('Error initializing messages:', err);
        setLoading(false);
      }
    };

    initializeMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('vendor_inbox')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vendor_messages'
      }, () => {
        initializeMessages(); // Refresh on any change
      })
      .subscribe();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  // Mark message as read when viewing
  useEffect(() => {
    if (selectedMessage && !selectedMessage.is_read) {
      markMessageAsRead(selectedMessage.id);
    }
  }, [selectedMessage]);

  const markMessageAsRead = async (messageId) => {
    try {
      await supabase
        .from('vendor_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      setAllMessages(prev => 
        prev.map(m => m.id === messageId ? { ...m, is_read: true } : m)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Parse message with attachments
  const parseMessageContent = (messageText) => {
    try {
      const parsed = JSON.parse(messageText);
      if (parsed.body && parsed.attachments) {
        return {
          body: parsed.body,
          attachments: parsed.attachments || []
        };
      }
    } catch (e) {
      // Not JSON
    }
    return {
      body: messageText,
      attachments: []
    };
  };

  // Get sender label
  const getSenderLabel = (message) => {
    if (message.sender_type === 'vendor') {
      return 'From Peer Vendor';
    }
    return message.sender_name || 'From Admin';
  };

  // Filter messages
  const filteredMessages = allMessages.filter(m =>
    m.sender_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.message_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Messages List */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Inbox</h2>
          
          {unreadCount > 0 && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-semibold">
                📬 {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-6 h-6 animate-spin text-amber-600" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">{searchTerm ? 'No messages found' : 'No messages yet'}</p>
            </div>
          ) : (
            filteredMessages.map(message => (
              <button
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className={`w-full px-4 py-3 border-b border-gray-100 text-left transition hover:bg-gray-50 ${
                  selectedMessage?.id === message.id ? 'bg-amber-50 border-l-4 border-l-amber-600' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-800">
                      {message.sender_type === 'vendor' ? 'V' : 'A'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {getSenderLabel(message)}
                      </p>
                      {!message.is_read && (
                        <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">
                      {parseMessageContent(message.message_text).body || 'Message'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(message.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message View */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedMessage ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {getSenderLabel(selectedMessage)}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
                {!selectedMessage.is_read && (
                  <button
                    onClick={() => markMessageAsRead(selectedMessage.id)}
                    className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm hover:bg-amber-100 transition"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Main message */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {parseMessageContent(selectedMessage.message_text).body}
                </p>
              </div>

              {/* Attachments */}
              {parseMessageContent(selectedMessage.message_text).attachments?.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    📎 Attachments ({parseMessageContent(selectedMessage.message_text).attachments.length})
                  </h3>
                  <div className="grid gap-3">
                    {parseMessageContent(selectedMessage.message_text).attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                      >
                        {/* Image preview or file icon */}
                        {attachment.type?.startsWith('image') || typeof attachment === 'string' && attachment.includes('image') ? (
                          <img
                            src={attachment.url || attachment}
                            alt={attachment.name || `Attachment ${idx + 1}`}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">FILE</span>
                          </div>
                        )}

                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.name || `Attachment ${idx + 1}`}
                          </p>
                          {attachment.size && (
                            <p className="text-xs text-gray-500">
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>

                        {/* Download button */}
                        <a
                          href={attachment.url || attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Open attachment"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Reply section */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newMessage.trim() || !currentUser) return;

                  try {
                    setSending(true);
                    const response = await fetch('/api/vendor/messages/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        vendorId: selectedMessage.vendor_id,
                        messageText: newMessage,
                        senderType: 'vendor'
                      })
                    });

                    if (!response.ok) throw new Error('Failed to send');
                    
                    setNewMessage('');
                    // Refresh messages
                    const { data: updatedMessages } = await supabase
                      .from('vendor_messages')
                      .select('*')
                      .eq('user_id', currentUser.id)
                      .order('created_at', { ascending: false });
                    setAllMessages(updatedMessages || []);
                  } catch (error) {
                    console.error('Error sending message:', error);
                    alert('Failed to send message');
                  } finally {
                    setSending(false);
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a reply..."
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
              <p className="text-lg font-semibold">Select a message to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
