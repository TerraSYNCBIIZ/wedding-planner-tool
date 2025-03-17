import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  writeBatch,
  addDoc,
  setDoc,
  onSnapshot,
  getFirestore,
  runTransaction,
  serverTimestamp,
  Timestamp,
  DocumentReference
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

// Types for workspace management
export interface WorkspaceMember {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  role: 'editor' | 'viewer';
  joinedAt: Timestamp | string;
  weddingId: string;
}

export interface WorkspaceDetails {
  id: string;
  name: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  coupleNames?: string;
  weddingDate?: Timestamp | string;
  location?: string;
  members: WorkspaceMember[];
  isOwner: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

/**
 * Service class for workspace management operations
 */
export class WorkspaceService {
  /**
   * Create a new workspace
   */
  static async createWorkspace(data: {
    ownerId: string;
    ownerName: string;
    ownerEmail: string;
    coupleNames?: string;
    weddingDate?: string | Date;
    location?: string;
  }): Promise<string> {
    try {
      // Create the workspace document first
      const workspaceRef = doc(collection(firestore, 'workspaces'));
      
      // Prepare the workspace data
      const workspaceData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        membersCount: 1, // Just the owner initially
      };
      
      // Use a transaction to ensure everything gets created properly
      await runTransaction(firestore, async (transaction) => {
        transaction.set(workspaceRef, workspaceData);
        
        // Add the owner as a member with owner role
        const memberRef = doc(collection(firestore, 'workspaceMembers'));
        transaction.set(memberRef, {
          workspaceId: workspaceRef.id,
          userId: data.ownerId,
          displayName: data.ownerName,
          email: data.ownerEmail,
          role: 'owner',
          joinedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      
      console.log('Workspace created successfully:', workspaceRef.id);
      return workspaceRef.id;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }
  
  /**
   * Delete a workspace and all its associated data
   */
  static async deleteWorkspace(workspaceId: string, ownerId: string): Promise<boolean> {
    try {
      // Verify the user is the owner of the workspace
      const workspaceRef = doc(firestore, 'workspaces', workspaceId);
      
      return await runTransaction(firestore, async (transaction) => {
        const workspaceDoc = await transaction.get(workspaceRef);
        
        if (!workspaceDoc.exists()) {
          throw new Error('Workspace not found');
        }
        
        const workspaceData = workspaceDoc.data();
        
        if (workspaceData.ownerId !== ownerId) {
          throw new Error('You do not have permission to delete this workspace');
        }
        
        // Get all workspace members to notify them
        const membersQuery = query(
          collection(firestore, 'workspaceMembers'),
          where('workspaceId', '==', workspaceId)
        );
        
        const membersSnapshot = await getDocs(membersQuery);
        const memberRefs = membersSnapshot.docs.map(d => d.ref);
        
        // Get all resources associated with this workspace
        const collectionsToCleanup = [
          { collection: 'workspaceMembers', field: 'workspaceId' },
          { collection: 'invitations', field: 'workspaceId' },
          { collection: 'expenses', field: 'workspaceId' },
          { collection: 'gifts', field: 'workspaceId' },
          { collection: 'contributors', field: 'workspaceId' },
          { collection: 'categories', field: 'workspaceId' },
          { collection: 'settings', field: 'workspaceId' },
          { collection: 'notes', field: 'workspaceId' },
          { collection: 'tasks', field: 'workspaceId' },
          { collection: 'vendors', field: 'workspaceId' },
          { collection: 'guestList', field: 'workspaceId' },
          { collection: 'budgetItems', field: 'workspaceId' },
        ];
        
        // Create notifications for all members about the workspace deletion
        const notificationsToCreate = memberRefs
          .filter(ref => {
            // Get the member document from the ref
            const memberDoc = membersSnapshot.docs.find(d => d.id === ref.id);
            // Only create notifications for members who are not the owner
            return memberDoc && memberDoc.data().userId !== ownerId;
          })
          .map(ref => {
            // Get the member document from the ref
            const memberDoc = membersSnapshot.docs.find(d => d.id === ref.id);
            const memberData = memberDoc?.data();
            
            return {
              userId: memberData?.userId,
              type: 'workspace_deleted',
              title: 'Workspace Deleted',
              message: `The workspace "${workspaceData.name || workspaceData.coupleNames || 'Unnamed'}" has been deleted by the owner.`,
              read: false,
              createdAt: serverTimestamp(),
            };
          });
        
        // Delete the workspace document itself
        transaction.delete(workspaceRef);
        
        // Delete all workspace members
        memberRefs.forEach(ref => {
          transaction.delete(ref);
        });
        
        // Return all the resources that need to be deleted
        return {
          collectionsToCleanup,
          workspaceId,
          notificationsToCreate,
        };
      }).then(async ({ collectionsToCleanup, workspaceId, notificationsToCreate }) => {
        // Cleanup all associated collections in batches
        const batchPromises = collectionsToCleanup.map(async ({ collection: collectionName, field }) => {
          const q = query(
            collection(firestore, collectionName),
            where(field, '==', workspaceId)
          );
          
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            return;
          }
          
          // Delete in batches of 500 (Firestore limit)
          const chunks = [];
          for (let i = 0; i < snapshot.docs.length; i += 500) {
            chunks.push(snapshot.docs.slice(i, i + 500));
          }
          
          return Promise.all(chunks.map(async (chunk) => {
            const batch = writeBatch(firestore);
            chunk.forEach(doc => batch.delete(doc.ref));
            return batch.commit();
          }));
        });
        
        // Create notifications for members
        const notificationPromises = notificationsToCreate.map(notificationData => {
          if (notificationData.userId) {
            return addDoc(collection(firestore, 'notifications'), notificationData);
          }
          return Promise.resolve();
        });
        
        // Wait for all operations to complete
        await Promise.all([
          ...batchPromises,
          ...notificationPromises
        ]);
        
        return true;
      });
    } catch (error) {
      console.error('Error deleting workspace:', error);
      return false;
    }
  }
  
  /**
   * Add a member to a workspace
   */
  static async addMember(data: {
    workspaceId: string;
    ownerId: string;
    userId: string;
    displayName: string;
    email: string;
    role: 'editor' | 'viewer';
    invitationId?: string;
  }): Promise<string> {
    try {
      // Verify the user is the owner of the workspace
      const workspaceRef = doc(firestore, 'workspaces', data.workspaceId);
      
      return await runTransaction(firestore, async (transaction) => {
        const workspaceDoc = await transaction.get(workspaceRef);
        
        if (!workspaceDoc.exists()) {
          throw new Error('Workspace not found');
        }
        
        const workspaceData = workspaceDoc.data();
        
        // Check if this is the workspace owner adding a member
        if (data.ownerId && data.ownerId !== workspaceData.ownerId) {
          throw new Error('You do not have permission to add members to this workspace');
        }
        
        // Check if the user is already a member
        const existingMemberQuery = query(
          collection(firestore, 'workspaceMembers'),
          where('workspaceId', '==', data.workspaceId),
          where('userId', '==', data.userId)
        );
        
        const existingMemberSnapshot = await getDocs(existingMemberQuery);
        
        if (!existingMemberSnapshot.empty) {
          // If already a member, just update the role if needed
          const existingMemberDoc = existingMemberSnapshot.docs[0];
          const existingMemberData = existingMemberDoc.data();
          
          if (existingMemberData.role !== data.role) {
            transaction.update(existingMemberDoc.ref, {
              role: data.role,
              updatedAt: serverTimestamp(),
            });
          }
          
          return existingMemberDoc.id;
        }
        
        // Add the new member
        const memberRef = doc(collection(firestore, 'workspaceMembers'));
        transaction.set(memberRef, {
          workspaceId: data.workspaceId,
          userId: data.userId,
          displayName: data.displayName,
          email: data.email,
          role: data.role,
          invitationId: data.invitationId,
          joinedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // Update the members count in the workspace
        transaction.update(workspaceRef, {
          membersCount: (workspaceData.membersCount || 0) + 1,
          updatedAt: serverTimestamp(),
        });
        
        return memberRef.id;
      });
    } catch (error) {
      console.error('Error adding member to workspace:', error);
      throw error;
    }
  }
  
  /**
   * Remove a member from a workspace
   */
  static async removeMember(data: {
    workspaceId: string;
    memberId: string;
    requestingUserId: string;
  }): Promise<boolean> {
    try {
      // Use a transaction to ensure data consistency
      return await runTransaction(firestore, async (transaction) => {
        // Get the workspace
        const workspaceRef = doc(firestore, 'workspaces', data.workspaceId);
        const workspaceDoc = await transaction.get(workspaceRef);
        
        if (!workspaceDoc.exists()) {
          throw new Error('Workspace not found');
        }
        
        const workspaceData = workspaceDoc.data();
        
        // Get the member
        const memberRef = doc(firestore, 'workspaceMembers', data.memberId);
        const memberDoc = await transaction.get(memberRef);
        
        if (!memberDoc.exists()) {
          throw new Error('Member not found');
        }
        
        const memberData = memberDoc.data();
        
        // Check permissions:
        // 1. Workspace owner can remove any member
        // 2. Members can remove themselves (leave workspace)
        const isOwner = workspaceData.ownerId === data.requestingUserId;
        const isSelf = memberData.userId === data.requestingUserId;
        
        if (!isOwner && !isSelf) {
          throw new Error('You do not have permission to remove this member');
        }
        
        // Owners cannot leave their own workspaces
        if (isSelf && memberData.role === 'owner') {
          throw new Error('Owners cannot leave their own workspaces. Delete the workspace instead.');
        }
        
        // Delete the member
        transaction.delete(memberRef);
        
        // Update the members count in the workspace
        transaction.update(workspaceRef, {
          membersCount: Math.max((workspaceData.membersCount || 1) - 1, 1),
          updatedAt: serverTimestamp(),
        });
        
        // If this was a self-removal (leaving), create a notification for the owner
        if (isSelf && workspaceData.ownerId !== data.requestingUserId) {
          const notificationRef = doc(collection(firestore, 'notifications'));
          transaction.set(notificationRef, {
            userId: workspaceData.ownerId,
            type: 'member_left',
            title: 'Member Left Workspace',
            message: `${memberData.displayName || memberData.email} has left your workspace "${workspaceData.name || workspaceData.coupleNames || 'Unnamed'}".`,
            read: false,
            createdAt: serverTimestamp(),
            workspaceId: data.workspaceId,
          });
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error removing member from workspace:', error);
      return false;
    }
  }
  
  /**
   * Update a member's role
   */
  static async updateMemberRole(data: {
    workspaceId: string;
    memberId: string;
    newRole: 'editor' | 'viewer';
    requestingUserId: string;
  }): Promise<boolean> {
    try {
      // Use a transaction to ensure data consistency
      return await runTransaction(firestore, async (transaction) => {
        // Get the workspace
        const workspaceRef = doc(firestore, 'workspaces', data.workspaceId);
        const workspaceDoc = await transaction.get(workspaceRef);
        
        if (!workspaceDoc.exists()) {
          throw new Error('Workspace not found');
        }
        
        const workspaceData = workspaceDoc.data();
        
        // Verify the requesting user is the owner
        if (workspaceData.ownerId !== data.requestingUserId) {
          throw new Error('Only the workspace owner can change member roles');
        }
        
        // Get the member
        const memberRef = doc(firestore, 'workspaceMembers', data.memberId);
        const memberDoc = await transaction.get(memberRef);
        
        if (!memberDoc.exists()) {
          throw new Error('Member not found');
        }
        
        const memberData = memberDoc.data();
        
        // Cannot change the role of the owner
        if (memberData.role === 'owner') {
          throw new Error('Cannot change the role of the workspace owner');
        }
        
        // Update the role
        transaction.update(memberRef, {
          role: data.newRole,
          updatedAt: serverTimestamp(),
        });
        
        return true;
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      return false;
    }
  }
  
  /**
   * Get all workspaces for a user (both owned and member of)
   */
  static async getUserWorkspaces(userId: string): Promise<WorkspaceDetails[]> {
    try {
      const workspaces: WorkspaceDetails[] = [];
      
      // Get workspaces where user is the owner
      const ownedWorkspacesQuery = query(
        collection(firestore, 'workspaces'),
        where('ownerId', '==', userId)
      );
      
      const ownedWorkspacesSnapshot = await getDocs(ownedWorkspacesQuery);
      
      // Process owned workspaces
      for (const workspaceDoc of ownedWorkspacesSnapshot.docs) {
        const workspaceData = workspaceDoc.data();
        
        // Get members for this workspace
        const membersQuery = query(
          collection(firestore, 'workspaceMembers'),
          where('workspaceId', '==', workspaceDoc.id),
          where('userId', '!=', userId) // Exclude the owner from members list
        );
        
        const membersSnapshot = await getDocs(membersQuery);
        
        const members: WorkspaceMember[] = membersSnapshot.docs.map(memberDoc => ({
          id: memberDoc.id,
          ...memberDoc.data()
        })) as WorkspaceMember[];
        
        workspaces.push({
          id: workspaceDoc.id,
          name: workspaceData.name || workspaceData.coupleNames || 'Unnamed Workspace',
          ownerId: workspaceData.ownerId,
          ownerName: workspaceData.ownerName,
          ownerEmail: workspaceData.ownerEmail,
          coupleNames: workspaceData.coupleNames,
          weddingDate: workspaceData.weddingDate,
          location: workspaceData.location,
          members,
          isOwner: true,
          createdAt: workspaceData.createdAt,
          updatedAt: workspaceData.updatedAt
        });
      }
      
      // Get workspaces where user is a member (not owner)
      const memberWorkspacesQuery = query(
        collection(firestore, 'workspaceMembers'),
        where('userId', '==', userId)
      );
      
      const memberWorkspacesSnapshot = await getDocs(memberWorkspacesQuery);
      
      // Process member workspaces
      for (const memberDoc of memberWorkspacesSnapshot.docs) {
        const memberData = memberDoc.data();
        const workspaceId = memberData.workspaceId;
        
        // Skip if we already have this workspace (as an owner)
        if (workspaces.some(w => w.id === workspaceId)) {
          continue;
        }
        
        // Get the workspace details
        const workspaceDoc = await getDoc(doc(firestore, 'workspaces', workspaceId));
        
        if (!workspaceDoc.exists()) {
          console.warn(`Workspace ${workspaceId} not found for member ${memberDoc.id}`);
          continue;
        }
        
        const workspaceData = workspaceDoc.data();
        
        // Get all other members for this workspace
        const membersQuery = query(
          collection(firestore, 'workspaceMembers'),
          where('workspaceId', '==', workspaceId),
          where('userId', '!=', userId) // Exclude the current user from members list
        );
        
        const membersSnapshot = await getDocs(membersQuery);
        
        const members: WorkspaceMember[] = membersSnapshot.docs.map(memberDoc => ({
          id: memberDoc.id,
          ...memberDoc.data()
        })) as WorkspaceMember[];
        
        workspaces.push({
          id: workspaceId,
          name: workspaceData.name || workspaceData.coupleNames || 'Unnamed Workspace',
          ownerId: workspaceData.ownerId,
          ownerName: workspaceData.ownerName,
          ownerEmail: workspaceData.ownerEmail,
          coupleNames: workspaceData.coupleNames,
          weddingDate: workspaceData.weddingDate,
          location: workspaceData.location,
          members,
          isOwner: false,
          createdAt: workspaceData.createdAt,
          updatedAt: workspaceData.updatedAt
        });
      }
      
      return workspaces;
    } catch (error) {
      console.error('Error getting user workspaces:', error);
      return [];
    }
  }
  
  /**
   * Setup real-time listeners for all workspaces a user has access to
   */
  static setupWorkspaceListeners(
    userId: string,
    onWorkspacesUpdate: (workspaces: WorkspaceDetails[]) => void
  ) {
    // Track when the last update was processed to avoid excessive updates
    let lastUpdateTime = 0;
    let isProcessingUpdate = false;
    let pendingUpdate = false;
    
    // Function to process updates with debouncing
    const processWorkspacesUpdate = async () => {
      // If already processing, mark as pending and return
      if (isProcessingUpdate) {
        pendingUpdate = true;
        return;
      }
      
      // If less than 500ms since last update, debounce
      const now = Date.now();
      if (now - lastUpdateTime < 500) {
        pendingUpdate = true;
        setTimeout(() => {
          if (pendingUpdate) {
            pendingUpdate = false;
            processWorkspacesUpdate();
          }
        }, 500);
        return;
      }
      
      try {
        isProcessingUpdate = true;
        console.log('Processing workspace update for user:', userId);
        const workspaces = await this.getUserWorkspaces(userId);
        onWorkspacesUpdate(workspaces);
        lastUpdateTime = Date.now();
      } catch (error) {
        console.error('Error processing workspace update:', error);
        // Even on error, we should call the update to reset loading states
        onWorkspacesUpdate([]);
      } finally {
        isProcessingUpdate = false;
        
        // If a pending update came in while processing, handle it
        if (pendingUpdate) {
          pendingUpdate = false;
          setTimeout(processWorkspacesUpdate, 50);
        }
      }
    };
    
    // Create a listener for owned workspaces
    const ownedWorkspacesQuery = query(
      collection(firestore, 'workspaces'),
      where('ownerId', '==', userId)
    );
    
    // Create a listener for member workspaces
    const memberWorkspacesQuery = query(
      collection(firestore, 'workspaceMembers'),
      where('userId', '==', userId)
    );
    
    console.log('Setting up workspace listeners for user:', userId);
    
    // Set up listeners with error handling
    const unsubscribeOwned = onSnapshot(
      ownedWorkspacesQuery, 
      (ownedSnapshot) => {
        console.log('Owned workspaces updated, docs:', ownedSnapshot.size);
        processWorkspacesUpdate();
      },
      (error) => {
        console.error('Error in owned workspaces listener:', error);
        // Call update to ensure loading state gets reset
        onWorkspacesUpdate([]);
      }
    );
    
    const unsubscribeMember = onSnapshot(
      memberWorkspacesQuery, 
      (memberSnapshot) => {
        console.log('Member workspaces updated, docs:', memberSnapshot.size);
        processWorkspacesUpdate();
      },
      (error) => {
        console.error('Error in member workspaces listener:', error);
        // Call update to ensure loading state gets reset
        onWorkspacesUpdate([]);
      }
    );
    
    // Process initial update manually to ensure it happens
    setTimeout(processWorkspacesUpdate, 100);
    
    // Return a function to unsubscribe from all listeners
    return () => {
      console.log('Unsubscribing workspace listeners for user:', userId);
      unsubscribeOwned();
      unsubscribeMember();
    };
  }

  /**
   * Update workspace details
   */
  static async updateWorkspace(data: {
    workspaceId: string;
    requestingUserId: string;
    coupleNames?: string;
    weddingDate?: string | Date;
    location?: string;
  }): Promise<boolean> {
    try {
      // Use a transaction to ensure data consistency
      return await runTransaction(firestore, async (transaction) => {
        // Get the workspace
        const workspaceRef = doc(firestore, 'workspaces', data.workspaceId);
        const workspaceDoc = await transaction.get(workspaceRef);
        
        if (!workspaceDoc.exists()) {
          throw new Error('Workspace not found');
        }
        
        const workspaceData = workspaceDoc.data();
        
        // Verify the requesting user is the owner
        if (workspaceData.ownerId !== data.requestingUserId) {
          throw new Error('Only the workspace owner can update workspace details');
        }
        
        // Prepare update data
        const updateData: Record<string, any> = {
          updatedAt: serverTimestamp()
        };
        
        // Only include fields that are provided
        if (data.coupleNames !== undefined) {
          updateData.coupleNames = data.coupleNames;
        }
        
        if (data.weddingDate !== undefined) {
          // Convert Date object to string if needed
          updateData.weddingDate = typeof data.weddingDate === 'string' 
            ? data.weddingDate 
            : data.weddingDate.toISOString();
        }
        
        if (data.location !== undefined) {
          updateData.location = data.location;
        }
        
        // Update the workspace
        transaction.update(workspaceRef, updateData);
        
        return true;
      });
    } catch (error) {
      console.error('Error updating workspace details:', error);
      return false;
    }
  }
} 