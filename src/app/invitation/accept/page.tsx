'use client';

import { Suspense } from 'react';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';

// Tell Next.js this is a dynamic route that should be rendered at request time
export const dynamic = "force-dynamic";

// Loading fallback UI
function LoadingFallback() {
    return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-serif font-bold mb-6 text-blue-800">Loading invitation...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-800 mx-auto" />
      </div>
      </div>
    );
}
  
export default function AcceptInvitationPage() {
  return (
    <>
      <ParallaxBackground />
      <Suspense fallback={<LoadingFallback />}>
        <div className="min-h-screen px-4 py-10">
          <div className="max-w-md mx-auto bg-white/90 rounded-xl shadow-lg p-8 space-y-6 border border-blue-200">
            <h1 className="text-2xl font-serif font-bold text-blue-800 text-center">
              Wedding Invitation
            </h1>
            <p className="text-center text-blue-700">
              Please sign in to view and respond to this invitation.
            </p>
            <div className="flex justify-center space-x-4">
              <a 
                href="/auth/login"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In
              </a>
              </div>
            </div>
        </div>
      </Suspense>
    </>
  );
} 