'use client';

import Navbar from '@/components/Navbar';

export default function JobOrdersLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
