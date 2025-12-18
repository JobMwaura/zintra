'use client';

/**
 * Notifications Center Page
 * 
 * Full-page notification history and management interface
 * Features:
 * - View all notifications
 * - Filter by type
 * - Mark as read (single and bulk)
 * - Delete notifications
 * - Search functionality
 * - Responsive design
 * 
 * @route /notifications
 */

import { useState, useMemo } from 'react';
import { Bell, Trash2, CheckCheck, Filter, Search, Clock } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * Filter notifications based on type and search query
   */
  const filteredNotifications = useMemo(() => {
    let result = notifications;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(n => n.type === filterType);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title?.toLowerCase().includes(query) ||
        n.body?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, filterType, searchQuery]);

  /**
   * Format notification timestamp
   */
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) return 'Just now';

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }

    // Less than 1 day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }

    // More than 7 days - show full date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  /**
   * Get display label for notification type
   */
  const getTypeLabel = (type) => {
    const labels = {
      'quote_received': 'Quote Received',
      'quote_accepted': 'Quote Accepted',
      'quote_rejected': 'Quote Rejected',
      'rfq_created': 'RFQ Created',
      'message_received': 'Message Received',
      'rfq_updated': 'RFQ Updated',
      'vendor_message': 'Vendor Message'
    };
    return labels[type] || type;
  };

  /**
   * Get emoji icon for notification type
   */
  const getTypeIcon = (type) => {
    const icons = {
      'quote_received': '📋',
      'quote_accepted': '✅',
      'quote_rejected': '❌',
      'rfq_created': '📝',
      'message_received': '💬',
      'rfq_updated': '🔄',
      'vendor_message': '👤'
    };
    return icons[type] || '🔔';
  };

  /**
   * Get color styling for notification type
   */
  const getTypeStyles = (type) => {
    const styles = {
      'quote_received': {
        bg: 'bg-blue-50',
        border: 'border-l-blue-500',
        badge: 'bg-blue-100 text-blue-800'
      },
      'quote_accepted': {
        bg: 'bg-green-50',
        border: 'border-l-green-500',
        badge: 'bg-green-100 text-green-800'
      },
      'quote_rejected': {
        bg: 'bg-red-50',
        border: 'border-l-red-500',
        badge: 'bg-red-100 text-red-800'
      },
      'rfq_created': {
        bg: 'bg-purple-50',
        border: 'border-l-purple-500',
        badge: 'bg-purple-100 text-purple-800'
      },
      'message_received': {
        bg: 'bg-pink-50',
        border: 'border-l-pink-500',
        badge: 'bg-pink-100 text-pink-800'
      },
      'default': {
        bg: 'bg-slate-50',
        border: 'border-l-slate-500',
        badge: 'bg-slate-100 text-slate-800'
      }
    };
    return styles[type] || styles['default'];
  };

  /**
   * Check if user is authenticated
   */
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-sm">
          <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-900">Please sign in</p>
          <p className="text-slate-600 mt-2">
            You need to be logged in to view notifications
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Bell className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-slate-600 mt-1">
                  You have <span className="font-semibold text-orange-600">{unreadCount}</span> unread
                </p>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-slate-600 font-semibold">Total Notifications</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {notifications.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-xs text-slate-600 font-semibold">Unread</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 mb-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow hover:shadow-md"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All as Read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white font-medium"
            >
              <option value="all">All Types</option>
              <option value="quote_received">Quote Received</option>
              <option value="quote_accepted">Quote Accepted</option>
              <option value="quote_rejected">Quote Rejected</option>
              <option value="rfq_created">RFQ Created</option>
              <option value="message_received">Message Received</option>
            </select>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 md:p-0">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
              <p className="text-lg font-semibold text-slate-900 mb-4">
                Clear all notifications?
              </p>
              <p className="text-slate-600 mb-6">
                This action cannot be undone. All notifications will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-900 rounded-lg hover:bg-slate-50 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    clearAllNotifications();
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Clock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-slate-900">No notifications</p>
              <p className="text-slate-600 mt-2">
                {filterType === 'all' && searchQuery === ''
                  ? "You're all caught up! Check back later for updates."
                  : `No ${filterType !== 'all' ? filterType.replace('_', ' ') : ''} ${
                      searchQuery ? `matching "${searchQuery}"` : ''
                    } notifications.`}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notif => {
              const typeStyles = getTypeStyles(notif.type);
              const isUnread = !notif.read_at;

              return (
                <div
                  key={notif.id}
                  className={`bg-white rounded-lg shadow transition border-l-4 ${
                    typeStyles.border
                  } ${isUnread ? 'ring-1 ring-orange-200' : ''} hover:shadow-md`}
                >
                  <div className="p-4 md:p-5 flex items-start gap-4">
                    {/* Icon */}
                    <span className="text-2xl flex-shrink-0">
                      {getTypeIcon(notif.type)}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${typeStyles.badge}`}>
                          {getTypeLabel(notif.type)}
                        </span>
                        {isUnread && (
                          <span className="inline-block w-2 h-2 bg-orange-600 rounded-full"></span>
                        )}
                      </div>

                      <h3 className="text-sm md:text-base font-semibold text-slate-900">
                        {notif.title}
                      </h3>

                      {notif.body && (
                        <p className="text-sm text-slate-600 mt-2">
                          {notif.body}
                        </p>
                      )}

                      <p className="text-xs text-slate-400 mt-3">
                        {formatDate(notif.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isUnread && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition whitespace-nowrap"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Info */}
        {filteredNotifications.length > 0 && (
          <div className="mt-8 text-center text-sm text-slate-600">
            Showing {filteredNotifications.length} of {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
