'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { WelcomeStep } from '@/components/wizard/WelcomeStep';
import { BasicInfoStep } from '@/components/wizard/BasicInfoStep';
import { BudgetStep } from '@/components/wizard/BudgetStep';
import { QuickStartStep } from '@/components/wizard/QuickStartStep';
import { CompletionStep } from '@/components/wizard/CompletionStep';
import { firestore } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { hasCompletedSetup, setHasCompletedSetup } from '@/lib/wizard-utils';
import { setCookie } from 'cookies-next';
import { useAuth } from '@/context/AuthContext';
import { useWedding } from '@/context/WeddingContext';
import { useWorkspace } from '@/context/WorkspaceContext';

export default function SetupWizardPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { user, loading } = useAuth();
  const { createWorkspace } = useWorkspace();
  
  // Check authentication and redirect if needed
  useEffect(() => {
    const checkUserSetup = async () => {
      // If auth check is still loading, wait
      if (loading) return;
      
      // If not authenticated, redirect to login
      if (!loading && !user) {
        console.log('Setup wizard: No authenticated user, redirecting to login');
        router.push('/auth/login');
        return;
      }
      
      try {
        console.log('Setup wizard: Checking if user has completed setup', { user: user?.uid });
        
        // Check if there's an invitation token in session storage
        // If there is, redirect to the invitation acceptance page
        if (typeof window !== 'undefined') {
          const invitationToken = sessionStorage.getItem('invitationToken');
          if (invitationToken) {
            console.log('Setup wizard: Found invitation token in session storage, redirecting to invitation acceptance page');
            router.push(`/invitation/accept?token=${invitationToken}`);
            return;
          }
        }
        
        // First check if the user has already completed setup (via cookie/localStorage)
        if (hasCompletedSetup()) {
          console.log('Setup wizard: User has completed setup (from localStorage/cookies), redirecting to dashboard');
          router.push('/');
          return;
        }
        
        // If not found in cookie/localStorage, check Firestore directly
        if (user) {
          console.log('Setup wizard: Checking Firestore for user wedding data');
          
          // Check for weddings owned by this user
          const weddingDoc = await getDoc(doc(firestore, 'weddings', user.uid));
          
          // If the user already has wedding data, mark setup as completed and redirect
          if (weddingDoc.exists()) {
            console.log('Setup wizard: Found user wedding in Firestore, marking setup as complete');
            // Set up the completed flag
            setHasCompletedSetup(user.uid);
            router.push('/');
            return;
          }
          
          // Also check if the user is a member of any weddings
          console.log('Setup wizard: Checking if user is a member of any weddings');
          const membershipQuery = query(
            collection(firestore, 'workspaceUsers'),
            where('userId', '==', user.uid)
          );
          
          const membershipsSnapshot = await getDocs(membershipQuery);
          
          if (!membershipsSnapshot.empty) {
            console.log('Setup wizard: User is a member of at least one wedding, marking setup as complete');
            // The user has at least one membership, so they don't need to go through setup
            setHasCompletedSetup('member'); // Using 'member' as a placeholder ID
            router.push('/');
            return;
          }
          
          console.log('Setup wizard: User has not completed setup, showing wizard');
        }
      } catch (error) {
        console.error('Setup wizard: Error checking wedding data:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkUserSetup();
  }, [loading, user, router]);
  
  // Define the wizard steps
  const wizardSteps = [
    {
      key: 'welcome',
      title: 'Welcome',
      subtitle: 'Let\'s set up your wedding planner',
      component: WelcomeStep
    },
    {
      key: 'basic-info',
      title: 'Basic Information',
      subtitle: 'Tell us about your wedding',
      component: BasicInfoStep
    },
    {
      key: 'budget',
      title: 'Budget',
      subtitle: 'Set your wedding budget',
      component: BudgetStep
    },
    {
      key: 'quick-start',
      title: 'Quick Start',
      subtitle: 'Set up expenses and contributors',
      component: QuickStartStep
    },
    {
      key: 'completion',
      title: 'All Done!',
      subtitle: 'Your wedding planner is ready',
      component: CompletionStep
    }
  ];
  
  // Handle wizard completion
  const handleWizardComplete = async (formData: Record<string, unknown>) => {
    setIsSubmitting(true);
    
    try {
      // Make sure we have a user
      if (!user) {
        throw new Error('No user is signed in');
      }
      
      console.log('Setup wizard: Completing setup for user', user.uid);
      
      // Combine the couple names
      const person1Name = formData.person1Name as string || '';
      const person2Name = formData.person2Name as string || '';
      const coupleNames = person1Name && person2Name 
        ? `${person1Name} & ${person2Name}` 
        : 'Wedding';
      
      console.log('Setup wizard: Creating workspace with data:', {
        coupleNames,
        weddingDate: formData.weddingDate,
        location: formData.location
      });
      
      // Create a workspace using the WorkspaceContext
      const workspaceId = await createWorkspace({
        coupleNames: coupleNames,
        weddingDate: formData.weddingDate as string | Date,
        location: formData.location as string,
        bypassSetupCheck: true // Bypass the setup check since we're in the setup wizard
      });
      
      // Mark setup as completed
      setHasCompletedSetup(workspaceId);
      
      // Wait a moment so user can see the completion state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Setup wizard: Setup completed successfully, redirecting to dashboard');
      
      // Redirect to the dashboard
      router.push('/');
    } catch (error) {
      console.error('Setup wizard: Error saving wedding data:', error);
      alert('There was an error saving your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If still loading auth, checking setup status, or not authenticated, show loading state
  if (loading || isChecking || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-indigo-500 rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <WizardLayout 
        steps={wizardSteps}
        onComplete={handleWizardComplete}
        initialData={{
          currency: 'USD',
          totalBudget: 0
        }}
      />
    </div>
  );
} 