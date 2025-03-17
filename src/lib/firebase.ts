// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// Import our connection monitor
import { ConnectionMonitor } from './connection-monitor';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with error handling
let app: FirebaseApp;
let firestore: Firestore;

try {
  app = initializeApp(firebaseConfig);
  firestore = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Create a mock firestore object that will be replaced by mock data in the context
  firestore = {} as Firestore;
}

// Create a connection monitor instance
export const connectionMonitor = new ConnectionMonitor({
  pingIntervalMs: 30000, // Check connection every 30 seconds
  maxReconnectAttempts: 5,
  logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'info'
});

// Add listeners for connection changes
connectionMonitor.addListener((isOnline) => {
  console.log(`Firebase connection status: ${isOnline ? 'online' : 'offline'}`);
  
  // If we're back online, try to reconnect
  if (isOnline) {
    // Force a reconnection to Firestore
    try {
      console.log('Attempting to reconnect to Firestore...');
      // Firebase SDK automatically handles reconnection
      // We can trigger a specific reconnection if needed in the future
    } catch (error) {
      console.error('Error reconnecting to Firestore:', error);
    }
  }
});

// Add window unload handler to clean up connections
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Clean up connection monitor
    connectionMonitor.destroy();
  });
}

// Export the initialized services
export { firestore, app }; 