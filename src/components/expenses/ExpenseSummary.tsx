import React from 'react';
import { formatCurrency } from '@/lib/excel-utils';
import type { Expense } from '@/types';

interface ExpenseSummaryProps {
  expenses: Expense[];
}

export function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
  // Calculate total expense amount
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  
  // Calculate total paid amount
  const totalPaid = expenses.reduce((sum, expense) => {
    const paidAmount = expense.paymentAllocations.reduce((total, allocation) => total + allocation.amount, 0);
    return sum + paidAmount;
  }, 0);
  
  // Calculate remaining amount
  const totalRemaining = totalExpenses - totalPaid;
  
  // Calculate percentage paid
  const percentagePaid = totalExpenses > 0 ? (totalPaid / totalExpenses) * 100 : 0;
  
  // Count upcoming expenses (due in the next 30 days)
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const upcomingExpenses = expenses.filter(expense => {
    if (!expense.dueDate) return false;
    const dueDate = new Date(expense.dueDate);
    return dueDate >= today && dueDate <= thirtyDaysFromNow;
  });
  
  // Get total for upcoming expenses
  const upcomingTotal = upcomingExpenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h3 className="text-muted-foreground text-sm font-medium mb-2">Total Expenses</h3>
        <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
        <p className="text-sm text-muted-foreground mt-1">{expenses.length} expenses total</p>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h3 className="text-muted-foreground text-sm font-medium mb-2">Paid</h3>
        <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
        <div className="mt-2 w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full" 
            style={{ width: `${percentagePaid}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">{percentagePaid.toFixed(1)}% of total</p>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h3 className="text-muted-foreground text-sm font-medium mb-2">Remaining</h3>
        <p className="text-2xl font-bold">{formatCurrency(totalRemaining)}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {totalRemaining > 0 
            ? `Still need to pay ${formatCurrency(totalRemaining)}`
            : 'All expenses are covered!'}
        </p>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow-sm border">
        <h3 className="text-muted-foreground text-sm font-medium mb-2">Due Soon</h3>
        <p className="text-2xl font-bold">{formatCurrency(upcomingTotal)}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {upcomingExpenses.length} {upcomingExpenses.length === 1 ? 'expense' : 'expenses'} due in 30 days
        </p>
      </div>
    </div>
  );
} 