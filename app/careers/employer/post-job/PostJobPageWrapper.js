'use client';

import { useSearchParams } from 'next/navigation';
import PostJobContent from './PostJobContent';

/**
 * Wrapper component to handle useSearchParams()
 * This is necessary because useSearchParams() requires dynamic rendering
 * and needs to be in a separate client component
 */
export default function PostJobPageWrapper() {
  const searchParams = useSearchParams();
  
  return <PostJobContent searchParams={searchParams} />;
}
