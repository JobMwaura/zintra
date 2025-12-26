'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import UserVendorMessagesTab from '@/components/UserVendorMessagesTab';
import { ArrowLeft, Loader } from 'lucide-react';

export default function UserMessagesPage() {
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [dashboardHref, setDashboardHref] = useState('/user-dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        // If auth context is still loading, wait for it
        if (authLoading) {
          return;
        }

        // Use auth context user instead of direct supabase call
        if (!authUser) {
          console.log('No authenticated user found, redirecting to login');
          router.push('/login');
          return;
        }

        // Check if user has a vendor profile (they shouldn't be here if they do)
        const { data: vendor, error: vendorError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (vendorError && vendorError.code !== 'PGRST116') {
          // PGRST116 is "not found" error which is fine
          console.error('Error checking vendor profile:', vendorError);
          throw vendorError;
        }

        // If they have a vendor profile, redirect them to vendor messages instead
        if (vendor?.id) {
          console.warn('User is also a vendor, redirecting to vendor messages');
          router.push('/vendor-messages');
          return;
        }

        // User is authenticated and not a vendor - proceed
        setUserAuthenticated(true);
        setDashboardHref('/user-dashboard');
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAuth();
  }, [authUser, authLoading, router, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="w-8 h-8 animate-spin text-amber-600" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!userAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header with Navigation */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Left Section - Back Button & Title */}
          <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
              title="Back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm">
              <Link 
                href={dashboardHref}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                Dashboard
              </Link>
              <span className="text-slate-400">/</span>
              <span className="text-slate-900 font-medium">Messages</span>
            </nav>
          </div>

          {/* Right Section - Title & Actions */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900">Vendor Messages</h1>
              <p className="text-xs text-slate-500">Direct conversations with vendors</p>
            </div>
            <Link 
              href={dashboardHref}
              className="px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition border border-amber-200"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Header Title */}
      <div className="bg-white border-b border-slate-200 sm:hidden px-4 py-3">
        <h1 className="text-lg font-bold text-slate-900">Vendor Messages</h1>
        <p className="text-xs text-slate-500">Direct conversations with vendors</p>
      </div>

      {/* Messages Component */}
      <div className="flex-1 overflow-hidden">
        <UserVendorMessagesTab />
      </div>
    </div>
  );
}
