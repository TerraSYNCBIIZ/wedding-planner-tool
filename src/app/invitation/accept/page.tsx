'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInvitations } from '@/context/InvitationContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { ParallaxBackground } from '@/components/ui/ParallaxBackground';

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { acceptInvitation, declineInvitation } = useInvitations();
  
  const [status, setStatus] = useState<
    'loading' | 'processing' | 'success' | 'error' | 'unauthorized' | 'ready' | 'signin' | 'signup'
  >('loading');
  const [message, setMessage] = useState('');
  
  // Form states for sign in/sign up
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Invitation details
  const [inviterName, setInviterName] = useState('');
  const [inviterEmail, setInviterEmail] = useState('');
  const [invitationRole, setInvitationRole] = useState<'editor' | 'viewer'>('viewer');
  
  const token = searchParams.get('token');
  const invitationEmail = searchParams.get('email');
  
  // Fetch invitation details
  useEffect(() => {
    const fetchInvitationDetails = async () => {
      if (!token) return;
      
      try {
        const invitationsQuery = query(
          collection(firestore, 'invitations'),
          where('token', '==', token)
        );
        
        const snapshot = await getDocs(invitationsQuery);
        
        if (!snapshot.empty) {
          const invitationData = snapshot.docs[0].data();
          setInviterEmail(invitationData.invitedByEmail || '');
          
          // If the invitation has a recipient email, use it
          if (invitationData.email && !email) {
            setEmail(invitationData.email);
          }
          
          // Get inviter name from the invitation
          if (invitationData.invitedByName) {
            setInviterName(invitationData.invitedByName);
          }
          
          // Get the role
          if (invitationData.role) {
            setInvitationRole(invitationData.role);
          }
        }
      } catch (error) {
        console.error('Error fetching invitation details:', error);
      }
    };
    
    fetchInvitationDetails();
    
    // If email is provided in URL, use it
    if (invitationEmail) {
      setEmail(invitationEmail);
    }
  }, [token, invitationEmail, email]);
  
  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      setStatus('loading');
      setMessage('Checking authentication...');
      return;
    }
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid invitation link. No token provided.');
      return;
    }
    
    // Check if user is logged in
    if (!user) {
      // Default to signup view for unauthorized users
      setStatus('signup');
      return;
    }
    
    // If we have user and token, check the invitation
    console.log('Verifying invitation with token:', token);
    
    // After verification, show the accept/decline buttons
    setStatus('ready');
  }, [token, user, authLoading]);
  
  const handleAccept = async () => {
    if (!token || !user) return;
    
    try {
      setStatus('processing');
      setMessage('Accepting invitation...');
      
      const result = await acceptInvitation(token);
      
      if (result.success) {
        setStatus('success');
        setMessage('Invitation accepted successfully!');
        
        // Set the hasCompletedSetup flag in localStorage and cookies
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year from now
        
        // Set hasCompletedSetup cookie
        document.cookie = `hasCompletedSetup=true; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
        
        // Also set the workspace ID in a cookie for middleware access
        if (result.workspaceId) {
          document.cookie = `currentWorkspaceId=${result.workspaceId}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
          localStorage.setItem('currentWorkspaceId', result.workspaceId);
        }
        
        localStorage.setItem('hasCompletedSetup', 'true');
        
        console.log('Invitation accepted, setup completion flags set:', {
          workspaceId: result.workspaceId,
          cookies: document.cookie
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage('Failed to accept invitation. It may have expired or been revoked.');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setMessage('An error occurred while accepting the invitation.');
    }
  };
  
  const handleDecline = async () => {
    if (!token || !user) return;
    
    try {
      setStatus('processing');
      setMessage('Declining invitation...');
      
      const success = await declineInvitation(token);
      
      if (success) {
        setStatus('success');
        setMessage('Invitation declined.');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage('Failed to decline invitation. It may have expired or been revoked.');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      setStatus('error');
      setMessage('An error occurred while declining the invitation.');
    }
  };
  
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!email || !password) {
      setAuthError('Please fill in all fields');
      return;
    }
    
    try {
      await signIn(email, password);
      // Auth state will update and useEffect will handle the next steps
    } catch (error) {
      console.error('Error signing in:', error);
      setAuthError('Invalid email or password');
    }
  };
  
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!email || !password || !name) {
      setAuthError('Please fill in all fields');
      return;
    }
    
    try {
      await signUp(email, password, name);
      // Auth state will update and useEffect will handle the next steps
    } catch (error) {
      console.error('Error signing up:', error);
      setAuthError('Could not create account. This email may already be in use.');
    }
  };
  
  const renderAuthenticationOptions = () => {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Join Wedding Planner</h2>
        
        {inviterName || inviterEmail ? (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="mb-2">
              <span className="font-medium">{inviterName || inviterEmail.split('@')[0]}</span> has invited you to collaborate on a wedding planning workspace.
            </p>
            {email && <p className="text-sm text-blue-700">This invitation was sent to <span className="font-medium">{email}</span></p>}
            <p className="mt-2 text-sm bg-blue-100 inline-block px-3 py-1 rounded-full text-blue-700">
              You will have <span className="font-medium">{invitationRole === 'editor' ? 'Editor' : 'Viewer'}</span> permissions
            </p>
          </div>
        ) : (
          <p className="mb-6">You've been invited to collaborate on a wedding planning workspace.</p>
        )}
        
        <div className="flex gap-4 justify-center mb-6">
          <Button 
            variant={status === 'signin' ? 'default' : 'outline'}
            onClick={() => setStatus('signin')}
          >
            I already have an account
          </Button>
          <Button 
            variant={status === 'signup' ? 'default' : 'outline'}
            onClick={() => setStatus('signup')}
          >
            Create a new account
          </Button>
        </div>
        
        {status === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-4 text-left">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            {authError && (
              <div className="text-red-500 text-sm">{authError}</div>
            )}
            
            <Button type="submit" className="w-full">
              Sign In & Accept Invitation
            </Button>
            
            <p className="text-center text-sm">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setStatus('signup')}
                className="text-blue-600 hover:underline"
              >
                Create one
              </button>
            </p>
          </form>
        )}
        
        {status === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4 text-left">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Your Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
              />
            </div>
            
            {authError && (
              <div className="text-red-500 text-sm">{authError}</div>
            )}
            
            <Button type="submit" className="w-full">
              Create Account & Accept Invitation
            </Button>
            
            <p className="text-center text-sm">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setStatus('signin')}
                className="text-blue-600 hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    );
  };
  
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background */}
      <ParallaxBackground />
      
      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        {/* Logo/branding */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <span className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center text-white font-serif text-2xl shadow-md group-hover:shadow-lg transition-all duration-200">W</span>
            <span className="font-serif font-bold text-2xl text-blue-900 group-hover:text-blue-700 transition-colors duration-200">Wedding Planner</span>
          </Link>
        </div>
        
        {/* Invitation card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-blue-100 p-8 max-w-md w-full">
          <h1 className="text-2xl font-serif font-bold mb-6 text-center text-blue-800">Wedding Planner Invitation</h1>
          
          {status === 'signin' || status === 'signup' ? (
            renderAuthenticationOptions()
          ) : status === 'loading' ? (
            <div className="text-center">
              <p className="mb-4">{message || 'Loading...'}</p>
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto" />
            </div>
          ) : status === 'processing' ? (
            <div className="text-center">
              <p className="mb-4">{message}</p>
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto" />
            </div>
          ) : status === 'success' ? (
            <div className="text-center">
              <div className="mb-4 text-green-500">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 mx-auto" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-labelledby="success-icon-title"
                >
                  <title id="success-icon-title">Success checkmark</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mb-4 text-lg font-medium text-green-700">{message}</p>
              <p className="text-sm text-blue-600">Redirecting to dashboard...</p>
            </div>
          ) : status === 'error' ? (
            <div className="text-center">
              <div className="mb-4 text-red-500">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 mx-auto" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-labelledby="error-icon-title"
                >
                  <title id="error-icon-title">Error X mark</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mb-6 text-red-700">{message}</p>
              <Link href="/">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </div>
          ) : status === 'ready' ? (
            <div className="text-center">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                {inviterName || inviterEmail ? (
                  <p className="mb-2">
                    <span className="font-medium">{inviterName || inviterEmail.split('@')[0]}</span> has invited you to collaborate on their wedding planning workspace.
                  </p>
                ) : (
                  <p className="mb-2">You've been invited to collaborate on a wedding planning workspace.</p>
                )}
                <p className="mt-2 text-sm bg-blue-100 inline-block px-3 py-1 rounded-full text-blue-700">
                  You will have <span className="font-medium">{invitationRole === 'editor' ? 'Editor' : 'Viewer'}</span> permissions
                </p>
              </div>
              <p className="mb-6">Would you like to join this wedding planning workspace?</p>
              <div className="flex space-x-4">
                <Button 
                  onClick={handleAccept}
                  className="flex-1"
                >
                  Accept
                </Button>
                <Button 
                  onClick={handleDecline}
                  variant="secondary"
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Simple footer */}
      <footer className="py-4 text-center text-sm text-blue-500/70">
        <p>Wedding Finance Planner &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
} 