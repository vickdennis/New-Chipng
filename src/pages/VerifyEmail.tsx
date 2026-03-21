import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { applyActionCode } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!oobCode) {
      setStatus('error');
      setMessage("Invalid verification link.");
      return;
    }

    const verify = async () => {
      try {
        await applyActionCode(auth, oobCode);
        
        // Update is_verified in Firestore if user is logged in
        if (auth.currentUser) {
          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, {
            is_verified: true
          });
        }

        setStatus('success');
        setMessage("Your email has been successfully verified.");
      } catch (err: any) {
        console.error("Verification error:", err);
        setStatus('error');
        setMessage(err.message || "Failed to verify email.");
      }
    };
    verify();
  }, [oobCode]);

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md text-center flex flex-col gap-6 transition-colors"
      >
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-zinc-900 dark:text-white animate-spin" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Verifying your email...</h1>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Email Verified!</h1>
            <p className="text-zinc-500 dark:text-zinc-400">{message}</p>
            <Link 
              to="/login" 
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all mt-4"
            >
              Log In to Your Account
              <ArrowRight size={20} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
              <XCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Verification Failed</h1>
            <p className="text-zinc-500 dark:text-zinc-400">{message}</p>
            <Link 
              to="/signup" 
              className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all mt-4"
            >
              Try Signing Up Again
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
