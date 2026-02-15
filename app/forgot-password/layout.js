'use client';

import Navbar from '@/components/Navbar';

export default function ForgotPasswordLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
