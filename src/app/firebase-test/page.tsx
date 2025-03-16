'use client';

import { useState, useEffect } from 'react';
import { checkFirestoreConnection } from '../../lib/check-firebase';
import Link from 'next/link';

export default function FirebaseTestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Testing Firestore connection...');
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('loading');
        setMessage('Testing Firestore connection...');
        
        // Get the project ID from the environment variable
        const id = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not configured';
        setProjectId(id);
        
        // Check the Firestore connection
        const result = await checkFirestoreConnection();
        
        if (result) {
          setStatus('success');
          setMessage('Firestore connection successful!');
        } else {
          setStatus('error');
          setMessage('Firestore connection failed. Check the console for more details.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(`Error testing Firestore connection: ${error instanceof Error ? error.message : String(error)}`);
        console.error('Error testing Firestore connection:', error);
      }
    };
    
    testConnection();
  }, []);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Firestore Connection Test</h1>
      
      <div className={`p-4 mb-6 rounded-lg ${
        status === 'success' ? 'bg-green-100 border border-green-300' : 
        status === 'error' ? 'bg-red-100 border border-red-300' : 
        'bg-blue-100 border border-blue-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${
            status === 'success' ? 'bg-green-500' : 
            status === 'error' ? 'bg-red-500' : 
            'bg-blue-500 animate-pulse'
          }`} />
          <p className="font-medium">
            {message}
          </p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-3">Firestore Configuration</h2>
        <div className="space-y-2">
          <p><strong>Project ID:</strong> {projectId}</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        </div>
      </div>
      
      <div className="flex gap-4">
        <button 
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Test Again
        </button>
        
        <Link 
          href="/"
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
} 