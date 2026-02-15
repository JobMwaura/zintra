'use client';

import Navbar from '@/components/Navbar';

export default function UserDashboardLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
