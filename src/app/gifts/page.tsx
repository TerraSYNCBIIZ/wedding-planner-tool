'use client';

import { useState } from 'react';
import { useWedding } from '../../context/WeddingContext';
import { formatCurrency } from '../../lib/excel-utils';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import type { GiftAllocation } from '../../types';

export default function GiftsPage() {
  const { gifts, expenses } = useWedding();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter gifts based on search term
  const filteredGifts = gifts.filter(gift => 
    gift.fromPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate total gifts and allocated amount
  const totalGifts = gifts.reduce((total, gift) => total + gift.amount, 0);
  const totalAllocated = gifts.reduce((total, gift) => {
    const giftAllocations = gift.allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
    return total + giftAllocations;
  }, 0);
  const totalUnallocated = totalGifts - totalAllocated;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Gifts</h1>
        <Link href="/gifts/new">
          <Button>Add New Gift</Button>
        </Link>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-muted-foreground text-sm font-medium mb-2">Total Gifts</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalGifts)}</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-muted-foreground text-sm font-medium mb-2">Allocated</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalAllocated)}</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-muted-foreground text-sm font-medium mb-2">Unallocated</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalUnallocated)}</p>
        </div>
      </div>
      
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search gifts by giver..."
            className="w-full p-2 pl-10 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-2.5">🔍</span>
        </div>
      </div>
      
      {/* Gifts Table */}
      {filteredGifts.length > 0 ? (
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left">From</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Allocated</th>
                  <th className="px-4 py-3 text-left">Remaining</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGifts.map((gift) => {
                  const allocatedAmount = gift.allocations.reduce((sum, allocation) => sum + allocation.amount, 0);
                  const remainingAmount = gift.amount - allocatedAmount;
                  
                  return (
                    <tr key={gift.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{gift.fromPerson}</td>
                      <td className="px-4 py-3">{formatCurrency(gift.amount)}</td>
                      <td className="px-4 py-3">{new Date(gift.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{formatCurrency(allocatedAmount)}</td>
                      <td className="px-4 py-3">{formatCurrency(remainingAmount)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/gifts/${gift.id}`} className="text-primary hover:underline mr-3">
                          Edit
                        </Link>
                        <Link href={`/gifts/${gift.id}/allocate`} className="text-primary hover:underline">
                          Allocate
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
          <p className="text-muted-foreground mb-4">No gifts found</p>
          <Link href="/gifts/new">
            <Button>Add Your First Gift</Button>
          </Link>
        </div>
      )}
      
      {/* Allocations */}
      {gifts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Recent Allocations</h2>
          
          {gifts.some(gift => gift.allocations.length > 0) ? (
            <div className="bg-card rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">From</th>
                    <th className="px-4 py-3 text-left">Expense</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {gifts
                    .flatMap(gift => 
                      gift.allocations.map(allocation => ({
                        fromPerson: gift.fromPerson,
                        expenseId: allocation.expenseId,
                        amount: allocation.amount,
                        id: allocation.id
                      }))
                    )
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 10)
                    .map(allocation => {
                      const expense = expenses.find(e => e.id === allocation.expenseId);
                      
                      return (
                        <tr key={allocation.id} className="border-t">
                          <td className="px-4 py-3">{allocation.fromPerson}</td>
                          <td className="px-4 py-3">{expense ? expense.title : "Unknown expense"}</td>
                          <td className="px-4 py-3">{formatCurrency(allocation.amount)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-lg text-center">
              <p>No allocations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Allocate your gifts to expenses to see how they offset your costs
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 