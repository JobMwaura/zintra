'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PendingRFQsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to RFQ management page in dashboard
    router.push('/admin/dashboard/rfqs?tab=pending');
  }, [router]);

  return null;
}
