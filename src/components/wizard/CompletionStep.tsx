'use client';

import React from 'react';
import { useWedding } from '@/context/WeddingContext';

interface CompletionStepProps {
  formData: Record<string, unknown>;
  isSubmitting: boolean;
  handleNext: () => void;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({ 
  formData, 
  isSubmitting,
  handleNext
}) => {
  const { expenses, contributors } = useWedding();
  const person1Name = formData.person1Name as string || '';
  const person2Name = formData.person2Name as string || '';
  const weddingDate = formData.weddingDate as string || '';
  const location = formData.location as string || 'Not specified';
  const totalBudget = formData.totalBudget as number || 0;
  const currency = formData.currency as string || 'USD';
  const setupExpenses = formData.setupExpenses as number || 0;
  const setupContributors = formData.setupContributors as number || 0;
  
  // Format the wedding date for display
  const formattedDate = weddingDate 
    ? new Date(weddingDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Not set';
  
  // Format the budget for display
  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalBudget);
  
  return (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to go!</h3>
      
      <p className="text-gray-600 mb-6">
        Your wedding planner is ready to use. Here's a summary of what's been set up:
      </p>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-6 mx-auto max-w-md text-left">
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Couple</dt>
            <dd className="mt-1 text-sm text-gray-900">{person1Name} & {person2Name}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Wedding Date</dt>
            <dd className="mt-1 text-sm text-gray-900">{formattedDate}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Location</dt>
            <dd className="mt-1 text-sm text-gray-900">{location}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-gray-500">Budget</dt>
            <dd className="mt-1 text-sm text-gray-900">{formattedBudget}</dd>
          </div>
        </dl>
      </div>
      
      {/* Show what was created during setup */}
      {(setupExpenses > 0 || setupContributors > 0) && (
        <div className="bg-blue-50 rounded-lg p-6 mb-6 mx-auto max-w-md text-left border border-blue-100">
          <h4 className="font-medium text-blue-800 mb-3">Created during setup:</h4>
          <ul className="space-y-2">
            {setupExpenses > 0 && (
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <span className="font-medium">{setupExpenses} expense{setupExpenses !== 1 ? 's' : ''}</span>
                  <span className="text-blue-700"> added to your expense tracker</span>
                </span>
              </li>
            )}
            
            {setupContributors > 0 && (
              <li className="flex items-start">
                <svg className="h-5 w-5 text-blue-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <span className="font-medium">{setupContributors} contributor{setupContributors !== 1 ? 's' : ''}</span> 
                  <span className="text-blue-700"> set up for contribution tracking</span>
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
      
      <div className="rounded-lg p-6 mb-6 mx-auto max-w-md text-left border border-gray-200 bg-white">
        <h4 className="font-medium text-gray-800 mb-3">Next steps:</h4>
        <ul className="space-y-3">
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 mt-1 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-indigo-100"></div>
              <span className="text-sm font-medium text-indigo-600">1</span>
            </div>
            <span className="ml-3 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Add more expenses</span> to track your wedding budget
            </span>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 mt-1 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-indigo-100"></div>
              <span className="text-sm font-medium text-indigo-600">2</span>
            </div>
            <span className="ml-3 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Record contributors</span> and their gifts to manage finances
            </span>
          </li>
          <li className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 mt-1 relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-indigo-100"></div>
              <span className="text-sm font-medium text-indigo-600">3</span>
            </div>
            <span className="ml-3 text-sm text-gray-600">
              <span className="font-medium text-gray-900">Track payments</span> to keep on top of what's been paid
            </span>
          </li>
        </ul>
      </div>
      
      <button
        type="button"
        onClick={handleNext}
        disabled={isSubmitting}
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Go to Dashboard
        {isSubmitting && (
          <svg className="ml-2 -mr-1 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </button>
    </div>
  );
}; 