import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Calendar, CreditCard, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference');
  const plan = searchParams.get('plan') || 'Pro';

  useEffect(() => {
    if (!reference) {
      navigate('/dashboard');
    }
  }, [reference, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white transition-colors duration-300">
      <Navbar />
      
      <main className="pt-40 pb-32 px-6 flex items-center justify-center">
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-24 h-24 bg-lime-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-lime-400/20"
          >
            <CheckCircle2 className="w-12 h-12 text-zinc-950" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              Payment Successful!
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-12 max-w-md mx-auto">
              Welcome to the {plan} tier. Your account has been upgraded and all features are now unlocked.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 text-left">
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 text-zinc-500 mb-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Transaction Ref</span>
                </div>
                <div className="font-mono text-sm break-all text-zinc-900 dark:text-zinc-100">
                  {reference}
                </div>
              </div>
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3 text-zinc-500 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Subscription</span>
                </div>
                <div className="font-bold text-zinc-900 dark:text-zinc-100 italic">
                  Active for 30 days
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-lime-400 text-zinc-950 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/20"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/"
                className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 flex items-center justify-center gap-2 text-zinc-400 text-sm italic"
          >
            <Sparkles className="w-4 h-4 text-lime-500" />
            Thank you for being part of Chip NG
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
