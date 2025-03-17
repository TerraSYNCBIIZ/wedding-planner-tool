import React, { useState } from 'react';
import { useWedding } from '@/context/WeddingContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { ExpenseCategory } from '@/types';

// Predefined categories that cannot be removed
const PREDEFINED_CATEGORIES: ExpenseCategory[] = [
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

export function CategoryManager() {
  const { customCategories, addNewCategory, removeCategory } = useWedding();
  const [isOpen, setIsOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');
  
  // All categories (predefined + custom)
  const allCategories = [
    ...PREDEFINED_CATEGORIES,
    ...customCategories.map(cc => cc.name as ExpenseCategory)
  ];
  
  const handleAddCategory = () => {
    // Validation
    if (!newCategory.trim()) {
      setError('Category name cannot be empty');
      return;
    }
    
    // Check for duplicates (case insensitive)
    if (allCategories.some(cat => cat.toLowerCase() === newCategory.toLowerCase())) {
      setError('This category already exists');
      return;
    }
    
    // Add new category
    addNewCategory(newCategory.trim());
    setNewCategory('');
    setError('');
  };
  
  const handleRemoveCategory = (categoryId: string) => {
    removeCategory(categoryId);
  };
  
  if (!isOpen) {
    return (
      <div className="mt-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsOpen(true)}
        >
          Manage Categories
        </Button>
      </div>
    );
  }
  
  return (
    <div className="mt-6 p-4 bg-card rounded-lg border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Manage Categories</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsOpen(false)}
        >
          Close
        </Button>
      </div>
      
      {/* Add new category */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Add Custom Category</h4>
        <div className="flex gap-2">
          <div className="flex-grow">
            <Input
              type="text"
              placeholder="Enter new category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
          <Button onClick={handleAddCategory}>Add</Button>
        </div>
      </div>
      
      {/* Category list */}
      <div>
        <h4 className="text-sm font-medium mb-2">All Categories</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Predefined categories */}
          {PREDEFINED_CATEGORIES.map(category => (
            <div 
              key={category}
              className="flex justify-between items-center p-2 bg-muted rounded"
            >
              <span className="capitalize">{category}</span>
              <span className="text-xs text-muted-foreground">(Default)</span>
            </div>
          ))}
          
          {/* Custom categories */}
          {customCategories.map(category => (
            <div 
              key={category.id}
              className="flex justify-between items-center p-2 bg-muted rounded"
            >
              <span className="capitalize">{category.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCategory(category.id)}
                title="Remove category"
              >
                ✕
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 