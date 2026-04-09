'use client';

import Navbar from '@/components/Navbar';

export default function QuoteComparisonLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
