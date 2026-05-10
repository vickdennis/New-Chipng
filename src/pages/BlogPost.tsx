import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, Tag, ArrowLeft, ArrowRight,
  Share2, Twitter, Linkedin, Facebook,
  Clock, User, ChevronRight, FileText,
  MessageCircle, Copy, Check
} from 'lucide-react';
import { blogService } from '../services/blogService';
import { BlogPost as BlogPostType } from '../types';
import { format } from 'date-fns';

const formatDate = (date: any, formatStr: string) => {
  if (!date) return 'Recently';
  try {
    const d = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return 'Recently';
    return format(d, formatStr);
  } catch (e) {
    return 'Recently';
  }
};
import { toast } from 'sonner';
import SEO from '../components/SEO';
import Logo from '../components/Logo';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { BASE_URL } from '../constants';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      try {
        const data = await blogService.getPostBySlug(slug);
        if (data) {
          setPost(data);
          // Increment views
          blogService.incrementViews(data.id);
          // Fetch related posts
          if (data.tags && data.tags.length > 0) {
            const related = await blogService.getRelatedPosts(data.id, data.tags);
            setRelatedPosts(related);
          }
        } else {
          toast.error('Article not found');
          navigate('/blog');
        }
      } catch (error) {
        console.error('Failed to load blog post:', error);
        toast.error('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, navigate]);

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnTwitter = () => {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500 dark:border-lime-400"></div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white transition-colors duration-300">
      <SEO 
        title={post.seoTitle || post.title}
        description={post.seoDescription || post.excerpt}
        keywords={post.seoKeywords || post.tags}
        image={post.coverImage}
        url={`${BASE_URL}/blog/${post.slug}`}
        type="article"
        author={post.author}
        publishedTime={post.createdAt}
        modifiedTime={post.updatedAt}
      />

      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-40">
        {/* Back Button */}
        <Link 
          to="/blog"
          className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors mb-12 font-bold group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Blog
        </Link>

        {/* Article Header */}
        <div className="mb-16">
          <div className="flex flex-wrap gap-3 mb-8">
            {post.tags?.map(tag => (
              <span key={tag} className="bg-lime-400/10 text-lime-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-lime-400/20">
                {tag}
              </span>
            ))}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[1.1]">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-8 py-8 border-y border-zinc-200 dark:border-zinc-900">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-600 border border-zinc-200 dark:border-zinc-700">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg text-zinc-950 dark:text-white">{post.author}</div>
                <div className="text-zinc-500 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.createdAt, 'MMMM dd, yyyy')}
                  <span>•</span>
                  <Clock className="w-4 h-4" />
                  {calculateReadingTime(post.content)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={shareOnTwitter}
                className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                title="Share on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </button>
              <button 
                onClick={shareOnLinkedIn}
                className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                title="Share on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
              <button 
                onClick={handleCopyLink}
                className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                title="Copy Link"
              >
                {copied ? <Check className="w-5 h-5 text-lime-500 dark:text-lime-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-20">
            <img 
              src={post.coverImage} 
              alt={post.title} 
              className="w-full h-auto aspect-[16/9] object-cover rounded-[3rem] border border-zinc-800 shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Article Content */}
        <article className="prose dark:prose-invert prose-lime prose-xl max-w-none mb-20 text-zinc-800 dark:text-zinc-300">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        {/* Article Footer */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-12 text-center mb-20">
          <h2 className="text-3xl font-bold mb-4 tracking-tight text-zinc-950 dark:text-white">Enjoyed this article?</h2>
          <p className="text-zinc-600 dark:text-zinc-500 mb-8 max-w-md mx-auto">
            Share it with your network or join Chip NG to start building your own digital identity.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={shareOnTwitter}
              className="flex items-center gap-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 px-6 py-3 rounded-2xl font-bold transition-all text-zinc-950 dark:text-white"
            >
              <Twitter className="w-5 h-5" />
              Share on Twitter
            </button>
            <Link 
              to="/signup"
              className="flex items-center gap-2 bg-lime-400 text-zinc-950 px-8 py-3 rounded-2xl font-bold hover:bg-lime-300 transition-all"
            >
              Get Started with Chip NG
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-12 tracking-tight text-zinc-950 dark:text-white">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Link 
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="group bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 hover:border-lime-500/50 dark:hover:border-lime-400/50 transition-all flex flex-col"
                >
                  <div className="flex items-center gap-4 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(relatedPost.createdAt, 'MMM dd, yyyy')}
                  </div>
                  <h3 className="text-xl font-bold mb-4 group-hover:text-lime-500 dark:group-hover:text-lime-400 transition-colors line-clamp-2 text-zinc-950 dark:text-white">
                    {relatedPost.title}
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-500 text-sm line-clamp-2 mb-6 flex-1">
                    {relatedPost.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-zinc-950 dark:text-white font-bold group-hover:text-lime-500 dark:group-hover:text-lime-400 transition-all text-sm">
                    Read More
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
