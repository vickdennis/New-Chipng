import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { toast } from 'sonner';
import { Link as LinkIcon, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    try {
      // Check if username is taken
      const usernameDoc = await getDoc(doc(db, 'profiles_by_username', cleanUsername));
      if (usernameDoc.exists()) {
        toast.error('Username is already taken');
        setLoading(false);
        return;
      }

      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Create user doc
      await setDoc(doc(db, 'users', uid), {
        email,
        role: 'user',
        createdAt: serverTimestamp(),
        status: 'active'
      });

      // Create profile doc
      await setDoc(doc(db, 'profiles', uid), {
        userId: uid,
        username: cleanUsername,
        displayName: cleanUsername,
        bio: 'Welcome to my Chip NG profile!',
        theme: 'minimal',
        buttonStyle: 'rounded',
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        totalClicks: 0
      });

      // Create username mapping
      await setDoc(doc(db, 'profiles_by_username', cleanUsername), {
        userId: uid
      });

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
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
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'user',
          createdAt: serverTimestamp(),
          status: 'active'
        });

        // Generate a username
        let baseUsername = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
        let finalUsername = baseUsername;
        let counter = 1;

        // Check for collisions
        while (true) {
          const usernameCheck = await getDoc(doc(db, 'profiles_by_username', finalUsername));
          if (!usernameCheck.exists()) break;
          finalUsername = `${baseUsername}${counter}`;
          counter++;
        }

        // Create profile
        await setDoc(doc(db, 'profiles', user.uid), {
          userId: user.uid,
          username: finalUsername,
          displayName: user.displayName || finalUsername,
          bio: 'Welcome to my Chip NG profile!',
          theme: 'minimal',
          buttonStyle: 'rounded',
          backgroundType: 'solid',
          backgroundColor: '#ffffff',
          totalClicks: 0,
          avatarUrl: user.photoURL || null
        });

        // Create username mapping
        await setDoc(doc(db, 'profiles_by_username', finalUsername), {
          userId: user.uid
        });
      }

      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-lime-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LinkIcon className="text-zinc-950 w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter mb-2">Create an account</h1>
          <p className="text-zinc-500">Join Chip NG and build your link-in-bio page</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="yourname"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-lime-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-lime-400 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 w-5 h-5" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-lime-400 outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-lime-400 text-zinc-950 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-lime-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign up'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-zinc-950 text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-zinc-900 border border-zinc-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all disabled:opacity-50"
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
          Already have an account? <Link to="/login" className="text-lime-400 font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
