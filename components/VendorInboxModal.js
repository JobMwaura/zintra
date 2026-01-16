'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  X,
  Search,
  Download,
  Trash2,
  Archive,
  Filter,
  Send,
  Paperclip,
  ChevronLeft,
  MessageSquare,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function VendorInboxModal({ isOpen, onClose, vendorId, currentUser }) {
  const supabase = createClient();
  const fileInputRef = useRef(null);

  // State
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read, archived
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminUsers, setAdminUsers] = useState({}); // Map of user_id to user info

  // Load conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const { data: messages, error } = await supabase
        .from('vendor_messages')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by user_id (conversation thread)
      const grouped = {};
      const userIds = new Set();
      
      messages.forEach((msg) => {
        const userId = msg.user_id;
        userIds.add(userId);
        
        if (!grouped[userId]) {
          grouped[userId] = {
            id: userId,
            messages: [],
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: 0,
            archived: false,
          };
        }
        grouped[userId].messages.push(msg);

        // Count unread messages
        if (msg.sender_type === 'user' && !msg.is_read) {
          grouped[userId].unreadCount += 1;
        }
      });

      // Fetch admin user info
      if (userIds.size > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', Array.from(userIds));
        
        const userMap = {};
        users?.forEach(user => {
          userMap[user.id] = user;
        });
        setAdminUsers(userMap);
      }

      // Set last message info
      Object.keys(grouped).forEach((userId) => {
        const msgs = grouped[userId].messages;
        if (msgs.length > 0) {
          const lastMsg = msgs[0]; // Already sorted by created_at desc
          grouped[userId].lastMessage = lastMsg.message_text;
          grouped[userId].lastMessageTime = lastMsg.created_at;
        }
      });

      const conversationList = Object.values(grouped);
      setConversations(conversationList);

      // Calculate total unread
      const totalUnread = conversationList.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load conversations on mount
  useEffect(() => {
    if (isOpen && vendorId) {
      loadConversations();

      // Subscribe to real-time updates
      const channel = supabase
        .channel('vendor_inbox_modal')
        .on(
          'postgres_changes',
          {
            event: '*',
            table: 'vendor_messages',
            filter: `vendor_id=eq.${vendorId}`,
          },
          () => {
            loadConversations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, vendorId]);

  // Mark messages as read
  const markThreadAsRead = async (userId) => {
    try {
      // Get all admin messages in this conversation
      const { data: messages } = await supabase
        .from('vendor_messages')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('user_id', userId)
        .eq('sender_type', 'user')
        .eq('is_read', false);

      if (messages && messages.length > 0) {
        const ids = messages.map(m => m.id);
        await supabase
          .from('vendor_messages')
          .update({ is_read: true })
          .in('id', ids);

        // Update local state
        loadConversations();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Send reply message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedConversation || (!newMessage.trim() && attachments.length === 0)) return;

    try {
      setSending(true);

      // Prepare message content
      const messageContent = {
        body: newMessage.trim(),
        attachments: attachments,
      };

      const { error } = await supabase.from('vendor_messages').insert({
        vendor_id: vendorId,
        user_id: selectedConversation.id,
        sender_type: 'vendor',
        message_text: JSON.stringify(messageContent),
        is_read: false,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Reset form
      setNewMessage('');
      setAttachments([]);

      // Reload conversations
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle file attachment
  const handleFileAttach = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      for (const file of files) {
        // Upload to Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('vendor-messages')
          .upload(`${vendorId}/${fileName}`, file);

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('vendor-messages')
          .getPublicUrl(`${vendorId}/${fileName}`);

        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            url: urlData.publicUrl,
            type: file.type,
            size: file.size,
          },
        ]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const { error } = await supabase
        .from('vendor_messages')
        .delete()
        .eq('vendor_id', vendorId)
        .eq('user_id', userId);

      if (error) throw error;

      setSelectedConversation(null);
      await loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation.');
    }
  };

  // Archive conversation
  const handleArchiveConversation = async (userId) => {
    try {
      const { error } = await supabase
        .from('vendor_messages')
        .update({ archived: true })
        .eq('vendor_id', vendorId)
        .eq('user_id', userId);

      if (error) throw error;

      await loadConversations();
    } catch (error) {
      console.error('Error archiving conversation:', error);
      alert('Failed to archive conversation.');
    }
  };

  // Parse message content
  const parseMessageContent = (messageText) => {
    try {
      const parsed = JSON.parse(messageText);
      return parsed;
    } catch {
      return { body: messageText, attachments: [] };
    }
  };

  // Format timestamp
  const formatTime = (dateString) => {
    const date = new Date(dateString);
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

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (filter === 'unread') return conv.unreadCount > 0;
    if (filter === 'read') return conv.unreadCount === 0;
    if (filter === 'archived') return conv.archived;
    return true;
  });

  const searchedConversations = filteredConversations.filter((conv) => {
    if (!searchQuery) return true;
    const lastMsg = typeof conv.lastMessage === 'string' 
      ? conv.lastMessage 
      : parseMessageContent(conv.lastMessage)?.body || '';
    return lastMsg.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end">
      {/* Modal Container */}
      <div className="bg-white h-screen w-full max-w-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-amber-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">📧 Messages</h2>
            <p className="text-sm text-slate-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition text-slate-600 hover:text-slate-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Conversations List */}
          <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:max-w-xs border-r border-slate-200`}>
            {/* Search and Filters */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2 flex-wrap">
                {['all', 'unread', 'read', 'archived'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      filter === f
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  <p className="text-slate-600 mt-2 text-sm">Loading...</p>
                </div>
              ) : searchedConversations.length === 0 ? (
                <div className="p-4 text-center text-slate-600">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {searchedConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv);
                        markThreadAsRead(conv.id);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedConversation?.id === conv.id
                          ? 'bg-amber-100 border-l-4 border-amber-600'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 text-sm">
                            {adminUsers[conv.id]?.full_name || 'Admin'}
                          </p>
                          <p className="text-xs text-slate-600 truncate">
                            {(() => {
                              const lastMsg = parseMessageContent(conv.lastMessage);
                              return lastMsg.body || '(Attachment)';
                            })()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {conv.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full flex-shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatTime(conv.lastMessageTime)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Thread View */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col bg-gradient-to-b from-slate-50 to-white">
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {adminUsers[selectedConversation.id]?.full_name || 'Admin'}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {selectedConversation.messages.length} {selectedConversation.messages.length === 1 ? 'message' : 'messages'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleArchiveConversation(selectedConversation.id)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
                    title="Archive"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteConversation(selectedConversation.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition text-slate-600 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages
                  .slice()
                  .reverse()
                  .map((msg, idx) => {
                    const content = parseMessageContent(msg.message_text);
                    const isAdmin = msg.sender_type === 'user';

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isAdmin ? 'justify-start' : 'justify-end'}`}
                      >
                        {/* Admin Messages */}
                        {isAdmin && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-sm">
                            A
                          </div>
                        )}

                        <div
                          className={`max-w-xs px-4 py-3 rounded-lg ${
                            isAdmin
                              ? 'bg-slate-200 text-slate-900'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          <p className="text-sm break-words">{content.body}</p>

                          {/* Attachments */}
                          {content.attachments && content.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {content.attachments.map((att, attIdx) => (
                                <a
                                  key={attIdx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 text-xs underline mt-2 ${
                                    isAdmin ? 'text-slate-700' : 'text-blue-100'
                                  }`}
                                >
                                  <Download className="w-4 h-4" />
                                  {att.name}
                                </a>
                              ))}
                            </div>
                          )}

                          <p className={`text-xs mt-2 ${isAdmin ? 'text-slate-600' : 'text-blue-100'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>

                        {/* Vendor Messages */}
                        {!isAdmin && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            V
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Compose Area */}
              <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                {/* Attachments Preview */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg text-xs"
                      >
                        <Paperclip className="w-4 h-4 text-slate-600" />
                        <span className="text-slate-700">{att.name}</span>
                        <button
                          onClick={() =>
                            setAttachments((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-slate-400 hover:text-slate-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows="3"
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 resize-none"
                  />

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
                      title="Attach file"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={(!newMessage.trim() && attachments.length === 0) || sending}
                      className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      title="Send message"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileAttach}
                  className="hidden"
                  accept="*"
                />
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-amber-50">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 font-semibold">Select a conversation to start</p>
                <p className="text-sm text-slate-500 mt-1">or start a new conversation with admin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
