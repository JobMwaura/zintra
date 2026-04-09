'use client';

import Navbar from '@/components/Navbar';

export default function RFQsLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
