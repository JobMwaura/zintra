'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import NotificationToast from '@/components/NotificationToast';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
      <NotificationToast />
    </AuthProvider>
  );
}
