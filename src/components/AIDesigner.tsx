import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Send, Bot, User as UserIcon, Loader2, 
  CheckCircle2, Plus, Layout, Palette, Link as LinkIcon,
  MessageSquare, Wand2, X, Mic, MicOff, Volume2, VolumeX
} from 'lucide-react';
import axios from 'axios';
import { db } from '../firebase';
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { safeWrite } from '../services/backupService';
import { User, Link as UserLink, THEMES } from '../types';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isAction?: boolean;
}

interface AIDesignerProps {
  user: any;
  profile: User | null;
  links: UserLink[];
}

const AI_DESIGNER_INSTRUCTIONS = `
You are the Chip NG "AI Designer", a professional profile engineer. 
Your goal is to help users set up their perfect link-in-bio profile instantly.
You can update their profile information (name, bio, username, cover image), add or modify links, and change their theme.

Be helpful, creative, and efficient. 
If a user mentions their social media, ask if they want you to add links for them.
If they want a specific look, suggest a theme and apply it.

You have access to the following actions:
- updateProfile: Changes name, bio, username, textColor, and coverImage URL.
- addLink: Adds a new social or web link.
- updateLink: Modifies an existing link.
- deleteLink: Removes a link.
- applyTheme: Changes the visual theme of the profile.

Always confirm with the user after performing an action.
`;

export const AIDesigner: React.FC<AIDesignerProps> = ({ user, profile, links }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your AI Designer. Tell me about yourself or what you'd like to add to your profile, and I'll build it for you instantly!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Automatically send after voice input
        setTimeout(() => handleSend(transcript), 500);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Could not hear you. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const speakResponse = async (text: string) => {
    if (isMuted) return;

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS Error:', error);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const functions: Record<string, Function> = {
    updateProfile: async (args: any) => {
      if (!user) return "Error: User not found";
      try {
        await safeWrite('users', user.uid, args, 'update');
        toast.success('Profile updated by AI!');
        return "Profile updated successfully";
      } catch (e) {
        return `Error updating profile: ${e}`;
      }
    },
    addLink: async (args: any) => {
      if (!user) return "Error: User not found";
      try {
        const nextPos = links.length;
        const linkData = {
          ...args,
          userId: user.uid,
          position: nextPos,
          active: true,
          clicks: 0,
          createdAt: new Date().toISOString()
        };
        // Creating a new doc to get an ID for safeWrite
        const newRef = doc(collection(db, 'links'));
        await safeWrite('links', newRef.id, linkData, 'create');
        toast.success(`Link "${args.title}" added!`);
        return `Link "${args.title}" added successfully`;
      } catch (e) {
        return `Error adding link: ${e}`;
      }
    },
    applyTheme: async (args: { theme: string }) => {
      if (!user) return "Error: User not found";
      if (!THEMES[args.theme as keyof typeof THEMES]) return "Error: Invalid theme name";
      try {
        await safeWrite('users', user.uid, { theme: args.theme }, 'update');
        toast.success(`Theme switched to ${args.theme}!`);
        return `Theme applied: ${args.theme}`;
      } catch (e) {
        return `Error applying theme: ${e}`;
      }
    },
    updateLink: async (args: { id: string } & Partial<UserLink>) => {
      try {
        const { id, ...data } = args;
        await safeWrite('links', id, data, 'update');
        toast.success('Link updated by AI!');
        return "Link updated successfully";
      } catch (e) {
        return `Error updating link: ${e}`;
      }
    },
    deleteLink: async (args: { id: string }) => {
      try {
        await safeWrite('links', args.id, {}, 'delete');
        toast.success('Link removed by AI!');
        return "Link deleted successfully";
      } catch (e) {
        return `Error deleting link: ${e}`;
      }
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const userMessage = (overrideInput || input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await axios.post('/api/ai/design', {
        messages: newMessages,
        userContext: {
          profile: profile || {},
          links: links || []
        }
      });

      const { text, functionCalls } = response.data;

      if (functionCalls && functionCalls.length > 0) {
        console.log('🛠️ AI Designer executing function calls:', functionCalls.length);
        const results = [];
        for (const call of functionCalls) {
          const func = functions[call.name];
          if (func) {
            const result = await func(call.args);
            results.push(result);
          }
        }
        
        if (!text && results.length > 0) {
          const successMsg = `I've updated your profile! ${results.join('. ')}`;
          setMessages(prev => [...prev, { role: 'assistant', content: successMsg }]);
          speakResponse(successMsg);
          return;
        }
      }

      if (text) {
        setMessages(prev => [...prev, { role: 'assistant', content: text }]);
        speakResponse(text);
      } else {
        const fallback = "I've processed your request! Is there anything else I can do for your profile?";
        setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
      }
    } catch (error: any) {
      console.error('❌ AI Designer Error:', error);
      const errorMsg = error.response?.data?.error || error.message;
      toast.error(`AI Error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
      {/* Header */}
      <div className="p-6 border-bottom border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-lime-400 rounded-xl flex items-center justify-center shadow-lg shadow-lime-400/20">
            <Wand2 className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <h2 className="font-bold dark:text-white">AI Profile Designer</h2>
            <p className="text-xs text-zinc-500">Fast, smart, and fully automated</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-2 rounded-lg transition-colors ${
            isMuted ? 'text-zinc-400' : 'text-lime-500 bg-lime-400/10'
          }`}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar"
      >
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' : 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/10'
                }`}>
                  {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-medium' 
                    : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-100 dark:border-zinc-700'
                }`}>
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-lime-400 text-zinc-950 flex items-center justify-center animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-lime-500" />
                  <span className="text-xs font-medium text-zinc-500">AI is designing...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex gap-3 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm focus-within:ring-2 ring-lime-400/20 transition-all">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tell me what to build... (e.g., 'Add my Instagram')"
            className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-sm dark:text-white"
          />
          <button 
            onClick={toggleListening}
            className={`p-3 rounded-xl transition-all ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-lime-400 text-zinc-950 rounded-xl hover:bg-lime-300 disabled:opacity-50 transition-all shadow-md shadow-lime-400/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {['Add bio', 'Change theme', 'Add Instagram', 'Make text red'].map((hint) => (
            <button
              key={hint}
              onClick={() => setInput(hint)}
              className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-500 hover:border-lime-400 hover:text-lime-500 transition-all"
            >
              {hint}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
