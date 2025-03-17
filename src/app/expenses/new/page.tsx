'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWedding } from '../../../context/WeddingContext';
import { TextField } from '../../../components/ui/TextField';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import FormPageLayout from '../../../components/layouts/FormPageLayout';
import type { ExpenseCategory } from '../../../types';
import { CreditCard, Calendar, DollarSign, Building, FileText, Tag } from 'lucide-react';

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

export default function NewExpensePage() {
  const router = useRouter();
  const { addNewExpense, customCategories } = useWedding();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [provider, setProvider] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Combine predefined categories with custom categories
  const allCategories = [
    ...EXPENSE_CATEGORIES,
    ...customCategories?.map(cc => cc.name as ExpenseCategory) || []
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!category) newErrors.category = 'Category is required';
    if (!totalAmount.trim()) newErrors.totalAmount = 'Total amount is required';
    else if (Number.isNaN(Number.parseFloat(totalAmount)) || Number.parseFloat(totalAmount) <= 0) {
      newErrors.totalAmount = 'Amount must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    addNewExpense({
      title,
      category: category as ExpenseCategory,
      totalAmount: Number.parseFloat(totalAmount),
      dueDate: dueDate || undefined,
      provider: provider || undefined,
      notes: description || undefined,
    });
    
    router.push('/expenses');
  };

  return (
    <FormPageLayout
      title="Add New Expense"
      backLink="/expenses"
      backLinkText="Back to Expenses"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <TextField
              label="Expense Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              placeholder="e.g., Venue Deposit, Catering Payment"
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                error={errors.category}
                options={allCategories.map(cat => ({
                  value: cat,
                  label: cat.charAt(0).toUpperCase() + cat.slice(1)
                }))}
                required
              />
              
              <TextField
                label="Total Amount"
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                error={errors.totalAmount}
                placeholder="0.00"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Vendor Information Section */}
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h2 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2 text-green-600" />
            Vendor Information
          </h2>
          
          <div className="space-y-4">
            <TextField
              label="Provider/Vendor"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="e.g., Grand Hotel, Delicious Catering"
            />
            
            <TextField
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        
        {/* Additional Details Section */}
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <h2 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-purple-600" />
            Additional Details
          </h2>
          
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Add any notes or details about this expense..."
          />
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-between items-center pt-4">
          <Button 
            type="button" 
            onClick={() => router.push('/expenses')}
            variant="outline"
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Save Expense
          </Button>
        </div>
      </form>
    </FormPageLayout>
  );
} 