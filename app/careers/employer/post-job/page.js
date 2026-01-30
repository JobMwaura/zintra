'use client';

import dynamic from 'next/dynamic';

const PostJobPageWrapper = dynamic(() => import('./PostJobPageWrapper'), {
  ssr: false,
});

export default function PostJobPage() {
  return <PostJobPageWrapper />;
}
