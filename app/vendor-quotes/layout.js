'use client';

import Navbar from '@/components/Navbar';

export default function VendorQuotesLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
