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
  CreditCard, Calendar
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Link, Transaction, THEMES, ThemeType, ButtonStyle, User as UserType, PlanType, Appointment } from '../types';
import { auth } from '../firebase';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import UpgradeModal from '../components/UpgradeModal';
import { Instagram, Twitter, Linkedin, Facebook, MessageCircle, MapPin, Clock, Github, Twitch, Mail, Ghost, MessageSquare, Youtube, Music2, BadgeCheck } from 'lucide-react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { prepareFlutterwaveConfig, getFlutterwavePublicKey } from '../utils/flutterwave';
import { VerificationBadge } from '../components/VerificationBadge';
import { safeWrite } from '../services/backupService';

const SortableLinkItem = ({ link, onUpdate, onDelete, isPremium, onUploadIcon, isUploading }: { 
  link: Link; 
  onUpdate: (id: string, data: Partial<Link>) => void;
  onDelete: (id: string) => void;
  isPremium: boolean;
  onUploadIcon: (e: React.ChangeEvent<HTMLInputElement>, linkId: string) => void;
  isUploading: boolean;
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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [profileForm, setProfileForm] = useState({
    username: '',
    displayName: '',
    bio: '',
    contactEmail: '',
    phone: '',
    address: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [links, setLinks] = useState<Link[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'business' | 'analytics' | 'verification' | 'billing' | 'settings'>('links');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; requiredPlan: PlanType; featureName: string }>({
    isOpen: false,
    requiredPlan: 'pro',
    featureName: ''
  });
  const navigate = useNavigate();

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
          contactEmail: data.contactEmail || ''
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    const q = query(collection(db, 'links'), where('userId', '==', user.uid), orderBy('position', 'asc'));
    const unsubLinks = onSnapshot(q, (snapshot) => {
      setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Link)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'links');
    });

    const qTx = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    // Trigger subscription expiry check on load
    fetch('/api/cron/check-subscriptions', { method: 'POST' })
      .catch(err => console.error('Expiry check failed:', err));

    return () => {
      unsubProfile();
      unsubLinks();
      unsubTx();
    };
  }, [user]);

  const handleAddLink = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'links'), {
        userId: user.uid,
        title: 'New Link',
        url: 'https://',
        active: true,
        position: links.length,
        clicks: 0
      });
      toast.success('Link added');
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Failed to add link');
    }
  };

  const handleUpdateLink = async (id: string, data: Partial<Link>) => {
    try {
      await updateDoc(doc(db, 'links', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `links/${id}`);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'links', id));
      toast.success('Link deleted');
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

      const batch = writeBatch(db);
      newLinks.forEach((link, index) => {
        batch.update(doc(db, 'links', link.id), { position: index });
      });
      await batch.commit();
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
      const currentData = currentDoc.data() as UserType;

      // Merge with default values if missing (for legacy users)
      const updatePayload: any = { ...data };
      if (!currentData.backgroundType) updatePayload.backgroundType = 'solid';
      if (!currentData.theme) updatePayload.theme = 'minimal';
      if (!currentData.buttonStyle) updatePayload.buttonStyle = 'rounded';

      const success = await safeWrite('users', user.uid, updatePayload, 'update', user.uid);
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

    if ((type === 'background' || type === 'cover') && !hasAccess('pro')) {
      checkFeatureAccess('pro', type === 'background' ? 'Custom Background' : 'Cover Image');
      return;
    }

    if (type === 'link-icon' && !hasAccess('pro')) {
      checkFeatureAccess('pro', 'Custom Link Icons');
      return;
    }

    setIsUploading(true);
    const folder = type === 'profile' ? 'profiles' : type === 'cover' ? 'covers' : type === 'background' ? 'backgrounds' : 'link-icons';
    const timestamp = Date.now();
    const storageRef = ref(storage, `${folder}/${user.uid}/${timestamp}_${file.name}`);
    
    console.log(`Starting upload to: ${folder}/${user.uid}/${timestamp}_${file.name}`);
    console.log('File info:', { name: file.name, size: file.size, type: file.type });

    try {
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload successful, getting download URL...');
      const url = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', url);
      
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
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type.replace('-', ' ')} image. Please check your connection.`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const copyLink = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`chipng.com/${profile.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copied to clipboard');
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };
  
  const verificationConfig = React.useMemo(() => {
    if (!user) return { public_key: getFlutterwavePublicKey() };

    try {
      return prepareFlutterwaveConfig({
        email: user.email,
        amountNaira: 1000,
        title: 'Chip NG - Profile Verification',
        description: 'Get verified badge on your profile',
        metadata: {
          userId: user.uid,
          isVerification: true
        }
      });
    } catch (e) {
      return { public_key: getFlutterwavePublicKey() } as any;
    }
  }, [user]);

  const handleFlutterVerification = useFlutterwave(verificationConfig);

  const onVerificationSuccess = async (response: any) => {
    try {
      const verifyRes = await fetch('/api/verify-flutterwave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transaction_id: response.transaction_id,
          tx_ref: response.tx_ref,
          userId: user?.uid,
          isVerification: true
        }),
      });
      const data = await verifyRes.json();
      if (data.status === 'success') {
        await handleUpdateProfile({ isVerified: true });
        toast.success('Congratulations! You are now verified.');
        navigate(`/payment-success?reference=${response.tx_ref}&plan=Verification`);
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
    handleFlutterVerification({
      callback: (response) => {
        onVerificationSuccess(response);
        closePaymentModal();
      },
      onClose: () => onVerificationClose()
    });
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Loading...</div>;

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-6 flex flex-col">
        <RouterLink to="/" className="mb-12">
          <Logo size="sm" className="!flex-row !gap-3 !justify-start" />
        </RouterLink>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'links', icon: LinkIcon, label: 'Links' },
            { id: 'appearance', icon: Palette, label: 'Appearance' },
            { id: 'business', icon: Crown, label: 'Business' },
            { id: 'verification', icon: BadgeCheck, label: 'Verification' },
            { id: 'billing', icon: CreditCard, label: 'Billing' },
            { id: 'analytics', icon: BarChart2, label: 'Analytics' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="px-4 py-2 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Theme</span>
            <ThemeToggle />
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white capitalize">{activeTab}</h1>
              <p className="text-zinc-500">Manage your profile and links</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={copyLink}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-lime-500" /> : <Copy className="w-4 h-4" />}
                {profile?.username}
              </button>
              <a 
                href={`/${profile?.username}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-lime-400 text-zinc-950 rounded-xl text-sm font-bold hover:bg-lime-300 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Preview
              </a>
            </div>
          </header>

          {/* Progress Bar */}
          <div className="mb-12 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-lime-400/20 shadow-xl shadow-lime-400/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-lime-400/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-lime-500" />
                </div>
                <div>
                  <h3 className="font-bold text-lg dark:text-white">Profile Completion</h3>
                  <p className="text-xs text-zinc-500">Boost your profile visibility</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-lime-500">{calculateCompletion()}%</span>
              </div>
            </div>
            <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-lime-400 to-lime-500 transition-all duration-1000 ease-out relative"
                style={{ width: `${calculateCompletion()}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <p className="mt-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {calculateCompletion() < 100 
                ? "Complete your profile to build more trust with your audience! Add social links, a bio, and a profile photo." 
                : "Your profile is fully optimized! You're ready to share it with the world."}
            </p>
          </div>

          {activeTab === 'links' && (
            <div className="space-y-6">
              <button 
                onClick={handleAddLink}
                className="w-full py-4 bg-lime-400 text-zinc-950 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/20"
              >
                <Plus className="w-5 h-5" />
                Add New Link
              </button>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={links.map(l => l.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {links.map((link) => (
                      <SortableLinkItem 
                        key={link.id} 
                        link={link} 
                        onUpdate={handleUpdateLink}
                        onDelete={handleDeleteLink}
                        isPremium={!!user?.isPremium}
                        onUploadIcon={(e, id) => handleFileUpload(e, 'link-icon', id)}
                        isUploading={isUploading}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {activeTab === 'appearance' && profile && (
            <div className="space-y-12">
              {/* Profile Section */}
              <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 space-y-8">
                <h2 className="text-xl font-bold dark:text-white">Profile</h2>
                
                {/* Cover Image */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-zinc-500">Cover Image</label>
                    {!hasAccess('pro') && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                        <Crown className="w-2.5 h-2.5" /> PRO
                      </span>
                    )}
                  </div>
                  <div className="relative group h-32 w-full bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    {profile.coverImage ? (
                      <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                      ) : (
                        <ImageIcon className="w-6 h-6" />
                      )}
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} accept="image/*" disabled={isUploading} />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border-4 border-zinc-50 dark:border-zinc-950 shadow-xl">
                      {profile.photoURL ? (
                        <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                          <User className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                      ) : (
                        <ImageIcon className="w-6 h-6" />
                      )}
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'profile')} accept="image/*" disabled={isUploading} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500">Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">chipng.com/</span>
                        <input 
                          type="text" 
                          value={profileForm.username}
                          onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-[5.5rem] pr-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                          placeholder="username"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500">Display Name</label>
                      <input 
                        type="text" 
                        value={profileForm.displayName}
                        onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                        placeholder="Your Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500">Bio</label>
                      <textarea 
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white h-24 resize-none"
                        placeholder="Tell your story..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500">Phone Number</label>
                        <input 
                          type="tel" 
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                          placeholder="+234..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-500">Contact Email</label>
                        <input 
                          type="email" 
                          value={profileForm.contactEmail}
                          onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                          placeholder="contact@example.com"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-zinc-500">Address</label>
                        <input 
                          type="text" 
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                          placeholder="Your location"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUpdateProfile(profileForm)}
                      disabled={isSavingProfile}
                      className="w-full py-2 bg-lime-400 text-zinc-950 rounded-xl font-bold hover:bg-lime-300 transition-all disabled:opacity-50"
                    >
                      {isSavingProfile ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Background Section */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold dark:text-white">Background</h2>
                  {!hasAccess('pro') && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> PRO
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-zinc-500">Background Type</label>
                    <div className="flex gap-2">
                      {['solid', 'gradient', 'image'].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            if (type === 'image' && !checkFeatureAccess('pro', 'Custom Background')) return;
                            handleUpdateProfile({ backgroundType: type as any });
                          }}
                          className={`flex-1 py-2 px-4 rounded-xl border transition-all capitalize text-sm font-bold ${
                            profile.backgroundType === type 
                              ? 'border-lime-400 bg-lime-400/5 text-lime-600' 
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  {profile.backgroundType === 'image' && (
                    <div className="space-y-4">
                      <label className="text-sm font-medium text-zinc-500">Custom Image</label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                          {profile.backgroundImage ? (
                            <img src={profile.backgroundImage} alt="Background" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <label className="flex-1 py-2 px-4 bg-lime-400 text-zinc-950 rounded-xl text-center font-bold cursor-pointer hover:bg-lime-300 transition-all flex items-center justify-center gap-2">
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                              Uploading...
                            </>
                          ) : (
                            'Upload Image'
                          )}
                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'background')} accept="image/*" disabled={isUploading} />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Social Icons Section */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold dark:text-white">Social Icons</h2>
                  {!hasAccess('pro') && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> PRO
                    </span>
                  )}
                </div>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${!hasAccess('pro') ? 'opacity-50 pointer-events-none' : ''}`}>
                  {[
                    { id: 'instagram', icon: Instagram, label: 'Instagram', color: '#E4405F' },
                    { id: 'twitter', icon: Twitter, label: 'Twitter', color: '#1DA1F2' },
                    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: '#0077B5' },
                    { id: 'youtube', icon: Youtube, label: 'YouTube', color: '#FF0000' },
                    { id: 'facebook', icon: Facebook, label: 'Facebook', color: '#1877F2' },
                    { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: '#25D366' },
                    { id: 'tiktok', icon: Music2, label: 'TikTok', color: '#000000' },
                    { id: 'reddit', icon: MessageSquare, label: 'Reddit', color: '#FF4500' },
                    { id: 'discord', icon: Disc, label: 'Discord', color: '#5865F2' },
                    { id: 'telegram', icon: Send, label: 'Telegram', color: '#26A5E4' },
                    { id: 'pinterest', icon: Pin, label: 'Pinterest', color: '#BD081C' },
                    { id: 'spotify', icon: Music, label: 'Spotify', color: '#1DB954' },
                    { id: 'applemusic', icon: Apple, label: 'Apple Music', color: '#FA243C' },
                    { id: 'soundcloud', icon: Cloud, label: 'SoundCloud', color: '#FF3300' },
                    { id: 'threads', icon: AtSign, label: 'Threads', color: '#000000' },
                    { id: 'mastodon', icon: Hash, label: 'Mastodon', color: '#6364FF' },
                    { id: 'github', icon: Github, label: 'GitHub', color: '#181717' },
                    { id: 'twitch', icon: Twitch, label: 'Twitch', color: '#9146FF' },
                    { id: 'snapchat', icon: Ghost, label: 'Snapchat', color: '#FFFC00' },
                    { id: 'mail', icon: Mail, label: 'Email', color: '#D44638' }
                  ].map((social) => (
                    <div key={social.id} className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <social.icon className="w-3 h-3" style={{ color: social.color }} /> {social.label}
                      </label>
                      <input 
                        type="text" 
                        value={profile.socialLinks?.[social.id as keyof typeof profile.socialLinks] || ''}
                        onChange={(e) => {
                          const newSocialLinks = { ...(profile.socialLinks || {}), [social.id]: e.target.value };
                          handleUpdateProfile({ socialLinks: newSocialLinks });
                        }}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white text-sm"
                        placeholder={`${social.label} URL or username`}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Themes Section */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold dark:text-white">Themes</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {(Object.keys(THEMES) as ThemeType[]).map((themeKey) => (
                    <button
                      key={themeKey}
                      onClick={() => handleUpdateProfile({ theme: themeKey })}
                      className={`p-4 rounded-2xl border-2 transition-all text-center space-y-3 ${
                        profile.theme === themeKey 
                          ? 'border-lime-400 bg-lime-400/5' 
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-full aspect-square rounded-xl ${THEMES[themeKey].background} border border-zinc-200 dark:border-zinc-800`} />
                      <span className="text-sm font-bold dark:text-white capitalize">{themeKey}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Button Styles */}
              <section className="space-y-6">
                <h2 className="text-xl font-bold dark:text-white">Button Style</h2>
                <div className="grid grid-cols-3 gap-4">
                  {(['rounded', 'pill', 'square'] as ButtonStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => handleUpdateProfile({ buttonStyle: style })}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        profile.buttonStyle === style 
                          ? 'border-lime-400 bg-lime-400/5' 
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-full h-10 bg-zinc-200 dark:bg-zinc-800 ${
                        style === 'rounded' ? 'rounded-xl' : style === 'pill' ? 'rounded-full' : 'rounded-none'
                      }`} />
                      <span className="block mt-4 text-sm font-bold dark:text-white capitalize">{style}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'business' && profile && (
            <div className="space-y-12">
              <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold dark:text-white">Location & Map</h2>
                  {!hasAccess('business') && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> BUSINESS
                    </span>
                  )}
                </div>
                <div className={`space-y-6 ${!hasAccess('business') ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500">Latitude</label>
                      <input 
                        type="number" 
                        step="any"
                        value={profile.location?.lat || ''}
                        onChange={(e) => handleUpdateProfile({ location: { ...profile.location!, lat: parseFloat(e.target.value) || 0, lng: profile.location?.lng || 0 } })}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                        placeholder="6.5244"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500">Longitude</label>
                      <input 
                        type="number" 
                        step="any"
                        value={profile.location?.lng || ''}
                        onChange={(e) => handleUpdateProfile({ location: { ...profile.location!, lng: parseFloat(e.target.value) || 0, lat: profile.location?.lat || 0 } })}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                        placeholder="3.3792"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Address (Optional)</label>
                    <input 
                      type="text" 
                      value={profile.location?.address || ''}
                      onChange={(e) => handleUpdateProfile({ location: { ...profile.location!, address: e.target.value, lat: profile.location?.lat || 0, lng: profile.location?.lng || 0 } })}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                      placeholder="123 Business Way, Lagos"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold dark:text-white">Appointments</h2>
                  {!hasAccess('business') && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> BUSINESS
                    </span>
                  )}
                </div>
                <div className={`space-y-6 ${!hasAccess('business') ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-500">Enable Appointments</span>
                    <button 
                      onClick={() => handleUpdateProfile({ appointmentsEnabled: !profile.appointmentsEnabled })}
                      className={`w-12 h-6 rounded-full transition-all relative ${profile.appointmentsEnabled ? 'bg-lime-400' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${profile.appointmentsEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>

                  {profile.appointmentsEnabled && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold dark:text-white">Booking Slots</h3>
                        <button 
                          onClick={() => {
                            const newAppt: Appointment = {
                              id: Math.random().toString(36).substr(2, 9),
                              title: 'Consultation',
                              dateTime: new Date().toISOString(),
                              contactLink: ''
                            };
                            handleUpdateProfile({ appointments: [...(profile.appointments || []), newAppt] });
                          }}
                          className="flex items-center gap-2 text-sm font-bold text-lime-500 hover:text-lime-600"
                        >
                          <Plus className="w-4 h-4" /> Add Slot
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(profile.appointments || []).map((appt, idx) => (
                          <div key={appt.id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 space-y-4">
                            <div className="flex items-center justify-between">
                              <input 
                                type="text" 
                                value={appt.title}
                                onChange={(e) => {
                                  const newAppts = [...(profile.appointments || [])];
                                  newAppts[idx].title = e.target.value;
                                  handleUpdateProfile({ appointments: newAppts });
                                }}
                                className="bg-transparent font-bold dark:text-white outline-none"
                                placeholder="Slot Title"
                              />
                              <button 
                                onClick={() => {
                                  const newAppts = profile.appointments?.filter(a => a.id !== appt.id);
                                  handleUpdateProfile({ appointments: newAppts });
                                }}
                                className="text-zinc-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Date & Time</span>
                                <input 
                                  type="datetime-local" 
                                  value={appt.dateTime.slice(0, 16)}
                                  onChange={(e) => {
                                    const newAppts = [...(profile.appointments || [])];
                                    newAppts[idx].dateTime = new Date(e.target.value).toISOString();
                                    handleUpdateProfile({ appointments: newAppts });
                                  }}
                                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Contact Link (WhatsApp/Email)</span>
                                <input 
                                  type="text" 
                                  value={appt.contactLink}
                                  onChange={(e) => {
                                    const newAppts = [...(profile.appointments || [])];
                                    newAppts[idx].contactLink = e.target.value;
                                    handleUpdateProfile({ appointments: newAppts });
                                  }}
                                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-xs outline-none"
                                  placeholder="https://wa.me/..."
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'verification' && profile && (
            <div className="space-y-8">
              <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold dark:text-white">Get Verified</h2>
                  {profile.isVerified && (
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" /> VERIFIED
                    </span>
                  )}
                </div>

                <div className="p-8 bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] border border-zinc-100 dark:border-zinc-700 text-center space-y-6">
                  <div className="w-20 h-20 bg-[#1D9BF0] rounded-full flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
                    <VerificationBadge size={40} />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-2xl font-bold dark:text-white">Twitter-style Verification</h3>
                    <p className="text-zinc-500">Stand out from the crowd with a blue verification badge on your profile. Build trust and credibility with your audience.</p>
                  </div>
                  
                  <div className="py-6 border-y border-zinc-200 dark:border-zinc-700">
                    <div className="text-4xl font-black dark:text-white">₦1,000<span className="text-lg font-normal text-zinc-500">/month</span></div>
                  </div>

                  {!profile.isVerified ? (
                    <button
                      onClick={triggerVerification}
                      className="w-full py-4 bg-[#1D9BF0] text-white rounded-2xl font-bold hover:bg-[#1A8CD8] transition-all shadow-lg shadow-blue-500/20"
                    >
                      Get Verified Now
                    </button>
                  ) : (
                    <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20 text-blue-500 font-bold">
                      You are already verified!
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: 'Trust', desc: 'Build instant trust with your audience' },
                    { title: 'Credibility', desc: 'Show that you are the real deal' },
                    { title: 'Visibility', desc: 'Stand out in search results' }
                  ].map((benefit, i) => (
                    <div key={i} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                      <h4 className="font-bold dark:text-white mb-1">{benefit.title}</h4>
                      <p className="text-xs text-zinc-500">{benefit.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-8">
              <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-lime-400/10 rounded-xl text-lime-500">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold dark:text-white">Current Plan</h2>
                      <p className="text-sm text-zinc-500">Manage your subscription and billing history</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-bold uppercase tracking-wider text-zinc-400">{profile?.plan}</div>
                      <div className={`text-xs font-bold ${profile?.subscriptionStatus === 'active' ? 'text-lime-500' : 'text-zinc-500'}`}>
                        {profile?.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/pricing')}
                      className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
                    >
                      {profile?.plan === 'business' ? 'Manage' : 'Upgrade'}
                    </button>
                  </div>
                </div>

                {profile?.isPremium && profile.premiumUntil && (
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      <span className="text-sm text-zinc-500 italic">Expires on</span>
                    </div>
                    <div className="font-bold text-zinc-900 dark:text-white">
                      {format(new Date(profile.premiumUntil), 'MMMM dd, yyyy')}
                    </div>
                  </div>
                )}
              </section>

              <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none">
                <h3 className="text-lg font-bold dark:text-white mb-6">Transaction History</h3>
                <div className="space-y-4">
                  {transactions.length > 0 ? (
                    transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl group border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${tx.status === 'success' ? 'bg-lime-400/10 text-lime-500' : 'bg-red-400/10 text-red-500'}`}>
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-white capitalize">{tx.plan} Plan</div>
                            <div className="text-xs text-zinc-500">{format(new Date(tx.createdAt), 'MMM dd, yyyy • HH:mm')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-zinc-900 dark:text-white">₦{tx.amount?.toLocaleString()}</div>
                          <div className="text-[10px] font-mono text-zinc-400 leading-none">{tx.reference}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      No transactions found
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-zinc-500 text-sm font-medium">Total Profile Views</span>
                    <TrendingUp className="w-4 h-4 text-lime-500" />
                  </div>
                  <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                    {profile?.totalClicks || 0}
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-zinc-500 text-sm font-medium">Total Link Clicks</span>
                    <BarChart2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-4xl font-bold text-zinc-900 dark:text-white">
                    {links.reduce((acc, l) => acc + (l.clicks || 0), 0)}
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold dark:text-white">Performance Over Time</h2>
                  {!user?.isPremium && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> PRO FEATURE
                    </span>
                  )}
                </div>
                
                <div className={`h-[300px] w-full ${!user?.isPremium ? 'blur-md pointer-events-none select-none opacity-50' : ''}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockAnalyticsData}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#a3e635' }}
                      />
                      <Area type="monotone" dataKey="views" stroke="#a3e635" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {!user?.isPremium && (
                  <div className="mt-8 text-center">
                    <p className="text-zinc-500 mb-4">Upgrade to Premium to unlock detailed analytics and charts.</p>
                    <button 
                      onClick={handleUpgrade}
                      className="px-8 py-3 bg-lime-400 text-zinc-950 rounded-2xl font-bold hover:scale-105 transition-all"
                    >
                      Upgrade Now
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
                <h2 className="text-xl font-bold dark:text-white mb-6">Link Performance</h2>
                <div className="space-y-4">
                  {links.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-700 rounded-xl flex items-center justify-center">
                          {link.type === 'youtube' ? <Youtube className="w-5 h-5 text-red-500" /> : 
                           link.type === 'tiktok' ? <Music2 className="w-5 h-5 text-pink-500" /> : 
                           <LinkIcon className="w-5 h-5 text-zinc-400" />}
                        </div>
                        <div>
                          <div className="font-bold dark:text-white">{link.title}</div>
                          <div className="text-sm text-zinc-500 truncate max-w-[200px]">{link.url}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold dark:text-white">{link.clicks || 0}</div>
                        <div className="text-xs text-zinc-500">clicks</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold dark:text-white">Premium Subscription</h2>
                  {user?.isPremium && (
                    <span className="px-3 py-1 bg-lime-400/10 text-lime-500 rounded-full text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ACTIVE
                    </span>
                  )}
                </div>
                
                {!user?.isPremium ? (
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-lime-400 rounded-2xl flex items-center justify-center shrink-0">
                        <Crown className="text-zinc-950 w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold dark:text-white">Upgrade to Chip NG Pro</h3>
                        <p className="text-sm text-zinc-500">Unlock verified badge, link scheduling, advanced analytics, and more.</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleUpgrade}
                      className="w-full py-4 bg-lime-400 text-zinc-950 rounded-2xl font-bold hover:scale-[1.02] transition-all"
                    >
                      Upgrade for ₦10,000/mo
                    </button>
                  </div>
                ) : (
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-100 dark:border-zinc-700">
                    <p className="text-sm text-zinc-500 mb-4">You are currently on the Pro plan. Your subscription is active until {user.premiumUntil ? format(new Date(user.premiumUntil), 'PPP') : 'N/A'}.</p>
                    <button className="text-sm font-bold text-zinc-400 hover:text-zinc-600 transition-colors">
                      Manage Subscription
                    </button>
                  </div>
                )}
              </section>

              <section className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 space-y-6">
                <h2 className="text-xl font-bold dark:text-white">Account Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                    <div>
                      <div className="font-bold dark:text-white">Email</div>
                      <div className="text-sm text-zinc-500">{user?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                    <div>
                      <div className="font-bold dark:text-white">Member Since</div>
                      <div className="text-sm text-zinc-500">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/20 space-y-6">
                <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
                <p className="text-red-600/70 text-sm">Once you delete your account, there is no going back. Please be certain.</p>
                <button className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">
                  Delete Account
                </button>
              </section>
            </div>
          )}
        </div>
      </main>

      <UpgradeModal 
        isOpen={upgradeModal.isOpen} 
        onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
        requiredPlan={upgradeModal.requiredPlan}
        featureName={upgradeModal.featureName}
      />
    </div>
  );
};

export default Dashboard;
