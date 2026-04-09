'use client';

import Navbar from '@/components/Navbar';

export default function RFQDashboardLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
