'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  getAllExpenses,
  getAllContributors,
  getAllGifts,
  getAllCustomCategories,
  getSettings,
  addExpense,
  updateExpense,
  deleteExpense,
  addContributor,
  updateContributor,
  deleteContributor,
  addGift,
  updateGift,
  deleteGift,
  addGiftAllocation,
  deleteGiftAllocation,
  addCustomCategory,
  deleteCustomCategory,
  updateSettings,
  generateId
} from '../lib/db-utils';
import { exportToExcel } from '../lib/excel-utils';
import type {
  Expense,
  Gift,
  Contributor,
  CustomCategory,
  Settings,
  GiftAllocation,
  DashboardStats,
  ExpenseCategory,
  PaymentAllocation,
  ContributorGift
} from '../types';
import { calculatePaidAmount, calculateRemainingAmount } from '../lib/excel-utils';
import { testFirestoreConnection } from '../lib/test-firebase';
import { useAuth } from './AuthContext';
import { useWorkspace } from './WorkspaceContext';
import { doc, getDoc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Define the context type
interface WeddingContextType {
  // Data
  expenses: Expense[];
  gifts: Gift[];
  contributors: Contributor[];
  customCategories: CustomCategory[];
  settings: Settings;
  isLoading: boolean;
  weddingData: {
    coupleNames: string;
    date: string | null;
    location: string;
    guestCount: number;
    budget: number;
  } | null;
  
  // Expense functions
  addNewExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'paymentAllocations'>) => Promise<void>;
  updateExistingExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  
  // Payment allocation functions
  addPaymentToExpense: (expenseId: string, payment: Omit<PaymentAllocation, 'id'>) => Promise<void>;
  updatePaymentAllocation: (expenseId: string, paymentId: string, data: Partial<PaymentAllocation>) => Promise<void>;
  removePaymentFromExpense: (expenseId: string, paymentId: string) => Promise<void>;
  
  // Contributor functions
  addNewContributor: (name: string, notes?: string) => Promise<void>;
  updateExistingContributor: (id: string, data: Partial<Contributor>) => Promise<void>;
  removeContributor: (id: string) => Promise<void>;
  
  // Contributor gift functions
  addGiftToContributor: (
    contributorId: string, 
    giftData: Omit<ContributorGift, 'id' | 'contributorId' | 'allocations'>,
    allocations?: Array<{ expenseId: string, amount: number }>
  ) => Promise<{ gift: ContributorGift; allocations: GiftAllocation[] } | undefined>;
  updateContributorGift: (contributorId: string, giftId: string, data: Partial<ContributorGift>) => Promise<void>;
  removeContributorGift: (contributorId: string, giftId: string) => Promise<void>;
  
  // Gift functions
  addNewGift: (gift: Omit<Gift, 'id' | 'allocations'>) => Promise<void>;
  updateExistingGift: (id: string, data: Partial<Gift>) => Promise<void>;
  removeGift: (id: string) => Promise<void>;
  
  // Gift allocation functions
  addNewGiftAllocation: (allocation: Omit<GiftAllocation, 'id'>) => Promise<void>;
  removeGiftAllocation: (giftId: string, allocationId: string) => Promise<void>;
  
  // Category functions
  addNewCategory: (name: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  
  // Settings functions
  updateAppSettings: (newSettings: Partial<Settings>) => Promise<void>;
  
  // Export function
  exportData: () => void;
  
  // Dashboard stats
  getDashboardStats: () => DashboardStats;
}

// Create the context
const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

// Add a debounce utility function at the top of the file
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Provider component
export const WeddingProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspaceId, workspaces } = useWorkspace();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [settings, setSettings] = useState<Settings>({ currency: 'USD' });
  const [isLoading, setIsLoading] = useState(true);

  // Add additional code here for fetching the wedding details
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
  
  // Add debugging for wedding data
  useEffect(() => {
    console.log('Current workspace:', currentWorkspace);
    console.log('Workspace wedding date:', currentWorkspace?.weddingDate);
    console.log('Workspace couple names:', currentWorkspace?.coupleNames);
    console.log('Workspace location:', currentWorkspace?.location);
  }, [currentWorkspace]);

  // Updated wedding data parsing to handle Timestamp correctly
  const weddingData = currentWorkspace ? {
    coupleNames: currentWorkspace.coupleNames || 'Your Wedding',
    date: currentWorkspace.weddingDate 
      ? (typeof currentWorkspace.weddingDate === 'string' 
        ? currentWorkspace.weddingDate 
        : (currentWorkspace.weddingDate as any).toDate?.() 
          ? (currentWorkspace.weddingDate as any).toDate().toISOString() 
          : null)
      : null,
    location: currentWorkspace.location || '',
    guestCount: 0, // You can add this to the workspace model later
    budget: expenses.reduce((sum, exp) => sum + exp.totalAmount, 0)
  } : null;
  
  // Log the formatted wedding data
  useEffect(() => {
    console.log('Formatted wedding data:', weddingData);
  }, [weddingData]);

  // Fetch data function (extracted to be reusable)
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let expensesData: Expense[] = [];
      let giftsData: Gift[] = [];
      let contributorsData: Contributor[] = [];
      let categoriesData: CustomCategory[] = [];
      let settingsData: Settings = { currency: 'USD' };
      
      try {
        // Wait for auth to finish loading and check if user is authenticated
        if (authLoading) {
          console.log('Waiting for authentication...');
          return;
        }
        
        if (!user) {
          console.log('No authenticated user');
          return;
        }

        if (!currentWorkspaceId) {
          console.log('No workspace selected');
          return;
        }
        
        // Test Firestore connection first
        console.log('Testing Firestore connection...');
        const isConnected = await testFirestoreConnection();
        
        if (!isConnected) {
          throw new Error('Firestore connection test failed');
        }
        
        // Try to fetch data from Firestore for the current workspace
        console.log('Fetching data from Firestore for workspace:', currentWorkspaceId);
        
        // Fetch data for the current workspace
        [
          expensesData,
          giftsData,
          contributorsData,
          categoriesData,
          settingsData
        ] = await Promise.all([
          getAllExpenses(currentWorkspaceId),
          getAllGifts(currentWorkspaceId),
          getAllContributors(currentWorkspaceId),
          getAllCustomCategories(currentWorkspaceId),
          getSettings(currentWorkspaceId)
        ]);
        console.log('Firestore data fetched successfully:', {
          expenses: expensesData.length,
          gifts: giftsData.length,
          contributors: contributorsData.length,
          categories: categoriesData.length
        });
      } catch (error) {
        console.error('Firestore error:', error);
      }
      
      setExpenses(expensesData);
      setGifts(giftsData);
      setContributors(contributorsData);
      setCustomCategories(categoriesData);
      setSettings(settingsData);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsLoading(false);
    }
  }, [user, authLoading, currentWorkspaceId]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Expense functions
  const addNewExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'paymentAllocations'>) => {
    if (!user || !currentWorkspaceId) return;
    try {
      const newExpense = await addExpense(currentWorkspaceId, {
        ...expenseData,
        paymentAllocations: []
      });
      setExpenses(prev => [...prev, newExpense]);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const updateExistingExpense = async (id: string, data: Partial<Expense>) => {
    if (!user || !currentWorkspaceId) return;
    try {
      await updateExpense(currentWorkspaceId, id, data);
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === id ? { ...expense, ...data } : expense
        )
      );
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const removeExpense = async (id: string) => {
    if (!user || !currentWorkspaceId) return;
    try {
      await deleteExpense(currentWorkspaceId, id);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  // Payment allocation functions
  const addPaymentToExpense = async (expenseId: string, payment: Omit<PaymentAllocation, 'id'>) => {
    if (!user || !currentWorkspaceId) return;
    try {
      // Find the expense
      const expense = expenses.find(e => e.id === expenseId);
      if (!expense) {
        throw new Error(`Expense with id ${expenseId} not found`);
      }
      
      // Create a new payment with ID
      const newPayment: PaymentAllocation = {
        ...payment,
        id: generateId()
      };
      
      // Add the payment to the expense's paymentAllocations array
      const updatedPayments = [...expense.paymentAllocations, newPayment];
      
      // Update the expense in Firestore - make sure to sanitize the data
      const firestorePayments = updatedPayments.map(p => {
        // Create a clean object with no undefined values
        const cleanPayment: {
          id: string;
          contributorId: string;
          amount: number;
          date?: string;
          notes?: string;
        } = {
          id: p.id,
          contributorId: p.contributorId,
          amount: p.amount
        };
        if (p.date) cleanPayment.date = p.date;
        if (p.notes) cleanPayment.notes = p.notes;
        return cleanPayment;
      });
      
      const expenseRef = doc(firestore, `workspaces/${currentWorkspaceId}/expenses`, expenseId);
      await updateDoc(expenseRef, {
        paymentAllocations: firestorePayments,
        updatedAt: new Date().toISOString()
      });
      
      // Update the expense in state
      setExpenses(prev => 
        prev.map(e => 
          e.id === expenseId 
            ? { ...e, paymentAllocations: updatedPayments, updatedAt: new Date().toISOString() } 
            : e
        )
      );
    } catch (error) {
      console.error('Error adding payment to expense:', error);
      throw error;
    }
  };

  const updatePaymentAllocation = async (expenseId: string, paymentId: string, data: Partial<PaymentAllocation>) => {
    if (!user || !currentWorkspaceId) return;
    try {
      // Find the expense
      const expense = expenses.find(e => e.id === expenseId);
      if (!expense) {
        throw new Error(`Expense with id ${expenseId} not found`);
      }
      
      // Find and update the payment allocation
      const updatedPayments = expense.paymentAllocations.map(payment => 
        payment.id === paymentId ? { ...payment, ...data } : payment
      );
      
      // Update the expense in Firestore - make sure to sanitize the data
      const firestorePayments = updatedPayments.map(p => {
        // Create a clean object with no undefined values
        const cleanPayment: {
          id: string;
          contributorId: string;
          amount: number;
          date?: string;
          notes?: string;
        } = {
          id: p.id,
          contributorId: p.contributorId,
          amount: p.amount
        };
        if (p.date) cleanPayment.date = p.date;
        if (p.notes) cleanPayment.notes = p.notes;
        return cleanPayment;
      });
      
      const expenseRef = doc(firestore, `workspaces/${currentWorkspaceId}/expenses`, expenseId);
      await updateDoc(expenseRef, {
        paymentAllocations: firestorePayments,
        updatedAt: new Date().toISOString()
      });
      
      // Update the expense in state
      setExpenses(prev => 
        prev.map(e => 
          e.id === expenseId 
            ? { ...e, paymentAllocations: updatedPayments, updatedAt: new Date().toISOString() } 
            : e
        )
      );
    } catch (error) {
      console.error('Error updating payment allocation:', error);
      throw error;
    }
  };

  const removePaymentFromExpense = async (expenseId: string, paymentId: string) => {
    if (!user || !currentWorkspaceId) return;
    try {
      // Find the expense
      const expense = expenses.find(e => e.id === expenseId);
      if (!expense) {
        throw new Error(`Expense with id ${expenseId} not found`);
      }
      
      // Remove the payment allocation
      const updatedPayments = expense.paymentAllocations.filter(payment => payment.id !== paymentId);
      
      // Update the expense in Firestore - make sure to sanitize the data
      const firestorePayments = updatedPayments.map(p => {
        // Create a clean object with no undefined values
        const cleanPayment: {
          id: string;
          contributorId: string;
          amount: number;
          date?: string;
          notes?: string;
        } = {
          id: p.id,
          contributorId: p.contributorId,
          amount: p.amount
        };
        if (p.date) cleanPayment.date = p.date;
        if (p.notes) cleanPayment.notes = p.notes;
        return cleanPayment;
      });
      
      const expenseRef = doc(firestore, `workspaces/${currentWorkspaceId}/expenses`, expenseId);
      await updateDoc(expenseRef, {
        paymentAllocations: firestorePayments,
        updatedAt: new Date().toISOString()
      });
      
      // Update the expense in state
      setExpenses(prev => 
        prev.map(e => 
          e.id === expenseId 
            ? { ...e, paymentAllocations: updatedPayments, updatedAt: new Date().toISOString() } 
            : e
        )
      );
    } catch (error) {
      console.error('Error removing payment from expense:', error);
      throw error;
    }
  };

  // Contributor functions
  const addNewContributor = async (name: string, notes?: string) => {
    if (!user || !currentWorkspaceId) return;
    try {
      const contributor: Omit<Contributor, 'id'> = {
        name,
        totalGiftAmount: 0,
        gifts: []
      };
      
      // Only add notes field if it's not undefined
      if (notes !== undefined) {
        contributor.notes = notes;
      }
      
      const newContributor = await addContributor(currentWorkspaceId, contributor);
      setContributors(prev => [...prev, newContributor]);
    } catch (error) {
      console.error('Error adding contributor:', error);
    }
  };

  const updateExistingContributor = async (id: string, data: Partial<Contributor>) => {
    if (!user || !currentWorkspaceId) return;
    try {
      console.log('WeddingContext: Updating contributor in Firebase', { id, data, workspaceId: currentWorkspaceId });
      await updateContributor(currentWorkspaceId, id, data);
      console.log('WeddingContext: Firebase update successful, updating local state');
      setContributors(prev => {
        const updatedContributors = prev.map(contributor => 
          contributor.id === id ? { ...contributor, ...data } : contributor
        );
        console.log('WeddingContext: State updated with:', updatedContributors.find(c => c.id === id));
        return updatedContributors;
      });
    } catch (error) {
      console.error('Error updating contributor:', error);
    }
  };

  const removeContributor = async (id: string) => {
    if (!user || !currentWorkspaceId) return;
    try {
      await deleteContributor(currentWorkspaceId, id);
      setContributors(prev => prev.filter(contributor => contributor.id !== id));
    } catch (error) {
      console.error('Error deleting contributor:', error);
      throw error;
    }
  };

  // Contributor gift functions
  const addGiftToContributor = async (
    contributorId: string, 
    giftData: Omit<ContributorGift, 'id' | 'contributorId' | 'allocations'>,
    allocations?: Array<{ expenseId: string, amount: number }>
  ) => {
    if (!user || !currentWorkspaceId) return;
    try {
      const contributorRef = doc(firestore, 'workspaces', currentWorkspaceId, 'contributors', contributorId);
      const contributorSnap = await getDoc(contributorRef);
      
      if (contributorSnap.exists()) {
        const contributor = contributorSnap.data() as Contributor;
        const giftId = generateId();
        const newGift: ContributorGift = {
          id: giftId,
          contributorId,
          ...giftData,
          allocations: []
        };
        
        const gifts = contributor.gifts || [];
        const updatedGifts = [...gifts, newGift];
        const totalGiftAmount = (contributor.totalGiftAmount || 0) + giftData.amount;
        
        // Create a batch to handle the gift and all allocations in one transaction
        const batch = writeBatch(firestore);
        
        // Update the contributor with the new gift
        batch.update(contributorRef, {
          gifts: updatedGifts,
          totalGiftAmount
        });
        
        // Handle allocations if provided
        const giftAllocations: GiftAllocation[] = [];
        if (allocations && allocations.length > 0) {
          // Create each allocation
          for (const allocation of allocations) {
            const { expenseId, amount } = allocation;
            const allocationId = generateId();
            
            const allocationData: GiftAllocation = {
              id: allocationId,
              giftId,
              expenseId,
              amount
            };
            
            // Add to local array to update the gift
            giftAllocations.push(allocationData);
            
            // Create allocation document in Firestore
            const allocationRef = doc(firestore, `workspaces/${currentWorkspaceId}/giftAllocations`, allocationId);
            batch.set(allocationRef, {
              ...allocationData,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            
            // Also create a payment allocation in the expense to link the gift allocation
            const expenseRef = doc(firestore, `workspaces/${currentWorkspaceId}/expenses`, expenseId);
            const expenseSnap = await getDoc(expenseRef);
            
            if (expenseSnap.exists()) {
              const expenseData = expenseSnap.data() as Expense;
              const paymentAllocations = expenseData.paymentAllocations || [];
              
              // Create a new payment allocation from the gift
              const paymentId = generateId();
              const paymentAllocation = {
                id: paymentId,
                contributorId: contributorId,
                amount: amount,
                date: giftData.date,
                notes: `Gift allocation from ${contributor.name}'s gift of $${giftData.amount.toFixed(2)}`,
                giftId: giftId,
                allocationId: allocationId
              };
              
              // Add the payment allocation to the expense
              batch.update(expenseRef, {
                paymentAllocations: [...paymentAllocations, paymentAllocation],
                updatedAt: Timestamp.now()
              });
            }
          }
          
          // Update the gift with allocations
          if (giftAllocations.length > 0) {
            // Update the gift in the contributor's gifts array
            const updatedGiftsWithAllocations = updatedGifts.map(g => 
              g.id === giftId ? { ...g, allocations: giftAllocations } : g
            );
            
            batch.update(contributorRef, {
              gifts: updatedGiftsWithAllocations
            });
          }
        }
        
        // Commit all changes
        await batch.commit();
        
        // Update state with the new gift and allocations
        setContributors(prev => 
          prev.map(c => 
            c.id === contributorId 
              ? { 
                  ...c, 
                  gifts: updatedGifts.map(g => 
                    g.id === giftId 
                      ? { ...g, allocations: giftAllocations } 
                      : g
                  ), 
                  totalGiftAmount 
                } 
              : c
          )
        );
        
        // Also update expenses state if we added payment allocations
        if (allocations && allocations.length > 0) {
          setExpenses(prev => 
            prev.map(expense => {
              const expenseAllocations = allocations.filter(a => a.expenseId === expense.id);
              if (expenseAllocations.length === 0) return expense;
              
              // Add payment allocations for this expense
              const paymentAllocations = [...expense.paymentAllocations];
              
              for (const allocation of expenseAllocations) {
                const paymentId = generateId(); // This is just for the local state
                
                paymentAllocations.push({
                  id: paymentId,
                  contributorId: contributorId,
                  amount: allocation.amount,
                  date: giftData.date,
                  notes: `Gift allocation from ${contributor.name}'s gift of $${giftData.amount.toFixed(2)}`,
                  giftId: giftId
                });
              }
              
              return {
                ...expense,
                paymentAllocations,
                updatedAt: new Date().toISOString()
              };
            })
          );
        }
        
        return { gift: newGift, allocations: giftAllocations };
      }
    } catch (error) {
      console.error('Error adding gift to contributor:', error);
      throw error;
    }
  };
  
  const updateContributorGift = async (contributorId: string, giftId: string, data: Partial<ContributorGift>) => {
    if (!user || !currentWorkspaceId) return;
    try {
      const contributorRef = doc(firestore, 'workspaces', currentWorkspaceId, 'contributors', contributorId);
      const contributorSnap = await getDoc(contributorRef);
      
      if (contributorSnap.exists()) {
        const contributor = contributorSnap.data() as Contributor;
        const gifts = contributor.gifts || [];
        
        const giftIndex = gifts.findIndex(g => g.id === giftId);
        if (giftIndex === -1) return;
        
        const oldAmount = gifts[giftIndex].amount;
        const newAmount = data.amount !== undefined ? data.amount : oldAmount;
        const amountDifference = newAmount - oldAmount;
        
        const updatedGifts = gifts.map(g => 
          g.id === giftId ? { ...g, ...data } : g
        );
        
        const totalGiftAmount = (contributor.totalGiftAmount || 0) + amountDifference;
        
        await updateDoc(contributorRef, {
          gifts: updatedGifts,
          totalGiftAmount
        });
        
        setContributors(prev => 
          prev.map(c => 
            c.id === contributorId 
              ? { 
                  ...c, 
                  gifts: updatedGifts, 
                  totalGiftAmount 
                } 
              : c
          )
        );
      }
    } catch (error) {
      console.error('Error updating contributor gift:', error);
      throw error;
    }
  };
  
  const removeContributorGift = async (contributorId: string, giftId: string) => {
    if (!user || !currentWorkspaceId) return;
    try {
      const contributorRef = doc(firestore, 'workspaces', currentWorkspaceId, 'contributors', contributorId);
      const contributorSnap = await getDoc(contributorRef);
      
      if (contributorSnap.exists()) {
        const contributor = contributorSnap.data() as Contributor;
        const gifts = contributor.gifts || [];
        
        const giftToRemove = gifts.find(g => g.id === giftId);
        if (!giftToRemove) return;
        
        const updatedGifts = gifts.filter(g => g.id !== giftId);
        const totalGiftAmount = (contributor.totalGiftAmount || 0) - giftToRemove.amount;
        
        await updateDoc(contributorRef, {
          gifts: updatedGifts,
          totalGiftAmount
        });
        
        setContributors(prev => 
          prev.map(c => 
            c.id === contributorId 
              ? { 
                  ...c, 
                  gifts: updatedGifts, 
                  totalGiftAmount 
                } 
              : c
          )
        );
      }
    } catch (error) {
      console.error('Error removing contributor gift:', error);
      throw error;
    }
  };

  // Gift functions
  const addNewGift = async (giftData: Omit<Gift, 'id' | 'allocations'>) => {
    if (!user || !currentWorkspaceId) return;
    try {
      const newGift = await addGift(currentWorkspaceId, giftData);
      setGifts(prev => [...prev, newGift]);
    } catch (error) {
      console.error('Error adding gift:', error);
    }
  };

  const updateExistingGift = async (id: string, data: Partial<Gift>) => {
    if (!user || !currentWorkspaceId) return;
    try {
      await updateGift(currentWorkspaceId, id, data);
      setGifts(prev => 
        prev.map(gift => 
          gift.id === id ? { ...gift, ...data } : gift
        )
      );
    } catch (error) {
      console.error('Error updating gift:', error);
      throw error;
    }
  };

  const removeGift = async (id: string) => {
    if (!user || !currentWorkspaceId) return;
    try {
      await deleteGift(currentWorkspaceId, id);
      setGifts(prev => prev.filter(gift => gift.id !== id));
    } catch (error) {
      console.error('Error deleting gift:', error);
      throw error;
    }
  };

  // Gift allocation functions
  const addNewGiftAllocation = async (allocation: Omit<GiftAllocation, 'id'>) => {
    if (!user || !currentWorkspaceId) return;
    try {
      const { giftId, ...allocationData } = allocation;
      const newAllocation = await addGiftAllocation(currentWorkspaceId, giftId, allocationData);
      
      // Update the gift with the new allocation
      setGifts(prev => 
        prev.map(gift => {
          if (gift.id === giftId) {
            const allocations = gift.allocations || [];
            return {
              ...gift,
              allocations: [...allocations, newAllocation]
            };
          }
          return gift;
        })
      );
    } catch (error) {
      console.error('Error adding gift allocation:', error);
    }
  };

  const removeGiftAllocation = async (giftId: string, allocationId: string) => {
    if (!user || !currentWorkspaceId) return;
    try {
      await deleteGiftAllocation(currentWorkspaceId, giftId, allocationId);
      
      // Update the gift by removing the allocation
      setGifts(prev => 
        prev.map(gift => 
          gift.id === giftId
            ? { 
                ...gift, 
                allocations: gift.allocations.filter(a => a.id !== allocationId) 
              }
            : gift
        )
      );
    } catch (error) {
      console.error('Error removing gift allocation:', error);
      throw error;
    }
  };

  // Category functions
  const addNewCategory = async (name: string) => {
    if (!user || !currentWorkspaceId) return;
    try {
      const category: Omit<CustomCategory, 'id'> = {
        name,
        createdAt: new Date().toISOString()
      };
      const newCategory = await addCustomCategory(currentWorkspaceId, category);
      setCustomCategories(prev => [...prev, newCategory]);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const removeCategory = async (id: string) => {
    if (!user || !currentWorkspaceId) return;
    try {
      await deleteCustomCategory(currentWorkspaceId, id);
      setCustomCategories(prev => prev.filter(category => category.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  // Settings functions
  const updateAppSettings = async (newSettings: Partial<Settings>) => {
    if (!user || !currentWorkspaceId) return;
    try {
      const currentSettings = settings || { currency: 'USD' };
      const updatedSettings = { ...currentSettings, ...newSettings } as Settings;
      await updateSettings(currentWorkspaceId, updatedSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  // Export function
  const exportData = () => {
    try {
      exportToExcel(expenses, gifts, contributors);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Dashboard stats
  const getDashboardStats = (): DashboardStats => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
    const totalPaid = expenses.reduce((sum, expense) => sum + calculatePaidAmount(expense), 0);
    const totalRemaining = totalExpenses - totalPaid;
    
    // Get upcoming payments (expenses with due dates in the future)
    const now = new Date();
    const upcomingPayments = expenses
      .filter(e => e.dueDate && new Date(e.dueDate) > now && calculateRemainingAmount(e) > 0)
      .sort((a, b) => {
        if (!a.dueDate || !b.dueDate) return 0;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5); // Get top 5 upcoming payments
    
    // Calculate expenses by category
    const expensesByCategory: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
    for (const expense of expenses) {
      const category = expense.category;
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += expense.totalAmount;
    }
    
    // Calculate how much each contributor has paid
    const contributorsPayments: Record<string, number> = {};
    for (const expense of expenses) {
      for (const allocation of expense.paymentAllocations) {
        const { contributorId, amount } = allocation;
        if (!contributorsPayments[contributorId]) {
          contributorsPayments[contributorId] = 0;
        }
        contributorsPayments[contributorId] += amount;
      }
    }
    
    return {
      totalExpenses,
      totalPaid,
      totalRemaining,
      upcomingPayments,
      expensesByCategory,
      contributors: contributorsPayments
    };
  };

  // Modify the useEffect that sets up Firebase listeners to include error recovery
  useEffect(() => {
    const unsubscribeHandlers: (() => void)[] = [];
    let syncErrors = 0;
    const MAX_SYNC_ERRORS = 5;
    const ERROR_RESET_INTERVAL = 60000; // 1 minute
    
    // Error tracking interval
    const errorResetInterval = setInterval(() => {
      if (syncErrors > 0) {
        console.log(`Resetting sync error count from ${syncErrors} to 0`);
        syncErrors = 0;
      }
    }, ERROR_RESET_INTERVAL);
    
    const setupListeners = () => {
      try {
        // Add error handling to each listener
        const addListenerWithErrorRecovery = (
          collectionPath: string,
          stateUpdater: (data: any[]) => void
        ) => {
          try {
            const collectionRef = collection(firestore, collectionPath);
            const q = currentWorkspaceId 
              ? query(collectionRef, where('workspaceId', '==', currentWorkspaceId))
              : collectionRef;
            
            const unsubscribe = onSnapshot(
              q,
              (snapshot) => {
                try {
                  const items = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                  }));
                  
                  // Use debounce for state updates to prevent multiple rapid updates
                  const debouncedUpdate = debounce((data: any[]) => {
                    stateUpdater(data);
                  }, 300);
                  
                  debouncedUpdate(items);
                } catch (error) {
                  console.error(`Error processing ${collectionPath} snapshot:`, error);
                  syncErrors++;
                  
                  // If too many errors, attempt recovery
                  if (syncErrors >= MAX_SYNC_ERRORS) {
                    console.warn(`Too many sync errors (${syncErrors}), triggering recovery...`);
                    
                    // Clean up existing listeners and try to set up again after a delay
                    unsubscribeAll();
                    setTimeout(setupListeners, 5000);
                    
                    // Reset error counter
                    syncErrors = 0;
                  }
                }
              },
              (error) => {
                console.error(`Error in ${collectionPath} listener:`, error);
                syncErrors++;
                
                // If listener fails completely, attempt recovery
                if (syncErrors >= MAX_SYNC_ERRORS) {
                  console.warn(`Too many sync errors (${syncErrors}), triggering recovery...`);
                  
                  // Clean up existing listeners and try to set up again after a delay
                  unsubscribeAll();
                  setTimeout(setupListeners, 5000);
                  
                  // Reset error counter
                  syncErrors = 0;
                }
              }
            );
            
            unsubscribeHandlers.push(unsubscribe);
            return unsubscribe;
          } catch (error) {
            console.error(`Failed to set up listener for ${collectionPath}:`, error);
            syncErrors++;
            return () => {}; // Return empty function as fallback
          }
        };
        
        // Apply the error recovery to all listeners
        addListenerWithErrorRecovery(`workspaces/${currentWorkspaceId}/expenses`, setExpenses);
        addListenerWithErrorRecovery(`workspaces/${currentWorkspaceId}/contributors`, setContributors);
        // ... other listeners ...
      } catch (error) {
        console.error('Error setting up Firebase listeners:', error);
      }
    };
    
    const unsubscribeAll = () => {
      unsubscribeHandlers.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing listener:', error);
        }
      });
      unsubscribeHandlers.length = 0; // Clear the array
    };
    
    // Initial setup
    setupListeners();
    
    // Cleanup function
    return () => {
      clearInterval(errorResetInterval);
      unsubscribeAll();
    };
  }, [currentWorkspaceId, user]);

  // Context value
  const value: WeddingContextType = {
    expenses,
    gifts,
    contributors,
    customCategories,
    settings,
    isLoading,
    weddingData,
    addNewExpense,
    updateExistingExpense,
    removeExpense,
    addPaymentToExpense,
    updatePaymentAllocation,
    removePaymentFromExpense,
    addNewContributor,
    updateExistingContributor,
    removeContributor,
    addGiftToContributor,
    updateContributorGift,
    removeContributorGift,
    addNewGift,
    updateExistingGift,
    removeGift,
    addNewGiftAllocation,
    removeGiftAllocation,
    addNewCategory,
    removeCategory,
    updateAppSettings,
    exportData,
    getDashboardStats
  };

  return (
    <WeddingContext.Provider value={value}>
      {children}
    </WeddingContext.Provider>
  );
};

// Custom hook to use the context
export const useWedding = (): WeddingContextType => {
  const context = useContext(WeddingContext);
  
  if (context === undefined) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  
  return context;
}; 