import React, { useState, useEffect } from 'react';
import { db, safeWrite, rollbackDocument, OperationType, handleFirestoreError } from '../firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc, getDocs, getDoc, where, writeBatch, limit as firestoreLimit,
  addDoc
} from 'firebase/firestore';
import { 
  Users, Shield, Trash2, Ban, CheckCircle, 
  Search, ArrowLeft, BarChart2, TrendingUp,
  DollarSign, Crown, BadgeCheck, FileText,
  Bot, History, RotateCcw, Sparkles, Send, Loader2,
  ChevronRight, Calendar, User as UserIcon, AlertCircle
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { toast } from 'sonner';
import { User, BackupEntry, BlogPost } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI } from "@google/genai";

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'revenue' | 'brand' | 'ai-assistant' | 'backups'>('users');
  const navigate = useNavigate();

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState<Partial<BlogPost> | null>(null);

  // Backups State
  const [backups, setBackups] = useState<BackupEntry<any>[]>([]);
  const [selectedBackupCollection, setSelectedBackupCollection] = useState<'users' | 'links' | 'blogs'>('users');

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
      setLoading(false);
    }, (error) => {
      console.error('Admin users listener error:', error);
      toast.error('Failed to load users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'backups') {
      const backupCollection = `${selectedBackupCollection}_backup`;
      const q = query(collection(db, backupCollection), orderBy('timestamp', 'desc'), firestoreLimit(50));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setBackups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BackupEntry<any>)));
      });
      return () => unsubscribe();
    }
  }, [activeTab, selectedBackupCollection]);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await safeWrite('users', userId, { status: newStatus }, 'update');
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdatePlan = async (userId: string, newPlan: string) => {
    try {
      const isPremium = newPlan !== 'basic';
      await safeWrite('users', userId, { 
        plan: newPlan,
        isPremium: isPremium,
        subscriptionStatus: isPremium ? 'active' : 'inactive'
      }, 'update');
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

      // 2. Delete user with backup
      await safeWrite('users', userId, null, 'delete');
      
      toast.success('User and all associated data deleted');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleVerify = async (userId: string, currentStatus: boolean) => {
    try {
      await safeWrite('users', userId, { isVerified: !currentStatus }, 'update');
      toast.success(`User ${!currentStatus ? 'verified' : 'unverified'}`);
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  const handleRollback = async (collectionName: string, originalId: string) => {
    if (!window.confirm('Are you sure you want to rollback this document to its previous state?')) return;
    try {
      await rollbackDocument(collectionName, originalId);
      toast.success('Rollback successful');
    } catch (error) {
      console.error('Rollback error:', error);
      toast.error('Rollback failed');
    }
  };

  const generateBlogPost = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiResponse(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a high-quality SEO blog post about: ${aiPrompt}. 
        Return the result in JSON format with the following fields:
        title, content (markdown), excerpt, seoTitle, seoDescription, seoKeywords (array of strings).
        The tone should be professional and helpful for Nigerian creators and businesses.`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || '{}');
      setAiResponse(data);
      toast.success('Blog post generated!');
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Failed to generate blog post');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveGeneratedBlog = async () => {
    if (!aiResponse) return;
    try {
      const slug = aiResponse.title?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      const blogData = {
        ...aiResponse,
        slug,
        author: user?.email || 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        published: false
      };
      await addDoc(collection(db, 'blogs'), blogData);
      toast.success('Blog post saved to drafts');
      navigate('/admin/blog');
    } catch (error) {
      console.error('Error saving blog:', error);
      toast.error('Failed to save blog post');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
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
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'revenue', label: 'Revenue', icon: DollarSign },
            { id: 'brand', label: 'Brand Assets', icon: Shield },
            { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
            { id: 'backups', label: 'Backups', icon: History }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-3 rounded-2xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'bg-lime-400 text-zinc-950' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-950 dark:hover:text-white'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <Link 
            to="/admin/blog"
            className="px-8 py-3 rounded-2xl font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            Blog Manager
          </Link>
        </div>

        {activeTab === 'users' && (
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

            {/* Users Table */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">User</th>
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
        )}

        {activeTab === 'revenue' && (
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
        )}

        {activeTab === 'brand' && (
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

        {activeTab === 'ai-assistant' && (
          <div className="space-y-8">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem]">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-lime-400/10 rounded-2xl flex items-center justify-center text-lime-600">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">AI Content Assistant</h2>
                  <p className="text-zinc-500 text-sm">Generate high-quality SEO blog posts in seconds</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest">What should the blog post be about?</label>
                <div className="flex gap-4">
                  <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. How to grow your Instagram following in Nigeria using Chip NG..."
                    className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-lime-400 dark:text-white min-h-[100px] resize-none"
                  />
                  <button 
                    onClick={generateBlogPost}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="bg-lime-400 text-zinc-950 px-8 rounded-2xl font-bold hover:bg-lime-300 transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Sparkles className="w-6 h-6" />
                    )}
                    Generate
                  </button>
                </div>
              </div>
            </div>

            {aiResponse && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-zinc-950 dark:text-white">Generated Content</h3>
                  <button 
                    onClick={saveGeneratedBlog}
                    className="flex items-center gap-2 px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:opacity-90 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Save to Drafts
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Title</label>
                      <h4 className="text-2xl font-bold text-zinc-950 dark:text-white">{aiResponse.title}</h4>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Excerpt</label>
                      <p className="text-zinc-500 leading-relaxed">{aiResponse.excerpt}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Content Preview</label>
                      <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 line-clamp-6">
                        {aiResponse.content}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                    <h5 className="font-bold text-sm uppercase tracking-widest text-zinc-400">SEO Metadata</h5>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">SEO Title</label>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{aiResponse.seoTitle}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">SEO Description</label>
                        <p className="text-xs text-zinc-500 leading-relaxed">{aiResponse.seoDescription}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Keywords</label>
                        <div className="flex flex-wrap gap-1">
                          {aiResponse.seoKeywords?.map((kw, i) => (
                            <span key={i} className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px] text-zinc-600 dark:text-zinc-300">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'backups' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-950 dark:text-white">Data Backups</h2>
                  <p className="text-zinc-500 text-sm">Restore previous versions of critical data</p>
                </div>
              </div>

              <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                {(['users', 'links', 'blogs'] as const).map((coll) => (
                  <button
                    key={coll}
                    onClick={() => setSelectedBackupCollection(coll)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize ${selectedBackupCollection === coll ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    {coll}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Original ID</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Action</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Performed By</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {backups.map((backup) => (
                      <tr key={backup.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm text-zinc-900 dark:text-white font-medium">
                              {new Date(backup.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            {selectedBackupCollection === 'users' ? <UserIcon className="w-3.5 h-3.5 text-zinc-400" /> : <FileText className="w-3.5 h-3.5 text-zinc-400" />}
                            <span className="text-xs font-mono text-zinc-500">{backup.originalId}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            backup.action === 'delete' ? 'bg-red-500/10 text-red-600' :
                            backup.action === 'rollback' ? 'bg-blue-500/10 text-blue-600' :
                            backup.action === 'create' ? 'bg-lime-500/10 text-lime-600' :
                            'bg-amber-500/10 text-amber-600'
                          }`}>
                            {backup.action}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs text-zinc-500">{backup.performedBy}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => handleRollback(selectedBackupCollection, backup.originalId)}
                            className="flex items-center gap-2 ml-auto px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:opacity-90 transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {backups.length === 0 && (
                <div className="p-20 text-center text-zinc-500">
                  <div className="flex flex-col items-center gap-4">
                    <AlertCircle className="w-12 h-12 opacity-20" />
                    <p>No backups found for this collection.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
