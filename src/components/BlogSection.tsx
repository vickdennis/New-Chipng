import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Calendar, Clock, FileText } from 'lucide-react';
import { blogService } from '../services/blogService';
import { BlogPost } from '../types';
import { format } from 'date-fns';

const BlogSection: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        const allPosts = await blogService.getAllBlog(false);
        setPosts(allPosts.slice(0, 3));
      } catch (error) {
        console.error('Failed to load latest posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestPosts();
  }, []);

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  if (loading) return null;
  if (posts.length === 0) return null;

  return (
    <section className="py-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-20">
          <div className="max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-lime-400/10 text-lime-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
            >
              <FileText className="w-4 h-4" />
              Insights & Stories
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tighter text-zinc-950 dark:text-white"
            >
              Latest Articles
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link 
              to="/blog"
              className="group flex items-center gap-2 text-zinc-950 dark:text-white font-bold hover:text-lime-500 dark:hover:text-lime-400 transition-colors"
            >
              View All Articles
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {posts.map((post, i) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col h-full bg-white dark:bg-zinc-950"
            >
              <Link to={`/blog/${post.slug}`} className="block relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-zinc-100 dark:border-zinc-800 mb-8">
                {post.coverImage ? (
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-300 dark:text-zinc-800">
                    <FileText className="w-16 h-16" />
                  </div>
                )}
                
                {/* Floating Tags */}
                <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                  {post.tags?.slice(0, 1).map(tag => (
                    <span key={tag} className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md text-zinc-950 dark:text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/5 dark:border-white/10 shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>

              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-3 text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-4">
                  <span>{format(new Date(post.createdAt), 'MMMM dd, yyyy')}</span>
                  <span className="w-1 h-1 rounded-full bg-lime-500" />
                  <span>{calculateReadingTime(post.content)}</span>
                </div>

                <Link to={`/blog/${post.slug}`}>
                  <h3 className="text-2xl font-black mb-4 tracking-tighter leading-none text-zinc-950 dark:text-white group-hover:text-lime-500 transition-colors duration-300 line-clamp-2">
                    {post.title}
                  </h3>
                </Link>
                
                <p className="text-zinc-500 dark:text-zinc-400 mb-8 line-clamp-3 flex-1 text-sm leading-relaxed font-medium">
                  {post.excerpt}
                </p>

                <Link 
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-3 text-zinc-950 dark:text-white font-black text-xs uppercase tracking-widest group/btn"
                >
                  <span className="relative">
                    Read Publication
                    <div className="absolute -bottom-1 left-0 w-0 h-[2px] bg-lime-500 group-hover/btn:w-full transition-all duration-300" />
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
