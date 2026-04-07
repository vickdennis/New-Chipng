import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Save, 
  X, 
  Maximize2, 
  Minimize2,
  Sparkles,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { blogService } from '../services/blogService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface GeneratedPost {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  slug: string;
}

export interface BlogGeneratorChatbotRef {
  open: () => void;
}

const BlogGeneratorChatbot = React.forwardRef<BlogGeneratorChatbotRef>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  React.useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true)
  }));
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! I'm your SEO Blog Assistant. Tell me a topic or keywords, and I'll generate a high-quality, SEO-optimized blog post for you." 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generatePost = async (prompt: string) => {
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      
      const systemInstruction = `You are an expert SEO content writer. 
      Your goal is to write high-quality, engaging, and SEO-optimized blog posts.
      When a user provides a topic or keywords, generate a full blog post in JSON format with the following structure:
      {
        "title": "Catchy SEO Title",
        "excerpt": "A brief, engaging summary for meta description",
        "content": "Full blog post content in Markdown format, including headings, lists, and bold text for key terms.",
        "tags": ["tag1", "tag2", "tag3"],
        "slug": "url-friendly-slug"
      }
      Ensure the content is informative, well-structured, and uses relevant keywords naturally.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              slug: { type: Type.STRING }
            },
            required: ["title", "excerpt", "content", "tags", "slug"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setGeneratedPost(result);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I've generated a blog post titled: **${result.title}**. You can preview and save it below.` 
      }]);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate blog post');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error while generating the post. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    await generatePost(userMessage);
  };

  const handleSavePost = async () => {
    if (!generatedPost) return;

    try {
      await blogService.createBlogPost({
        title: generatedPost.title,
        excerpt: generatedPost.excerpt,
        content: generatedPost.content,
        tags: generatedPost.tags,
        slug: generatedPost.slug,
        published: false, // Save as draft by default
        author: 'AI Assistant',
        coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1000',
        seoTitle: generatedPost.title,
        seoDescription: generatedPost.excerpt,
        seoKeywords: generatedPost.tags,
      });
      toast.success('Blog post saved as draft!');
      setGeneratedPost(null);
    } catch (error) {
      toast.error('Failed to save blog post');
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-lime-500 hover:bg-lime-600 text-zinc-950 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className={`fixed bottom-24 right-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${
              isMaximized ? 'w-[calc(100vw-3rem)] h-[calc(100vh-8rem)]' : 'w-96 h-[600px]'
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-lime-400 rounded-xl flex items-center justify-center text-zinc-950">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-950 dark:text-white">AI Blog Generator</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-500"
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600' : 'bg-lime-400 text-zinc-950'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-lime-500 text-zinc-950 rounded-tr-none' 
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 rounded-tl-none'
                    }`}>
                      <div className="prose dark:prose-invert prose-sm max-w-none">
                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-lg bg-lime-400 text-zinc-950 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-lime-500" />
                      <span className="text-sm text-zinc-500">Generating SEO content...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Preview Area (if post generated) */}
            {generatedPost && (
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    <FileText className="w-3 h-3" /> Preview Generated Post
                  </div>
                  <button
                    onClick={handleSavePost}
                    className="flex items-center gap-2 px-3 py-1.5 bg-lime-500 hover:bg-lime-600 text-zinc-950 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Save className="w-3 h-3" /> Save as Draft
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm">
                  <h4 className="font-bold mb-2 dark:text-white">{generatedPost.title}</h4>
                  <div className="prose dark:prose-invert prose-xs max-w-none">
                    <ReactMarkdown>{generatedPost.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Enter a topic (e.g., 'Benefits of Link-in-Bio tools')"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white text-sm"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-lime-500 hover:bg-lime-600 text-zinc-950 rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-lime-500"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-2 text-[10px] text-center text-zinc-500 uppercase tracking-widest font-bold">
                Powered by Gemini AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default BlogGeneratorChatbot;
