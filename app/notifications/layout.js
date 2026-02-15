'use client';

import Navbar from '@/components/Navbar';

export default function NotificationsLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
