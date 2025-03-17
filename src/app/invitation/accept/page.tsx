'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { InvitationProcessor } from '@/components/invitation/InvitationProcessor';

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

function InvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const inviteToken = searchParams.get('token');
  
  useEffect(() => {
    // Store the invitation token in sessionStorage so it persists through redirects
    if (inviteToken) {
      console.log('InvitationAccept: Storing invitation token in session storage:', inviteToken);
      sessionStorage.setItem('invitationToken', inviteToken);
    } else {
      console.log('InvitationAccept: No invitation token in URL, checking session storage');
      const storedToken = sessionStorage.getItem('invitationToken');
      if (storedToken) {
        console.log('InvitationAccept: Found invitation token in session storage:', storedToken);
      } else {
        console.log('InvitationAccept: No invitation token found in session storage');
      }
    }
  }, [inviteToken]);
  
  // Show different UI based on authentication status
  if (loading) {
    console.log('InvitationAccept: Auth is still loading');
    return <LoadingFallback />;
  }
  
  if (user) {
    console.log('InvitationAccept: User is authenticated, processing invitation');
  } else {
    console.log('InvitationAccept: User is not authenticated, showing sign in options');
  }
  
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-md mx-auto bg-white/90 rounded-xl shadow-lg p-8 space-y-6 border border-blue-200">
        <h1 className="text-2xl font-serif font-bold text-blue-800 text-center">
          Wedding Invitation
        </h1>
        
        {user ? (
          <>
            <p className="text-center text-blue-700">
              Processing your invitation...
            </p>
            <InvitationProcessor />
          </>
        ) : (
          <>
            <p className="text-center text-blue-700">
              Please sign in to view and respond to this invitation.
            </p>
            <div className="flex justify-center space-x-4">
              <Link 
                href={`/auth/login${inviteToken ? `?redirect=/invitation/accept&token=${inviteToken}` : ''}`}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href={`/auth/signup${inviteToken ? `?redirect=/invitation/accept&token=${inviteToken}` : ''}`}
                className="px-6 py-2 bg-white text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
  
export default function AcceptInvitationPage() {
  console.log('InvitationAccept: Rendering invitation acceptance page');
  
  return (
    <>
      <ParallaxBackground />
      <Suspense fallback={<LoadingFallback />}>
        <InvitationContent />
      </Suspense>
    </>
  );
} 