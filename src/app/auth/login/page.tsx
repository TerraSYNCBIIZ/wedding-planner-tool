'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, LogIn } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { setHasCompletedSetup } from '@/lib/wizard-utils';
import { setCookie } from 'cookies-next';

// Client component that uses useSearchParams
function LoginForm({ onParamsReady }: { onParamsReady: (redirect: string | null, token: string | null) => void }) {
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect');
  const token = searchParams?.get('token');
  
  useEffect(() => {
    onParamsReady(redirect, token);
  }, [redirect, token, onParamsReady]);
  
  return null;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authComplete, setAuthComplete] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  
  const router = useRouter();
  const { signIn, user } = useAuth();
  
  // Handle search params from the client component
  const handleParamsReady = (redirect: string | null, token: string | null) => {
    if (redirect) {
      console.log('Login: Found redirect parameter:', redirect);
      // If we have both redirect and token, combine them
      if (token) {
        console.log('Login: Found token parameter:', token);
        // Store token in session storage for later use
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('invitationToken', token);
        }
        setRedirectTo(`${redirect}?token=${token}`);
      } else {
        setRedirectTo(redirect);
      }
    }
  };
  
  // Effect to handle navigation after auth state is confirmed
  useEffect(() => {
    if (authComplete && redirectTo) {
      console.log('Login: Auth complete, redirecting to', redirectTo);
      
      // Check if this is an invitation acceptance redirect
      const isInvitationRedirect = redirectTo?.includes('/invitation/accept');
      
      // If it's an invitation redirect, ensure we don't interfere with the flow
      if (isInvitationRedirect) {
        console.log('Login: This is an invitation acceptance redirect, prioritizing it over dashboard');
      }
      
      // Use a small timeout to ensure cookies are properly set before navigation
      const redirectTimer = setTimeout(() => {
        router.push(redirectTo);
        router.refresh(); // Force a router refresh to ensure state is updated
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
    
    if (authComplete) {
      // Default redirect to dashboard if no specific redirect is set
      console.log('Login: Auth complete, redirecting to dashboard');
      router.push('/');
    }
  }, [authComplete, redirectTo, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const userCredential = await signIn(email, password);
      console.log('Login: User signed in successfully', { userId: userCredential.uid });
      
      // Check if this is an invitation flow
      const isInvitationFlow = redirectTo?.includes('/invitation/accept');
      
      // If this is an invitation flow, prioritize it over other checks
      if (isInvitationFlow) {
        console.log('Login: This is an invitation flow, prioritizing invitation acceptance');
        setAuthComplete(true);
        return;
      }
      
      // Check if the user has already set up their wedding data in any form
      const userId = userCredential.uid;
      
      // First check if they own a wedding
      console.log('Login: Checking if user owns a wedding');
      const weddingDoc = await getDoc(doc(firestore, 'weddings', userId));
      
      if (weddingDoc.exists()) {
        // If wedding data exists, mark setup as completed and go to dashboard
        console.log('Login: User owns a wedding, marking setup as complete');
        
        // Set cookies directly, in addition to using the utility
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        setCookie('hasCompletedSetup', 'true', { 
          expires: expiryDate,
          path: '/'
        });
        
        setCookie('currentWeddingId', userId, {
          expires: expiryDate,
          path: '/'
        });
        
        // Also use our utility to set localStorage
        setHasCompletedSetup(userId);
        
        setAuthComplete(true);
        // If no redirectTo is set yet, default to dashboard
        if (!redirectTo) {
          setRedirectTo('/');
        }
        return;
      }
      
      // Then check if they are a member of any weddings
      console.log('Login: Checking if user is a member of any weddings');
      const membershipQuery = query(
        collection(firestore, 'workspaceUsers'),
        where('userId', '==', userId)
      );
      
      const membershipsSnapshot = await getDocs(membershipQuery);
      
      if (!membershipsSnapshot.empty) {
        // The user has at least one membership
        console.log('Login: User is a member of at least one wedding, marking setup as complete');
        
        // Set cookies directly, in addition to using the utility
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        setCookie('hasCompletedSetup', 'true', { 
          expires: expiryDate,
          path: '/'
        });
        
        setCookie('currentWeddingId', 'member', {
          expires: expiryDate,
          path: '/'
        });
        
        // Also use our utility to set localStorage
        setHasCompletedSetup('member');
        
        setAuthComplete(true);
        // If no redirectTo is set yet, default to dashboard
        if (!redirectTo) {
          setRedirectTo('/');
        }
        return;
      }
      
      // If no wedding data or memberships exist, redirect to setup wizard
      // unless a specific redirect is set (like for invitation acceptance)
      console.log('Login: No wedding data or memberships found');
      if (!redirectTo) {
        console.log('Login: No redirect parameter, going to setup wizard');
        setRedirectTo('/setup-wizard');
      } else {
        console.log('Login: Using provided redirect:', redirectTo);
      }
      setAuthComplete(true);
    } catch (error: unknown) {
      // Extract error message from Firebase
      let errorMessage = 'An error occurred during sign in';
      
      if (error instanceof Error) {
        const firebaseError = error as { code?: string; message: string };
        
        if (firebaseError.code === 'auth/invalid-login-credentials' || 
            firebaseError.code === 'auth/user-not-found' || 
            firebaseError.code === 'auth/wrong-password') {
          errorMessage = 'Invalid email or password';
        } else if (firebaseError.code === 'auth/user-disabled') {
          errorMessage = 'This account has been disabled';
        } else if (firebaseError.code === 'auth/too-many-requests') {
          errorMessage = 'Too many failed login attempts. Please try again later';
        } else {
          errorMessage = firebaseError.message;
        }
      }
      
      console.error('Login: Error during sign in:', error);
      setError(errorMessage);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md w-full mx-auto px-4">
      {/* Suspense boundary for useSearchParams */}
      <Suspense fallback={null}>
        <LoginForm onParamsReady={handleParamsReady} />
      </Suspense>
      
      <div className="bg-white/90 backdrop-blur shadow-xl rounded-lg border border-blue-200 p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            Sign in to your account
          </h2>
          <p className="text-blue-700">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500 underline">
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your email"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your password"
            />
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <Button
              type="submit"
              disabled={isLoading || authComplete}
              className="w-full py-2.5"
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" aria-hidden="true" />
                  Signing in...
                </>
              ) : authComplete ? (
                <>
                  <span className="inline-block animate-pulse h-4 w-4 mr-2" aria-hidden="true" />
                  Redirecting...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 