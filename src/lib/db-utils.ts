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
  where 
} from 'firebase/firestore';
import { firestore } from './firebase';
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
  return Math.random().toString(36).substring(2, 11);
};

// === EXPENSES === //

// Get all expenses
export const getAllExpenses = async (userId: string): Promise<Expense[]> => {
  const expensesCollection = collection(firestore, `users/${userId}/expenses`);
  const snapshot = await getDocs(expensesCollection);
  
  if (snapshot.empty) {
    return [];
  }
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Expense[];
};

// Add a new expense
export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Expense> => {
  const now = new Date().toISOString();
  
  const newExpense = {
    ...expense,
    createdAt: now,
    updatedAt: now,
  };
  
  const docRef = await addDoc(collection(firestore, `users/${userId}/expenses`), newExpense);
  
  return {
    id: docRef.id,
    ...newExpense
  } as Expense;
};

// Update an expense
export const updateExpense = async (id: string, expenseData: Partial<Expense>, userId: string): Promise<void> => {
  const updatedData = {
    ...expenseData,
    updatedAt: new Date().toISOString()
  };
  
  const expenseRef = doc(firestore, `users/${userId}/expenses`, id);
  await updateDoc(expenseRef, updatedData);
};

// Delete an expense
export const deleteExpense = async (id: string, userId: string): Promise<void> => {
  const expenseRef = doc(firestore, `users/${userId}/expenses`, id);
  await deleteDoc(expenseRef);
};

// === CONTRIBUTORS === //

// Get all contributors
export const getAllContributors = async (userId: string): Promise<Contributor[]> => {
  const contributorsCollection = collection(firestore, `users/${userId}/contributors`);
  const snapshot = await getDocs(contributorsCollection);
  
  if (snapshot.empty) {
    return [];
  }
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Contributor[];
};

// Add a new contributor
export const addContributor = async (name: string, userId: string): Promise<Contributor> => {
  const newContributor = {
    name
  };
  
  const docRef = await addDoc(collection(firestore, `users/${userId}/contributors`), newContributor);
  
  return {
    id: docRef.id,
    ...newContributor
  } as Contributor;
};

// Update a contributor
export const updateContributor = async (id: string, name: string, userId: string): Promise<void> => {
  const contributorRef = doc(firestore, `users/${userId}/contributors`, id);
  await updateDoc(contributorRef, { name });
};

// Delete a contributor
export const deleteContributor = async (id: string, userId: string): Promise<void> => {
  const contributorRef = doc(firestore, `users/${userId}/contributors`, id);
  await deleteDoc(contributorRef);
};

// === GIFTS === //

// Get all gifts
export const getAllGifts = async (userId: string): Promise<Gift[]> => {
  const giftsCollection = collection(firestore, `users/${userId}/gifts`);
  const snapshot = await getDocs(giftsCollection);
  
  if (snapshot.empty) {
    return [];
  }
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Gift[];
};

// Add a new gift
export const addGift = async (gift: Omit<Gift, 'id' | 'allocations'>, userId: string): Promise<Gift> => {
  const newGift = {
    ...gift,
    allocations: []
  };
  
  const docRef = await addDoc(collection(firestore, `users/${userId}/gifts`), newGift);
  
  return {
    id: docRef.id,
    ...newGift
  } as Gift;
};

// Update a gift
export const updateGift = async (id: string, giftData: Partial<Gift>, userId: string): Promise<void> => {
  const giftRef = doc(firestore, `users/${userId}/gifts`, id);
  await updateDoc(giftRef, giftData);
};

// Delete a gift
export const deleteGift = async (id: string, userId: string): Promise<void> => {
  const giftRef = doc(firestore, `users/${userId}/gifts`, id);
  await deleteDoc(giftRef);
};

// === GIFT ALLOCATIONS === //

// Add a gift allocation
export const addGiftAllocation = async (allocation: Omit<GiftAllocation, 'id'>, userId: string): Promise<GiftAllocation> => {
  // Create the allocation document
  const allocationsCollection = collection(firestore, `users/${userId}/giftAllocations`);
  const docRef = await addDoc(allocationsCollection, allocation);
  
  const newAllocation = {
    id: docRef.id,
    ...allocation
  } as GiftAllocation;
  
  // Update the gift's allocations array
  const giftRef = doc(firestore, `users/${userId}/gifts`, allocation.giftId);
  const giftDoc = await getDoc(giftRef);
  
  if (giftDoc.exists()) {
    const giftData = giftDoc.data();
    const currentAllocations = giftData.allocations || [];
    
    await updateDoc(giftRef, { 
      allocations: [...currentAllocations, newAllocation] 
    });
  }
  
  return newAllocation;
};

// Delete a gift allocation
export const deleteGiftAllocation = async (giftId: string, allocationId: string, userId: string): Promise<void> => {
  // Remove the allocation from the gift's allocations array
  const giftRef = doc(firestore, `users/${userId}/gifts`, giftId);
  const giftDoc = await getDoc(giftRef);
  
  if (giftDoc.exists()) {
    const giftData = giftDoc.data();
    const updatedAllocations = giftData.allocations.filter(
      (a: GiftAllocation) => a.id !== allocationId
    );
    
    await updateDoc(giftRef, { allocations: updatedAllocations });
  }
  
  // Remove the allocation document
  const allocationRef = doc(firestore, `users/${userId}/giftAllocations`, allocationId);
  await deleteDoc(allocationRef);
};

// === CUSTOM CATEGORIES === //

// Get all custom categories
export const getAllCustomCategories = async (userId: string): Promise<CustomCategory[]> => {
  const categoriesCollection = collection(firestore, `users/${userId}/customCategories`);
  const snapshot = await getDocs(categoriesCollection);
  
  if (snapshot.empty) {
    return [];
  }
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as CustomCategory[];
};

// Add a new custom category
export const addCustomCategory = async (name: string, userId: string): Promise<CustomCategory> => {
  const newCategory = {
    name,
    createdAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(collection(firestore, `users/${userId}/customCategories`), newCategory);
  
  return {
    id: docRef.id,
    ...newCategory
  } as CustomCategory;
};

// Delete a custom category
export const deleteCustomCategory = async (id: string, userId: string): Promise<void> => {
  const categoryRef = doc(firestore, `users/${userId}/customCategories`, id);
  await deleteDoc(categoryRef);
};

// === SETTINGS === //

// Get settings
export const getSettings = async (userId: string): Promise<Settings> => {
  const settingsRef = doc(firestore, `users/${userId}/settings`, 'app_settings');
  const snapshot = await getDoc(settingsRef);
  
  if (!snapshot.exists()) {
    // Return default settings
    return {
      currency: 'USD',
    };
  }
  
  return snapshot.data() as Settings;
};

// Update settings
export const updateSettings = async (settings: Partial<Settings>, userId: string): Promise<void> => {
  const settingsRef = doc(firestore, `users/${userId}/settings`, 'app_settings');
  const snapshot = await getDoc(settingsRef);
  
  if (!snapshot.exists()) {
    // Create settings document if it doesn't exist
    await setDoc(settingsRef, settings);
  } else {
    // Update existing settings
    await updateDoc(settingsRef, settings);
  }
}; 