import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, X, Send, Mic, MicOff, 
  Volume2, VolumeX, Loader2, Sparkles,
  User, Bot, Headphones, CheckCircle2
} from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage, Type, FunctionDeclaration } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'bot';
  content: string;
  isAudio?: boolean;
  suggestion?: any;
}

const suggestBlogContent: FunctionDeclaration = {
  name: "suggestBlogContent",
  description: "Generate a blog post structure including title, content, excerpt, tags, and SEO fields based on a topic.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING, description: "The main topic or title of the blog post." },
      tone: { type: Type.STRING, description: "The tone of the post (e.g., professional, casual, technical)." }
    },
    required: ["topic"]
  }
};

const suggestSEOMetadata: FunctionDeclaration = {
  name: "suggestSEOMetadata",
  description: "Generate SEO metadata (title, description, keywords) for a blog post.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      content: { type: Type.STRING, description: "The full content of the blog post." }
    },
    required: ["content"]
  }
};

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Hello! I am your Chip NG assistant. I can help you with your profile or even assist in managing your blog. How can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const liveSessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Text Chat Logic
  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key is not configured');
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: "You are a helpful assistant for Chip NG, a link-in-bio platform in Nigeria. You help users with their profiles, analytics, and subscriptions. You also assist admins in blog management by generating blog posts, meta descriptions, tags, and slugs. When asked for blog help, use the provided tools to generate structured suggestions.",
          tools: [{ functionDeclarations: [suggestBlogContent, suggestSEOMetadata] }]
        }
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          if (call.name === 'suggestBlogContent') {
            const { topic, tone } = call.args as any;
            // Use Pro model for complex content generation
            const genResponse = await ai.models.generateContent({
              model: "gemini-3.1-pro-preview",
              contents: `Generate a full blog post structure for the topic: "${topic}" with a ${tone || 'professional'} tone. Return as JSON with fields: title, content, excerpt, tags (array), slug, seoTitle, seoDescription, seoKeywords (array).`,
              config: { responseMimeType: "application/json" }
            });
            
            if (genResponse.text) {
              // Sanitize JSON response (remove markdown blocks if present)
              const cleanJson = genResponse.text.replace(/```json\n?|```/g, '').trim();
              const suggestion = JSON.parse(cleanJson);
              setMessages(prev => [...prev, { 
                role: 'bot', 
                content: `I've generated a blog post suggestion for "**${suggestion.title}**". You can see the details below and apply them to your editor.`,
                suggestion 
              }]);
            }
          } else if (call.name === 'suggestSEOMetadata') {
            const { content } = call.args as any;
            const genResponse = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Generate SEO metadata for this content: "${content.substring(0, 500)}...". Return as JSON with fields: seoTitle, seoDescription, seoKeywords (array).`,
              config: { responseMimeType: "application/json" }
            });
            
            if (genResponse.text) {
              const cleanJson = genResponse.text.replace(/```json\n?|```/g, '').trim();
              const suggestion = JSON.parse(cleanJson);
              setMessages(prev => [...prev, { 
                role: 'bot', 
                content: `Here is the suggested SEO metadata for your post:`,
                suggestion 
              }]);
            }
          }
        }
      } else {
        const botText = response.text || "I'm sorry, I couldn't process that. Please try rephrasing your request.";
        setMessages(prev => [...prev, { role: 'bot', content: botText }]);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg = error.message || 'Failed to get response from AI';
      toast.error(errorMsg);
      setMessages(prev => [...prev, { role: 'bot', content: `Error: ${errorMsg}. Please check your connection or try again later.` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const applySuggestion = (suggestion: any) => {
    // Dispatch a custom event that AdminBlogEditor can listen to
    window.dispatchEvent(new CustomEvent('apply-blog-suggestion', { detail: suggestion }));
    toast.success('Suggestion applied to editor!');
  };

  // Voice Chat Logic (Live API)
  const startLiveSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a friendly voice assistant for Chip NG. Speak naturally and helpfully. Keep your spoken responses short.",
        },
        callbacks: {
          onopen: () => {
            setIsLive(true);
            startMic();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Data = message.serverContent.modelTurn.parts[0].inlineData.data;
              const arrayBuffer = base64ToArrayBuffer(base64Data);
              const float32Data = pcmToFloat32(new Int16Array(arrayBuffer));
              audioQueueRef.current.push(float32Data);
              if (!isPlayingRef.current) {
                playNextInQueue();
              }
            }
            
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onclose: () => {
            stopLiveSession();
          },
          onerror: (err) => {
            console.error('Live error:', err);
            stopLiveSession();
          }
        }
      });

      liveSessionRef.current = session;
    } catch (error) {
      console.error('Failed to start live session:', error);
      toast.error('Microphone access or AI connection failed');
    }
  };

  const stopLiveSession = () => {
    setIsLive(false);
    stopMic();
    if (liveSessionRef.current) {
      liveSessionRef.current.close();
      liveSessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const source = audioContextRef.current!.createMediaStreamSource(stream);
      const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!isLive || isMuted) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = float32ToPcm(inputData);
        const base64Data = arrayBufferToBase64(pcmData.buffer);
        
        if (liveSessionRef.current) {
          liveSessionRef.current.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current!.destination);
      processorRef.current = processor;
    } catch (err) {
      console.error('Mic error:', err);
      stopLiveSession();
    }
  };

  const stopMic = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
  };

  const playNextInQueue = () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const data = audioQueueRef.current.shift()!;
    const buffer = audioContextRef.current.createBuffer(1, data.length, 16000);
    buffer.getChannelData(0).set(data);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => playNextInQueue();
    source.start();
  };

  // Helpers
  const base64ToArrayBuffer = (base64: string) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const pcmToFloat32 = (pcmData: Int16Array) => {
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / 32768;
    }
    return float32Data;
  };

  const float32ToPcm = (float32Data: Float32Array) => {
    const pcmData = new Int16Array(float32Data.length);
    for (let i = 0; i < float32Data.length; i++) {
      pcmData[i] = Math.max(-1, Math.min(1, float32Data[i])) * 32767;
    }
    return pcmData;
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-lime-400 text-zinc-950 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[9999] group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <MessageCircle className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-lime-400 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[90vw] sm:w-[400px] h-[600px] max-h-[70vh] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden z-[9999]"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-lime-400 rounded-2xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-zinc-950" />
                </div>
                <div>
                  <h3 className="font-bold dark:text-white">Chip Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">AI Powered</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (mode === 'voice') stopLiveSession();
                    setMode(mode === 'text' ? 'voice' : 'text');
                  }}
                  className={`p-2 rounded-xl transition-all ${mode === 'voice' ? 'bg-lime-400 text-zinc-950' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'}`}
                  title={mode === 'text' ? 'Switch to Voice' : 'Switch to Text'}
                >
                  {mode === 'text' ? <Mic className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {mode === 'text' ? (
                <>
                  <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
                  >
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] p-4 rounded-2xl ${
                          msg.role === 'user' 
                            ? 'bg-lime-400 text-zinc-950 rounded-tr-none' 
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-none'
                        }`}>
                          <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          {msg.suggestion && (
                            <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-lime-500/30 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-lime-600 dark:text-lime-400">AI Suggestion</span>
                                <button 
                                  onClick={() => applySuggestion(msg.suggestion)}
                                  className="px-3 py-1 bg-lime-400 text-zinc-950 rounded-lg text-[10px] font-bold hover:bg-lime-300 transition-all flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> Apply to Editor
                                </button>
                              </div>
                              <div className="text-xs space-y-1">
                                {msg.suggestion.title && <p><strong>Title:</strong> {msg.suggestion.title}</p>}
                                {msg.suggestion.tags && <p><strong>Tags:</strong> {msg.suggestion.tags.join(', ')}</p>}
                                {msg.suggestion.seoTitle && <p><strong>SEO Title:</strong> {msg.suggestion.seoTitle}</p>}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl rounded-tl-none">
                          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="relative">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isTyping}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-lime-400 text-zinc-950 rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
                  <div className="relative">
                    <motion.div
                      animate={{
                        scale: isLive ? [1, 1.2, 1] : 1,
                        opacity: isLive ? [0.5, 1, 0.5] : 0.5,
                      }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-lime-400 rounded-full blur-2xl"
                    />
                    <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isLive ? 'bg-lime-400 text-zinc-950 scale-110' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                      {isLive ? <Volume2 className="w-12 h-12" /> : <Headphones className="w-12 h-12" />}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xl font-bold dark:text-white">
                      {isLive ? 'Listening...' : 'Voice Mode'}
                    </h4>
                    <p className="text-zinc-500 text-sm max-w-[200px]">
                      {isLive ? 'Speak naturally to interact with the AI assistant.' : 'Click start to begin a real-time voice conversation.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {!isLive ? (
                      <button
                        onClick={startLiveSession}
                        className="px-8 py-4 bg-lime-400 text-zinc-950 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-lime-400/20"
                      >
                        <Mic className="w-5 h-5" /> Start Conversation
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-4 rounded-2xl border-2 transition-all ${isMuted ? 'border-red-500 text-red-500 bg-red-500/5' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500'}`}
                        >
                          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                        </button>
                        <button
                          onClick={stopLiveSession}
                          className="px-8 py-4 bg-red-500 text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-red-500/20"
                        >
                          <X className="w-5 h-5" /> End Call
                        </button>
                      </>
                    )}
                  </div>

                  {isLive && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <motion.div
                          key={i}
                          animate={{ height: [8, 24, 8] }}
                          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                          className="w-1 bg-lime-400 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3 text-lime-500" />
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Powered by Gemini AI</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
