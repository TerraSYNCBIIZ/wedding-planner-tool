'use client';

import { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { formatCurrency } from '../../lib/excel-utils';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import type { PaymentAllocation } from '../../types';

export default function ContributorsPage() {
  const { contributors, expenses } = useWedding();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter contributors based on search term
  const filteredContributors = contributors.filter(contributor => 
    contributor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Contributors</h1>
        <Link href="/contributors/new">
          <Button>Add New Contributor</Button>
        </Link>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search contributors..."
            className="w-full p-2 pl-10 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5">🔍</span>
        </div>
      </div>
      
      {/* Contributors Grid */}
      {filteredContributors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContributors.map(contributor => {
            // Calculate total contributed by this contributor
            const totalContributed = expenses.reduce((total, expense) => {
              const contributorAllocations = expense.paymentAllocations.filter(
                (allocation: PaymentAllocation) => allocation.contributorId === contributor.id
              );
              return total + contributorAllocations.reduce((sum: number, allocation: PaymentAllocation) => sum + allocation.amount, 0);
            }, 0);
            
            // Get the expenses this contributor has paid for
            const contributedExpenses = expenses.filter(expense => 
              expense.paymentAllocations.some(
                (allocation: PaymentAllocation) => allocation.contributorId === contributor.id
              )
            );
            
            return (
              <div key={contributor.id} className="bg-card rounded-lg p-6 shadow-md border">
                <h2 className="text-xl font-bold mb-2">{contributor.name}</h2>
                <div className="text-lg font-semibold text-primary mb-3">
                  Total Contributed: {formatCurrency(totalContributed)}
                </div>
                
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                  Contributed to {contributedExpenses.length} expenses
                </h3>
                
                {contributedExpenses.length > 0 && (
                  <ul className="text-sm mb-4 space-y-1">
                    {contributedExpenses.slice(0, 3).map(expense => (
                      <li key={expense.id} className="truncate">
                        • {expense.title}
                      </li>
                    ))}
                    {contributedExpenses.length > 3 && (
                      <li className="text-muted-foreground text-xs">
                        And {contributedExpenses.length - 3} more...
                      </li>
                    )}
                  </ul>
                )}
                
                <div className="mt-4 space-x-2">
                  <Link href={`/contributors/${contributor.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Link href={`/contributors/${contributor.id}/details`}>
                    <Button variant="secondary" size="sm">View Details</Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow p-8 text-center">
          <p className="text-muted-foreground mb-4">No contributors found</p>
          <Link href="/contributors/new">
            <Button>Add Your First Contributor</Button>
          </Link>
        </div>
      )}
    </div>
  );
} 