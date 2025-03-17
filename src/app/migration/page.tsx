'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MigrationService } from '@/lib/services/migration-service';
import { Button } from '@/components/ui/Button';

export default function MigrationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [migrationStatus, setMigrationStatus] = useState<'checking' | 'needed' | 'not_needed' | 'in_progress' | 'complete' | 'error'>('checking');
  const [oldWeddingsCount, setOldWeddingsCount] = useState(0);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);
  
  // Check if migration is needed when the page loads
  useEffect(() => {
    const checkMigration = async () => {
      if (!user) return;
      
      try {
        // First, check if the user has already migrated
        const hasMigrated = await MigrationService.hasMigrated(user.uid);
        
        if (hasMigrated) {
          setMigrationStatus('complete');
          setMessage('Your data has already been migrated to the new system. Redirecting to dashboard...');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/');
          }, 2000);
          
          return;
        }
        
        // Check if migration is needed
        const { needed, oldWeddingsCount } = await MigrationService.checkMigrationNeeded(user.uid);
        
        if (needed) {
          setMigrationStatus('needed');
          setOldWeddingsCount(oldWeddingsCount);
          setMessage(`We need to upgrade your data. We found ${oldWeddingsCount} wedding ${oldWeddingsCount === 1 ? 'workspace' : 'workspaces'} that need to be migrated.`);
        } else {
          setMigrationStatus('not_needed');
          setMessage('No data migration is needed for your account. Redirecting to dashboard...');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking migration status:', error);
        setMigrationStatus('error');
        setMessage('An error occurred while checking your data migration status. Please try again later.');
      }
    };
    
    if (!authLoading) {
      checkMigration();
    }
  }, [user, authLoading, router]);
  
  // Start the migration process
  const handleStartMigration = async () => {
    if (!user) return;
    
    try {
      setMigrationStatus('in_progress');
      setMessage('Migration in progress. Please do not close this page...');
      setProgress(10);
      
      // Run the full migration process
      const result = await MigrationService.runFullMigration(user.uid);
      
      if (result.success) {
        setMigrationStatus('complete');
        setMessage('Migration complete! Redirecting to dashboard...');
        setProgress(100);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setMigrationStatus('error');
        setMessage(`Migration failed: ${result.message}. Please try again later.`);
      }
    } catch (error) {
      console.error('Error during migration:', error);
      setMigrationStatus('error');
      setMessage('An error occurred during migration. Please try again later.');
    }
  };
  
  // If not authenticated, redirect to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);
  
  // Render appropriate content based on migration status
  const renderContent = () => {
    switch (migrationStatus) {
      case 'checking':
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Checking your data...</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            </div>
          </div>
        );
        
      case 'needed':
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Data Update Required</h2>
            <p className="mb-6">{message}</p>
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6 text-left">
              <h3 className="font-medium text-blue-800 mb-2">What's Changing?</h3>
              <p className="text-blue-700 mb-2">
                We're upgrading our workspace management system to improve collaboration features.
                This update will:
              </p>
              <ul className="list-disc pl-5 text-blue-700 space-y-1">
                <li>Improve reliability when sharing workspaces with others</li>
                <li>Fix issues with deleting workspaces</li>
                <li>Make workspace management more intuitive</li>
                <li>Ensure your data is correctly associated with your account</li>
              </ul>
              <p className="mt-2 text-blue-700">All your existing data will be preserved during this update.</p>
            </div>
            <Button 
              onClick={handleStartMigration}
              className="w-full md:w-auto"
            >
              Start Data Update
            </Button>
          </div>
        );
        
      case 'in_progress':
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Data Update in Progress</h2>
            <p className="mb-6">{message}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              This may take a few moments. Please do not close this page.
            </p>
          </div>
        );
        
      case 'complete':
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Data Update Complete</h2>
            <p className="mb-6">{message}</p>
            <div className="flex justify-center mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Success checkmark">
                <title>Success Checkmark</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <Button 
              onClick={() => router.push('/')}
              className="w-full md:w-auto"
            >
              Go to Dashboard
            </Button>
          </div>
        );
        
      case 'not_needed':
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">No Update Needed</h2>
            <p className="mb-6">{message}</p>
            <div className="flex justify-center mb-6">
              <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Success checkmark">
                <title>Success Checkmark</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Error</h2>
            <p className="mb-6 text-red-600">{message}</p>
            <div className="flex justify-center mb-6">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Error icon">
                <title>Error Icon</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <Button 
              onClick={() => window.location.reload()}
              className="w-full md:w-auto"
            >
              Try Again
            </Button>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-800">Wedding Planner Workspace Update</h1>
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
} 