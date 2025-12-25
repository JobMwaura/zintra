'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Trash2, CheckCircle, MessageSquare, AlertCircle, Archive } from 'lucide-react';
import Link from 'next/link';

/**
 * Dashboard Notifications Panel Component
 * 
 * Displays recent notifications on the user dashboard
 * Features:
 * - Show last 5 notifications
 * - Mark individual notifications as read
 * - Delete notifications
 * - Link to related items (messages, RFQs, etc.)
 * - Empty state when no notifications
 */
export default function DashboardNotificationsPanel() {
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
  const [recentNotifications, setRecentNotifications] = useState([]);

  // Get only the 5 most recent notifications
  useEffect(() => {
    setRecentNotifications(notifications.slice(0, 5));
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'rfq':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'quote':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationLink = (notification) => {
    switch (notification.related_type) {
      case 'vendor_message':
        return '/user-messages';
      case 'rfq':
        return `/my-rfqs`;
      case 'quote':
        return `/user-messages`;
      default:
        return '#';
    }
  };

  const formatTimeAgo = (createdAt) => {
    const now = new Date();
    const then = new Date(createdAt);
    const seconds = Math.floor((now - then) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  const handleDelete = async (notificationId, e) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e.preventDefault();
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5" style={{ color: '#ea8f1e' }} />
          <h3 className="text-lg font-bold" style={{ color: '#5f6466' }}>
            Recent Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
              {unreadCount}
            </span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No notifications yet</p>
            <p className="text-sm text-gray-400">You'll see updates here when vendors message you or respond to your RFQs</p>
          </div>
        ) : (
          recentNotifications.map((notification) => (
            <Link key={notification.id} href={getNotificationLink(notification)}>
              <div
                className={`p-3 rounded-lg border-l-4 cursor-pointer transition hover:bg-gray-50 ${
                  notification.read_at
                    ? 'bg-gray-50 border-gray-300'
                    : 'bg-blue-50 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Icon and Content */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${
                        notification.read_at ? 'text-gray-700' : 'text-gray-900'
                      }`}>
                        {notification.title}
                      </p>
                      <p className={`text-sm mt-1 line-clamp-2 ${
                        notification.read_at ? 'text-gray-600' : 'text-gray-700'
                      }`}>
                        {notification.body || notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.read_at && (
                      <button
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="p-1.5 hover:bg-gray-200 rounded-lg transition" 
                        title="Mark as read"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer */}
      {recentNotifications.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link href="/user-messages">
            <button className="w-full text-center px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition">
              View All Messages →
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
