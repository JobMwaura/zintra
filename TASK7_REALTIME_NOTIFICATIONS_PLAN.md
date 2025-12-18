# Task 7: Real-Time Notifications - Implementation Plan & Build

## 📋 Overview

**Task:** Implement real-time notifications system  
**Status:** In Progress  
**Scope:** Supabase real-time subscriptions, toast notifications, notification history  

---

## 🎯 What We'll Build

### Components (4)
1. **NotificationBell** - UI component showing notification count
2. **NotificationCenter** - Full-page notification history and management
3. **NotificationToast** - Toast/popup notifications
4. **useNotifications** - React hook for notification logic

### Features (10)
- ✅ Real-time quote arrival notifications
- ✅ In-app toast notifications (popup)
- ✅ Notification bell with unread count
- ✅ Notification history/center page
- ✅ Mark notifications as read
- ✅ Clear notifications
- ✅ Sound alerts (optional toggle)
- ✅ Push notifications setup (future)
- ✅ Notification preferences
- ✅ Mobile-friendly design

### Database
- Uses existing `notifications` table (already in schema)
- Real-time Supabase subscriptions
- RLS policies for security

---

## 🏗️ Implementation Architecture

```
Real-Time Notification System
├── useNotifications Hook
│   ├─ Subscribe to real-time changes
│   ├─ Fetch notification history
│   ├─ Mark as read
│   └─ Clear notifications
├── NotificationBell Component
│   ├─ Show unread count
│   ├─ Quick actions
│   └─ Dropdown menu
├── NotificationToast Component
│   ├─ Pop-up notifications
│   ├─ Auto-dismiss (5s)
│   └─ Sound alerts
└── NotificationCenter Page
    ├─ Full notification history
    ├─ Filter by type
    ├─ Mark all as read
    └─ Responsive table/list
```

---

## 📊 Database Schema (Existing)

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL,           -- 'quote_received', 'quote_accepted', etc.
  title text,                    -- Notification title
  body text,                     -- Notification message
  metadata jsonb,                -- Extra data (rfq_id, vendor_id, etc.)
  read_at timestamptz,           -- When user read it
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
```

---

## 🚀 Build Steps

### Step 1: Create useNotifications Hook

**File:** `hooks/useNotifications.js`

```javascript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';

