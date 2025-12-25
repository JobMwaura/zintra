'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UserVendorMessagesTab from '@/components/UserVendorMessagesTab';
import { ArrowLeft, Loader } from 'lucide-react';

export default function UserMessagesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [dashboardHref, setDashboardHref] = useState('/user-dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/login');
          return;
        }

        // Check if user has a vendor profile (they shouldn't be here if they do)
        const { data: vendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

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
  }, [router, supabase]);

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
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href={dashboardHref}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <p className="text-sm text-slate-500">Messages</p>
              <h1 className="text-2xl font-bold text-slate-900">Vendor Messages</h1>
            </div>
          </div>
          <Link href={dashboardHref} className="text-amber-600 font-semibold hover:text-amber-700 transition">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Messages Component */}
      <div className="flex-1">
        <UserVendorMessagesTab />
      </div>
    </div>
  );
}
