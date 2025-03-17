'use client';

import React, { useState } from 'react';

interface BudgetStepProps {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
  handleNext: () => void;
  isSubmitting: boolean;
}

export const BudgetStep: React.FC<BudgetStepProps> = ({ 
  formData, 
  updateFormData,
  handleNext,
  isSubmitting
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Extract form values
  const totalBudget = formData.totalBudget as number || 0;
  const currency = formData.currency as string || 'USD';
  
  // Common currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' },
    { value: 'JPY', label: 'JPY (¥)' },
  ];
  
  // Format currency value for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Handle budget change
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateFormData('totalBudget', value);
  };
  
  // Validate before proceeding
  const handleNextWithValidation = () => {
    const newErrors: Record<string, string> = {};
    
    if (totalBudget <= 0) {
      newErrors.totalBudget = 'Please enter a valid budget amount';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      handleNext();
    }
  };
  
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Let's set up your wedding budget</h3>
      
      <p className="text-gray-600 mb-6">
        Setting a budget will help you track expenses and payments throughout your wedding planning process.
        This information will be used to create your financial dashboard.
      </p>
      
      <div className="space-y-6">
        {/* Total Budget Input */}
        <div>
          <label htmlFor="totalBudget" className="block text-sm font-medium text-gray-700 mb-1">
            What's your estimated total wedding budget?
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                {currency === 'USD' ? '$' : 
                 currency === 'EUR' ? '€' : 
                 currency === 'GBP' ? '£' : 
                 currency === 'JPY' ? '¥' : 
                 currency === 'CAD' ? 'C$' : 
                 currency === 'AUD' ? 'A$' : '$'}
              </span>
            </div>
            <input
              type="number"
              id="totalBudget"
              min="0"
              value={totalBudget || ''}
              onChange={handleBudgetChange}
              className={`pl-8 block w-full rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
                ${errors.totalBudget ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="0"
            />
          </div>
          {errors.totalBudget && (
            <p className="mt-2 text-sm text-red-600">{errors.totalBudget}</p>
          )}
          
          {totalBudget > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Your budget: {formatCurrency(totalBudget)}
            </p>
          )}
        </div>
        
        {/* Currency Selector */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => updateFormData('currency', e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* How Budget Will Be Used */}
        <div className="bg-indigo-50 rounded-md p-4">
          <h4 className="font-medium text-indigo-700 mb-2">How your budget will be used:</h4>
          <ul className="space-y-2 text-sm text-indigo-800">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Displayed on your dashboard to track progress
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Compared with your actual expenses to show surplus/deficit
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Used to calculate remaining funds as expenses are added
            </li>
          </ul>
        </div>
        
        {/* Budget Tip */}
        <div className="bg-blue-50 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                Tip: You can always adjust your budget and add expense categories later.
              </p>
            </div>
          </div>
        </div>
        
        <div className="pt-5">
          <button
            type="button"
            onClick={handleNextWithValidation}
            disabled={isSubmitting}
            className="inline-flex justify-center w-full py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}; 