export function useNotifications() {
  const { user } = useAuth();
  const supabase = createClient();
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setNotifications(data || []);
      
      // Count unread
      const unread = (data || []).filter(n => !n.read_at).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase]);
  
  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;
    
    fetchNotifications();
    
    const subscription = supabase
      .channel(`notifications:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast notification
          showNotificationToast(newNotification);
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, fetchNotifications]);
  
  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [supabase]);
  
  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user?.id)
        .is('read_at', null);
      
      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          read_at: n.read_at || new Date().toISOString()
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [user?.id, supabase]);
  
  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
      
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [supabase]);
  
  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }, [user?.id, supabase]);
  
  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  };
}

function showNotificationToast(notification) {
  // This will be handled by NotificationToast component
  // Emit event or update context
  window.dispatchEvent(new CustomEvent('notification', { detail: notification }));
}
```

### Step 2: Create NotificationBell Component

**File:** `components/NotificationBell.js`

```javascript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import Link from 'next/link';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-orange-600 transition"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>No notifications yet</p>
              </div>
            ) : (
              recentNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition ${
                    !notif.read_at ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {notif.body}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {!notif.read_at && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        Mark Read
                      </button>
                    )}

                    <button
                      onClick={() => deleteNotification(notif.id)}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <Link
              href="/notifications"
              className="block p-3 text-center text-sm font-semibold text-orange-600 hover:text-orange-700 border-t border-slate-200 hover:bg-slate-50"
            >
              View All Notifications →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
```

### Step 3: Create NotificationCenter Page

**File:** `app/notifications/page.js`

```javascript
'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Trash2, CheckCheck, Filter } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, clearAllNotifications } = useNotifications();
  const [filterType, setFilterType] = useState('all');

  const filteredNotifications = filterType === 'all'
    ? notifications
    : notifications.filter(n => n.type === filterType);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const getTypeLabel = (type) => {
    const labels = {
      'quote_received': '📋 Quote Received',
      'quote_accepted': '✅ Quote Accepted',
      'quote_rejected': '❌ Quote Rejected',
      'rfq_created': '📝 RFQ Created',
      'message_received': '💬 Message Received',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-8 h-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          </div>
          
          {unreadCount > 0 && (
            <p className="text-slate-600">
              You have <span className="font-semibold text-orange-600">{unreadCount}</span> unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read
            </button>
          )}
          
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-orange-400"
          >
            <option value="all">All Notifications</option>
            <option value="quote_received">Quote Received</option>
            <option value="quote_accepted">Quote Accepted</option>
            <option value="quote_rejected">Quote Rejected</option>
            <option value="rfq_created">RFQ Created</option>
            <option value="message_received">Message Received</option>
          </select>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-900">No notifications</p>
            <p className="text-slate-600 mt-2">
              {filterType === 'all'
                ? "You're all caught up!"
                : `No ${filterType.replace('_', ' ')} notifications`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(notif => (
              <div
                key={notif.id}
                className={`bg-white rounded-lg shadow p-4 border-l-4 transition ${
                  notif.read_at
                    ? 'border-slate-200 opacity-75'
                    : 'border-orange-500 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {getTypeLabel(notif.type)}
                      </h3>
                      {!notif.read_at && (
                        <span className="inline-block w-2 h-2 bg-orange-600 rounded-full"></span>
                      )}
                    </div>
                    
                    <p className="text-sm text-slate-600">
                      {notif.title}
                    </p>
                    
                    {notif.body && (
                      <p className="text-xs text-slate-500 mt-2">
                        {notif.body}
                      </p>
                    )}
                    
                    <p className="text-xs text-slate-400 mt-3">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>

                  {!notif.read_at && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200 transition whitespace-nowrap"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 4: Create NotificationToast Component

**File:** `components/NotificationToast.js`

```javascript
'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function NotificationToast({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const getIcon = (type) => {
    switch(type) {
      case 'quote_received':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'quote_accepted':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = (type) => {
    switch(type) {
      case 'quote_received':
        return 'bg-blue-50 border-blue-200';
      case 'quote_accepted':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-lg border ${getStyles(notification.type)} animate-slideIn z-50`}>
      <div className="flex items-start gap-3">
        {getIcon(notification.type)}
        
        <div className="flex-1">
          <p className="font-semibold text-slate-900">{notification.title}</p>
          {notification.body && (
            <p className="text-sm text-slate-600 mt-1">{notification.body}</p>
          )}
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handleNotification(e) {
      const notification = e.detail;
      const id = Date.now();
      setToasts(prev => [...prev, { id, ...notification }]);
    }

    window.addEventListener('notification', handleNotification);
    return () => window.removeEventListener('notification', handleNotification);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40 space-y-3">
      {toasts.map(toast => (
        <NotificationToast
          key={toast.id}
          notification={toast}
          onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
        />
      ))}
    </div>
  );
}
```

### Step 5: Create API endpoint to send notifications

**File:** `pages/api/notifications/create.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, type, title, body, metadata } = req.body;

  if (!userId || !type || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        title,
        body,
        metadata: metadata || {}
      }]);

    if (error) throw error;

    return res.status(201).json({ success: true, data });
  } catch (err: any) {
    console.error('Error creating notification:', err);
    return res.status(500).json({ error: err.message });
  }
}
```

### Step 6: Integrate NotificationBell to layout

**Update:** `app/layout.js` or `components/Header.js`

```javascript
import NotificationBell from '@/components/NotificationBell';
import ToastContainer from '@/components/NotificationToast';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {/* Add to header */}
        <div className="flex items-center gap-4">
          {/* ... other header items ... */}
          <NotificationBell />
        </div>

        {/* Add toast container at bottom */}
        <ToastContainer />

        {children}
      </body>
    </html>
  );
}
```

---

## 🔌 Integration Points

### 1. When Quote is Received
In vendor quote submission endpoint, add:
```javascript
// After quote is created
await supabase
  .from('notifications')
  .insert([{
    user_id: rfq.user_id,  // RFQ creator
    type: 'quote_received',
    title: `New quote from ${vendor.company_name}`,
    body: `KSh ${quote.amount} - ${vendor.company_name}`,
    metadata: { rfq_id: rfq.id, vendor_id: vendor.id, quote_id: quote.id }
  }]);
```

### 2. When Quote is Accepted
In accept quote endpoint, add:
```javascript
await supabase
  .from('notifications')
  .insert([{
    user_id: quote.vendor_id,  // Vendor
    type: 'quote_accepted',
    title: 'Your quote was accepted!',
    body: `Your quote for "${rfq.title}" was accepted`,
    metadata: { rfq_id: rfq.id, quote_id: quote.id }
  }]);
```

### 3. When Message Received
In messaging endpoint, add:
```javascript
await supabase
  .from('notifications')
  .insert([{
    user_id: recipientUserId,
    type: 'message_received',
    title: `New message from ${senderName}`,
    body: messagePreview,
    metadata: { thread_id: threadId, sender_id: senderId }
  }]);
```

---

## 📚 Documentation

### Components
- `NotificationBell` - Dropdown with recent notifications and unread badge
- `NotificationCenter` - Full-page notification history
- `NotificationToast` - Auto-dismissing toast notifications
- `ToastContainer` - Container for multiple toasts

### Hook
- `useNotifications()` - Returns notifications, unreadCount, actions

### Functions
- `fetchNotifications()` - Load all notifications
- `markAsRead(id)` - Mark single notification as read
- `markAllAsRead()` - Mark all as read
- `deleteNotification(id)` - Delete single notification
- `clearAllNotifications()` - Delete all notifications

---

## ✨ Features

- ✅ Real-time subscriptions (instant updates)
- ✅ Unread badge on bell icon
- ✅ Dropdown with recent notifications
- ✅ Full notification center page
- ✅ Toast notifications that auto-dismiss
- ✅ Mark as read functionality
- ✅ Clear/delete notifications
- ✅ Filter by notification type
- ✅ Responsive mobile design
- ✅ Sound alerts (optional future)

---

## 🎯 Next

After Task 7 is complete, we'll move to:
- **Task 8:** User Dashboard with Tabs
- **Task 9:** Buyer Reputation System  
- **Task 10:** Quote Negotiation Features

---

**Status:** Ready to build! 🚀
