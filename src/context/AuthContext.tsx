'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  type User,
  deleteUser as firebaseDeleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';

// Initialize Firebase Auth
const auth = getAuth(app);

// Function to set auth token cookie
const setAuthCookie = (token: string | null) => {
  if (token) {
    // Set cookie with consistent naming (authToken)
    setCookie('authToken', token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Also set the old auth_token for backward compatibility
    setCookie('auth_token', token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    // Also store in localStorage for better persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('authToken', token);
      } catch (e) {
        console.error('Failed to store token in localStorage:', e);
      }
    }
  } else {
    // Clear both cookie formats when signing out
    deleteCookie('authToken', { path: '/' });
    deleteCookie('auth_token', { path: '/' });
    deleteCookie('hasCompletedSetup', { path: '/' });
    deleteCookie('currentWeddingId', { path: '/' });
    
    // Also clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('authToken');
      } catch (e) {
        console.error('Failed to remove token from localStorage:', e);
      }
    }
  }
};

// Define the context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName: string) => Promise<User>;
  signOut: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<boolean>;
  refreshAuthState: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Function to refresh auth state manually if needed
  const refreshAuthState = async () => {
    if (!auth.currentUser) {
      return;
    }
    
    try {
      const token = await auth.currentUser.getIdToken(true);
      setAuthCookie(token);
      setUser({ ...auth.currentUser });
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    }
  };
  
  // Monitor auth state
  useEffect(() => {
    console.log('Setting up auth state listener...');
    let isMounted = true;
    
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', user ? `User ${user.uid} signed in` : 'No user');
        setUser(user);
        
        // Get ID token for cookie
        if (user) {
          try {
            const token = await user.getIdToken();
            setAuthCookie(token);
            console.log('Auth token obtained and cookie set');
          } catch (tokenError) {
            console.error('Error getting ID token:', tokenError);
          }
        } else {
          setAuthCookie(null);
          console.log('Auth cookies cleared');
        }
        
        setLoading(false);
      }, (error) => {
        if (!isMounted) return;
        
        console.error('Auth state change error:', error);
        setLoading(false);
      });
      
      // Add a safety timeout to ensure loading state doesn't get stuck
      const safetyTimeout = setTimeout(() => {
        if (!isMounted) return;
        
        console.log('Auth safety timeout triggered, forcing loading state to false');
        setLoading(false);
      }, 10000);
      
      // Cleanup subscription
      return () => {
        isMounted = false;
        console.log('Cleaning up auth state listener');
        unsubscribe();
        clearTimeout(safetyTimeout);
      };
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setLoading(false);
      return () => { isMounted = false; };
    }
  }, []);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Immediately get and set the token
      const token = await userCredential.user.getIdToken();
      setAuthCookie(token);
      
      return userCredential.user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };
  
  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set the display name
      await updateProfile(userCredential.user, { displayName });
      
      // Immediately get and set the token
      const token = await userCredential.user.getIdToken();
      setAuthCookie(token);
      
      return userCredential.user;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };
  
  // Sign out
  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setAuthCookie(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };
  
  // Update user profile
  const updateUserProfile = async (displayName: string): Promise<void> => {
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
        
        // Update local state
        setUser({ ...auth.currentUser });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };
  
  // Delete user account
  const deleteAccount = async (password: string): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user found');
      }
      
      // Re-authenticate user before deleting account
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user
      await firebaseDeleteUser(user);
      
      // Clear cookies
      setAuthCookie(null);
      
      // Update state
      setUser(null);
      
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  };
  
  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    deleteAccount,
    refreshAuthState
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 