import { WorkspaceService } from '../workspace-service';
import { collection, doc, getDoc, getDocs, query, where, deleteDoc, updateDoc, writeBatch, addDoc, setDoc, onSnapshot, getFirestore, runTransaction, serverTimestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase', () => ({
  firestore: {}
}));

describe('WorkspaceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkspace', () => {
    it('should create a workspace and return the ID', async () => {
      // Mock implementation
      const mockDoc = jest.fn().mockReturnValue({ id: 'workspace-123' });
      const mockCollection = jest.fn();
      const mockRunTransaction = jest.fn().mockImplementation((_, callback) => callback({ set: jest.fn() }));
      
      (doc as jest.Mock).mockImplementation(mockDoc);
      (collection as jest.Mock).mockImplementation(mockCollection);
      (runTransaction as jest.Mock).mockImplementation(mockRunTransaction);
      
      // Test data
      const workspaceData = {
        ownerId: 'user-123',
        ownerName: 'Test User',
        ownerEmail: 'test@example.com',
        coupleNames: 'Couple Names'
      };
      
      // Execute
      const result = await WorkspaceService.createWorkspace(workspaceData);
      
      // Assert
      expect(result).toBe('workspace-123');
      expect(mockDoc).toHaveBeenCalled();
      expect(mockRunTransaction).toHaveBeenCalled();
    });
    
    it('should handle errors when creating a workspace', async () => {
      // Mock implementation to throw an error
      (runTransaction as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      // Test data
      const workspaceData = {
        ownerId: 'user-123',
        ownerName: 'Test User',
        ownerEmail: 'test@example.com'
      };
      
      // Execute and assert
      await expect(WorkspaceService.createWorkspace(workspaceData)).rejects.toThrow('Test error');
    });
  });
  
  describe('deleteWorkspace', () => {
    it('should delete a workspace and return true on success', async () => {
      // Mock implementation
      const mockDoc = jest.fn();
      const mockQuery = jest.fn();
      const mockWhere = jest.fn();
      const mockGetDocs = jest.fn().mockResolvedValue({
        docs: [
          { 
            id: 'member-1', 
            ref: { id: 'member-1' }, 
            data: () => ({ userId: 'user-456', role: 'editor' }),
            exists: () => true 
          }
        ],
        empty: false
      });
      const mockRunTransaction = jest.fn().mockImplementation(async (_, callback) => {
        const result = await callback({
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ ownerId: 'user-123' })
          }),
          delete: jest.fn()
        });
        return result;
      });
      const mockBatchCommit = jest.fn().mockResolvedValue(undefined);
      const mockWriteBatch = jest.fn().mockReturnValue({
        delete: jest.fn(),
        commit: mockBatchCommit
      });
      const mockAddDoc = jest.fn().mockResolvedValue({ id: 'notification-1' });
      
      (doc as jest.Mock).mockImplementation(mockDoc);
      (query as jest.Mock).mockImplementation(mockQuery);
      (where as jest.Mock).mockImplementation(mockWhere);
      (getDocs as jest.Mock).mockImplementation(mockGetDocs);
      (runTransaction as jest.Mock).mockImplementation(mockRunTransaction);
      (writeBatch as jest.Mock).mockImplementation(mockWriteBatch);
      (addDoc as jest.Mock).mockImplementation(mockAddDoc);
      
      // Execute
      const result = await WorkspaceService.deleteWorkspace('workspace-123', 'user-123');
      
      // Assert
      expect(result).toBe(true);
      expect(mockRunTransaction).toHaveBeenCalled();
    });
    
    it('should return false when an error occurs during deletion', async () => {
      // Mock implementation to throw an error
      (runTransaction as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      // Execute
      const result = await WorkspaceService.deleteWorkspace('workspace-123', 'user-123');
      
      // Assert
      expect(result).toBe(false);
    });
  });
  
  describe('getUserWorkspaces', () => {
    it('should return an array of workspaces', async () => {
      // Mock implementation
      const mockQuery = jest.fn();
      const mockWhere = jest.fn();
      const mockGetDocs = jest.fn().mockResolvedValue({
        docs: [
          { 
            id: 'workspace-1', 
            data: () => ({ 
              name: 'Test Workspace',
              ownerId: 'user-123',
              ownerName: 'Test User',
              ownerEmail: 'test@example.com',
              createdAt: new Date(),
              updatedAt: new Date()
            }),
            exists: () => true 
          }
        ],
        empty: false
      });
      
      (query as jest.Mock).mockImplementation(mockQuery);
      (where as jest.Mock).mockImplementation(mockWhere);
      (getDocs as jest.Mock).mockImplementation(mockGetDocs);
      
      // Execute
      const result = await WorkspaceService.getUserWorkspaces('user-123');
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('workspace-1');
    });
    
    it('should return an empty array when an error occurs', async () => {
      // Mock implementation to throw an error
      (getDocs as jest.Mock).mockRejectedValue(new Error('Test error'));
      
      // Execute
      const result = await WorkspaceService.getUserWorkspaces('user-123');
      
      // Assert
      expect(result).toEqual([]);
    });
  });
  
  describe('setupWorkspaceListeners', () => {
    it('should set up listeners and return an unsubscribe function', () => {
      // Mock implementation
      const mockQuery = jest.fn();
      const mockWhere = jest.fn();
      const mockOnSnapshot = jest.fn().mockReturnValue(() => {});
      
      (query as jest.Mock).mockImplementation(mockQuery);
      (where as jest.Mock).mockImplementation(mockWhere);
      (onSnapshot as jest.Mock).mockImplementation(mockOnSnapshot);
      
      // Execute
      const callback = jest.fn();
      const unsubscribe = WorkspaceService.setupWorkspaceListeners('user-123', callback);
      
      // Assert
      expect(mockOnSnapshot).toHaveBeenCalledTimes(2);
      expect(typeof unsubscribe).toBe('function');
      
      // Call unsubscribe to ensure it works
      unsubscribe();
    });
  });
}); 