'use client';

import { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { formatCurrency } from '../../lib/excel-utils';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { TabNavigation } from '../../components/ui/TabNavigation';
import type { PaymentAllocation, Gift, GiftAllocation, ContributorGift } from '../../types';

export default function ContributorsPage() {
  const { contributors, expenses, gifts } = useWedding();
  const [searchTerm, setSearchTerm] = useState('');
  const [showGiftBalance, setShowGiftBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'withGifts' | 'withExpenses'>('all');
  
  // Filter contributors based on search term and active tab
  const filteredContributors = contributors.filter(contributor => {
    const matchesSearch = contributor.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    
    // Find payments from this contributor
    const hasExpenses = expenses.some(expense => 
      expense.paymentAllocations.some(
        (allocation: PaymentAllocation) => allocation.contributorId === contributor.id
      )
    );
    
    // Find gifts from this contributor (either from old Gift model or new ContributorGift)
    const hasGiftsOldModel = gifts.some(gift => 
      gift.fromPerson.toLowerCase() === contributor.name.toLowerCase()
    );
    
    const hasGiftsNewModel = contributor.gifts && contributor.gifts.length > 0;
    
    if (activeTab === 'withGifts') return matchesSearch && (hasGiftsOldModel || hasGiftsNewModel);
    if (activeTab === 'withExpenses') return matchesSearch && hasExpenses;
    
    return matchesSearch;
  });
  
  // Calculate totals
  const totalGiftsReceived = gifts.reduce((total, gift) => total + gift.amount, 0) + 
    contributors.reduce((total, contributor) => 
      total + (contributor.gifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0), 0);
  
  const totalExpensesPaid = expenses.reduce((total, expense) => 
    total + expense.paymentAllocations.reduce((sum, allocation) => sum + allocation.amount, 0), 0);
  
  // Define tabs for the TabNavigation component
  const tabs = [
    { id: 'all', label: 'All Contributors' },
    { id: 'withGifts', label: 'With Gifts' },
    { id: 'withExpenses', label: 'With Expenses' }
  ];
  
  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as 'all' | 'withGifts' | 'withExpenses');
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contributors & Gifts</h1>
        <div className="flex gap-2">
          <Link href="/contributors/new-gift">
            <Button variant="outline">Add Gift</Button>
          </Link>
          <Link href="/contributors/new">
            <Button>Add Contributor</Button>
          </Link>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-muted-foreground text-sm font-medium mb-2">Total Gifts</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalGiftsReceived)}</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-muted-foreground text-sm font-medium mb-2">Total Expenses Paid</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalExpensesPaid)}</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-muted-foreground text-sm font-medium mb-2">Balance</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalGiftsReceived - totalExpensesPaid)}</p>
        </div>
      </div>
      
      {/* Tabs - Using our new TabNavigation component */}
      <div className="mb-6">
        <TabNavigation 
          tabs={tabs} 
          activeTab={activeTab} 
          onChange={handleTabChange} 
          storageKey="contributors-tab" 
          variant="underline"
        />
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
          <span className="absolute left-3 top-2.5">
            <svg 
              className="h-4 w-4 text-gray-400" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              aria-labelledby="searchIconTitle"
            >
              <title id="searchIconTitle">Search</title>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
        </div>
      </div>
      
      {/* Tab panels */}
      <div id={`tabpanel-${activeTab}`} role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {/* Contributors Grid */}
        {filteredContributors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContributors.map(contributor => {
              // Calculate total contributed by this contributor through expenses
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
              
              // Calculate total gifts from this contributor (from both models)
              const oldModelGifts = gifts.filter(gift => 
                gift.fromPerson.toLowerCase() === contributor.name.toLowerCase()
              );
              
              const totalGiftsOldModel = oldModelGifts.reduce((sum, gift) => sum + gift.amount, 0);
              const totalGiftsNewModel = contributor.gifts?.reduce((sum, gift) => sum + gift.amount, 0) || 0;
              const totalGiftsAmount = totalGiftsOldModel + totalGiftsNewModel;
              
              // Calculate balance (gifts - expenses paid)
              const balance = totalGiftsAmount - totalContributed;
              
              return (
                <div key={contributor.id} className="bg-card rounded-lg p-6 shadow-md border">
                  <h2 className="text-xl font-bold mb-2">{contributor.name}</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <h3 className="text-xs text-muted-foreground">Gift Amount</h3>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(totalGiftsAmount)}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xs text-muted-foreground">Expense Payments</h3>
                      <div className="text-lg font-semibold text-blue-600">
                        {formatCurrency(totalContributed)}
                      </div>
                    </div>
                  </div>
                  
                  {showGiftBalance && (
                    <div className="mb-3 p-2 bg-muted rounded-md">
                      <h3 className="text-xs text-muted-foreground">Balance</h3>
                      <div className={`text-lg font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(balance)}
                      </div>
                    </div>
                  )}
                  
                  {(oldModelGifts.length > 0 || (contributor.gifts && contributor.gifts.length > 0)) && (
                    <div className="mb-3">
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        Gifts ({oldModelGifts.length + (contributor.gifts?.length || 0)})
                      </h3>
                      <ul className="text-sm space-y-1">
                        {oldModelGifts.slice(0, 1).map(gift => (
                          <li key={gift.id} className="truncate">
                            • {formatCurrency(gift.amount)} on {new Date(gift.date).toLocaleDateString()}
                          </li>
                        ))}
                        {contributor.gifts?.slice(0, 1).map(gift => (
                          <li key={gift.id} className="truncate">
                            • {formatCurrency(gift.amount)} on {new Date(gift.date).toLocaleDateString()}
                          </li>
                        ))}
                        {(oldModelGifts.length + (contributor.gifts?.length || 0)) > 1 && (
                          <li className="text-muted-foreground text-xs">
                            And {(oldModelGifts.length + (contributor.gifts?.length || 0)) - 1} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-4 space-x-2">
                    <Link href={`/contributors/${contributor.id}/edit`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Link href={`/contributors/${contributor.id}/details`}>
                      <Button variant="secondary" size="sm">View Details</Button>
                    </Link>
                    <Link href={`/contributors/${contributor.id}/add-gift`}>
                      <Button variant="default" size="sm">Add Gift</Button>
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
    </div>
  );
} 