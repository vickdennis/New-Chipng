import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, getUserByUsername, handleFirestoreError, OperationType } from '../firebase';
import { toast } from 'sonner';
import { Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUsername = params.get('username');
    if (urlUsername) {
      setUsername(urlUsername);
    }
  }, []);

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
      // Ensure username uniqueness
      let finalUsername = cleanUsername;
      const existingUser = await getUserByUsername(finalUsername);
      if (existingUser) {
        // If taken, append a random number and loop until unique
        while (true) {
          finalUsername = `${cleanUsername}${Math.floor(Math.random() * 10000)}`;
          const check = await getUserByUsername(finalUsername);
          if (!check) break;
        }
        toast.info(`Username "${cleanUsername}" was taken. We've set yours to "${finalUsername}". You can change it later in settings.`);
      }

      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Create user doc with all profile data merged
      try {
        await setDoc(doc(db, 'users', uid), {
          uid,
          email,
          username: finalUsername,
          displayName: finalUsername,
          bio: 'Welcome to my Chip NG profile!',
          photoURL: null,
          role: 'user',
          createdAt: serverTimestamp(),
          status: 'active',
          theme: 'minimal',
          buttonStyle: 'rounded',
          backgroundType: 'solid',
          backgroundColor: '#ffffff',
          totalClicks: 0,
          plan: 'basic',
          subscriptionStatus: 'active',
          onboardingCompleted: false
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
      }

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
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', user.uid));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }

      if (!userDoc?.exists()) {
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

        // Create user doc with all profile data merged
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            username: finalUsername,
            displayName: user.displayName || finalUsername,
            photoURL: user.photoURL || null,
            bio: 'Welcome to my Chip NG profile!',
            role: 'user',
            createdAt: serverTimestamp(),
            status: 'active',
            theme: 'minimal',
            buttonStyle: 'rounded',
            backgroundType: 'solid',
            backgroundColor: '#ffffff',
            totalClicks: 0,
            plan: 'basic',
            subscriptionStatus: 'active',
            onboardingCompleted: false
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
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
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-lime-400 selection:text-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-lime-400/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-lime-400/5 blur-[120px] rounded-full" />
      </div>

      <div className="fixed top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-12">
          <Link to="/">
            <div className="inline-flex items-center justify-center p-4 bg-zinc-900 rounded-[2rem] mb-8 border border-white/5 shadow-2xl hover:scale-110 active:scale-95 transition-transform group">
              <Logo size="lg" variant="icon-only" color="neon" />
            </div>
          </Link>
          <h1 className="text-5xl font-black tracking-tight mb-4 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            Join the link-in-bio <br />
            revolution.
          </h1>
          <p className="text-zinc-500 font-medium text-lg">Build your professional identity in seconds.</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-[3rem] shadow-2xl">
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-4">Unique Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center">
                  <UserIcon className="w-5 h-5 text-zinc-700 group-focus-within:text-lime-400 transition-colors" />
                </div>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  className="w-full bg-zinc-900 border border-white/5 rounded-[1.8rem] pl-16 pr-6 py-5 text-lg font-bold text-white outline-none focus:border-lime-400/50 focus:ring-4 focus:ring-lime-400/5 transition-all placeholder:text-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-4">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center">
                  <Mail className="w-5 h-5 text-zinc-700 group-focus-within:text-lime-400 transition-colors" />
                </div>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-zinc-900 border border-white/5 rounded-[1.8rem] pl-16 pr-6 py-5 text-lg font-bold text-white outline-none focus:border-lime-400/50 focus:ring-4 focus:ring-lime-400/5 transition-all placeholder:text-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-4">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center">
                  <Lock className="w-5 h-5 text-zinc-700 group-focus-within:text-lime-400 transition-colors" />
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-white/5 rounded-[1.8rem] pl-16 pr-6 py-5 text-lg font-bold text-white outline-none focus:border-lime-400/50 focus:ring-4 focus:ring-lime-400/5 transition-all placeholder:text-zinc-800"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-lime-400 text-zinc-950 py-5 rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-3 hover:bg-lime-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_20px_50px_rgba(163,230,53,0.2)]"
            >
              {loading ? 'Generating...' : 'Start Building'} <ArrowRight className="w-6 h-6" />
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]">
              <span className="px-4 bg-zinc-900/50 text-zinc-600">Quick Access</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-zinc-950 py-5 rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-4 hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-2xl"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
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
            Continue with Google
          </button>
        </div>

        <p className="text-center mt-10 text-zinc-500 font-medium">
          Already have an account? <Link to="/login" className="text-lime-400 font-black hover:underline ml-2">Sign in</Link>
        </p>

        <div className="mt-16 flex items-center justify-center gap-8 opacity-20 hover:opacity-50 transition-opacity">
           <Logo size="sm" variant="favicon" />
           <div className="h-4 w-px bg-zinc-800" />
           <span className="text-[10px] font-black tracking-widest uppercase">Secured by Chip NG</span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
