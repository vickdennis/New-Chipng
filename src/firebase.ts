import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, collection, query, where, getDocs, limit, Firestore,
  getDoc, addDoc, setDoc, updateDoc, deleteDoc, doc, orderBy, limit as firestoreLimit
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getUserByUsername = async (username: string) => {
  const cleanUsername = username.toLowerCase().trim();
  const q = query(
    collection(db, 'users'),
    where('username', '==', cleanUsername),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  return { uid: doc.id, ...doc.data() };
};

export async function createBackup(collectionName: string, documentId: string, action: 'create' | 'update' | 'delete' | 'rollback') {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    const backupCollection = `${collectionName}_backup`;
    await addDoc(collection(db, backupCollection), {
      originalId: documentId,
      data: docSnap.exists() ? docSnap.data() : null,
      action,
      timestamp: new Date().toISOString(),
      performedBy: auth.currentUser?.uid || 'system'
    });
  } catch (error) {
    console.error('Backup failed:', error);
  }
}

export async function safeWrite(collectionName: string, documentId: string, data: any, action: 'create' | 'update' | 'delete') {
  await createBackup(collectionName, documentId, action);
  const docRef = doc(db, collectionName, documentId);
  
  try {
    if (action === 'create') {
      await setDoc(docRef, data);
    } else if (action === 'update') {
      await updateDoc(docRef, data);
    } else if (action === 'delete') {
      await deleteDoc(docRef);
    }
  } catch (error) {
    handleFirestoreError(error, action === 'delete' ? OperationType.DELETE : OperationType.WRITE, `${collectionName}/${documentId}`);
  }
}

export async function rollbackDocument(collectionName: string, documentId: string) {
  const backupCollection = `${collectionName}_backup`;
  const q = query(
    collection(db, backupCollection),
    where('originalId', '==', documentId),
    orderBy('timestamp', 'desc'),
    firestoreLimit(1)
  );
  
  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('No backup found for this document');
    }
    
    const backupDoc = querySnapshot.docs[0].data();
    const docRef = doc(db, collectionName, documentId);
    
    if (backupDoc.data) {
      await setDoc(docRef, backupDoc.data);
    } else {
      await deleteDoc(docRef);
    }
    
    // Log the rollback
    await addDoc(collection(db, backupCollection), {
      originalId: documentId,
      data: backupDoc.data,
      action: 'rollback',
      timestamp: new Date().toISOString(),
      performedBy: auth.currentUser?.uid || 'system'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${documentId}`);
  }
}
