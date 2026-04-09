'use client';

import Navbar from '@/components/Navbar';

export default function VendorRegistrationLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
