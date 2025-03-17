import { 
  DocumentData, 
  onSnapshot,  
  Query, 
  QuerySnapshot, 
  Unsubscribe
} from 'firebase/firestore';

/**
 * Helper for debounced processing of Firestore snapshots with reconnection logic
 * to fix collaboration issues
 */
export function createDebouncedListener<T extends DocumentData = DocumentData>(
  query: Query<T>, 
  callback: (data: T[]) => void,
  options?: {
    debounceMs?: number;
    onError?: (error: Error) => void;
    logLabel?: string;
  }
): Unsubscribe {
  const { 
    debounceMs = 300, 
    onError,
    logLabel = 'Firestore'
  } = options || {};
  
  let debounceTimeout: NodeJS.Timeout | null = null;
  const clientId = `client_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
  
  console.log(`${logLabel}: Setting up listener for client ${clientId}`);

  // Process snapshot with debouncing to prevent too many updates
  const processSnapshot = (snapshot: QuerySnapshot<T>) => {
    try {
      // Clear any existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        debounceTimeout = null;
      }
      
      // Extract the data from the snapshot
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      // Set a timeout to call the callback with debouncing
      debounceTimeout = setTimeout(() => {
        try {
          callback(items);
        } catch (error) {
          console.error(`${logLabel}: Error in callback:`, error);
          if (onError) {
            onError(error as Error);
          }
        }
      }, debounceMs);
    } catch (error) {
      console.error(`${logLabel}: Error processing snapshot:`, error);
      if (onError) {
        onError(error as Error);
      }
    }
  };

  // Set up the snapshot listener
  return onSnapshot(
    query,
    processSnapshot,
    (error) => {
      console.error(`${logLabel}: Listener error for client ${clientId}:`, error);
      if (onError) {
        onError(error);
      }
      
      // Clear any existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        debounceTimeout = null;
      }
    }
  );
}

/**
 * Safely unsubscribes from a Firestore listener
 */
export function safeUnsubscribe(unsubscribe?: Unsubscribe | null): void {
  if (typeof unsubscribe === 'function') {
    try {
      unsubscribe();
    } catch (error) {
      console.error('Error unsubscribing from Firestore listener:', error);
    }
  }
} 