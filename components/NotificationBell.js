'use client';

/**
 * NotificationBell Component
 * 
 * Displays a notification bell icon with:
 * - Unread count badge
 * - Dropdown menu with recent notifications
 * - Quick actions (mark read, delete)
 * - Link to full notification center
 * 
 * @usage
 * <NotificationBell />
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !buttonRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Get the 5 most recent notifications
   */
  const recentNotifications = notifications.slice(0, 5);

  /**
   * Format notification timestamp
   */
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) return 'Just now';

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }

    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }

    // More than 1 day - show date
    return date.toLocaleDateString();
  };

  /**
   * Get icon/color based on notification type
   */
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'quote_received':
        return '📋';
      case 'quote_accepted':
        return '✅';
      case 'quote_rejected':
        return '❌';
      case 'message_received':
        return '💬';
      case 'rfq_created':
        return '📝';
      default:
        return '🔔';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'quote_received':
        return 'bg-blue-50 border-l-blue-500';
      case 'quote_accepted':
        return 'bg-green-50 border-l-green-500';
      case 'quote_rejected':
        return 'bg-red-50 border-l-red-500';
      case 'message_received':
        return 'bg-purple-50 border-l-purple-500';
      default:
        return 'bg-slate-50 border-l-slate-500';
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-orange-600 transition duration-200 hover:bg-orange-50 rounded-lg"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-6 h-6" strokeWidth={1.5} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-5 h-5 text-xs font-bold leading-none text-white transform bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-slideDown"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-transparent border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-orange-600 font-semibold">
                  {unreadCount} unread
                </p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-xs mt-1">
                  You'll see updates here when you receive quotes
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentNotifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 transition border-l-4 ${
                      !notif.read_at
                        ? 'bg-orange-50 border-l-orange-500'
                        : getTypeColor(notif.type)
                    } hover:bg-slate-50`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notif.type)}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {notif.body}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-2">
                          {formatTime(notif.created_at)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notif.read_at && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-100 px-2 py-1 rounded transition"
                            title="Mark as read"
                          >
                            Mark
                          </button>
                        )}

                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-slate-400 hover:text-red-600 transition"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Unread Indicator Dot */}
                    {!notif.read_at && (
                      <div className="absolute left-0 top-4 w-1 h-1 bg-orange-600 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 p-3 text-sm font-semibold text-orange-600 hover:text-orange-700 border-t border-slate-200 hover:bg-orange-50 transition"
            >
              View All Notifications
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
