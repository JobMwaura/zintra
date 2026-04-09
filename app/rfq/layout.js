'use client';

import Navbar from '@/components/Navbar';

export default function RFQLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
