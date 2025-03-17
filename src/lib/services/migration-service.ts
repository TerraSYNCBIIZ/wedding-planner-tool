import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  addDoc,
  setDoc,
  getFirestore,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { WorkspaceService } from './workspace-service';

/**
 * Service for migrating data from the old wedding structure to the new workspace structure
 */
export const MigrationService = {
  /**
   * Check if migration is needed for this user
   */
  async checkMigrationNeeded(userId: string): Promise<{ needed: boolean; oldWeddingsCount: number }> {
    try {
      // Check if user has any old wedding data
      const userWeddingsQuery = query(
        collection(firestore, 'weddings'),
        where('userId', '==', userId)
      );
      
      const userWeddingsSnapshot = await getDocs(userWeddingsQuery);
      const oldWeddingsCount = userWeddingsSnapshot.size;
      
      // Check if user has any new workspace data
      const userWorkspacesQuery = query(
        collection(firestore, 'workspaces'),
        where('ownerId', '==', userId)
      );
      
      const userWorkspacesSnapshot = await getDocs(userWorkspacesQuery);
      
      // Migration is needed if user has old data but no new data
      const needed = oldWeddingsCount > 0 && userWorkspacesSnapshot.size === 0;
      
      return { needed, oldWeddingsCount };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return { needed: false, oldWeddingsCount: 0 };
    }
  },
  
  /**
   * Migrate user data from the old wedding structure to the new workspace structure
   */
  async migrateUserData(userId: string): Promise<{ success: boolean; migratedCount: number; error?: string }> {
    try {
      // Get all weddings owned by this user
      const userWeddingsQuery = query(
        collection(firestore, 'weddings'),
        where('userId', '==', userId)
      );
      
      const userWeddingsSnapshot = await getDocs(userWeddingsQuery);
      
      if (userWeddingsSnapshot.empty) {
        console.log('No weddings to migrate for user:', userId);
        return { success: true, migratedCount: 0 };
      }
      
      // Migrate each wedding to a workspace
      const migrationPromises = userWeddingsSnapshot.docs.map(async (weddingDoc) => {
        const weddingData = weddingDoc.data();
        
        try {
          return await runTransaction(firestore, async (transaction) => {
            // Create a workspace from the wedding data
            const workspaceRef = doc(collection(firestore, 'workspaces'));
            
            // Determine couple names from wedding data
            let coupleNames = '';
            if (weddingData.coupleNames && weddingData.coupleNames !== 'Wedding') {
              coupleNames = weddingData.coupleNames;
            } else if (weddingData.person1Name || weddingData.person2Name) {
              const person1 = weddingData.person1Name ? weddingData.person1Name.trim() : '';
              const person2 = weddingData.person2Name ? weddingData.person2Name.trim() : '';
              
              if (person1 && person2) {
                coupleNames = `${person1} & ${person2}`;
              } else if (person1) {
                coupleNames = person1;
              } else if (person2) {
                coupleNames = person2;
              }
            } else if (weddingData.weddingName) {
              coupleNames = weddingData.weddingName;
            }
            
            // Prepare workspace data
            const workspaceData = {
              name: coupleNames || 'Wedding',
              coupleNames: coupleNames || 'Wedding',
              ownerId: userId,
              ownerName: weddingData.userName || '',
              ownerEmail: weddingData.userEmail || '',
              weddingDate: weddingData.weddingDate || weddingData.date || null,
              location: weddingData.location || '',
              membersCount: 1, // Just the owner initially
              createdAt: weddingData.createdAt || serverTimestamp(),
              updatedAt: serverTimestamp(),
              // Store the original wedding ID for reference
              originalWeddingId: weddingDoc.id,
              // Migration metadata
              migratedAt: serverTimestamp(),
              migratedFrom: 'weddings'
            };
            
            transaction.set(workspaceRef, workspaceData);
            
            // Add the owner as a member
            const memberRef = doc(collection(firestore, 'workspaceMembers'));
            transaction.set(memberRef, {
              workspaceId: workspaceRef.id,
              userId: userId,
              displayName: weddingData.userName || '',
              email: weddingData.userEmail || '',
              role: 'owner',
              joinedAt: serverTimestamp(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            
            // Get all workspaceUsers for this wedding
            const workspaceUsersQuery = query(
              collection(firestore, 'workspaceUsers'),
              where('weddingId', '==', weddingDoc.id)
            );
            
            const workspaceUsersSnapshot = await getDocs(workspaceUsersQuery);
            
            // Migrate all members (except the owner)
            const memberMigrations = [];
            for (const userDoc of workspaceUsersSnapshot.docs) {
              const userData = userDoc.data();
              
              // Skip the owner, already added above
              if (userData.userId === userId) {
                continue;
              }
              
              // Create a new member document
              const newMemberRef = doc(collection(firestore, 'workspaceMembers'));
              transaction.set(newMemberRef, {
                workspaceId: workspaceRef.id,
                userId: userData.userId,
                displayName: userData.displayName || '',
                email: userData.email || '',
                role: userData.role || 'viewer',
                joinedAt: userData.joinedAt || serverTimestamp(),
                invitedBy: userId,
                invitedByName: weddingData.userName || '',
                invitedByEmail: weddingData.userEmail || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                // Original data references
                originalMemberId: userDoc.id,
                migratedAt: serverTimestamp(),
                migratedFrom: 'workspaceUsers'
              });
              
              memberMigrations.push({
                oldId: userDoc.id,
                newId: newMemberRef.id,
                userId: userData.userId
              });
            }
            
            // Update workspace member count
            if (memberMigrations.length > 0) {
              transaction.update(workspaceRef, {
                membersCount: 1 + memberMigrations.length
              });
            }
            
            // Return the migration data
            return {
              oldWeddingId: weddingDoc.id,
              newWorkspaceId: workspaceRef.id,
              membersMigrated: memberMigrations.length
            };
          });
        } catch (error) {
          console.error(`Error migrating wedding ${weddingDoc.id}:`, error);
          return null;
        }
      });
      
      // Wait for all migrations to complete
      const results = await Promise.all(migrationPromises);
      
      // Filter out any failed migrations
      const successfulMigrations = results.filter(Boolean);
      
      // Create a migration record
      await addDoc(collection(firestore, 'migrations'), {
        userId,
        type: 'wedding_to_workspace',
        completedAt: serverTimestamp(),
        migratedCount: successfulMigrations.length,
        details: successfulMigrations,
      });
      
      return {
        success: true,
        migratedCount: successfulMigrations.length
      };
    } catch (err: unknown) {
      console.error('Error migrating user data:', err);
      // Type the error properly
      let errorMessage = 'Unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      return {
        migratedCount: 0,
        success: false,
        error: errorMessage
      };
    }
  },
  
  /**
   * Migrate related data for a workspace (expenses, gifts, etc.)
   */
  async migrateRelatedData(originalWeddingId: string, newWorkspaceId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Collection types to migrate and their new mappings
      const collectionsToMigrate = [
        { from: 'expenses', to: 'expenses' },
        { from: 'gifts', to: 'gifts' },
        { from: 'contributors', to: 'contributors' },
        { from: 'categories', to: 'categories' },
        { from: 'settings', to: 'settings' },
        { from: 'notes', to: 'notes' },
        { from: 'tasks', to: 'tasks' },
        { from: 'vendors', to: 'vendors' },
        { from: 'guestList', to: 'guestList' },
        { from: 'budgetItems', to: 'budgetItems' }
      ];
      
      // Migrate each collection
      const migrationPromises = collectionsToMigrate.map(async ({ from, to }) => {
        try {
          // Query all documents in the source collection for this wedding
          const sourceQuery = query(
            collection(firestore, from),
            where('weddingId', '==', originalWeddingId)
          );
          
          const sourceSnapshot = await getDocs(sourceQuery);
          
          if (sourceSnapshot.empty) {
            return {
              collection: from,
              migratedCount: 0,
              success: true
            };
          }
          
          // Process documents in batches of 10 to avoid transaction limits
          const migrationResults = [];
          
          for (let i = 0; i < sourceSnapshot.docs.length; i += 10) {
            const batch = sourceSnapshot.docs.slice(i, i + 10);
            
            try {
              await runTransaction(firestore, async (transaction) => {
                for (const sourceDoc of batch) {
                  const sourceData = sourceDoc.data();
                  
                  // Create a new document in the target collection
                  const targetRef = doc(collection(firestore, to));
                  
                  // Copy all fields, but update the workspace reference
                  transaction.set(targetRef, {
                    ...sourceData,
                    weddingId: originalWeddingId, // Keep for backward compatibility
                    workspaceId: newWorkspaceId, // Add the new reference
                    updatedAt: serverTimestamp(),
                    migratedAt: serverTimestamp(),
                    migratedFrom: from,
                    originalId: sourceDoc.id
                  });
                  
                  migrationResults.push({
                    oldId: sourceDoc.id,
                    newId: targetRef.id
                  });
                }
              });
            } catch (error) {
              console.error(`Error migrating batch in collection ${from}:`, error);
            }
          }
          
          return {
            collection: from,
            migratedCount: migrationResults.length,
            success: migrationResults.length === sourceSnapshot.docs.length
          };
        } catch (error) {
          console.error(`Error migrating collection ${from}:`, error);
          return {
            collection: from,
            migratedCount: 0,
            success: false,
            error: error.message
          };
        }
      });
      
      // Wait for all migrations to complete
      const results = await Promise.all(migrationPromises);
      
      // Record migration details
      await addDoc(collection(firestore, 'migrations'), {
        type: 'related_data',
        originalWeddingId,
        newWorkspaceId,
        completedAt: serverTimestamp(),
        details: results
      });
      
      return { success: true };
    } catch (err: unknown) {
      console.error('Error migrating related data:', err);
      // Type the error properly
      let errorMessage = 'Unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      return {
        success: false,
        error: errorMessage
      };
    }
  },
  
  /**
   * Complete migration by marking the user as migrated and setting up data for middleware
   */
  async completeMigration(userId: string): Promise<boolean> {
    try {
      // Create a record to indicate migration is complete
      await setDoc(doc(firestore, 'userMigrations', userId), {
        migrated: true,
        migratedAt: serverTimestamp(),
        userId
      });
      
      // Get the user's first workspace to set as current
      const workspacesQuery = query(
        collection(firestore, 'workspaces'),
        where('ownerId', '==', userId)
      );
      
      const workspacesSnapshot = await getDocs(workspacesQuery);
      
      if (!workspacesSnapshot.empty) {
        const firstWorkspace = workspacesSnapshot.docs[0];
        
        // Store current workspace in user preferences
        await setDoc(doc(firestore, 'userPreferences', userId), {
          currentWorkspaceId: firstWorkspace.id,
          updatedAt: serverTimestamp()
        });
      }
      
      return true;
    } catch (err: unknown) {
      console.error('Error completing migration:', err);
      // Type the error properly
      let errorMessage = 'Unknown error occurred';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      return false;
    }
  },
  
  /**
   * Check if a user has completed migration
   */
  async hasMigrated(userId: string): Promise<boolean> {
    try {
      const migrationDoc = await getDoc(doc(firestore, 'userMigrations', userId));
      return migrationDoc.exists() && migrationDoc.data().migrated === true;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  },
  
  /**
   * Run the full migration process for a user
   */
  async runFullMigration(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if migration is needed
      const { needed, oldWeddingsCount } = await this.checkMigrationNeeded(userId);
      
      if (!needed) {
        console.log('Migration not needed or already completed for user:', userId);
        return { success: true, message: 'Migration not needed' };
      }
      
      console.log(`Starting migration for user ${userId} with ${oldWeddingsCount} weddings`);
      
      // Step 1: Migrate user data (wedding -> workspace)
      const { success, migratedCount } = await this.migrateUserData(userId);
      
      if (!success) {
        return { success: false, message: 'Failed to migrate user data' };
      }
      
      console.log(`Successfully migrated ${migratedCount} weddings to workspaces`);
      
      // Step 2: Get workspace IDs for related data migration
      const workspacesQuery = query(
        collection(firestore, 'workspaces'),
        where('ownerId', '==', userId),
        where('migratedFrom', '==', 'weddings')
      );
      
      const workspacesSnapshot = await getDocs(workspacesQuery);
      
      // Step 3: For each newly created workspace, migrate its related data
      for (const workspaceDoc of workspacesSnapshot.docs) {
        const workspaceData = workspaceDoc.data();
        const originalWeddingId = workspaceData.originalWeddingId;
        
        if (originalWeddingId) {
          console.log(`Migrating related data from wedding ${originalWeddingId} to workspace ${workspaceDoc.id}`);
          await this.migrateRelatedData(originalWeddingId, workspaceDoc.id);
        }
      }
      
      // Step 4: Complete the migration
      await this.completeMigration(userId);
      
      return {
        success: true,
        message: `Successfully migrated ${migratedCount} weddings to workspaces`
      };
    } catch (err: unknown) {
      console.error('Error running full migration:', err);
      // Type the error properly
      let errorMessage = 'Unknown error occurred during migration';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      return {
        success: false,
        message: `Migration failed: ${errorMessage}`
      };
    }
  }
}; 