'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, UserPlus } from 'lucide-react';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [authComplete, setAuthComplete] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signUp } = useAuth();
  
  useEffect(() => {
    const redirect = searchParams?.get('redirect');
    const token = searchParams?.get('token');
    
    if (redirect) {
      console.log('Signup: Found redirect parameter:', redirect);
      if (token) {
        console.log('Signup: Found token parameter:', token);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('invitationToken', token);
        }
        setRedirectTo(`${redirect}?token=${token}`);
      } else {
        setRedirectTo(redirect);
      }
    }
  }, [searchParams]);
  
  useEffect(() => {
    if (authComplete && redirectTo) {
      console.log('Signup: Auth complete, redirecting to', redirectTo);
      
      // Check if this is an invitation redirect
      const isInvitationRedirect = redirectTo?.includes('/invitation/accept');
      
      // If it's an invitation redirect, ensure we don't interfere with the flow
      if (isInvitationRedirect) {
        console.log('Signup: This is an invitation acceptance redirect, prioritizing it over setup wizard');
      }
      
      const redirectTimer = setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
    
    if (authComplete) {
      console.log('Signup: Auth complete, redirecting to setup wizard');
      router.push('/setup-wizard');
    }
  }, [authComplete, redirectTo, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!displayName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create the user
      await signUp(email, password, displayName);
      
      // Check if this is an invitation flow
      const isInvitationFlow = redirectTo?.includes('/invitation/accept');
      
      // After successful signup, check if redirectTo is set
      if (!redirectTo) {
        console.log('Signup: No redirect parameter, going to setup wizard');
        setRedirectTo('/setup-wizard');
      } else {
        console.log('Signup: Using provided redirect:', redirectTo);
        
        // If this is an invitation flow, log it for debugging
        if (isInvitationFlow) {
          console.log('Signup: This is an invitation flow, will prioritize invitation acceptance');
        }
      }
      
      setAuthComplete(true);
    } catch (error: unknown) {
      // Extract error message from Firebase
      let errorMessage = 'An error occurred during sign up';
      
      if (error instanceof Error) {
        const firebaseError = error as { code?: string; message: string };
        
        if (firebaseError.code === 'auth/email-already-in-use') {
          errorMessage = 'This email is already registered';
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address';
        } else if (firebaseError.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak';
        } else {
          errorMessage = firebaseError.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md w-full mx-auto px-4">
      <div className="bg-white/90 backdrop-blur shadow-xl rounded-lg border border-blue-200 p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            Create your account
          </h2>
          <p className="text-blue-700">
            Or{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 underline">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your full name"
            />
          </div>
          
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Password (min. 6 characters)"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm your password"
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
              disabled={isLoading}
              className="w-full py-2.5"
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" aria-hidden="true" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 