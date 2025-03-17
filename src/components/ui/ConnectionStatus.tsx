'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { AlertCircle, CheckCircle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
  showIcon?: boolean;
  variant?: 'default' | 'minimal' | 'pill';
}

export function ConnectionStatus({
  className,
  showText = true,
  showIcon = true,
  variant = 'default'
}: ConnectionStatusProps) {
  const { isOnline } = useWorkspace();
  const [visible, setVisible] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  
  // Show the status indicator when connection changes
  useEffect(() => {
    if (!isOnline) {
      // Show immediately when offline
      setVisible(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // When coming back online after being offline
      setVisible(true);
      // Hide after 5 seconds when back online
      const timer = setTimeout(() => {
        setVisible(false);
        setWasOffline(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);
  
  // Don't render anything if we're online and the status isn't visible
  if (isOnline && !visible && variant !== 'pill') {
    return null;
  }
  
  // Determine styles based on variant
  const containerClasses = cn(
    'transition-all duration-300 flex items-center gap-2',
    {
      'opacity-0': !visible && variant !== 'pill' && isOnline,
      'opacity-100': visible || variant === 'pill' || !isOnline,
      'py-1 px-3 rounded-full text-xs font-medium': variant === 'pill',
      'py-0.5 px-2 text-sm': variant === 'minimal',
      'py-1.5 px-3 rounded-md text-sm': variant === 'default',
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': isOnline && variant === 'pill',
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': !isOnline && variant === 'pill',
    },
    className
  );
  
  return (
    <div className={containerClasses} aria-live="polite">
      {showIcon && (
        isOnline ? (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400 animate-pulse" />
        )
      )}
      
      {showText && (
        <span>
          {isOnline ? 'Connected' : 'Offline - Changes may not sync'}
        </span>
      )}
    </div>
  );
} 