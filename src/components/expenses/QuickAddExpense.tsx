import { useState, type FormEvent } from 'react';
import { useWedding } from '@/context/WeddingContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Expense, ExpenseCategory } from '@/types';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'venue',
  'catering',
  'photography',
  'videography',
  'flowers',
  'music',
  'attire',
  'transportation',
  'decor',
  'stationery',
  'rings',
  'gifts',
  'accommodation',
  'beauty',
  'other',
];

export function QuickAddExpense() {
  const { addNewExpense, customCategories } = useWedding();
  
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [provider, setProvider] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Combine predefined categories with custom categories
  const allCategories = [
    ...EXPENSE_CATEGORIES,
    ...customCategories.map(cc => cc.name as ExpenseCategory)
  ];
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!category) newErrors.category = 'Category is required';
    if (!amount.trim()) newErrors.amount = 'Amount is required';
    else if (Number.isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Create the expense object with required fields
    const expenseData: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'paymentAllocations'>> = {
      title,
      category: category as ExpenseCategory,
      totalAmount: Number.parseFloat(amount),
    };
    
    // Only add optional fields if they have value
    if (dueDate) expenseData.dueDate = dueDate;
    if (provider) expenseData.provider = provider;
    if (notes) expenseData.notes = notes;
    
    // Add the expense
    addNewExpense(expenseData as Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'paymentAllocations'>);
    
    // Reset form
    setTitle('');
    setCategory('');
    setAmount('');
    setDueDate('');
    setProvider('');
    setNotes('');
    setIsOpen(false);
  };
  
  if (!isOpen) {
    return (
      <div className="p-4 bg-muted rounded-lg border border-dashed text-center">
        <p className="text-muted-foreground mb-3">Add a new expense</p>
        <Button onClick={() => setIsOpen(true)}>Add Expense</Button>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-card rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Add New Expense</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsOpen(false)}
        >
          Cancel
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="quick-title" className="block text-sm font-medium mb-1">
            Expense Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="quick-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Venue Deposit"
            required
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>
        
        <div>
          <label htmlFor="quick-category" className="block text-sm font-medium mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="quick-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">Select a category</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
        </div>
        
        <div>
          <label htmlFor="quick-amount" className="block text-sm font-medium mb-1">
            Amount <span className="text-red-500">*</span>
          </label>
          <Input
            id="quick-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>
        
        <div>
          <label htmlFor="quick-duedate" className="block text-sm font-medium mb-1">
            Due Date
          </label>
          <Input
            id="quick-duedate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="quick-provider" className="block text-sm font-medium mb-1">
            Provider/Vendor
          </label>
          <Input
            id="quick-provider"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g., Vendor name"
          />
        </div>
        
        <div>
          <label htmlFor="quick-notes" className="block text-sm font-medium mb-1">
            Notes
          </label>
          <textarea
            id="quick-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full p-2 border rounded-md"
            placeholder="Additional details about this expense"
          />
        </div>
        
        <div className="pt-2">
          <Button type="submit" className="w-full">Save Expense</Button>
        </div>
      </form>
    </div>
  );
} 