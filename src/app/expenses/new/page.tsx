'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWedding } from '../../../context/WeddingContext';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import FormPageLayout from '../../../components/layouts/FormPageLayout';
import type { ExpenseCategory } from '../../../types';

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
  const { addNewExpense } = useWedding();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [provider, setProvider] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Expense Title"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors.title}
          required
        />
        
        <Select
          label="Category"
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          error={errors.category}
          options={EXPENSE_CATEGORIES.map(cat => ({
            value: cat,
            label: cat.charAt(0).toUpperCase() + cat.slice(1)
          }))}
          required
        >
          <option value="">Select a category</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </Select>
        
        <Textarea
          label="Description"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        
        <Input
          label="Total Amount"
          id="totalAmount"
          type="number"
          step="0.01"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          error={errors.totalAmount}
          required
        />
        
        <Input
          label="Due Date"
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        
        <Input
          label="Provider/Vendor"
          id="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        />
        
        <div className="flex justify-end pt-4">
          <Button type="submit">Save Expense</Button>
        </div>
      </form>
    </FormPageLayout>
  );
} 