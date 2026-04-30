import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { toast } from 'sonner';

export type UploadPath = 'profiles' | 'covers' | 'backgrounds' | 'products' | 'blogs' | 'link-icons';

/**
 * Universal image upload function for Firebase Storage
 */
export const uploadImage = async (
  file: File, 
  userId: string, 
  pathType: UploadPath,
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!file) throw new Error('No file provided');
  if (!file.type.startsWith('image/')) throw new Error('File must be an image');

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}_${randomStr}_${safeFileName}`;

  // Map path types to storage paths
  const pathMap: Record<UploadPath, string> = {
    profiles: `profile-images/${userId}/${filename}`,
    covers: `cover-images/${userId}/${filename}`,
    backgrounds: `background-images/${userId}/${filename}`,
    products: `shop-images/${userId}/${filename}`,
    blogs: `blog-images/${userId}/${filename}`,
    'link-icons': `link-icons/${userId}/${filename}`
  };

  const storagePath = pathMap[pathType];
  const storageRef = ref(storage, storagePath);

  try {
    if (onProgress) onProgress(10);
    
    // Upload file using client-side SDK
    const snapshot = await uploadBytes(storageRef, file);
    
    if (onProgress) onProgress(90);
    
    // Get download URL using client-side SDK
    const url = await getDownloadURL(snapshot.ref);
    
    if (onProgress) onProgress(100);
    
    return url;
  } catch (error: any) {
    console.error(`Upload failed to ${storagePath}:`, error);
    throw new Error(error.message || 'Failed to upload image');
  }
};

/**
 * Validates image before upload
 */
export const validateImage = (file: File, maxSizeMB: number = 2): string | null => {
  if (!file.type.startsWith('image/')) {
    return 'File must be an image';
  }
  
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxSizeMB) {
    return `Image is too large. Max size is ${maxSizeMB}MB.`;
  }
  
  return null;
};
