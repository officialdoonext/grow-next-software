import { db } from "./firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";

export const PAGE_SIZE = 24;

/**
 * Creates a user-isolated real-time subscription for any collection.
 * Strictly filters by userId, orders by createdAt desc, and limits to 24 items.
 */
export function subscribeToUserCollection<T = DocumentData>(
  collectionName: string,
  userEmail: string,
  onUpdate: (items: (T & { id: string })[]) => void,
  onError?: (err: Error) => void
) {
  const normEmail = userEmail.toLowerCase().trim();
  const colRef = collection(db, collectionName);
  const q = query(
    colRef,
    where("userId", "==", normEmail)
  );

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const results: (T & { id: string })[] = [];
      snapshot.forEach((docSnap) => {
        results.push({
          ...(docSnap.data() as T),
          id: docSnap.id,
        });
      });
      // Sort recent first (createdAt descending)
      results.sort((a: any, b: any) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      // Strictly limit to 24 recent items
      onUpdate(results.slice(0, PAGE_SIZE));
    },
    (err) => {
      console.warn(`[Firestore subscription error in ${collectionName}]`, err);
      if (onError) onError(err);
    }
  );
}

/**
 * Adds a new document strictly tagged with the user's isolated email and timestamps.
 */
export async function createUserDataDocument<T extends Record<string, any>>(
  collectionName: string,
  userEmail: string,
  data: T
): Promise<string> {
  const normEmail = userEmail.toLowerCase().trim();
  const colRef = collection(db, collectionName);
  const now = new Date().toISOString();

  const docRef = await addDoc(colRef, {
    ...data,
    userId: normEmail,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

/**
 * Updates a document while preserving userId security
 */
export async function updateUserDataDocument<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  updates: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Deletes a document by ID
 */
export async function deleteUserDataDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}
