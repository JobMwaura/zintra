'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import UserVendorMessagesTab from '@/components/UserVendorMessagesTab';

export default function VendorMessagesPage() {
  const [profileHref, setProfileHref] = useState('/dashboard');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadVendorProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vendor?.id) {
        setProfileHref(`/vendor-profile/${vendor.id}`);
      }

      // Fetch unread message count
      const { data: unreadMessages } = await supabase
        .from('vendor_messages')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .eq('sender_type', 'admin');

      if (unreadMessages) {
        setUnreadCount(unreadMessages.length);
      }

      // Subscribe to real-time updates
      const subscription = supabase
        .channel(`vendor_messages:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'vendor_messages',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          if (payload.new.sender_type === 'admin' && !payload.new.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        })
        .subscribe();

      return () => {
        subscription?.unsubscribe();
      };
    };

    loadVendorProfile();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Vendor Workspace</p>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          <Link href={profileHref} className="text-amber-700 font-semibold hover:underline">
            Back to profile
          </Link>
        </div>
      </div>

      <UserVendorMessagesTab />
    </div>
  );
}
