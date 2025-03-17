import { useState, type KeyboardEvent } from 'react';
import { formatCurrency } from '@/lib/excel-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { Expense, ExpenseCategory } from '@/types';
import { EditExpenseDialog } from './EditExpenseDialog';

interface ExpensesTableProps {
  expenses: Expense[];
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'paid-future' | 'partial' | 'unpaid'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'amount' | 'dueDate'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // Helper to calculate paid amount
  const calculatePaidAmount = (expense: Expense) => {
    return expense.paymentAllocations.reduce((total, allocation) => total + allocation.amount, 0);
  };
  
  // Helper to determine payment status
  const getPaymentStatus = (expense: Expense) => {
    const paidAmount = calculatePaidAmount(expense);
    
    // Check if it's unpaid
    if (paidAmount <= 0) return 'unpaid';
    
    // Check if it's fully paid
    if (paidAmount >= expense.totalAmount) {
      // Check if any payments have future dates
      const hasFuturePayments = expense.paymentAllocations.some(payment => {
        if (!payment.date) return false;
        const paymentDate = new Date(payment.date);
        const today = new Date();
        // Reset time to compare just the dates
        today.setHours(0, 0, 0, 0);
        paymentDate.setHours(0, 0, 0, 0);
        return paymentDate > today;
      });
      
      return hasFuturePayments ? 'paid-future' : 'paid';
    }
    
    // Otherwise it's partially paid
    return 'partial';
  };
  
  // Filter expenses
  let filteredExpenses = expenses.filter(expense => {
    // Text search
    const matchesSearch = 
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.provider?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    // Payment status filter
    const status = getPaymentStatus(expense);
    const matchesPaymentStatus = paymentStatusFilter === 'all' || paymentStatusFilter === status;
    
    return matchesSearch && matchesCategory && matchesPaymentStatus;
  });
  
  // Sort expenses
  filteredExpenses = filteredExpenses.sort((a, b) => {
    if (sortBy === 'title') {
      return sortDirection === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } 
    
    if (sortBy === 'amount') {
      return sortDirection === 'asc'
        ? a.totalAmount - b.totalAmount
        : b.totalAmount - a.totalAmount;
    }
    
    if (sortBy === 'dueDate') {
      // Handle missing due dates (push to the end in ascending order, to the start in descending)
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return sortDirection === 'asc' ? 1 : -1;
      if (!b.dueDate) return sortDirection === 'asc' ? -1 : 1;
      
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return sortDirection === 'asc' 
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    }
    
    return 0;
  });
  
  // Get unique categories from expenses
  const categories = Array.from(new Set(expenses.map(expense => expense.category)));
  
  // Toggle sort direction or change sort field
  const handleSort = (field: 'title' | 'amount' | 'dueDate') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  
  // Handle keyboard navigation for sorting
  const handleSortKeyDown = (event: KeyboardEvent<HTMLButtonElement>, field: 'title' | 'amount' | 'dueDate') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSort(field);
    }
  };

  // Open the edit dialog for an expense
  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setEditDialogOpen(true);
  };
  
  // Close the edit dialog
  const handleCloseDialog = () => {
    setSelectedExpense(null);
    setEditDialogOpen(false);
  };
  
  return (
    <div>
      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <input
            type="text"
            placeholder="Search expenses..."
            className="w-full p-2 pl-3 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <select
            className="w-full p-2 border rounded-md"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <select
            className="w-full p-2 border rounded-md"
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value as 'all' | 'paid' | 'paid-future' | 'partial' | 'unpaid')}
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="paid-future">Paid (Future)</option>
            <option value="partial">Partially Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>
      
      {/* Expenses Table */}
      {filteredExpenses.length > 0 ? (
        <div className="bg-background rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button 
                      type="button"
                      className="font-semibold flex items-center focus:outline-none"
                      onClick={() => handleSort('title')}
                      onKeyDown={(e) => handleSortKeyDown(e, 'title')}
                    >
                      Expense
                      {sortBy === 'title' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">
                    <button 
                      type="button"
                      className="font-semibold flex items-center focus:outline-none"
                      onClick={() => handleSort('amount')}
                      onKeyDown={(e) => handleSortKeyDown(e, 'amount')}
                    >
                      Total
                      {sortBy === 'amount' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Paid</th>
                  <th className="px-4 py-3 text-left">Remaining</th>
                  <th className="px-4 py-3 text-left">
                    <button 
                      type="button"
                      className="font-semibold flex items-center focus:outline-none"
                      onClick={() => handleSort('dueDate')}
                      onKeyDown={(e) => handleSortKeyDown(e, 'dueDate')}
                    >
                      Due Date
                      {sortBy === 'dueDate' && (
                        <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => {
                  const paidAmount = calculatePaidAmount(expense);
                  const remainingAmount = expense.totalAmount - paidAmount;
                  const status = getPaymentStatus(expense);
                  
                  return (
                    <tr key={expense.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{expense.title}</td>
                      <td className="px-4 py-3 capitalize">{expense.category}</td>
                      <td className="px-4 py-3">{formatCurrency(expense.totalAmount)}</td>
                      <td className="px-4 py-3">{formatCurrency(paidAmount)}</td>
                      <td className="px-4 py-3">{formatCurrency(remainingAmount)}</td>
                      <td className="px-4 py-3">
                        {expense.dueDate 
                          ? new Date(expense.dueDate).toLocaleDateString() 
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className={`inline-block py-1 px-2 rounded-full text-xs font-medium 
                            ${status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                            ${status === 'paid-future' ? 'bg-blue-100 text-blue-800' : ''}
                            ${status === 'partial' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${status === 'unpaid' ? 'bg-red-100 text-red-800' : ''}
                          `}
                        >
                          {status === 'paid' && 'Paid'}
                          {status === 'paid-future' && 'Paid (Future)'}
                          {status === 'partial' && 'Partial'}
                          {status === 'unpaid' && 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          type="button"
                          className="text-primary hover:underline mr-3"
                          onClick={() => handleEditClick(expense)}
                        >
                          Edit
                        </button>
                        <Link href={`/expenses/${expense.id}/payments`} className="text-primary hover:underline">
                          Payments
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow p-8 text-center">
          <p className="text-muted-foreground mb-4">No expenses found</p>
          <Link href="/expenses/new">
            <Button>Add Your First Expense</Button>
          </Link>
        </div>
      )}

      {/* Edit Expense Dialog */}
      <EditExpenseDialog 
        isOpen={editDialogOpen}
        onClose={handleCloseDialog}
        expense={selectedExpense}
      />
    </div>
  );
} 