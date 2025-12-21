'use client';

import Navbar from '@/components/Navbar';

export default function BrowseLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
