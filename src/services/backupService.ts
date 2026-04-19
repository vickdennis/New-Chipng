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
import { db, auth } from '../firebase';

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
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    // For update and delete, we need existing data
    // For create, there is no existing data, so we might just log the attempt or the post-create state
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
    console.error(`Backup failed for ${collectionName}/${documentId}:`, error);
    return null;
  }
};

/**
 * Safe write wrapper that performs a backup before writing
 */
export const safeWrite = async (collectionName: string, documentId: string, data: any, action: 'update' | 'create' | 'delete') => {
  try {
    // 1. Create Backup
    await createBackup(collectionName, documentId, action);

    // 2. Perform Write
    const docRef = doc(db, collectionName, documentId);
    
    if (action === 'delete') {
      // Soft Delete
      await updateDoc(docRef, { isDeleted: true, deletedAt: serverTimestamp() });
    } else {
      await setDoc(docRef, data, { merge: true });
    }

    return true;
  } catch (error) {
    console.error(`Safe write failed for ${collectionName}/${documentId}:`, error);
    throw error;
  }
};

/**
 * Rollback a document to its previous state
 */
export const rollbackDocument = async (collectionName: string, documentId: string) => {
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
    console.error(`Rollback failed for ${collectionName}/${documentId}:`, error);
    throw error;
  }
};

/**
 * Fetch backup history for a document
 */
export const getBackupHistory = async (collectionName: string, documentId: string) => {
  try {
    const backupsQuery = query(
      collection(db, `${collectionName}_backup`),
      where('originalId', '==', documentId),
      orderBy('timestamp', 'desc')
    );

    const snap = await getDocs(backupsQuery);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BackupData));
  } catch (error) {
    console.error(`Failed to fetch backup history for ${collectionName}/${documentId}:`, error);
    return [];
  }
};
