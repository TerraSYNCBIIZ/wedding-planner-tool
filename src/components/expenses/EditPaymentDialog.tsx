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
import { format } from 'date-fns';
import { calculateRemainingAmount } from '@/lib/excel-utils';
import type { Expense, PaymentAllocation, Contributor } from '@/types';

interface EditPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentAllocation;
  expense: Expense;
  contributors: Contributor[];
}

export function EditPaymentDialog({
  isOpen,
  onClose,
  payment,
  expense,
  contributors
}: EditPaymentDialogProps) {
  const { updatePaymentAllocation, removePaymentFromExpense } = useWedding();
  const { toast } = useToast();
  const [contributorId, setContributorId] = useState(payment.contributorId);
  
  // Create state for amount and slider
  const [amount, setAmount] = useState(payment.amount.toString());
  const [sliderValue, setSliderValue] = useState(payment.amount);
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState(payment.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Calculate the remaining amount (including the current payment)
  const remainingAmount = calculateRemainingAmount(expense) + payment.amount;

  // Initialize values when payment changes
  useEffect(() => {
    setContributorId(payment.contributorId);
    setAmount(payment.amount.toString());
    setSliderValue(payment.amount);
    setNotes(payment.notes || '');
    
    if (payment.date) {
      setDate(format(new Date(payment.date), 'yyyy-MM-dd'));
    }
  }, [payment]);

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

    // Check if amount is greater than remaining (accounting for the current payment)
    if (amountValue > remainingAmount) {
      const confirmOverpay = window.confirm(
        `The amount entered (${amountValue.toFixed(2)}) is more than the remaining amount for this expense. Do you want to continue?`
      );
      if (!confirmOverpay) {
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Create update data with required fields
      const updateData: Partial<PaymentAllocation> = {
        contributorId,
        amount: amountValue,
      };

      // Only add optional fields if they have values
      if (date) {
        updateData.date = date;
      }

      const trimmedNotes = notes.trim();
      if (trimmedNotes) {
        updateData.notes = trimmedNotes;
      }

      // Update payment
      await updatePaymentAllocation(expense.id, payment.id, updateData);

      toast({
        title: 'Payment updated',
        description: 'The payment has been successfully updated',
        variant: 'success',
      });

      onClose();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: 'Failed to update payment',
        description: 'There was an error updating the payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await removePaymentFromExpense(expense.id, payment.id);
      
      toast({
        title: 'Payment deleted',
        description: 'The payment has been successfully removed',
        variant: 'success',
      });
      
      onClose();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast({
        title: 'Failed to delete payment',
        description: 'There was an error deleting the payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{showDeleteConfirm ? 'Confirm Delete' : 'Edit Payment'}</DialogTitle>
        </DialogHeader>
        
        {!showDeleteConfirm ? (
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
                <span>Original: ${payment.amount.toFixed(2)}</span>
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

            <div className="flex justify-between items-center mt-6">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                Delete
              </Button>
              <div className="flex space-x-2">
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
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="py-4">
            <p className="mb-4">
              Are you sure you want to delete this payment? This action cannot be undone.
            </p>
            <p className="font-medium mb-6">
              Payment of {Number.parseFloat(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 