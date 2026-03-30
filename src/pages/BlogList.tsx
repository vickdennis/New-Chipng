import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, Tag, ArrowRight, 
  Search, Filter, ChevronRight,
  FileText, Clock
} from 'lucide-react';
import { blogService } from '../services/blogService';
import { BlogPost } from '../types';
import { format } from 'date-fns';
import SEO from '../components/SEO';
import Logo from '../components/Logo';
import { motion } from 'motion/react';

const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const publishedPosts = await blogService.getAllBlog(false);
        setPosts(publishedPosts);
      } catch (error) {
        console.error('Failed to load blog posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const allTags = Array.from(new Set(posts.flatMap(p => p.tags || [])));

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                         p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !selectedTag || p.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SEO 
        title="Blog | Chip NG" 
        description="Insights, guides, and stories about digital identity, networking, and the future of personal branding."
        url="https://chipng.com/blog"
      />

      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-zinc-400 hover:text-white transition-colors font-medium">Home</Link>
            <Link to="/blog" className="text-lime-400 font-bold">Blog</Link>
            <Link to="/pricing" className="text-zinc-400 hover:text-white transition-colors font-medium">Pricing</Link>
          </nav>
          <Link 
            to="/signup"
            className="bg-white text-zinc-950 px-6 py-2.5 rounded-full font-bold hover:bg-zinc-200 transition-all text-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-lime-400/10 text-lime-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
          >
            <FileText className="w-4 h-4" />
            The Chip NG Blog
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent"
          >
            Stories for the digital age
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-500 max-w-2xl mx-auto"
          >
            Exploring the intersection of identity, technology, and human connection.
          </motion.p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setSelectedTag(null)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                !selectedTag ? 'bg-white text-zinc-950' : 'bg-zinc-900 text-zinc-500 hover:text-white'
              }`}
            >
              All Posts
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  selectedTag === tag ? 'bg-white text-zinc-950' : 'bg-zinc-900 text-zinc-500 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-lime-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Blog Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, i) => (
              <motion.article 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-lime-400/50 transition-all flex flex-col"
              >
                <Link to={`/blog/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden">
                  {post.coverImage ? (
                    <img 
                      src={post.coverImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-700">
                      <FileText className="w-20 h-20" />
                    </div>
                  )}
                  <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                    {post.tags?.slice(0, 2).map(tag => (
                      <span key={tag} className="bg-zinc-950/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-4 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {calculateReadingTime(post.content)}
                    </div>
                  </div>

                  <Link to={`/blog/${post.slug}`} className="block group-hover:text-lime-400 transition-colors">
                    <h2 className="text-2xl font-bold mb-4 tracking-tight line-clamp-2">{post.title}</h2>
                  </Link>
                  
                  <p className="text-zinc-500 mb-8 line-clamp-3 flex-1">{post.excerpt}</p>

                  <Link 
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-2 text-white font-bold group-hover:text-lime-400 transition-all"
                  >
                    Read Article
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="py-40 text-center">
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-700">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No articles found</h3>
            <p className="text-zinc-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Logo size="md" className="mb-8 mx-auto" />
          <p className="text-zinc-500 mb-12 max-w-md mx-auto">
            Join 10,000+ professionals growing their digital presence with Chip NG.
          </p>
          <div className="flex justify-center gap-8 mb-12">
            <Link to="/" className="text-zinc-400 hover:text-white transition-colors">Home</Link>
            <Link to="/blog" className="text-zinc-400 hover:text-white transition-colors">Blog</Link>
            <Link to="/pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</Link>
            <Link to="/login" className="text-zinc-400 hover:text-white transition-colors">Login</Link>
          </div>
          <div className="text-zinc-600 text-sm">
            © {new Date().getFullYear()} Chip NG. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogList;
