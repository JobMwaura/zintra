'use client';

import Navbar from '@/components/Navbar';

export default function VendorLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
