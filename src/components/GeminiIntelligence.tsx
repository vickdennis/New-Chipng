import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, Wand2, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface GeminiIntelligenceProps {
  profile: any;
  links: any[];
}

export default function GeminiIntelligence({ profile, links }: GeminiIntelligenceProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const analyzeProfile = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this user's link-in-bio profile and provide 3 actionable tips to improve their engagement and branding.
        
        Profile Name: ${profile.display_name}
        Username: ${profile.username}
        Bio: ${profile.bio}
        Links: ${links.map(l => `${l.title} (${l.url})`).join(', ')}
        
        Provide the response in a clear, professional tone.`,
      });

      setResult(response.text || "No analysis generated.");
    } catch (err: any) {
      console.error("Gemini Error:", err);
      setError("Failed to analyze profile. Please ensure your Gemini API key is configured.");
    } finally {
      setLoading(false);
    }
  };

  const generateBio = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 3 creative and catchy bio options for a link-in-bio profile based on these details:
        
        Name: ${profile.display_name}
        Current Bio: ${profile.bio}
        Links: ${links.map(l => l.title).join(', ')}
        
        Keep each bio under 150 characters.`,
      });

      setResult(response.text || "No bio options generated.");
    } catch (err: any) {
      console.error("Gemini Error:", err);
      setError("Failed to generate bio. Please ensure your Gemini API key is configured.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles size={24} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Gemini Intelligence</h2>
              <p className="text-zinc-500 dark:text-zinc-400">AI-powered insights to grow your audience.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={analyzeProfile}
              disabled={loading}
              className="flex flex-col items-start gap-4 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 hover:border-amber-500/50 transition-all group text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 group-hover:text-amber-500 transition-colors">
                <Brain size={20} />
              </div>
              <div>
                <div className="font-bold text-zinc-900 dark:text-white">Analyze Profile</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Get actionable tips to improve your branding and engagement.</div>
              </div>
            </button>

            <button 
              onClick={generateBio}
              disabled={loading}
              className="flex flex-col items-start gap-4 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 hover:border-amber-500/50 transition-all group text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 group-hover:text-amber-500 transition-colors">
                <Wand2 size={20} />
              </div>
              <div>
                <div className="font-bold text-zinc-900 dark:text-white">Generate Bio</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Create catchy bio options that stand out to your audience.</div>
              </div>
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 size={32} className="text-amber-500 animate-spin" />
              <p className="text-sm font-medium text-zinc-500 animate-pulse">Gemini is thinking...</p>
            </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400"
            >
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-50 dark:bg-zinc-800/50 p-6 sm:p-8 rounded-3xl border border-zinc-100 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
                <CheckCircle2 size={20} />
                <span className="font-bold text-sm uppercase tracking-wider">Gemini Result</span>
              </div>
              <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {result}
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-6 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  "Copy to Clipboard"
                )}
              </button>
            </motion.div>
          )}
        </div>
      </section>

      <section className="bg-zinc-900 dark:bg-white p-6 sm:p-8 rounded-[2.5rem] text-white dark:text-zinc-900 flex flex-col items-center justify-between gap-6 text-center">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold">Need more AI power?</h3>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm">Upgrade to Business for advanced content generation and analytics.</p>
        </div>
        <button className="w-full sm:w-auto bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-8 py-3 rounded-2xl font-bold hover:opacity-90 transition-all whitespace-nowrap">
          View Business Plan
        </button>
      </section>
    </div>
  );
}
