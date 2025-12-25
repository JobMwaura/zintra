'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Send, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function VendorMessagingModal({ vendorId, vendorName, userId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Fetch messages
  useEffect(() => {
    if (!vendorId || !userId || !currentUser) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.error('No session token');
          return;
        }

        const response = await fetch(
          `/api/vendor/messages/get?vendorId=${vendorId}&userId=${userId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        const result = await response.json();
        if (response.ok) {
          setMessages(result.data || []);
        } else {
          console.error('Failed to fetch messages:', result.error);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Set up polling to refresh messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [vendorId, userId, currentUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      setSending(true);
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
          vendorId,
          messageText: newMessage,
          senderType: 'user',
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessages([...messages, result.data[0]]);
        setNewMessage('');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl flex flex-col" style={{ height: '600px' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Message with {vendorName}</h2>
            <p className="text-sm text-gray-500">Ask questions or discuss your needs</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg hover:bg-gray-100 p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-6 h-6 animate-spin text-amber-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg font-semibold">No messages yet</p>
                <p className="text-sm">Send your first message below</p>
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
                  <p className="text-sm">{msg.message_text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.sender_type === 'user' ? 'text-amber-100' : 'text-gray-500'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 px-6 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-semibold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
