import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  Firestore
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

export type BackupAction = 'create' | 'update' | 'delete' | 'rollback';

export interface BackupDocument {
  id?: string;
  originalId: string;
  collectionName: string;
  data: any;
  action: BackupAction;
  timestamp: string;
  performedBy: string;
}

/**
 * Creates a backup of a document before any modification
 */
export const createBackup = async (
  collectionName: string, 
  documentId: string, 
  action: BackupAction,
  userId: string = 'system'
) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const backupData: BackupDocument = {
        originalId: documentId,
        collectionName,
        data: docSnap.data(),
        action,
        timestamp: new Date().toISOString(),
        performedBy: userId
      };
      
      await addDoc(collection(db, `${collectionName}_backup`), backupData);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Backup failed for ${collectionName}/${documentId}:`, error);
    return false;
  }
};

/**
 * Restores a document to its previous state from the latest backup
 */
export const rollbackDocument = async (
  collectionName: string, 
  documentId: string,
  userId: string = 'admin'
) => {
  try {
    const backupRef = collection(db, `${collectionName}_backup`);
    const q = query(
      backupRef, 
      where('originalId', '==', documentId), 
      orderBy('timestamp', 'desc'), 
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      toast.error('No backup found for this document');
      return false;
    }
    
    const latestBackup = querySnapshot.docs[0].data() as BackupDocument;
    
    // Restore the data
    await setDoc(doc(db, collectionName, documentId), latestBackup.data);
    
    // Log the rollback action
    await addDoc(collection(db, `${collectionName}_backup`), {
      originalId: documentId,
      collectionName,
      data: latestBackup.data,
      action: 'rollback',
      timestamp: new Date().toISOString(),
      performedBy: userId
    });
    
    toast.success('Document rolled back successfully');
    return true;
  } catch (error) {
    console.error(`Rollback failed for ${collectionName}/${documentId}:`, error);
    toast.error('Rollback failed');
    return false;
  }
};

/**
 * A safe wrapper for write operations that automatically creates backups
 */
export const safeWrite = async (
  collectionName: string,
  documentId: string | null,
  data: any,
  action: 'create' | 'update' | 'delete',
  userId: string = 'system'
): Promise<string | boolean> => {
  try {
    if (action === 'update' || action === 'delete') {
      if (!documentId) throw new Error('Document ID required for update/delete');
      await createBackup(collectionName, documentId, action, userId);
    }

    if (action === 'delete') {
      if (!documentId) throw new Error('Document ID required for delete');
      // Soft delete
      await updateDoc(doc(db, collectionName, documentId), { 
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: userId
      });
      return true;
    } else if (action === 'update') {
      if (!documentId) throw new Error('Document ID required for update');
      await updateDoc(doc(db, collectionName, documentId), data);
      return true;
    } else if (action === 'create') {
      if (documentId) {
        await setDoc(doc(db, collectionName, documentId), {
          ...data,
          createdAt: new Date().toISOString(),
          createdBy: userId
        });
        return documentId;
      } else {
        const docRef = await addDoc(collection(db, collectionName), {
          ...data,
          createdAt: new Date().toISOString(),
          createdBy: userId
        });
        return docRef.id;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Safe write failed for ${collectionName}:`, error);
    toast.error(`Operation failed: ${action}`);
    return false;
  }
};
