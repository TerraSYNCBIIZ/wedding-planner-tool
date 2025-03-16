'use client';

import React, { useState, useEffect } from 'react';

interface BasicInfoStepProps {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
  handleNext: () => void;
  isSubmitting: boolean;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ 
  formData, 
  updateFormData,
  handleNext,
  isSubmitting
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Extract form values from formData
  const weddingDate = formData.weddingDate as string || '';
  const person1Name = formData.person1Name as string || '';
  const person2Name = formData.person2Name as string || '';
  const location = formData.location as string || '';

  // Check if form is valid for enabling the next button
  const isFormValid = Boolean(weddingDate && person1Name && person2Name);

  // Custom next handler with validation
  const handleNextWithValidation = () => {
    const newErrors: Record<string, string> = {};
    
    if (!weddingDate) newErrors.weddingDate = 'Wedding date is required';
    if (!person1Name) newErrors.person1Name = 'Name is required';
    if (!person2Name) newErrors.person2Name = 'Name is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      handleNext();
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Tell us about your wedding</h3>
      
      <div className="space-y-6">
        <div>
          <label htmlFor="weddingDate" className="block text-sm font-medium text-gray-700 mb-1">
            When is your wedding date?
          </label>
          <input
            type="date"
            id="weddingDate"
            value={weddingDate}
            onChange={(e) => updateFormData('weddingDate', e.target.value)}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm
              ${errors.weddingDate ? 'border-red-300' : 'border-gray-300'}`}
          />
          {errors.weddingDate && (
            <p className="mt-2 text-sm text-red-600">{errors.weddingDate}</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="person1Name" className="block text-sm font-medium text-gray-700 mb-1">
              Partner 1's Name
            </label>
            <input
              type="text"
              id="person1Name"
              value={person1Name}
              onChange={(e) => updateFormData('person1Name', e.target.value)}
              placeholder="First & Last name"
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm
                ${errors.person1Name ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.person1Name && (
              <p className="mt-2 text-sm text-red-600">{errors.person1Name}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="person2Name" className="block text-sm font-medium text-gray-700 mb-1">
              Partner 2's Name
            </label>
            <input
              type="text"
              id="person2Name"
              value={person2Name}
              onChange={(e) => updateFormData('person2Name', e.target.value)}
              placeholder="First & Last name"
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm
                ${errors.person2Name ? 'border-red-300' : 'border-gray-300'}`}
            />
            {errors.person2Name && (
              <p className="mt-2 text-sm text-red-600">{errors.person2Name}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Wedding Location (optional)
          </label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => updateFormData('location', e.target.value)}
            placeholder="City, Country or Venue name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="pt-5">
          <button
            type="button"
            onClick={handleNextWithValidation}
            disabled={isSubmitting || !isFormValid}
            className={`inline-flex justify-center w-full py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
              ${isFormValid ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}; 