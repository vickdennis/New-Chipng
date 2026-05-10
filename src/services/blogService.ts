import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { BlogPost } from '../types';
import { safeWrite } from './backupService';
import { uploadImage } from './imageService';

const BLOGS_COLLECTION = 'blogs';

export const blogService = {
  async uploadImage(
    file: File, 
    userId: string, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return uploadImage(file, userId, 'blogs', onProgress);
  },

  async getAllBlog(includeUnpublished = false): Promise<BlogPost[]> {
    try {
      let q;
      if (includeUnpublished) {
        q = query(collection(db, BLOGS_COLLECTION), orderBy('createdAt', 'desc'));
      } else {
        q = query(
          collection(db, BLOGS_COLLECTION), 
          where('published', '==', true),
          orderBy('createdAt', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as BlogPost)
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, BLOGS_COLLECTION);
      return [];
    }
  },

  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      const q = query(collection(db, BLOGS_COLLECTION), where('slug', '==', slug));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...(doc.data() as BlogPost)
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${BLOGS_COLLECTION}/${slug}`);
      return null;
    }
  },

  async getPostById(id: string): Promise<BlogPost | null> {
    try {
      const docRef = doc(db, BLOGS_COLLECTION, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      
      return {
        id: snapshot.id,
        ...(snapshot.data() as BlogPost)
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${BLOGS_COLLECTION}/${id}`);
      return null;
    }
  },

  async createBlogPost(post: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const data = {
        ...post,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
        views: 0,
      };
      
      const result = await safeWrite(BLOGS_COLLECTION, null, data, 'create');
      if (!result || typeof result !== 'string') throw new Error('Failed to create blog post with backup');
      
      return result;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, BLOGS_COLLECTION);
      throw error;
    }
  },

  async incrementViews(id: string): Promise<void> {
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: BLOGS_COLLECTION, id, field: 'views' })
      });
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  },

  async updateBlogPost(id: string, post: Partial<BlogPost>): Promise<void> {
    try {
      const success = await safeWrite(BLOGS_COLLECTION, id, {
        ...post,
        updatedAt: new Date().toISOString(),
      }, 'update');
      if (!success) throw new Error('Failed to update blog post with backup');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${BLOGS_COLLECTION}/${id}`);
      throw error;
    }
  },

  async deleteBlogPost(id: string): Promise<void> {
    try {
      const success = await safeWrite(BLOGS_COLLECTION, id, null, 'delete');
      if (!success) throw new Error('Failed to delete blog post with backup');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${BLOGS_COLLECTION}/${id}`);
      throw error;
    }
  },

  async getRelatedPosts(postId: string, tags: string[], limitCount = 3): Promise<BlogPost[]> {
    try {
      if (!tags || tags.length === 0) return [];
      
      const q = query(
        collection(db, BLOGS_COLLECTION),
        where('published', '==', true),
        where('tags', 'array-contains-any', tags),
        limit(limitCount + 1)
      );
      
      const snapshot = await getDocs(q);
      const posts = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...(doc.data() as BlogPost)
        }))
        .filter(post => post.id !== postId)
        .slice(0, limitCount);
        
      return posts;
    } catch (error) {
      console.error('Error fetching related posts:', error);
      return [];
    }
  }
};
