import { app } from './firebase';
import { getFirestore, collection, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';

/**
 * Test the Firebase Firestore connection by writing and reading a test value
 * @returns Promise<boolean> - True if the connection is working, false otherwise
 */
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    // Log the project ID for debugging
    console.log('Testing Firestore connection with project ID:', app.options.projectId);
    
    // Check if the project ID is properly configured
    if (!app.options.projectId) {
      console.error('Firebase project ID is missing. Please check your .env.local file.');
      return false;
    }
    
    // Initialize Firestore
    const db = getFirestore(app);
    
    // Generate a random test value
    const testValue = `test-${Date.now()}`;
    
    // Write the test value to Firestore
    const testCollection = collection(db, 'test_connection');
    const docRef = await addDoc(testCollection, { 
      value: testValue, 
      timestamp: Timestamp.now() 
    });
    console.log('Test value written to Firestore:', testValue, 'with ID:', docRef.id);
    
    // Read the test value from Firestore
    const docSnap = await getDoc(doc(db, 'test_connection', docRef.id));
    if (!docSnap.exists()) {
      console.error('Test document not found in Firestore');
      return false;
    }
    
    const data = docSnap.data();
    console.log('Test value read from Firestore:', data.value);
    
    // Check if the read value matches the written value
    const isConnected = data.value === testValue;
    console.log('Firestore connection test result:', isConnected ? 'SUCCESS' : 'FAILED');
    
    return isConnected;
  } catch (error) {
    console.error('Error testing Firestore connection:', error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if the project ID is properly configured
    if (!app.options.projectId) {
      console.error('Firebase project ID is missing. Please check your .env.local file.');
    } else {
      console.error('Project ID:', app.options.projectId);
    }
    
    return false;
  }
};

// Export an alias with a more appropriate name
export const testFirestoreConnection = testFirebaseConnection; 