'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RFQsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to integrated RFQ management in dashboard
    router.push('/admin/dashboard?tab=rfqs-pending');
  }, [router]);

  return null;
}
