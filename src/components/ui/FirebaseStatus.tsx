'use client';

import { useState, useEffect, useCallback } from 'react';
import { testFirestoreConnection } from '../../lib/test-firebase';

export function FirebaseStatus() {
  // Only render on client side
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Check connection function - use useCallback to memoize
  const checkConnection = useCallback(async () => {
    setStatus('loading');
    try {
      const isConnected = await testFirestoreConnection();
      setStatus(isConnected ? 'connected' : 'error');
    } catch (error) {
      console.error('Error checking Firestore connection:', error);
      setStatus('error');
    }
    setLastChecked(new Date().toLocaleTimeString());
  }, []);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);
    checkConnection();
    
    // Check connection every 5 minutes
    const interval = setInterval(checkConnection, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Don't render anything on server
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        type="button"
        onClick={checkConnection}
        className="flex items-center gap-2 bg-blue-50 py-1.5 px-3 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
        title={lastChecked ? `Last checked: ${lastChecked}` : 'Check Firestore connection'}
      >
        <div 
          className={`h-2.5 w-2.5 rounded-full ${
            status === 'connected' ? 'bg-green-500' : 
            status === 'error' ? 'bg-red-500' : 
            'bg-amber-400 animate-pulse'
          }`} 
        />
        <span className="text-xs text-blue-800 hidden sm:inline-block">
          {status === 'connected' ? 'Firestore Connected' : 
           status === 'error' ? 'Firestore Error' : 
           'Checking Firestore...'}
        </span>
      </button>
    </div>
  );
} 