'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Bell, Check, CheckCheck, ArrowLeft, Star, Briefcase, Shield, FileText, AlertCircle, MessageSquare, Clock, ChevronDown } from 'lucide-react';
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '@/app/actions/zcc-requirements';

const EVENT_ICONS = {
  shortlisted: { icon: Star, color: 'text-yellow-500 bg-yellow-50' },
  offer: { icon: FileText, color: 'text-orange-500 bg-orange-50' },
  hired: { icon: Briefcase, color: 'text-green-500 bg-green-50' },
  interview: { icon: Clock, color: 'text-purple-500 bg-purple-50' },
  rejected: { icon: AlertCircle, color: 'text-red-500 bg-red-50' },
  verification_approved: { icon: Shield, color: 'text-green-500 bg-green-50' },
  verification_rejected: { icon: Shield, color: 'text-red-500 bg-red-50' },
  requirements_sent: { icon: FileText, color: 'text-blue-500 bg-blue-50' },
  requirements_completed: { icon: CheckCheck, color: 'text-green-500 bg-green-50' },
  contact_unlocked: { icon: MessageSquare, color: 'text-blue-500 bg-blue-50' },
  post_published: { icon: Briefcase, color: 'text-orange-500 bg-orange-50' },
  application_received: { icon: Bell, color: 'text-blue-500 bg-blue-50' },
};

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }
      setUser(authUser);

      const result = await getUserNotifications(authUser.id, { limit: 50 });
      if (result.success) {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(notifId) {
    await markNotificationRead(notifId);
    setNotifications(prev => prev.map(n =>
      n.id === notifId ? { ...n, status: 'read', read_at: new Date().toISOString() } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function handleMarkAllRead() {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read', read_at: new Date().toISOString() })));
    setUnreadCount(0);
  }

  function getTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
  }

  const displayNotifs = showAll ? notifications : notifications.slice(0, 20);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/careers" className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-4 transition">
            <ArrowLeft size={20} />
            Back
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">Notifications</h1>
              <p className="text-orange-100">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Bell size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No notifications yet</h3>
            <p className="text-gray-500">You'll see notifications here when employers interact with your applications.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayNotifs.map(notif => {
              const eventConfig = EVENT_ICONS[notif.event_type] || EVENT_ICONS.application_received;
              const Icon = eventConfig.icon;
              const isUnread = notif.status !== 'read';

              return (
                <div
                  key={notif.id}
                  className={`bg-white rounded-lg border p-4 transition hover:shadow-sm cursor-pointer ${isUnread ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}`}
                  onClick={() => isUnread && handleMarkRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${eventConfig.color}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {getTimeAgo(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{notif.body}</p>
                      {notif.channel === 'sms' && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                          <MessageSquare size={10} /> SMS sent
                        </span>
                      )}
                    </div>
                    {isUnread && (
                      <div className="w-2.5 h-2.5 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Load more */}
            {notifications.length > 20 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full py-3 text-center text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center justify-center gap-1"
              >
                <ChevronDown size={16} />
                Show all {notifications.length} notifications
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
