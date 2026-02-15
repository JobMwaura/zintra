'use client';

import Navbar from '@/components/Navbar';

export default function LoginLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
