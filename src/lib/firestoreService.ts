import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalEntry, JournalInteraction } from '../types';

/**
 * Removes undefined fields deeply so Firestore does not reject writes.
 */
export function stripUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined) as unknown as T;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = stripUndefined(value);
      }
    }
    return clean as T;
  }
  return obj;
}

/**
 * Sync user profile to Firestore under /users/{userId}
 */
export async function syncUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      stripUndefined({
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLoginAt: Date.now(),
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to sync user profile:', error);
  }
}

/**
 * Subscribes in real-time to all entries of a specific user under /users/{userId}/entries.
 */
export function subscribeToUserEntries(
  userId: string,
  onData: (entries: JournalEntry[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId,
          title: data.title || 'Untitled Reflection',
          mood: data.mood || 'Reflective',
          turns: Array.isArray(data.turns) ? data.turns : [],
          summary: data.summary || null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
          pinned: Boolean(data.pinned),
        });
      });
      onData(items);
    },
    (err) => {
      console.error('Firestore entries subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Saves or updates a journal entry in Firestore under /users/{userId}/entries/{entryId}.
 * Deeply strips undefined values to ensure payload hygiene and database integrity.
 */
export async function saveUserEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to save entry in Firestore.');
  }

  const entryDocRef = doc(db, 'users', userId, 'entries', entry.id);
  const sanitized = stripUndefined({
    ...entry,
    userId,
    updatedAt: Date.now(),
  });

  await setDoc(entryDocRef, sanitized, { merge: true });
}

/**
 * Deletes a journal entry from Firestore under /users/{userId}/entries/{entryId}.
 */
export async function deleteUserEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryDocRef);
}

// Backward-compatible aliases
export const subscribeToUserInteractions = subscribeToUserEntries;
export const saveUserInteraction = saveUserEntry;
export const deleteUserInteraction = deleteUserEntry;
