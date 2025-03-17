'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { TextareaField } from '@/components/ui/TextareaField';
import { SelectField } from '@/components/ui/SelectField';
import { Slider } from '@/components/ui/Slider';
import { useWedding } from '@/context/WeddingContext';
import { useToast } from '@/components/ui/toast';
import { calculateRemainingAmount } from '@/lib/excel-utils';
import { formatCurrency } from '@/lib/excel-utils';
import type { Expense, Contributor, PaymentAllocation, ContributorGift } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/AlertDialog';
import { CreditCard, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export function PaymentDialog({ isOpen, onClose, expense }: PaymentDialogProps) {
  const { addPaymentToExpense, addGiftToContributor, contributors, expenses } = useWedding();
  const { toast } = useToast();
  
  // Early return if no expense is provided
  if (!expense) {
    return null;
  }
  
  // Form state
  const [contributorId, setContributorId] = useState('');
  const [amount, setAmount] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Alert dialog state
  const [showGiftConfirmation, setShowGiftConfirmation] = useState(false);
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);
  const [paymentData, setPaymentData] = useState<Omit<PaymentAllocation, 'id'> | null>(null);
  
  // Calculate the remaining amount for this expense
  const remainingAmount = calculateRemainingAmount(expense);
  
  // Reset form when expense changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setContributorId('');
      setAmount(remainingAmount.toString());
      setSliderValue(remainingAmount);
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [isOpen, remainingAmount]);
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    setSliderValue(newValue);
    setAmount(newValue.toString());
  };
  
  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setAmount(newValue);
    
    // Update slider if value is a valid number
    const numValue = Number.parseFloat(newValue);
    if (!Number.isNaN(numValue) && numValue >= 0 && numValue <= expense.totalAmount) {
      setSliderValue(numValue);
    }
  };
  
  // Get contributor balance
  const getContributorBalance = (contributorId: string): number => {
    const contributor = contributors.find(c => c.id === contributorId);
    if (!contributor) return 0;
    
    // Calculate total gifts from this contributor
    const totalGifts = contributor.totalGiftAmount || 0;
    
    // Calculate total payments made by this contributor across ALL expenses
    const totalPayments = expenses
      .flatMap(exp => exp.paymentAllocations)
      .filter(payment => payment.contributorId === contributorId)
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    return totalGifts - totalPayments;
  };
  
  // Validate form
  const validateForm = (): boolean => {
    if (!contributorId) {
      toast({
        title: 'Contributor is required',
        description: 'Please select who is making this payment',
        variant: 'destructive',
      });
      return false;
    }
    
    const amountValue = Number.parseFloat(amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid positive amount',
        variant: 'destructive',
      });
      return false;
    }
    
    if (amountValue > expense.totalAmount) {
      toast({
        title: 'Amount too large',
        description: `The amount cannot exceed the total expense amount of ${formatCurrency(expense.totalAmount)}`,
        variant: 'destructive',
      });
      return false;
    }
    
    return true;
  };
  
  // Process payment
  const processPayment = async (data: Omit<PaymentAllocation, 'id'>) => {
    try {
      await addPaymentToExpense(expense.id, data);
      
      toast({
        title: 'Payment added',
        description: 'The payment has been successfully recorded',
        variant: 'success',
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Failed to add payment',
        description: 'There was an error recording the payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const amountValue = Number.parseFloat(amount);
    
    // Create payment data
    const data: Omit<PaymentAllocation, 'id'> = {
      contributorId,
      amount: amountValue,
      date,
      notes: notes.trim() || undefined,
    };
    
    // Check if contributor has enough balance
    const contributorBalance = getContributorBalance(contributorId);
    
    if (amountValue > contributorBalance) {
      // Show balance warning
      setPaymentData(data);
      setShowBalanceWarning(true);
      return;
    }
    
    setIsSubmitting(true);
    await processPayment(data);
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
  
  // Handle proceeding with payment despite balance warning
  const handleProceedWithPayment = () => {
    if (!paymentData) return;
    
    setShowBalanceWarning(false);
    setShowGiftConfirmation(true);
  };
  
  // Handle direct payment (without creating a gift)
  const handleDirectPayment = async () => {
    if (!paymentData) return;
    
    setShowBalanceWarning(false);
    setIsSubmitting(true);
    await processPayment(paymentData);
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Make a Payment
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Expense details */}
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-blue-800 mb-2">{expense.title}</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(expense.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Remaining:</span>
                  <span className="font-medium text-amber-600">{formatCurrency(remainingAmount)}</span>
                </div>
                {expense.dueDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Due Date:</span>
                    <span className="font-medium">{new Date(expense.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              <SelectField
                label="Contributor"
                value={contributorId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setContributorId(e.target.value)}
                required
              >
                <option value="">Select who is making this payment</option>
                {contributors.map((contributor) => {
                  const balance = getContributorBalance(contributor.id);
                  return (
                    <option key={contributor.id} value={contributor.id}>
                      {contributor.name} {balance > 0 ? `(Available: ${formatCurrency(balance)})` : ''}
                    </option>
                  );
                })}
              </SelectField>
              
              {contributorId && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">Available Balance:</span>
                    <span className={`font-medium ${getContributorBalance(contributorId) > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {formatCurrency(getContributorBalance(contributorId))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    This is the remaining balance from gifts that can be applied to expenses.
                  </p>
                </div>
              )}
              
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
                valueDisplay={`${formatCurrency(sliderValue)}`}
                value={[sliderValue]}
                max={expense.totalAmount}
                step={0.01}
                onValueChange={handleSliderChange}
              />
              
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>$0</span>
                <span>Remaining: {formatCurrency(remainingAmount)}</span>
                <span>Total: {formatCurrency(expense.totalAmount)}</span>
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
                {isSubmitting ? 'Processing...' : 'Make Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Balance Warning Dialog */}
      <AlertDialog open={showBalanceWarning} onOpenChange={setShowBalanceWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Insufficient Balance
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const contributor = contributors.find(c => c.id === contributorId);
                const balance = getContributorBalance(contributorId);
                const amountValue = Number.parseFloat(amount);
                
                return (
                  <div className="space-y-3 py-2">
                    <p>
                      {contributor?.name} has an available balance of {formatCurrency(balance)}, but you're trying to make a payment of {formatCurrency(amountValue)}.
                    </p>
                    <p>How would you like to proceed?</p>
                    
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800 text-sm">
                      <p className="font-medium">Options:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Create a new gift record for this amount and apply it to this expense</li>
                        <li>Proceed with the payment without creating a gift (direct payment)</li>
                        <li>Cancel and adjust the payment amount</li>
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowBalanceWarning(false)}>
              Cancel
            </AlertDialogCancel>
            <Button 
              variant="outline" 
              onClick={handleDirectPayment}
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              Direct Payment
            </Button>
            <AlertDialogAction onClick={handleProceedWithPayment}>
              Create Gift & Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Gift Creation Confirmation Dialog */}
      <AlertDialog open={showGiftConfirmation} onOpenChange={setShowGiftConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Create Gift & Apply
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const contributor = contributors.find(c => c.id === contributorId);
                const amountValue = paymentData?.amount || 0;
                
                return (
                  <div className="space-y-3 py-2">
                    <p>
                      This will create a gift record of {formatCurrency(amountValue)} from {contributor?.name} and apply it to the expense "{expense.title}".
                    </p>
                    
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-green-800 text-sm">
                      <p>
                        This is useful when someone contributes money specifically for this expense.
                        The gift will be recorded and automatically allocated to this expense.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowGiftConfirmation(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateGiftAndPayment}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 