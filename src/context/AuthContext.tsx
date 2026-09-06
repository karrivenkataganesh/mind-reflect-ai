import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChanged, signInWithGoogle, signOutUser } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Global Auth Listener to manage logged-in vs. logged-out states and persist across refreshes
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (authError) => {
        console.error('Firebase Auth state error:', authError);
        setError(authError.message || 'Authentication error occurred');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<User | null> => {
    setError(null);
    try {
      const signedInUser = await signInWithGoogle();
      return signedInUser;
    } catch (err: any) {
      // Don't flag user cancelation as a fatal application crash
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in window closed before completing.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Another sign-in window is already open.');
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
      return null;
    }
  };

  const logout = async (): Promise<void> => {
    setError(null);
    try {
      await signOutUser();
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithGoogle,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
