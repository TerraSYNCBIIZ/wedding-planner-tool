'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  User
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { setCookie, deleteCookie } from 'cookies-next';

// Initialize Firebase Auth
const auth = getAuth(app);

// Function to set auth token cookie
const setAuthCookie = (token: string | null) => {
  if (token) {
    setCookie('auth_token', token, {
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });
  } else {
    deleteCookie('auth_token', { path: '/' });
    deleteCookie('hasCompletedSetup', { path: '/' });
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
  
  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // Get ID token for cookie
      if (user) {
        const token = await user.getIdToken();
        setAuthCookie(token);
      } else {
        setAuthCookie(null);
      }
      
      setLoading(false);
    });
    
    // Cleanup subscription
    return () => unsubscribe();
  }, []);
  
  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
    if (!user) {
      throw new Error('No user is signed in');
    }
    
    try {
      await updateProfile(user, { displayName });
      
      // Force refresh the user object
      setUser({ ...user });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };
  
  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile
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