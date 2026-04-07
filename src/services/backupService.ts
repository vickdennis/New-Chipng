import { db, auth } from '../firebase';
import { 
  collection, doc, getDoc, setDoc, addDoc, 
  serverTimestamp, query, where, orderBy, getDocs,
  limit, updateDoc, deleteDoc
} from 'firebase/firestore';

export type BackupAction = 'create' | 'update' | 'delete' | 'rollback';

export interface BackupDocument {
  originalId: string;
  data: any;
  action: BackupAction;
  timestamp: any;
  performedBy: string;
}

/**
 * Creates a backup of a document before a write operation.
 */
export const createBackup = async (collectionName: string, documentId: string, action: BackupAction, data?: any) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists() && action !== 'create') {
      console.warn(`Attempted to backup non-existent document: ${collectionName}/${documentId}`);
      return;
    }

    const backupCollection = `${collectionName}_backup`;
    const backupData: BackupDocument = {
      originalId: documentId,
      data: action === 'create' ? data : (docSnap.exists() ? docSnap.data() : null),
      action,
      timestamp: serverTimestamp(),
      performedBy: auth.currentUser?.uid || 'system'
    };

    await addDoc(collection(db, backupCollection), backupData);
  } catch (error) {
    console.error(`Backup failed for ${collectionName}/${documentId}:`, error);
    // We don't throw here to avoid blocking the main operation if backup fails
    // but in a strict system you might want to.
  }
};

/**
 * Safe write wrapper that performs a backup before updating.
 */
export const safeUpdateDoc = async (collectionName: string, documentId: string, data: any) => {
  await createBackup(collectionName, documentId, 'update');
  const docRef = doc(db, collectionName, documentId);
  return await updateDoc(docRef, data);
};

/**
 * Safe set wrapper that performs a backup before setting.
 */
export const safeSetDoc = async (collectionName: string, documentId: string, data: any, options?: { merge?: boolean }) => {
  await createBackup(collectionName, documentId, 'update');
  const docRef = doc(db, collectionName, documentId);
  return await setDoc(docRef, data, options || {});
};

/**
 * Safe delete wrapper that performs a backup before deleting.
 */
export const safeDeleteDoc = async (collectionName: string, documentId: string) => {
  await createBackup(collectionName, documentId, 'delete');
  const docRef = doc(db, collectionName, documentId);
  // Soft delete implementation
  return await updateDoc(docRef, { isDeleted: true, updatedAt: serverTimestamp() });
};

/**
 * Rollback a document to its latest backup state.
 */
export const rollbackDocument = async (collectionName: string, documentId: string) => {
  try {
    const backupCollection = `${collectionName}_backup`;
    const q = query(
      collection(db, backupCollection),
      where('originalId', '==', documentId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('No backup found for this document');
    }

    const latestBackup = querySnapshot.docs[0].data() as BackupDocument;
    
    if (!latestBackup.data) {
      throw new Error('Latest backup contains no data (it might be a creation backup)');
    }

    // Perform the rollback
    const docRef = doc(db, collectionName, documentId);
    await setDoc(docRef, {
      ...latestBackup.data,
      updatedAt: serverTimestamp(),
      isDeleted: false // Ensure it's restored if it was soft-deleted
    });

    // Log the rollback itself
    await createBackup(collectionName, documentId, 'rollback');
    
    return true;
  } catch (error) {
    console.error(`Rollback failed for ${collectionName}/${documentId}:`, error);
    throw error;
  }
};

/**
 * Get version history for a document.
 */
export const getVersionHistory = async (collectionName: string, documentId: string) => {
  const backupCollection = `${collectionName}_backup`;
  const q = query(
    collection(db, backupCollection),
    where('originalId', '==', documentId),
    orderBy('timestamp', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BackupDocument & { id: string }));
};
