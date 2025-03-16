'use client';

import React, { useState, ReactNode, FC } from 'react';

interface WizardStep {
  key: string;
  title: string;
  subtitle?: string;
  component: React.ComponentType<StepProps> | ReactNode;
}

interface StepProps {
  formData: Record<string, unknown>;
  updateFormData: (key: string, value: unknown) => void;
  isSubmitting: boolean;
  handleNext: () => void;
  handleBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

interface WizardLayoutProps {
  steps: WizardStep[];
  onComplete: (allData: Record<string, unknown>) => void | Promise<void>;
  initialData?: Record<string, unknown>;
}

export const WizardLayout: FC<WizardLayoutProps> = ({ 
  steps, 
  onComplete, 
  initialData = {} 
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  
  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };
  
  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };
  
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(formData);
    } catch (error) {
      console.error('Error completing wizard:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateFormData = (key: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      {/* Header with progress indicators */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 py-6 px-8 text-white">
        <h2 className="text-2xl font-bold">{currentStep.title}</h2>
        {currentStep.subtitle && (
          <p className="mt-1 text-blue-100">{currentStep.subtitle}</p>
        )}
        
        {/* Progress indicators */}
        <div className="flex items-center mt-4 space-x-2">
          {steps.map((step, idx) => (
            <div 
              key={step.key}
              className={`h-3 w-3 rounded-full transition-all duration-300 ${
                idx < currentStepIndex 
                  ? 'bg-white' 
                  : idx === currentStepIndex 
                    ? 'bg-white ring-4 ring-white/30' 
                    : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Content area */}
      <div className="p-8">
        <div className="mb-8">
          {/* Pass the form data and update function to each step component */}
          {React.isValidElement(currentStep.component) ? (
            currentStep.component
          ) : (
            // If it's a component type, render it with the props
            typeof currentStep.component === 'function' && (
              React.createElement(currentStep.component as React.ComponentType<StepProps>, {
                formData, 
                updateFormData,
                isSubmitting,
                handleNext,
                handleBack,
                isFirstStep,
                isLastStep
              })
            )
          )}
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={isFirstStep || isSubmitting}
            className={`px-4 py-2 rounded-md ${
              isFirstStep 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Back
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md ${
              isSubmitting 
                ? 'bg-indigo-300 cursor-wait' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white`}
          >
            {isLastStep ? 'Complete' : 'Next'}
            {isSubmitting && (
              <span className="ml-2 inline-block animate-spin">⟳</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 