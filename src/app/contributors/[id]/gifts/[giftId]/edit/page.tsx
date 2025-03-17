'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWedding } from '../../../../../../context/WeddingContext';
import { Button } from '../../../../../../components/ui/Button';
import Link from 'next/link';
import { PlusCircle, XCircle } from 'lucide-react';

export default function EditContributorGiftPage() {
  const { id, giftId } = useParams() as { id: string; giftId: string };
  const { contributors, expenses, updateContributorGift, removeContributorGift } = useWedding();
  const router = useRouter();
  
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Find the contributor
  const contributor = contributors.find(c => c.id === id);
  
  // Find the gift
  const gift = contributor?.gifts?.find(g => g.id === giftId);
  
  // Load gift data when component mounts
  useEffect(() => {
    if (gift) {
      setAmount(gift.amount.toString());
      setDate(gift.date);
      setNotes(gift.notes || '');
    }
  }, [gift]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    
    if (!date) {
      setError('Please enter a valid date.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateContributorGift(id, giftId, {
        amount: Number(amount),
        date,
        notes
      });
      
      router.push(`/contributors/${id}/details`);
    } catch (err) {
      console.error('Error updating gift:', err);
      setError('An error occurred while updating the gift. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this gift of $${Number(amount).toFixed(2)}?`)) {
      setIsDeleting(true);
      
      try {
        await removeContributorGift(id, giftId);
        router.push(`/contributors/${id}/details`);
      } catch (err) {
        console.error('Error deleting gift:', err);
        setError('An error occurred while deleting the gift. Please try again.');
        setIsDeleting(false);
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
  
  if (!gift) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-card p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold mb-4">Gift Not Found</h2>
          <p className="mb-4">The gift you are trying to edit does not exist.</p>
          <Link href={`/contributors/${id}/details`}>
            <Button>Back to Contributor Details</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto bg-card rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Gift from {contributor.name}</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 mb-6 md:grid-cols-2">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-2">$</span>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
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
          
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Link href={`/contributors/${id}/details`}>
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Gift'}
              </Button>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 