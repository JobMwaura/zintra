'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Loader } from 'lucide-react';

export default function MyProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Wait for AuthContext to finish loading before checking user
    if (authLoading) {
      console.log('🔹 MyProfilePage: Waiting for auth to load...');
      return;
    }

    const redirectToCorrectProfile = async () => {
      try {
        setIsProcessing(true);

        if (!user) {
          // Not logged in, redirect to login
          console.log('No user found, redirecting to login');
          router.push('/login');
          return;
        }

        // Check if user is a vendor
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (vendorError) {
          console.error('Error checking vendor status:', vendorError);
          router.push('/user-dashboard');
          return;
        }

        if (vendorData) {
          // User is a vendor - redirect to their vendor profile
          console.log('✓ Vendor found, redirecting to vendor profile:', vendorData.id);
          router.push(`/vendor-profile/${vendorData.id}`);
        } else {
          // User is a regular user - redirect to user dashboard
          console.log('✓ Regular user, redirecting to user dashboard');
          router.push('/user-dashboard');
        }
      } catch (error) {
        console.error('Error in profile redirect:', error);
        router.push('/user-dashboard');
      } finally {
        setIsProcessing(false);
      }
    };

    redirectToCorrectProfile();
  }, [user, authLoading, router, supabase]);

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader className="w-10 h-10 animate-spin text-amber-600 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading your profile...</p>
      </div>
    </div>
  );
}
