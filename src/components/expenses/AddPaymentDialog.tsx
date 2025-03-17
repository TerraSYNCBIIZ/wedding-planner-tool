'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { TextareaField } from '../../components/ui/TextareaField';
import { SelectField } from '../../components/ui/SelectField';
import { Slider } from '../../components/ui/Slider';
import { useWedding } from '@/context/WeddingContext';
import { useToast } from '../../components/ui/toast';
import { calculateRemainingAmount } from '@/lib/excel-utils';
import type { Expense, Contributor, PaymentAllocation, ContributorGift } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/AlertDialog';

interface AddPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense;
  contributors: Contributor[];
}

export function AddPaymentDialog({
  isOpen,
  onClose,
  expense,
  contributors
}: AddPaymentDialogProps) {
  const { addPaymentToExpense, addGiftToContributor } = useWedding();
  const { toast } = useToast();
  const [contributorId, setContributorId] = useState('');
  
  // Calculate remaining amount
  const remainingAmount = calculateRemainingAmount(expense);
  
  // Initialize amount with remaining amount
  const [amount, setAmount] = useState('');
  const [sliderValue, setSliderValue] = useState(remainingAmount);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for gift creation confirmation
  const [showGiftConfirmation, setShowGiftConfirmation] = useState(false);
  const [paymentData, setPaymentData] = useState<Omit<PaymentAllocation, 'id'> | null>(null);

  // Update amount value when dialog opens
  useEffect(() => {
    if (isOpen) {
      setAmount(remainingAmount.toString());
      setSliderValue(remainingAmount);
      // Set today's date as default
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    }
  }, [isOpen, remainingAmount]);

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    setSliderValue(newValue);
    setAmount(newValue.toString());
  };

  // Handle input field change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setAmount(newValue);
    // Update slider if value is a valid number
    const numValue = Number.parseFloat(newValue);
    if (!Number.isNaN(numValue) && numValue >= 0 && numValue <= expense.totalAmount) {
      setSliderValue(numValue);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setContributorId('');
    setAmount('');
    setSliderValue(0);
    setDate('');
    setNotes('');
    setShowGiftConfirmation(false);
    setPaymentData(null);
  };

  // Check if contributor has a gift record
  const checkContributorGift = (contributorId: string): boolean => {
    const contributor = contributors.find(c => c.id === contributorId);
    return !!(contributor?.gifts && contributor.gifts.length > 0);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!contributorId) {
      toast({
        title: 'Contributor is required',
        variant: 'destructive',
      });
      return;
    }

    const amountValue = Number.parseFloat(amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid positive amount',
        variant: 'destructive',
      });
      return;
    }

    // Check if amount is greater than remaining
    if (amountValue > remainingAmount) {
      const confirmOverpay = window.confirm(
        `The amount entered (${amountValue.toFixed(2)}) is more than the remaining amount (${remainingAmount.toFixed(2)}). Do you want to continue?`
      );
      if (!confirmOverpay) {
        return;
      }
    }

    // Create payment data with required fields
    const paymentData: Partial<Omit<PaymentAllocation, 'id'>> = {
      contributorId,
      amount: amountValue,
    };

    // Only add optional fields if they have values
    if (date) {
      paymentData.date = date;
    }

    const trimmedNotes = notes.trim();
    if (trimmedNotes) {
      paymentData.notes = trimmedNotes;
    }

    // Check if contributor has a gift record
    const hasGiftRecord = checkContributorGift(contributorId);
    
    if (!hasGiftRecord) {
      // Store payment data for later use
      setPaymentData(paymentData as Omit<PaymentAllocation, 'id'>);
      // Show confirmation dialog
      setShowGiftConfirmation(true);
    } else {
      // Proceed with adding payment
      await processPayment(paymentData as Omit<PaymentAllocation, 'id'>);
    }
  };

  // Process payment after confirmation
  const processPayment = async (paymentData: Omit<PaymentAllocation, 'id'>) => {
    try {
      setIsSubmitting(true);
      
      // Add payment to expense
      await addPaymentToExpense(expense.id, paymentData);

      toast({
        title: 'Payment added',
        description: 'The payment has been successfully added to the expense',
        variant: 'success',
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Failed to add payment',
        description: 'There was an error adding the payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle creating a gift and then adding payment
  const handleCreateGiftAndPayment = async () => {
    if (!paymentData) return;
    
    try {
      setIsSubmitting(true);
      
      // Get contributor name
      const contributor = contributors.find(c => c.id === contributorId);
      if (!contributor) {
        throw new Error('Contributor not found');
      }
      
      // Create gift data
      const giftData: Omit<ContributorGift, 'id' | 'contributorId' | 'allocations'> = {
        amount: paymentData.amount,
        date: paymentData.date || new Date().toISOString().split('T')[0],
        notes: paymentData.notes || `Gift for ${expense.title}`
      };
      
      // Create allocation for this expense
      const allocations = [{
        expenseId: expense.id,
        amount: paymentData.amount
      }];
      
      // Add gift to contributor with allocation to this expense
      await addGiftToContributor(contributorId, giftData, allocations);
      
      toast({
        title: 'Gift and payment added',
        description: `A gift record was created for ${contributor.name} and allocated to this expense.`,
        variant: 'success',
      });
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating gift and payment:', error);
      toast({
        title: 'Failed to create gift and payment',
        description: 'There was an error creating the gift record. Please try again.',
        variant: 'destructive',
      });
      
      // Try to add just the payment as fallback
      try {
        await processPayment(paymentData);
      } catch (paymentError) {
        console.error('Error adding payment as fallback:', paymentError);
      }
    } finally {
      setIsSubmitting(false);
      setShowGiftConfirmation(false);
    }
  };

  // Handle just adding payment without creating gift
  const handleJustAddPayment = async () => {
    if (!paymentData) return;
    setShowGiftConfirmation(false);
    await processPayment(paymentData);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <SelectField
                label="Contributor"
                value={contributorId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setContributorId(e.target.value)}
                required
              >
                <option value="">Select who made this payment</option>
                {contributors.map((contributor) => (
                  <option key={contributor.id} value={contributor.id}>
                    {contributor.name}
                  </option>
                ))}
              </SelectField>

              <TextField
                label="Amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter payment amount"
                step="0.01"
                min="0.01"
                max={expense.totalAmount.toString()}
                required
              />

              {/* Slider for amount */}
              <Slider
                id="amount-slider"
                label="Adjust amount"
                valueDisplay={`$${sliderValue.toFixed(2)}`}
                value={[sliderValue]}
                max={expense.totalAmount}
                step={0.01}
                onValueChange={handleSliderChange}
              />

              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>$0</span>
                <span>Remaining: ${remainingAmount.toFixed(2)}</span>
                <span>Total: ${expense.totalAmount.toFixed(2)}</span>
              </div>

              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                required
              />

              <TextareaField
                label="Notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder="Add any notes about this payment"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gift Creation Confirmation Dialog */}
      <AlertDialog open={showGiftConfirmation} onOpenChange={setShowGiftConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Gift Record?</AlertDialogTitle>
            <AlertDialogDescription>
              {contributors.find(c => c.id === contributorId)?.name} doesn't have any gift records yet. 
              Would you like to create a gift record for this payment? 
              
              <p className="mt-2">
                Creating a gift record helps track contributions and can be allocated to multiple expenses.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => handleJustAddPayment()}
              disabled={isSubmitting}
            >
              Just Add Payment
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleCreateGiftAndPayment()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Gift Record'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 