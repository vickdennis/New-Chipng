import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, deleteDoc, getDocs, getDoc, where, writeBatch 
} from 'firebase/firestore';
import { 
  Users, Shield, Trash2, Ban, CheckCircle, 
  Search, ArrowLeft, BarChart2, TrendingUp,
  DollarSign, Crown, CheckCircle2
} from 'lucide-react';
import Logo from '../components/Logo';
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
  const [activeTab, setActiveTab] = useState<'users' | 'revenue' | 'brand'>('users');

  const LogoBox = ({ title, children, dark = false }: { title: string, children: React.ReactNode, dark?: boolean }) => (
    <div className={`flex flex-col items-center justify-center p-8 rounded-[2rem] border border-zinc-800 ${dark ? 'bg-zinc-950' : 'bg-white text-zinc-950'}`}>
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-12">
          <Link to="/">
            <Logo size="md" className="!flex-row !gap-3" />
          </Link>
        </div>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold tracking-tighter">Super Admin</h1>
              <p className="text-zinc-500">Manage all users and platform health</p>
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by email or ID..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-lime-400 outline-none transition-all"
            />
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-4 mb-12">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-white text-zinc-950' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('revenue')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all ${activeTab === 'revenue' ? 'bg-white text-zinc-950' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}
          >
            Revenue
          </button>
          <button 
            onClick={() => setActiveTab('brand')}
            className={`px-8 py-3 rounded-2xl font-bold transition-all ${activeTab === 'brand' ? 'bg-white text-zinc-950' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}
          >
            Brand Assets
          </button>
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-400' },
                { label: 'Active Users', value: users.filter(u => u.status === 'active').length, icon: CheckCircle, color: 'text-lime-400' },
                { label: 'Premium', value: users.filter(u => u.isPremium).length, icon: Crown, color: 'text-amber-400' },
                { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'text-purple-400' }
              ].map((stat, i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem]">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-zinc-700" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-zinc-500 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Users Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">User</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Plan</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider">Joined</th>
                      <th className="px-8 py-6 text-sm font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <div className="font-bold">{user.email}</div>
                            {user.role === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-400" />}
                          </div>
                          <div className="text-xs text-zinc-600 font-mono mt-1">{user.uid}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.isPremium ? 'bg-amber-400/10 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {user.isPremium ? 'PRO' : 'FREE'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.status === 'active' ? 'bg-lime-400/10 text-lime-400' : 'bg-red-400/10 text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-zinc-500 text-sm">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleToggleVerify(user.uid, false)} // This needs profile data, but we'll assume false for now or fetch it
                              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-blue-400"
                              title="Verify User"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(user.uid, user.status)}
                              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
                              title={user.status === 'active' ? 'Suspend' : 'Activate'}
                            >
                              {user.status === 'active' ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.uid)}
                              className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-zinc-400 hover:text-red-500"
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
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-lime-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-lime-500" />
                </div>
                <div className="text-3xl font-bold mb-1">$12,450.00</div>
                <div className="text-zinc-500 text-sm font-medium">Monthly Recurring Revenue</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-blue-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold mb-1">{users.filter(u => u.isPremium).length}</div>
                <div className="text-zinc-500 text-sm font-medium">Active Subscriptions</div>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-purple-400">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-3xl font-bold mb-1">3.2%</div>
                <div className="text-zinc-500 text-sm font-medium">Churn Rate</div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem]">
              <h2 className="text-xl font-bold mb-8">Revenue Growth</h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockRevenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
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
              <h2 className="text-2xl font-bold mb-2">Logo Variations</h2>
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
              <h2 className="text-2xl font-bold mb-2">Iconography</h2>
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

            <div className="bg-zinc-900/50 border border-zinc-800 p-12 rounded-[2.5rem] text-center">
              <h3 className="text-xl font-bold mb-4">Brand Identity Guidelines</h3>
              <p className="text-zinc-500 max-w-2xl mx-auto mb-8">
                The Chip NG logo represents digital identity and connectivity. 
                Always ensure sufficient contrast and maintain the clear space around the logo.
                Use the Neon Green version for primary brand touchpoints.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-full border border-zinc-700">
                  <div className="w-3 h-3 rounded-full bg-lime-400"></div>
                  <span className="text-xs font-mono">#A3E635</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-full border border-zinc-700">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                  <span className="text-xs font-mono">#FFFFFF</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-full border border-zinc-700">
                  <div className="w-3 h-3 rounded-full bg-black border border-zinc-600"></div>
                  <span className="text-xs font-mono">#000000</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
