'use client';

import { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useInvitations } from '@/context/InvitationContext';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Timestamp } from 'firebase/firestore';
import { FinancialSummary } from '@/components/dashboard/FinancialSummary';

export default function DashboardPage() {
  const { 
    workspaces,
    isLoading: workspacesLoading,
    currentWorkspaceId,
    setCurrentWorkspaceId,
    refreshWorkspaces
  } = useWorkspace();
  
  const { 
    invitations, 
    isLoading: invitationsLoading,
    getInvitations 
  } = useInvitations();
  
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [loadingDuration, setLoadingDuration] = useState(0);
  
  // Use refs to prevent excessive re-renders
  const refreshWorkspacesRef = useRef(refreshWorkspaces);
  const workspacesLoadingRef = useRef(workspacesLoading);
  
  // Keep refs updated
  useEffect(() => {
    refreshWorkspacesRef.current = refreshWorkspaces;
    workspacesLoadingRef.current = workspacesLoading;
  }, [refreshWorkspaces, workspacesLoading]);
  
  // Get the current workspace details
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
  
  // Load invitations for current workspace
  useEffect(() => {
    if (currentWorkspaceId) {
      getInvitations();
    }
  }, [currentWorkspaceId, getInvitations]);
  
  // Count pending invitations
  useEffect(() => {
    const pendingCount = invitations.filter(inv => inv.status === 'pending').length;
    setPendingInvitations(pendingCount);
  }, [invitations]);
  
  // Track loading duration
  useEffect(() => {
    if (workspacesLoading) {
      const timer = setInterval(() => {
        setLoadingDuration(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(timer);
    }
    
    // Reset counter when not loading
    setLoadingDuration(0);
    
    return undefined;
  }, [workspacesLoading]);
  
  // Force refresh after 10 seconds of loading
  useEffect(() => {
    if (loadingDuration >= 10 && workspacesLoadingRef.current) {
      console.log('Loading timeout reached, forcing refresh');
      // Use a flag to avoid multiple refreshes
      const alreadyRefreshed = localStorage.getItem('forcedRefreshTriggered');
      if (!alreadyRefreshed) {
        localStorage.setItem('forcedRefreshTriggered', 'true');
        refreshWorkspacesRef.current().catch(err => {
          console.error('Failed to force refresh workspaces:', err);
        });
      }
    }
    
    // Clear flag when not loading anymore
    if (!workspacesLoadingRef.current) {
      localStorage.removeItem('forcedRefreshTriggered');
    }
    
    // No cleanup function needed
  // Only depend on loadingDuration to avoid re-triggering too often
  }, [loadingDuration]);
  
  // Format date for display
  const formatDate = (date: Date | string | Timestamp | null | undefined) => {
    if (!date) return 'Not set';
    
    // Handle Firebase Timestamp
    if (date instanceof Timestamp) {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date.toDate());
    }
    
    // Handle string or Date
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj);
  };
  
  // Switch workspaces
  const handleWorkspaceChange = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
  };
  
  // Force refresh workspaces
  const handleForceRefresh = () => {
    console.log('Manually forcing workspace refresh');
    refreshWorkspaces().catch(err => {
      console.error('Failed to manually refresh workspaces:', err);
    });
  };
  
  // Loading state
  if (workspacesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
        <p className="text-gray-600 mb-2">Loading workspaces... ({loadingDuration}s)</p>
        {loadingDuration >= 5 && (
          <div className="flex flex-col items-center gap-2">
            <Button onClick={handleForceRefresh} className="mt-4">
              Force Refresh
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Still having trouble? Check your 
              <Link href="/firebase-test" className="text-blue-500 mx-1 hover:underline">
                Firebase connection
              </Link>
              or try refreshing the page.
            </p>
          </div>
        )}
      </div>
    );
  }
  
  // No workspaces state
  if (workspaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to Wedding Planner</h1>
        <p className="mb-8">You don't have any workspaces yet. Create one to get started!</p>
        <Link href="/setup-wizard">
          <Button className="px-6">Create Your First Workspace</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Wedding Planner Dashboard</h1>
          {currentWorkspace && (
            <p className="text-gray-600">
              Current workspace: <span className="font-medium">{currentWorkspace.name}</span>
            </p>
          )}
        </div>
        
        {workspaces.length > 1 && (
          <div className="w-full md:w-auto">
            <select
              className="w-full md:w-auto px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={currentWorkspaceId || ''}
              onChange={(e) => handleWorkspaceChange(e.target.value)}
            >
              {workspaces.map(workspace => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {currentWorkspace && (
        <>
          {/* Financial Summary section */}
          <div className="mb-8">
            <FinancialSummary />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Workspace Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <title>Workspace Info</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Workspace Info
              </h2>
              <div className="space-y-2">
                <p><span className="font-medium">Couple:</span> {currentWorkspace.coupleNames || 'Not set'}</p>
                <p><span className="font-medium">Wedding Date:</span> {currentWorkspace.weddingDate ? formatDate(currentWorkspace.weddingDate) : 'Not set'}</p>
                <p><span className="font-medium">Location:</span> {currentWorkspace.location || 'Not set'}</p>
                <p><span className="font-medium">Owner:</span> {currentWorkspace.ownerName || currentWorkspace.ownerEmail}</p>
                <p><span className="font-medium">Members:</span> {currentWorkspace.members.length + 1}</p>
              </div>
              <div className="mt-4">
                <Link href="/workspaces/settings">
                  <Button variant="outline" size="sm" className="w-full">
                    Manage Workspace
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Members Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <title>Team Members</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Team Members
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-blue-600 font-medium">
                      {currentWorkspace.ownerName?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <p className="font-medium">{currentWorkspace.ownerName || 'Owner'}</p>
                      <p className="text-xs text-gray-500">{currentWorkspace.ownerEmail}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">Owner</span>
                </div>
                
                {currentWorkspace.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 text-gray-600 font-medium">
                        {member.displayName?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <p className="font-medium">{member.displayName}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      member.role === 'editor' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role === 'editor' ? 'Editor' : 'Viewer'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Link href="/members">
                  <Button variant="outline" size="sm">
                    Manage Members
                  </Button>
                </Link>
                {currentWorkspace.isOwner && (
                  <Link href="/invitations">
                    <Button size="sm">
                      Invite Member
                      {pendingInvitations > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-white text-blue-600 rounded-full">
                          {pendingInvitations}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <title>Quick Actions</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link href="/expenses">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <title>Expenses Icon</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Manage Expenses
                  </Button>
                </Link>
                
                <Link href="/guests">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <title>Guest List Icon</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Guest List
                  </Button>
                </Link>
                
                <Link href="/tasks">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <title>Tasks Icon</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Manage Tasks
                  </Button>
                </Link>
                
                <Link href="/vendors">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <title>Vendors Icon</title>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Vendors
                  </Button>
                </Link>
                
                {currentWorkspace.isOwner && (
                  <Link href="/workspaces/settings">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <title>Settings Icon</title>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Workspace Settings
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-500 italic">Activity tracking coming soon...</p>
        </div>
        
        {/* Upcoming Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Upcoming Tasks</h2>
          <p className="text-gray-500 italic">Task management coming soon...</p>
        </div>
      </div>
    </div>
  );
} 