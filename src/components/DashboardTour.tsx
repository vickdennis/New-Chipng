import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-links',
    title: 'Links Management',
    content: 'Manage your social media links here. You can add, edit, or remove links to your profile.',
    position: 'bottom'
  },
  {
    targetId: 'tour-appearance',
    title: 'Customize Your Look',
    content: 'Change your theme, background, and now your text colors to match your personal brand.',
    position: 'bottom'
  },
  {
    targetId: 'tour-analytics',
    title: 'Track Performance',
    content: 'See how many people are visiting your profile and which links they are clicking.',
    position: 'bottom'
  },
  {
    targetId: 'tour-profile-preview',
    title: 'Live Preview',
    content: 'See your changes in real-time on this profile preview card.',
    position: 'left'
  },
  {
    targetId: 'tour-share',
    title: 'Share Your Profile',
    content: 'Copy your unique link and share it across your social media platforms.',
    position: 'bottom'
  }
];

interface DashboardTourProps {
  onFinish: () => void;
  show: boolean;
}

export const DashboardTour: React.FC<DashboardTourProps> = ({ onFinish, show }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (show) {
      const target = document.getElementById(TOUR_STEPS[currentStep].targetId);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStep, show]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  if (!show || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Spotlight Overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" style={{
        clipPath: `polygon(0% 0%, 0% 100%, ${targetRect.left}px 100%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px 100%, 100% 100%, 100% 0%)`
      }} />

      {/* Tooltip Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={{
            position: 'absolute',
            top: step.position === 'bottom' ? targetRect.bottom + 20 : step.position === 'top' ? targetRect.top - 200 : targetRect.top,
            left: step.position === 'right' ? targetRect.right + 20 : step.position === 'left' ? targetRect.left - 340 : targetRect.left,
          }}
          className="w-80 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl pointer-events-auto border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 text-amber-500">
              <Lightbulb className="w-5 h-5 fill-current" />
              <span className="font-bold text-sm uppercase tracking-wider">Dashboard Tour</span>
            </div>
            <button onClick={onFinish} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold dark:text-white mb-2">{step.title}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">{step.content}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-4 bg-zinc-900 dark:bg-white' : 'w-1.5 bg-zinc-200 dark:bg-zinc-700'}`} 
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button onClick={handlePrev} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <ChevronLeft className="w-5 h-5 dark:text-white" />
                  </button>
                )}
                <button 
                  onClick={handleNext}
                  className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-1 hover:opacity-90 transition-opacity"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
