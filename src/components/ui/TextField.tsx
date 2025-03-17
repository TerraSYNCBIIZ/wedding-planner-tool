import React from 'react';
import { Input } from './Input';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({ label, error, className, ...props }: TextFieldProps) {
  const id = React.useId();
  
  return (
    <div className="space-y-1">
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Input
        id={id}
        className={className}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
} 