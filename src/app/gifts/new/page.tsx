'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now deprecated - we've combined gifts and contributors
export default function NewGiftPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new gift page in contributors section
    router.replace('/contributors/new-gift');
  }, [router]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center">
        <p>Redirecting to the new gift form...</p>
      </div>
    </div>
  );
} 