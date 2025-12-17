'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActiveRFQsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new unified RFQ dashboard
    router.replace('/admin/rfqs?tab=direct');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#ea8f1e' }}></div>
        <p className="mt-4 text-gray-600">Redirecting to RFQ Management...</p>
      </div>
    </div>
  );
}
