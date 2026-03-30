import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Eye, EyeOff, 
  ArrowLeft, Search, Calendar, Tag,
  FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import { blogService } from '../services/blogService';
import { BlogPost } from '../types';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const AdminBlogDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchPosts = async () => {
      try {
        const allPosts = await blogService.getAllBlog(true);
        setPosts(allPosts);
      } catch (error) {
        toast.error('Failed to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, navigate]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await blogService.deleteBlogPost(id);
      setPosts(posts.filter(p => p.id !== id));
      toast.success('Post deleted successfully');
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      await blogService.updateBlogPost(post.id, { published: !post.published });
      setPosts(posts.map(p => p.id === post.id ? { ...p, published: !p.published } : p));
      toast.success(`Post ${!post.published ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      toast.error('Failed to update post status');
    }
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.excerpt.toLowerCase().includes(search.toLowerCase())
  );

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
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link to="/admin" className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all text-zinc-950 dark:text-white">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <ThemeToggle />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter text-zinc-950 dark:text-white">Blog Management</h1>
              <p className="text-zinc-500">Create and manage content for Chip NG</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 w-5 h-5" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all text-zinc-950 dark:text-white"
              />
            </div>
            <Link 
              to="/admin/blog/new"
              className="flex items-center gap-2 bg-lime-400 text-zinc-950 px-6 py-3 rounded-2xl font-bold hover:bg-lime-300 transition-all whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              New Post
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {filteredPosts.length > 0 ? (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Post</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Date</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            {post.coverImage ? (
                              <img 
                                src={post.coverImage} 
                                alt={post.title} 
                                className="w-16 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-600">
                                <FileText className="w-8 h-8" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-lg group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors text-zinc-950 dark:text-white">{post.title}</div>
                              <div className="text-sm text-zinc-500 line-clamp-1">{post.excerpt}</div>
                              <div className="flex items-center gap-2 mt-1">
                                {post.tags?.map(tag => (
                                  <span key={tag} className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => handleTogglePublish(post)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                              post.published 
                                ? 'bg-lime-500/10 dark:bg-lime-400/10 text-lime-600 dark:text-lime-400 hover:bg-lime-500/20 dark:hover:bg-lime-400/20' 
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {post.published ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {post.published ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-8 py-6 text-zinc-500 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link 
                              to={`/blog/${post.slug}`}
                              target="_blank"
                              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400"
                              title="Preview"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                            <Link 
                              to={`/admin/blog/edit/${post.id}`}
                              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                              title="Edit"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                            <button 
                              onClick={() => handleDelete(post.id)}
                              className="p-2 hover:bg-red-500/10 dark:hover:bg-red-900/20 rounded-lg transition-colors text-zinc-400 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-20 text-center">
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-400 dark:text-zinc-600">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-zinc-950 dark:text-white">No posts found</h3>
              <p className="text-zinc-500 mb-8">Start writing your first blog post to grow your brand.</p>
              <Link 
                to="/admin/blog/new"
                className="inline-flex items-center gap-2 bg-lime-400 text-zinc-950 px-8 py-4 rounded-2xl font-bold hover:bg-lime-300 transition-all"
              >
                <Plus className="w-5 h-5" />
                Create First Post
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlogDashboard;
