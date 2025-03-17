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
  PaymentAllocation
} from '../types';
import { calculatePaidAmount, calculateRemainingAmount } from '../lib/excel-utils';
import { testFirestoreConnection } from '../lib/test-firebase';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

// Define the context type
interface WeddingContextType {
  // Data
  expenses: Expense[];
  gifts: Gift[];
  contributors: Contributor[];
  customCategories: CustomCategory[];
  settings: Settings;
  isLoading: boolean;
  
  // Expense functions
  addNewExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'paymentAllocations'>) => Promise<void>;
  updateExistingExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  
  // Payment allocation functions
  addPaymentToExpense: (expenseId: string, payment: Omit<PaymentAllocation, 'id'>) => Promise<void>;
  updatePaymentAllocation: (expenseId: string, paymentId: string, data: Partial<PaymentAllocation>) => Promise<void>;
  removePaymentFromExpense: (expenseId: string, paymentId: string) => Promise<void>;
  
  // Contributor functions
  addNewContributor: (name: string) => Promise<void>;
  updateExistingContributor: (id: string, name: string) => Promise<void>;
  removeContributor: (id: string) => Promise<void>;
  
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

// Provider component
export const WeddingProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [settings, setSettings] = useState<Settings>({ currency: 'USD' });
  const [isLoading, setIsLoading] = useState(true);

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
        
        // Test Firestore connection first
        console.log('Testing Firestore connection...');
        const isConnected = await testFirestoreConnection();
        
        if (!isConnected) {
          throw new Error('Firestore connection test failed');
        }
        
        // Try to fetch data from Firestore for the authenticated user
        console.log('Fetching data from Firestore for user:', user.uid);
        
        // Fetch data for the authenticated user
        [
          expensesData,
          giftsData,
          contributorsData,
          categoriesData,
          settingsData
        ] = await Promise.all([
          getAllExpenses(user.uid),
          getAllGifts(user.uid),
          getAllContributors(user.uid),
          getAllCustomCategories(user.uid),
          getSettings(user.uid)
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
  }, [user, authLoading]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Expense functions
  const addNewExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'paymentAllocations'>) => {
    if (!user) return;
    try {
      const newExpense = await addExpense({
        ...expenseData,
        paymentAllocations: []
      }, user.uid);
      setExpenses(prev => [...prev, newExpense]);
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const updateExistingExpense = async (id: string, data: Partial<Expense>) => {
    if (!user) return;
    try {
      await updateExpense(id, data, user.uid);
      setExpenses(prev => 
        prev.map(expense => 
          expense.id === id ? { ...expense, ...data, updatedAt: new Date().toISOString() } : expense
        )
      );
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  };

  const removeExpense = async (id: string) => {
    if (!user) return;
    try {
      await deleteExpense(id, user.uid);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  // Payment allocation functions
  const addPaymentToExpense = async (expenseId: string, payment: Omit<PaymentAllocation, 'id'>) => {
    if (!user) return;
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
      
      const expenseRef = doc(firestore, `users/${user.uid}/expenses`, expenseId);
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
    if (!user) return;
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
      
      const expenseRef = doc(firestore, `users/${user.uid}/expenses`, expenseId);
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
    if (!user) return;
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
      
      const expenseRef = doc(firestore, `users/${user.uid}/expenses`, expenseId);
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
  const addNewContributor = async (name: string) => {
    if (!user) return;
    try {
      const newContributor = await addContributor(name, user.uid);
      setContributors(prev => [...prev, newContributor]);
    } catch (error) {
      console.error('Error adding contributor:', error);
      throw error;
    }
  };

  const updateExistingContributor = async (id: string, name: string) => {
    if (!user) return;
    try {
      await updateContributor(id, name, user.uid);
      setContributors(prev => 
        prev.map(contributor => 
          contributor.id === id ? { ...contributor, name } : contributor
        )
      );
    } catch (error) {
      console.error('Error updating contributor:', error);
      throw error;
    }
  };

  const removeContributor = async (id: string) => {
    if (!user) return;
    try {
      await deleteContributor(id, user.uid);
      setContributors(prev => prev.filter(contributor => contributor.id !== id));
    } catch (error) {
      console.error('Error deleting contributor:', error);
      throw error;
    }
  };

  // Gift functions
  const addNewGift = async (giftData: Omit<Gift, 'id' | 'allocations'>) => {
    if (!user) return;
    try {
      const newGift = await addGift(giftData, user.uid);
      setGifts(prev => [...prev, newGift]);
    } catch (error) {
      console.error('Error adding gift:', error);
      throw error;
    }
  };

  const updateExistingGift = async (id: string, data: Partial<Gift>) => {
    if (!user) return;
    try {
      await updateGift(id, data, user.uid);
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
    if (!user) return;
    try {
      await deleteGift(id, user.uid);
      setGifts(prev => prev.filter(gift => gift.id !== id));
    } catch (error) {
      console.error('Error deleting gift:', error);
      throw error;
    }
  };

  // Gift allocation functions
  const addNewGiftAllocation = async (allocation: Omit<GiftAllocation, 'id'>) => {
    if (!user) return;
    try {
      const newAllocation = await addGiftAllocation(allocation, user.uid);
      
      // Update the gift with the new allocation
      setGifts(prev => 
        prev.map(gift => 
          gift.id === allocation.giftId
            ? { 
                ...gift, 
                allocations: [...gift.allocations, newAllocation] 
              }
            : gift
        )
      );
    } catch (error) {
      console.error('Error adding gift allocation:', error);
      throw error;
    }
  };

  const removeGiftAllocation = async (giftId: string, allocationId: string) => {
    if (!user) return;
    try {
      await deleteGiftAllocation(giftId, allocationId, user.uid);
      
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
    if (!user) return;
    try {
      const newCategory = await addCustomCategory(name, user.uid);
      setCustomCategories(prev => [...prev, newCategory]);
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const removeCategory = async (id: string) => {
    if (!user) return;
    try {
      await deleteCustomCategory(id, user.uid);
      setCustomCategories(prev => prev.filter(category => category.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  // Settings functions
  const updateAppSettings = async (newSettings: Partial<Settings>) => {
    if (!user) return;
    try {
      await updateSettings(newSettings, user.uid);
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
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

  // Context value
  const value: WeddingContextType = {
    expenses,
    gifts,
    contributors,
    customCategories,
    settings,
    isLoading,
    addNewExpense,
    updateExistingExpense,
    removeExpense,
    addPaymentToExpense,
    updatePaymentAllocation,
    removePaymentFromExpense,
    addNewContributor,
    updateExistingContributor,
    removeContributor,
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