import { addDoc, collection, doc, query, where, getDocs, orderBy, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import type { Expense } from '@/types';
import { firestore as db } from '@/lib/firebase';

/**
 * Updates an existing expense in Firestore
 * @param expenseId ID of the expense to update
 * @param expenseData Updated expense data
 * @returns Promise that resolves when the update is complete
 */
export async function updateExpense(expenseId: string, expenseData: Partial<Expense>): Promise<void> {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseRef, {
      ...expenseData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
}

/**
 * Permanently deletes an expense from Firestore
 * @param expenseId ID of the expense to delete
 * @returns Promise that resolves when the delete is complete
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
} 