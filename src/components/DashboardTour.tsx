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
    targetId: 'tour-content-links',
    title: 'Links Management',
    content: 'Manage your social media links here. You can add, edit, or remove links to your profile.',
    position: 'bottom'
  },
  {
    targetId: 'tour-content-appearance',
    title: 'Customize Your Look',
    content: 'Change your theme, background, and now your text colors to match your personal brand.',
    position: 'bottom'
  },
  {
    targetId: 'tour-content-analytics',
    title: 'Track Performance',
    content: 'See how many people are visiting your profile and which links they are clicking.',
    position: 'bottom'
  },
  {
    targetId: 'tour-preview',
    title: 'Profile Preview',
    content: 'View your live profile at any time to see exactly what your audience sees.',
    position: 'bottom'
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
  onStepChange?: (targetId: string) => void;
}

export const DashboardTour: React.FC<DashboardTourProps> = ({ onFinish, show, onStepChange }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // Re-calculate target rect on resize
      const target = document.getElementById(TOUR_STEPS[currentStep].targetId);
      if (target) {
        setTargetRect(target.getBoundingClientRect());
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep]);

  useEffect(() => {
    if (show) {
      const step = TOUR_STEPS[currentStep];
      if (onStepChange) onStepChange(step.targetId);
      
      const target = document.getElementById(step.targetId);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
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

  if (!show) return null;

  const step = TOUR_STEPS[currentStep];

  const getPosition = () => {
    if (!targetRect || isMobile) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed' as const
      };
    }

    return {
      position: 'absolute' as const,
      top: step.position === 'bottom' ? targetRect.bottom + 20 : step.position === 'top' ? targetRect.top - 200 : targetRect.top,
      left: step.position === 'right' ? targetRect.right + 20 : step.position === 'left' ? targetRect.left - 340 : targetRect.left,
    };
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Spotlight Overlay */}
      <AnimatePresence>
        {targetRect && !isMobile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 pointer-events-auto" 
            style={{
              clipPath: `polygon(0% 0%, 0% 100%, ${targetRect.left}px 100%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px 100%, 100% 100%, 100% 0%)`
            }} 
          />
        )}
        {(!targetRect || isMobile) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 pointer-events-auto backdrop-blur-sm" 
          />
        )}
      </AnimatePresence>

      {/* Tooltip Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={getPosition()}
          className="w-[88vw] max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] pointer-events-auto border border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 text-amber-500">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Lightbulb className="w-4 h-4 fill-current" />
              </div>
              <span className="font-bold text-xs uppercase tracking-widest">Guide</span>
            </div>
            <button onClick={onFinish} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
              <span className="sr-only">Close</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold dark:text-white mb-2 leading-tight">{step.title}</h3>
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
