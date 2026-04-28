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
export const createBackup = async (collectionName: string, documentId: string | null, action: 'create' | 'update' | 'delete' | 'rollback') => {
  try {
    let existingData = null;
    
    if (documentId && action !== 'create') {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      existingData = docSnap.exists() ? docSnap.data() : null;
    }

    const backupRef = doc(collection(db, `${collectionName}_backup`));
    const backupData: BackupData = {
      originalId: documentId || 'new-document',
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
export const safeWrite = async (collectionName: string, documentId: string | null, data: any, action: 'update' | 'create' | 'delete'): Promise<string | boolean> => {
  try {
    let finalDocId = documentId;

    // 1. For non-create actions, ensure we have an ID
    if (action !== 'create' && !finalDocId) {
      throw new Error(`ID required for ${action} operation on ${collectionName}`);
    }

    // 2. For create actions, generate an ID if not provided
    if (action === 'create' && !finalDocId) {
      const newDocRef = doc(collection(db, collectionName));
      finalDocId = newDocRef.id;
    }

    // 3. Create Backup
    await createBackup(collectionName, finalDocId, action);

    // 4. Perform Write
    const docRef = doc(db, collectionName, finalDocId!);
    
    if (action === 'delete') {
      // Soft Delete
      await updateDoc(docRef, { 
        isDeleted: true, 
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp() 
      });
    } else {
      await setDoc(docRef, {
        ...data,
        isDeleted: false,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    return action === 'create' ? finalDocId! : true;
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
