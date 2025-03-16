'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WizardLayout } from '@/components/wizard/WizardLayout';
import { WelcomeStep } from '@/components/wizard/WelcomeStep';
import { BasicInfoStep } from '@/components/wizard/BasicInfoStep';
import { BudgetStep } from '@/components/wizard/BudgetStep';
import { CompletionStep } from '@/components/wizard/CompletionStep';
import { firestore } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { hasCompletedSetup } from '@/lib/wizard-utils';
import { setCookie } from 'cookies-next';
import { useAuth } from '@/context/AuthContext';

export default function SetupWizardPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading } = useAuth();
  
  // Check authentication and redirect if needed
  useEffect(() => {
    // If auth check is still loading, wait
    if (loading) return;
    
    // If not authenticated, redirect to login
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    
    // If already completed setup, redirect to dashboard
    if (hasCompletedSetup() && user) {
      router.push('/');
    }
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
      
      // Create wedding data linked to the current user
      const weddingSetupData = {
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        displayName: user.displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to Firestore using the user's ID as the document ID
      await setDoc(doc(firestore, 'weddings', user.uid), weddingSetupData);
      
      // Set the cookie to indicate the user has completed setup
      setCookie('hasCompletedSetup', 'true', {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/'
      });
      
      // Wait a moment so user can see the completion state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to the dashboard
      router.push('/');
    } catch (error) {
      console.error('Error saving wedding data:', error);
      alert('There was an error saving your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If still loading auth or not authenticated, show loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-indigo-500 rounded-full"></div>
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