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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-lime-500/50 dark:hover:border-lime-400/50 transition-all flex flex-col"
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

                <Link to={`/blog/${post.slug}`} className="block group-hover:text-lime-500 dark:group-hover:text-lime-400 transition-colors">
                  <h3 className="text-2xl font-bold mb-4 tracking-tight line-clamp-2 text-zinc-950 dark:text-white">{post.title}</h3>
                </Link>
                
                <p className="text-zinc-600 dark:text-zinc-500 mb-8 line-clamp-3 flex-1">{post.excerpt}</p>

                <Link 
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-zinc-950 dark:text-white font-bold group-hover:text-lime-500 dark:group-hover:text-lime-400 transition-all"
                >
                  Read More
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
