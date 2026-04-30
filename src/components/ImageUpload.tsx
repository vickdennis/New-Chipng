import React, { useState, useRef, useEffect } from 'react';
import { uploadImage, validateImage, UploadPath } from '../services/imageService';
import { Camera, X, Loader2, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ImageUploadProps {
  userId: string;
  folder: UploadPath;
  onSuccess: (url: string) => void;
  initialImage?: string;
  label?: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'cover';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  userId,
  folder,
  onSuccess,
  initialImage,
  label = "Upload Image",
  className = "",
  aspectRatio = 'square'
}) => {
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialImage) setPreview(initialImage);
  }, [initialImage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const error = validateImage(file);
    if (error) {
      toast.error(error);
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Upload
    try {
      setUploading(true);
      setProgress(0);
      
      const url = await uploadImage(file, userId, folder, (p) => setProgress(p));
      
      onSuccess(url);
      setPreview(url); // Use real URL now
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      // Revert preview if failed
      setPreview(initialImage || null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onSuccess('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    cover: 'aspect-[3/1]'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors bg-gray-50 flex items-center justify-center ${aspectClasses[aspectRatio]}`}
      >
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={uploading}
          id={`upload-${folder}`}
        />

        <AnimatePresence mode="wait">
          {preview ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-6 text-center space-y-2"
            >
              <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
              <p className="text-sm font-medium text-gray-600">Click or drag image to upload</p>
              <p className="text-xs text-gray-400">PNG, JPG, WebP up to 2MB</p>
            </motion.div>
          )}
        </AnimatePresence>

        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
            <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-blue-500"
              />
            </div>
            <p className="text-[10px] text-white mt-1 uppercase tracking-wider font-bold">{progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
