import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc,
  updateDoc,
  writeBatch,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import type { Timestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { WorkspaceService } from './workspace-service';
import { generateToken } from '@/lib/utils';
import emailjs from '@emailjs/browser';

// EmailJS credentials
const EMAILJS_SERVICE_ID = 'service_lw2p126';
const EMAILJS_TEMPLATE_ID = 'template_d4qe5ym';
const EMAILJS_PUBLIC_KEY = 'b0P2yJHz_ZMo3cVlS';

// Invitation statuses
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// Invitation roles
export type InvitationRole = 'editor' | 'viewer';

// Invitation interface
export interface Invitation {
  id: string;
  email: string;
  workspaceId: string;
  invitedBy: string; // User ID who sent the invitation
  invitedByName?: string;
  invitedByEmail?: string;
  role: InvitationRole;
  status: InvitationStatus;
  token: string;
  createdAt: Timestamp | string;
  expiresAt: Timestamp | string; 
  acceptedAt?: Timestamp | string;
  acceptedBy?: {
    userId: string;
    displayName?: string;
    email?: string;
  };
  declinedAt?: Timestamp | string;
  message?: string;
}

/**
 * Functions for managing workspace invitations
 */
export const InvitationService = {
  /**
   * Send a workspace invitation
   */
  async sendInvitation(data: {
    email: string;
    workspaceId: string;
    invitedBy: string;
    invitedByName?: string;
    invitedByEmail?: string;
    role: InvitationRole;
    message?: string;
  }): Promise<{ success: boolean; invitationId?: string; error?: string }> {
    try {
      // Check if workspace exists and user is the owner
      const workspaceRef = doc(firestore, 'workspaces', data.workspaceId);
      
      return await runTransaction(firestore, async (transaction) => {
        const workspaceDoc = await transaction.get(workspaceRef);
        
        if (!workspaceDoc.exists()) {
          return { success: false, error: 'Workspace not found' };
        }
        
        const workspaceData = workspaceDoc.data();
        
        // Verify the sender is the workspace owner
        if (workspaceData.ownerId !== data.invitedBy) {
          return { success: false, error: 'Only the workspace owner can send invitations' };
        }
        
        // Check if the user is already a member of this workspace
        const existingMemberQuery = query(
          collection(firestore, 'workspaceMembers'),
          where('workspaceId', '==', data.workspaceId),
          where('email', '==', data.email)
        );
        
        const existingMemberSnapshot = await getDocs(existingMemberQuery);
        
        if (!existingMemberSnapshot.empty) {
          return { success: false, error: 'This user is already a member of the workspace' };
        }
        
        // Check for existing pending invitations
        const existingInvitationQuery = query(
          collection(firestore, 'invitations'),
          where('workspaceId', '==', data.workspaceId),
          where('email', '==', data.email),
          where('status', '==', 'pending')
        );
        
        const existingInvitationSnapshot = await getDocs(existingInvitationQuery);
        
        let token = '';
        let invitationId = '';
        
        // If there's an existing invitation, just update it instead of creating a new one
        if (!existingInvitationSnapshot.empty) {
          const existingInvitationDoc = existingInvitationSnapshot.docs[0];
          invitationId = existingInvitationDoc.id;
          
          // Generate a new token
          token = generateToken();
          
          // Calculate expiration date (7 days from now)
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);
          
          // Update the invitation
          transaction.update(existingInvitationDoc.ref, {
            role: data.role,
            status: 'pending',
            token: token,
            expiresAt: expiresAt.toISOString(),
            message: data.message || '',
            updatedAt: serverTimestamp()
          });
        } else {
          // Generate a unique token for this invitation
          token = generateToken();
          
          // Calculate expiration date (7 days from now)
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7);
          
          // Create the invitation document
          const invitationRef = doc(collection(firestore, 'invitations'));
          invitationId = invitationRef.id;
          
          const invitationData = {
            email: data.email,
            workspaceId: data.workspaceId,
            invitedBy: data.invitedBy,
            invitedByName: data.invitedByName || '',
            invitedByEmail: data.invitedByEmail || '',
            role: data.role,
            status: 'pending' as InvitationStatus,
            token: token,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            expiresAt: expiresAt.toISOString(),
            message: data.message || ''
          };
          
          transaction.set(invitationRef, invitationData);
          
          // Update workspace with invitation count
          transaction.update(workspaceRef, {
            pendingInvitationsCount: (workspaceData.pendingInvitationsCount || 0) + 1,
            updatedAt: serverTimestamp()
          });
        }
        
        // After transaction completes, send the email
        // We'll do this outside the transaction to avoid transaction timeouts
        // and because email sending doesn't need to be part of the transaction
        setTimeout(async () => {
          try {
            // Only run EmailJS in browser environment
            if (typeof window === 'undefined') {
              console.log('Skipping email send in server environment');
              return;
            }
            
            // Create invitation link with token
            const invitationLink = `${window.location.origin}/invitation/accept?token=${token}`;
            
            // Prepare email parameters
            const templateParams = {
              to_email: data.email,
              to_name: data.email.split('@')[0],
              from_name: data.invitedByName || 'Wedding Planner',
              invitation_link: invitationLink,
              role: data.role,
              message: data.message || 'You have been invited to collaborate on a wedding planning workspace.',
              reply_to: data.invitedByEmail || '',
              to: data.email
            };
            
            console.log('Sending invitation email with params:', templateParams);
            
            // Send the email
            const result = await emailjs.send(
              EMAILJS_SERVICE_ID,
              EMAILJS_TEMPLATE_ID,
              templateParams,
              EMAILJS_PUBLIC_KEY
            );
            
            console.log('Invitation email sent successfully:', result);
          } catch (emailError) {
            console.error('Error sending invitation email:', emailError);
            // We don't want to fail the invitation creation if email sending fails
            // The user can always resend the invitation
          }
        }, 0);
        
        return { 
          success: true, 
          invitationId: invitationId 
        };
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      return { 
        success: false, 
        error: 'Failed to send invitation'
      };
    }
  },
  
  /**
   * Accept a workspace invitation
   */
  async acceptInvitation(token: string, userData: {
    userId: string;
    displayName?: string;
    email?: string;
  }): Promise<{ success: boolean; workspaceId?: string; error?: string }> {
    try {
      // Find the invitation with this token
      const invitationsQuery = query(
        collection(firestore, 'invitations'),
        where('token', '==', token),
        where('status', '==', 'pending')
      );
      
      const invitationsSnapshot = await getDocs(invitationsQuery);
      
      if (invitationsSnapshot.empty) {
        return { success: false, error: 'Invalid or expired invitation' };
      }
      
      const invitationDoc = invitationsSnapshot.docs[0];
      const invitationData = invitationDoc.data();
      
      // Check if invitation has expired
      const expiresAt = new Date(invitationData.expiresAt);
      const now = new Date();
      
      if (expiresAt < now) {
        // Update the invitation status to expired
        await updateDoc(invitationDoc.ref, {
          status: 'expired',
          updatedAt: serverTimestamp()
        });
        
        return { success: false, error: 'This invitation has expired' };
      }
      
      // Check if the user is already a member of this workspace
      const existingMemberQuery = query(
        collection(firestore, 'workspaceMembers'),
        where('workspaceId', '==', invitationData.workspaceId),
        where('userId', '==', userData.userId)
      );
      
      const existingMemberSnapshot = await getDocs(existingMemberQuery);
      
      if (!existingMemberSnapshot.empty) {
        // User is already a member, just update the invitation status
        await updateDoc(invitationDoc.ref, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
          acceptedBy: {
            userId: userData.userId,
            displayName: userData.displayName,
            email: userData.email
          },
          updatedAt: serverTimestamp()
        });
        
        return { 
          success: true, 
          workspaceId: invitationData.workspaceId
        };
      }
      
      // Check if the workspace still exists
      const workspaceDoc = await getDoc(doc(firestore, 'workspaces', invitationData.workspaceId));
      
      if (!workspaceDoc.exists()) {
        // Update the invitation status to expired
        await updateDoc(invitationDoc.ref, {
          status: 'expired',
          updatedAt: serverTimestamp()
        });
        
        return { success: false, error: 'The workspace no longer exists' };
      }
      
      // Accept the invitation and add the user to the workspace
      try {
        // Add the user to the workspace
        const memberId = await WorkspaceService.addMember({
          workspaceId: invitationData.workspaceId,
          ownerId: invitationData.invitedBy,
          userId: userData.userId,
          displayName: userData.displayName || '',
          email: userData.email || '',
          role: invitationData.role,
          invitationId: invitationDoc.id
        });
        
        // Update the invitation status
        await updateDoc(invitationDoc.ref, {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
          acceptedBy: {
            userId: userData.userId,
            displayName: userData.displayName,
            email: userData.email
          },
          workspaceMemberId: memberId,
          updatedAt: serverTimestamp()
        });
        
        // Update workspace invitation count
        await updateDoc(doc(firestore, 'workspaces', invitationData.workspaceId), {
          pendingInvitationsCount: Math.max((workspaceDoc.data().pendingInvitationsCount || 1) - 1, 0),
          updatedAt: serverTimestamp()
        });
        
        // Set the hasCompletedSetup flag for the user
        if (typeof window !== 'undefined') {
          // Set cookies that will be checked on subsequent requests
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year from now
          
          // Set hasCompletedSetup cookie
          document.cookie = `hasCompletedSetup=true; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
          
          // Also set the workspace ID in a cookie for middleware access
          document.cookie = `currentWorkspaceId=${invitationData.workspaceId}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
          
          // Store in localStorage too for redundancy
          localStorage.setItem('hasCompletedSetup', 'true');
          localStorage.setItem('currentWorkspaceId', invitationData.workspaceId);
          
          console.log('Setup completion flags set for invited user:', {
            workspaceId: invitationData.workspaceId,
            cookies: document.cookie
          });
        }
        
        // Send notification to workspace owner
        const notificationData = {
          userId: invitationData.invitedBy,
          type: 'invitation_accepted',
          title: 'Invitation Accepted',
          message: `${userData.displayName || userData.email} has accepted your invitation to join the workspace.`,
          read: false,
          createdAt: serverTimestamp(),
          workspaceId: invitationData.workspaceId,
          relatedUserId: userData.userId
        };
        
        await addDoc(collection(firestore, 'notifications'), notificationData);
        
        return { 
          success: true, 
          workspaceId: invitationData.workspaceId
        };
      } catch (error) {
        console.error('Error accepting invitation:', error);
        return { success: false, error: 'Failed to accept invitation' };
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: 'Failed to accept invitation' };
    }
  },
  
  /**
   * Decline a workspace invitation
   */
  async declineInvitation(token: string, userData: {
    userId: string;
    displayName?: string;
    email?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the invitation with this token
      const invitationsQuery = query(
        collection(firestore, 'invitations'),
        where('token', '==', token),
        where('status', '==', 'pending')
      );
      
      const invitationsSnapshot = await getDocs(invitationsQuery);
      
      if (invitationsSnapshot.empty) {
        return { success: false, error: 'Invalid or expired invitation' };
      }
      
      const invitationDoc = invitationsSnapshot.docs[0];
      const invitationData = invitationDoc.data();
      
      // Update the invitation status to declined
      await updateDoc(invitationDoc.ref, {
        status: 'declined',
        declinedAt: serverTimestamp(),
        declinedBy: {
          userId: userData.userId,
          displayName: userData.displayName,
          email: userData.email
        },
        updatedAt: serverTimestamp()
      });
      
      // Update workspace invitation count
      const workspaceDoc = await getDoc(doc(firestore, 'workspaces', invitationData.workspaceId));
      
      if (workspaceDoc.exists()) {
        await updateDoc(doc(firestore, 'workspaces', invitationData.workspaceId), {
          pendingInvitationsCount: Math.max((workspaceDoc.data().pendingInvitationsCount || 1) - 1, 0),
          updatedAt: serverTimestamp()
        });
      }
      
      // Send notification to workspace owner
      const notificationData = {
        userId: invitationData.invitedBy,
        type: 'invitation_declined',
        title: 'Invitation Declined',
        message: `${userData.displayName || userData.email} has declined your invitation to join the workspace.`,
        read: false,
        createdAt: serverTimestamp(),
        workspaceId: invitationData.workspaceId,
        relatedUserId: userData.userId
      };
      
      await addDoc(collection(firestore, 'notifications'), notificationData);
      
      return { success: true };
    } catch (error) {
      console.error('Error declining invitation:', error);
      return { success: false, error: 'Failed to decline invitation' };
    }
  },
  
  /**
   * Get all invitations for a workspace
   */
  async getWorkspaceInvitations(workspaceId: string, ownerId: string): Promise<Invitation[]> {
    try {
      // Check if user is the workspace owner
      const workspaceDoc = await getDoc(doc(firestore, 'workspaces', workspaceId));
      
      if (!workspaceDoc.exists() || workspaceDoc.data().ownerId !== ownerId) {
        return [];
      }
      
      // Get all invitations for this workspace
      const invitationsQuery = query(
        collection(firestore, 'invitations'),
        where('workspaceId', '==', workspaceId)
      );
      
      const invitationsSnapshot = await getDocs(invitationsQuery);
      
      return invitationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invitation[];
    } catch (error) {
      console.error('Error getting workspace invitations:', error);
      return [];
    }
  },
  
  /**
   * Cancel a pending invitation
   */
  async cancelInvitation(invitationId: string, ownerId: string): Promise<boolean> {
    try {
      const invitationDoc = await getDoc(doc(firestore, 'invitations', invitationId));
      
      if (!invitationDoc.exists()) {
        return false;
      }
      
      const invitationData = invitationDoc.data();
      
      // Check if user is the workspace owner and invitation is still pending
      if (invitationData.invitedBy !== ownerId || invitationData.status !== 'pending') {
        return false;
      }
      
      // Update the invitation status to expired
      await updateDoc(doc(firestore, 'invitations', invitationId), {
        status: 'expired',
        updatedAt: serverTimestamp()
      });
      
      // Update workspace invitation count
      const workspaceDoc = await getDoc(doc(firestore, 'workspaces', invitationData.workspaceId));
      
      if (workspaceDoc.exists()) {
        await updateDoc(doc(firestore, 'workspaces', invitationData.workspaceId), {
          pendingInvitationsCount: Math.max((workspaceDoc.data().pendingInvitationsCount || 1) - 1, 0),
          updatedAt: serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error canceling invitation:', error);
      return false;
    }
  },
  
  /**
   * Get all invitations a user has received
   */
  async getUserInvitations(email: string): Promise<Invitation[]> {
    try {
      // Get all pending invitations for this email
      const invitationsQuery = query(
        collection(firestore, 'invitations'),
        where('email', '==', email),
        where('status', '==', 'pending')
      );
      
      const invitationsSnapshot = await getDocs(invitationsQuery);
      
      return invitationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invitation[];
    } catch (error) {
      console.error('Error getting user invitations:', error);
      return [];
    }
  }
}; 