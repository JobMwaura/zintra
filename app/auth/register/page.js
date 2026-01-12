'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'customer';

  useEffect(() => {
    // Redirect to appropriate registration page based on type
    if (type === 'vendor') {
      router.push('/vendor-registration');
    } else {
      router.push('/user-registration');
    }
  }, [type, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-slate-600">Redirecting to registration...</p>
    </div>
  );
}
