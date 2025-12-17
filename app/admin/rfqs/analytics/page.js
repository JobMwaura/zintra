'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AnalyticsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Silently redirect using router push (client-side) instead of navigation
    // This prevents a full page reload and keeps the same component context
    const timer = setTimeout(() => {
      router.push('/admin/rfqs?tab=overview');
    }, 0);
    
    return () => clearTimeout(timer);
  }, [router]);

  // Return nothing - this page should never be visible as it redirects immediately
  return null;
}
