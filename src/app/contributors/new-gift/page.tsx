'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWedding } from '../../../context/WeddingContext';
import { Button } from '../../../components/ui/Button';
import Link from 'next/link';
import { PlusCircle, XCircle } from 'lucide-react';

export default function NewGiftPage() {
  const { contributors, expenses, addGiftToContributor } = useWedding();
  const router = useRouter();
  
  const [contributorId, setContributorId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllocationSection, setShowAllocationSection] = useState<boolean>(false);
  const [allocations, setAllocations] = useState<Array<{ expenseId: string; amount: number; tempId?: string }>>([]);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('');
  const [allocatedAmount, setAllocatedAmount] = useState<string>('');
  
  // Get available expenses (unpaid or partially paid)
  const availableExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const paidAmount = expense.paymentAllocations.reduce((sum, p) => sum + p.amount, 0);
      return paidAmount < expense.totalAmount;
    }).sort((a, b) => {
      // Sort by due date (earliest first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return a.dueDate ? -1 : b.dueDate ? 1 : 0;
    });
  }, [expenses]);
  
  // Calculate total allocated and remaining gift amount
  const totalAllocated = useMemo(() => {
    return allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
  }, [allocations]);
  
  const remainingGiftAmount = useMemo(() => {
    const total = Number(amount) || 0;
    return Math.max(0, total - totalAllocated);
  }, [amount, totalAllocated]);
  
  // Calculate remaining expense amounts
  const getRemainingExpenseAmount = (expenseId: string) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return 0;
    
    const paidAmount = expense.paymentAllocations.reduce((sum, p) => sum + p.amount, 0);
    const alreadyAllocated = allocations
      .filter(a => a.expenseId === expenseId)
      .reduce((sum, a) => sum + a.amount, 0);
    
    return Math.max(0, expense.totalAmount - paidAmount - alreadyAllocated);
  };
  
  // Add an allocation
  const handleAddAllocation = () => {
    if (!selectedExpenseId || !allocatedAmount) return;
    
    const amount = Number(allocatedAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    
    if (amount > remainingGiftAmount) {
      setError('Cannot allocate more than the remaining gift amount.');
      return;
    }
    
    const remainingExpense = getRemainingExpenseAmount(selectedExpenseId);
    if (amount > remainingExpense) {
      setError('Cannot allocate more than the remaining expense amount.');
      return;
    }
    
    // Generate a temporary ID for this allocation for key purposes
    const tempId = `allocation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setAllocations(prev => [...prev, { expenseId: selectedExpenseId, amount, tempId }]);
    setSelectedExpenseId('');
    setAllocatedAmount('');
    setError(null);
  };
  
  // Remove an allocation
  const handleRemoveAllocation = (index: number) => {
    setAllocations(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!contributorId) {
      setError('Please select a contributor.');
      return;
    }
    
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    
    if (!date) {
      setError('Please enter a valid date.');
      return;
    }
    
    // Validate allocations
    if (allocations.length > 0) {
      if (totalAllocated > Number(amount)) {
        setError('Total allocations cannot exceed the gift amount.');
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      await addGiftToContributor(contributorId, {
        amount: Number(amount),
        date,
        notes
      }, allocations.length > 0 ? allocations : undefined);
      
      router.push('/contributors');
    } catch (err) {
      console.error('Error adding gift:', err);
      setError('An error occurred while adding the gift. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Add New Gift</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="contributor" className="block text-sm font-medium mb-1">Contributor</label>
            <select
              id="contributor"
              value={contributorId}
              onChange={(e) => setContributorId(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select a contributor</option>
              {contributors.map(contributor => (
                <option key={contributor.id} value={contributor.id}>
                  {contributor.name}
                </option>
              ))}
            </select>
            {contributors.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No contributors found. <Link href="/contributors/new" className="text-primary hover:underline">Add a contributor</Link> first.
              </p>
            )}
          </div>
          
          <div className="grid gap-6 mb-6 md:grid-cols-2">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2">$</span>
                <input
                  id="amount"
                  type="text"
                  pattern="[0-9]*\.?[0-9]*"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 pl-8 border rounded-md"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-1">Date</label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium mb-1">Notes (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={3}
              placeholder="Add any details about this gift..."
            />
          </div>
          
          {Number(amount) > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Allocate to Expenses</h3>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAllocationSection(!showAllocationSection)}
                >
                  {showAllocationSection ? 'Hide' : 'Show'} Allocation Section
                </Button>
              </div>
              
              {showAllocationSection && (
                <div className="border rounded-md p-4 bg-card/50">
                  <div className="mb-4 flex justify-between items-center">
                    <div className="font-medium">
                      <div className="text-sm">Total Gift: ${Number(amount).toFixed(2)}</div>
                      <div className="text-sm">Allocated: ${totalAllocated.toFixed(2)}</div>
                      <div className="text-sm font-bold">Remaining: ${remainingGiftAmount.toFixed(2)}</div>
                    </div>
                    
                    {allocations.length > 0 && (
                      <div className="text-sm text-slate-600">
                        {allocations.length} allocation{allocations.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  
                  {availableExpenses.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label htmlFor="expense" className="block text-sm font-medium mb-1">Expense</label>
                          <select
                            id="expense"
                            value={selectedExpenseId}
                            onChange={(e) => setSelectedExpenseId(e.target.value)}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Select an expense</option>
                            {availableExpenses.map(expense => {
                              const remaining = getRemainingExpenseAmount(expense.id);
                              return (
                                <option key={expense.id} value={expense.id} disabled={remaining <= 0}>
                                  {expense.title} (${remaining.toFixed(2)} remaining)
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="allocated-amount" className="block text-sm font-medium mb-1">Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2">$</span>
                            <input
                              id="allocated-amount"
                              type="text"
                              pattern="[0-9]*\.?[0-9]*"
                              inputMode="decimal"
                              value={allocatedAmount}
                              onChange={(e) => setAllocatedAmount(e.target.value)}
                              className="w-full p-2 pl-8 border rounded-md"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-end">
                          <Button
                            type="button"
                            onClick={handleAddAllocation}
                            disabled={!selectedExpenseId || !allocatedAmount || Number(allocatedAmount) <= 0 || remainingGiftAmount <= 0}
                            className="w-full"
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Allocation
                          </Button>
                        </div>
                      </div>
                      
                      {allocations.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Allocations</h4>
                          <div className="border rounded-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {allocations.map((allocation) => {
                                  const expense = expenses.find(e => e.id === allocation.expenseId);
                                  return (
                                    <tr key={allocation.tempId || `alloc-${expense?.id || ''}-${Math.random()}`}>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        {expense?.title || 'Unknown Expense'}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        ${allocation.amount.toFixed(2)}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveAllocation(allocations.indexOf(allocation))}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <XCircle className="h-5 w-5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                <tr className="bg-gray-50">
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">Total Allocated</td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">${totalAllocated.toFixed(2)}</td>
                                  <td />
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6 text-slate-500">
                      <p>No expenses available for allocation.</p>
                      <p className="text-sm">All expenses are fully paid or there are no expenses yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between">
            <Link href="/contributors">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Gift'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 