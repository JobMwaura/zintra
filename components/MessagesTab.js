'use client';

/**
 * MessagesTab Component
 * 
 * Display vendor message threads
 * Shows recent conversations and unread messages
 */

import { MessageSquare, Plus, Archive, MoreVertical } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function MessagesTab({
  messages = [],
  rfqs = [],
  onOpenThread,
  isLoading,
  formatDate
}) {
  const [showMenu, setShowMenu] = useState(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-200 rounded-lg h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  // Group messages by vendor/RFQ
  const threadMap = new Map();
  messages.forEach(msg => {
    const threadKey = `${msg.vendor_id || msg.sender_id}`;
    if (!threadMap.has(threadKey)) {
      threadMap.set(threadKey, {
        vendor_name: msg.vendor_name || msg.sender_name || 'Unknown Vendor',
        vendor_id: msg.vendor_id || msg.sender_id,
        rfq_id: msg.rfq_id,
        rfq_title: msg.rfq_title || 'RFQ',
        messages: [],
        unread_count: 0
      });
    }
    const thread = threadMap.get(threadKey);
    thread.messages.push(msg);
    if (!msg.read) thread.unread_count += 1;
  });

  const threads = Array.from(threadMap.values())
    .sort((a, b) => {
      const aLatest = new Date(a.messages[a.messages.length - 1].created_at).getTime();
      const bLatest = new Date(b.messages[b.messages.length - 1].created_at).getTime();
      return bLatest - aLatest;
    });

  if (threads.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          No Messages Yet
        </h3>
        <p className="text-slate-600 mb-6">
          Start conversations with vendors about your RFQs.
        </p>
        <Link
          href="/post-rfq"
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          <Plus className="w-5 h-5" />
          Create New RFQ
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Unread Summary */}
      {threads.some(t => t.unread_count > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">New Messages</h4>
            <p className="text-sm text-blue-800 mt-1">
              You have {threads.reduce((sum, t) => sum + t.unread_count, 0)} unread message{
                threads.reduce((sum, t) => sum + t.unread_count, 0) !== 1 ? 's' : ''
              } from vendors.
            </p>
          </div>
        </div>
      )}

      {/* Message Threads List */}
      <div className="space-y-3">
        {threads.map((thread) => {
          const lastMessage = thread.messages[thread.messages.length - 1];
          const isUnread = thread.unread_count > 0;

          return (
            <div
              key={`${thread.vendor_id}-${thread.rfq_id}`}
              className={`p-4 rounded-lg border cursor-pointer transition ${
                isUnread
                  ? 'bg-orange-50 border-orange-200 hover:border-orange-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => onOpenThread?.(thread)}
            >
              <div className="flex items-start justify-between">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {thread.vendor_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-slate-900 ${isUnread ? 'font-bold' : ''}`}>
                        {thread.vendor_name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {thread.rfq_title}
                      </p>
                    </div>
                  </div>

                  {/* Last Message Preview */}
                  <p className={`text-sm truncate ${
                    isUnread ? 'text-slate-900 font-semibold' : 'text-slate-600'
                  }`}>
                    {lastMessage.message_text || 'No message content'}
                  </p>

                  {/* Timestamp */}
                  <p className="text-xs text-slate-500 mt-2">
                    {formatDate(lastMessage.created_at)}
                  </p>
                </div>

                {/* Unread Badge & Menu */}
                <div className="flex items-center gap-3 ml-4">
                  {isUnread && (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-600 text-white text-xs font-bold rounded-full">
                        {thread.unread_count}
                      </span>
                    </div>
                  )}

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(showMenu === `${thread.vendor_id}-${thread.rfq_id}` ? null : `${thread.vendor_id}-${thread.rfq_id}`);
                      }}
                      className="p-2 hover:bg-slate-100 rounded transition"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>

                    {showMenu === `${thread.vendor_id}-${thread.rfq_id}` && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenThread?.(thread);
                            setShowMenu(null);
                          }}
                          className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                        >
                          Open Thread
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(null);
                          }}
                        >
                          Mark as Read
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-t"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(null);
                          }}
                        >
                          <Archive className="w-3 h-3 inline mr-2" />
                          Archive
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <p className="text-sm font-medium text-slate-600">Active Threads</p>
          <p className="text-2xl font-bold text-slate-900">{threads.length}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600">Total Messages</p>
          <p className="text-2xl font-bold text-slate-900">
            {messages.length}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600">Unread Messages</p>
          <p className="text-2xl font-bold text-orange-600">
            {threads.reduce((sum, t) => sum + t.unread_count, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
