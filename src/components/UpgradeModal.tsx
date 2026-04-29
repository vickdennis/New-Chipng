import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PlanType } from '../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredPlan: PlanType;
  featureName: string;
  onUpgrade?: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, requiredPlan, featureName, onUpgrade }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/pricing');
    }
  };

  const planIcon = requiredPlan === 'pro' ? <Star className="w-8 h-8 text-lime-400" /> : <ShieldCheck className="w-8 h-8 text-lime-400" />;
  const planName = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-lime-400/10 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-lime-400/5 blur-[80px] rounded-full" />

          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              {planIcon}
            </div>
            <h2 className="text-3xl font-bold mb-2 tracking-tight text-zinc-950 dark:text-white">Upgrade to {planName}</h2>
            {requiredPlan === 'pro' && <p className="text-lime-500 font-black text-sm mb-2">Starts at ₦10,000/year</p>}
            <p className="text-zinc-500 dark:text-zinc-400">
              The <span className="text-zinc-950 dark:text-white font-medium">{featureName}</span> feature is available on our {planName} plan and above.
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-lime-400" />
                <span className="font-bold text-zinc-950 dark:text-white">Unlock Premium Features</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Get access to custom backgrounds, advanced analytics, and more tools to grow your brand.
              </p>
            </div>
          </div>

          <button
            onClick={handleUpgrade}
            className="w-full bg-lime-400 text-zinc-950 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-lime-300 transition-all"
          >
            See Pricing <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="w-full mt-4 py-2 text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors text-sm font-medium"
          >
            Maybe later
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpgradeModal;
