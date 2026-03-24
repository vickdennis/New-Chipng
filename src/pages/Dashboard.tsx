import { useState, useEffect, ReactNode, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Settings, 
  Palette, 
  BarChart3, 
  Save,
  Image as ImageIcon,
  Link as LinkIcon,
  Eye,
  CreditCard,
  Calendar,
  History,
  CheckCircle2,
  Share2,
  Check,
  Upload,
  GripVertical,
  Code,
  Copy,
  Shield,
  Users,
  UserPlus,
  Activity,
  QrCode,
  Download,
  FileText,
  PenTool,
  ChevronDown,
  Leaf,
  Droplets,
  Mountain,
  Sprout,
  Hexagon,
  Coffee,
  FlaskConical,
  Nut,
  Sparkles,
  Lock
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Profile, Link as LinkType, SocialFeed, THEMES, FONTS, User } from "../types";
import { downloadVCard } from "../utils/vcard";
import { BASE_URL, DISPLAY_DOMAIN } from "../constants";
import GeminiIntelligence from "../components/GeminiIntelligence";
import { IconPicker, IconRenderer } from "../components/IconPicker";
import { SUGGESTED_INGREDIENTS } from "../data/ingredients";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "../context/AuthContext";
import { db, auth, storage, OperationType, handleFirestoreError } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  writeBatch,
  getDocs,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signOut } from "firebase/auth";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function SortableLink({ 
  link, 
  onUpdate, 
  onDelete, 
  onPickIcon 
}: { 
  link: LinkType, 
  onUpdate: (id: string | number, updates: Partial<LinkType>) => Promise<void>,
  onDelete: (id: string | number) => Promise<void>,
  onPickIcon: (id: string | number) => void,
  key?: any
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4 relative group transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          <div className="flex items-center gap-4">
            <div 
              {...attributes} 
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
            >
              <GripVertical size={20} />
            </div>
            
            <button 
              onClick={() => onPickIcon(link.id)}
              className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all shrink-0 border border-zinc-100 dark:border-zinc-700"
            >
              {link.icon ? (
                <IconRenderer name={link.icon} size={24} />
              ) : (
                <ImageIcon size={24} />
              )}
            </button>
          </div>
          
          <div className="flex-1 flex flex-col gap-3">
            <input 
              type="text" 
              value={link.title}
              onChange={(e) => onUpdate(link.id, { title: e.target.value })}
              className="text-lg font-bold bg-transparent border-none p-0 focus:ring-0 w-full text-zinc-900 dark:text-white"
              placeholder="Link Title"
            />
            <input 
              type="text" 
              value={link.url}
              onChange={(e) => onUpdate(link.id, { url: e.target.value })}
              className="text-sm text-zinc-500 dark:text-zinc-400 bg-transparent border-none p-0 focus:ring-0 w-full"
              placeholder="https://your-link.com"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onDelete(link.id)}
            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={Boolean(link.active)}
              onChange={(e) => onUpdate(link.id, { active: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-zinc-900 dark:focus:ring-white bg-transparent"
            />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active</span>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Color</span>
            <div className="relative flex items-center">
              <input 
                type="color" 
                value={link.color || "#000000"}
                onChange={(e) => onUpdate(link.id, { color: e.target.value })}
                className="w-6 h-6 rounded-full border-none p-0 cursor-pointer overflow-hidden bg-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 border-l border-zinc-100 dark:border-zinc-800 pl-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={Boolean(link.is_product)}
                onChange={(e) => onUpdate(link.id, { is_product: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-zinc-900 dark:focus:ring-white bg-transparent"
              />
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Product</span>
            </label>
            {Boolean(link.is_product) && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">₦</span>
                <input 
                  type="number" 
                  value={link.price || 0}
                  onChange={(e) => onUpdate(link.id, { price: parseInt(e.target.value) })}
                  className="w-20 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white text-zinc-900 dark:text-white"
                  placeholder="Price"
                />
              </div>
            )}
          </div>
        </div>
        <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          {link.clicks} Clicks
        </div>
      </div>
    </div>
  );
}

interface SubscriptionData {
  plan: string;
  subscription_status: string;
  next_billing_date: string | null;
  payments: Array<{
    id: number;
    amount: number;
    currency: string;
    status: string;
    date: string;
    plan: string;
  }>;
}

export default function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [links, setLinks] = useState<LinkType[]>([]);
  const [feeds, setFeeds] = useState<SocialFeed[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [apiKeys, setApiKeys] = useState<Array<{ id: string, name: string, created_at: any, partial_key: string }>>([]);
  const [adminStats, setAdminStats] = useState<{ totalUsers: number, proUsers: number, totalClicks: number, totalRevenue: number } | null>(null);
  const [adminUsers, setAdminUsers] = useState<Array<Profile & { id: string }>>([]);
  const [adminLinks, setAdminLinks] = useState<Array<LinkType & { id: string, username?: string, email?: string }>>([]);
  const [adminBlogs, setAdminBlogs] = useState<Array<{ id: string, title: string, slug: string, is_published: boolean, author_name: string, published_at: any, category?: string, scheduled_at?: string }>>([]);
  const [isCreatingBlog, setIsCreatingBlog] = useState(false);
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [blogForm, setBlogForm] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    is_published: false,
    image_url: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    category: '',
    scheduled_at: ''
  });
  const [activeTab, setActiveTab] = useState<'links' | 'feeds' | 'qrcode' | 'contact' | 'appearance' | 'analytics' | 'subscription' | 'developer' | 'admin' | 'blog' | 'gemini'>('links');
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", plan: "free", role: "user" });
  const [isSaving, setIsSaving] = useState(false);
  const [pickingIconFor, setPickingIconFor] = useState<string | number | null>(null);
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    // Real-time links
    const linksQuery = query(collection(db, "links"), where("user_id", "==", user.uid), orderBy("position", "asc"));
    const unsubLinks = onSnapshot(linksQuery, (snapshot) => {
      setLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    // Real-time feeds
    const feedsQuery = query(collection(db, "social_feeds"), where("user_id", "==", user.uid), orderBy("position", "asc"));
    const unsubFeeds = onSnapshot(feedsQuery, (snapshot) => {
      setFeeds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });

    // Real-time payments/subscription
    const paymentsQuery = query(collection(db, "payments"), where("user_id", "==", user.uid), orderBy("date", "desc"));
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setSubscription({
        plan: profile?.plan || 'free',
        subscription_status: profile?.subscription_status || 'active',
        next_billing_date: profile?.next_billing_date || null,
        payments
      });
    });

    // Admin data
    let unsubAdminStats: () => void = () => {};
    let unsubAdminUsers: () => void = () => {};
    let unsubAdminLinks: () => void = () => {};
    let unsubAdminBlogs: () => void = () => {};
    let unsubKeys: () => void = () => {};

    if (profile?.role === 'admin') {
      // Stats (simplified for Firestore)
      const usersQuery = collection(db, "users");
      unsubAdminStats = onSnapshot(usersQuery, (snapshot) => {
        const totalUsers = snapshot.size;
        const proUsers = snapshot.docs.filter(d => d.data().plan !== 'free').length;
        setAdminStats({ totalUsers, proUsers, totalClicks: 0, totalRevenue: 0 });
      });

      unsubAdminUsers = onSnapshot(usersQuery, (snapshot) => {
        setAdminUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      });

      unsubAdminLinks = onSnapshot(collection(db, "links"), (snapshot) => {
        setAdminLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      });

      unsubAdminBlogs = onSnapshot(collection(db, "blogs"), (snapshot) => {
        setAdminBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      });
    }

    // API Keys for Pro/Business users or Admin
    if (profile?.plan !== 'free' || profile?.role === 'admin') {
      const keysQuery = query(collection(db, "api_keys"), where("user_id", "==", user.uid));
      unsubKeys = onSnapshot(keysQuery, (snapshot) => {
        setApiKeys(snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            created_at: data.created_at,
            partial_key: data.key.substring(0, 8) + '...'
          };
        }));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "api_keys");
      });
    }

    return () => {
      unsubLinks();
      unsubFeeds();
      unsubPayments();
      unsubAdminStats();
      unsubAdminUsers();
      unsubAdminLinks();
      unsubAdminBlogs();
      unsubKeys();
    };
  }, [user, profile]);

  const handleAddLink = async () => {
    if (!user) return;
    
    // Pricing check: Free users limited to 5 links
    if (profile?.plan === 'free' && links.length >= 5) {
      toast.error("Free plan is limited to 5 links. Upgrade to Pro for unlimited links!");
      return;
    }

    await addDoc(collection(db, "links"), {
      user_id: user.uid,
      title: "New Link",
      url: "https://",
      icon: "",
      position: links.length,
      clicks: 0,
      active: true
    });
  };

  const handleAddSuggestedIngredients = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(db);
      SUGGESTED_INGREDIENTS.forEach((ingredient, index) => {
        const newDocRef = doc(collection(db, "links"));
        batch.set(newDocRef, {
          user_id: user.uid,
          title: ingredient.title,
          url: ingredient.url,
          icon: ingredient.icon,
          color: ingredient.color,
          is_product: true,
          price: ingredient.price,
          position: links.length + index,
          clicks: 0,
          active: true
        });
      });
      await batch.commit();
    } catch (error) {
      console.error("Failed to add ingredients", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLink = async (id: string | number, updates: Partial<LinkType>) => {
    const linkRef = doc(db, "links", id.toString());
    await updateDoc(linkRef, updates);
  };

  const handleDeleteLink = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this link?")) return;
    await deleteDoc(doc(db, "links", id.toString()));
  };

  const handleAddFeed = async () => {
    if (!user) return;
    
    // Pricing check: Pro feature
    if (profile?.plan === 'free') {
      toast.error("Social feeds are a Pro feature. Upgrade to enable!");
      return;
    }

    await addDoc(collection(db, "social_feeds"), {
      user_id: user.uid,
      type: "instagram",
      url: "",
      position: feeds.length,
      active: true
    });
  };

  const handleUpdateFeed = async (id: string | number, updates: Partial<SocialFeed>) => {
    await updateDoc(doc(db, "social_feeds", id.toString()), updates);
  };

  const handleDeleteFeed = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this feed?")) return;
    await deleteDoc(doc(db, "social_feeds", id.toString()));
  };

  const handleUpdateUsername = async (newUsername: string) => {
    if (!user || !profile) return;
    if (newUsername === profile.username) return;
    
    // Basic validation
    const sanitized = newUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (sanitized.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError(null);

    try {
      const q = query(collection(db, 'users_public'), where('username', '==', sanitized));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setUsernameError("Username is already taken");
        return;
      }

      await Promise.all([
        updateDoc(doc(db, "users", user.uid), { username: sanitized }),
        updateDoc(doc(db, "users_public", user.uid), { username: sanitized })
      ]);
    } catch (error) {
      console.error("Update username failed", error);
      setUsernameError("Failed to update username");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const publicUpdates: any = {};
      const publicFields = ['display_name', 'bio', 'avatar_url', 'bg_image_url', 'theme', 'font_family', 'is_verified', 'is_featured'];
      Object.keys(updates).forEach(key => {
        if (publicFields.includes(key)) {
          publicUpdates[key] = updates[key];
        }
      });

      await Promise.all([
        updateDoc(doc(db, "users", user.uid), updates as any),
        Object.keys(publicUpdates).length > 0 ? updateDoc(doc(db, "users_public", user.uid), publicUpdates) : Promise.resolve()
      ]);
    } catch (error) {
      console.error("Update profile failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    if (event['over'] && event['active']['id'] !== event['over']['id']) {
      const activeId = event['active']['id'];
      const overId = event['over']['id'];
      
      const batch = writeBatch(db);

      if (activeTab === 'links') {
        const oldIndex = links.findIndex(l => l.id === activeId);
        const newIndex = links.findIndex(l => l.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newLinks = arrayMove(links, oldIndex, newIndex) as LinkType[];
          setLinks(newLinks);
          
          newLinks.forEach((link, index) => {
            batch.update(doc(db, "links", link.id as any), { position: index });
          });
        }
      } else if (activeTab === 'feeds') {
        const oldIndex = feeds.findIndex(f => f.id === activeId);
        const newIndex = feeds.findIndex(f => f.id === overId);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          const newFeeds = arrayMove(feeds, oldIndex, newIndex) as SocialFeed[];
          setFeeds(newFeeds);
          
          newFeeds.forEach((feed, index) => {
            batch.update(doc(db, "social_feeds", feed.id as any), { position: index });
          });
        }
      }
      await batch.commit();
    }
  };

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);
      console.log("Starting avatar upload...", file.name);
      const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      console.log("Avatar upload successful:", url);
      await handleUpdateProfile({ avatar_url: url });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error(`Failed to upload avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackgroundUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (profile?.plan === 'free') {
      toast.error("Custom background images are a Pro feature. Upgrade to enable!");
      return;
    }

    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploadingBg(true);
      console.log("Starting background upload...", file.name);
      const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const storageRef = ref(storage, `backgrounds/${user.uid}/${Date.now()}_${safeName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      console.log("Background upload successful:", url);
      await handleUpdateProfile({ bg_image_url: url });
    } catch (error) {
      console.error("Error uploading background:", error);
      toast.error(`Failed to upload background image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploadingBg(false);
    }
  };

  const handleShare = () => {
    const url = `${BASE_URL}/p/${profile?.username}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateKey = async () => {
    if (!user) return;
    const name = prompt("Enter a name for this API key:");
    if (!name) return;

    const key = `chip_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    try {
      await addDoc(collection(db, "api_keys"), {
        user_id: user.uid,
        key,
        name,
        created_at: serverTimestamp()
      });
      setGeneratedKey(key);
    } catch (err) {
      console.error("Failed to generate API key", err);
      toast.error("Failed to generate API key. Please try again.");
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this API key?")) return;
    try {
      await deleteDoc(doc(db, "api_keys", id));
      toast.success("API key deleted successfully");
    } catch (err) {
      console.error("Failed to delete API key", err);
      toast.error("Failed to delete API key");
    }
  };

  const handleCreateUser = async () => {
    toast.error("Admin user creation is disabled in this demo. Use SignUp for new users.");
  };

  const handleUpdateUserRole = async (id: string, role: string) => {
    await updateDoc(doc(db, "users", id), { role });
  };

  const handleUpdateUserPlan = async (id: string, plan: string) => {
    await updateDoc(doc(db, "users", id), { plan });
  };

  const handleToggleFeatured = async (id: string) => {
    const user = adminUsers.find(u => u.id === id);
    if (!user) return;
    await Promise.all([
      updateDoc(doc(db, "users", id), { is_featured: !Boolean(user.is_featured) }),
      updateDoc(doc(db, "users_public", id), { is_featured: !Boolean(user.is_featured) })
    ]);
  };

  const handleDeleteAdminLink = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this link?")) return;
    await deleteDoc(doc(db, "links", id));
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action is irreversible.")) return;
    await deleteDoc(doc(db, "users", id));
  };

  const handleSaveBlog = async () => {
    if (!user || !profile) return;
    const blogData = {
      ...blogForm,
      author_id: user.uid,
      author_name: profile.display_name || profile.username,
      published_at: blogForm.is_published 
        ? (editingBlog?.published_at || serverTimestamp()) 
        : null
    };

    if (editingBlog) {
      await updateDoc(doc(db, "blogs", editingBlog.id), blogData);
    } else {
      await addDoc(collection(db, "blogs"), blogData);
    }

    setIsCreatingBlog(false);
    setEditingBlog(null);
    setBlogForm({
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      is_published: false,
      image_url: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      category: '',
      scheduled_at: ''
    });
  };

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    await deleteDoc(doc(db, "blogs", id));
  };

  const handleBlogImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const url = prompt("Enter Image URL for Blog Post:");
    if (url) {
      setBlogForm(prev => ({ ...prev, image_url: url }));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const [showMobilePreview, setShowMobilePreview] = useState(false);

  if (!profile) return <div className="flex items-center justify-center h-64">Loading...</div>;

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-8 px-4 sm:px-0 pb-24 lg:pb-0">
      {/* Editor Side */}
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">Editor</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm font-medium px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all"
            >
              {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} />}
              {copied ? "Copied!" : "Share"}
            </button>
            <a 
              href={`/p/${profile.username}`} 
              target="_blank" 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm font-medium px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all"
            >
              <Eye size={18} />
              Preview
            </a>
          </div>
        </header>

        {/* Shareable Link Section */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Your Profile Link</span>
            <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-bold break-all">
              <span className="opacity-40">{DISPLAY_DOMAIN}/p/</span>
              {profile.username}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy"}
            </button>
            {profile.contact_first_name && (
              <button 
                onClick={() => downloadVCard(profile)}
                className="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-bold px-4 py-2 rounded-xl hover:opacity-90 transition-all"
              >
                <UserPlus size={16} />
                Save Contact
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Navigation */}
        <div className="relative mb-8">
          <button 
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between font-bold text-zinc-900 dark:text-white transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <div className="flex items-center gap-3">
              {activeTab === 'links' && <LinkIcon size={20} />}
              {activeTab === 'feeds' && <Activity size={20} />}
              {activeTab === 'qrcode' && <QrCode size={20} />}
              {activeTab === 'contact' && <Users size={20} />}
              {activeTab === 'appearance' && <Palette size={20} />}
              {activeTab === 'analytics' && <BarChart3 size={20} />}
              {activeTab === 'subscription' && <CreditCard size={20} />}
              {activeTab === 'gemini' && <Sparkles size={20} className="text-amber-500" />}
              {activeTab === 'developer' && <Code size={20} />}
              {activeTab === 'admin' && <Shield size={20} />}
              {activeTab === 'blog' && <FileText size={20} />}
              <span className="capitalize">
                {activeTab === 'qrcode' ? 'QR Code' : 
                 activeTab === 'gemini' ? 'Gemini AI' : 
                 activeTab}
              </span>
            </div>
            <ChevronDown size={20} className={cn("transition-transform", isNavOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {isNavOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsNavOpen(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-2 flex flex-col gap-1">
                    {[
                      { id: 'links', icon: <LinkIcon size={18} />, label: 'Links' },
                      { id: 'feeds', icon: <Activity size={18} />, label: 'Feeds' },
                      { id: 'qrcode', icon: <QrCode size={18} />, label: 'QR Code' },
                      { id: 'contact', icon: <Users size={18} />, label: 'Contact' },
                      { id: 'appearance', icon: <Palette size={18} />, label: 'Appearance' },
                      { id: 'analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
                      { id: 'subscription', icon: <CreditCard size={18} />, label: 'Subscription' },
                      ...(profile.role === 'admin' || profile.plan === 'pro' || profile.plan === 'business' ? [{ id: 'gemini', icon: <Sparkles size={18} className="text-amber-500" />, label: 'Gemini AI' }] : []),
                      ...(profile.role === 'admin' ? [
                        { id: 'developer', icon: <Code size={18} />, label: 'Developer' },
                        { id: 'admin', icon: <Shield size={18} />, label: 'Admin' },
                        { id: 'blog', icon: <FileText size={18} />, label: 'Blog' }
                      ] : [])
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setIsNavOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                          activeTab === tab.id 
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" 
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        {tab.icon}
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === 'links' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleAddLink}
                  className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
                >
                  <Plus size={20} />
                  Add New Link
                </button>
                <button 
                  onClick={handleAddSuggestedIngredients}
                  disabled={isSaving}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  <Sparkles size={20} />
                  {isSaving ? "Adding..." : "Add Suggested Ingredients"}
                </button>
              </div>
              
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={links.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-4">
                    {links.map((link) => (
                      <SortableLink 
                        key={link.id}
                        link={link}
                        onUpdate={handleUpdateLink}
                        onDelete={handleDeleteLink}
                        onPickIcon={setPickingIconFor}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {activeTab === 'feeds' && (
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleAddFeed}
                className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all"
              >
                <Plus size={20} />
                Add New Social Feed
              </button>
              
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={feeds.map(f => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-4">
                    {feeds.map((feed) => (
                      <SortableFeed 
                        key={feed.id}
                        feed={feed}
                        onUpdate={handleUpdateFeed}
                        onDelete={handleDeleteFeed}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {activeTab === 'qrcode' && (
            <div className="flex flex-col items-center gap-8 bg-white dark:bg-zinc-900 p-6 sm:p-12 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors">
              <div className="flex flex-col items-center gap-4 text-center max-w-md">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Your Profile QR Code</h2>
                <p className="text-zinc-500 dark:text-zinc-400">Scan this code to instantly visit your profile. You can download it and use it on business cards, posters, or social media.</p>
              </div>

              <div className="p-8 bg-white rounded-3xl shadow-xl border border-zinc-100">
                <QRCodeSVG 
                  id="profile-qrcode"
                  value={`${BASE_URL}/p/${profile.username}`}
                  size={256}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: profile.avatar_url || "",
                    x: undefined,
                    y: undefined,
                    height: 48,
                    width: 48,
                    excavate: true,
                  }}
                />
              </div>

              <div className="flex flex-col gap-4 w-full max-w-md">
                <button 
                  onClick={() => {
                    const svg = document.getElementById("profile-qrcode");
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width;
                      canvas.height = img.height;
                      ctx?.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL("image/png");
                      const downloadLink = document.createElement("a");
                      downloadLink.download = `${profile.username}-qrcode.png`;
                      downloadLink.href = pngFile;
                      downloadLink.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                  }}
                  className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
                >
                  <Download size={20} />
                  Download PNG
                </button>
                <button 
                  onClick={handleShare}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                >
                  <Copy size={20} />
                  Copy Link
                </button>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Contact Information</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Add your contact details to allow visitors to save you to their phone.</p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">First Name</label>
                    <input 
                      type="text" 
                      value={profile?.contact_first_name || ""} 
                      onChange={(e) => handleUpdateProfile({ contact_first_name: e.target.value })}
                      className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Last Name</label>
                    <input 
                      type="text" 
                      value={profile?.contact_last_name || ""} 
                      onChange={(e) => handleUpdateProfile({ contact_last_name: e.target.value })}
                      className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                      placeholder="Doe"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Email</label>
                    <input 
                      type="email" 
                      value={profile?.contact_email || ""} 
                      onChange={(e) => handleUpdateProfile({ contact_email: e.target.value })}
                      className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Phone</label>
                    <input 
                      type="tel" 
                      value={profile?.contact_phone || ""} 
                      onChange={(e) => handleUpdateProfile({ contact_phone: e.target.value })}
                      className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                      placeholder="+234..."
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Organization</label>
                    <input 
                      type="text" 
                      value={profile?.contact_organization || ""} 
                      onChange={(e) => handleUpdateProfile({ contact_organization: e.target.value })}
                      className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                      placeholder="Company Name"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Job Title</label>
                    <input 
                      type="text" 
                      value={profile?.contact_job_title || ""} 
                      onChange={(e) => handleUpdateProfile({ contact_job_title: e.target.value })}
                      className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                      placeholder="CEO"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Website</label>
                    <input 
                      type="url" 
                      value={profile?.contact_website || ""} 
                      onChange={(e) => handleUpdateProfile({ contact_website: e.target.value })}
                      className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => handleUpdateProfile({})}
                    disabled={isSaving}
                    className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Contact Info"}
                  </button>
                  <button 
                    onClick={() => downloadVCard(profile)}
                    className="flex-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
                  >
                    <Download size={18} />
                    Download vCard
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="flex flex-col gap-8">
              <section className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 transition-colors">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Profile</h2>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 relative">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                          <img src="/logo.svg" alt="Avatar Placeholder" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute bottom-0 right-0 bg-white dark:bg-zinc-800 p-2 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-95 disabled:opacity-50 text-zinc-900 dark:text-white"
                    >
                      <Upload size={16} />
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">@</span>
                        <input 
                          type="text" 
                          defaultValue={profile.username}
                          onBlur={(e) => handleUpdateUsername(e.target.value)}
                          className={cn(
                            "w-full bg-zinc-50 dark:bg-zinc-800 border rounded-xl pl-8 pr-4 py-2 focus:ring-2 outline-none text-zinc-900 dark:text-white transition-all",
                            usernameError ? "border-red-500 focus:ring-red-500" : "border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-white"
                          )}
                        />
                        {isCheckingUsername && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      {usernameError && <p className="text-[10px] font-bold text-red-500 mt-1">{usernameError}</p>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Display Name</label>
                      <input 
                        type="text" 
                        value={profile.display_name}
                        onChange={(e) => handleUpdateProfile({ display_name: e.target.value })}
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Bio</label>
                      <textarea 
                        value={profile.bio}
                        onChange={(e) => handleUpdateProfile({ bio: e.target.value })}
                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none h-24 resize-none text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 transition-colors">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Themes</h2>
                <div className="grid grid-cols-2 gap-4">
                  {THEMES.map((theme) => (
                    <button 
                      key={theme.id}
                      onClick={() => {
                        if (theme.is_premium && profile?.plan === 'free') {
                          toast.error(`${theme.name} is a Pro theme. Upgrade to enable!`);
                          return;
                        }
                        handleUpdateProfile({ theme: theme.id });
                      }}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 relative overflow-hidden",
                        profile.theme === theme.id ? "border-zinc-900 dark:border-white" : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                      )}
                    >
                      {theme.is_premium && profile?.plan === 'free' && (
                        <div className="absolute top-2 right-2 text-zinc-400">
                          <Lock size={14} />
                        </div>
                      )}
                      <div className={cn("w-full h-12 rounded-lg", theme.bg)} />
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 transition-colors">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  Background
                  {profile?.plan === 'free' && <Lock size={16} className="text-zinc-400" />}
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="relative w-full h-32 bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 group">
                    {profile.bg_image_url ? (
                      <img src={profile.bg_image_url} alt="Background" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                        <img src="/logo.svg" alt="Background Placeholder" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    {isUploadingBg && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button 
                        onClick={() => bgFileInputRef.current?.click()}
                        className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all text-zinc-900 dark:text-white"
                      >
                        Change Background
                      </button>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={bgFileInputRef}
                    onChange={handleBackgroundUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {profile.bg_image_url && (
                    <button 
                      onClick={() => handleUpdateProfile({ bg_image_url: "" })}
                      className="text-xs font-bold text-red-500 uppercase tracking-wider hover:underline self-start"
                    >
                      Remove Background Image
                    </button>
                  )}
                </div>
              </section>

              <section className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 transition-colors">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Fonts</h2>
                <div className="flex flex-col gap-4">
                  {FONTS.map((font) => (
                    <button 
                      key={font.id}
                      onClick={() => {
                        if (font.is_premium && profile?.plan === 'free') {
                          toast.error(`${font.name} is a Pro font. Upgrade to enable!`);
                          return;
                        }
                        handleUpdateProfile({ font_family: font.id });
                      }}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-1 relative overflow-hidden",
                        profile.font_family === font.id ? "border-zinc-900 dark:border-white" : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                      )}
                    >
                      {font.is_premium && profile?.plan === 'free' && (
                        <div className="absolute top-2 right-2 text-zinc-400">
                          <Lock size={14} />
                        </div>
                      )}
                      <span className={cn("text-lg text-zinc-900 dark:text-white", font.family)}>Abc</span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-white">{font.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-8 transition-colors">
              <div className="flex flex-col gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                  <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Total Clicks</div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">{links.reduce((acc, curr) => acc + curr.clicks, 0)}</div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                  <div className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Active Links</div>
                  <div className="text-3xl font-bold text-zinc-900 dark:text-white">{links.filter(l => l.active).length}</div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Link Performance</h3>
                <div className="flex flex-col gap-2">
                  {links.map(link => (
                    <div key={link.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                      <span className="font-medium text-zinc-900 dark:text-white">{link.title}</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{link.clicks} clicks</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && subscription && (
            <div className="flex flex-col gap-8">
              {/* Current Plan */}
              <section className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 transition-colors">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Current Plan</h2>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    subscription.plan === 'free' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400" : "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                  )}>
                    {subscription.plan}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-white">Status</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">{subscription.subscription_status}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 shrink-0">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-white">Next Billing Date</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {subscription.plan === 'free' ? (
                  <button 
                    onClick={() => navigate('/pricing')}
                    className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg"
                  >
                    Upgrade to Pro
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button className="flex-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700 py-3 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all">
                      Manage Plan
                    </button>
                    <button className="flex-1 bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 py-3 rounded-xl font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                      Cancel Subscription
                    </button>
                  </div>
                )}
              </section>

              {/* Payment History */}
              <section className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 transition-colors">
                <div className="flex items-center gap-2">
                  <History size={20} className="text-zinc-400 dark:text-zinc-500" />
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Payment History</h2>
                </div>

                {subscription.payments.length > 0 ? (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-zinc-100 dark:border-zinc-800">
                            <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Date</th>
                            <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Plan</th>
                            <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Amount</th>
                            <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                          {subscription.payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400">{new Date(payment.date).toLocaleDateString()}</td>
                              <td className="py-4 text-sm font-bold text-zinc-900 dark:text-white capitalize">{payment.plan}</td>
                              <td className="py-4 text-sm text-zinc-600 dark:text-zinc-400">{payment.currency} {payment.amount.toLocaleString()}</td>
                              <td className="py-4">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  payment.status === 'success' ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                )}>
                                  {payment.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-4">
                      {subscription.payments.map((payment) => (
                        <div key={payment.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(payment.date).toLocaleDateString()}</span>
                              <span className="font-bold text-zinc-900 dark:text-white capitalize">{payment.plan} Plan</span>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              payment.status === 'success' ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                            )}>
                              {payment.status}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-zinc-900 dark:text-white">
                            {payment.currency} {payment.amount.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                    <div className="text-zinc-400 dark:text-zinc-500 mb-2">No payments found</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Your payment history will appear here once you subscribe to a paid plan.</div>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'gemini' && (profile.role === 'admin' || profile.plan === 'pro' || profile.plan === 'business') && (
            <GeminiIntelligence profile={profile} links={links} />
          )}

          {activeTab === 'developer' && profile.role === 'admin' && (
            <div className="flex flex-col gap-8">
              <section className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 transition-colors">
                <div className="flex flex-col justify-between gap-4">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">API Keys</h2>
                  <div className="flex flex-col items-stretch gap-2">
                    <input 
                      type="text" 
                      placeholder="Key Name (e.g. Mobile App)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none text-zinc-900 dark:text-white"
                    />
                    <button 
                      onClick={handleGenerateKey}
                      className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
                    >
                      Generate Key
                    </button>
                  </div>
                </div>

                {generatedKey && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl flex flex-col gap-2">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">New API Key Generated</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">Make sure to copy this key now. You won't be able to see it again!</div>
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30">
                      <code className="flex-1 text-sm font-mono break-all text-zinc-900 dark:text-white">{generatedKey}</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(generatedKey);
                          setGeneratedKey(null);
                        }}
                        className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400 transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {apiKeys.length > 0 ? (
                    apiKeys.map((key) => (
                      <div key={key.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-700 gap-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="font-bold text-zinc-900 dark:text-white truncate">{key.name}</div>
                          <div className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">{key.partial_key} • {new Date(key.created_at).toLocaleDateString()}</div>
                        </div>
                        <button 
                          onClick={() => handleDeleteKey(key.id)}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors shrink-0 self-end sm:self-center"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                      <div className="text-zinc-400 dark:text-zinc-500 mb-2">No API keys found</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">Generate a key to access your data from external applications.</div>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-zinc-900 dark:bg-zinc-950 text-white p-8 rounded-3xl flex flex-col gap-6 border border-zinc-800">
                <h2 className="text-xl font-bold">API Documentation</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Authentication</div>
                    <p className="text-sm text-zinc-400">Include your API key in the <code className="text-zinc-200">x-api-key</code> header of your requests.</p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Endpoints</div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 bg-zinc-800 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-700 dark:border-zinc-800">
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">GET</span>
                        <code className="text-xs text-zinc-300 flex-1">/api/profile</code>
                      </div>
                      <div className="flex items-center gap-3 bg-zinc-800 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-700 dark:border-zinc-800">
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase">GET</span>
                        <code className="text-xs text-zinc-300 flex-1">/api/links</code>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'admin' && profile.role === 'admin' && (
            <div className="flex flex-col gap-8">
              {/* Admin Stats */}
              <section className="flex flex-col gap-4">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-2">
                    <Users size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">{adminStats?.totalUsers || 0}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-2">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Pro Users</span>
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">{adminStats?.proUsers || 0}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-2">
                    <Activity size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Clicks</span>
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">{adminStats?.totalClicks || 0}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 transition-colors">
                  <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-2">
                    <CreditCard size={16} />
                    <span className="text-xs font-bold uppercase tracking-wider">Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">₦{(adminStats?.totalRevenue || 0).toLocaleString()}</div>
                </div>
              </section>

              {/* User Management */}
              <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 transition-colors">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">User Management</h2>
                  <button 
                    onClick={() => setIsCreatingUser(!isCreatingUser)}
                    className="flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
                  >
                    <UserPlus size={18} />
                    Add User
                  </button>
                </div>

                {isCreatingUser && (
                  <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col gap-4 transition-colors">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Create New User</h3>
                    <div className="flex flex-col gap-4">
                      <input 
                        type="text" 
                        placeholder="Username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                      />
                      <input 
                        type="email" 
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                      />
                      <input 
                        type="password" 
                        placeholder="Password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                      />
                      <div className="flex gap-2">
                        <select 
                          value={newUser.plan}
                          onChange={(e) => setNewUser({...newUser, plan: e.target.value})}
                          className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="business">Business</option>
                        </select>
                        <select 
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                          className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setIsCreatingUser(false)}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleCreateUser}
                        className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
                      >
                        Create User
                      </button>
                    </div>
                  </div>
                )}

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">User</th>
                        <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Plan</th>
                        <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Role</th>
                        <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Featured</th>
                        <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                      {adminUsers.map((user) => (
                        <tr key={user.id} className="group">
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900 dark:text-white">{user.display_name || user.username}</span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <select 
                              value={user.plan}
                              onChange={(e) => handleUpdateUserPlan(user.id, e.target.value)}
                              className="bg-transparent border-none text-sm font-bold capitalize outline-none cursor-pointer text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                              <option value="free" className="bg-white dark:bg-zinc-900">Free</option>
                              <option value="pro" className="bg-white dark:bg-zinc-900">Pro</option>
                              <option value="business" className="bg-white dark:bg-zinc-900">Business</option>
                            </select>
                          </td>
                          <td className="py-4">
                            <select 
                              value={user.role}
                              onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                              className="bg-transparent border-none text-sm font-bold capitalize outline-none cursor-pointer text-zinc-900 dark:text-white hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            >
                              <option value="user" className="bg-white dark:bg-zinc-900">User</option>
                              <option value="admin" className="bg-white dark:bg-zinc-900">Admin</option>
                            </select>
                          </td>
                          <td className="py-4">
                            <button 
                              onClick={() => handleToggleFeatured(user.id)}
                              className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                                Boolean(user.is_featured)
                                  ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" 
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                              )}
                            >
                              {Boolean(user.is_featured) ? "Featured" : "Promote"}
                            </button>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => window.open(`/p/${user.username}`, '_blank')}
                                className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                title="View Profile"
                              >
                                <ExternalLink size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col gap-4">
                  {adminUsers.map((user) => (
                    <div key={user.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 dark:text-white">{user.display_name || user.username}</span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => window.open(`/p/${user.username}`, '_blank')}
                            className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                          >
                            <ExternalLink size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Plan</span>
                          <select 
                            value={user.plan}
                            onChange={(e) => handleUpdateUserPlan(user.id, e.target.value)}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm font-bold capitalize outline-none text-zinc-900 dark:text-white"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="business">Business</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Role</span>
                          <select 
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-sm font-bold capitalize outline-none text-zinc-900 dark:text-white"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleToggleFeatured(user.id)}
                        className={cn(
                          "w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                          Boolean(user.is_featured)
                            ? "bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" 
                            : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                        )}
                      >
                        {Boolean(user.is_featured) ? "Featured User" : "Promote to Featured"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Content Moderation */}
              <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 transition-colors">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Content Moderation</h2>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Link</th>
                        <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Owner</th>
                        <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Clicks</th>
                        <th className="pb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                      {adminLinks.map((link) => (
                        <tr key={link.id} className="group">
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900 dark:text-white">{link.title}</span>
                              <a href={link.url || null} target="_blank" className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white truncate max-w-[200px]">{link.url}</a>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-zinc-900 dark:text-white">@{link.username}</span>
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{link.email || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{link.clicks}</span>
                          </td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => handleDeleteAdminLink(link.id)}
                              className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
                              title="Delete Link"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col gap-4">
                  {adminLinks.map((link) => (
                    <div key={link.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-zinc-900 dark:text-white">{link.title}</span>
                          <a href={link.url || null} target="_blank" className="text-xs text-zinc-400 dark:text-zinc-500 truncate max-w-[200px]">{link.url}</a>
                        </div>
                        <button 
                          onClick={() => handleDeleteAdminLink(link.id)}
                          className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Owner</span>
                          <span className="text-sm font-medium text-zinc-900 dark:text-white">@{link.username}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Clicks</span>
                          <span className="text-sm font-bold text-zinc-900 dark:text-white">{link.clicks}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'blog' && profile.role === 'admin' && (
            <div className="flex flex-col gap-8">
              <section className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-6 transition-colors">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Blog Management</h2>
                  <button 
                    onClick={() => {
                      setIsCreatingBlog(true);
                      setEditingBlog(null);
                      setBlogForm({
                        title: '',
                        slug: '',
                        content: '',
                        excerpt: '',
                        is_published: false,
                        image_url: '',
                        meta_title: '',
                        meta_description: '',
                        meta_keywords: '',
                        category: '',
                        scheduled_at: ''
                      });
                    }}
                    className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all flex items-center gap-2"
                  >
                    <Plus size={18} />
                    New Post
                  </button>
                </div>

                {isCreatingBlog && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-zinc-900 dark:text-white">{editingBlog ? 'Edit Post' : 'Create New Post'}</h3>
                      <button onClick={() => setIsCreatingBlog(false)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Title</label>
                          <input 
                            type="text" 
                            value={blogForm.title}
                            onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') })}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                            placeholder="Post Title"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Slug</label>
                          <input 
                            type="text" 
                            value={blogForm.slug}
                            onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                            placeholder="post-slug"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Excerpt</label>
                          <textarea 
                            value={blogForm.excerpt}
                            onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white h-24 resize-none"
                            placeholder="Brief summary of the post..."
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Featured Image</label>
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 overflow-hidden flex-shrink-0">
                              {blogForm.image_url ? (
                                <img src={blogForm.image_url} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                  <img src="/logo.svg" alt="Preview Placeholder" className="w-full h-full object-cover" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col gap-2">
                              <input 
                                type="text" 
                                value={blogForm.image_url}
                                onChange={(e) => setBlogForm({ ...blogForm, image_url: e.target.value })}
                                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                                placeholder="Image URL"
                              />
                              <label className="cursor-pointer bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                                Upload Image
                                <input type="file" className="hidden" accept="image/*" onChange={handleBlogImageUpload} />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">SEO Title</label>
                          <input 
                            type="text" 
                            value={blogForm.meta_title}
                            onChange={(e) => setBlogForm({ ...blogForm, meta_title: e.target.value })}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                            placeholder="SEO Title"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">SEO Description</label>
                          <textarea 
                            value={blogForm.meta_description}
                            onChange={(e) => setBlogForm({ ...blogForm, meta_description: e.target.value })}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white h-20 resize-none"
                            placeholder="SEO Description"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">SEO Keywords</label>
                          <input 
                            type="text" 
                            value={blogForm.meta_keywords}
                            onChange={(e) => setBlogForm({ ...blogForm, meta_keywords: e.target.value })}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                            placeholder="keyword1, keyword2..."
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Category</label>
                          <input 
                            type="text" 
                            value={blogForm.category}
                            onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                            placeholder="e.g. Technology, Lifestyle"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Schedule Publication</label>
                          <input 
                            type="datetime-local" 
                            value={blogForm.scheduled_at ? blogForm.scheduled_at.slice(0, 16) : ''}
                            onChange={(e) => setBlogForm({ ...blogForm, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none text-zinc-900 dark:text-white"
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={blogForm.is_published}
                              onChange={(e) => setBlogForm({ ...blogForm, is_published: e.target.checked })}
                              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-zinc-900 dark:focus:ring-white bg-transparent"
                            />
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">Publish Immediately</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Content (Markdown)</label>
                      <textarea 
                        value={blogForm.content}
                        onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-4 text-sm outline-none text-zinc-900 dark:text-white h-96 font-mono"
                        placeholder="# Your Blog Post Content..."
                      />
                    </div>

                    <button 
                      onClick={handleSaveBlog}
                      className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all"
                    >
                      {editingBlog ? 'Update Post' : 'Publish Post'}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {adminBlogs.length > 0 ? (
                    adminBlogs.map((blog) => (
                      <div key={blog.id} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-white truncate">{blog.title}</span>
                            {Boolean(blog.is_published) ? (
                              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-full">Published</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase rounded-full">Draft</span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            /{blog.slug} • {blog.category && <span className="font-bold text-zinc-700 dark:text-zinc-300">{blog.category} • </span>}By {blog.author_name} • {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : 'Not published'}
                            {(blog as any).scheduled_at && (
                              <span className="ml-2 text-amber-600 dark:text-amber-400 font-bold">
                                (Scheduled: {new Date((blog as any).scheduled_at).toLocaleString()})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => {
                              setEditingBlog(blog);
                              setBlogForm({
                                title: blog.title,
                                slug: blog.slug,
                                content: (blog as any).content || '',
                                excerpt: (blog as any).excerpt || '',
                                is_published: Boolean(blog.is_published),
                                image_url: (blog as any).image_url || '',
                                meta_title: (blog as any).meta_title || '',
                                meta_description: (blog as any).meta_description || '',
                                meta_keywords: (blog as any).meta_keywords || '',
                                category: (blog as any).category || '',
                                scheduled_at: (blog as any).scheduled_at || ''
                              });
                              // We need to fetch the full blog content if it's not in the list
                              getDoc(doc(db, "blogs", blog.id as string))
                                .then(docSnap => {
                                  if (docSnap.exists()) {
                                    const data = docSnap.data();
                                    setBlogForm(prev => ({
                                      ...prev,
                                      content: data.content,
                                      excerpt: data.excerpt,
                                      image_url: data.image_url,
                                      meta_title: data.meta_title,
                                      meta_description: data.meta_description,
                                      meta_keywords: data.meta_keywords,
                                      category: data.category,
                                      scheduled_at: data.scheduled_at
                                    }));
                                  }
                                });
                              setIsCreatingBlog(true);
                            }}
                            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            title="Edit Post"
                          >
                            <PenTool size={18} />
                          </button>
                          <button 
                            onClick={() => window.open(`/blog/${blog.slug}`, '_blank')}
                            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            title="View Post"
                          >
                            <ExternalLink size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteBlog(blog.id)}
                            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                            title="Delete Post"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                      <div className="text-zinc-400 dark:text-zinc-500 mb-2">No blog posts found</div>
                      <button 
                        onClick={() => setIsCreatingBlog(true)}
                        className="text-xs font-bold text-zinc-900 dark:text-white hover:underline"
                      >
                        Create your first post
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Preview Side (Sticky) */}
      <div className="hidden lg:block">
        <div className="sticky top-24">
          <div className="text-center mb-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Live Preview</div>
          <div className="w-[320px] h-[640px] bg-zinc-900 dark:bg-zinc-950 rounded-[3rem] p-3 border-[8px] border-zinc-800 dark:border-zinc-900 shadow-2xl mx-auto overflow-hidden relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 dark:bg-zinc-900 rounded-b-2xl z-10" />
            <div className="w-full h-full bg-white rounded-[2rem] overflow-y-auto scrollbar-hide">
              <ProfilePreview profile={profile} links={links} feeds={feeds} />
            </div>
          </div>
        </div>
      </div>
      {/* Icon Picker Modal */}
      <AnimatePresence>
        {pickingIconFor !== null && (
          <IconPicker 
            onSelect={(icon) => {
              handleUpdateLink(pickingIconFor, { icon });
              setPickingIconFor(null);
            }}
            onClose={() => setPickingIconFor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableFeed({ 
  feed, 
  onUpdate, 
  onDelete 
}: { 
  feed: SocialFeed, 
  onUpdate: (id: string | number, updates: Partial<SocialFeed>) => Promise<void>,
  onDelete: (id: string | number) => Promise<void>,
  key?: any
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: feed.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-4 relative group transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div 
            {...attributes} 
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
          >
            <GripVertical size={20} />
          </div>
          
          <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 shrink-0 border border-zinc-100 dark:border-zinc-700">
            {feed.type === 'instagram' && <IconRenderer name="Instagram" size={24} />}
            {feed.type === 'twitter' && <IconRenderer name="Twitter" size={24} />}
            {feed.type === 'tiktok' && <IconRenderer name="Music2" size={24} />}
            {feed.type === 'youtube' && <IconRenderer name="Youtube" size={24} />}
          </div>
          
          <div className="flex-1 flex flex-col gap-3">
            <select 
              value={feed.type}
              onChange={(e) => onUpdate(feed.id, { type: e.target.value as any })}
              className="text-lg font-bold bg-transparent border-none p-0 focus:ring-0 w-full text-zinc-900 dark:text-white"
            >
              <option value="instagram">Instagram Post/Profile</option>
              <option value="twitter">Twitter Post/Profile</option>
              <option value="tiktok">TikTok Video</option>
              <option value="youtube">YouTube Video</option>
            </select>
            <input 
              type="text" 
              value={feed.url}
              onChange={(e) => onUpdate(feed.id, { url: e.target.value })}
              className="text-sm text-zinc-500 dark:text-zinc-400 bg-transparent border-none p-0 focus:ring-0 w-full"
              placeholder="Paste URL here (e.g., https://instagram.com/p/xxx)"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onDelete(feed.id)}
            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={Boolean(feed.active)}
            onChange={(e) => onUpdate(feed.id, { active: e.target.checked })}
            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:ring-zinc-900 dark:focus:ring-white bg-transparent"
          />
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Active</span>
        </label>
      </div>
    </div>
  );
}

function TabButton({ children, active, onClick }: { children: ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
        active 
          ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" 
          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function ProfilePreview({ profile, links, feeds }: { profile: Profile, links: LinkType[], feeds: SocialFeed[] }) {
  const theme = THEMES.find(t => t.id === profile.theme) || THEMES[0];
  const font = FONTS.find(f => f.id === profile.font_family) || FONTS[0];
  
  return (
    <div 
      className={cn("min-h-full p-8 flex flex-col items-center gap-8 relative", theme.bg, font.family)}
      style={profile.bg_image_url ? {
        backgroundImage: `url(${profile.bg_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : {}}
    >
      {profile.bg_image_url && <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />}
      
      <div className="flex flex-col items-center gap-4 text-center relative z-10">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-400">
              <img src="/logo.svg" alt="Avatar Placeholder" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h2 className={cn("text-xl font-bold", theme.text, profile.bg_image_url && "text-white drop-shadow-md")}>@{profile.username}</h2>
          <p className={cn("text-sm opacity-80", theme.text, profile.bg_image_url && "text-white drop-shadow-md")}>{profile.bio}</p>
        </div>

        {profile.contact_first_name && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs border shadow-sm",
            theme.button,
            theme.buttonText
          )}>
            <UserPlus size={14} />
            Save Contact
          </div>
        )}
      </div>

      <div className="w-full flex flex-col gap-3 relative z-10">
        {links.filter(l => l.active).map(link => (
          <div 
            key={link.id}
            style={{ 
              color: link.color || (profile.bg_image_url ? '#ffffff' : (theme.id === 'dark' ? '#fafafa' : '#18181b')),
              borderColor: link.color ? `${link.color}40` : (profile.bg_image_url ? 'rgba(255,255,255,0.3)' : undefined),
              backgroundColor: link.color ? `${link.color}08` : (profile.bg_image_url ? 'rgba(255,255,255,0.1)' : undefined),
              backdropFilter: profile.bg_image_url ? 'blur(8px)' : undefined
            }}
            className={cn(
              "w-full py-4 px-6 rounded-2xl text-center font-bold transition-transform active:scale-95 shadow-sm flex items-center justify-center gap-3 border",
              !link.color && !profile.bg_image_url && theme.button,
              !link.color && !profile.bg_image_url && theme.buttonText
            )}
          >
            {link.icon && <IconRenderer name={link.icon} size={20} />}
            {link.title}
          </div>
        ))}
      </div>

      {feeds.filter(f => f.active).length > 0 && (
        <div className="w-full flex flex-col gap-4 relative z-10">
          {feeds.filter(f => f.active).map(feed => (
            <div key={feed.id} className="w-full bg-black/5 dark:bg-white/5 rounded-2xl p-4 flex items-center justify-center gap-2 border border-black/5 dark:border-white/5">
              <div className="text-zinc-400">
                {feed.type === 'instagram' && <IconRenderer name="Instagram" size={16} />}
                {feed.type === 'twitter' && <IconRenderer name="Twitter" size={16} />}
                {feed.type === 'tiktok' && <IconRenderer name="Music2" size={16} />}
                {feed.type === 'youtube' && <IconRenderer name="Youtube" size={16} />}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Social Feed</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto pt-8 relative z-10">
        <div className={cn("text-[10px] font-bold uppercase tracking-[0.2em] opacity-50", theme.text, profile.bg_image_url && "text-white")}>
          Chip NG
        </div>
      </div>
    </div>
  );
}
