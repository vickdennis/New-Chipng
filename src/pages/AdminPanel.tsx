import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc, getDocs, getDoc, where, writeBatch, limit, addDoc
} from 'firebase/firestore';
import { 
  Users, Shield, Trash2, Ban, CheckCircle, 
  Search, ArrowLeft, BarChart2, TrendingUp, ExternalLink,
  DollarSign, Crown, BadgeCheck, FileText, ShoppingBag, Plus, Edit, Package, History, RotateCcw, Share2,
  Link as LinkIcon, Instagram, Twitter, Linkedin, Youtube, Facebook, MessageCircle, Music2, MessageSquare, Disc, Send, Pin, Music, Apple, Cloud, AtSign, Hash, Github, Twitch, Ghost, Mail
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { toast } from 'sonner';
import { User, Product, Link as LinkType } from '../types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rollbackDocument, BackupDocument } from '../services/backupService';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [backups, setBackups] = useState<BackupDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'revenue' | 'brand' | 'blog' | 'shop' | 'backups'>('users');
  const [backupCollection, setBackupCollection] = useState<'users' | 'blogs' | 'links'>('users');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingUserLinks, setEditingUserLinks] = useState<LinkType[]>([]);
  const [deletedLinkIds, setDeletedLinkIds] = useState<string[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userForm, setUserForm] = useState<Partial<User>>({
    email: '',
    username: '',
    displayName: '',
    role: 'user',
    status: 'active',
    plan: 'basic',
    subscriptionStatus: 'inactive',
    isPremium: false,
    isVerified: false,
    theme: 'minimal',
    buttonStyle: 'rounded',
    backgroundType: 'solid',
    socialLinks: {},
    phone: '',
    address: '',
    contactEmail: ''
  });
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: '',
    stock: 0,
    active: true
  });

  const LogoBox = ({ title, children, dark = false }: { title: string, children: React.ReactNode, dark?: boolean }) => (
    <div className={`flex flex-col items-center justify-center p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 transition-colors duration-300 ${dark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-950'}`}>
      <div className="mb-6">{children}</div>
      <span className={`text-xs font-bold uppercase tracking-widest ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>{title}</span>
    </div>
  );

  const mockRevenueData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
    { name: 'Jul', revenue: 3490 },
  ];

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
    }, (error) => {
      console.error('Admin users listener error:', error);
      toast.error('Failed to load users');
    });

    const productsUnsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });

    const backupsUnsub = onSnapshot(
      query(collection(db, `${backupCollection}_backup`), orderBy('timestamp', 'desc'), limit(50)), 
      (snapshot) => {
        setBackups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BackupDocument)));
      }
    );

    return () => {
      unsubscribe();
      productsUnsub();
      backupsUnsub();
    };
  }, [user, backupCollection]);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdatePlan = async (userId: string, newPlan: string) => {
    try {
      const isPremium = newPlan !== 'basic';
      await updateDoc(doc(db, 'users', userId), { 
        plan: newPlan,
        isPremium: isPremium,
        subscriptionStatus: isPremium ? 'active' : 'inactive'
      });
      toast.success(`User upgraded to ${newPlan.toUpperCase()}`);
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action is irreversible.')) return;
    try {
      // 1. Delete links
      const linksSnapshot = await getDocs(query(collection(db, 'links'), where('userId', '==', userId)));
      const batch = writeBatch(db);
      linksSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      // 2. Delete user
      await deleteDoc(doc(db, 'users', userId));
      
      toast.success('User and all associated data deleted');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isVerified: !currentStatus });
      toast.success(`User ${!currentStatus ? 'verified' : 'unverified'}`);
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  const handleRollback = async (collectionName: string, originalId: string) => {
    if (!window.confirm(`Rollback this document to this version?`)) return;
    const success = await rollbackDocument(collectionName, originalId, user?.uid);
    if (success) {
      toast.success('Rollback successful');
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProductImage(true);
    const timestamp = Date.now();
    // Include user UID in path for better security rule compatibility
    const storageRef = ref(storage, `products/${user?.uid || 'admin'}/${timestamp}_${file.name}`);

    try {
      console.log('Uploading product image...', file.name);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      console.log('Product image uploaded successfully:', url);
      setProductForm(prev => ({ ...prev, image: url }));
      toast.success('Product image uploaded');
    } catch (error) {
      console.error('Product image upload error:', error);
      toast.error('Failed to upload product image. Please check your connection and permissions.');
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  const socialIconsList = [
    { id: 'instagram', icon: Instagram, label: 'Instagram' },
    { id: 'twitter', icon: Twitter, label: 'Twitter' },
    { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
    { id: 'youtube', icon: Youtube, label: 'YouTube' },
    { id: 'facebook', icon: Facebook, label: 'Facebook' },
    { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
    { id: 'tiktok', icon: Music2, label: 'TikTok' },
    { id: 'threads', icon: MessageSquare, label: 'Threads' },
    { id: 'discord', icon: Disc, label: 'Discord' },
    { id: 'telegram', icon: Send, label: 'Telegram' },
    { id: 'snapchat', icon: Ghost, label: 'Snapchat' },
    { id: 'pinterest', icon: Pin, label: 'Pinterest' },
    { id: 'spotify', icon: Music, label: 'Spotify' },
    { id: 'appleMusic', icon: Apple, label: 'Apple Music' },
    { id: 'soundcloud', icon: Cloud, label: 'SoundCloud' },
    { id: 'twitch', icon: Twitch, label: 'Twitch' },
    { id: 'github', icon: Github, label: 'GitHub' },
    { id: 'email', icon: Mail, label: 'Email' },
  ];

  const handleEditUser = async (user: User) => {
    setEditingUser(user);
    try {
      const q = query(collection(db, 'links'), where('userId', '==', user.uid), orderBy('position', 'asc'));
      const snapshot = await getDocs(q);
      setEditingUserLinks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LinkType)));
    } catch (error) {
      console.error('Error fetching user links:', error);
      toast.error('Failed to load user links');
    }
  };

  const handleAddLinkToUser = () => {
    if (!editingUser) return;
    const newLink: LinkType = {
      id: `new-${Date.now()}`,
      userId: editingUser.uid,
      title: 'New Link',
      url: 'https://',
      active: true,
      position: editingUserLinks.length,
      clicks: 0
    };
    setEditingUserLinks([...editingUserLinks, newLink]);
  };

  const handleDeleteLinkFromUser = (linkId: string) => {
    if (!linkId.startsWith('new-')) {
      setDeletedLinkIds([...deletedLinkIds, linkId]);
    }
    setEditingUserLinks(editingUserLinks.filter(l => l.id !== linkId));
  };

  const handleSaveUser = async (userId: string, data: Partial<User>) => {
    try {
      // Sanitize data for updateDoc - remove fields that shouldn't be in the document body
      const { uid, id, ...updateData } = data as any;
      
      // Ensure socialLinks is an object
      if (updateData.socialLinks && typeof updateData.socialLinks !== 'object') {
        updateData.socialLinks = {};
      }

      await updateDoc(doc(db, 'users', userId), updateData);
      
      // Save links if any were modified
      const batch = writeBatch(db);

      // Delete links that were removed
      deletedLinkIds.forEach(linkId => {
        batch.delete(doc(db, 'links', linkId));
      });

      editingUserLinks.forEach(link => {
        if (link.id.startsWith('new-')) {
          const newLinkRef = doc(collection(db, 'links'));
          const { id: _, ...linkData } = link;
          batch.set(newLinkRef, {
            ...linkData,
            userId: userId
          });
        } else {
          const linkRef = doc(db, 'links', link.id);
          const { id: _, ...linkData } = link;
          batch.update(linkRef, {
            title: linkData.title,
            url: linkData.url,
            active: linkData.active,
            position: linkData.position
          });
        }
      });
      await batch.commit();

      toast.success('User and links updated successfully');
      setEditingUser(null);
      setEditingUserLinks([]);
      setDeletedLinkIds([]);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user. Please check permissions.');
    }
  };

  const handleAddUser = async () => {
    if (!userForm.email || !userForm.username) {
      toast.error('Email and Username are required');
      return;
    }

    try {
      // Check if username exists
      const q = query(collection(db, 'users'), where('username', '==', userForm.username));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        toast.error('Username already taken');
        return;
      }

      const newUser = {
        ...userForm,
        createdAt: new Date().toISOString(),
        totalClicks: 0,
        socialLinks: userForm.socialLinks || {}
      };

      await addDoc(collection(db, 'users'), newUser);
      toast.success('User added successfully');
      setIsAddingUser(false);
      setUserForm({
        email: '',
        username: '',
        displayName: '',
        role: 'user',
        status: 'active',
        plan: 'basic',
        subscriptionStatus: 'inactive',
        isPremium: false,
        isVerified: false,
        theme: 'minimal',
        buttonStyle: 'rounded',
        backgroundType: 'solid',
        socialLinks: {},
        phone: '',
        address: '',
        contactEmail: ''
      });
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Failed to add user');
    }
  };

  const handleSaveProduct = async () => {
    try {
      if (editingProduct) {
        const { id, ...updateData } = productForm as any;
        await updateDoc(doc(db, 'products', editingProduct.id), updateData);
        toast.success('Product updated');
      } else {
        const { id, ...newData } = productForm as any;
        await addDoc(collection(db, 'products'), {
          ...newData,
          createdAt: new Date().toISOString()
        });
        toast.success('Product added');
      }
      setIsAddingProduct(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: 0, image: '', category: '', stock: 0, active: true });
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.uid.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white transition-colors duration-300">Loading...</div>;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white p-6 md:p-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-12">
          <Link to="/">
            <Logo size="md" className="!flex-row !gap-3" />
          </Link>
        </div>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all text-zinc-950 dark:text-white">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <ThemeToggle />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter text-zinc-950 dark:text-white">Super Admin</h1>
              <p className="text-zinc-500">Manage all users and platform health</p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 w-5 h-5" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by email or ID..."
              className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all text-zinc-950 dark:text-white"
            />
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-4 mb-12 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('revenue')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === 'revenue' ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
          >
            Revenue
          </button>
          <button 
            onClick={() => setActiveTab('brand')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === 'brand' ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
          >
            Brand Assets
          </button>
          <button 
            onClick={() => setActiveTab('shop')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === 'shop' ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
          >
            Shop
          </button>
          <button 
            onClick={() => setActiveTab('blog')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === 'blog' ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
          >
            Blog
          </button>
          <button 
            onClick={() => setActiveTab('backups')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${activeTab === 'backups' ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
          >
            Backups
          </button>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-500 dark:text-blue-400' },
                { label: 'Active Users', value: users.filter(u => u.status === 'active').length, icon: CheckCircle, color: 'text-lime-600 dark:text-lime-400' },
                { label: 'Premium', value: users.filter(u => u.isPremium).length, icon: Crown, color: 'text-amber-600 dark:text-amber-400' },
                { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'text-purple-600 dark:text-purple-400' }
              ].map((stat, i) => (
                <div key={i} className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
                  </div>
                  <div className="text-3xl font-bold mb-1 text-zinc-950 dark:text-white">{stat.value}</div>
                  <div className="text-zinc-500 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Users Table Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold dark:text-white">User Management</h3>
              <button 
                onClick={() => setIsAddingUser(true)}
                className="flex items-center gap-2 px-6 py-3 bg-lime-400 text-zinc-950 rounded-2xl font-bold hover:bg-lime-300 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">User</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Username</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Plan</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Joined</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-zinc-950 dark:text-white">{user.email}</div>
                            {user.role === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />}
                          </div>
                          <div className="text-xs text-zinc-400 dark:text-zinc-600 font-mono mt-1">{user.uid}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-bold text-zinc-900 dark:text-white">@{user.username}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.isPremium ? 'bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                          }`}>
                            {user.isPremium ? 'PRO' : 'FREE'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.status === 'active' ? 'bg-lime-500/10 dark:bg-lime-400/10 text-lime-600 dark:text-lime-400' : 'bg-red-500/10 dark:bg-red-400/10 text-red-600 dark:text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-zinc-500 text-sm">
                          {(() => {
                            const date = user.createdAt;
                            if (!date) return 'N/A';
                            // Handle Firestore Timestamp or string/number
                            const d = (date as any).toDate ? (date as any).toDate() : new Date(date);
                            return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
                          })()}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <select 
                              value={user.plan || 'basic'}
                              onChange={(e) => handleUpdatePlan(user.uid, e.target.value)}
                              className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-lime-400 text-zinc-900 dark:text-white"
                            >
                              <option value="basic">Basic</option>
                              <option value="pro">Pro</option>
                              <option value="business">Business</option>
                            </select>
                            <button 
                              onClick={() => handleEditUser(user)} 
                              className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                              title="Edit User"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleToggleVerify(user.uid, user.isVerified || false)} 
                              className={`p-2 rounded-lg transition-colors ${user.isVerified ? 'text-[#0095f6] bg-[#0095f6]/10' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                              title={user.isVerified ? 'Unverify' : 'Verify'}
                            >
                              <BadgeCheck className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(user.uid, user.status)}
                              className={`p-2 rounded-lg transition-colors ${user.status === 'suspended' ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                              title={user.status === 'active' ? 'Suspend' : 'Activate'}
                            >
                              {user.status === 'active' ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.uid)}
                              className="p-2 hover:bg-red-500/10 dark:hover:bg-red-900/20 rounded-lg transition-colors text-zinc-400 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="p-20 text-center text-zinc-500">
                  No users found matching your search.
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'revenue' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-lime-600 dark:text-lime-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-lime-600 dark:text-lime-500" />
                </div>
                <div className="text-3xl font-bold mb-1 text-zinc-950 dark:text-white">$12,450.00</div>
                <div className="text-zinc-500 text-sm font-medium">Monthly Recurring Revenue</div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-blue-500 dark:text-blue-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                </div>
                <div className="text-3xl font-bold mb-1 text-zinc-950 dark:text-white">{users.filter(u => u.isPremium).length}</div>
                <div className="text-zinc-500 text-sm font-medium">Active Subscriptions</div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-purple-500 dark:text-purple-400">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-500" />
                </div>
                <div className="text-3xl font-bold mb-1 text-zinc-950 dark:text-white">3.2%</div>
                <div className="text-zinc-500 text-sm font-medium">Churn Rate</div>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem]">
              <h2 className="text-xl font-bold mb-8 text-zinc-950 dark:text-white">Revenue Growth</h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockRevenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-zinc-800" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} unit="$" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#a3e635' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#a3e635" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : activeTab === 'shop' ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold dark:text-white">Shop Management</h2>
                <p className="text-zinc-500">Manage products available in the shop</p>
              </div>
              <button 
                onClick={() => {
                  setIsAddingProduct(true);
                  setEditingProduct(null);
                  setProductForm({ name: '', description: '', price: 0, image: '', category: '', stock: 0, active: true });
                }}
                className="flex items-center gap-2 px-6 py-3 bg-lime-400 text-zinc-950 rounded-2xl font-bold hover:bg-lime-300 transition-all"
              >
                <Plus className="w-5 h-5" /> Add Product
              </button>
            </div>

            {isAddingProduct || editingProduct ? (
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
                <h3 className="text-xl font-bold dark:text-white">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Product Name</label>
                    <input 
                      type="text" 
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                      placeholder="e.g. Premium T-Shirt"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Price (₦)</label>
                    <input 
                      type="number" 
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Category</label>
                    <input 
                      type="text" 
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                      placeholder="e.g. Apparel"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Stock</label>
                    <input 
                      type="number" 
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Product Image</label>
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                        {productForm.image ? (
                          <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <label className="flex-1 py-3 px-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center font-bold cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
                        {isUploadingProductImage ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Upload Product Image
                          </>
                        )}
                        <input type="file" className="hidden" onChange={handleProductImageUpload} accept="image/*" disabled={isUploadingProductImage} />
                      </label>
                    </div>
                    <input 
                      type="text" 
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white mt-2"
                      placeholder="Or paste image URL..."
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Description</label>
                    <textarea 
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white h-32 resize-none"
                      placeholder="Product details..."
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={handleSaveProduct}
                    className="flex-1 py-4 bg-lime-400 text-zinc-950 rounded-2xl font-bold hover:bg-lime-300 transition-all"
                  >
                    Save Product
                  </button>
                  <button 
                    onClick={() => {
                      setIsAddingProduct(false);
                      setEditingProduct(null);
                    }}
                    className="px-8 py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden group">
                    <div className="aspect-square relative overflow-hidden">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingProduct(product);
                            setProductForm(product);
                          }}
                          className="p-2 bg-white/90 dark:bg-zinc-900/90 rounded-xl shadow-lg hover:bg-white dark:hover:bg-zinc-900 transition-all text-zinc-900 dark:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 bg-white/90 dark:bg-zinc-900/90 rounded-xl shadow-lg hover:bg-red-500 hover:text-white transition-all text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-lime-400 text-zinc-950 rounded-full text-xs font-bold">
                          ₦{product.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold dark:text-white">{product.name}</h3>
                        <span className="text-xs text-zinc-500">{product.category}</span>
                      </div>
                      <p className="text-sm text-zinc-500 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Package className="w-3 h-3" />
                          {product.stock} in stock
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${product.active ? 'bg-lime-400/10 text-lime-600' : 'bg-red-400/10 text-red-600'}`}>
                          {product.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'blog' ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold dark:text-white">Blog Management</h2>
                <p className="text-zinc-500">Create and manage AI-powered blog posts</p>
              </div>
              <Link 
                to="/admin/blog/new"
                className="flex items-center gap-2 px-6 py-3 bg-lime-400 text-zinc-950 rounded-2xl font-bold hover:bg-lime-300 transition-all"
              >
                <Plus className="w-5 h-5" />
                New Post
              </Link>
            </div>
            
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-12 text-center">
              <div className="w-20 h-20 bg-lime-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-lime-500" />
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">Manage your content</h3>
              <p className="text-zinc-500 mb-8 max-w-md mx-auto">Use the dedicated Blog Manager to create SEO-optimized, AI-generated posts for your platform.</p>
              <Link 
                to="/admin/blog"
                className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-bold hover:scale-105 transition-all"
              >
                Open Blog Manager
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : activeTab === 'backups' ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold dark:text-white">System Backups</h2>
                <p className="text-zinc-500">View history and rollback data changes</p>
              </div>
              <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl">
                {(['users', 'blogs', 'links'] as const).map((col) => (
                  <button
                    key={col}
                    onClick={() => setBackupCollection(col)}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${backupCollection === col ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm' : 'text-zinc-500'}`}
                  >
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Original ID</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Action</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Performed By</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                    {backups.map((backup) => (
                      <tr key={backup.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <History className="w-4 h-4 text-zinc-400" />
                            <div className="font-bold dark:text-white">
                              {new Date(backup.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-xs font-mono text-zinc-500">{backup.originalId}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            backup.action === 'rollback' ? 'bg-blue-400/10 text-blue-600' :
                            backup.action === 'delete' ? 'bg-red-400/10 text-red-600' :
                            backup.action === 'update' ? 'bg-amber-400/10 text-amber-600' :
                            'bg-lime-400/10 text-lime-600'
                          }`}>
                            {backup.action.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm text-zinc-500">{backup.performedBy}</div>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => handleRollback(backup.collectionName, backup.originalId)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl text-xs font-bold hover:bg-lime-400 hover:text-zinc-950 transition-all"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-zinc-950 dark:text-white">Logo Variations</h2>
              <p className="text-zinc-500 mb-8">Official branding assets for Chip NG</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <LogoBox title="Default (Dark Mode)" dark>
                  <Logo size="lg" color="white" />
                </LogoBox>
                <LogoBox title="Neon Accent" dark>
                  <Logo size="lg" color="neon" />
                </LogoBox>
                <LogoBox title="Light Mode">
                  <Logo size="lg" color="black" />
                </LogoBox>
                <LogoBox title="App Icon" dark>
                  <Logo size="lg" variant="app-icon" color="neon" />
                </LogoBox>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2 text-zinc-950 dark:text-white">Iconography</h2>
              <p className="text-zinc-500 mb-8">Simplified marks for small-scale use</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <LogoBox title="Icon Only" dark>
                  <Logo size="lg" variant="icon-only" color="white" />
                </LogoBox>
                <LogoBox title="Favicon (16x16)" dark>
                  <Logo size="sm" variant="favicon" color="neon" />
                </LogoBox>
                <LogoBox title="Favicon (32x32)" dark>
                  <Logo size="md" variant="favicon" color="white" />
                </LogoBox>
                <LogoBox title="Favicon (64x64)">
                  <Logo size="lg" variant="favicon" color="black" />
                </LogoBox>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-12 rounded-[2.5rem] text-center">
              <h3 className="text-xl font-bold mb-4 text-zinc-950 dark:text-white">Brand Identity Guidelines</h3>
              <p className="text-zinc-500 max-w-2xl mx-auto mb-8">
                The Chip NG logo represents digital identity and connectivity. 
                Always ensure sufficient contrast and maintain the clear space around the logo.
                Use the Neon Green version for primary brand touchpoints.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700">
                  <div className="w-3 h-3 rounded-full bg-lime-400"></div>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">#A3E635</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700">
                  <div className="w-3 h-3 rounded-full bg-white border border-zinc-300 dark:border-zinc-600"></div>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">#FFFFFF</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700">
                  <div className="w-3 h-3 rounded-full bg-black border border-zinc-400 dark:border-zinc-600"></div>
                  <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">#000000</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-8 relative">
            <button 
              onClick={() => setIsAddingUser(false)}
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
            >
              <Trash2 className="w-6 h-6 rotate-45" />
            </button>

            <div>
              <h3 className="text-2xl font-bold dark:text-white">Add New User</h3>
              <p className="text-zinc-500">Create a new user account manually</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Email Address</label>
                <input 
                  type="email" 
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Username</label>
                <input 
                  type="text" 
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Display Name</label>
                <input 
                  type="text" 
                  value={userForm.displayName}
                  onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Phone</label>
                <input 
                  type="text" 
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                  placeholder="+234..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Address</label>
                <input 
                  type="text" 
                  value={userForm.address}
                  onChange={(e) => setUserForm({ ...userForm, address: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                  placeholder="Lagos, Nigeria"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Contact Email</label>
                <input 
                  type="email" 
                  value={userForm.contactEmail}
                  onChange={(e) => setUserForm({ ...userForm, contactEmail: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                  placeholder="contact@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Role</label>
                <select 
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Social Media Links Section for Add User */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-lime-400" />
                Social Media Links
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialIconsList.map((social) => (
                  <div key={social.id} className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                      <social.icon className="w-3 h-3" />
                      {social.label}
                    </label>
                    <input 
                      type="text" 
                      value={userForm.socialLinks?.[social.id as keyof typeof userForm.socialLinks] || ''}
                      onChange={(e) => setUserForm({ 
                        ...userForm, 
                        socialLinks: { 
                          ...userForm.socialLinks, 
                          [social.id]: e.target.value 
                        } 
                      })}
                      placeholder={`Enter ${social.label} username/ID`}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleAddUser}
                className="flex-1 py-4 bg-lime-400 text-zinc-950 rounded-2xl font-bold hover:bg-lime-300 transition-all"
              >
                Create User
              </button>
              <button 
                onClick={() => setIsAddingUser(false)}
                className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-8 relative">
            <button 
              onClick={() => setEditingUser(null)}
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
            >
              <Trash2 className="w-6 h-6 rotate-45" />
            </button>

            <div>
              <h3 className="text-2xl font-bold dark:text-white">Edit User Account</h3>
              <p className="text-zinc-500">Modify user details and settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Username</label>
                <input 
                  type="text" 
                  defaultValue={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Display Name</label>
                <input 
                  type="text" 
                  defaultValue={editingUser.displayName}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Profile Image URL</label>
                <input 
                  type="text" 
                  defaultValue={editingUser.photoURL}
                  onChange={(e) => setEditingUser({ ...editingUser, photoURL: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Cover Image URL</label>
                <input 
                  type="text" 
                  defaultValue={editingUser.coverImage}
                  onChange={(e) => setEditingUser({ ...editingUser, coverImage: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Phone</label>
                <input 
                  type="text" 
                  defaultValue={editingUser.phone}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Address</label>
                <input 
                  type="text" 
                  defaultValue={editingUser.address}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Contact Email</label>
                <input 
                  type="email" 
                  defaultValue={editingUser.contactEmail}
                  onChange={(e) => setEditingUser({ ...editingUser, contactEmail: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-zinc-500">Bio</label>
                <textarea 
                  defaultValue={editingUser.bio}
                  onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white h-24 resize-none"
                />
              </div>
            </div>

            {/* User Links Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold dark:text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-lime-400" />
                  User Links
                </h4>
                <button 
                  onClick={handleAddLinkToUser}
                  className="flex items-center gap-2 px-4 py-2 bg-lime-400/10 text-lime-600 rounded-xl text-sm font-bold hover:bg-lime-400/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Link
                </button>
              </div>
              <div className="space-y-4">
                {editingUserLinks.map((link, idx) => (
                  <div key={link.id} className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Title</label>
                        <input 
                          type="text" 
                          value={link.title}
                          onChange={(e) => {
                            const newLinks = [...editingUserLinks];
                            newLinks[idx].title = e.target.value;
                            setEditingUserLinks(newLinks);
                          }}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">URL</label>
                        <input 
                          type="text" 
                          value={link.url}
                          onChange={(e) => {
                            const newLinks = [...editingUserLinks];
                            newLinks[idx].url = e.target.value;
                            setEditingUserLinks(newLinks);
                          }}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={link.active}
                            onChange={(e) => {
                              const newLinks = [...editingUserLinks];
                              newLinks[idx].active = e.target.checked;
                              setEditingUserLinks(newLinks);
                            }}
                            className="w-4 h-4 rounded border-zinc-300 text-lime-500 focus:ring-lime-500"
                          />
                          <span className="text-xs text-zinc-500">Active</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteLinkFromUser(link.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                          title="Delete Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Position</label>
                        <input 
                          type="number" 
                          value={link.position}
                          onChange={(e) => {
                            const newLinks = [...editingUserLinks];
                            newLinks[idx].position = parseInt(e.target.value) || 0;
                            setEditingUserLinks(newLinks);
                          }}
                          className="w-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {editingUserLinks.length === 0 && (
                  <p className="text-center text-zinc-500 py-4 italic">No links found for this user.</p>
                )}
              </div>
            </div>

            {/* Social Media Links Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-bold dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-lime-400" />
                Social Media Links
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialIconsList.map((social) => (
                  <div key={social.id} className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                      <social.icon className="w-3 h-3" />
                      {social.label}
                    </label>
                    <input 
                      type="text" 
                      value={editingUser.socialLinks?.[social.id as keyof typeof editingUser.socialLinks] || ''}
                      onChange={(e) => setEditingUser({ 
                        ...editingUser, 
                        socialLinks: { 
                          ...editingUser.socialLinks, 
                          [social.id]: e.target.value 
                        } 
                      })}
                      placeholder={`Enter ${social.label} username/ID`}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-lime-400 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => handleSaveUser(editingUser.uid, editingUser)}
                className="flex-1 py-4 bg-lime-400 text-zinc-950 rounded-2xl font-bold hover:bg-lime-300 transition-all"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setEditingUser(null)}
                className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
