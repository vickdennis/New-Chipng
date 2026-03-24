import { useState, FormEvent, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { User as UserIcon, Mail, Lock, ArrowRight, Check, X as XIcon, Sparkles } from "lucide-react";
import Logo from "../components/Logo";
import { createUserWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const navigate = useNavigate();

  // Debounced username check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus('checking');
      try {
        const q = query(collection(db, "users_public"), where("username", "==", username.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setUsernameStatus('available');
          setSuggestions([]);
        } else {
          setUsernameStatus('taken');
          // Generate suggestions
          const newSuggestions = [
            `${username}${Math.floor(Math.random() * 100)}`,
            `${username}_official`,
            `the${username}`,
            `${username}ng`
          ];
          setSuggestions(newSuggestions);
        }
      } catch (err) {
        console.error("Error checking username:", err);
        setUsernameStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (usernameStatus !== 'available') {
      setError("Please choose an available username");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      // 2. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Send Verification Email
      await sendEmailVerification(user);

      // 4. Create Firestore Profile
      const profileData = {
        username: username.toLowerCase(),
        email,
        plan: email === "vickthorden@gmail.com" ? "business" : "free",
        role: email === "vickthorden@gmail.com" ? "admin" : "user",
        is_verified: false,
        created_at: new Date().toISOString()
      };

      const publicProfileData = {
        username: username.toLowerCase(),
        display_name: username,
        bio: "Welcome to my profile!",
        avatar_url: `https://ui-avatars.com/api/?name=${username}&background=random`,
        is_verified: false,
        is_featured: false
      };

      await Promise.all([
        setDoc(doc(db, "users", user.uid), profileData),
        setDoc(doc(db, "users_public", user.uid), publicProfileData)
      ]);

      setIsSignedUp(true);
    } catch (err: any) {
      console.error("SignUp error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password sign-up is not enabled in the Firebase Console. Please enable it in Authentication > Sign-in method.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Email is already in use");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile already exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Create a default username from email
        const baseUsername = user.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
        let finalUsername = baseUsername;
        
        // Check if username exists, if so append random string
        const q = query(collection(db, "users_public"), where("username", "==", finalUsername));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          finalUsername = `${baseUsername}_${Math.random().toString(36).substring(2, 7)}`;
        }

        const profileData = {
          username: finalUsername,
          email: user.email,
          plan: user.email === "vickthorden@gmail.com" ? "business" : "free",
          role: user.email === "vickthorden@gmail.com" ? "admin" : "user",
          is_verified: true, // Google accounts are pre-verified
          created_at: new Date().toISOString()
        };

        const publicProfileData = {
          username: finalUsername,
          display_name: user.displayName || finalUsername,
          bio: "Welcome to my profile!",
          avatar_url: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || finalUsername}&background=random`,
          is_verified: true,
          is_featured: false
        };

        await Promise.all([
          setDoc(doc(db, "users", user.uid), profileData),
          setDoc(doc(db, "users_public", user.uid), publicProfileData)
        ]);
      }
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Google SignUp error:", err);
      setError("Failed to sign up with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isSignedUp) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md text-center flex flex-col gap-6 transition-colors"
        >
          <Logo layout="vertical" size={64} className="mb-2" />
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-full flex items-center justify-center mx-auto">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Check your email</h1>
          <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
            We've sent a verification link to <span className="font-bold text-zinc-900 dark:text-white">{email}</span>. 
            Please click the link to activate your account.
          </p>
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Link to="/login" className="text-zinc-900 dark:text-white font-bold hover:underline">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl w-full max-w-md flex flex-col gap-8 transition-colors"
      >
        <div className="flex flex-col gap-2 text-center">
          <Logo layout="vertical" size={48} className="mb-2" />
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Create your account</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Start sharing your world today.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm disabled:opacity-50"
          >
            <img src="/logo.svg" alt="Chip NG" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
            Continue with Google
          </button>

          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          </div>

          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Username</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourname"
                  className={`w-full bg-zinc-50 dark:bg-zinc-800 border rounded-2xl pl-12 pr-10 py-3 focus:ring-2 outline-none transition-all text-zinc-900 dark:text-white ${
                    usernameStatus === 'available' ? 'border-green-500 focus:ring-green-500' : 
                    usernameStatus === 'taken' ? 'border-red-500 focus:ring-red-500' : 
                    'border-zinc-200 dark:border-zinc-700 focus:ring-zinc-900 dark:focus:ring-white'
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && (
                    <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                  )}
                  {usernameStatus === 'available' && <Check size={18} className="text-green-500" />}
                  {usernameStatus === 'taken' && <XIcon size={18} className="text-red-500" />}
                </div>
              </div>
              
              <AnimatePresence>
                {usernameStatus === 'taken' && suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <Sparkles size={12} />
                      Suggestions
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setUsername(suggestion)}
                          className="text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-lg hover:border-zinc-900 dark:hover:border-white transition-colors text-zinc-600 dark:text-zinc-400"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {usernameStatus === 'available' && (
                <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider ml-1">Username is available</p>
              )}
              {usernameStatus === 'taken' && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">Username is already taken</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || usernameStatus !== 'available'}
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg mt-4 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign Up"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 dark:text-zinc-400 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-zinc-900 dark:text-white font-bold hover:underline">
            Log In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
