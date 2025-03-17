'use client';

import { useWedding } from '@/context/WeddingContext';
import { ExpenseCategoryChart } from '@/components/expenses/ExpenseCategoryChart';
import { ExpenseSummary } from '@/components/expenses/ExpenseSummary';
import { ExpensesTable } from '@/components/expenses/ExpensesTable';
import { QuickAddExpense } from '@/components/expenses/QuickAddExpense';
import { CategoryManager } from '@/components/expenses/CategoryManager';

export default function ExpensesPage() {
  const { expenses } = useWedding();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Wedding Expenses</h1>
        <p className="text-muted-foreground">Manage and track all your wedding costs</p>
      </div>
      
      {/* Summary cards */}
      <div className="mb-8">
        <ExpenseSummary expenses={expenses} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Expense category chart */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl shadow-md border p-6 hover:shadow-lg transition-all duration-300">
            <h2 className="text-lg font-semibold mb-4">Expense Breakdown</h2>
            <ExpenseCategoryChart expenses={expenses} />
          </div>
        </div>
        
        {/* Quick add expense form */}
        <div>
          <QuickAddExpense />
          <div className="mt-4">
            <CategoryManager />
          </div>
        </div>
      </div>
      
      {/* Expenses table with enhanced filtering */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">All Expenses</h2>
        <ExpensesTable expenses={expenses} />
      </div>
    </div>
  );
} 