'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  const [stableStatus, setStableStatus] = useState(isOnline);
  const lastChangeTime = useRef<number>(Date.now());
  const connectionStabilityTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Stabilize the connection status to prevent flickering
  // Only update the displayed status after the connection has been stable for a period
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastChange = now - lastChangeTime.current;
    
    // If the connection state changes
    if (isOnline !== stableStatus) {
      // If going offline, show immediately
      if (!isOnline) {
        setStableStatus(false);
        setVisible(true);
        setWasOffline(true);
        lastChangeTime.current = now;
        
        // Clear any pending timers
        if (connectionStabilityTimer.current) {
          clearTimeout(connectionStabilityTimer.current);
          connectionStabilityTimer.current = null;
        }
      } 
      // If coming online, wait for stability
      else {
        // Only start a new timer if there isn't one already
        if (!connectionStabilityTimer.current) {
          // Wait for connection to be stable for 3 seconds before showing as online
          connectionStabilityTimer.current = setTimeout(() => {
            setStableStatus(true);
            setVisible(true);
            
            // Hide the "back online" notification after 5 seconds
            if (wasOffline) {
              setTimeout(() => {
                setVisible(false);
                setWasOffline(false);
              }, 5000);
            }
            
            connectionStabilityTimer.current = null;
          }, 3000);
          
          lastChangeTime.current = now;
        }
      }
    }
    
    return () => {
      if (connectionStabilityTimer.current) {
        clearTimeout(connectionStabilityTimer.current);
      }
    };
  }, [isOnline, stableStatus, wasOffline]);
  
  // Don't render anything if we're online and the status isn't visible
  if (stableStatus && !visible && variant !== 'pill') {
    return null;
  }
  
  // Determine styles based on variant
  const containerClasses = cn(
    'transition-all duration-300 flex items-center gap-2',
    {
      'opacity-0': !visible && variant !== 'pill' && stableStatus,
      'opacity-100': visible || variant === 'pill' || !stableStatus,
      'py-1 px-3 rounded-full text-xs font-medium': variant === 'pill',
      'py-0.5 px-2 text-sm': variant === 'minimal',
      'py-1.5 px-3 rounded-md text-sm': variant === 'default',
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': stableStatus && variant === 'pill',
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': !stableStatus && variant === 'pill',
    },
    className
  );
  
  return (
    <div className={containerClasses} aria-live="polite">
      {showIcon && (
        stableStatus ? (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400 animate-pulse" />
        )
      )}
      
      {showText && (
        <span>
          {stableStatus ? 'Connected' : 'Offline - Changes may not sync'}
        </span>
      )}
    </div>
  );
} 