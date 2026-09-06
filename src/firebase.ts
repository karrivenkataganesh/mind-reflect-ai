import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigData from '../firebase-applet-config.json';

// Firebase configuration using project credentials with fallback to verified credentials
export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || "AIzaSyDLjbb5zUQumIWmUBtKxHaLQWJ5gfsj0V4",
  authDomain: firebaseConfigData.authDomain || "gen-lang-client-0833182324.firebaseapp.com",
  projectId: firebaseConfigData.projectId || "gen-lang-client-0833182324",
  storageBucket: firebaseConfigData.storageBucket || "gen-lang-client-0833182324.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "778278067276",
  appId: firebaseConfigData.appId || "1:778278067276:web:978dbe30054b65d1d428e9",
  measurementId: firebaseConfigData.measurementId || "",
};

// Initialize or reuse Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore targeting configured database instance
export const db: Firestore = (() => {
  try {
    if (firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)') {
      return getFirestore(app, firebaseConfigData.firestoreDatabaseId);
    }
  } catch (err) {
    console.warn('Failed to initialize Firestore with custom databaseId, falling back to default:', err);
  }
  return getFirestore(app);
})();

// Google Sign-In via Popup
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Log Out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export { onAuthStateChanged };
export type { User };
