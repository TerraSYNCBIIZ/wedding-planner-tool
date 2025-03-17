'use client';

import type React from 'react';
import { createContext, useContext, useState } from 'react';

// Types for the toast component
type ToastVariant = 'default' | 'destructive' | 'success';

interface ToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (props: ToastProps) => void;
}

// Create toast context
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Toast component
export function Toast({ 
  title, 
  description, 
  variant = 'default',
  onClose 
}: ToastProps & { onClose: () => void }) {
  const bgColor = 
    variant === 'success' ? 'bg-green-100 border-green-500' : 
    variant === 'destructive' ? 'bg-red-100 border-red-500' : 
    'bg-blue-100 border-blue-500';
  
  const textColor = 
    variant === 'success' ? 'text-green-800' : 
    variant === 'destructive' ? 'text-red-800' : 
    'text-blue-800';

  return (
    <div className={`fixed top-4 right-4 max-w-md border-l-4 ${bgColor} p-4 shadow-md rounded z-50 animate-in fade-in slide-in-from-top-1`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
          {description && (
            <p className={`mt-1 text-sm ${textColor} opacity-90`}>{description}</p>
          )}
        </div>
        <button
          type="button"
          className={`ml-4 ${textColor} opacity-70 hover:opacity-100`}
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const showToast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    const toast = { ...props, id };
    setToasts((prev) => [...prev, toast]);

    // Auto dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, props.duration || 5000);
  };

  const closeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <Toast 
            key={toast.id}
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            onClose={() => closeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
}; 