'use client';

import { useEffect, useState, useRef } from 'react';
import { X, Send, Loader, Paperclip } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function VendorMessagingModal({ vendorId, vendorName, userId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Fetch messages with auto-refresh
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

    // Set up polling to refresh messages every 2 seconds for real-time updates
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [vendorId, userId, currentUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle image upload to AWS S3
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setUploading(true);
      const newImages = [];

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select only image files');
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB');
          continue;
        }

        try {
          // Get presigned URL from our backend API
          const getUrlResponse = await fetch('/api/aws/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name}`,
              fileType: file.type,
              folder: 'vendor-messages'
            })
          });

          if (!getUrlResponse.ok) {
            throw new Error('Failed to get upload URL');
          }

          const { uploadUrl, fileUrl } = await getUrlResponse.json();

          // Upload directly to S3 using presigned URL
          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type,
            },
            body: file
          });

          if (!uploadResponse.ok) {
            throw new Error('Failed to upload to S3');
          }

          newImages.push({
            name: file.name,
            url: fileUrl,
            size: file.size,
            type: file.type,
          });
        } catch (fileError) {
          console.error('Error uploading file:', fileError);
          alert(`Failed to upload ${file.name}`);
        }
      }

      setUploadedImages(prev => [...prev, ...newImages]);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded image
  const removeUploadedImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && uploadedImages.length === 0) || !currentUser) return;

    try {
      setSending(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('Session expired. Please log in again.');
        return;
      }

      // Prepare message with attachments
      const messagePayload = {
        body: newMessage.trim(),
        attachments: uploadedImages.map(img => ({
          name: img.name,
          url: img.url,
          type: img.type,
          size: img.size,
        }))
      };

      const response = await fetch('/api/vendor/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vendorId,
          messageText: JSON.stringify(messagePayload),
          senderType: 'user',
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setMessages([...messages, result.data[0]]);
        setNewMessage('');
        setUploadedImages([]);
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
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Message with {vendorName}</h2>
            <p className="text-sm text-gray-600">Direct conversation - reply directly here</p>
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
            <>
              {messages.map((msg, idx) => {
                // Parse message text if it's JSON
                let messageContent = msg.message_text;
                let attachments = [];
                try {
                  if (typeof msg.message_text === 'string') {
                    const parsed = JSON.parse(msg.message_text);
                    messageContent = parsed.body || msg.message_text;
                    attachments = parsed.attachments || [];
                  }
                } catch (e) {
                  // Keep as is if not JSON
                }

                return (
                  <div key={msg.id} className="flex flex-col">
                    <div
                      className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-lg ${
                          msg.sender_type === 'user'
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{messageContent}</p>
                        
                        {/* Display attachments if any */}
                        {attachments && attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {attachments.map((att, attIdx) => (
                              <div key={attIdx}>
                                {att.type && att.type.startsWith('image/') ? (
                                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="block">
                                    <img 
                                      src={att.url} 
                                      alt={att.name}
                                      className="max-w-xs rounded-lg cursor-pointer hover:opacity-80 transition"
                                    />
                                  </a>
                                ) : (
                                  <a 
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs underline"
                                  >
                                    📎 {att.name}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender_type === 'user' ? 'text-amber-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {msg.sender_type === 'vendor' && idx === messages.length - 1 && (
                      <div className="flex justify-start mt-2">
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                          ✓ Vendor replied
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 px-6 py-4">
          {/* Uploaded Images Preview */}
          {uploadedImages.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img.url}
                    alt={img.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeUploadedImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              disabled={sending || uploading}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploading}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              title="Attach image"
            >
              {uploading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5" />
              )}
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100"
              disabled={sending}
              autoFocus
            />
            <button
              type="submit"
              disabled={sending || uploading || (!newMessage.trim() && uploadedImages.length === 0)}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 font-semibold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Reply
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
