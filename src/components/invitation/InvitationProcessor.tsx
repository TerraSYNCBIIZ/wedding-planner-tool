'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useInvitations } from '@/context/InvitationContext';
import { Alert } from '@/components/ui/Alert';

type InvitationResult = {
  success: boolean;
  workspaceId?: string;
  error?: string;
  message?: string;
};

export function InvitationProcessor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const { acceptInvitation } = useInvitations();
  
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);

  // Check for invitation token in query params or session storage
  useEffect(() => {
    if (processing) return;

    // First check URL params
    const token = searchParams?.get('token');
    
    // Then check session storage as fallback
    const storedToken = typeof window !== 'undefined' 
      ? sessionStorage.getItem('invitationToken')
      : null;
    
    if (token) {
      console.log('InvitationProcessor: Found invitation token in URL:', token);
      setInvitationToken(token);
      // Store in session in case of auth redirect
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('invitationToken', token);
      }
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      router.replace(url.pathname + url.search);
    } else if (storedToken) {
      console.log('InvitationProcessor: Found invitation token in session storage:', storedToken);
      setInvitationToken(storedToken);
    } else {
      console.log('InvitationProcessor: No invitation token found in URL or session storage');
    }
  }, [searchParams, router, processing]);

  // Process invitation if user is logged in and we have a token
  useEffect(() => {
    const processStoredInvitation = async () => {
      if (loading) {
        console.log('InvitationProcessor: Auth is still loading, waiting...');
        return;
      }
      
      if (!user) {
        console.log('InvitationProcessor: No authenticated user, cannot process invitation');
        return;
      }
      
      if (!invitationToken) {
        console.log('InvitationProcessor: No invitation token available');
        return;
      }
      
      if (processing) {
        console.log('InvitationProcessor: Already processing invitation');
        return;
      }
      
      console.log('InvitationProcessor: Processing invitation token:', invitationToken);
      setProcessing(true);
      await processInvitation();
    };

    processStoredInvitation();
  }, [loading, user, invitationToken, processing]);

  const processInvitation = async () => {
    if (!invitationToken || !user) return;
    
    try {
      console.log('InvitationProcessor: Starting invitation processing');
      
      const result = await acceptInvitation(invitationToken);
      
      console.log('InvitationProcessor: Invitation processing result:', result);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Invitation accepted successfully! You now have access to the workspace.'
        });
        
        // Clean up session storage
        if (typeof window !== 'undefined') {
          console.log('InvitationProcessor: Clearing invitation token from session storage');
          sessionStorage.removeItem('invitationToken');
        }
        
        // Short delay before redirecting to dashboard
        console.log('InvitationProcessor: Redirecting to main dashboard in 2 seconds');
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        console.log('InvitationProcessor: Failed to accept invitation:', result.error);
        setMessage({
          type: 'error',
          text: result.error || 'Failed to accept invitation. It may be expired or invalid.'
        });
      }
    } catch (error) {
      console.error('InvitationProcessor: Error processing invitation:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred while processing the invitation.'
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!invitationToken) {
    return null;
  }

  return (
    <div className="py-4">
      {message && (
        <Alert type={message.type} className="mb-4">
          {message.text}
        </Alert>
      )}
      
      {processing && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-2 text-gray-600">Processing invitation...</span>
        </div>
      )}
    </div>
  );
} 