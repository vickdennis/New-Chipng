import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

export interface BackupData {
  id?: string;
  originalId: string;
  collectionName: string;
  data: any;
  action: 'create' | 'update' | 'delete' | 'rollback';
  timestamp: Timestamp | any;
  performedBy: string;
}

/**
 * Creates a backup snapshot of a document before a mutation
 */
export const createBackup = async (collectionName: string, documentId: string, action: 'create' | 'update' | 'delete' | 'rollback') => {
  const path = `${collectionName}/${documentId}`;
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    // For update and delete, we need existing data
    const existingData = docSnap.exists() ? docSnap.data() : null;

    const backupRef = doc(collection(db, `${collectionName}_backup`));
    const backupData: BackupData = {
      originalId: documentId,
      collectionName,
      data: existingData || {},
      action,
      timestamp: serverTimestamp(),
      performedBy: auth.currentUser?.uid || 'system'
    };

    await setDoc(backupRef, backupData);
    return backupRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}_backup`);
    return null;
  }
};

/**
 * Safe write wrapper that performs a backup before writing
 */
export const safeWrite = async (collectionName: string, documentId: string | null, data: any, action: 'update' | 'create' | 'delete') => {
  const path = documentId ? `${collectionName}/${documentId}` : collectionName;
  try {
    // 1. Create Backup (if document exists)
    if (documentId) {
      // Check if document exists before backup for updates/deletes
      if (action !== 'create') {
        await createBackup(collectionName, documentId, action);
      }
    }

    // 2. Perform Write
    if (action === 'create') {
      const colRef = collection(db, collectionName);
      const newDocRef = documentId ? doc(db, collectionName, documentId) : doc(colRef);
      const finalData = { 
        ...data, 
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp(), 
        isDeleted: false 
      };
      await setDoc(newDocRef, finalData);
      
      // Create an initial snapshot for the new document (now it exists)
      await createBackup(collectionName, newDocRef.id, 'create');
      
      return newDocRef.id;
    }

    if (!documentId) throw new Error('documentId is required for update or delete');
    const docRef = doc(db, collectionName, documentId);
    
    if (action === 'delete') {
      // Soft Delete
      await updateDoc(docRef, { 
        isDeleted: true, 
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp() 
      });
    } else {
      await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, action === 'create' ? OperationType.CREATE : action === 'delete' ? OperationType.DELETE : OperationType.UPDATE, path);
    throw error;
  }
};

/**
 * Rollback a document to a specific backup version
 */
export const rollbackToVersion = async (collectionName: string, documentId: string, backupId: string) => {
  const path = `${collectionName}/${documentId}`;
  try {
    const backupRef = doc(db, `${collectionName}_backup`, backupId);
    const backupSnap = await getDoc(backupRef);
    
    if (!backupSnap.exists()) {
      throw new Error(`Backup ${backupId} not found`);
    }

    const backupData = backupSnap.data() as BackupData;

    // Create a special rollback backup before restoring
    await createBackup(collectionName, documentId, 'rollback');
    
    // Restore the data
    const docRef = doc(db, collectionName, documentId);
    await setDoc(docRef, { ...backupData.data, isDeleted: false, updatedAt: serverTimestamp() }, { merge: false });

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

/**
 * Rollback a document to its previous state
 */
export const rollbackDocument = async (collectionName: string, documentId: string) => {
  const path = `${collectionName}/${documentId}`;
  try {
    // 1. Find the latest backup
    const backupsQuery = query(
      collection(db, `${collectionName}_backup`),
      where('originalId', '==', documentId),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const backupSnap = await getDocs(backupsQuery);
    if (backupSnap.empty) {
      throw new Error(`No backups found for ${collectionName}/${documentId}`);
    }

    const latestBackup = backupSnap.docs[0].data() as BackupData;

    // 2. Restore data
    const docRef = doc(db, collectionName, documentId);
    
    // Create a special rollback backup before restoring
    await createBackup(collectionName, documentId, 'rollback');
    
    // Restore the data
    await setDoc(docRef, { ...latestBackup.data, isDeleted: false }, { merge: false });

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

/**
 * Fetch backup history for a document
 */
export const getBackupHistory = async (collectionName: string, documentId: string) => {
  const path = `${collectionName}_backup`;
  try {
    const backupsQuery = query(
      collection(db, `${collectionName}_backup`),
      where('originalId', '==', documentId),
      orderBy('timestamp', 'desc')
    );

    const snap = await getDocs(backupsQuery);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BackupData));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};
