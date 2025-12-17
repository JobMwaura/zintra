'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActiveRFQsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to RFQ management page in dashboard
    router.push('/admin/dashboard/rfqs?tab=active');
  }, [router]);

  return null;
}
