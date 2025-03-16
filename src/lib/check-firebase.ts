import { app, firestore } from './firebase';
import { collection, addDoc, doc, getDoc, Timestamp } from 'firebase/firestore';

/**
 * Check if the Firebase Firestore exists and is properly configured
 */
export const checkFirebaseDatabase = async () => {
  try {
    console.log('Checking Firebase Firestore configuration...');
    
    // Log the project ID
    console.log('Project ID:', app.options.projectId);
    
    // Try to write a test value to Firestore
    const testCollection = collection(firestore, 'test_connection');
    const testValue = `test-${Date.now()}`;
    
    const docRef = await addDoc(testCollection, { 
      value: testValue, 
      timestamp: Timestamp.now() 
    });
    console.log('Successfully wrote to Firebase Firestore with ID:', docRef.id);
    
    // Try to read the test value
    const docSnap = await getDoc(doc(firestore, 'test_connection', docRef.id));
    if (docSnap.exists()) {
      console.log('Successfully read from Firebase Firestore:', docSnap.data());
      return true;
    }
    
    console.error('Test document not found in Firebase Firestore');
    return false;
  } catch (error) {
    console.error('Error checking Firebase Firestore:', error);
    return false;
  }
}; 

// Export an alias with a more appropriate name
export const checkFirestoreConnection = checkFirebaseDatabase; 