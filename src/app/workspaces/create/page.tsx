'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { hasCompletedSetup } from '@/lib/wizard-utils';

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { createWorkspace, isLoading } = useWorkspace();
  
  const [coupleNames, setCoupleNames] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  
  // Check if the user has completed the setup wizard
  useEffect(() => {
    // If the user hasn't completed the setup wizard, redirect to it
    if (!hasCompletedSetup()) {
      console.log('User has not completed setup wizard, redirecting');
      router.push('/setup-wizard');
    }
  }, [router]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Double-check that the user has completed the setup wizard
    if (!hasCompletedSetup()) {
      setError('You must complete the setup wizard before creating a workspace');
      return;
    }
    
    try {
      // Create the workspace
      const workspaceId = await createWorkspace({
        coupleNames: coupleNames.trim(),
        weddingDate: weddingDate ? new Date(weddingDate) : undefined,
        location: location.trim()
      });
      
      // Redirect to dashboard or new workspace
      router.push('/');
    } catch (err) {
      console.error('Error creating workspace:', err);
      setError('Failed to create workspace. Please try again.');
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-md">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Workspace</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="coupleNames" className="block text-sm font-medium text-gray-700 mb-1">
              Couple Names
            </label>
            <input
              id="coupleNames"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Jane & John"
              value={coupleNames}
              onChange={(e) => setCoupleNames(e.target.value)}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the names of the couple getting married
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="weddingDate" className="block text-sm font-medium text-gray-700 mb-1">
              Wedding Date
            </label>
            <input
              id="weddingDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={weddingDate}
              onChange={(e) => setWeddingDate(e.target.value)}
            />
            <p className="mt-1 text-sm text-gray-500">
              When is the wedding date? (optional)
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              id="location"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. New York, NY"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <p className="mt-1 text-sm text-gray-500">
              Where will the wedding take place? (optional)
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={isLoading || !coupleNames.trim()}
              className="flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Workspace'}
            </Button>
            
            <Link href="/">
              <Button variant="outline" className="flex-1">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 