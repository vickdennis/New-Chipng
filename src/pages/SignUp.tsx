import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { User as UserIcon, Mail, Lock, ArrowRight } from "lucide-react";
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
  const navigate = useNavigate();

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Check if username is taken
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setError("Username is already taken");
        setLoading(false);
        return;
      }

      // 2. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Send Verification Email
      await sendEmailVerification(user);

      // 4. Create Firestore Profile
      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        plan: email === "vickthorden@gmail.com" ? "business" : "free",
        role: email === "vickthorden@gmail.com" ? "admin" : "user",
        is_verified: false,
        created_at: new Date().toISOString()
      });

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
        const q = query(collection(db, "users"), where("username", "==", finalUsername));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          finalUsername = `${baseUsername}_${Math.random().toString(36).substring(2, 7)}`;
        }

        await setDoc(doc(db, "users", user.uid), {
          username: finalUsername,
          email: user.email,
          plan: user.email === "vickthorden@gmail.com" ? "business" : "free",
          role: user.email === "vickthorden@gmail.com" ? "admin" : "user",
          is_verified: true, // Google accounts are pre-verified
          created_at: new Date().toISOString()
        });
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
            <img src="https://www.gstatic.com/firebase/explore/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="relative flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
          </div>

          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider ml-1">Username</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourname"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white outline-none transition-all text-zinc-900 dark:text-white"
                />
              </div>
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
              disabled={loading}
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
