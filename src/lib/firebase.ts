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
let lastOnlineTime = 0;
let lastOfflineTime = 0;
const ONLINE_NOTIFICATION_INTERVAL = 60000; // Only notify every 60 seconds when already online
const OFFLINE_NOTIFICATION_INTERVAL = 10000; // Only notify every 10 seconds when already offline
let connectionStabilityTimeout: NodeJS.Timeout | null = null;

connectionMonitor.addListener((isOnline) => {
  const now = Date.now();
  
  // Clear any pending stability timeout
  if (connectionStabilityTimeout) {
    clearTimeout(connectionStabilityTimeout);
    connectionStabilityTimeout = null;
  }
  
  // Add a small delay to ensure connection state is stable
  connectionStabilityTimeout = setTimeout(() => {
    // Only log and attempt reconnection with appropriate cooldown
    if (isOnline && (now - lastOnlineTime > ONLINE_NOTIFICATION_INTERVAL)) {
      console.log('Firebase connection status: online');
      lastOnlineTime = now;
      
      // If we're back online, try to reconnect
      try {
        console.log('Attempting to reconnect to Firestore...');
        // Firebase SDK automatically handles reconnection
        // We can trigger a specific reconnection if needed in the future
      } catch (error) {
        console.error('Error reconnecting to Firestore:', error);
      }
    } else if (!isOnline && (now - lastOfflineTime > OFFLINE_NOTIFICATION_INTERVAL)) {
      // Always log offline status with cooldown
      console.log('Firebase connection status: offline');
      lastOfflineTime = now;
    }
  }, 2000); // Wait 2 seconds before acting on connection change
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