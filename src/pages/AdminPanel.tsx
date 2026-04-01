import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc, getDocs, getDoc, where, writeBatch 
} from 'firebase/firestore';
import { 
  Users, Shield, Trash2, Ban, CheckCircle, 
  Search, ArrowLeft, BarChart2, TrendingUp,
  DollarSign, Crown, BadgeCheck, FileText,
  UserPlus, X
} from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { toast } from 'sonner';
import { User } from '../types';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'revenue' | 'brand' | 'blog'>('users');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    role: 'user' as 'user' | 'admin',
    plan: 'basic' as 'basic' | 'pro' | 'business'
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.username) {
      toast.error('Email and Username are required');
      return;
    }

    try {
      // Check if username exists
      const q = query(collection(db, 'users'), where('username', '==', newUser.username.toLowerCase()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        toast.error('Username already taken');
        return;
      }

      // Check if email exists
      const eq = query(collection(db, 'users'), where('email', '==', newUser.email.toLowerCase()));
      const eSnapshot = await getDocs(eq);
      if (!eSnapshot.empty) {
        toast.error('User with this email already exists');
        return;
      }

      // Create user document
      const userRef = doc(collection(db, 'users'));
      const { setDoc } = await import('firebase/firestore');
      await setDoc(userRef, {
        uid: userRef.id,
        email: newUser.email.toLowerCase(),
        username: newUser.username.toLowerCase(),
        displayName: newUser.username,
        role: newUser.role,
        createdAt: new Date().toISOString(),
        status: 'active',
        isPremium: newUser.plan !== 'basic',
        subscriptionStatus: newUser.plan !== 'basic' ? 'active' : 'inactive',
        plan: newUser.plan,
        theme: 'minimal',
        buttonStyle: 'rounded',
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        totalClicks: 0,
        isVerified: false,
        bio: 'Welcome to my Chip NG profile!'
      });

      toast.success('User profile created successfully');
      setShowCreateModal(false);
      setNewUser({ email: '', username: '', role: 'user', plan: 'basic' });
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user profile');
    }
  };

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

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string, userEmail: string) => {
    if (userEmail === 'vickthorden@gmail.com' && currentRole === 'admin') {
      toast.error('Cannot remove admin role from the main administrator');
      return;
    }
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error('Failed to update role');
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

          <div className="flex flex-col md:flex-row items-center gap-4">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 bg-lime-400 text-zinc-950 rounded-2xl font-bold hover:bg-lime-500 transition-all"
            >
              <UserPlus className="w-5 h-5" />
              Create User
            </button>
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
          <Link 
            to="/admin/blog"
            className="px-8 py-3 rounded-2xl font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <FileText className="w-4 h-4" />
            Blog Manager
          </Link>
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
                              onClick={() => handleToggleRole(user.uid, user.role, user.email)}
                              className={`p-2 rounded-lg transition-colors ${user.role === 'admin' ? 'text-purple-500 bg-purple-500/10' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                              title={user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            >
                              <Shield className="w-5 h-5" />
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Create User Account</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-zinc-500 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="username"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2 text-zinc-500 uppercase tracking-wider">Role</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 transition-all"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-zinc-500 uppercase tracking-wider">Plan</label>
                  <select 
                    value={newUser.plan}
                    onChange={(e) => setNewUser({ ...newUser, plan: e.target.value as any })}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-lime-400 transition-all"
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-lime-400 text-zinc-950 rounded-2xl font-bold hover:bg-lime-500 transition-all shadow-lg shadow-lime-400/20"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
