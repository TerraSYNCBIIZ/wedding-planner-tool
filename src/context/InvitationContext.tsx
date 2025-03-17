'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { InvitationService, type Invitation, type InvitationRole } from '@/lib/services/invitation-service';
import { useWorkspace } from './WorkspaceContext';

// Context type
interface InvitationContextType {
  invitations: Invitation[];
  isLoading: boolean;
  
  // Invitation methods
  getInvitations: () => Promise<void>;
  sendInvitation: (email: string, role: InvitationRole) => Promise<{ success: boolean; error?: string }>;
  acceptInvitation: (token: string) => Promise<{ success: boolean; workspaceId?: string; error?: string }>;
  declineInvitation: (token: string) => Promise<{ success: boolean; error?: string }>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
}

// Create Context
const InvitationContext = createContext<InvitationContextType | undefined>(undefined);

// Provider component
export const InvitationProvider = ({ children }: { children: ReactNode }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { currentWorkspaceId, refreshWorkspaces } = useWorkspace();
  
  // Get invitations for the current workspace
  const getInvitations = useCallback(async (): Promise<void> => {
    if (!user || !currentWorkspaceId) {
      setInvitations([]);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get invitations for this workspace
      const workspaceInvitations = await InvitationService.getWorkspaceInvitations(
        currentWorkspaceId,
        user.uid
      );
      
      setInvitations(workspaceInvitations);
    } catch (error) {
      console.error('Error getting invitations:', error);
      setInvitations([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, currentWorkspaceId]);
  
  // Send an invitation to a user
  const sendInvitation = async (email: string, role: InvitationRole): Promise<{ success: boolean; error?: string }> => {
    if (!user || !currentWorkspaceId) {
      return { success: false, error: 'You must be signed in and have a workspace selected' };
    }
    
    try {
      setIsLoading(true);
      
      // Validate email
      if (!email || !email.includes('@')) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      
      // Don't allow inviting yourself
      if (user.email && email.toLowerCase() === user.email.toLowerCase()) {
        return { success: false, error: 'You cannot invite yourself to your own workspace' };
      }
      
      // Send the invitation
      const result = await InvitationService.sendInvitation({
        email,
        workspaceId: currentWorkspaceId,
        invitedBy: user.uid,
        invitedByName: user.displayName || '',
        invitedByEmail: user.email || '',
        role
      });
      
      // If successful, refresh the invitations list
      if (result.success) {
        await getInvitations();
      }
      
      return result;
    } catch (error) {
      console.error('Error sending invitation:', error);
      return { success: false, error: 'Failed to send invitation' };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Accept an invitation
  const acceptInvitation = async (token: string): Promise<{ success: boolean; workspaceId?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be signed in to accept an invitation' };
    }
    
    try {
      setIsLoading(true);
      
      // Accept the invitation
      const result = await InvitationService.acceptInvitation(token, {
        userId: user.uid,
        displayName: user.displayName || '',
        email: user.email || ''
      });
      
      // Refresh workspaces if successful
      if (result.success && result.workspaceId) {
        // Trigger a refresh of workspaces to include the newly joined workspace
        if (refreshWorkspaces) {
          try {
            await refreshWorkspaces();
          } catch (refreshError) {
            console.error('Error refreshing workspaces after accepting invitation:', refreshError);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: 'Failed to accept invitation' };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Decline an invitation
  const declineInvitation = async (token: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be signed in to decline an invitation' };
    }
    
    try {
      setIsLoading(true);
      
      // Decline the invitation
      return await InvitationService.declineInvitation(token, {
        userId: user.uid,
        displayName: user.displayName || '',
        email: user.email || ''
      });
    } catch (error) {
      console.error('Error declining invitation:', error);
      return { success: false, error: 'Failed to decline invitation' };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cancel an invitation (as the sender)
  const cancelInvitation = async (invitationId: string): Promise<boolean> => {
    if (!user) {
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Cancel the invitation
      const success = await InvitationService.cancelInvitation(invitationId, user.uid);
      
      // If successful, refresh the invitations list
      if (success) {
        await getInvitations();
      }
      
      return success;
    } catch (error) {
      console.error('Error canceling invitation:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Context value
  const value = {
    invitations,
    isLoading,
    getInvitations,
    sendInvitation,
    acceptInvitation,
    declineInvitation,
    cancelInvitation
  };
  
  return (
    <InvitationContext.Provider value={value}>
      {children}
    </InvitationContext.Provider>
  );
};

// Hook for using the invitation context
export const useInvitations = (): InvitationContextType => {
  const context = useContext(InvitationContext);
  
  if (context === undefined) {
    throw new Error('useInvitations must be used within an InvitationProvider');
  }
  
  return context;
}; 