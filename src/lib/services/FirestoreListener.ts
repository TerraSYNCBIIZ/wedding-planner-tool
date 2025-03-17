import { 
  Firestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  DocumentData, 
  Query, 
  QuerySnapshot, 
  Unsubscribe, 
  WhereFilterOp 
} from 'firebase/firestore';

type ListenerCallback<T = DocumentData> = (items: T[]) => void;
type ErrorCallback = (error: Error) => void;

interface ListenerOptions {
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  logPrefix?: string;
}

interface ListenerConfig<T = DocumentData> {
  query: Query<T>;
  callback: ListenerCallback<T>;
  onError?: ErrorCallback;
  options?: ListenerOptions;
}

interface ActiveListener {
  unsubscribe: Unsubscribe;
  retryCount: number;
  lastActive: number;
  id: string;
}

/**
 * FirestoreListener - A class to manage Firestore listeners with better error handling
 * and reconnection logic for collaborative workspaces
 */
export class FirestoreListener {
  private activeListeners: Map<string, ActiveListener> = new Map();
  private firestore: Firestore;
  private clientId: string;

  constructor(firestore: Firestore) {
    this.firestore = firestore;
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Set up window beforeunload to clean up listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.cleanup);
    }
  }

  /**
   * Create a query for a collection with a workspaceId filter
   */
  createWorkspaceQuery<T = DocumentData>(
    collectionPath: string, 
    workspaceId: string
  ): Query<T> {
    const collectionRef = collection(this.firestore, collectionPath) as any;
    return query(collectionRef, where('workspaceId', '==', workspaceId));
  }

  /**
   * Create a query with custom where clauses
   */
  createQuery<T = DocumentData>(
    collectionPath: string,
    whereFilters: [string, WhereFilterOp, any][]
  ): Query<T> {
    const collectionRef = collection(this.firestore, collectionPath) as any;
    
    // Build the query with all where clauses
    return whereFilters.reduce((q, [field, op, value]) => {
      return query(q, where(field, op, value));
    }, query(collectionRef));
  }

  /**
   * Add a listener for a specific query
   */
  addListener<T = DocumentData>({
    query,
    callback,
    onError,
    options
  }: ListenerConfig<T>): string {
    const {
      debounceMs = 300,
      maxRetries = 5,
      retryDelayMs = 1000,
      logPrefix = 'Firestore'
    } = options || {};

    // Generate a unique ID for this listener
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    let debounceTimeout: NodeJS.Timeout | undefined;
    let items: T[] = [];
    
    const processSnapshot = (snapshot: QuerySnapshot<T>) => {
      try {
        // Clear any existing timeout
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }
        
        // Save the items for the debounced callback
        items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        
        // Set a timeout to call the callback with debouncing
        debounceTimeout = setTimeout(() => {
          try {
            callback(items);
          } catch (err) {
            console.error(`${logPrefix}: Error in callback:`, err);
          }
        }, debounceMs);
      } catch (err) {
        console.error(`${logPrefix}: Error processing snapshot:`, err);
        // Call the error callback if provided
        if (onError) {
          onError(err as Error);
        }
      }
    };
    
    const setupListener = (retryCount: number) => {
      try {
        console.log(`${logPrefix}: Setting up listener (ID: ${listenerId}, Client: ${this.clientId}, Retry: ${retryCount})`);
        
        const unsubscribe = onSnapshot(
          query,
          processSnapshot,
          (error) => {
            console.error(`${logPrefix}: Listener error (ID: ${listenerId}):`, error);
            
            // Call the error callback if provided
            if (onError) {
              onError(error);
            }
            
            // Get the current listener data
            const listener = this.activeListeners.get(listenerId);
            if (!listener) return;
            
            // Check if we should retry
            if (listener.retryCount < maxRetries) {
              console.log(`${logPrefix}: Attempting to reconnect (Retry ${listener.retryCount + 1}/${maxRetries})...`);
              
              // Clean up the current listener
              try {
                listener.unsubscribe();
              } catch (e) {
                console.error(`${logPrefix}: Error unsubscribing:`, e);
              }
              
              // Set a timeout to retry
              setTimeout(() => {
                // Update retry count
                this.activeListeners.set(listenerId, {
                  ...listener,
                  retryCount: listener.retryCount + 1,
                  lastActive: Date.now()
                });
                
                // Setup a new listener
                setupListener(listener.retryCount + 1);
              }, retryDelayMs * (listener.retryCount + 1));
            } else {
              console.error(`${logPrefix}: Max retries reached for listener (ID: ${listenerId})`);
            }
          }
        );
        
        // Store the unsubscribe function and initial retry state
        this.activeListeners.set(listenerId, {
          unsubscribe,
          retryCount,
          lastActive: Date.now(),
          id: listenerId
        });
      } catch (err) {
        console.error(`${logPrefix}: Error setting up listener:`, err);
        
        // Call the error callback if provided
        if (onError) {
          onError(err as Error);
        }
      }
    };
    
    // Initial setup
    setupListener(0);
    
    return listenerId;
  }

  /**
   * Remove a specific listener
   */
  removeListener(listenerId: string): boolean {
    try {
      const listener = this.activeListeners.get(listenerId);
      if (listener) {
        listener.unsubscribe();
        this.activeListeners.delete(listenerId);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error removing listener:', err);
      return false;
    }
  }

  /**
   * Remove all active listeners
   */
  removeAllListeners(): void {
    for (const [id, listener] of this.activeListeners.entries()) {
      try {
        listener.unsubscribe();
      } catch (err) {
        console.error(`Error unsubscribing listener ${id}:`, err);
      }
    }
    this.activeListeners.clear();
  }

  /**
   * Cleanup method for when the window is closed
   */
  private cleanup = (): void => {
    this.removeAllListeners();
  }

  /**
   * Clean up when this instance is no longer needed
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.cleanup);
    }
    this.removeAllListeners();
  }
} 