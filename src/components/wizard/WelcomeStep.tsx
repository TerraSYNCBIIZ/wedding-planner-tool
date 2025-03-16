'use client';

import React from 'react';

interface WelcomeStepProps {
  handleNext: () => void;
  isSubmitting: boolean;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ 
  handleNext,
  isSubmitting
}) => {
  return (
    <div className="text-center">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Welcome to Your Wedding Planner</h3>
      
      <div className="mb-8">
        <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        
        <p className="text-gray-600 mb-4">
          Let's get started planning your perfect wedding day! This short wizard will help you set up
          your wedding planner with all the important details.
        </p>
        
        <p className="text-gray-600 mb-4">
          We'll collect some basic information about your wedding to help you keep track of:
        </p>
        
        <ul className="text-left max-w-md mx-auto space-y-2 mb-6">
          <li className="flex items-center text-gray-600">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Budget and expenses
          </li>
          <li className="flex items-center text-gray-600">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Gifts and contributions
          </li>
          <li className="flex items-center text-gray-600">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Important dates and deadlines
          </li>
          <li className="flex items-center text-gray-600">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Custom categories for your unique needs
          </li>
        </ul>
      </div>
      
      <button
        type="button"
        onClick={handleNext}
        disabled={isSubmitting}
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Let's Get Started
      </button>
    </div>
  );
}; 