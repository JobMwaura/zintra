'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import RFQsTab from '@/components/dashboard/RFQsTab';

export default function VendorQuotesPage() {
  const [profileHref, setProfileHref] = useState('/dashboard');

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
    };

    loadVendorProfile();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Vendor Workspace</p>
            <h1 className="text-2xl font-bold text-slate-900">Quotes</h1>
          </div>
          <Link href={profileHref} className="text-amber-700 font-semibold hover:underline">
            Back to profile
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <RFQsTab />
      </div>
    </div>
  );
}
