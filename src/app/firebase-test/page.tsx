'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { app, firestore } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';

export default function FirebaseTestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Testing Firestore connection...');
  const [projectId, setProjectId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const testConnection = async () => {
    try {
      setStatus('loading');
      setMessage('Testing Firestore connection...');
      setError('');
      setLastUpdate(new Date());
      
      // Get the project ID from the app configuration
      const id = app?.options?.projectId || 'Not configured';
      setProjectId(id);
      
      if (!app?.options?.projectId) {
        throw new Error('Firebase project ID is not configured. Check your environment variables.');
      }
      
      // Try to write a test document to Firestore
      console.log('Writing test document to Firestore...');
      const testCollection = collection(firestore, 'test_connection');
      const testValue = `test-${Date.now()}`;
      
      const docRef = await addDoc(testCollection, { 
        value: testValue, 
        timestamp: Timestamp.now() 
      });
      console.log('Successfully wrote test document with ID:', docRef.id);
      
      // Try to read the test document
      console.log('Reading test document from Firestore...');
      const docSnap = await getDoc(doc(firestore, 'test_connection', docRef.id));
      
      if (docSnap.exists()) {
        console.log('Successfully read test document:', docSnap.data());
        setStatus('success');
        setMessage('Firebase connection successful! Read and write operations are working.');
      } else {
        throw new Error('Test document not found after writing it to Firestore');
      }
    } catch (error) {
      console.error('Firebase connection test error:', error);
      setStatus('error');
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setMessage('Firebase connection failed');
      setError(errorMessage);
    }
  };
  
  // Run test on component mount
  useEffect(() => {
    const runInitialTest = async () => {
      await testConnection();
    };
    
    runInitialTest();
    // We're intentionally only running this once on mount, so no dependencies needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Firebase Connection Test</h1>
      
      <div className={`p-4 mb-6 rounded-lg ${
        status === 'success' ? 'bg-green-100 border border-green-300' : 
        status === 'error' ? 'bg-red-100 border border-red-300' : 
        'bg-blue-100 border border-blue-300'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`h-3 w-3 rounded-full ${
            status === 'success' ? 'bg-green-500' : 
            status === 'error' ? 'bg-red-500' : 
            'bg-blue-500 animate-pulse'
          }`} />
          <p className="font-medium">
            {message}
          </p>
        </div>
        
        {error && (
          <div className="mt-2 text-red-700 text-sm p-2 bg-red-50 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div className="mt-2 text-xs text-gray-500">
          Last checked: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-3">Firebase Configuration</h2>
        <div className="space-y-2">
          <p><strong>Project ID:</strong> {projectId}</p>
          <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
          <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Configured' : 'Not configured'}</p>
          <p><strong>Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Configured' : 'Not configured'}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-3">Troubleshooting</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Check that your Firebase project is properly set up and enabled.</li>
          <li>Verify that your environment variables are correctly configured.</li>
          <li>Make sure that your Firestore rules allow read/write operations for authenticated users.</li>
          <li>Clear your browser cache and try again.</li>
          <li>Check your console for more detailed error messages.</li>
        </ul>
      </div>
      
      <div className="flex gap-4">
        <Button 
          onClick={testConnection}
          className="px-4 py-2"
        >
          Test Again
        </Button>
        
        <Link href="/">
          <Button variant="outline" className="px-4 py-2">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
} 