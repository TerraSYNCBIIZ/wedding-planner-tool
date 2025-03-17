import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  Timestamp, 
  query, 
  where,
  writeBatch,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { firestore } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Expense, 
  Gift, 
  Contributor, 
  CustomCategory, 
  Settings, 
  GiftAllocation 
} from '../types';

// Generate a unique ID
export const generateId = (): string => {
  return uuidv4();
};

// Test Firestore connection
export const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    const testDoc = doc(firestore, 'test', 'connection');
    await getDoc(testDoc);
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
};

// === EXPENSES === //

// Get all expenses
export const getAllExpenses = async (workspaceId: string): Promise<Expense[]> => {
  try {
    const expensesRef = collection(firestore, `workspaces/${workspaceId}/expenses`);
    const expensesSnapshot = await getDocs(expensesRef);
    
    const expenses: Expense[] = [];
    for (const doc of expensesSnapshot.docs) {
      const data = doc.data();
      expenses.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.() 
          ? data.updatedAt.toDate().toISOString() 
          : data.updatedAt || new Date().toISOString()
      } as Expense);
    }
    
    return expenses;
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

// Add a new expense
export const addExpense = async (workspaceId: string, expense: Omit<Expense, 'id'>): Promise<Expense> => {
  try {
    const expensesRef = collection(firestore, `workspaces/${workspaceId}/expenses`);
    const newExpenseRef = doc(expensesRef);
    
    const timestamp = Timestamp.now();
    const newExpense = {
      ...expense,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await setDoc(newExpenseRef, newExpense);
    
    return {
      ...newExpense,
      id: newExpenseRef.id
    };
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

// Update an expense
export const updateExpense = async (workspaceId: string, id: string, expense: Partial<Expense>): Promise<void> => {
  try {
    const expenseRef = doc(firestore, `workspaces/${workspaceId}/expenses`, id);
    
    const updatedExpense = {
      ...expense,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(expenseRef, updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Delete an expense
export const deleteExpense = async (workspaceId: string, id: string): Promise<void> => {
  try {
    const expenseRef = doc(firestore, `workspaces/${workspaceId}/expenses`, id);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// === CONTRIBUTORS === //

// Get all contributors
export const getAllContributors = async (workspaceId: string): Promise<Contributor[]> => {
  try {
    const contributorsRef = collection(firestore, `workspaces/${workspaceId}/contributors`);
    const contributorsSnapshot = await getDocs(contributorsRef);
    
    const contributors: Contributor[] = [];
    for (const doc of contributorsSnapshot.docs) {
      const data = doc.data();
      contributors.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.() 
          ? data.updatedAt.toDate().toISOString() 
          : data.updatedAt || new Date().toISOString()
      } as Contributor);
    }
    
    return contributors;
  } catch (error) {
    console.error('Error getting contributors:', error);
    return [];
  }
};

// Add a new contributor
export const addContributor = async (workspaceId: string, contributor: Omit<Contributor, 'id'>): Promise<Contributor> => {
  try {
    const contributorsRef = collection(firestore, `workspaces/${workspaceId}/contributors`);
    const newContributorRef = doc(contributorsRef);
    
    const timestamp = Timestamp.now();
    const newContributor = {
      ...contributor,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await setDoc(newContributorRef, newContributor);
    
    return {
      ...newContributor,
      id: newContributorRef.id
    };
  } catch (error) {
    console.error('Error adding contributor:', error);
    throw error;
  }
};

// Update a contributor
export const updateContributor = async (workspaceId: string, id: string, contributor: Partial<Contributor>): Promise<void> => {
  try {
    console.log('db-utils: Starting contributor update in Firestore', { workspaceId, id, contributor });
    const contributorRef = doc(firestore, `workspaces/${workspaceId}/contributors`, id);
    
    // Filter out any undefined values which Firebase doesn't support
    const filteredData = Object.entries(contributor).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
    
    const updatedContributor = {
      ...filteredData,
      updatedAt: Timestamp.now()
    };
    
    console.log('db-utils: Calling updateDoc with:', updatedContributor);
    await updateDoc(contributorRef, updatedContributor);
    console.log('db-utils: Firestore update completed successfully');
  } catch (error) {
    console.error('Error updating contributor:', error);
    throw error;
  }
};

// Delete a contributor
export const deleteContributor = async (workspaceId: string, id: string): Promise<void> => {
  try {
    const contributorRef = doc(firestore, `workspaces/${workspaceId}/contributors`, id);
    await deleteDoc(contributorRef);
  } catch (error) {
    console.error('Error deleting contributor:', error);
    throw error;
  }
};

// === GIFTS === //

// Get all gifts
export const getAllGifts = async (workspaceId: string): Promise<Gift[]> => {
  try {
    const giftsRef = collection(firestore, `workspaces/${workspaceId}/gifts`);
    const giftsSnapshot = await getDocs(giftsRef);
    
    const gifts: Gift[] = [];
    for (const doc of giftsSnapshot.docs) {
      const data = doc.data();
      gifts.push({
        ...data,
        id: doc.id,
        allocations: data.allocations || [],
        createdAt: data.createdAt?.toDate?.() 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.() 
          ? data.updatedAt.toDate().toISOString() 
          : data.updatedAt || new Date().toISOString()
      } as Gift);
    }
    
    return gifts;
  } catch (error) {
    console.error('Error getting gifts:', error);
    return [];
  }
};

// Add a new gift
export const addGift = async (workspaceId: string, gift: Omit<Gift, 'id' | 'allocations'>): Promise<Gift> => {
  try {
    const giftsRef = collection(firestore, `workspaces/${workspaceId}/gifts`);
    const newGiftRef = doc(giftsRef);
    
    const timestamp = Timestamp.now();
    const newGift = {
      ...gift,
      allocations: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await setDoc(newGiftRef, newGift);
    
    return {
      ...newGift,
      id: newGiftRef.id
    };
  } catch (error) {
    console.error('Error adding gift:', error);
    throw error;
  }
};

// Update a gift
export const updateGift = async (workspaceId: string, id: string, gift: Partial<Gift>): Promise<void> => {
  try {
    const giftRef = doc(firestore, `workspaces/${workspaceId}/gifts`, id);
    
    const updatedGift = {
      ...gift,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(giftRef, updatedGift);
  } catch (error) {
    console.error('Error updating gift:', error);
    throw error;
  }
};

// Delete a gift
export const deleteGift = async (workspaceId: string, id: string): Promise<void> => {
  try {
    const giftRef = doc(firestore, `workspaces/${workspaceId}/gifts`, id);
    
    // First, get the gift to check if it has allocations
    const giftSnapshot = await getDoc(giftRef);
    const giftData = giftSnapshot.data() as Gift | undefined;
    
    // If the gift has allocations, delete them all first
    if (giftData?.allocations?.length > 0) {
      const batch = writeBatch(firestore);
      
      // Delete each allocation
      for (const allocation of giftData.allocations) {
        const allocationRef = doc(firestore, `workspaces/${workspaceId}/giftAllocations`, allocation.id);
        batch.delete(allocationRef);
      }
      
      // Delete the gift itself
      batch.delete(giftRef);
      
      // Commit the batch
      await batch.commit();
    } else {
      // If no allocations, just delete the gift
      await deleteDoc(giftRef);
    }
  } catch (error) {
    console.error('Error deleting gift:', error);
    throw error;
  }
};

// === GIFT ALLOCATIONS === //

// Add a gift allocation
export const addGiftAllocation = async (
  workspaceId: string,
  giftId: string,
  allocation: Omit<GiftAllocation, 'id'>
): Promise<GiftAllocation> => {
  try {
    // Create a reference to the allocations collection
    const allocationsRef = collection(firestore, `workspaces/${workspaceId}/giftAllocations`);
    const newAllocationRef = doc(allocationsRef);
    
    const timestamp = Timestamp.now();
    const newAllocation = {
      ...allocation,
      giftId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // Create a batch
    const batch = writeBatch(firestore);
    
    // Add the new allocation
    batch.set(newAllocationRef, newAllocation);
    
    // Get a reference to the gift
    const giftRef = doc(firestore, `workspaces/${workspaceId}/gifts`, giftId);
    
    // Get the current gift data
    const giftSnapshot = await getDoc(giftRef);
    const giftData = giftSnapshot.data() as Gift;
    
    // Update the gift's allocations array
    const allocationWithId = {
      ...newAllocation,
      id: newAllocationRef.id
    };
    
    const allocations = [...(giftData.allocations || []), allocationWithId];
    
    batch.update(giftRef, { 
      allocations,
      updatedAt: timestamp
    });
    
    // Commit the batch
    await batch.commit();
    
    return allocationWithId;
  } catch (error) {
    console.error('Error adding gift allocation:', error);
    throw error;
  }
};

// Delete a gift allocation
export const deleteGiftAllocation = async (
  workspaceId: string,
  giftId: string,
  allocationId: string
): Promise<void> => {
  try {
    // Create a batch
    const batch = writeBatch(firestore);
    
    // Delete the allocation document
    const allocationRef = doc(firestore, `workspaces/${workspaceId}/giftAllocations`, allocationId);
    batch.delete(allocationRef);
    
    // Get a reference to the gift
    const giftRef = doc(firestore, `workspaces/${workspaceId}/gifts`, giftId);
    
    // Get the current gift data
    const giftSnapshot = await getDoc(giftRef);
    const giftData = giftSnapshot.data() as Gift;
    
    // Remove the allocation from the gift's allocations array
    const allocations = (giftData.allocations || []).filter(
      allocation => allocation.id !== allocationId
    );
    
    batch.update(giftRef, { 
      allocations,
      updatedAt: Timestamp.now()
    });
    
    // Commit the batch
    await batch.commit();
  } catch (error) {
    console.error('Error deleting gift allocation:', error);
    throw error;
  }
};

// === CUSTOM CATEGORIES === //

// Get all custom categories
export const getAllCustomCategories = async (workspaceId: string): Promise<CustomCategory[]> => {
  try {
    const categoriesRef = collection(firestore, `workspaces/${workspaceId}/customCategories`);
    const categoriesSnapshot = await getDocs(categoriesRef);
    
    const categories: CustomCategory[] = [];
    for (const doc of categoriesSnapshot.docs) {
      const data = doc.data();
      categories.push({
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate?.() 
          ? data.createdAt.toDate().toISOString() 
          : data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.() 
          ? data.updatedAt.toDate().toISOString() 
          : data.updatedAt || new Date().toISOString()
      } as CustomCategory);
    }
    
    return categories;
  } catch (error) {
    console.error('Error getting custom categories:', error);
    return [];
  }
};

// Add a new custom category
export const addCustomCategory = async (workspaceId: string, category: Omit<CustomCategory, 'id'>): Promise<CustomCategory> => {
  try {
    const categoriesRef = collection(firestore, `workspaces/${workspaceId}/customCategories`);
    const newCategoryRef = doc(categoriesRef);
    
    const timestamp = Timestamp.now();
    const newCategory = {
      ...category,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await setDoc(newCategoryRef, newCategory);
    
    return {
      ...newCategory,
      id: newCategoryRef.id
    };
  } catch (error) {
    console.error('Error adding custom category:', error);
    throw error;
  }
};

// Delete a custom category
export const deleteCustomCategory = async (workspaceId: string, id: string): Promise<void> => {
  try {
    const categoryRef = doc(firestore, `workspaces/${workspaceId}/customCategories`, id);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('Error deleting custom category:', error);
    throw error;
  }
};

// === SETTINGS === //

// Get settings
export const getSettings = async (workspaceId: string): Promise<Settings> => {
  try {
    const settingsRef = doc(firestore, `workspaces/${workspaceId}/settings`, 'preferences');
    const settingsSnapshot = await getDoc(settingsRef);
    
    if (settingsSnapshot.exists()) {
      return settingsSnapshot.data() as Settings;
    }
    
    // Default settings
    return { currency: 'USD' };
  } catch (error) {
    console.error('Error getting settings:', error);
    return { currency: 'USD' };
  }
};

// Update settings
export const updateSettings = async (workspaceId: string, settings: Settings): Promise<void> => {
  try {
    const settingsRef = doc(firestore, `workspaces/${workspaceId}/settings`, 'preferences');
    
    const updatedSettings = {
      ...settings,
      updatedAt: Timestamp.now()
    };
    
    await setDoc(settingsRef, updatedSettings, { merge: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}; 