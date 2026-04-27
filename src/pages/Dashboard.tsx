import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage, getUserByUsername, handleFirestoreError, OperationType } from '../firebase';
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
  History as HistoryIcon, RotateCcw, Megaphone, Clock, BadgeCheck
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Link, Transaction, THEMES, ThemeType, ButtonStyle, User as UserType, PlanType, Appointment, Shout, Media } from '../types';
import { auth } from '../firebase';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { DISPLAY_DOMAIN } from '../constants';
import UpgradeModal from '../components/UpgradeModal';
import { Instagram, Twitter, Linkedin, Facebook, MessageCircle, MapPin, Github, Twitch, Mail, Ghost, MessageSquare, Youtube, Music2 } from 'lucide-react';
import { VerificationBadge } from '../components/VerificationBadge';
import { usePaystackPayment } from 'react-paystack';
import { preparePaystackConfig, getPaystackPublicKey } from '../utils/paystack';
import { safeWrite, getBackupHistory, rollbackDocument, rollbackToVersion, BackupData } from '../services/backupService';
import { AIDesigner } from '../components/AIDesigner';
import { BrandIcons } from '../components/icons/BrandIcons';
import { Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SortableLinkItem = ({ link, onUpdate, onDelete, isPremium, onUploadIcon, isUploading, isAdmin, onViewHistory }: { 
  link: Link; 
  onUpdate: (id: string, data: Partial<Link>) => void;
  onDelete: (id: string) => void;
  isPremium: boolean;
  onUploadIcon: (e: React.ChangeEvent<HTMLInputElement>, linkId: string) => void;
  isUploading: boolean;
  isAdmin: boolean;
  onViewHistory: (collection: string, id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: link.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [showSettings, setShowSettings] = useState(false);

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
      return null;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col gap-4 group">
      <div className="flex items-center gap-4">
        <button {...attributes} {...listeners} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5" />
        </button>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative group/icon">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
                {link.icon ? (
                  <img src={link.icon} alt="" className="w-full h-full object-cover" />
                ) : getFavicon(link.url) ? (
                  <img src={getFavicon(link.url)!} alt="" className="w-6 h-6" referrerPolicy="no-referrer" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-zinc-400" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-lg opacity-0 group-hover/icon:opacity-100 cursor-pointer transition-opacity">
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
            <input 
              type="text" 
              value={link.title}
              onChange={(e) => onUpdate(link.id, { title: e.target.value })}
              className="flex-1 bg-transparent font-bold text-zinc-900 dark:text-white outline-none"
              placeholder="Link Title"
            />
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <Settings className="w-4 h-4" />
              </button>
              {isAdmin && (
                <button 
                  onClick={() => onViewHistory('links', link.id)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="View History"
                >
                  <HistoryIcon className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => onUpdate(link.id, { active: !link.active })}
                className={`transition-colors ${link.active ? 'text-lime-500' : 'text-zinc-400'}`}
              >
                {link.active ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <input 
            type="text" 
            value={link.url}
            onChange={(e) => onUpdate(link.id, { url: e.target.value })}
            className="w-full bg-transparent text-sm text-zinc-500 outline-none"
            placeholder="https://example.com"
          />
        </div>

        <button 
          onClick={() => onDelete(link.id)}
          className="text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {showSettings && (
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Link Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Link Type</label>
            <div className="flex gap-2">
              {[
                { id: 'standard', icon: LinkIcon },
                { id: 'youtube', icon: Youtube },
                { id: 'tiktok', icon: Music2 }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdate(link.id, { type: t.id as any })}
                  className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border transition-all ${
                    link.type === t.id || (!link.type && t.id === 'standard')
                      ? 'border-lime-400 bg-lime-400/5 text-lime-600'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  <span className="text-xs font-bold capitalize">{t.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Scheduling</label>
              {!isPremium && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" /> PRO
                </span>
              )}
            </div>
            <div className={`grid grid-cols-2 gap-2 ${!isPremium ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Start</span>
                <input 
                  type="datetime-local" 
                  value={link.scheduledStart || ''}
                  onChange={(e) => onUpdate(link.id, { scheduledStart: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 text-[10px] p-2 rounded-lg outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">End</span>
                <input 
                  type="datetime-local" 
                  value={link.scheduledEnd || ''}
                  onChange={(e) => onUpdate(link.id, { scheduledEnd: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 text-[10px] p-2 rounded-lg outline-none"
                />
              </div>
            </div>
          </div>
        </div>
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'business' | 'analytics' | 'verification' | 'billing' | 'settings' | 'backup' | 'ai' | 'posts'>('links');
  const [isAddPlatformModalOpen, setIsAddPlatformModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof PLATFORMS>('socials');
  const [searchQuery, setSearchQuery] = useState('');
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; requiredPlan: PlanType; featureName: string }>({
    isOpen: false,
    requiredPlan: 'pro',
    featureName: ''
  });
  const [historyModal, setHistoryModal] = useState<{ collection: string; id: string } | null>(null);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!user) return;

    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UserType;
        setProfile(data);
        setProfileForm({
          username: data.username || '',
          displayName: data.displayName || '',
          bio: data.bio || '',
          phone: data.phone || '',
          address: data.address || '',
          contactEmail: data.contactEmail || '',
          textColor: data.textColor || ''
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    const q = query(collection(db, 'links'), where('userId', '==', user.uid));
    const unsubLinks = onSnapshot(q, (snapshot) => {
      const sortedLinks = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Link))
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

    const qShouts = query(collection(db, 'shouts'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubShouts = onSnapshot(qShouts, (snapshot) => {
      setShouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shout)));
    });

    const qMedia = query(collection(db, 'media'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubMedia = onSnapshot(qMedia, (snapshot) => {
      setMedia(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Media)));
    });

    // Trigger subscription expiry check on load
    fetch('/api/cron/check-subscriptions', { method: 'POST' })
      .catch(err => console.error('Expiry check failed:', err));

    return () => {
      unsubProfile();
      unsubLinks();
      unsubTx();
      unsubShouts();
      unsubMedia();
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

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) {
      return null;
    }
  };

  const handleUpdateLink = async (id: string, data: Partial<Link>) => {
    try {
      const updateData = { ...data };
      if (data.url && data.url.startsWith('http')) {
        const icon = getFavicon(data.url);
        if (icon) updateData.icon = icon;
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

      // Ensure we don't accidentally remove required fields if they are missing in the local state
      // but required by security rules. We fetch the current doc to be sure.
      const userRef = doc(db, 'users', user.uid);
      const currentDoc = await getDoc(userRef);
      const currentData = (currentDoc.exists() ? currentDoc.data() : {}) as UserType;

      // Merge with default values if missing (for legacy users)
      const updatePayload: any = { ...data };
      if (!currentData.backgroundType) updatePayload.backgroundType = 'solid';
      if (!currentData.theme) updatePayload.theme = 'minimal';
      if (!currentData.buttonStyle) updatePayload.buttonStyle = 'rounded';

      const success = await safeWrite('users', user.uid, updatePayload, 'update');
      if (success) {
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

    if (type === 'background' && !hasAccess('pro')) {
      checkFeatureAccess('pro', 'Custom Background');
      return;
    }

    if (type === 'link-icon' && !hasAccess('pro')) {
      checkFeatureAccess('pro', 'Custom Link Icons');
      return;
    }

    setIsUploading(true);
    const folder = type === 'profile' ? 'profiles' : type === 'cover' ? 'covers' : type === 'background' ? 'backgrounds' : 'link-icons';
    const timestamp = Date.now();
    const storagePath = `${folder}/${user.uid}/${timestamp}_${file.name}`;
    
    console.log(`Starting server-side upload proxy to: ${storagePath}`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', storagePath);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { url } = await response.json();
      console.log('Upload successful via proxy, URL:', url);
      
      if (type === 'profile') {
        await handleUpdateProfile({ photoURL: url });
      } else if (type === 'cover') {
        await handleUpdateProfile({ coverImage: url });
      } else if (type === 'background') {
        await handleUpdateProfile({ backgroundImage: url, backgroundType: 'image' });
      } else if (type === 'link-icon' && linkId) {
        await handleUpdateLink(linkId, { icon: url });
      }
      toast.success(`${type.replace('-', ' ')} updated`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type.replace('-', ' ')} image: ${error.message}`);
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
      links.length > 0
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
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-zinc-900 md:flex md:items-center md:justify-center md:p-8 font-sans transition-colors duration-300">
      {/* Sidebar for Desktop - Minimal */}
      <aside className="hidden md:flex flex-col w-64 h-[844px] bg-white dark:bg-zinc-950 rounded-l-[3rem] p-8 border-r border-[#F3F4F6] dark:border-zinc-800 shadow-xl transition-colors duration-300">
        <RouterLink to="/" className="mb-10">
          <Logo size="sm" className="!justify-start" />
        </RouterLink>
        <nav className="flex-1 space-y-1">
          {[
            { id: 'links', icon: LinkIcon, label: 'Edit Profile' },
            { id: 'posts', icon: ImageIcon, label: 'Posts & Media' },
            { id: 'analytics', icon: BarChart2, label: 'Analytics' },
            { id: 'business', icon: Crown, label: 'Business' },
            { id: 'verification', icon: BadgeCheck, label: 'Verification' },
            { id: 'billing', icon: CreditCard, label: 'Billing' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-[#A3E635] text-white font-bold shadow-lg shadow-lime-200' 
                  : 'text-[#6B7280] hover:bg-[#F9FAFB]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => auth.signOut()} className="flex items-center gap-3 px-4 py-3 text-[#6B7280] hover:text-red-500">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* Main Mobile-Style Container */}
      <div className="w-full max-w-[390px] h-screen md:h-[844px] bg-white dark:bg-zinc-950 overflow-hidden relative md:shadow-2xl md:rounded-r-[3rem] md:rounded-l-none flex flex-col border-x md:border-l-0 border-[#F3F4F6] dark:border-zinc-800 transition-colors duration-300">
        {/* Status Bar */}
        <div className="h-10 flex items-center justify-between px-8 text-[12px] font-bold bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-400 z-20">
          <span>{format(new Date(), 'HH:mm')}</span>
          <div className="flex gap-1.5 items-center">
            <div className="w-3.5 h-3.5 rounded-full border border-black dark:border-zinc-400" />
            <div className="w-4 h-2 rounded-sm border border-black dark:border-zinc-400" />
            <div className="w-5 h-2.5 rounded-sm bg-black dark:bg-zinc-400" />
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex items-center justify-between px-6 h-14 bg-white dark:bg-zinc-950 sticky top-10 z-10 border-b border-[#F3F4F6] dark:border-zinc-800">
          <div className="w-10">
            <ThemeToggle />
          </div>
          <h1 className="font-bold text-[18px] capitalize text-zinc-900 dark:text-white">
            {activeTab === 'links' ? 'Edit Profile' : activeTab}
          </h1>
          <div className="w-10" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
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
                <div className="w-full mt-8 mb-6 group">
                  <div className="relative w-full h-[180px] rounded-[2rem] bg-[#F3F4F6] flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                    {profile?.coverImage ? (
                      <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="w-8 h-8 text-[#6B7280]" />
                        <span className="text-[12px] font-bold text-[#6B7280]">Add Cover Image</span>
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <div className="flex flex-col items-center gap-2 text-white">
                        <Camera className="w-8 h-8" />
                        <span className="text-[14px] font-bold">Change Cover</span>
                      </div>
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} accept="image/*" />
                    </label>
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
                  <button 
                    onClick={() => setIsAddPlatformModalOpen(true)}
                    className="w-full flex items-center justify-between py-4 border-b border-[#F3F4F6] group hover:bg-zinc-50 transition-colors px-2 -mx-2 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-lime-50 flex items-center justify-center text-[#A3E635]">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-[15px] font-medium">Add Platforms</span>
                    </div>
                    <span className="text-[#6B7280] group-hover:text-black font-bold text-[13px] transition-colors">
                      {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 ? 'Update' : '+20%'}
                    </span>
                  </button>

                  <div className="mt-4 flex flex-wrap gap-4 justify-center">
                    {profile?.socialLinks && Object.entries(profile.socialLinks).map(([id, url]) => {
                      const platform = Object.values(PLATFORMS).flat().find(p => p.id === id);
                      if (!platform) return null;
                      
                      const Icon = platform.icon;
                      const platformName = platform.label;
                      
                      return (
                        <div key={id} className="relative group flex flex-col items-center gap-1.5 min-w-[64px]">
                          <button 
                            onClick={() => handleSelectPlatform(platform.id, platform.urlPrefix)}
                            className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95"
                            title={`Edit ${platform.label}`}
                          >
                             <Icon className="w-5 h-5" />
                          </button>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{platformName}</span>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!window.confirm(`Remove ${platform.label}?`)) return;
                              const newLinks = { ...profile.socialLinks };
                              delete newLinks[id as keyof typeof newLinks];
                              await handleUpdateProfile({ socialLinks: newLinks });
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
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
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[15px] font-medium">Email Contact Form</span>
                      <button 
                        onClick={() => handleUpdateProfile({ emailContactEnabled: !profile?.emailContactEnabled })}
                        className={`w-12 h-6 rounded-full relative transition-colors ${profile?.emailContactEnabled ? 'bg-[#A3E635]' : 'bg-[#E5E7EB]'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${profile?.emailContactEnabled ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </div>
                    <p className="text-[#6B7280] text-[11px] leading-snug">Visitors can share their email with you through a contact form on your profile.</p>
                  </div>
                </div>

                {/* Featured Links Grid */}
                <div className="w-full text-left">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-[18px]">Featured Links</h3>
                    <Plus className="w-6 h-6 text-[#A3E635] cursor-pointer" onClick={handleAddLink} />
                  </div>
                  
                  <div className="space-y-4">
                    {links.length === 0 ? (
                      <button 
                        onClick={handleAddLink}
                        className="w-full p-6 border-2 border-dashed border-[#D1D5DB] rounded-[16px] flex flex-col items-center gap-2 group hover:border-[#A3E635] transition-colors"
                      >
                        <Plus className="w-8 h-8 text-[#A3E635]" />
                        <span className="text-[14px] font-bold text-zinc-900">Add Big Thumbnail Link</span>
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {/* Big Link (First one) */}
                        {links[0] && (
                          <div className="bg-white border-2 border-[#F3F4F6] rounded-[20px] p-4 flex flex-col gap-3 group relative shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-video bg-[#F9FAFB] rounded-[16px] overflow-hidden relative">
                              {links[0].icon ? (
                                <img src={links[0].icon} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#D1D5DB]">
                                  <ImageIcon className="w-12 h-12" />
                                </div>
                              )}
                              <label className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 cursor-pointer">
                                <Camera className="w-6 h-6 text-white" />
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'link-icon', links[0].id)} accept="image/*" />
                              </label>
                            </div>
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col gap-1 flex-1">
                                <input 
                                  className="font-bold text-[16px] bg-transparent outline-none w-full" 
                                  value={links[0].title} 
                                  placeholder="Title"
                                  onChange={(e) => handleUpdateLink(links[0].id, { title: e.target.value })}
                                />
                                <input 
                                  className="text-[12px] text-zinc-400 bg-transparent outline-none w-full" 
                                  value={links[0].url} 
                                  placeholder="https://..."
                                  onChange={(e) => handleUpdateLink(links[0].id, { url: e.target.value })}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Eye className={`w-5 h-5 cursor-pointer ${links[0].active ? 'text-[#A3E635]' : 'text-[#D1D5DB]'}`} onClick={() => handleUpdateLink(links[0].id, { active: !links[0].active })} />
                                <Trash2 className="w-5 h-5 text-red-400 cursor-pointer" onClick={() => handleDeleteLink(links[0].id)} />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Smaller Links Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          {links.slice(1, 3).map((link) => (
                            <div key={link.id} className="bg-white border-2 border-[#F3F4F6] rounded-[20px] p-3 flex flex-col gap-2 group relative shadow-sm hover:shadow-md transition-shadow">
                              <div className="aspect-square bg-[#F9FAFB] rounded-[12px] overflow-hidden relative">
                                {link.icon ? (
                                  <img src={link.icon} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#D1D5DB]">
                                    <ImageIcon className="w-8 h-8" />
                                  </div>
                                )}
                                <label className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 cursor-pointer">
                                  <Plus className="w-5 h-5 text-white" />
                                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'link-icon', link.id)} accept="image/*" />
                                </label>
                              </div>
                              <input 
                                className="font-bold text-[13px] bg-transparent outline-none truncate" 
                                value={link.title}
                                onChange={(e) => handleUpdateLink(link.id, { title: e.target.value })}
                              />
                            </div>
                          ))}
                          {links.length < 3 && (
                            <button 
                              onClick={handleAddLink}
                              className="aspect-square border-2 border-dashed border-[#D1D5DB] rounded-[20px] flex flex-col items-center justify-center gap-2 hover:border-[#A3E635] transition-colors"
                            >
                              <Plus className="w-6 h-6 text-[#A3E635]" />
                              <span className="text-[12px] font-bold">Small Link</span>
                            </button>
                          )}
                        </div>

                        {/* Standard Links List (remaining) */}
                        {links.length > 3 && (
                          <div className="space-y-3 pt-4 border-t border-[#F3F4F6]">
                            <h4 className="text-[14px] font-bold text-[#6B7280]">Other Links</h4>
                            {links.slice(3).map(link => (
                              <div key={link.id} className="flex items-center gap-3 p-3 bg-white border border-[#F3F4F6] rounded-xl group">
                                <div className="w-10 h-10 rounded-lg bg-[#F9FAFB] flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {link.icon ? <img src={link.icon} alt="" className="w-full h-full object-cover" /> : <LinkIcon className="w-5 h-5 text-[#D1D5DB]" />}
                                </div>
                              <div className="flex-1 space-y-0.5">
                                <input 
                                  className="font-bold text-[14px] bg-transparent outline-none w-full" 
                                  value={link.title}
                                  placeholder="Link Title"
                                  onChange={(e) => handleUpdateLink(link.id, { title: e.target.value })}
                                />
                                <input 
                                  className="text-[11px] text-zinc-400 bg-transparent outline-none w-full" 
                                  value={link.url}
                                  placeholder="https://..."
                                  onChange={(e) => handleUpdateLink(link.id, { url: e.target.value })}
                                />
                              </div>
                                <Trash2 className="w-4 h-4 text-red-300 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity" onClick={() => handleDeleteLink(link.id)} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
                className="px-6 py-6 space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
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

                <div className="bg-white p-6 rounded-[24px] border border-[#F3F4F6] shadow-sm h-[300px]">
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
                key="posts"
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
                              image: imageUrl
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
                  {shouts.filter(shout => !(shout as any).isDeleted).length === 0 ? (
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 py-12 rounded-[2rem] flex flex-col items-center justify-center text-center px-6">
                      <Megaphone className="w-10 h-10 text-zinc-200 mb-4" />
                      <p className="text-zinc-500 font-bold">No shouts yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {shouts.filter(shout => !(shout as any).isDeleted).map(shout => (
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
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">{format(new Date(shout.createdAt), 'MMM d, h:mm a')}</span>
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
                              type: file.type.startsWith('video') ? 'video' : 'image'
                            }, 'create');
                            toast.success('Media uploaded!');
                          } catch (err) {
                            toast.error('Failed to upload media');
                          }
                        }}
                      />
                    </label>
                  </div>
                  
                  {media.filter(m => !(m as any).isDeleted).length === 0 ? (
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 py-12 rounded-[2rem] flex flex-col items-center justify-center text-center px-6 border-2 border-dashed border-zinc-100">
                      <ImageIcon className="w-10 h-10 text-zinc-200 mb-4" />
                      <p className="text-zinc-500 font-bold">Your gallery is empty</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {media.filter(m => !(m as any).isDeleted).map(m => (
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

            {activeTab === 'appearance' && (
              <motion.div 
                key="appearance"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="px-6 py-6 space-y-10"
              >
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
                          className={`w-10 h-10 rounded-full border-4 transition-all ${profile?.brandColor === color ? 'border-black scale-110 shadow-lg' : 'border-white'}`}
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
                   <h3 className="text-[22px] font-bold">Themes</h3>
                   <div className="grid grid-cols-2 gap-4">
                      {['minimal', 'modern', 'brutalist', 'gradient'].map(t => (
                        <button 
                          key={t}
                          onClick={() => handleUpdateProfile({ theme: t as ThemeType })}
                          className={`aspect-video rounded-2xl border-2 transition-all p-3 flex flex-col gap-2 ${profile?.theme === t ? 'border-[#A3E635] bg-lime-50' : 'border-[#F3F4F6]'}`}
                        >
                          <div className="w-full h-2 bg-zinc-200 rounded" />
                          <div className="w-2/3 h-2 bg-zinc-100 rounded" />
                          <span className="mt-auto text-[12px] font-bold capitalize">{t}</span>
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
                   {profile?.backgroundType === 'image' && (
                     <div className="mt-4">
                        <label className="block w-full py-4 border-2 border-dashed border-[#D1D5DB] rounded-2xl text-center cursor-pointer hover:border-[#A3E635]">
                          <span className="font-bold text-[14px] text-[#6B7280]">Upload Custom Background</span>
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'background')} accept="image/*" />
                        </label>
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

        {/* Bottom Navigation */}
        <div className="h-20 bg-white dark:bg-zinc-950 border-t border-[#F3F4F6] dark:border-zinc-800 px-6 flex items-center justify-between sticky bottom-0 z-20 transition-colors duration-300">
          {[
            { id: 'links', icon: LinkIcon, label: 'Edit' },
            { id: 'analytics', icon: BarChart2, label: 'Stats' },
            { id: 'appearance', icon: Palette, label: 'Style' },
            { id: 'settings', icon: Settings, label: 'Setup' }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center gap-1 transition-colors ${activeTab === item.id ? 'text-[#A3E635]' : 'text-[#979797]'}`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
          <a 
            href={`/${profile?.username}`}
            target="_blank"
            className="flex flex-col items-center gap-1 text-[#979797]"
          >
            <Eye className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Preview</span>
          </a>
        </div>
      </div>

      {/* Preview Pane for Desktop only */}
      <div className="hidden lg:flex flex-col ml-12 w-64 items-center justify-center gap-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-[#F3F4F6] text-center space-y-4">
            <h4 className="font-bold">Live Preview</h4>
            <p className="text-[12px] text-[#6B7280]">Open your public link to see changes in real-time.</p>
            <a 
              href={`/${profile?.username}`}
              target="_blank"
              className="block w-full py-3 bg-[#F9FAFB] text-black rounded-xl font-bold text-[14px] border border-[#F3F4F6] hover:bg-zinc-100 transition-colors"
            >
              chipng.com/{profile?.username}
            </a>
          </div>
      </div>

      {/* Add Platform Modal */}
      <AnimatePresence>
        {isAddPlatformModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddPlatformModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-b-[2.5rem] p-6 pb-12 shadow-2xl flex flex-col h-[80vh] sm:h-auto sm:max-h-[85vh]"
            >
              <div className="w-12 h-1.5 bg-zinc-100 rounded-full mx-auto mb-6 sm:hidden" />
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black">Add Platform</h2>
                  <p className="text-[#6B7280] text-sm font-medium">Add social icons to your profile.</p>
                </div>
                <button 
                  onClick={() => setIsAddPlatformModalOpen(false)}
                  className="p-2 bg-zinc-50 rounded-full hover:bg-zinc-100 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search platforms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 bg-zinc-50 border-none rounded-2xl pl-11 pr-4 focus:ring-2 focus:ring-[#A3E635] transition-all font-medium"
                />
              </div>

              {/* Categories Scroll */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 mb-2 -mx-2 px-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap font-bold text-sm transition-all border-2",
                      selectedCategory === cat.id 
                        ? "bg-[#A3E635] text-white border-[#A3E635] shadow-lg shadow-lime-100" 
                        : "bg-white text-[#6B7280] border-[#F3F4F6] hover:border-zinc-200"
                    )}
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Platforms Grid */}
              <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 gap-2 pr-1">
                {filteredPlatforms.length > 0 ? (
                  filteredPlatforms.map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => handleSelectPlatform(platform.id, platform.urlPrefix)}
                      className="w-full flex items-center justify-between p-4 bg-white border border-[#F3F4F6] rounded-2xl group hover:border-[#A3E635] hover:bg-lime-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: platform.color }}
                        >
                          <platform.icon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-[15px]">{platform.label}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-[#A3E635] transition-colors" />
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-zinc-400 font-medium italic">No platforms found for "{searchQuery}"</p>
                  </div>
                )}
              </div>

              {/* Added Platforms Section (Optional) */}
              {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && searchQuery === '' && (
                <div className="mt-6 pt-6 border-t border-[#F3F4F6]">
                  <h4 className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest mb-3 ml-1">Added Platforms ({Object.keys(profile.socialLinks).length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(profile.socialLinks).map(([id, url]) => (
                      <div key={id} className="flex items-center gap-2 bg-zinc-50 border border-[#F3F4F6] px-3 py-1.5 rounded-full">
                        <span className="text-xs font-bold capitalize">{id}</span>
                        <button 
                          onClick={async () => {
                            const newSocials = { ...profile.socialLinks };
                            delete (newSocials as any)[id];
                            await handleUpdateProfile({ socialLinks: newSocials });
                            toast.success(`${id} removed`);
                          }}
                          className="text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
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
