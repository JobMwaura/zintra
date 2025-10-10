'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RFQsRoot() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/rfqs/pending');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#ea8f1e' }}></div>
        <p className="mt-4 text-gray-600">Loading RFQs...</p>
      </div>
    </div>
  );
}