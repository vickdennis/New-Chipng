import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage, getUserByUsername, handleFirestoreError, OperationType } from '../firebase';
import { cn } from '../lib/utils';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, updateDoc, deleteDoc, doc, writeBatch, getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, 
  useSensor, useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Layout, Link as LinkIcon, User, Settings, BarChart2, 
  Plus, Trash2, GripVertical, Eye, EyeOff, Image as ImageIcon,
  LogOut, ExternalLink, Copy, Check, Moon, Sun, Palette,
  Crown, CheckCircle2, TrendingUp, Disc, Send, Pin, Music, Apple, Cloud, AtSign, Hash,
  CreditCard, Calendar, LayoutGrid, Star, Square, AlertCircle, Lightbulb, Camera,
  Briefcase, Play, Heart, Coffee, BookOpen, Globe, Search, ChevronRight, X,
  History as HistoryIcon, RotateCcw, Megaphone, Clock, BadgeCheck, ArrowUpRight,
  FileText, ShoppingCart, Tag, Filter, Edit, Package, DollarSign,
  Instagram, Twitter, Linkedin, Facebook, MessageCircle, MapPin, Github, Twitch, Mail, Ghost, MessageSquare, Youtube, Music2,
  Sparkles, Wand2, Bot
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Link, Transaction, THEMES, ThemeType, ButtonStyle, User as UserType, PlanType, Appointment, Shout, Media, BlogPost, Product } from '../types';
import { auth } from '../firebase';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { DISPLAY_DOMAIN } from '../constants';
import UpgradeModal from '../components/UpgradeModal';
import ImageUpload from '../components/ImageUpload';
import { VerificationBadge } from '../components/VerificationBadge';
import { usePaystackPayment } from 'react-paystack';
import { preparePaystackConfig, getPaystackPublicKey } from '../utils/paystack';
import { safeWrite, getBackupHistory, rollbackDocument, rollbackToVersion, BackupData } from '../services/backupService';
import { BrandIcons } from '../components/icons/BrandIcons';
import SocialIcon from '../components/SocialIcon';
import { motion, AnimatePresence } from 'motion/react';
import { uploadImage, validateImage, UploadPath } from '../services/imageService';
import { aiDesign } from '../services/geminiService';


