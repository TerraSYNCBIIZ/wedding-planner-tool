'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { WorkspaceService, type WorkspaceDetails, type WorkspaceMember } from '@/lib/services/workspace-service';
import { connectionMonitor } from '@/lib/firebase';

// Context type
interface WorkspaceContextType {
  workspaces: WorkspaceDetails[];
  isLoading: boolean;
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;
  isOnline: boolean;
  
  // Workspace management
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (data: {
    coupleNames?: string;
    weddingDate?: string | Date;
    location?: string;
    bypassSetupCheck?: boolean;
  }) => Promise<string>;
  updateWorkspace: (workspaceId: string, data: {
    coupleNames?: string;
    weddingDate?: string | Date;
    location?: string;
  }) => Promise<boolean>;
  deleteWorkspace: (workspaceId: string) => Promise<boolean>;
  
  // Member management
  removeMember: (memberId: string, workspaceId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, newRole: 'editor' | 'viewer') => Promise<boolean>;
  leaveWorkspace: (memberId: string) => Promise<boolean>;
  
  // Active user tracking
  registerTabActivity: () => void;
}

// Create context
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Provider component
export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const [workspaces, setWorkspaces] = useState<WorkspaceDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { user } = useAuth();
  
  // Use a ref to track currentWorkspaceId without causing effect reruns
  const currentWorkspaceIdRef = useRef<string | null>(null);
  
  // Session ID to uniquely identify this browser tab
  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  
  // Last activity timestamp
  const lastActivityRef = useRef<number>(Date.now());
  
  // Workspace listener unsubscribe function
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Register tab activity
  const registerTabActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Store session activity in localStorage for cross-tab coordination
    if (user?.uid && currentWorkspaceIdRef.current) {
      try {
        const key = `workspace_activity_${user.uid}_${currentWorkspaceIdRef.current}`;
        const activityData = {
          sessionId: sessionIdRef.current,
          timestamp: lastActivityRef.current
        };
        localStorage.setItem(key, JSON.stringify(activityData));
      } catch (error) {
        console.error('Error registering tab activity:', error);
      }
    }
  }, [user]);
  
  // Keep the ref in sync with the state
  useEffect(() => {
    currentWorkspaceIdRef.current = currentWorkspaceId;
    
    // Update activity when workspace changes
    if (currentWorkspaceId) {
      registerTabActivity();
    }
  }, [currentWorkspaceId, registerTabActivity]);
  
  // Monitor connection status
  useEffect(() => {
    let lastRefreshTime = 0;
    const REFRESH_COOLDOWN_MS = 60000; // 60 seconds between refreshes
    const CONNECTION_STABILITY_THRESHOLD = 5000; // Wait 5 seconds for connection to stabilize
    let connectionStabilityTimer: NodeJS.Timeout | null = null;
    let connectionStable = true;
    
    const connectionListenerId = connectionMonitor.addListener((online) => {
      // Always update the state
      setIsOnline(online);
      
      // If we're going offline, clear any pending timers
      if (!online) {
        connectionStable = false;
        if (connectionStabilityTimer) {
          clearTimeout(connectionStabilityTimer);
          connectionStabilityTimer = null;
        }
        return;
      }
      
      // If we're back online, try to reconnect and refresh data after ensuring connection stability
      if (online && user && !connectionStable) {
        // Clear existing timer if any
        if (connectionStabilityTimer) {
          clearTimeout(connectionStabilityTimer);
        }
        
        // Set a timer to wait for connection stability
        connectionStabilityTimer = setTimeout(() => {
          connectionStable = true;
          const now = Date.now();
          
          // Only perform refresh if we haven't done so recently
          if (now - lastRefreshTime > REFRESH_COOLDOWN_MS) {
            console.log('Connection restored and stable, refreshing workspace data...');
            lastRefreshTime = now;
            
            // Reset workspace listeners with a small delay to avoid race conditions
            setTimeout(() => {
              // Reset workspace listeners
              if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
              }
              
              // Set up listeners again
              const uid = user.uid;
              const sid = sessionIdRef.current;
              setTimeout(() => {
                if (user) {
                  setupWorkspaceListeners(uid, sid);
                }
              }, 100);
            }, 200);
            
            // Refresh data manually with a small delay
            setTimeout(() => {
              if (user) {
                refreshWorkspaces().catch(error => {
                  console.error('Error refreshing workspaces after reconnection:', error);
                });
              }
            }, 500);
          } else {
            console.log(`Skipping workspace refresh - last refresh was ${(now - lastRefreshTime) / 1000}s ago`);
          }
        }, CONNECTION_STABILITY_THRESHOLD);
      }
    });
    
    return () => {
      connectionMonitor.removeListener(connectionListenerId);
      if (connectionStabilityTimer) {
        clearTimeout(connectionStabilityTimer);
      }
    };
  }, [user, sessionIdRef.current, setupWorkspaceListeners, refreshWorkspaces]);
  
  // Setup workspace listeners function
  const setupWorkspaceListeners = useCallback((userId: string, sessionId: string) => {
    if (!userId) return null;
    
    console.log('Setting up workspace listeners for user:', userId, 'session:', sessionId);
    
    // Set up listeners for realtime updates
    const unsubscribe = WorkspaceService.setupWorkspaceListeners(
      userId,
      (updatedWorkspaces) => {
        console.log('Workspace listener update:', updatedWorkspaces.length, 'workspaces');
        setWorkspaces(updatedWorkspaces);
      },
      sessionIdRef.current
    );
    
    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, []);
  
  // Use the workspace listener to keep data up to date
  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setIsLoading(false);
      // Clear the workspace load flag when user logs out
      localStorage.removeItem('initialWorkspaceLoadTriggered');
      
      // Clean up any existing listeners
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
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
    
    // Set up listeners for realtime updates
    const unsubscribe = setupWorkspaceListeners(user.uid, sessionIdRef.current);
    
    // Safety timeout to ensure loading state doesn't get stuck
    const safetyTimeout = setTimeout(() => {
      if (isUnmounted) return;
      
      console.log('Safety timeout triggered, resetting loading state');
      setIsLoading(false);
      
      // Don't automatically refresh - this is causing the loop
      // Instead, just reset the loading state
    }, 10000);
    
    return () => {
      isUnmounted = true;
      clearTimeout(safetyTimeout);
      
      if (unsubscribe) {
        unsubscribe();
        unsubscribeRef.current = null;
      }
    };
  }, [user, setupWorkspaceListeners, sessionIdRef.current]);
  
  // Refresh workspaces manually
  const refreshWorkspaces = useCallback(async (): Promise<void> => {
    if (!user || isRefreshing) {
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
  }, [user, isRefreshing]);
  
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
  
  // Update workspace details
  const updateWorkspace = useCallback(async (
    workspaceId: string, 
    data: {
      coupleNames?: string;
      weddingDate?: string | Date;
      location?: string;
    }
  ): Promise<boolean> => {
    if (!user) {
      return false;
    }
    
    try {
      setIsLoading(true);
      
      const success = await WorkspaceService.updateWorkspace({
        workspaceId,
        requestingUserId: user.uid,
        ...data
      });
      
      if (success) {
        // Refresh workspaces to get updated data
        await refreshWorkspaces();
      }
      
      return success;
    } catch (error) {
      console.error('Error updating workspace:', error);
      return false;
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
      
      const success = await WorkspaceService.removeMember({
        workspaceId,
        memberId,
        requestingUserId: user.uid
      });
      
      if (success) {
        // Update workspaces state to reflect the change
        setWorkspaces(prev => 
          prev.map(workspace => {
            if (workspace.id === workspaceId) {
              return {
                ...workspace,
                members: workspace.members.filter(m => m.id !== memberId)
              };
            }
            return workspace;
          })
        );
      }
      
      return success;
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
      
      // Find the workspace this member belongs to
      let workspaceId = '';
      let memberWorkspace = null;
      
      for (const workspace of workspaces) {
        const member = workspace.members.find(m => m.id === memberId);
        if (member) {
          workspaceId = workspace.id;
          memberWorkspace = workspace;
          break;
        }
      }
      
      if (!workspaceId || !memberWorkspace) {
        console.error('Could not find workspace for member:', memberId);
        return false;
      }
      
      const success = await WorkspaceService.updateMemberRole({
        workspaceId,
        memberId,
        requestingUserId: user.uid,
        newRole
      });
      
      if (success) {
        // Update workspaces state to reflect the change
        setWorkspaces(prev => 
          prev.map(workspace => {
            if (workspace.id === workspaceId) {
              return {
                ...workspace,
                members: workspace.members.map(m => 
                  m.id === memberId ? { ...m, role: newRole } : m
                )
              };
            }
            return workspace;
          })
        );
      }
      
      return success;
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
      
      // Register activity for this workspace
      registerTabActivity();
    } else {
      // Clear the cookie if no workspace selected
      document.cookie = 'currentWorkspaceId=; path=/; max-age=0; SameSite=Lax';
    }
  }, [currentWorkspaceId, registerTabActivity]);
  
  // Context value
  const value = {
    workspaces,
    isLoading,
    currentWorkspaceId,
    setCurrentWorkspaceId,
    isOnline,
    refreshWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    removeMember,
    updateMemberRole,
    leaveWorkspace,
    registerTabActivity
  };
  
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

// Custom hook to use the workspace context
export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  
  return context;
};

// Export types
export type { WorkspaceDetails, WorkspaceMember }; 