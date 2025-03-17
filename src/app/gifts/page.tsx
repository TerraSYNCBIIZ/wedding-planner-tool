'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now deprecated - we've combined gifts and contributors
export default function GiftsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new combined contributors page
    router.replace('/contributors');
  }, [router]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center">
        <p>Redirecting to the Contributors page...</p>
      </div>
    </div>
  );
} 