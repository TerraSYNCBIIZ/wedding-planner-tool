'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { InviteUserForm } from '@/components/invitation/InviteUserForm';
import { InvitationList } from '@/components/invitation/InvitationList';
import { InvitationProvider } from '@/context/InvitationContext';
import { WorkspaceMembership } from '@/components/dashboard/WorkspaceMembership';
import { DeleteAccount } from '@/components/profile/DeleteAccount';

export default function ProfilePage() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect via the useEffect
  }
  
  return (
    <InvitationProvider>
      <div className="container mx-auto py-10 px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-gray-600">Manage your account and invite collaborators</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Account Details</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </h3>
                  <div className="py-2 px-3 bg-gray-50 rounded border border-gray-200">
                    {user.displayName || 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <h3 className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </h3>
                  <div className="py-2 px-3 bg-gray-50 rounded border border-gray-200">
                    {user.email}
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleSignOut}
                    variant="secondary"
                    className="w-full"
                  >
                    Sign Out
                  </Button>
                </div>
                
                <DeleteAccount />
              </div>
            </div>
          </div>
          
          <div>
            <InviteUserForm />
            <InvitationList />
          </div>
        </div>
        
        {/* Wedding Workspaces */}
        <div className="mb-10">
          <WorkspaceMembership />
        </div>
      </div>
    </InvitationProvider>
  );
} 