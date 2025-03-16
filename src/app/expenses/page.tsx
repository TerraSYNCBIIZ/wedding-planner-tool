'use client';

import { useWedding } from '../../context/WeddingContext';
import { formatCurrency } from '../../lib/excel-utils';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { useState } from 'react';
import type { Expense, PaymentAllocation } from '../../types';

export default function ExpensesPage() {
  const { expenses, contributors } = useWedding();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calculate paid amount for each expense
  const calculatePaidAmount = (expense: Expense) => {
    return expense.paymentAllocations.reduce((total: number, allocation: PaymentAllocation) => total + allocation.amount, 0);
  };
  
  // Filter expenses based on search term
  const filteredExpenses = expenses.filter(expense => 
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get contributor name by ID
  const getContributorName = (id: string) => {
    const contributor = contributors.find(c => c.id === id);
    return contributor ? contributor.name : 'Unknown';
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Expenses</h1>
        <Link href="/expenses/new">
          <Button>Add New Expense</Button>
        </Link>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search expenses..."
            className="w-full p-2 pl-10 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5">🔍</span>
        </div>
      </div>
      
      {/* Expenses Table */}
      {filteredExpenses.length > 0 ? (
        <div className="bg-background rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Expense</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Paid</th>
                  <th className="px-4 py-3 text-left">Remaining</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-left">Provider</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => {
                  const paidAmount = calculatePaidAmount(expense);
                  const remainingAmount = expense.totalAmount - paidAmount;
                  
                  return (
                    <tr key={expense.id} className="border-t">
                      <td className="px-4 py-3">{expense.title}</td>
                      <td className="px-4 py-3 capitalize">{expense.category}</td>
                      <td className="px-4 py-3">{formatCurrency(expense.totalAmount)}</td>
                      <td className="px-4 py-3">{formatCurrency(paidAmount)}</td>
                      <td className="px-4 py-3">{formatCurrency(remainingAmount)}</td>
                      <td className="px-4 py-3">{expense.dueDate ? new Date(expense.dueDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 py-3">{expense.provider || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <Link href={`/expenses/${expense.id}`} className="text-primary hover:underline mr-3">
                          Edit
                        </Link>
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
      
      {/* Contributors Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Contributors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contributors.map(contributor => {
            // Calculate total contributed by this contributor
            const totalContributed = expenses.reduce((total, expense) => {
              const contributorAllocations = expense.paymentAllocations.filter(
                (allocation: PaymentAllocation) => allocation.contributorId === contributor.id
              );
              return total + contributorAllocations.reduce((sum: number, allocation: PaymentAllocation) => sum + allocation.amount, 0);
            }, 0);
            
            return (
              <div key={contributor.id} className="bg-card rounded-lg p-4 border">
                <h3 className="font-medium">{contributor.name}</h3>
                <p className="text-muted-foreground">Total contributed: {formatCurrency(totalContributed)}</p>
                <Link href={`/contributors/${contributor.id}`} className="text-primary hover:underline text-sm">
                  View Details
                </Link>
              </div>
            );
          })}
          <Link href="/contributors/new" 
            className="bg-muted rounded-lg p-4 border border-dashed flex items-center justify-center"
          >
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Add a new contributor</p>
              <Button variant="outline" size="sm">Add Contributor</Button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 