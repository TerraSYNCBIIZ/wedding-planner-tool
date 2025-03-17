'use client';

import { useParams } from 'next/navigation';
import { useWedding } from '../../../../context/WeddingContext';
import { formatCurrency } from '../../../../lib/excel-utils';
import Link from 'next/link';
import { Button } from '../../../../components/ui/Button';
import type { PaymentAllocation, Gift, ContributorGift } from '../../../../types';

export default function ContributorDetailsPage() {
  const { id } = useParams() as { id: string };
  const { contributors, expenses, gifts, removeGift, removeContributorGift } = useWedding();
  
  // Find the contributor
  const contributor = contributors.find(c => c.id === id);
  
  // Handle old model gift deletion
  const handleDeleteOldGift = async (giftId: string, amount: number) => {
    if (window.confirm(`Are you sure you want to delete this gift of ${formatCurrency(amount)}?`)) {
      try {
        await removeGift(giftId);
      } catch (error) {
        console.error('Error deleting gift:', error);
        alert('An error occurred while deleting the gift.');
      }
    }
  };
  
  // Handle new model gift deletion
  const handleDeleteNewGift = async (giftId: string, amount: number) => {
    if (window.confirm(`Are you sure you want to delete this gift of ${formatCurrency(amount)}?`)) {
      try {
        await removeContributorGift(id, giftId);
      } catch (error) {
        console.error('Error deleting gift:', error);
        alert('An error occurred while deleting the gift.');
      }
    }
  };
  
  if (!contributor) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-card p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold mb-4">Contributor Not Found</h2>
          <p className="mb-4">The contributor you are looking for does not exist.</p>
          <Link href="/contributors">
            <Button>Back to Contributors</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // Get expenses this contributor has paid for
  const contributedExpenses = expenses.filter(expense => 
    expense.paymentAllocations.some(
      (allocation: PaymentAllocation) => allocation.contributorId === contributor.id
    )
  );
  
  // Calculate total contributed to expenses
  const totalContributed = contributedExpenses.reduce((total, expense) => {
    const contributorAllocations = expense.paymentAllocations.filter(
      (allocation: PaymentAllocation) => allocation.contributorId === contributor.id
    );
    return total + contributorAllocations.reduce((sum: number, allocation: PaymentAllocation) => sum + allocation.amount, 0);
  }, 0);
  
  // Get gifts from this contributor (from both models)
  const oldModelGifts = gifts.filter(gift => 
    gift.fromPerson.toLowerCase() === contributor.name.toLowerCase()
  );
  
  const newModelGifts = contributor.gifts || [];
  
  // Calculate total gifts
  const totalGiftsOldModel = oldModelGifts.reduce((sum, gift) => sum + gift.amount, 0);
  const totalGiftsNewModel = newModelGifts.reduce((sum, gift) => sum + gift.amount, 0);
  const totalGiftsAmount = totalGiftsOldModel + totalGiftsNewModel;
  
  // Calculate balance
  const balance = totalGiftsAmount - totalContributed;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/contributors" className="text-primary hover:underline mb-2 block">
            ← Back to Contributors
          </Link>
          <h1 className="text-3xl font-bold">{contributor.name}</h1>
          {contributor.notes && (
            <p className="text-muted-foreground mt-1">{contributor.notes}</p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Link href={`/contributors/${id}/add-gift`}>
            <Button variant="outline">Add Gift</Button>
          </Link>
          <Link href={`/contributors/${id}/edit`}>
            <Button>Edit Contributor</Button>
          </Link>
        </div>
      </div>
      
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-muted-foreground text-sm font-medium mb-2">Total Gifts</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalGiftsAmount)}</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-muted-foreground text-sm font-medium mb-2">Total Expenses Paid</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalContributed)}</p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h3 className="text-muted-foreground text-sm font-medium mb-2">Balance</h3>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>
      
      {/* Gifts Section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Gifts</h2>
          <Link href={`/contributors/${id}/add-gift`}>
            <Button size="sm">Add Gift</Button>
          </Link>
        </div>
        
        {totalGiftsAmount > 0 ? (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {oldModelGifts.map(gift => (
                  <tr key={gift.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{formatCurrency(gift.amount)}</td>
                    <td className="px-4 py-3">{new Date(gift.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{gift.notes || '-'}</td>
                    <td className="px-4 py-3">
                      <Link href={`/gifts/${gift.id}`} className="text-primary hover:underline mr-3">
                        Edit
                      </Link>
                      <button 
                        type="button"
                        onClick={() => handleDeleteOldGift(gift.id, gift.amount)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                
                {newModelGifts.map(gift => (
                  <tr key={gift.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{formatCurrency(gift.amount)}</td>
                    <td className="px-4 py-3">{new Date(gift.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{gift.notes || '-'}</td>
                    <td className="px-4 py-3">
                      <Link href={`/contributors/${id}/gifts/${gift.id}/edit`} className="text-primary hover:underline mr-3">
                        Edit
                      </Link>
                      <button 
                        type="button"
                        onClick={() => handleDeleteNewGift(gift.id, gift.amount)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-muted p-4 rounded-lg text-center">
            <p>No gifts recorded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add a gift to track contributions from this person
            </p>
          </div>
        )}
      </div>
      
      {/* Expenses Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Expense Payments</h2>
        
        {contributedExpenses.length > 0 ? (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Expense</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Amount Paid</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contributedExpenses.map(expense => {
                  const contributorAllocations = expense.paymentAllocations.filter(
                    (allocation: PaymentAllocation) => allocation.contributorId === contributor.id
                  );
                  
                  return contributorAllocations.map((allocation: PaymentAllocation) => (
                    <tr key={allocation.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{expense.title}</td>
                      <td className="px-4 py-3">{expense.category}</td>
                      <td className="px-4 py-3">{formatCurrency(allocation.amount)}</td>
                      <td className="px-4 py-3">{new Date(allocation.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Link href={`/expenses/${expense.id}`} className="text-primary hover:underline">
                          View Expense
                        </Link>
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-muted p-4 rounded-lg text-center">
            <p>No expense payments recorded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              This contributor hasn't paid for any expenses yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 