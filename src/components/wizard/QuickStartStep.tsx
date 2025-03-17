'use client';

import React, { useState } from 'react';
import { useWedding } from '@/context/WeddingContext';
import type { ExpenseCategory } from '@/types';

// Predefined expense categories to choose from
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

// Default important expense suggestions
const SUGGESTED_EXPENSES = [
  { title: 'Venue Deposit', category: 'venue' },
  { title: 'Catering Deposit', category: 'catering' },
  { title: 'Wedding Dress', category: 'attire' },
  { title: 'Photographer Deposit', category: 'photography' },
];

interface QuickStartStepProps {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
  handleNext: () => void;
  isSubmitting: boolean;
}

export const QuickStartStep: React.FC<QuickStartStepProps> = ({
  formData,
  updateFormData,
  handleNext,
  isSubmitting
}) => {
  const { addNewExpense, addNewContributor, customCategories } = useWedding();
  const [activeTab, setActiveTab] = useState<'expenses' | 'contributors'>('expenses');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Expense state
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory | ''>('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDueDate, setExpenseDueDate] = useState('');
  const [expenseProvider, setExpenseProvider] = useState('');
  
  // Format date for due date input (today as default)
  const today = new Date().toISOString().split('T')[0];

  // Contributor state
  const [contributorName, setContributorName] = useState('');
  const [contributorNotes, setContributorNotes] = useState('');
  
  // Track added items
  const [addedExpenses, setAddedExpenses] = useState<Array<{
    title: string;
    category: string;
    amount: number;
    dueDate?: string;
  }>>([]);
  
  const [addedContributors, setAddedContributors] = useState<Array<{
    name: string;
    notes?: string;
  }>>([]);
  
  // Combine predefined categories with custom categories
  const allCategories = [
    ...EXPENSE_CATEGORIES,
    ...(customCategories?.map(cc => cc.name as ExpenseCategory) || [])
  ];
  
  // Format currency based on formData
  const formatCurrency = (value: number): string => {
    const currency = formData.currency as string || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Handle adding an expense
  const handleAddExpense = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!expenseTitle.trim()) newErrors.expenseTitle = 'Title is required';
    if (!expenseCategory) newErrors.expenseCategory = 'Category is required';
    if (!expenseAmount.trim()) newErrors.expenseAmount = 'Amount is required';
    else if (Number.isNaN(Number.parseFloat(expenseAmount)) || Number.parseFloat(expenseAmount) <= 0) {
      newErrors.expenseAmount = 'Amount must be a positive number';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    const amount = Number.parseFloat(expenseAmount);
    
    try {
      await addNewExpense({
        title: expenseTitle.trim(),
        category: expenseCategory as ExpenseCategory,
        totalAmount: amount,
        dueDate: expenseDueDate || undefined,
        provider: expenseProvider.trim() || undefined,
        notes: `Added during setup wizard`,
      });
      
      // Add to local list to display
      setAddedExpenses(prev => [...prev, {
        title: expenseTitle.trim(),
        category: expenseCategory as string,
        amount,
        dueDate: expenseDueDate || undefined
      }]);
      
      // Clear form
      setExpenseTitle('');
      setExpenseCategory('');
      setExpenseAmount('');
      setExpenseDueDate('');
      setExpenseProvider('');
      
      // Store in form data for tracking
      updateFormData('setupExpenses', addedExpenses.length + 1);
      
    } catch (error) {
      console.error('Error adding expense:', error);
      setErrors({ general: 'Failed to add expense. Please try again.' });
    }
  };
  
  // Handle adding a contributor
  const handleAddContributor = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!contributorName.trim()) {
      newErrors.contributorName = 'Name is required';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    try {
      await addNewContributor(
        contributorName.trim(), 
        contributorNotes.trim() || undefined
      );
      
      // Add to local list to display
      setAddedContributors(prev => [...prev, {
        name: contributorName.trim(),
        notes: contributorNotes.trim() || undefined
      }]);
      
      // Clear form
      setContributorName('');
      setContributorNotes('');
      
      // Store in form data for tracking
      updateFormData('setupContributors', addedContributors.length + 1);
      
    } catch (error) {
      console.error('Error adding contributor:', error);
      setErrors({ general: 'Failed to add contributor. Please try again.' });
    }
  };
  
  // Handle selecting a suggested expense
  const handleSelectSuggestion = (suggestion: { title: string; category: string }) => {
    setExpenseTitle(suggestion.title);
    setExpenseCategory(suggestion.category as ExpenseCategory);
    setExpenseDueDate(today);
  };
  
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Start Your Wedding Planning</h3>
      
      <p className="text-gray-600 mb-6">
        Let's quickly get your wedding finances set up! Add your main expenses and contributors to start tracking right away.
      </p>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'expenses' 
              ? 'border-b-2 border-indigo-500 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('expenses')}
        >
          Key Expenses
        </button>
        <button
          type="button"
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'contributors' 
              ? 'border-b-2 border-indigo-500 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('contributors')}
        >
          Contributors
        </button>
      </div>
      
      {/* Error message */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          {errors.general}
        </div>
      )}
      
      {/* Expense Form */}
      {activeTab === 'expenses' && (
        <div>
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Add Key Expenses</h4>
            
            {/* Suggested expenses */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">Quick suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_EXPENSES.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100"
                  >
                    {suggestion.title}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Expense Title */}
              <div>
                <label htmlFor="expenseTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="expenseTitle"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className={`w-full p-2 border rounded-md ${errors.expenseTitle ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="e.g., Venue Deposit"
                />
                {errors.expenseTitle && (
                  <p className="mt-1 text-sm text-red-600">{errors.expenseTitle}</p>
                )}
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="expenseCategory"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className={`w-full p-2 border rounded-md ${errors.expenseCategory ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="">Select a category</option>
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                {errors.expenseCategory && (
                  <p className="mt-1 text-sm text-red-600">{errors.expenseCategory}</p>
                )}
              </div>
              
              {/* Amount */}
              <div>
                <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="expenseAmount"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className={`pl-7 w-full p-2 border rounded-md ${errors.expenseAmount ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.expenseAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.expenseAmount}</p>
                )}
              </div>
              
              {/* Due Date */}
              <div>
                <label htmlFor="expenseDueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  id="expenseDueDate"
                  value={expenseDueDate}
                  onChange={(e) => setExpenseDueDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min={today}
                />
              </div>
              
              {/* Provider */}
              <div className="md:col-span-2">
                <label htmlFor="expenseProvider" className="block text-sm font-medium text-gray-700 mb-1">
                  Provider/Vendor (Optional)
                </label>
                <input
                  type="text"
                  id="expenseProvider"
                  value={expenseProvider}
                  onChange={(e) => setExpenseProvider(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Grand Hotel"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <button
                type="button"
                onClick={handleAddExpense}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Expense
              </button>
            </div>
          </div>
          
          {/* Added expenses list */}
          {addedExpenses.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Added Expenses</h4>
              <ul className="divide-y divide-gray-200">
                {addedExpenses.map((expense, index) => (
                  <li key={index} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{expense.title}</p>
                        <p className="text-sm text-gray-500">
                          {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                          {expense.dueDate && ` • Due: ${new Date(expense.dueDate).toLocaleDateString()}`}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Contributors Form */}
      {activeTab === 'contributors' && (
        <div>
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Add Key Contributors</h4>
            <p className="text-sm text-gray-500 mb-4">
              Add people who will be contributing financially to your wedding (e.g., parents, relatives).
            </p>
            
            <div className="space-y-4">
              {/* Contributor Name */}
              <div>
                <label htmlFor="contributorName" className="block text-sm font-medium text-gray-700 mb-1">
                  Contributor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contributorName"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  className={`w-full p-2 border rounded-md ${errors.contributorName ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="e.g., John & Mary Smith"
                />
                {errors.contributorName && (
                  <p className="mt-1 text-sm text-red-600">{errors.contributorName}</p>
                )}
              </div>
              
              {/* Notes */}
              <div>
                <label htmlFor="contributorNotes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="contributorNotes"
                  value={contributorNotes}
                  onChange={(e) => setContributorNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Parents of the bride"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <button
                type="button"
                onClick={handleAddContributor}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Contributor
              </button>
            </div>
          </div>
          
          {/* Added contributors list */}
          {addedContributors.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3">Added Contributors</h4>
              <ul className="divide-y divide-gray-200">
                {addedContributors.map((contributor, index) => (
                  <li key={index} className="py-3">
                    <p className="font-medium">{contributor.name}</p>
                    {contributor.notes && (
                      <p className="text-sm text-gray-500">{contributor.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Continue Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            {(addedExpenses.length > 0 || addedContributors.length > 0) && (
              <p className="text-sm text-green-600">
                {addedExpenses.length > 0 && `${addedExpenses.length} expense${addedExpenses.length !== 1 ? 's' : ''} added. `}
                {addedContributors.length > 0 && `${addedContributors.length} contributor${addedContributors.length !== 1 ? 's' : ''} added.`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {(addedExpenses.length > 0 || addedContributors.length > 0) ? "Continue" : "Skip for Now"}
          </button>
        </div>
      </div>
    </div>
  );
}; 