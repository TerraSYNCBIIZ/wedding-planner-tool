'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWedding } from '../../../context/WeddingContext';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import FormPageLayout from '../../../components/layouts/FormPageLayout';
import type { Gift } from '../../../types';

export default function NewGiftPage() {
  const router = useRouter();
  const { addNewGift } = useWedding();
  
  const [fromPerson, setFromPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!fromPerson.trim()) newErrors.fromPerson = 'Name is required';
    if (!amount.trim()) newErrors.amount = 'Amount is required';
    else if (Number.isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const giftData: Omit<Gift, 'id' | 'allocations'> = {
        fromPerson,
        amount: Number.parseFloat(amount),
        date: date || new Date().toISOString(),
        notes: notes || undefined
      };
      
      await addNewGift(giftData);
      router.push('/gifts');
    } catch (error) {
      console.error('Error adding gift:', error);
      setErrors(prev => ({ ...prev, form: 'Failed to add gift' }));
    }
  };

  return (
    <FormPageLayout
      title="Add New Gift"
      backLink="/gifts"
      backLinkText="Back to Gifts"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.form}
          </div>
        )}
        
        <Input
          label="From Person"
          id="fromPerson"
          value={fromPerson}
          onChange={(e) => setFromPerson(e.target.value)}
          error={errors.fromPerson}
          required
          placeholder="Enter name of gift giver"
        />
        
        <Input
          label="Amount"
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          required
          placeholder="0.00"
        />
        
        <Input
          label="Date Received"
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        
        <Textarea
          label="Notes"
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any additional details about the gift"
        />
        
        <div className="flex justify-end pt-4">
          <Button type="submit">Save Gift</Button>
        </div>
      </form>
    </FormPageLayout>
  );
} 