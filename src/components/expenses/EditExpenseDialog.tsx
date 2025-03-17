import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { TextareaField } from '../../components/ui/TextareaField';
import { SelectField } from '../../components/ui/SelectField';
import { updateExpense, deleteExpense } from '@/lib/firebase/expenses';
import { useToast } from '../../components/ui/toast';
import { format } from 'date-fns';
import type { Expense, ExpenseCategory } from '@/types';

interface EditExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export function EditExpenseDialog({ isOpen, onClose, expense }: EditExpenseDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('venue');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [provider, setProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load expense data when expense changes
  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setCategory(expense.category);
      setAmount(expense.totalAmount.toString());
      setDueDate(expense.dueDate ? format(new Date(expense.dueDate), 'yyyy-MM-dd') : '');
      setProvider(expense.provider || '');
      setNotes(expense.notes || '');
    }
  }, [expense]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    try {
      setIsSubmitting(true);

      // Create expense data object, only including defined values
      const expenseData: Partial<Expense> = {
        title,
        category,
        totalAmount: Number.parseFloat(amount),
      };

      // Only add optional fields if they have values
      if (dueDate) expenseData.dueDate = dueDate;
      if (provider.trim()) expenseData.provider = provider.trim();
      if (notes.trim()) expenseData.notes = notes.trim();

      // Update the expense
      await updateExpense(expense.id, expenseData);
      
      toast({
        title: 'Expense updated',
        description: 'The expense has been successfully updated.',
        variant: 'success',
      });
      
      onClose();
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: 'Failed to update expense',
        description: 'There was an error updating the expense. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!expense) return;

    try {
      setIsDeleting(true);
      await deleteExpense(expense.id);
      
      toast({
        title: 'Expense deleted',
        description: 'The expense has been permanently deleted.',
        variant: 'success',
      });
      
      onClose();
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: 'Failed to delete expense',
        description: 'There was an error deleting the expense. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{showDeleteConfirm ? 'Confirm Delete' : 'Edit Expense'}</DialogTitle>
        </DialogHeader>
        
        {!showDeleteConfirm ? (
          // Edit Form
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <TextField
                label="Title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="Enter expense title"
                required
              />
              
              <SelectField
                label="Category"
                value={category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as ExpenseCategory)}
                required
              >
                <option value="venue">Venue</option>
                <option value="catering">Catering</option>
                <option value="photography">Photography</option>
                <option value="entertainment">Entertainment</option>
                <option value="attire">Attire</option>
                <option value="decoration">Decoration</option>
                <option value="transportation">Transportation</option>
                <option value="stationery">Stationery</option>
                <option value="beauty">Beauty</option>
                <option value="gifts">Gifts</option>
                <option value="other">Other</option>
              </SelectField>
              
              <TextField
                label="Total Amount"
                type="number"
                value={amount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                placeholder="Enter total amount"
                step="0.01"
                min="0"
                required
              />
              
              <TextField
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
              />
              
              <TextField
                label="Provider"
                value={provider}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProvider(e.target.value)}
                placeholder="Enter service provider or vendor name"
              />
              
              <TextareaField
                label="Notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder="Add any notes about this expense"
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
                  {isSubmitting ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          // Delete Confirmation
          <div className="py-4">
            <p className="mb-4">
              Are you sure you want to delete this expense? This action cannot be undone.
            </p>
            <p className="font-medium mb-6">
              {title} - {Number.parseFloat(amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
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