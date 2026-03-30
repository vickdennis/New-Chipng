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
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { BlogPost } from '../types';

const BLOGS_COLLECTION = 'blogs';

export const blogService = {
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
      const docRef = await addDoc(collection(db, BLOGS_COLLECTION), {
        ...post,
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, BLOGS_COLLECTION);
      throw error;
    }
  },

  async updateBlogPost(id: string, post: Partial<BlogPost>): Promise<void> {
    try {
      const docRef = doc(db, BLOGS_COLLECTION, id);
      await updateDoc(docRef, {
        ...post,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${BLOGS_COLLECTION}/${id}`);
      throw error;
    }
  },

  async deleteBlogPost(id: string): Promise<void> {
    try {
      const docRef = doc(db, BLOGS_COLLECTION, id);
      await deleteDoc(docRef);
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
