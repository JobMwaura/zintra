'use client';

import Navbar from '@/components/Navbar';

export default function UserRegistrationLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
