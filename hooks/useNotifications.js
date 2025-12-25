/**
 * useNotifications Hook
 * 
 * Real-time notification system using Supabase subscriptions
 * Handles fetching, managing, and subscribing to notifications
 * 
 * @usage
 * const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client once (outside component to prevent recreation)
let supabaseClient = null;
function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return supabaseClient;
}

export function useNotifications() {
  const { user } = useAuth();
  const supabase = getSupabaseClient();

  // State management
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const subscriptionRef = useRef(null);
  const fetchedRef = useRef(false);

  /**
   * Fetch all notifications for current user
   * Ordered by most recent first
   */
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to prevent loading huge datasets

      if (fetchError) {
        console.error('Fetch error details:', fetchError);
        throw fetchError;
      }

      const notificationArray = Array.isArray(data) ? data : [];
      setNotifications(notificationArray);

      // Calculate unread count
      const unread = notificationArray.filter(n => !n.read_at).length;
      setUnreadCount(unread);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err?.message || 'Failed to load notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Subscribe to real-time notification changes
   * Automatically fetches initial notifications and listens for new ones
   */
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Only fetch once when user changes
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchNotifications();
    }

    // Cleanup old subscription
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe();
      } catch (err) {
        console.error('Error unsubscribing from old subscription:', err);
      }
    }

    // Subscribe to real-time INSERT events
    try {
      const channel = supabase
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
            try {
              const newNotification = payload?.new;
              
              // Validate notification
              if (!newNotification || !newNotification.id) {
                console.warn('Invalid notification received:', newNotification);
                return;
              }
              
              // Add new notification to the top of list
              setNotifications(prev => [newNotification, ...prev]);
              
              // Increment unread count
              if (!newNotification.read_at) {
                setUnreadCount(prev => prev + 1);
              }

              // Dispatch custom event for toast notifications
              showNotificationToast(newNotification);
            } catch (err) {
              console.error('Error handling new notification:', err);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✓ Real-time notifications subscribed');
          } else if (status === 'CLOSED') {
            console.log('⚠ Real-time notifications connection closed');
          }
        });

      subscriptionRef.current = channel;
    } catch (err) {
      console.error('Error setting up notification subscription:', err);
      setError(err?.message || 'Failed to subscribe to notifications');
    }

    // Cleanup subscription on unmount
    return () => {
      try {
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
      } catch (err) {
        console.error('Error unsubscribing from notifications:', err);
      }
    };
  }, [user?.id]);

  /**
   * Mark a single notification as read
   * @param {string} notificationId - The ID of the notification
   */
  const markAsRead = useCallback(async (notificationId) => {
    if (!user?.id) return;

    try {
      const readAt = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: readAt })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, read_at: readAt }
            : n
        )
      );

      // Decrease unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err.message);
    }
  }, [user?.id, supabase]);

  /**
   * Mark all notifications as read for current user
   */
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const readAt = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read_at: readAt })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (updateError) throw updateError;

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({
          ...n,
          read_at: n.read_at || readAt
        }))
      );

      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
      setError(err.message);
    }
  }, [user?.id, supabase]);

  /**
   * Delete a single notification
   * @param {string} notificationId - The ID of the notification
   */
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user?.id) return;

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Update local state
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );

      // Adjust unread count if notification was unread
      const deletedNotif = notifications.find(n => n.id === notificationId);
      if (deletedNotif && !deletedNotif.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err.message);
    }
  }, [user?.id, notifications, supabase]);

  /**
   * Clear all notifications for current user
   */
  const clearAllNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
      setError(err.message);
    }
  }, [user?.id, supabase]);

  /**
   * Get notifications filtered by type
   * @param {string} type - The notification type to filter by
   * @returns {Array} Filtered notifications
   */
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  /**
   * Get unread notifications
   * @returns {Array} Array of unread notifications
   */
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(n => !n.read_at);
  }, [notifications]);

  /**
   * Get notifications from last N hours
   * @param {number} hours - Number of hours to look back
   * @returns {Array} Recent notifications
   */
  const getRecentNotifications = useCallback((hours = 24) => {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return notifications.filter(n => 
      new Date(n.created_at) > cutoffTime
    );
  }, [notifications]);

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,

    // Main functions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,

    // Filter functions
    getNotificationsByType,
    getUnreadNotifications,
    getRecentNotifications
  };
}

/**
 * Helper function to dispatch notification toast
 * Emits custom event that ToastContainer listens to
 * @param {Object} notification - The notification object
 */
function showNotificationToast(notification) {
  // Only show toast for unread notifications
  if (notification.read_at) return;

  // Transform notification for toast component
  // Handle both 'body' and 'message' field names
  const toastNotification = {
    type: notification.type || 'message',
    title: notification.title,
    body: notification.body || notification.message
  };

  const event = new CustomEvent('notification:new', {
    detail: toastNotification
  });

  window.dispatchEvent(event);
}

export default useNotifications;
