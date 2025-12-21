'use client';

import Navbar from '@/components/Navbar';

export default function VendorProfileLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
