'use client';

import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import NotificationToast from '@/components/NotificationToast';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <NotificationToast />
        </AuthProvider>
      </body>
    </html>
  );
}