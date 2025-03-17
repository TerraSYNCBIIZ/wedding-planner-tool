'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { WorkspaceService, type WorkspaceDetails, type WorkspaceMember } from '@/lib/services/workspace-service';

// Context type
interface WorkspaceContextType {
  workspaces: WorkspaceDetails[];
  isLoading: boolean;
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;
  
  // Workspace management
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (data: {
    coupleNames?: string;
    weddingDate?: string | Date;
    location?: string;
    bypassSetupCheck?: boolean;
  }) => Promise<string>;
  deleteWorkspace: (workspaceId: string) => Promise<boolean>;
  
  // Member management
  removeMember: (memberId: string, workspaceId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, newRole: 'editor' | 'viewer') => Promise<boolean>;
  leaveWorkspace: (memberId: string) => Promise<boolean>;
}

// Create context
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Provider component
export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  
  // Use a ref to track currentWorkspaceId without causing effect reruns
  const currentWorkspaceIdRef = useRef<string | null>(null);
  
  // Keep the ref in sync with the state
  useEffect(() => {
    currentWorkspaceIdRef.current = currentWorkspaceId;
  }, [currentWorkspaceId]);
  
  // Use the workspace listener to keep data up to date
  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setIsLoading(false);
      // Clear the workspace load flag when user logs out
      localStorage.removeItem('initialWorkspaceLoadTriggered');
      return;
    }
    
    // Check if user has a valid auth token
    const hasAuthToken = document.cookie.includes('authToken=') || document.cookie.includes('auth_token=');
    if (!hasAuthToken) {
      console.warn('No auth token found in cookies, skipping workspace listener setup');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    let isUnmounted = false;
    
    console.log('Setting up workspace listeners for user:', user.uid);
    
    // Set up listeners for realtime updates
    const unsubscribe = WorkspaceService.setupWorkspaceListeners(
      user.uid,
      (updatedWorkspaces) => {
        if (isUnmounted) return;
        
        console.log('Workspace listener update:', updatedWorkspaces.length, 'workspaces');
        setWorkspaces(updatedWorkspaces);
        setIsLoading(false);
        
        // Set current workspace ID if not already set
        if (!currentWorkspaceIdRef.current && updatedWorkspaces.length > 0) {
          const ownedWorkspace = updatedWorkspaces.find(w => w.isOwner);
          if (ownedWorkspace) {
            setCurrentWorkspaceId(ownedWorkspace.id);
          } else if (updatedWorkspaces.length > 0) {
            setCurrentWorkspaceId(updatedWorkspaces[0].id);
          }
        }
      }
    );
    
    // Safety timeout to ensure loading state doesn't get stuck
    const safetyTimeout = setTimeout(() => {
      if (isUnmounted) return;
      
      console.log('Safety timeout triggered, resetting loading state');
      setIsLoading(false);
      
      // Don't automatically refresh - this is causing the loop
      // Instead, just reset the loading state
    }, 10000); // 10 second safety timeout
    
    return () => {
      isUnmounted = true;
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [user]); // No need to include currentWorkspaceId as dependency now
  
  // Initial load of workspaces
  const refreshWorkspaces = useCallback(async (): Promise<void> => {
    if (!user) {
      setWorkspaces([]);
      setIsLoading(false);
      return;
    }
    
    // Check if user has a valid auth token
    const hasAuthToken = document.cookie.includes('authToken=') || document.cookie.includes('auth_token=');
    if (!hasAuthToken) {
      console.warn('No auth token found in cookies, skipping workspace refresh');
      setIsLoading(false);
      return;
    }
    
    // Prevent multiple concurrent refreshes
    if (isRefreshing) {
      console.log('Already refreshing workspaces, skipping redundant call');
      return;
    }
    
    try {
      setIsRefreshing(true);
      setIsLoading(true);
      console.log('Manually refreshing workspaces...');
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise<WorkspaceDetails[]>((_, reject) => {
        setTimeout(() => reject(new Error('Workspace refresh timeout')), 15000);
      });
      
      // Race the actual fetch against the timeout
      const updatedWorkspaces = await Promise.race([
        WorkspaceService.getUserWorkspaces(user.uid),
        timeoutPromise
      ]);
      
      console.log('Manual refresh complete:', updatedWorkspaces.length, 'workspaces');
      
      setWorkspaces(updatedWorkspaces);
      
      // Set current workspace ID if not already set and we have workspaces
      if (!currentWorkspaceIdRef.current && updatedWorkspaces.length > 0) {
        const ownedWorkspace = updatedWorkspaces.find(w => w.isOwner);
        if (ownedWorkspace) {
          setCurrentWorkspaceId(ownedWorkspace.id);
        } else if (updatedWorkspaces.length > 0) {
          setCurrentWorkspaceId(updatedWorkspaces[0].id);
        }
      }
    } catch (error) {
      console.error('Error refreshing workspaces:', error);
      // Reset workspaces to empty array on error to prevent stale data
      setWorkspaces([]);
    } finally {
      setIsLoading(false);
      // Add a small delay before allowing another refresh
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  }, [user, isRefreshing]); // Remove currentWorkspaceId from dependencies
  
  // Create a new workspace
  const createWorkspace = useCallback(async (data: {
    coupleNames?: string;
    weddingDate?: string | Date;
    location?: string;
    bypassSetupCheck?: boolean;
  }): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Check if the user has completed the setup wizard, unless bypassed
    if (!data.bypassSetupCheck) {
      const hasCompletedSetup = document.cookie.includes('hasCompletedSetup=true');
      if (!hasCompletedSetup) {
        console.error('User has not completed the setup wizard');
        throw new Error('You must complete the setup wizard before creating a workspace');
      }
    }
    
    try {
      setIsLoading(true);
      
      const workspaceId = await WorkspaceService.createWorkspace({
        ownerId: user.uid,
        ownerName: user.displayName || 'User',
        ownerEmail: user.email || '',
        ...data
      });
      
      // Refresh workspaces list after creation
      await refreshWorkspaces();
      
      // Set the new workspace as current
      setCurrentWorkspaceId(workspaceId);
      
      return workspaceId;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshWorkspaces]);
  
  // Delete a workspace
  const deleteWorkspace = useCallback(async (workspaceId: string): Promise<boolean> => {
    if (!user) {
      return false;
    }
    
    try {
      setIsLoading(true);
      
      const success = await WorkspaceService.deleteWorkspace(workspaceId, user.uid);
      
      if (success) {
        // If the deleted workspace was the current one, update currentWorkspaceId
        if (currentWorkspaceId === workspaceId) {
          const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId);
          if (remainingWorkspaces.length > 0) {
            const ownedWorkspace = remainingWorkspaces.find(w => w.isOwner);
            setCurrentWorkspaceId(ownedWorkspace ? ownedWorkspace.id : remainingWorkspaces[0].id);
          } else {
            setCurrentWorkspaceId(null);
          }
        }
        
        // Update workspaces state
        setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting workspace:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, workspaces, currentWorkspaceId]);
  
  // Remove a member from a workspace
  const removeMember = useCallback(async (memberId: string, workspaceId: string): Promise<boolean> => {
    if (!user) {
      return false;
    }
    
    try {
      setIsLoading(true);
      
      return await WorkspaceService.removeMember({
        workspaceId,
        memberId,
        requestingUserId: user.uid
      });
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Update a member's role
  const updateMemberRole = useCallback(async (memberId: string, newRole: 'editor' | 'viewer'): Promise<boolean> => {
    if (!user) {
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Find the workspace ID for this member
      let workspaceId = '';
      for (const workspace of workspaces) {
        const member = workspace.members.find(m => m.id === memberId);
        if (member) {
          workspaceId = workspace.id;
          break;
        }
      }
      
      if (!workspaceId) {
        console.error('Could not find workspace for member:', memberId);
        return false;
      }
      
      return await WorkspaceService.updateMemberRole({
        workspaceId,
        memberId,
        newRole,
        requestingUserId: user.uid
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, workspaces]);
  
  // Leave a workspace
  const leaveWorkspace = useCallback(async (memberId: string): Promise<boolean> => {
    if (!user) {
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Find the workspace this member belongs to
      let workspaceId = '';
      for (const workspace of workspaces) {
        const member = workspace.members.find(m => m.id === memberId);
        if (member) {
          workspaceId = workspace.id;
          break;
        }
      }
      
      if (!workspaceId) {
        // Try to find from user's memberships
        const memberWorkspace = workspaces.find(w => !w.isOwner && w.id === memberId);
        if (memberWorkspace) {
          workspaceId = memberWorkspace.id;
        } else {
          console.error('Could not find workspace for member:', memberId);
          return false;
        }
      }
      
      const success = await WorkspaceService.removeMember({
        workspaceId,
        memberId,
        requestingUserId: user.uid
      });
      
      if (success) {
        // If the left workspace was the current one, update currentWorkspaceId
        if (currentWorkspaceId === workspaceId) {
          const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId);
          if (remainingWorkspaces.length > 0) {
            const ownedWorkspace = remainingWorkspaces.find(w => w.isOwner);
            setCurrentWorkspaceId(ownedWorkspace ? ownedWorkspace.id : remainingWorkspaces[0].id);
          } else {
            setCurrentWorkspaceId(null);
          }
        }
        
        // Update workspaces state
        setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
      }
      
      return success;
    } catch (error) {
      console.error('Error leaving workspace:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, workspaces, currentWorkspaceId]);
  
  // Set cookie for current workspace
  useEffect(() => {
    if (currentWorkspaceId) {
      // Set a cookie for the current workspace to be used by the middleware
      document.cookie = `currentWorkspaceId=${currentWorkspaceId}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      // Clear the cookie if no workspace selected
      document.cookie = 'currentWorkspaceId=; path=/; max-age=0; SameSite=Lax';
    }
  }, [currentWorkspaceId]);
  
  // Context value
  const value = {
    workspaces,
    isLoading,
    currentWorkspaceId,
    setCurrentWorkspaceId,
    refreshWorkspaces,
    createWorkspace,
    deleteWorkspace,
    removeMember,
    updateMemberRole,
    leaveWorkspace
  };
  
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

// Hook for using the workspace context
export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  
  return context;
};

// Export types
export type { WorkspaceDetails, WorkspaceMember }; 