const SortableLinkItem = ({ 
  link, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  isPremium, 
  onUploadIcon, 
  isUploading, 
  isAdmin, 
  onViewHistory,
  iconStyle
}: { 
  link: Link; 
  onUpdate: (id: string, data: Partial<Link>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  isPremium: boolean;
  onUploadIcon: (e: React.ChangeEvent<HTMLInputElement>, linkId: string) => void;
  isUploading: boolean;
  isAdmin: boolean;
  onViewHistory: (collection: string, id: string) => void;
  iconStyle: 'colored' | 'mono' | 'glass';
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col gap-4 group shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <button {...attributes} {...listeners} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5" />
        </button>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative group/icon shrink-0">
              <div className="w-12 h-12 flex items-center justify-center">
                {link.type && link.type !== 'standard' && !link.icon ? (
                  <SocialIcon 
                    platform={link.type} 
                    username={link.url.split('/').pop() || ''} 
                    asLink={false}
                    className="w-full h-full"
                    style={iconStyle || 'colored'}
                  />
                ) : link.icon ? (
                  <img src={link.icon} alt="" className="w-full h-full object-cover" />
                ) : getFavicon(link.url) ? (
                  <img src={getFavicon(link.url)!} alt="" className="w-6 h-6" referrerPolicy="no-referrer" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-zinc-400" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-xl opacity-0 group-hover/icon:opacity-100 cursor-pointer transition-opacity">
                <Plus className="w-4 h-4" />
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => onUploadIcon(e, link.id)} 
                  accept="image/*"
                  disabled={isUploading}
                />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <input 
                type="text" 
                value={link.title}
                onChange={(e) => onUpdate(link.id, { title: e.target.value })}
                className="w-full bg-transparent font-bold text-zinc-900 dark:text-white outline-none text-base truncate"
                placeholder="Link Title"
              />
              <input 
                type="text" 
                value={link.url}
                onChange={(e) => onUpdate(link.id, { url: e.target.value })}
                className="w-full bg-transparent text-[11px] text-zinc-400 font-bold uppercase tracking-widest outline-none truncate mt-0.5"
                placeholder="https://example.com"
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={() => onDuplicate(link.id)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95"
                title="Duplicate Link"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2 rounded-xl transition-all active:scale-95",
                  showSettings ? "bg-lime-400 text-black shadow-lg shadow-lime-100" : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
                title="Edit Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              {isAdmin && (
                <button 
                  onClick={() => onViewHistory('links', link.id)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all active:scale-95"
                  title="View History"
                >
                  <HistoryIcon className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => onUpdate(link.id, { active: !link.active })}
                className={cn(
                  "p-2 rounded-xl transition-all active:scale-95",
                  link.active ? "text-lime-500 hover:bg-lime-50" : "text-zinc-300 hover:text-zinc-400 hover:bg-zinc-50"
                )}
                title={link.active ? "Visible" : "Hidden"}
              >
                {link.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => onDelete(link.id)}
                className="p-2 rounded-xl text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                title="Delete Link"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden"
        >
          {/* Link Type */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Appearance Mode</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'standard', icon: LinkIcon, label: 'Standard' },
                { id: 'youtube', icon: Youtube, label: 'Video' },
                { id: 'tiktok', icon: Music2, label: 'Social' },
                { id: 'instagram', icon: Instagram, label: 'Visual' },
                { id: 'whatsapp', icon: MessageCircle, label: 'Chat' },
                { id: 'spotify', icon: Music, label: 'Audio' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdate(link.id, { type: t.id as any })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all",
                    (link.type === t.id || (!link.type && t.id === 'standard'))
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                      : "bg-white border-zinc-50 text-zinc-400 hover:border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800"
                  )}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Scheduling */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Launch Schedule</label>
              {!isPremium && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" /> PRO
                </span>
              )}
            </div>
            <div className={cn(
              "grid grid-cols-2 gap-3",
              !isPremium && "opacity-40 pointer-events-none grayscale"
            )}>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-400 px-1">START DATE</span>
                <input 
                  type="datetime-local" 
                  value={link.scheduledStart || ''}
                  onChange={(e) => onUpdate(link.id, { scheduledStart: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 text-[10px] p-3 rounded-xl outline-none border border-transparent focus:border-lime-400 transition-all font-bold"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-zinc-400 px-1">EXPIRY DATE</span>
                <input 
                  type="datetime-local" 
                  value={link.scheduledEnd || ''}
                  onChange={(e) => onUpdate(link.id, { scheduledEnd: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 text-[10px] p-3 rounded-xl outline-none border border-transparent focus:border-red-400 transition-all font-bold"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const CATEGORIES = [
  { id: 'socials', label: 'Socials', icon: MessageCircle },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'entertainment', label: 'Entertainment', icon: Play },
  { id: 'lifestyle', label: 'Lifestyle', icon: Heart },
] as const;

const getFavicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://icon.horse/icon/${domain}?size=large`;
  } catch (e) {
    return null;
  }
};

const PLATFORMS = {
  socials: [
    { id: 'instagram', label: 'Instagram', icon: BrandIcons.instagram, color: '#E4405F', urlPrefix: 'https://instagram.com/' },
    { id: 'twitter', label: 'Twitter / X', icon: BrandIcons.x, color: '#000000', urlPrefix: 'https://twitter.com/' },
    { id: 'tiktok', label: 'TikTok', icon: BrandIcons.tiktok, color: '#000000', urlPrefix: 'https://tiktok.com/@' },
    { id: 'youtube', label: 'YouTube', icon: BrandIcons.youtube, color: '#FF0000', urlPrefix: 'https://youtube.com/' },
    { id: 'facebook', label: 'Facebook', icon: BrandIcons.facebook, color: '#1877F2', urlPrefix: 'https://facebook.com/' },
    { id: 'threads', label: 'Threads', icon: AtSign, color: '#000000', urlPrefix: 'https://threads.net/@' },
    { id: 'linkedin', label: 'LinkedIn', icon: BrandIcons.linkedin, color: '#0A66C2', urlPrefix: 'https://linkedin.com/in/' },
    { id: 'whatsapp', label: 'WhatsApp', icon: BrandIcons.whatsapp, color: '#25D366', urlPrefix: 'https://wa.me/' },
    { id: 'telegram', label: 'Telegram', icon: Send, color: '#26A5E4', urlPrefix: 'https://t.me/' },
    { id: 'snapchat', label: 'Snapchat', icon: BrandIcons.snapchat, color: '#FFFC00', urlPrefix: 'https://snapchat.com/add/' },
    { id: 'discord', label: 'Discord', icon: BrandIcons.discord, color: '#5865F2', urlPrefix: 'https://discord.gg/' },
    { id: 'reddit', label: 'Reddit', icon: BrandIcons.reddit, color: '#FF4500', urlPrefix: 'https://reddit.com/u/' },
    { id: 'pinterest', label: 'Pinterest', icon: Pin, color: '#BD081C', urlPrefix: 'https://pinterest.com/' },
    { id: 'twitch', label: 'Twitch', icon: BrandIcons.twitch, color: '#9146FF', urlPrefix: 'https://twitch.tv/' }
  ],
  music: [
    { id: 'spotify', label: 'Spotify', icon: BrandIcons.spotify, color: '#1DB954', urlPrefix: 'https://open.spotify.com/user/' },
    { id: 'applemusic', label: 'Apple Music', icon: Apple, color: '#FA243C', urlPrefix: 'https://music.apple.com/' },
    { id: 'soundcloud', label: 'SoundCloud', icon: BrandIcons.soundcloud, color: '#FF5500', urlPrefix: 'https://soundcloud.com/' },
    { id: 'deezer', label: 'Deezer', icon: Music, color: '#00C7FF', urlPrefix: 'https://deezer.com/' },
    { id: 'tidal', label: 'Tidal', icon: Music2, color: '#000000', urlPrefix: 'https://tidal.com/' }
  ],
  business: [
    { id: 'website', label: 'Website', icon: Globe, color: '#6B7280', urlPrefix: 'https://' },
    { id: 'linkedin', label: 'LinkedIn Business', icon: BrandIcons.linkedin, color: '#0A66C2', urlPrefix: 'https://linkedin.com/company/' },
    { id: 'github', label: 'GitHub', icon: BrandIcons.github, color: '#181717', urlPrefix: 'https://github.com/' },
    { id: 'portfolio', label: 'Portfolio', icon: LayoutGrid, color: '#6366F1', urlPrefix: 'https://' },
    { id: 'behance', label: 'Behance', icon: BrandIcons.behance, color: '#1769FF', urlPrefix: 'https://behance.net/' },
    { id: 'dribbble', label: 'Dribbble', icon: BrandIcons.dribbble, color: '#EA4C89', urlPrefix: 'https://dribbble.com/' }
  ],
  payments: [
    { id: 'paypal', label: 'PayPal', icon: CreditCard, color: '#003087', urlPrefix: 'https://paypal.me/' },
    { id: 'buymeacoffee', label: 'Buy Me a Coffee', icon: Coffee, color: '#FFDD00', urlPrefix: 'https://buymeacoffee.com/' },
    { id: 'patreon', label: 'Patreon', icon: Star, color: '#FF424D', urlPrefix: 'https://patreon.com/' },
    { id: 'cashapp', label: 'Cash App', icon: CreditCard, color: '#00D632', urlPrefix: 'https://cash.app/$' },
    { id: 'venmo', label: 'Venmo', icon: CreditCard, color: '#3D95CE', urlPrefix: 'https://venmo.com/' }
  ],
  entertainment: [
    { id: 'netflix', label: 'Netflix', icon: Play, color: '#E50914', urlPrefix: 'https://netflix.com/' },
    { id: 'hulu', label: 'Hulu', icon: Play, color: '#1CE783', urlPrefix: 'https://hulu.com/' },
    { id: 'primevideo', label: 'Prime Video', icon: Play, color: '#00A8E1', urlPrefix: 'https://amazon.com/video/' },
    { id: 'disneyplus', label: 'Disney+', icon: Play, color: '#006E99', urlPrefix: 'https://disneyplus.com/' }
  ],
  lifestyle: [
    { id: 'blog', label: 'Blog', icon: BookOpen, color: '#6B7280', urlPrefix: 'https://' },
    { id: 'medium', label: 'Medium', icon: BrandIcons.medium, color: '#000000', urlPrefix: 'https://medium.com/@' },
    { id: 'substack', label: 'Substack', icon: BrandIcons.substack, color: '#FF6719', urlPrefix: 'https://substack.com/' },
    { id: 'goodreads', label: 'Goodreads', icon: Star, color: '#372213', urlPrefix: 'https://goodreads.com/' }
  ]
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [profileForm, setProfileForm] = useState({
    username: '',
    displayName: '',
    bio: '',
    contactEmail: '',
    phone: '',
    address: '',
    textColor: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [links, setLinks] = useState<Link[]>([]);
  const [shouts, setShouts] = useState<Shout[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'business' | 'analytics' | 'verification' | 'billing' | 'settings' | 'backup' | 'posts' | 'blogs' | 'shop'>('links');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isAddPlatformModalOpen, setIsAddPlatformModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof PLATFORMS>('socials');
  const [searchQuery, setSearchQuery] = useState('');
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const isAdmin = profile?.role === 'admin';
  const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; requiredPlan: PlanType; featureName: string }>({
    isOpen: false,
    requiredPlan: 'pro',
    featureName: ''
  });
  const [historyModal, setHistoryModal] = useState<{ collection: string; id: string } | null>(null);
  const [isAIDesignerOpen, setIsAIDesignerOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const navigate = useNavigate();

  const fetchHistory = async (collection: string, id: string) => {
    const history = await getBackupHistory(collection, id);
    setBackups(history);
    setHistoryModal({ collection, id });
  };

  const handleRollback = async (backupId: string) => {
    if (!historyModal) return;
    if (!window.confirm("Are you sure you want to restore this version? This will overwrite the current data.")) return;

    setIsRollingBack(true);
    try {
      await rollbackToVersion(historyModal.collection, historyModal.id, backupId);
      toast.success("Document restored successfully");
      setHistoryModal(null);
      // Reload relevant data
      if (historyModal.collection === 'users') {
        const docSnap = await getDoc(doc(db, 'users', historyModal.id));
        if (docSnap.exists()) setProfile(docSnap.data() as UserType);
      }
    } catch (error) {
      toast.error("Failed to restore document");
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleAIDesign = async () => {
    if (!aiPrompt.trim() || !profile) return;
    
    setIsAiTyping(true);
    setAiResponse(null);
    const userMessage = aiPrompt;
    setAiPrompt('');
    
    try {
      const context = {
        profile,
        links: links.map(l => ({ id: l.id, title: l.title, url: l.url, active: l.active }))
      };
      
      const result = await aiDesign(userMessage, context);
      
      setAiResponse(result.text);
      
      // Execute function calls
      if (result.functionCalls.length > 0) {
        for (const call of result.functionCalls) {
          console.log(`[AI Designer] Executing: ${call.name}`, call.args);
          
          if (call.name === 'updateProfile') {
            await handleUpdateProfile(call.args);
          } else if (call.name === 'addLink') {
            await handleAddLinkWithData(call.args);
          } else if (call.name === 'updateLink') {
            await handleUpdateLink(call.args.id, call.args);
          } else if (call.name === 'deleteLink') {
            await handleDeleteLink(call.args.id);
          } else if (call.name === 'applyTheme') {
            await handleUpdateProfile({ theme: call.args.theme });
          }
        }
        toast.success(`AI Designer applied ${result.functionCalls.length} changes!`);
      }
    } catch (error: any) {
      console.error('AI Designer error:', error);
      toast.error('AI Designer failed to process your request');
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleAddLinkWithData = async (data: { title: string; url: string }) => {
    if (!user) return;
    try {
      await safeWrite('links', null, {
        userId: user.uid,
        ...data,
        active: true,
        position: links.length,
        clicks: 0
      }, 'create');
    } catch (error) {
           console.error('Error adding AI link:', error);
    }
  };
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!user) return;

    const unsubPublic = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
      if (userDoc.exists()) {
        const publicData = userDoc.data() as UserType;
        setProfile(prev => {
          const merged = { ...publicData, ...(prev || {}) };
          // Keep private fields if they already exist in state
          return merged;
        });
        setProfileForm(prev => ({
          ...prev,
          username: publicData.username || '',
          displayName: publicData.displayName || '',
          bio: publicData.bio || '',
          textColor: publicData.textColor || ''
        }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    const unsubPrivate = onSnapshot(doc(db, 'users', user.uid, 'private', 'info'), (privateDoc) => {
      if (privateDoc.exists()) {
        const privateData = privateDoc.data();
        setProfile(prev => ({ ...prev, ...(privateData as any) } as UserType));
        setProfileForm(prev => ({
          ...prev,
          phone: privateData.phone || '',
          address: privateData.address || '',
          contactEmail: privateData.contactEmail || ''
        }));
      }
    });

    const q = query(collection(db, 'links'), where('userId', '==', user.uid));
    const unsubLinks = onSnapshot(q, (snapshot) => {
      const sortedLinks = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Link))
        .filter(l => !(l as any).isDeleted)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      setLinks(sortedLinks);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'links');
    });

    const qTx = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const sortedTx = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Transaction))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(sortedTx);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    const qShouts = query(collection(db, 'shouts'), where('userId', '==', user.uid));
    const unsubShouts = onSnapshot(qShouts, (snapshot) => {
      const sortedShouts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Shout))
        .filter(s => !(s as any).isDeleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setShouts(sortedShouts);
    });

    const qMedia = query(collection(db, 'media'), where('userId', '==', user.uid));
    const unsubMedia = onSnapshot(qMedia, (snapshot) => {
      const sortedMedia = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Media))
        .filter(m => !(m as any).isDeleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMedia(sortedMedia);
    });

    const qBlogs = query(collection(db, 'blogs'), where('userId', '==', user.uid));
    const unsubBlogs = onSnapshot(qBlogs, (snapshot) => {
      const sortedBlogs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as BlogPost))
        .filter(b => !(b as any).isDeleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBlogs(sortedBlogs);
    });

    const qProducts = query(collection(db, 'products'), where('userId', '==', user.uid));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const sortedProducts = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(p => !(p as any).isDeleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProducts(sortedProducts);
    });

    // Trigger subscription expiry check on load
    fetch('/api/cron/check-subscriptions', { method: 'POST' })
      .catch(err => console.error('Expiry check failed:', err));

    return () => {
      unsubPublic();
      unsubPrivate();
      unsubLinks();
      unsubTx();
      unsubShouts();
      unsubMedia();
      unsubBlogs();
      unsubProducts();
    };
  }, [user]);

  const handleAddLink = async () => {
    if (!user) return;
    try {
      await safeWrite('links', null, {
        userId: user.uid,
        title: 'New Link',
        url: 'https://',
        active: true,
        position: links.length,
        clicks: 0
      }, 'create');
      toast.success('Link added');
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Failed to add link');
    }
  };

  // Replaced by top-level getFavicon helper

  const handleUpdateLink = async (id: string, data: Partial<Link>) => {
    try {
      const updateData = { ...data };
      if (data.url && data.url.length > 8 && data.url.startsWith('http')) {
        const icon = getFavicon(data.url);
        if (icon && !updateData.icon) updateData.icon = icon;
      }
      await safeWrite('links', id, updateData, 'update');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `links/${id}`);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await safeWrite('links', id, null, 'delete');
      toast.success('Link soft deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `links/${id}`);
    }
  };

  const handleDuplicateLink = async (id: string) => {
    const linkToDuplicate = links.find(l => l.id === id);
    if (!linkToDuplicate || !user) return;
    try {
      const { id: _, ...linkData } = linkToDuplicate;
      await safeWrite('links', null, {
        ...linkData,
        title: `${linkData.title} (Copy)`,
        position: links.length,
        clicks: 0,
        createdAt: new Date().toISOString()
      }, 'create');
      toast.success('Link duplicated');
    } catch (error) {
      toast.error('Failed to duplicate link');
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = links.findIndex(l => l.id === active.id);
      const newIndex = links.findIndex(l => l.id === over.id);
      const newLinks = arrayMove(links, oldIndex, newIndex);
      
      setLinks(newLinks);

      // Perform safe writes for each affected link to ensure backups exist for position changes
      try {
        for (let i = 0; i < newLinks.length; i++) {
          await safeWrite('links', newLinks[i].id, { position: i }, 'update');
        }
      } catch (error) {
        console.error('Error updating link positions safely:', error);
      }
    }
  };

  const handleUpdateProfile = async (data: Partial<UserType>) => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      // If updating username, check for uniqueness
      if (data.username && data.username !== profile?.username) {
        const cleanUsername = data.username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
        if (cleanUsername.length < 3) {
          toast.error('Username must be at least 3 characters');
          setIsSavingProfile(false);
          return;
        }
        const existingUser = await getUserByUsername(cleanUsername);
        if (existingUser) {
          toast.error('Username is already taken');
          setIsSavingProfile(false);
          return;
        }
        data.username = cleanUsername;
      }

      // Merge with current data
      const userRef = doc(db, 'users', user.uid);
      const currentDoc = await getDoc(userRef);
      const currentData = (currentDoc.exists() ? currentDoc.data() : {}) as UserType;
      const updatePayload: any = { ...data };
      
      // Ensure we don't accidentally remove required fields
      if (!currentData.backgroundType) updatePayload.backgroundType = 'solid';
      if (!currentData.theme) updatePayload.theme = 'minimal';
      if (!currentData.buttonStyle) updatePayload.buttonStyle = 'rounded';
      
      // Split public and private data for security
      const publicPayload = { ...updatePayload };
      const privatePayload: any = {
        email: user.email,
        updatedAt: new Date().toISOString()
      };

      // Move PII fields to private payload if present
      const piiFields = ['phone', 'address', 'contactEmail'];
      piiFields.forEach(field => {
        if (publicPayload[field] !== undefined) {
          privatePayload[field] = publicPayload[field];
          delete publicPayload[field];
        } else if (currentData[field] !== undefined) {
          // If already in main doc, move to private but keep for this update
          privatePayload[field] = currentData[field];
          // We will also remove it from the main doc by not including it in the update if we wanted to migrate
          // but for now let's just delete from publicPayload to ensure it's not stored there again
          delete publicPayload[field];
        }
      });

      const success = await safeWrite('users', user.uid, publicPayload, 'update');
      
      if (success) {
        // Update private info subcollection
        await safeWrite(`users/${user.uid}/private`, 'info', privatePayload, 'update');
        toast.success('Profile updated');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover' | 'background' | 'link-icon', linkId?: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (type === 'cover' && !hasAccess('pro')) {
      checkFeatureAccess('pro', 'Cover Image');
      return;
    }

    if (type === 'background' && !hasAccess('pro')) {
      checkFeatureAccess('pro', 'Custom Background');
      return;
    }

    if (type === 'link-icon' && !hasAccess('pro')) {
      checkFeatureAccess('pro', 'Custom Link Icons');
      return;
    }

    const error = validateImage(file, 2);
    if (error) {
      toast.error(error);
      return;
    }

    setIsUploading(true);
    
    // Map internal type to uploadPath
    const pathTypeMap: Record<string, UploadPath> = {
      profile: 'profiles',
      cover: 'covers',
      background: 'backgrounds',
      'link-icon': 'link-icons'
    };
    
    const pathType = pathTypeMap[type];

    try {
      toast.loading(`Uploading ${type.replace('-', ' ')}...`, { id: 'upload-toast' });
      
      const url = await uploadImage(file, user.uid, pathType);
      
      if (type === 'profile') {
        await handleUpdateProfile({ photoURL: url });
      } else if (type === 'cover') {
        await handleUpdateProfile({ coverImage: url });
      } else if (type === 'background') {
        await handleUpdateProfile({ backgroundImage: url, backgroundType: 'image' });
      } else if (type === 'link-icon' && linkId) {
        await handleUpdateLink(linkId, { icon: url });
      }
      
      toast.success(`${type.replace('-', ' ')} updated`, { id: 'upload-toast' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`, { id: 'upload-toast' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const copyLink = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`${DISPLAY_DOMAIN}/${profile.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard');
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };
  
  const verificationConfig = React.useMemo(() => {
    if (!user) return { publicKey: getPaystackPublicKey() };

    try {
      return preparePaystackConfig({
        email: user.email,
        amountNaira: 2000,
        metadata: {
          userId: user.uid,
          isVerification: true
        }
      });
    } catch (e) {
      return { publicKey: getPaystackPublicKey() } as any;
    }
  }, [user]);

  const initializeVerification = usePaystackPayment(verificationConfig);

  const onVerificationSuccess = async (response: any) => {
    try {
      const verifyRes = await fetch('/api/verify-paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reference: response.reference,
          userId: user?.uid,
          isVerification: true
        }),
      });
      const data = await verifyRes.json();
      if (data.status === 'success') {
        await handleUpdateProfile({ isVerified: true });
        toast.success('Congratulations! You are now verified.');
        navigate(`/payment-success?reference=${response.reference}&plan=Verification`);
      } else {
        toast.error('Verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Error verifying verification payment:', error);
      toast.error('Error verifying payment');
    }
  };

  const onVerificationClose = () => {
    toast.error('Payment cancelled');
  };

  const triggerVerification = () => {
    if (verificationConfig.publicKey && verificationConfig.publicKey.startsWith('pk_')) {
      initializeVerification({
        onSuccess: (response: any) => onVerificationSuccess(response),
        onClose: () => onVerificationClose()
      });
    } else {
      toast.error("Paystack configuration is incomplete. Please add your Public Key (VITE_PAYSTACK_PUBLIC_KEY) in Settings.");
    }
  };

  const hasAccess = (requiredPlan: PlanType) => {
    if (!profile) return false;
    
    const planHierarchy: Record<PlanType, number> = {
      'basic': 0,
      'pro': 1,
      'business': 2
    };

    const userPlan = profile.plan || 'basic';
    return planHierarchy[userPlan] >= planHierarchy[requiredPlan];
  };

  const checkFeatureAccess = (requiredPlan: PlanType, featureName: string) => {
    if (hasAccess(requiredPlan)) return true;

    setUpgradeModal({
      isOpen: true,
      requiredPlan,
      featureName
    });
    return false;
  };

  const handleSelectPlatform = async (platformId: string, urlPrefix: string) => {
    if (!profile) return;
    
    // Allow updating existing platforms
    const currentSocials = profile.socialLinks || {};
    
    if (Object.keys(currentSocials).length >= 6 && !currentSocials[platformId]) {
      toast.error('Maximum of 6 social platforms reached');
      return;
    }

    const existingValue = currentSocials[platformId as keyof typeof currentSocials];

    const value = window.prompt(`Enter your ${platformId} username (e.g. @username)`, existingValue ? existingValue.split('/').pop() : '');
    if (value === null) return;

    // Clean @ if provided
    const cleanValue = value.replace('@', '').trim();
    if (!cleanValue) return;

    let finalUrl = cleanValue;
    if (!cleanValue.startsWith('http')) {
      finalUrl = urlPrefix + cleanValue;
    }

    try {
      await handleUpdateProfile({
        socialLinks: {
          ...currentSocials,
          [platformId]: finalUrl
        }
      });
      setIsAddPlatformModalOpen(false);
      toast.success(`${platformId} added successfully`);
    } catch (error) {
      toast.error(`Failed to add ${platformId}`);
    }
  };

  const filteredPlatforms = PLATFORMS[selectedCategory].filter(p => 
    p.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateCompletion = () => {
    if (!profile) return 0;
    const fields = [
      profile.username,
      profile.displayName,
      profile.bio,
      profile.photoURL,
      profile.coverImage,
      profile.phone,
      profile.address,
      profile.contactEmail,
      profile.socialLinks && Object.values(profile.socialLinks).some(v => v),
      links.length > 0,
      blogs.length > 0,
      products.length > 0
    ];
    const filledFields = fields.filter(f => !!f).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">Loading...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Redirecting to login...</div>;

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <Logo size="lg" className="mb-8" />
        <div className="max-w-md w-full space-y-6">
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/20 p-6 rounded-[2.5rem] flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Profile Not Found</h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              We couldn't find your profile data. This can happen if account creation was interrupted. 
              Let's fix it by setting up your profile now.
            </p>
          </div>
          
          <button
            onClick={async () => {
              try {
                let baseUsername = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
                let finalUsername = baseUsername;
                
                const check = await getUserByUsername(finalUsername);
                if (check) {
                  finalUsername = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
                }

                await safeWrite('users', user.uid, {
                  uid: user.uid,
                  email: user.email,
                  username: finalUsername,
                  displayName: user.displayName || finalUsername,
                  photoURL: user.photoURL || null,
                  bio: 'Welcome to my Chip NG profile!',
                  role: 'user',
                  createdAt: new Date().toISOString(),
                  status: 'active',
                  theme: 'minimal',
                  buttonStyle: 'rounded',
                  backgroundType: 'solid',
                  backgroundColor: '#ffffff',
                  totalClicks: 0,
                  plan: 'basic',
                  subscriptionStatus: 'active',
                  onboardingCompleted: false
                }, 'create');
                
                toast.success('Profile created successfully!');
              } catch (error) {
                console.error('Failed to create profile:', error);
                toast.error('Failed to create profile. Please try again.');
              }
            }}
            className="w-full bg-[#A3E635] text-white py-4 rounded-2xl font-black shadow-lg shadow-lime-100 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Setup My Profile
          </button>
          
          <button 
            onClick={() => auth.signOut()}
            className="text-zinc-400 font-bold hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const mockAnalyticsData = [
    { name: 'Mon', views: 400, clicks: 240 },
    { name: 'Tue', views: 300, clicks: 139 },
    { name: 'Wed', views: 200, clicks: 980 },
    { name: 'Thu', views: 278, clicks: 390 },
    { name: 'Fri', views: 189, clicks: 480 },
    { name: 'Sat', views: 239, clicks: 380 },
    { name: 'Sun', views: 349, clicks: 430 },
  ];

  return (
    <div className={cn(
      "min-h-screen flex font-sans selection:bg-lime-400 selection:text-zinc-950 transition-colors duration-500 overflow-hidden relative",
      profile && THEMES[profile.theme]?.background ? THEMES[profile.theme].background : "bg-[#F8F9FA] dark:bg-zinc-950",
      profile && THEMES[profile.theme]?.text ? THEMES[profile.theme].text : "text-zinc-900 dark:text-white"
    )}>
      {/* Animated Background Details */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-lime-400/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-400/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 h-screen bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl border-r border-zinc-100 dark:border-zinc-800 p-8 sticky top-0 z-50">
        <RouterLink to="/" className="mb-12 block group">
          <Logo size="sm" className="!justify-start transition-transform group-hover:scale-105" />
        </RouterLink>

        <nav className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
          <div>
            <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Create</p>
            <div className="space-y-1">
              {( [
                { id: 'links', icon: LayoutGrid, label: 'Profile Links' },
                { id: 'posts', icon: ImageIcon, label: 'Posts & Feed' },
                { id: 'blogs', icon: FileText, label: 'Blog Studio' },
                { id: 'shop', icon: ShoppingCart, label: 'Shop Manager' },
              ] as any[] ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300",
                    activeTab === item.id 
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-2xl shadow-zinc-200 dark:shadow-none translate-x-1" 
                      : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", activeTab === item.id ? "animate-pulse" : "")} />
                  <span className="text-[14px]">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-lime-400 text-zinc-950 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
             <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Insights</p>
             <div className="space-y-1">
              {[
                { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
                { id: 'business', icon: Crown, label: 'Business Hub' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all",
                    activeTab === item.id 
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-xl translate-x-1" 
                      : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[14px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
             <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Account</p>
             <div className="space-y-1">
              {[
                { id: 'verification', icon: BadgeCheck, label: 'Verification' },
                { id: 'billing', icon: CreditCard, label: 'Billing' },
                ...(profile?.role === 'admin' ? [{ id: 'backup', icon: HistoryIcon, label: 'Revision History' }] : []),
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all",
                    activeTab === item.id 
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-xl translate-x-1" 
                      : "text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[14px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
           <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 bg-lime-400 rounded-2xl flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-950" />
                 </div>
                 <div className="flex-1 truncate">
                    <p className="text-sm font-bold truncate dark:text-white">{profile?.displayName || 'Set Name'}</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{profile?.plan || 'Free'} Plan</p>
                 </div>
              </div>
              <button 
                onClick={() => auth.signOut()}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-bold text-xs"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden overflow-y-auto no-scrollbar scroll-smooth">
        {/* Top Floating Navbar (Mobile + Tablet) */}
        <header className="lg:hidden h-20 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-40">
           <Logo size="sm" />
           <div className="flex gap-4">
             <ThemeToggle />
             <button onClick={() => auth.signOut()} className="p-2 border border-zinc-100 dark:border-zinc-800 rounded-xl">
               <LogOut className="w-5 h-5 text-zinc-400" />
             </button>
           </div>
        </header>

        {/* Editor Wrapper */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12 space-y-12 pb-40">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-lime-500">Dashboard</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">{activeTab}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none">
                {activeTab === 'links' ? 'Profile Editor' : activeTab === 'posts' ? 'Content Feed' : activeTab === 'backup' ? 'Revision History' : activeTab === 'business' ? 'Business Hub' : activeTab}
              </h1>
            </div>

            <div className="flex flex-col gap-3">
               <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] p-1.5 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3 px-4 py-2 flex-1">
                     <LinkIcon className="w-4 h-4 text-zinc-400" />
                     <span className="text-[14px] font-bold text-zinc-600 dark:text-zinc-400 truncate max-w-[150px]">chipng.com/{profile?.username}</span>
                  </div>
                  <button 
                    onClick={copyLink}
                    className="flex items-center gap-2 px-6 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-[1.5rem] font-black text-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
               </div>
            </div>
          </div>

          {/* Category Tabs Deleted as requested */}
          
          {/* Active Tab Content */}
          <div className="relative">
            <AnimatePresence mode="wait">
            {activeTab === 'links' && (
              <motion.div 
                key="links"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-6 flex flex-col items-center"
              >
                {/* Cover Image Section */}
                <div className={cn(
                  "w-full mt-8 mb-6 space-y-4 relative",
                  !hasAccess('pro') && "opacity-80"
                )}>
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-[20px] font-black">Profile Header</h3>
                     <div className="flex items-center gap-2">
                        {!hasAccess('pro') && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-black flex items-center gap-1">
                            <Crown className="w-3 h-3" /> PRO
                          </span>
                        )}
                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">Cover Image</span>
                     </div>
                  </div>
                  
                  <div className="relative group/cover">
                    <ImageUpload 
                      folder="covers"
                      userId={user?.uid || ''}
                      initialImage={profile?.coverImage}
                      onSuccess={(url) => handleUpdateProfile({ coverImage: url })}
                      label="Your Banner Image"
                      aspectRatio="video"
                    />
                    {!hasAccess('pro') && (
                      <div className="absolute inset-0 z-10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-[2px] rounded-[2.5rem] flex items-center justify-center cursor-pointer" onClick={() => checkFeatureAccess('pro', 'Cover Image')}>
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-zinc-100 dark:border-zinc-800">
                           <Crown className="w-6 h-6 text-amber-500" />
                           <span className="font-black text-sm">Upgrade to Pro to unlock Cover Images</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Presets Gallery */}
                  <div className={cn(
                    "mt-4 flex gap-3 overflow-x-auto no-scrollbar pb-2",
                    !hasAccess('pro') && "grayscale opacity-50 pointer-events-none"
                  )}>
                    {[
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
                      'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=800',
                      'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800',
                      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800',
                      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=800'
                    ].map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handleUpdateProfile({ coverImage: url });
                          toast.success('Cover image updated!');
                        }}
                        className="w-16 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-200 dark:border-zinc-800 hover:scale-105 transition-transform"
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>



                {/* Profile Strength */}
                <div className="w-full mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[14px] text-[#6B7280] font-medium">Profile Strength • {calculateCompletion()}%</p>
                    {calculateCompletion() < 100 && <Star className="w-4 h-4 text-[#A3E635]" />}
                  </div>
                  <div className="w-full h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div className="h-full bg-[#A3E635] transition-all duration-500" style={{ width: `${calculateCompletion()}%` }} />
                  </div>
                </div>

                {/* Edit Sections List */}
                <div className="w-full space-y-0.5 mb-10">
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setIsAddPlatformModalOpen(true)}
                    className="w-full relative overflow-hidden group py-8 px-6 rounded-[2.5rem] bg-zinc-950 text-white flex items-center justify-between shadow-2xl transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-lime-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-[#A3E635] text-black flex items-center justify-center shadow-xl shadow-lime-400/20 group-hover:rotate-6 transition-transform">
                        <Plus className="w-8 h-8 font-black" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-black tracking-tight">Add Platforms</h3>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Social Icons & Handles</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                         <span className="text-[#A3E635] font-black text-sm tracking-tighter">+20% Influence</span>
                      </div>
                      <ChevronRight className="w-6 h-6 text-zinc-700 group-hover:text-[#A3E635] transition-colors" />
                    </div>
                  </motion.button>

                  <div className="mt-8 flex overflow-x-auto no-scrollbar gap-4 py-2 px-2 -mx-2">
                    {profile?.socialLinks && Object.entries(profile.socialLinks).map(([id, url]) => {
                      const platform = Object.values(PLATFORMS).flat().find(p => p.id === id);
                      if (!platform) return null;
                      
                      const Icon = platform.icon;
                      
                      return (
                        <div key={id} className="relative group flex flex-col items-center gap-1.5 shrink-0">
                          <button 
                            onClick={() => handleSelectPlatform(platform.id, platform.urlPrefix)}
                            className="w-16 h-16 rounded-[1.8rem] bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-[#A3E635] hover:bg-zinc-900 transition-all hover:scale-105 active:scale-95 shadow-2xl"
                            title={`Edit ${platform.label}`}
                          >
                             <Icon className="w-7 h-7" />
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!window.confirm(`Remove ${platform.label}?`)) return;
                              const newLinks = { ...profile.socialLinks };
                              delete newLinks[id as keyof typeof newLinks];
                              await handleUpdateProfile({ socialLinks: newLinks });
                            }}
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-2 border-white dark:border-zinc-950 z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }).slice(0, 6)}
                  </div>

                  <div className="py-4 border-b border-[#F3F4F6]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[15px] font-medium">Bio</span>
                      <button 
                         onClick={() => {
                           const bio = window.prompt("Edit Bio", profile?.bio || "");
                           if (bio !== null) handleUpdateProfile({ bio });
                         }}
                         className="text-[#A3E635] font-bold text-[13px]"
                      >
                        {profile?.bio ? 'Edit' : '+15%'}
                      </button>
                    </div>
                    <p className="text-[#6B7280] text-[14px] truncate max-w-full">
                      {profile?.bio || 'Add bio to your profile'}
                    </p>
                  </div>

                  <div className="py-4 border-b border-[#F3F4F6]">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                         <span className="text-[15px] font-medium">Phone Number</span>
                         <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">(vCard support)</span>
                       </div>
                       <button 
                         onClick={() => {
                           const phone = window.prompt("Enter phone number", profile?.phone || "");
                           if (phone !== null) handleUpdateProfile({ phone });
                         }}
                         className="text-[#A3E635] font-bold text-[13px]"
                       >
                         {profile?.phone ? 'Edit' : '+5% Speed'}
                       </button>
                    </div>
                    <p className="text-[#6B7280] text-[14px] truncate">
                      {profile?.phone || 'Add phone for "Save Contact" button'}
                    </p>
                  </div>

                  <div className="py-4 border-b border-[#F3F4F6]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[15px] font-medium">Public Email</span>
                      <button 
                         onClick={() => {
                           const email = window.prompt("Enter public email", profile?.contactEmail || "");
                           if (email !== null) handleUpdateProfile({ contactEmail: email });
                         }}
                         className="text-[#A3E635] font-bold text-[13px]"
                      >
                        {profile?.contactEmail ? 'Edit' : '+5% Influence'}
                      </button>
                    </div>
                    <p className="text-[#6B7280] text-[14px] truncate">
                      {profile?.contactEmail || 'Add email for your profile'}
                    </p>
                  </div>
                </div>                {/* Featured Links Grid */}
                <div className="w-full text-left">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-black text-[22px]">Manage Links</h3>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Organize and edit your featured content</p>
                    </div>
                    <button 
                      onClick={handleAddLink}
                      className="p-3 bg-lime-400 text-zinc-950 rounded-2xl shadow-lg shadow-lime-100 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {links.length === 0 ? (
                      <button 
                        onClick={handleAddLink}
                        className="w-full p-12 border-4 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[3rem] flex flex-col items-center gap-4 group hover:border-[#A3E635] hover:bg-lime-50 transition-all text-center"
                      >
                        <div className="w-16 h-16 bg-lime-50 dark:bg-lime-900/10 rounded-3xl flex items-center justify-center">
                          <Plus className="w-8 h-8 text-[#A3E635]" />
                        </div>
                        <div>
                          <span className="block text-lg font-black text-zinc-900 dark:text-white">Start Building Your Profile</span>
                          <span className="text-sm font-bold text-zinc-400">Add your first spotlight link to get noticed</span>
                        </div>
                      </button>
                    ) : (
                      <DndContext 
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext 
                          items={links.map(l => l.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-4">
                            {links.map((link) => (
                              <SortableLinkItem 
                                key={link.id}
                                link={link}
                                onUpdate={handleUpdateLink}
                                onDelete={handleDeleteLink}
                                onDuplicate={handleDuplicateLink}
                                isPremium={hasAccess('pro')}
                                onUploadIcon={(e, id) => handleFileUpload(e, 'link-icon', id)}
                                isUploading={isUploading}
                                isAdmin={isAdmin}
                                onViewHistory={fetchHistory}
                                iconStyle={profile?.iconStyle || 'colored'}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}

                    <div className="flex gap-4">
                      <button 
                        onClick={handleAddLink}
                        className="flex-1 py-5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-[2.5rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-zinc-950/20 dark:shadow-white/5"
                      >
                        <Plus className="w-5 h-5" /> Add Standard Link
                      </button>
                      <button 
                        onClick={() => setIsAddPlatformModalOpen(true)}
                        className={cn(
                          "flex-1 py-5 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all font-black text-xs uppercase tracking-widest shadow-lg",
                          profile?.brandColor ? "text-white" : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                        )}
                        style={profile?.brandColor ? { backgroundColor: profile.brandColor, borderColor: profile.brandColor } : {}}
                      >
                        <Send className="w-5 h-5" /> Add Social Icon
                      </button>
                    </div>
                  </div>
                </div>

                <div className="w-full py-10">
                   <button className="w-full py-4 text-[#A3E635] font-bold border-2 border-[#A3E635] rounded-2xl hover:bg-lime-50 transition-colors" onClick={() => setActiveTab('appearance')}>
                     Manage Custom Content
                   </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 py-6 space-y-6 relative"
              >
                {!hasAccess('pro') && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center p-6 mt-12">
                    <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-12 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl text-center max-w-sm">
                       <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <Crown className="w-10 h-10 text-amber-600" />
                       </div>
                       <h3 className="text-2xl font-black mb-2">Detailed Analytics</h3>
                       <p className="text-zinc-500 text-sm mb-8 font-medium leading-relaxed">Track your growth with deep insights into views, clicks, and conversion rates.</p>
                       <button 
                         onClick={() => navigate('/pricing')}
                         className="w-full py-4 bg-zinc-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-zinc-900/20"
                       >
                         Upgrade to Pro
                       </button>
                    </div>
                  </div>
                )}
                <div className={cn("grid grid-cols-2 gap-4", !hasAccess('pro') && "blur-md select-none opacity-40")}>
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-[24px] border border-[#F3F4F6] dark:border-zinc-800 shadow-sm">
                    <p className="text-[#6B7280] text-[12px] font-medium mb-1">Views</p>
                    <p className="text-[24px] font-bold text-zinc-900 dark:text-white">{profile?.totalClicks || 0}</p>
                    <p className="text-[10px] text-green-500 font-bold">+100% lifetime</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-4 rounded-[24px] border border-[#F3F4F6] dark:border-zinc-800 shadow-sm">
                    <p className="text-[#6B7280] text-[12px] font-medium mb-1">Link Clicks</p>
                    <p className="text-[24px] font-bold text-zinc-900 dark:text-white">{links.reduce((sum, l) => sum + (l.clicks || 0), 0)}</p>
                    <p className="text-[10px] text-zinc-400 font-bold">{links.length} Active links</p>
                  </div>
                </div>

                <div className={cn("bg-white p-6 rounded-[24px] border border-[#F3F4F6] shadow-sm h-[300px]", !hasAccess('pro') && "blur-md select-none opacity-40")}>
                  <h3 className="font-bold mb-6">Traffic Over Time</h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={mockAnalyticsData}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A3E635" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#A3E635" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="views" stroke="#A3E635" fillOpacity={1} fill="url(#colorViews)" />
                      <Tooltip />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {activeTab === 'posts' && (
              <motion.div 
                key="feed"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 py-6 space-y-8"
              >
                {/* Add Shout */}
                <div className="bg-white dark:bg-zinc-950 p-6 rounded-[2.5rem] border border-[#F3F4F6] dark:border-zinc-800 shadow-sm">
                  <h3 className="font-bold mb-4 text-zinc-900 dark:text-white">Post a Shout</h3>
                  <div className="space-y-4">
                    <textarea 
                      placeholder="What's happening?"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#A3E635] transition-all resize-none h-24 text-zinc-900 dark:text-white"
                      id="shout-content"
                    />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-zinc-500 cursor-pointer hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-bold">
                        <ImageIcon className="w-5 h-5" />
                        <span>Add Image</span>
                        <input type="file" className="hidden" accept="image/*" id="shout-image" />
                      </label>
                      <button 
                        onClick={async () => {
                          const content = (document.getElementById('shout-content') as HTMLTextAreaElement).value;
                          const imageFile = (document.getElementById('shout-image') as HTMLInputElement).files?.[0];
                          
                          if (!content.trim()) {
                            toast.error('Shout content cannot be empty');
                            return;
                          }

                          try {
                            let imageUrl = '';
                            if (imageFile) {
                              const formData = new FormData();
                              formData.append('file', imageFile);
                              formData.append('path', `shouts/${user?.uid}/${Date.now()}_${imageFile.name}`);
                              const res = await fetch('/api/upload', { method: 'POST', body: formData });
                              const data = await res.json();
                              imageUrl = data.url;
                            }

                            await safeWrite('shouts', null, {
                              userId: user?.uid,
                              content,
                              image: imageUrl,
                              createdAt: new Date().toISOString()
                            }, 'create');

                            (document.getElementById('shout-content') as HTMLTextAreaElement).value = '';
                            (document.getElementById('shout-image') as HTMLInputElement).value = '';
                            toast.success('Shout posted!');
                          } catch (err) {
                            toast.error('Failed to post shout');
                          }
                        }}
                        className="px-6 py-2 bg-[#A3E635] text-white rounded-xl font-bold active:scale-95 transition-transform"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>

                {/* Shouts List */}
                <div className="space-y-4">
                  <h3 className="font-bold text-zinc-900 dark:text-white">Your Shouts</h3>
                  {shouts.length === 0 ? (
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 py-12 rounded-[2rem] flex flex-col items-center justify-center text-center px-6">
                      <Megaphone className="w-10 h-10 text-zinc-200 mb-4" />
                      <p className="text-zinc-500 font-bold">No shouts yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {shouts.map(shout => (
                        <div key={shout.id} className="bg-white dark:bg-zinc-950 p-4 rounded-[2rem] border border-[#F3F4F6] dark:border-zinc-800 shadow-sm group">
                          <div className="flex justify-between items-start mb-2">
                             <p className="text-[14px] text-zinc-900 dark:text-white font-medium">{shout.content}</p>
                             <button 
                               onClick={() => safeWrite('shouts', shout.id, null, 'delete')}
                               className="p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full transition-all"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                          {shout.image && (
                            <img src={shout.image} alt="" className="w-full h-48 object-cover rounded-2xl mb-2" />
                          )}
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">{shout.createdAt ? format(new Date(shout.createdAt), 'MMM d, h:mm a') : 'Just now'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Media Gallery */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900 dark:text-white">Media Gallery</h3>
                    <label className="p-2 bg-lime-50 text-[#A3E635] rounded-xl cursor-pointer hover:bg-lime-100 transition-colors">
                      <Plus className="w-5 h-5" />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*,video/*" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('path', `media/${user?.uid}/${Date.now()}_${file.name}`);
                            const res = await fetch('/api/upload', { method: 'POST', body: formData });
                            const data = await res.json();

                            await safeWrite('media', null, {
                              userId: user?.uid,
                              url: data.url,
                              type: file.type.startsWith('video') ? 'video' : 'image',
                              createdAt: new Date().toISOString()
                            }, 'create');
                            toast.success('Media uploaded!');
                          } catch (err) {
                            toast.error('Failed to upload media');
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  {media.length === 0 ? (
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 py-12 rounded-[2rem] flex flex-col items-center justify-center text-center px-6 border-2 border-dashed border-zinc-100">
                      <ImageIcon className="w-10 h-10 text-zinc-200 mb-4" />
                      <p className="text-zinc-500 font-bold">Your gallery is empty</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {media.map(m => (
                        <div key={m.id} className="aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] overflow-hidden relative group">
                          {m.type === 'image' ? (
                            <img src={m.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <video src={m.url} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                              onClick={() => safeWrite('media', m.id, null, 'delete')}
                              className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}



            {activeTab === 'blogs' && (
              <motion.div 
                key="blogs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 py-6 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[28px] font-black tracking-tighter dark:text-white text-zinc-900">Blog Studio</h2>
                    <p className="text-[#6B7280] text-[14px] font-medium">Write stories and share your expertise.</p>
                  </div>
                  <RouterLink 
                    to="/admin/blog/new"
                    className="flex items-center gap-2 bg-lime-400 text-zinc-950 px-6 py-3 rounded-2xl font-bold hover:bg-lime-300 transition-all shadow-lg shadow-lime-100 dark:shadow-none"
                  >
                    <Plus className="w-5 h-5" />
                    New Post
                  </RouterLink>
                </div>

                <div className="space-y-4">
                  {blogs.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-12 rounded-[2.5rem] text-center flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mb-6">
                        <FileText className="w-10 h-10 text-zinc-200" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 dark:text-white">No blog posts yet</h3>
                      <p className="text-zinc-500 mb-8 max-w-sm">Every great brand starts with a story. Start writing your first post today.</p>
                      <RouterLink to="/admin/blog/new" className="text-lime-500 font-bold hover:underline">Start Writing &rarr;</RouterLink>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {blogs.map(post => (
                        <div key={post.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-[2.5rem] group hover:border-lime-200 dark:hover:border-lime-900/30 transition-all flex items-center gap-6">
                           {post.coverImage ? (
                             <img src={post.coverImage} className="w-24 h-24 rounded-[2rem] object-cover" alt="" referrerPolicy="no-referrer" />
                           ) : (
                             <div className="w-24 h-24 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300">
                               <FileText className="w-10 h-10" />
                             </div>
                           )}
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                  post.published ? "bg-lime-100 text-lime-600" : "bg-zinc-100 text-zinc-400"
                                )}>
                                  {post.published ? 'Published' : 'Draft'}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
                              </div>
                              <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white truncate">{post.title}</h3>
                              <p className="text-sm text-zinc-500 line-clamp-1">{post.excerpt}</p>
                           </div>
                           <div className="flex items-center gap-2">
                             <RouterLink 
                               to={`/admin/blog/edit/${post.id}`}
                               className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all"
                             >
                               <Edit className="w-5 h-5" />
                             </RouterLink>
                             <button 
                               onClick={async () => {
                                 if (window.confirm('Delete this post?')) {
                                   await safeWrite('blogs', post.id, null, 'delete');
                                   toast.success('Post deleted');
                                 }
                               }}
                               className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-red-500 transition-all"
                             >
                               <Trash2 className="w-5 h-5" />
                             </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'shop' && (
              <motion.div 
                key="shop"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 py-6 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[28px] font-black tracking-tighter dark:text-white text-zinc-900">Shop Manager</h2>
                    <p className="text-[#6B7280] text-[14px] font-medium">Sell products directly from your profile.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const name = window.prompt('Product Name:');
                      const price = window.prompt('Price:');
                      if (!name || !price) return;
                      safeWrite('products', null, {
                        userId: user?.uid,
                        name,
                        price: parseFloat(price),
                        description: 'Product description...',
                        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
                        category: 'General',
                        active: true,
                        stock: 10
                      }, 'create').then(() => toast.success('Product added!'));
                    }}
                    className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl"
                  >
                    <Plus className="w-5 h-5" />
                    Add Product
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-12 rounded-[2.5rem] text-center flex flex-col items-center justify-center">
                       <ShoppingCart className="w-12 h-12 text-zinc-200 mb-4" />
                       <h3 className="text-xl font-bold mb-2 dark:text-white">Your shop is empty</h3>
                       <p className="text-zinc-500">Add your first product to start earning.</p>
                    </div>
                  ) : (
                    products.map(product => (
                      <div key={product.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] p-5 group flex gap-5">
                         <div className="w-32 h-32 rounded-[2rem] bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                            <img src={product.image} className="w-full h-full object-cover" alt="" />
                            <button className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                               <label className="cursor-pointer p-2 bg-white/20 backdrop-blur-md rounded-full">
                                  <Camera className="w-4 h-4" />
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      const url = await uploadImage(file, user?.uid || '', 'products');
                                      await safeWrite('products', product.id, { image: url }, 'update');
                                      toast.success('Image updated');
                                    }}
                                  />
                               </label>
                            </button>
                         </div>
                         <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                               <button 
                                 onClick={() => safeWrite('products', product.id, { active: !product.active }, 'update')}
                                 className={cn(
                                   "px-2 py-0.5 rounded-full text-[10px] font-black uppercase",
                                   product.active ? "bg-lime-100 text-lime-600" : "bg-zinc-100 text-zinc-400"
                                 )}
                               >
                                 {product.active ? 'Active' : 'Hidden'}
                               </button>
                               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{product.category}</span>
                            </div>
                            <h4 className="font-black text-lg text-zinc-900 dark:text-white leading-tight mb-0.5">{product.name}</h4>
                            <p className="text-2xl font-black text-lime-500">₦{product.price.toLocaleString()}</p>
                            
                            <div className="flex items-center gap-3 mt-4">
                               <button 
                                 onClick={() => {
                                    const newName = window.prompt('Name:', product.name);
                                    const newPrice = window.prompt('Price:', product.price.toString());
                                    if (newName && newPrice) {
                                      safeWrite('products', product.id, { name: newName, price: parseFloat(newPrice) }, 'update');
                                    }
                                 }}
                                 className="text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors p-1"
                               >
                                  <Edit className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={async () => {
                                    if (window.confirm('Delete product?')) {
                                      await safeWrite('products', product.id, null, 'delete');
                                      toast.success('Product deleted');
                                    }
                                 }}
                                 className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                               >
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'business' && (
              <motion.div 
                key="business"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 py-8 space-y-8"
              >
                <div className="space-y-4">
                  <h2 className="text-[28px] font-black tracking-tighter dark:text-white">Business Hub</h2>
                  <p className="text-[#6B7280] text-[14px] font-medium leading-tight">Scale your brand with advanced monetization and lead tools.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="p-8 bg-black text-white rounded-[2.5rem] relative overflow-hidden group">
                      <div className="relative z-10 space-y-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                          <Crown className="w-6 h-6 text-lime-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">Business Hub</h3>
                          <p className="text-zinc-400 text-sm mt-1">Unlock advanced analytics, maps, and appointment booking.</p>
                        </div>
                        {profile?.plan !== 'business' && (
                          <button 
                            onClick={() => setShowUpgradeModal(true)}
                            className="px-6 py-3 bg-lime-400 text-black font-black rounded-xl text-sm"
                          >
                            Upgrade to Business
                          </button>
                        )}
                      </div>
                      <Crown className="absolute -bottom-8 -right-8 w-48 h-48 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
                    </div>

                    {/* Appointments Management */}
                    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm dark:text-white">Appointments</h4>
                            <p className="text-xs text-zinc-500">Allow users to book time with you.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleUpdateProfile({ appointmentsEnabled: !profile?.appointmentsEnabled })}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${profile?.appointmentsEnabled ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${profile?.appointmentsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {profile?.appointmentsEnabled && (
                        <div className="space-y-4 pt-4 border-t border-zinc-50 dark:border-zinc-800">
                          {profile.appointments?.map((appt, idx) => (
                            <div key={appt.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl">
                              <div>
                                <h5 className="text-xs font-bold dark:text-white">{appt.title}</h5>
                                <p className="text-[10px] text-zinc-500">{appt.dateTime}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  const newAppts = [...(profile.appointments || [])];
                                  newAppts.splice(idx, 1);
                                  handleUpdateProfile({ appointments: newAppts });
                                }}
                                className="text-zinc-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              const title = prompt('Appointment Title:');
                              const dateTime = prompt('Date/Time (e.g. Mon-Fri, 9am-5pm):');
                              const contactLink = prompt('Contact Link (WhatsApp/Calendly):');
                              if (title && dateTime && contactLink) {
                                const newAppts = [...(profile.appointments || []), {
                                  id: Math.random().toString(36).substr(2, 9),
                                  title,
                                  dateTime,
                                  contactLink
                                }];
                                handleUpdateProfile({ appointments: newAppts });
                              }
                            }}
                            className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-500 hover:border-lime-400 hover:text-lime-500 transition-all"
                          >
                            + Add Availability Slot
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Location Management */}
                    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm dark:text-white">Find Us</h4>
                              <span className="text-[10px] bg-lime-400 text-zinc-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">₦10,000 PRO</span>
                            </div>
                            <p className="text-xs text-zinc-500">Show your office or store on a map.</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            if (!checkFeatureAccess('pro', 'Find Us (Maps)')) return;
                            handleUpdateProfile({ mapEnabled: !profile?.mapEnabled });
                          }}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${profile?.mapEnabled ? 'bg-lime-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-transform ${profile?.mapEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      
                      {(!hasAccess('pro')) && (
                        <div className="p-4 bg-lime-400/5 rounded-2xl border border-lime-400/20">
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">This is a premium feature available for <span className="font-black text-zinc-900 dark:text-white">₦10,000</span>. Please upgrade to unlock.</p>
                          <button onClick={() => setShowUpgradeModal(true)} className="mt-2 text-xs font-black text-lime-600 hover:underline">Upgrade Now</button>
                        </div>
                      )}

                      <div className={`space-y-3 ${!hasAccess('pro') ? 'opacity-50 pointer-events-none' : ''}`}>
                        <input 
                          type="text"
                          value={profile?.address || ''}
                          onChange={(e) => handleUpdateProfile({ address: e.target.value })}
                          placeholder="Store Address (e.g. 123 Main St, Lagos)"
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-xs outline-none"
                        />
                        <div className="grid grid-cols-2 gap-3">
                           <input 
                              type="number"
                              value={profile?.location?.lat || ''}
                              onChange={(e) => handleUpdateProfile({ location: { ...profile?.location, lat: parseFloat(e.target.value), lng: profile?.location?.lng || 0 } })}
                              placeholder="Latitude"
                              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-[10px] outline-none"
                           />
                           <input 
                              type="number"
                              value={profile?.location?.lng || ''}
                              onChange={(e) => handleUpdateProfile({ location: { ...profile?.location, lng: parseFloat(e.target.value), lat: profile?.location?.lat || 0 } })}
                              placeholder="Longitude"
                              className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-[10px] outline-none"
                           />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
                        <Mail className="w-5 h-5 text-blue-500" />
                      </div>
                      <h4 className="font-bold text-sm dark:text-white">Lead Capture</h4>
                      <p className="text-xs text-zinc-500 mt-1">Connect Mailchimp or Google Sheets.</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] shadow-sm">
                      <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-4">
                        <CreditCard className="w-5 h-5 text-purple-500" />
                      </div>
                      <h4 className="font-bold text-sm dark:text-white">Shop Links</h4>
                      <p className="text-xs text-zinc-500 mt-1">Sell digital or physical products.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div 
                key="appearance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 py-6 space-y-10"
              >
                <div className="space-y-6">
                    <h2 className="text-[22px] font-black">Social Presence</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {Object.entries(profile?.socialLinks || {}).map(([platform, url]) => {
                        const brand = PLATFORMS.socials.find(p => p.id === platform) || 
                                       PLATFORMS.music.find(p => p.id === platform) ||
                                       PLATFORMS.business.find(p => p.id === platform) ||
                                       PLATFORMS.lifestyle.find(p => p.id === platform);
                        
                        return (
                          <div key={platform} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-[2.5rem] group relative hover:border-lime-200 dark:hover:border-lime-900/30 transition-all flex flex-col items-center text-center gap-3">
                            <SocialIcon 
                              platform={platform} 
                              username={String(url).split('/').pop()?.replace('@', '') || ''} 
                              style={profile?.iconStyle || 'colored'}
                              asLink={false}
                              className="w-14 h-14"
                            />
                            <div className="min-w-0 w-full">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{platform}</p>
                              <p className="text-[11px] font-bold text-zinc-500 truncate mt-0.5">@{String(url).split('/').pop()?.replace('@', '')}</p>
                            </div>
                            <button 
                              onClick={async () => {
                                const newSocials = { ...(profile?.socialLinks || {}) };
                                delete newSocials[platform as keyof typeof newSocials];
                                await handleUpdateProfile({ socialLinks: newSocials });
                                toast.success(`${platform} removed`);
                              }}
                              className="absolute top-2 right-2 p-2 bg-red-50 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                      
                      <button 
                        onClick={() => setIsAddPlatformModalOpen(true)}
                        className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-5 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 hover:border-lime-400 hover:bg-lime-400/5 transition-all text-zinc-400 hover:text-lime-500 min-h-[140px]"
                      >
                        <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-lime-400 group-hover:text-black transition-colors">
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Platform</span>
                      </button>
                    </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[22px] font-black">Icon Style</h3>
                  <div className="flex gap-2 p-2 bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                    <button 
                      onClick={() => handleUpdateProfile({ iconStyle: 'colored' })}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                        (profile?.iconStyle || 'colored') === 'colored' 
                          ? "bg-white dark:bg-zinc-800 shadow-xl border border-zinc-100 dark:border-zinc-700 text-black dark:text-white"
                          : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      )}
                    >
                      <div className="flex -space-x-1.5">
                        <div className="w-4 h-4 rounded-full bg-red-400" />
                        <div className="w-4 h-4 rounded-full bg-blue-400" />
                      </div>
                      Col
                    </button>
                    <button 
                      onClick={() => handleUpdateProfile({ iconStyle: 'glass' })}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                        profile?.iconStyle === 'glass' 
                          ? "bg-white dark:bg-zinc-800 shadow-xl border border-zinc-100 dark:border-zinc-700 text-black dark:text-white"
                          : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      )}
                    >
                      <div className="w-4 h-4 rounded-lg bg-zinc-200/50 backdrop-blur-sm border border-white/20" />
                      Glass
                    </button>
                    <button 
                      onClick={() => handleUpdateProfile({ iconStyle: 'mono' })}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all",
                        profile?.iconStyle === 'mono' 
                          ? "bg-white dark:bg-zinc-800 shadow-xl border border-zinc-100 dark:border-zinc-700 text-black dark:text-white"
                          : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      )}
                    >
                      <div className="w-4 h-4 rounded-full bg-zinc-400 grayscale" />
                      Mono
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-[22px] font-bold">Brand Color</h3>
                   <div className="flex flex-wrap gap-3">
                      {[
                        '#A3E635', // Lime
                        '#3B82F6', // Blue
                        '#EF4444', // Red
                        '#F59E0B', // Amber
                        '#8B5CF6', // Violet
                        '#EC4899', // Pink
                        '#000000', // Black
                        '#6366F1', // Indigo
                        '#10B981', // Emerald
                        '#F97316', // Orange
                      ].map(color => (
                        <button 
                          key={color}
                          onClick={() => handleUpdateProfile({ brandColor: color })}
                          className={`w-10 h-10 rounded-full border-4 transition-all ${profile?.brandColor?.toLowerCase() === color.toLowerCase() ? 'border-zinc-950 dark:border-white scale-110 shadow-lg' : 'border-white dark:border-zinc-800'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs font-bold text-zinc-400">Hex</span>
                        <input 
                          type="text" 
                          value={profile?.brandColor || ''}
                          onChange={(e) => handleUpdateProfile({ brandColor: e.target.value })}
                          className="w-24 h-10 px-3 bg-[#F3F4F6] border-none rounded-xl text-xs font-bold uppercase"
                          placeholder="#000000"
                        />
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-[22px] font-bold">Text Color</h3>
                   <div className="flex flex-wrap gap-3">
                      {[
                        '#000000', '#FFFFFF', '#6B7280', '#E5E7EB'
                      ].map(color => (
                        <button 
                          key={color}
                          onClick={() => handleUpdateProfile({ textColor: color })}
                          className={`w-10 h-10 rounded-full border-4 transition-all ${profile?.textColor?.toLowerCase() === color.toLowerCase() ? 'border-zinc-950 dark:border-white scale-110 shadow-lg' : 'border-white dark:border-zinc-800 shadow-sm'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs font-bold text-zinc-400">Hex</span>
                        <input 
                          type="text" 
                          value={profile?.textColor || ''}
                          onChange={(e) => handleUpdateProfile({ textColor: e.target.value })}
                          className="w-24 h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-colors"
                          placeholder="#000000"
                        />
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between px-2">
                     <h3 className="text-[22px] font-black">Verification</h3>
                     {profile?.isVerified && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#1D9BF0] rounded-full text-[10px] font-black uppercase">
                          <Check className="w-3 h-3" /> Verified
                        </div>
                     )}
                   </div>
                   
                   <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#1D9BF0]/20 blur-[50px] rounded-full" />
                      <div className="relative z-10 space-y-4">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#1D9BF0] rounded-2xl flex items-center justify-center shadow-lg shadow-[#1D9BF0]/30 transform group-hover:rotate-12 transition-transform">
                               <BadgeCheck className="w-8 h-8 text-white fill-white stroke-[#1D9BF0]" />
                            </div>
                            <div>
                               <h4 className="text-xl font-black">Official Verification</h4>
                               <p className="text-zinc-400 text-xs font-medium">Add the prestigious blue tick to your bio.</p>
                            </div>
                         </div>
                         <div className="pt-4 flex items-center justify-between">
                            <div className="flex flex-col">
                               <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Investment</span>
                               <span className="text-2xl font-black">₦2,000</span>
                            </div>
                            {!profile?.isVerified && (
                               <button 
                                 onClick={triggerVerification}
                                 className="px-8 py-3 bg-white text-black font-black rounded-2xl text-xs hover:bg-[#1D9BF0] hover:text-white transition-all shadow-xl"
                               >
                                 Get Verified
                               </button>
                            )}
                         </div>
                      </div>
                   </div>
                </div>

                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-[22px] font-black tracking-tight">AI Profile Designer</h3>
                       <div className="px-3 py-1 bg-lime-400/10 text-lime-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-lime-400/20">βeta</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-lime-400/10 to-blue-500/10 border border-lime-400/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group">
                       {!hasAccess('pro') && (
                         <div className="absolute inset-0 z-20 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center" onClick={() => checkFeatureAccess('pro', 'AI Designer')}>
                            <Crown className="w-12 h-12 text-amber-500 mb-4" />
                            <h4 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Pro Exclusive</h4>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">Upgrade to use AI-powered profile design</p>
                            <button 
                              onClick={(e) => { e.stopPropagation(); navigate('/pricing'); }}
                              className="mt-6 px-8 py-3 bg-zinc-950 text-white rounded-xl font-black text-xs uppercase tracking-widest"
                            >
                              Upgrade Now
                            </button>
                         </div>
                       )}
                       <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/10 blur-[50px] rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                       
                       <div className="relative z-10 space-y-4">
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl border border-lime-400/30">
                                <Sparkles className="w-8 h-8 text-lime-500 animate-pulse" />
                             </div>
                             <div>
                                <h4 className="text-xl font-black">Design with AI</h4>
                                <p className="text-zinc-500 text-xs font-medium">Tell the AI what you want (e.g. "make my profile minimalist with blue accents")</p>
                             </div>
                          </div>
                          
                          <div className="flex flex-col gap-3">
                             <div className="relative">
                                <input 
                                  type="text"
                                  value={aiPrompt}
                                  onChange={(e) => setAiPrompt(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAIDesign()}
                                  placeholder="Describe your dream profile..."
                                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-5 outline-none focus:ring-2 focus:ring-lime-400 transition-all font-medium pr-16 shadow-inner"
                                />
                                <button 
                                  disabled={isAiTyping || !aiPrompt.trim()}
                                  onClick={handleAIDesign}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-zinc-950 text-white rounded-xl hover:bg-lime-400 hover:text-black transition-all disabled:opacity-50"
                                >
                                  {isAiTyping ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                             </div>
                             
                             <AnimatePresence mode="wait">
                               {aiResponse && (
                                 <motion.div 
                                   initial={{ opacity: 0, y: 10 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   exit={{ opacity: 0, scale: 0.95 }}
                                   className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border border-lime-200 dark:border-lime-900/30 p-5 rounded-2xl"
                                 >
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Bot className="w-4 h-4 text-zinc-500" />
                                      </div>
                                      <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">{aiResponse}</p>
                                    </div>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-[22px] font-black">Themes & Identity</h3>
                   <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'minimal', name: 'Cloud Minimal', color: 'bg-white' },
                        { id: 'modern', name: 'Shadow Modern', color: 'bg-zinc-950' },
                        { id: 'brutalist', name: 'Raw Brutalist', color: 'bg-yellow-400' },
                        { id: 'gradient', name: 'Neon Gradient', color: 'bg-gradient-to-br from-purple-500 to-pink-500' },
                      ].map(t => (
                        <button 
                          key={t.id}
                          onClick={() => handleUpdateProfile({ theme: t.id as ThemeType })}
                          className={`aspect-[4/3] rounded-[2.5rem] border-4 transition-all p-4 flex flex-col gap-3 relative overflow-hidden ${profile?.theme === t.id ? 'border-lime-400 scale-102 shadow-2xl' : 'border-zinc-100 dark:border-zinc-800'}`}
                        >
                          <div className={`absolute inset-0 opacity-10 ${t.color}`} />
                          <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                          <div className="w-2/3 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                          <div className="mt-auto flex items-center justify-between">
                             <span className="text-[13px] font-black leading-tight max-w-[80px]">{t.name}</span>
                             <div className={`w-6 h-6 rounded-lg ${t.color} border border-white/20`} />
                          </div>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-[22px] font-bold">Background</h3>
                   <div className="flex gap-4">
                      {['solid', 'gradient', 'image'].map(type => (
                        <button 
                          key={type}
                          onClick={() => handleUpdateProfile({ backgroundType: type as any })}
                          className={`flex-1 py-3 rounded-xl border-2 font-bold text-[14px] capitalize ${profile?.backgroundType === type ? 'border-[#A3E635] text-[#A3E635]' : 'border-[#F3F4F6] text-[#6B7280]'}`}
                        >
                          {type}
                        </button>
                      ))}
                   </div>
                   {profile?.backgroundType === 'solid' && (
                     <div className="mt-4 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-1">Background Color</h4>
                        <div className="flex flex-wrap gap-3">
                           {[
                             '#FFFFFF', '#000000', '#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF',
                             '#FCD34D', '#F87171', '#60A5FA', '#34D399', '#A78BFA', '#F472B6',
                             '#FB923C', '#2DD4BF', '#6366F1'
                           ].map(color => (
                             <button 
                               key={color}
                               onClick={() => handleUpdateProfile({ backgroundColor: color })}
                               className={`w-10 h-10 rounded-full border-4 transition-all ${profile?.backgroundColor?.toLowerCase() === color.toLowerCase() ? 'border-zinc-950 dark:border-white scale-110 shadow-lg' : 'border-white dark:border-zinc-800 shadow-sm'}`}
                               style={{ backgroundColor: color }}
                             />
                           ))}
                           <div className="flex items-center gap-2 ml-auto">
                             <div className="relative group/picker">
                               <div 
                                 className="w-10 h-10 rounded-full border-4 border-white dark:border-zinc-800 shadow-sm overflow-hidden"
                                 style={{ backgroundColor: profile?.backgroundColor || '#FFFFFF' }}
                               >
                                 <input 
                                   type="color" 
                                   value={profile?.backgroundColor || '#FFFFFF'}
                                   onChange={(e) => handleUpdateProfile({ backgroundColor: e.target.value })}
                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                 />
                               </div>
                             </div>
                             <input 
                               type="text" 
                               value={profile?.backgroundColor || ''}
                               onChange={(e) => handleUpdateProfile({ backgroundColor: e.target.value })}
                               className="w-24 h-10 px-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 ring-zinc-200"
                               placeholder="#FFFFFF"
                             />
                           </div>
                        </div>
                     </div>
                   )}

                   {profile?.backgroundType === 'image' && (
                     <div className="mt-4">
                        <ImageUpload 
                          folder="backgrounds"
                          userId={user?.uid || ''}
                          initialImage={profile?.backgroundImage}
                          onSuccess={(url) => handleUpdateProfile({ backgroundImage: url })}
                          label="Custom Background Image"
                        />
                     </div>
                   )}
                </div>
              </motion.div>
            )}

            {activeTab === 'backup' && (
              <motion.div 
                key="backup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 py-8 space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-[28px] font-black tracking-tighter dark:text-white">Revision History</h2>
                  <p className="text-[#6B7280] text-[14px] font-medium leading-tight">Manage system-wide backups and restore previous versions of your data.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-lime-50 dark:bg-lime-900/20 rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-lime-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm dark:text-white">Profile Control</h3>
                          <p className="text-xs text-zinc-500">Restore your personal profile settings.</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => profile && fetchHistory('users', profile.uid)}
                        className="px-4 py-2 bg-[#A3E635] text-white text-xs font-bold rounded-lg shadow-lg shadow-lime-200"
                      >
                        View History
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] shadow-sm space-y-4 overflow-hidden">
                    <h3 className="font-bold text-sm dark:text-white mb-2">Tracked Content Links</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {links.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-4 text-center italic">No links added yet to track history.</p>
                      ) : links.map(link => (
                        <div key={link.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 hover:border-zinc-300 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                               {link.icon ? <img src={link.icon} alt="" className="w-full h-full object-cover" /> : <LinkIcon className="w-4 h-4 text-zinc-400" />}
                             </div>
                             <span className="text-xs font-bold dark:text-white truncate max-w-[120px]">{link.title || 'Untitled Link'}</span>
                          </div>
                          <button 
                            onClick={() => fetchHistory('links', link.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <HistoryIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100/50 dark:border-blue-800/50 flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <RotateCcw className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-blue-900 dark:text-blue-200">Safety First</h4>
                    <p className="text-xs text-blue-700/80 dark:text-blue-400/80 leading-relaxed mt-1 font-medium italic">
                      "Data is immortal, but mistakes should be reversible." Every significant change is automatically versioned.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'verification' && (
              <motion.div 
                key="verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 py-8 space-y-8"
              >
                <div className="space-y-4 text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <BadgeCheck className="w-12 h-12 text-[#1D9BF0] fill-[#1D9BF0] stroke-white stroke-1" />
                  </div>
                  <h2 className="text-[24px] font-black">Get Verified</h2>
                  <p className="text-zinc-500 text-[14px]">
                    Stand out with a blue tick verification badge on your profile.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-[14px] font-medium text-zinc-600">Boost your credibility and trust</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-[14px] font-medium text-zinc-600">Priority support and early access</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-50">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[14px] font-bold text-zinc-400">One-time fee</span>
                      <span className="text-[20px] font-black">₦2,000</span>
                    </div>

                    {profile?.isVerified ? (
                      <div className="w-full py-4 bg-zinc-50 text-zinc-400 rounded-2xl font-black text-center flex items-center justify-center gap-2">
                        <BadgeCheck className="w-5 h-5" />
                        Verified Account
                      </div>
                    ) : (
                      <button 
                        onClick={triggerVerification}
                        className="w-full py-4 bg-black text-white rounded-2xl font-black shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Get Verified Now
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'billing' && (
              <motion.div 
                key="billing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 py-8 space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-8 bg-zinc-900 text-white rounded-[2.5rem] space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Current Plan</p>
                      <Crown className="w-5 h-5 text-lime-400" />
                    </div>
                    <div>
                      <h3 className="text-4xl font-black capitalize">{profile?.plan || 'Basic'}</h3>
                      <p className="text-zinc-500 text-sm mt-1">
                        {profile?.plan === 'pro' || profile?.plan === 'business' 
                          ? `Renews on ${profile.premiumUntil ? format(new Date(profile.premiumUntil), 'MMM d, yyyy') : 'soon'}`
                          : 'Unlock more features with Pro'}
                      </p>
                    </div>
                    {profile?.plan !== 'business' && (
                      <button 
                        onClick={() => navigate('/pricing')}
                        className="w-full py-3 bg-white text-black font-black rounded-xl text-sm"
                      >
                        Upgrade Plan
                      </button>
                    )}
                  </div>

                  <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] space-y-6">
                    <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Ad-Free Experience</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-lime-50 dark:bg-lime-900/20 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-lime-600" />
                      </div>
                      <div>
                        <h4 className="font-bold dark:text-white">Active Status</h4>
                        <p className="text-xs text-zinc-500">Your profile is currently clean and fast.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-black dark:text-white ml-2">Payment History</h3>
                  {transactions.length === 0 ? (
                    <div className="p-12 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                      <CreditCard className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
                      <p className="text-zinc-400 font-bold">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map(tx => (
                        <div key={tx.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-50 dark:border-zinc-800 rounded-[2rem] flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                              <p className="font-bold text-sm dark:text-white capitalize">{tx.plan} Subscription</p>
                              <p className="text-[10px] text-zinc-400 uppercase font-black">{tx.reference}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm dark:text-white">₦{tx.amount.toLocaleString()}</p>
                            <p className="text-[10px] text-zinc-400 font-bold">{tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, yyyy') : 'Just now'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 py-8 space-y-8"
              >
                <div className="space-y-6">
                  <h2 className="text-[24px] font-black text-zinc-900 dark:text-white transition-colors duration-300">Account Settings</h2>
                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Username</label>
                      <input 
                        type="text" 
                        value={profile?.username}
                        disabled
                        className="w-full h-12 bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl px-4 font-bold text-zinc-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Display Name</label>
                      <input 
                        type="text" 
                        value={profile?.displayName}
                        onChange={(e) => handleUpdateProfile({ displayName: e.target.value })}
                        className="w-full h-12 bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl px-4 font-bold text-zinc-900 dark:text-white transition-colors duration-300"
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={() => auth.signOut()}
                      className="w-full py-4 border-2 border-red-100 dark:border-red-900/20 text-red-500 rounded-2xl font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

        {/* Right Side: Phone Preview (Sticky) */}
        <aside className="hidden xl:flex w-[500px] h-screen border-l border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 items-center justify-center sticky top-0 px-8">
           <div className="relative w-full max-w-[320px] aspect-[9/18.5] bg-zinc-950 rounded-[3.5rem] border-[10px] border-zinc-900 dark:border-zinc-800 shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col group p-1 transition-all">
              {/* iPhone Dynamic Island */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-8 bg-zinc-900 dark:bg-zinc-800 rounded-b-3xl z-50 flex items-center justify-center gap-1.5">
                 <div className="w-1 h-1 rounded-full bg-zinc-700" />
                 <div className="w-10 h-1 bg-zinc-800 rounded-full" />
              </div>

              {/* Preview Content Inside Phone */}
              <div className={cn(
                "flex-1 overflow-y-auto no-scrollbar relative rounded-[2.8rem] transition-colors duration-500",
                profile && THEMES[profile.theme]?.background ? THEMES[profile.theme].background : "bg-zinc-950",
                profile && THEMES[profile.theme]?.text ? THEMES[profile.theme].text : "text-white"
              )}>
                 {/* Mock Banner */}
                 <div className="relative h-28 w-full overflow-hidden">
                    {profile?.coverImage ? (
                      <img src={profile.coverImage} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full bg-zinc-900 shadow-inner" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                 </div>

                     <div className="p-6 space-y-6 flex flex-col items-center pt-4">
                     <div className="text-center space-y-1 relative z-10 font-sans">
                        <h3 className={cn(
                          "font-black text-lg flex items-center justify-center gap-1",
                          profile && THEMES[profile.theme]?.text ? "text-inherit" : "text-white"
                        )}>
                          {profile?.displayName || '@username'}
                          {profile?.isVerified && <BadgeCheck className="w-4 h-4 text-[#1D9BF0] fill-[#1D9BF0] stroke-white stroke-[1.5px]" />}
                        </h3>
                        {profile?.username && <p className="text-[10px] font-black text-[#A3E635] tracking-tight">@{profile?.username}</p>}
                     </div>

                      {/* Mock Social Icons */}
                     <div className="flex gap-2.5 justify-center relative z-10 w-full overflow-hidden px-4">
                        {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 ? 
                          Object.entries(profile.socialLinks).slice(0, 6).map(([platform, username]) => {
                            const platformInfo = Object.values(PLATFORMS).flat().find(p => p.id === platform.toLowerCase());
                            const IconComponent = platformInfo?.icon || BrandIcons[platform.toLowerCase() as keyof typeof BrandIcons] || Globe;
                            const color = platformInfo?.color || '#6366f1';
                            
                            return (
                              <div 
                                key={platform} 
                                className="w-8 h-8 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/5 flex items-center justify-center shrink-0 shadow-lg"
                                style={{ color: color }}
                              >
                                <div className="w-4 h-4">
                                  <IconComponent className="w-full h-full" />
                                </div>
                              </div>
                            );
                          })
                        : [1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                               <Globe className="w-4 h-4 text-zinc-800" />
                            </div>
                        ))}
                     </div>
                    </div>

                    <p className={cn(
                      "text-[10px] text-center font-medium leading-relaxed px-4 relative z-10 opacity-70",
                      profile && THEMES[profile.theme]?.text ? "text-inherit" : "text-zinc-500"
                    )}>
                      {profile?.bio || 'Bio preview will appear here...'}
                    </p>

                    {/* Links Mock */}
                    <div className="w-full space-y-3 px-1 relative z-10 mt-4">
                       {links.length > 0 ? links.slice(0, 3).map(link => (
                         <div 
                           key={link.id} 
                           className={cn(
                             "w-full p-3.5 border rounded-2xl shadow-sm flex items-center justify-center font-black text-[10px] uppercase tracking-wider transition-all",
                             profile?.buttonStyle === 'square' 
                               ? "bg-white border-black border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black"
                               : "bg-white/10 dark:bg-black/20 backdrop-blur-md border-white/10 text-inherit hover:bg-white/20"
                           )}
                         >
                            {link.title}
                         </div>
                       )) : [1, 2].map(i => (
                         <div key={i} className="w-full h-12 bg-zinc-900 rounded-2xl animate-pulse" />
                       ))}
                    </div>

                  <div className="pt-8 opacity-40 relative z-10 pb-12 text-center flex justify-center">
                     <Logo size="sm" color="neon" />
                  </div>
               </div>

               {/* iPhone Home Indicator */}
               <div className="h-1 bg-zinc-900/10 dark:bg-white/10 w-32 rounded-full mx-auto mb-4 absolute bottom-2 left-1/2 -translate-x-1/2 z-50" />
               
               {/* Overlay Label */}
               <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[4px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-[60] pointer-events-none group-hover:pointer-events-auto">
                  <button 
                   onClick={() => window.open(`/${profile?.username}`, '_blank')}
                   className="px-8 py-4 bg-lime-400 text-zinc-950 font-black rounded-3xl flex items-center gap-3 shadow-2xl scale-90 group-hover:scale-100 transition-all border-4 border-white/20"
                  >
                    Live View <ExternalLink className="w-5 h-5" />
                  </button>
               </div>
            </div>
         </aside>
      </main>

      {/* Floating Bottom Nav (Mobile Only) */}
      <nav className="fixed lg:hidden bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-2 rounded-full flex items-center gap-1 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[110] ring-1 ring-white/10">
        {[
          { id: 'links', icon: LayoutGrid, label: 'Edit' },
          { id: 'analytics', icon: TrendingUp, label: 'Stats' },
          { id: 'appearance', icon: Palette, label: 'Style' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              "p-4 rounded-full transition-all flex items-center gap-2",
              activeTab === item.id 
                ? "bg-lime-400 text-zinc-950 shadow-xl scale-110" 
                : "text-zinc-500 hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5" />
            {activeTab === item.id && <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>}
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {isAddPlatformModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddPlatformModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: '100%', scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: '100%', scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-t-[3.5rem] sm:rounded-[3.5rem] p-8 pb-12 shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex flex-col h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden"
            >
              <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mx-auto mb-8 sm:hidden" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">Add Platform</h2>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Enhance Your Digital Footprint</p>
                </div>
                <button 
                  onClick={() => setIsAddPlatformModalOpen(false)}
                  className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors group"
                >
                  <X className="w-6 h-6 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search over 30+ platforms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-16 bg-zinc-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 border-2 border-transparent focus:border-[#A3E635] rounded-[2rem] pl-14 pr-6 transition-all font-bold text-zinc-900 dark:text-white shadow-inner"
                />
              </div>

              {/* Categories Scroll */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-8 mb-2 -mx-2 px-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-2xl whitespace-nowrap font-black text-xs uppercase tracking-widest transition-all border-2",
                      selectedCategory === cat.id 
                        ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xl" 
                        : "bg-white dark:bg-zinc-900 text-zinc-400 border-zinc-50 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white"
                    )}
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 xs:grid-cols-3 gap-4 pr-1 pb-4">
                {filteredPlatforms.length > 0 ? (
                  filteredPlatforms.map(platform => {
                    const isAdded = profile?.socialLinks && !!profile.socialLinks[platform.id as keyof typeof profile.socialLinks];
                    return (
                      <div key={platform.id} className="relative group">
                        <button
                          onClick={() => handleSelectPlatform(platform.id, platform.urlPrefix)}
                          className={cn(
                            "w-full flex flex-col items-center justify-center gap-4 p-8 rounded-[3rem] border-2 transition-all hover:scale-[1.05] active:scale-[0.95] relative overflow-hidden group",
                            isAdded 
                              ? "bg-lime-50 dark:bg-lime-900/10 border-lime-200 dark:border-lime-900/30" 
                              : "bg-zinc-50/50 dark:bg-zinc-800/50 border-transparent hover:border-lime-400/30 hover:bg-white dark:hover:bg-zinc-800 hover:shadow-[0_20px_50px_rgba(163,230,53,0.1)]"
                          )}
                        >
                          <div 
                            className="w-16 h-16 flex items-center justify-center transition-all group-hover:rotate-12"
                          >
                            <SocialIcon 
                              platform={platform.id} 
                              username="" 
                              style={profile?.iconStyle || 'colored'} 
                              asLink={false}
                              className="w-full h-full"
                            />
                          </div>
                          <span className="font-black text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">{platform.label}</span>
                          
                          {isAdded && (
                            <div className="absolute top-4 right-4 w-6 h-6 bg-lime-400 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm z-20">
                              <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3px]" />
                            </div>
                          )}
                        </button>
                        
                        {isAdded && (
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`Remove ${platform.label}?`)) {
                                const newLinks = { ...profile.socialLinks };
                                delete newLinks[platform.id as keyof typeof newLinks];
                                await handleUpdateProfile({ socialLinks: newLinks });
                              }
                            }}
                            className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border-2 border-white dark:border-zinc-900 shadow-xl z-30 hover:bg-red-600 hover:scale-110 active:scale-90"
                          >
                            <X className="w-4 h-4 font-black" />
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                       <Search className="w-10 h-10 text-zinc-300" />
                    </div>
                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No matching platforms found</p>
                  </div>
                )}
              </div>

              {/* Added Platforms Section */}
              {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && searchQuery === '' && (
                <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Live Social Stack ({Object.keys(profile.socialLinks).length})</h4>
                    <button 
                      onClick={() => handleUpdateProfile({ socialLinks: {} })}
                      className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(profile.socialLinks).map(([id, url]) => (
                      <div key={id} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-100 dark:border-zinc-700 group hover:border-[#A3E635] transition-all">
                        <span className="text-xs font-black capitalize text-zinc-700 dark:text-zinc-300">{id}</span>
                        <button 
                          onClick={async () => {
                            const newSocials = { ...profile.socialLinks };
                            delete (newSocials as any)[id];
                            await handleUpdateProfile({ socialLinks: newSocials });
                            toast.success(`${id} removed`);
                          }}
                          className="text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <UpgradeModal 
        isOpen={upgradeModal.isOpen} 
        onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
        requiredPlan={upgradeModal.requiredPlan}
        featureName={upgradeModal.featureName}
        onUpgrade={handleUpgrade}
      />

      {/* Backup History Modal */}
      <AnimatePresence>
        {historyModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800"
            >
              <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <HistoryIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    Version History
                  </h2>
                  <p className="text-[13px] text-zinc-500 mt-1 font-medium">Restore from a previous backup of this {historyModal.collection}.</p>
                </div>
                <button 
                  onClick={() => setHistoryModal(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45 text-zinc-400" />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto p-4 custom-scrollbar">
                {backups.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <RotateCcw className="w-10 h-10 text-zinc-200 dark:text-zinc-700" />
                    </div>
                    <p className="text-zinc-400 font-bold tracking-tight text-lg">No backups found</p>
                    <p className="text-zinc-500 text-sm mt-2">Changes are automatically backed up before edits.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {backups.map((backup) => (
                      <div 
                        key={backup.id}
                        className="p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            backup.action === 'create' ? "bg-green-50 text-green-600 shadow-sm shadow-green-100" :
                            backup.action === 'update' ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100" :
                            backup.action === 'delete' ? "bg-red-50 text-red-600 shadow-sm shadow-red-100" :
                            "bg-purple-50 text-purple-600 shadow-sm shadow-purple-100"
                          )}>
                            {backup.action === 'create' ? <Plus className="w-6 h-6" /> :
                             backup.action === 'update' ? <Settings className="w-6 h-6" /> :
                             backup.action === 'delete' ? <Trash2 className="w-6 h-6" /> :
                             <RotateCcw className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[15px] font-black dark:text-white capitalize">
                                {backup.action === 'rollback' ? 'System Restore' : `${backup.action} Action`}
                              </p>
                              {backup.performedBy === 'system' && (
                                <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">System</span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {backup.timestamp?.toDate ? format(backup.timestamp.toDate(), 'MMM d, h:mm a') : 'Just now'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => backup.id && handleRollback(backup.id)}
                          disabled={isRollingBack}
                          className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black text-[13px] font-black rounded-2xl opacity-0 group-hover:opacity-100 disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-zinc-200 dark:shadow-none"
                        >
                          Restore Version
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-amber-900 dark:text-amber-400">Critical Warning</h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium mt-0.5">
                      Restoring will overwrite current data. A safety snapshot will be created before this action is finalized.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
