import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, Eye, EyeOff, 
  Image as ImageIcon, Tag, Globe, 
  FileText, Search, Loader2, Trash2,
  Upload, X, CheckCircle2, Sparkles, Wand2
} from 'lucide-react';
import axios from 'axios';
import { blogService } from '../services/blogService';
import { BlogPost } from '../types';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import ImageUpload from '../components/ImageUpload';
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';
import ThemeToggle from '../components/ThemeToggle';
import { aiWriter } from '../services/geminiService';

const AdminBlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(id ? true : false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>>({
    userId: user?.uid || '',
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverImage: '',
    tags: [],
    author: user?.displayName || user?.email || 'Admin',
    published: false,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: []
  });

  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a topic for the AI to write about');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('AI is writing your blog post...');
    
    try {
      const data = await aiWriter(aiPrompt);
      
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        content: data.content || prev.content,
        excerpt: data.excerpt || prev.excerpt,
        seoTitle: data.seoTitle || prev.seoTitle,
        seoDescription: data.seoDescription || prev.seoDescription,
        seoKeywords: data.seoKeywords || prev.seoKeywords,
        tags: data.tags || prev.tags
      }));
      toast.success('Blog post generated successfully!', { id: toastId });
    } catch (error: any) {
      console.error('AI Generation error:', error);
      toast.error(`Failed to generate blog post: ${error.message}`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (id) {
      const fetchPost = async () => {
        try {
          const post = await blogService.getPostById(id);
          if (post) {
            // Check ownership
            if (post.userId !== user.uid && user.role !== 'admin') {
              toast.error('You do not have permission to edit this post');
              navigate('/dashboard');
              return;
            }
            const { id: _, createdAt: __, updatedAt: ___, ...rest } = post;
            setFormData(rest);
          } else {
            toast.error('Post not found');
            navigate(user.role === 'admin' ? '/admin/blog' : '/dashboard');
          }
        } catch (error) {
          toast.error('Failed to load post');
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    } else {
      setFormData(prev => ({ ...prev, userId: user.uid }));
    }
  }, [id, user, navigate]);

  // Helper to generate slug from title
  useEffect(() => {
    if (!id && formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, id]);

  const handleSubmit = async (isPublished: boolean) => {
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      let coverImageUrl = formData.coverImage;

      // Upload image if a new file was selected
      if (imageFile && user) {
        setUploadProgress(0);
        console.log('Starting blog image upload:', imageFile.name);
        try {
          coverImageUrl = await blogService.uploadImage(imageFile, user.uid, (progress) => {
            setUploadProgress(progress);
          });
          console.log('Blog image upload successful:', coverImageUrl);
        } catch (uploadError: any) {
          console.error('Upload error:', uploadError);
          toast.error(`Image upload failed: ${uploadError.message || 'Unknown error'}`);
          setSaving(false);
          setUploadProgress(null);
          return;
        }
      }

      const dataToSave = { ...formData, coverImage: coverImageUrl, published: isPublished };
      try {
        if (id) {
          await blogService.updateBlogPost(id, dataToSave);
          toast.success('Post updated successfully');
        } else {
          await blogService.createBlogPost({ ...dataToSave, userId: user?.uid });
          toast.success('Post created successfully');
        }
        navigate(user?.role === 'admin' ? '/admin/blog' : '/dashboard');
      } catch (saveError: any) {
        console.error('Save error:', saveError);
        toast.error(`Failed to save post: ${saveError.message || 'Permission denied'}`);
      }
    } catch (error: any) {
      console.error('General error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags?.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tag) }));
  };

  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      e.preventDefault();
      if (!formData.seoKeywords?.includes(keywordInput.trim())) {
        setFormData(prev => ({ ...prev, seoKeywords: [...(prev.seoKeywords || []), keywordInput.trim()] }));
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({ ...prev, seoKeywords: prev.seoKeywords?.filter(k => k !== keyword) }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center transition-colors duration-300">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500 dark:border-lime-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link to="/admin/blog" className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all text-zinc-950 dark:text-white">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <ThemeToggle />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter text-zinc-950 dark:text-white">{id ? 'Edit Post' : 'New Post'}</h1>
              <p className="text-zinc-500">{id ? 'Update your existing content' : 'Share something new with your audience'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setPreview(!preview)}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all text-zinc-950 dark:text-white"
            >
              {preview ? <FileText className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              {preview ? 'Editor' : 'Preview'}
            </button>
            <button 
              onClick={() => handleSubmit(false)}
              disabled={saving}
              className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-950 dark:text-white px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Draft
            </button>
            <button 
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="flex items-center gap-2 bg-lime-400 text-zinc-950 px-8 py-3 rounded-2xl font-bold hover:bg-lime-300 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {id ? 'Update & Publish' : 'Publish Post'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* AI Generator Box */}
            {!preview && !id && (
              <div className="bg-gradient-to-br from-lime-400/10 to-blue-500/10 border border-lime-400/20 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-lime-400 rounded-2xl flex items-center justify-center shadow-lg shadow-lime-400/20">
                    <Sparkles className="w-5 h-5 text-zinc-950" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold dark:text-white">AI Blog Writer</h3>
                    <p className="text-sm text-zinc-500">Generate a full SEO-optimized blog post in seconds</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Enter a topic (e.g. The future of Link-in-bio tools in Nigeria)"
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                  />
                  <button 
                    onClick={generateWithAI}
                    disabled={isGenerating}
                    className="px-8 py-4 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 shadow-xl"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                    Generate
                  </button>
                </div>
              </div>
            )}

            {preview ? (
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-12 min-h-[600px]">
                {formData.coverImage && (
                  <img 
                    src={formData.coverImage} 
                    alt="Cover" 
                    className="w-full h-80 object-cover rounded-3xl mb-12 border border-zinc-200 dark:border-zinc-800"
                    referrerPolicy="no-referrer"
                  />
                )}
                <h1 className="text-5xl font-bold mb-6 tracking-tighter text-zinc-950 dark:text-white">{formData.title || 'Untitled Post'}</h1>
                <div className="flex items-center gap-4 text-zinc-500 mb-12">
                  <span className="font-bold text-zinc-700 dark:text-zinc-300">{formData.author}</span>
                  <span>•</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="prose dark:prose-invert prose-lime max-w-none">
                  <ReactMarkdown>{formData.content || '_No content yet..._'}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-4">Title</label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a catchy title..."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl px-8 py-6 text-2xl font-bold focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all text-zinc-950 dark:text-white"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-4">Slug (URL)</label>
                  <div className="relative">
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 w-5 h-5" />
                    <input 
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-friendly-slug"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-16 pr-8 py-4 font-mono text-zinc-600 dark:text-zinc-400 focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-4">Content (Markdown)</label>
                  <textarea 
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your story here... Markdown is supported!"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] px-8 py-8 min-h-[500px] font-mono text-zinc-700 dark:text-zinc-300 focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Settings */}
          <div className="space-y-8">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Status</label>
                <div 
                  onClick={() => setFormData(prev => ({ ...prev, published: !prev.published }))}
                  className={clsx(
                    "flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all",
                    formData.published ? "bg-lime-500/10 dark:bg-lime-400/10 border-lime-500/50 dark:border-lime-400/50" : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {formData.published ? <Eye className="w-5 h-5 text-lime-600 dark:text-lime-400" /> : <EyeOff className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />}
                    <span className={clsx("font-bold", formData.published ? "text-lime-600 dark:text-lime-400" : "text-zinc-400 dark:text-zinc-500")}>
                      {formData.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className={clsx(
                    "w-4 h-4 rounded-full",
                    formData.published ? "bg-lime-500 dark:bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]" : "bg-zinc-300 dark:bg-zinc-600"
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Cover Image</label>
                
                <ImageUpload 
                  folder="blogs"
                  userId={user?.uid || 'admin'}
                  initialImage={formData.coverImage}
                  onSuccess={(url) => {
                    setFormData(prev => ({ ...prev, coverImage: url }));
                    setImageFile(null);
                  }}
                  label="Blog Thumbnail"
                  aspectRatio="video"
                />

                <div className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.2em]">OR</span>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Paste Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 w-4 h-4" />
                    <input 
                      type="text"
                      value={formData.coverImage}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, coverImage: e.target.value }));
                        setImageFile(null); // Clear file if URL is pasted
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all text-zinc-950 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Excerpt</label>
                <textarea 
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Short summary for the list view..."
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm min-h-[100px] focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all resize-none text-zinc-950 dark:text-white"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Tags</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags?.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-700">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 w-4 h-4" />
                  <input 
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Press Enter to add tag"
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all text-zinc-950 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 space-y-8">
              <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-950 dark:text-white">
                <Search className="w-5 h-5 text-lime-500 dark:text-lime-400" />
                SEO Settings
              </h3>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">SEO Title</label>
                <input 
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="Meta title for Google..."
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all text-zinc-950 dark:text-white"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">SEO Description</label>
                <textarea 
                  value={formData.seoDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder="Meta description for search results..."
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm min-h-[100px] focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all resize-none text-zinc-950 dark:text-white"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">SEO Keywords</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.seoKeywords?.map(keyword => (
                    <span key={keyword} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-700">
                      {keyword}
                      <button onClick={() => removeKeyword(keyword)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <input 
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleAddKeyword}
                  placeholder="Press Enter to add keyword"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all text-zinc-950 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBlogEditor;
