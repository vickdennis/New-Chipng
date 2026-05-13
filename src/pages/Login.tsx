import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, getUserByUsername, handleFirestoreError, OperationType } from '../firebase';
import { safeWrite } from '../services/backupService';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

import { motion } from 'motion/react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Check if user doc exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create user doc if it's missing for some reason
        let baseUsername = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
        let finalUsername = baseUsername;
        
        while (true) {
          const usernameCheck = await getUserByUsername(finalUsername);
          if (!usernameCheck) break;
          finalUsername = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
        }

        const publicData = {
          uid: user.uid,
          username: finalUsername,
          displayName: user.displayName || finalUsername,
          photoURL: user.photoURL || null,
          bio: 'Welcome to my Chip NG profile!',
          role: (user.email === 'vickthorden@gmail.com' || user.email === 'vickthorden@gmail.com') ? 'admin' : 'user',
          status: 'active',
          theme: 'minimal',
          buttonStyle: 'rounded',
          backgroundType: 'solid',
          backgroundColor: '#ffffff',
          totalClicks: 0,
          plan: 'basic',
          subscriptionStatus: 'active',
          isDeleted: false
        };

        const privateData = {
          email: user.email,
          updatedAt: new Date().toISOString()
        };

        await safeWrite('users', user.uid, publicData, 'create');
        await safeWrite(`users/${user.uid}/private`, 'info', privateData, 'create');
        
        if (publicData.role === 'admin') {
          await safeWrite('admins', user.uid, { email: user.email }, 'create');
        }
      }

      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user doc exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        // New user from Google
        // Generate a unique username
        let baseUsername = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
        let finalUsername = baseUsername;
        
        // Check for collisions
        while (true) {
          const usernameCheck = await getUserByUsername(finalUsername);
          if (!usernameCheck) break;
          finalUsername = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
        }

        // Create user docs
        const publicData = {
          uid: user.uid,
          username: finalUsername,
          displayName: user.displayName || finalUsername,
          photoURL: user.photoURL || null,
          bio: 'Welcome to my Chip NG profile!',
          role: (user.email === 'vickthorden@gmail.com') ? 'admin' : 'user',
          status: 'active',
          theme: 'minimal',
          buttonStyle: 'rounded',
          backgroundType: 'solid',
          backgroundColor: '#ffffff',
          totalClicks: 0,
          isDeleted: false
        };

        const privateData = {
          email: user.email,
          updatedAt: new Date().toISOString()
        };

        await safeWrite('users', user.uid, publicData, 'create');
        await safeWrite(`users/${user.uid}/private`, 'info', privateData, 'create');

        if (publicData.role === 'admin') {
          await safeWrite('admins', user.uid, { email: user.email }, 'create');
        }
      }

      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorized in Firebase Console. Please add chipng.com to your Firebase Auth Allowed Domains.');
      } else {
        toast.error(error.message || 'Failed to login with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white flex items-center justify-center p-6 transition-colors duration-300 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-lime-400/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#A020F0]/5 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <Link to="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo size="lg" className="mb-6" />
            </motion.div>
          </Link>
          <h1 className="text-4xl font-bold tracking-tighter mb-2 text-zinc-950 dark:text-white">Welcome back</h1>
          <p className="text-zinc-500">Log in to manage your Chip NG profile</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 w-5 h-5" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all text-zinc-950 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 w-5 h-5" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-lime-500 dark:focus:ring-lime-400 outline-none transition-all text-zinc-950 dark:text-white"
              />
            </div>
          </div>

          <motion.button 
            type="submit" 
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-lime-400 text-zinc-950 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-lime-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-lime-400/10"
          >
            {loading ? 'Logging in...' : 'Log in'} <ArrowRight className="w-5 h-5" />
          </motion.button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-zinc-950 text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        <p className="text-center mt-8 text-zinc-500">
          Don't have an account? <Link to="/signup" className="text-lime-400 font-bold hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
