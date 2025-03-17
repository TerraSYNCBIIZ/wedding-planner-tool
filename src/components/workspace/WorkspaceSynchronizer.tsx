'use client';

import { useEffect, useState, useRef } from 'react';
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { TabSync } from '@/lib/tab-sync';
import { connectionMonitor } from '@/lib/firebase';

/**
 * Error boundary for the WorkspaceSynchronizer
 * Catches errors and prevents them from crashing the app
 */
class WorkspaceSyncErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WorkspaceSynchronizer error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Silent recovery - since this component doesn't render anything visible
      return null;
    }

    return this.props.children;
  }
}

/**
 * WorkspaceSynchronizer component
 * 
 * This component handles tab navigation coordination and workspace synchronization
 * across multiple browser tabs/users to fix collaboration issues
 */
function WorkspaceSynchronizerCore() {
  const { currentWorkspaceId, registerTabActivity, refreshWorkspaces } = useWorkspace();
  const { user } = useAuth();
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tabSyncRef = useRef<TabSync | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  // Reset error count periodically
  useEffect(() => {
    const resetInterval = setInterval(() => {
      if (errorCount > 0) {
        setErrorCount(0);
      }
    }, 60000); // Reset every minute

    return () => clearInterval(resetInterval);
  }, [errorCount]);

  // Set up tab synchronization
  useEffect(() => {
    if (!user || !currentWorkspaceId) {
      // Clean up any existing tab sync
      if (tabSyncRef.current) {
        tabSyncRef.current.destroy();
        tabSyncRef.current = null;
      }
      return;
    }

    try {
      // Create a new tab sync instance for this workspace
      const tabSyncKey = `workspace_sync_${user.uid}_${currentWorkspaceId}`;
      
      tabSyncRef.current = new TabSync({
        key: tabSyncKey,
        onChange: (data) => {
          try {
            console.log('Tab sync data changed:', data);
            
            // If another tab is reporting activity, register our own
            if (data && typeof data === 'object' && 'type' in data && data.type === 'activity') {
              // Register our own activity with a small delay
              setTimeout(() => registerTabActivity(), 100);
            }
            
            // If another tab is requesting a refresh, do it
            if (data && typeof data === 'object' && 'type' in data && data.type === 'refresh_request') {
              console.log('Received refresh request from another tab');
              refreshWorkspaces().catch(error => {
                console.error('Error refreshing workspaces after tab request:', error);
                setErrorCount(prev => prev + 1);
              });
            }
          } catch (error) {
            console.error('Error handling tab sync data:', error);
            setErrorCount(prev => prev + 1);
          }
        },
        onTabActive: () => {
          console.log('Tab became active');
          registerTabActivity();
          
          // Request a refresh when tab becomes active
          refreshWorkspaces().catch(error => {
            console.error('Error refreshing workspaces after tab activation:', error);
            setErrorCount(prev => prev + 1);
          });
          
          // Notify other tabs of our activity
          if (tabSyncRef.current) {
            tabSyncRef.current.update({
              type: 'activity',
              timestamp: Date.now()
            });
          }
        },
        onTabInactive: () => {
          console.log('Tab became inactive');
        },
        debug: process.env.NODE_ENV !== 'production' // Only debug in non-production
      });
      
      // Set up periodic synchronization
      syncIntervalRef.current = setInterval(() => {
        try {
          // Register tab activity every 5 seconds to maintain presence
          registerTabActivity();
          setLastSyncTime(Date.now());
          
          // Update tab sync with our activity
          if (tabSyncRef.current) {
            tabSyncRef.current.update({
              type: 'activity',
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error('Error in sync interval:', error);
          setErrorCount(prev => prev + 1);
        }
      }, 5000);
      
      // Initial registration
      registerTabActivity();
    } catch (error) {
      console.error('Error setting up tab sync:', error);
      setErrorCount(prev => prev + 1);
    }
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      if (tabSyncRef.current) {
        try {
          tabSyncRef.current.destroy();
        } catch (error) {
          console.error('Error destroying tab sync:', error);
        }
        tabSyncRef.current = null;
      }
    };
  }, [user, currentWorkspaceId, registerTabActivity, refreshWorkspaces]);
  
  // Handle connection status changes
  useEffect(() => {
    if (!user || !currentWorkspaceId) return;
    
    let connectionListenerId = '';
    let lastRefreshTime = 0;
    const REFRESH_COOLDOWN_MS = 60000; // 60 seconds minimum between refreshes
    const CONNECTION_STABILITY_THRESHOLD = 5000; // Wait this long before considering connection stable
    let connectionStable = true;
    let connectionStabilityTimer: NodeJS.Timeout | null = null;
    
    try {
      connectionListenerId = connectionMonitor.addListener((isOnline) => {
        // Log the status change but don't act on it immediately
        console.log(`Connection status changed: ${isOnline ? 'online' : 'offline'}`);
        
        // If we're going offline, clear any pending timers
        if (!isOnline) {
          connectionStable = false;
          if (connectionStabilityTimer) {
            clearTimeout(connectionStabilityTimer);
            connectionStabilityTimer = null;
          }
          return;
        }
        
        // When coming back online, ensure connection is stable before refreshing
        if (isOnline && !connectionStable) {
          // Clear any existing timer
          if (connectionStabilityTimer) {
            clearTimeout(connectionStabilityTimer);
          }
          
          // Set a timer to wait for connection stability
          connectionStabilityTimer = setTimeout(() => {
            connectionStable = true;
            
            // Only refresh if we haven't refreshed recently
            const now = Date.now();
            if (now - lastRefreshTime > REFRESH_COOLDOWN_MS) {
              console.log('Connection restored and stable, refreshing data...');
              lastRefreshTime = now;
              
              // Register our activity
              registerTabActivity();
              
              // Refresh workspaces with a small delay
              setTimeout(() => {
                refreshWorkspaces().catch(error => {
                  console.error('Error refreshing workspaces after reconnection:', error);
                  setErrorCount(prev => prev + 1);
                });
              }, 500);
              
              // Request other tabs to refresh as well, but only if we're refreshing
              if (tabSyncRef.current) {
                tabSyncRef.current.update({
                  type: 'refresh_request',
                  timestamp: now
                });
              }
            } else {
              console.log(`Skipping refresh - last refresh was ${(now - lastRefreshTime) / 1000}s ago`);
            }
          }, CONNECTION_STABILITY_THRESHOLD);
        }
      });
    } catch (error) {
      console.error('Error setting up connection listener:', error);
      setErrorCount(prev => prev + 1);
    }
    
    return () => {
      if (connectionListenerId) {
        try {
          connectionMonitor.removeListener(connectionListenerId);
        } catch (error) {
          console.error('Error removing connection listener:', error);
        }
      }
      
      if (connectionStabilityTimer) {
        clearTimeout(connectionStabilityTimer);
      }
    };
  }, [user, currentWorkspaceId, registerTabActivity, refreshWorkspaces]);
  
  // Handle beforeunload event
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('Tab closing, cleaning up');
      
      // Clean up tab sync
      if (tabSyncRef.current) {
        try {
          tabSyncRef.current.destroy();
        } catch (error) {
          console.error('Error destroying tab sync on unload:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
}

/**
 * Exported WorkspaceSynchronizer with error boundary
 */
export function WorkspaceSynchronizer() {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // In production, we might want to log this to a service
    if (process.env.NODE_ENV === 'production') {
      // Log to service (future implementation)
      console.error('WorkspaceSynchronizer error (would log to service in production):', error);
    } else {
      console.error('WorkspaceSynchronizer error:', error, errorInfo);
    }
  };

  return (
    <WorkspaceSyncErrorBoundary onError={handleError}>
      <WorkspaceSynchronizerCore />
    </WorkspaceSyncErrorBoundary>
  );
} 