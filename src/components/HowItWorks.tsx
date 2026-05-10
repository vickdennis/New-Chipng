import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { UserPlus, Layout, Share2, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';

const steps = [
  {
    title: "Claim your space",
    description: "Secure your unique /username in seconds. It's yours forever.",
    icon: UserPlus,
    color: "bg-blue-500",
    shadow: "shadow-blue-500/20"
  },
  {
    title: "Design your world",
    description: "Add links, products, and custom themes to match your brand's vibe.",
    icon: Layout,
    color: "bg-lime-500",
    shadow: "shadow-lime-500/20"
  },
  {
    title: "Share everywhere",
    description: "One link for all your social bios, business cards, and messages.",
    icon: Share2,
    color: "bg-purple-500",
    shadow: "shadow-purple-500/20"
  },
  {
    title: "Track your growth",
    description: "Real-time analytics show you where your audience is coming from.",
    icon: TrendingUp,
    color: "bg-orange-500",
    shadow: "shadow-orange-500/20"
  }
];

const HowItWorksStep = ({ step, index, progress }: { step: typeof steps[0], index: number, progress: any }) => {
  const y = useTransform(progress, [0, 1], [50, -50]);
  const rotate = useTransform(progress, [0.35, 0.65], [0, 180]);
  const scale = useTransform(progress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);
  const opacity = useTransform(progress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const z = useTransform(progress, [0.4, 0.5, 0.6], [0, 100, 0]);

  return (
    <motion.div 
      style={{ y, scale, opacity, z }}
      className="absolute inset-x-0 top-0 bottom-0 flex items-center justify-center p-4 md:p-8 pointer-events-none"
    >
      <div className="relative w-full max-w-[90%] md:max-w-lg aspect-square md:aspect-[4/3] group perspective-2000">
        <motion.div 
          style={{ rotateY: rotate }}
          className="w-full h-full relative preserve-3d transition-transform duration-700 ease-out"
        >
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-900 rounded-[2.5rem] md:rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl p-8 md:p-12 flex flex-col items-center text-center justify-center gap-4 md:gap-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              className={cn("w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-white shadow-2xl skew-x-3", step.color, step.shadow)}
            >
               <step.icon className="w-8 h-8 md:w-10 md:h-10" />
            </motion.div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-500 mb-2 block">Step 0{index + 1}</span>
              <h3 className="text-3xl md:text-4xl font-black tracking-tighter mb-3 md:mb-4 leading-none">{step.title}</h3>
              <p className="text-zinc-500 text-sm md:text-base font-medium leading-relaxed max-w-[280px] md:max-w-sm mx-auto">{step.description}</p>
            </div>
            
            {/* Visual Decor */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center opacity-20">
               <div className="flex gap-1">
                  {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-current" />)}
               </div>
               <div className="text-[8px] font-black tracking-widest uppercase">Chip NG Protocol v1.0</div>
            </div>
          </div>

          {/* Back Side (Flip) */}
          <div className="absolute inset-0 backface-hidden bg-zinc-950 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 flex flex-col items-center text-center justify-center gap-6 rotate-y-180 border border-white/5">
            <div className="w-full space-y-6">
               <div className="space-y-3">
                  <div className="h-2 bg-gradient-to-r from-lime-400 to-transparent rounded-full w-full" />
                  <div className="h-2 bg-gradient-to-r from-blue-400 to-transparent rounded-full w-2/3" />
                  <div className="h-2 bg-gradient-to-r from-purple-400 to-transparent rounded-full w-1/2" />
               </div>
               
               <div className="flex justify-center gap-4 py-8">
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className={cn("w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center", step.shadow)}
                  >
                     <step.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </motion.div>
               </div>

               <div className="space-y-2">
                  <div className="text-white font-black text-xl md:text-2xl tracking-tighter">Ready to launch?</div>
                  <div className="text-zinc-500 text-xs md:text-sm font-medium">Join 50,000+ creators today.</div>
               </div>
               
               <div className="pt-4 overflow-hidden">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="inline-block px-6 py-3 bg-lime-400 text-zinc-950 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-lime-400/20"
                  >
                    Start Free
                  </motion.div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

const HowItWorks: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const bgGradient = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [
      "radial-gradient(circle at 50% 50%, rgba(163, 230, 53, 0.05), transparent 70%)",
      "radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05), transparent 70%)",
      "radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.05), transparent 70%)",
      "radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.05), transparent 70%)",
      "radial-gradient(circle at 50% 50%, rgba(163, 230, 53, 0.05), transparent 70%)"
    ]
  );

  return (
    <section ref={containerRef} className="relative h-[500vh] bg-white dark:bg-zinc-950 overflow-visible">
      {/* Interactive Background */}
      <motion.div 
        style={{ background: bgGradient }}
        className="fixed inset-0 pointer-events-none z-0"
      />

      {/* Progress Line - Vertical on desktop, bottom-fixed on mobile */}
      <div className="fixed right-6 md:right-12 top-1/2 -translate-y-1/2 flex flex-col gap-3 md:gap-4 z-50">
        {steps.map((_, i) => {
          const stepStart = i / steps.length;
          const stepEnd = (i + 1) / steps.length;
          
          const isActive = useTransform(
            scrollYProgress,
            [stepStart, stepStart + 0.05, stepEnd - 0.05, stepEnd],
            [0.2, 1, 1, 0.2]
          );

          const scale = useTransform(
            scrollYProgress,
            [stepStart, stepStart + 0.05, stepEnd - 0.05, stepEnd],
            [1, 1.5, 1.5, 1]
          );

          return (
            <motion.div 
              key={i}
              style={{ opacity: isActive, scale }}
              className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-lime-500 shadow-[0_0_10px_rgba(163,230,53,0.5)]"
            />
          );
        })}
      </div>

      {/* Sticky Header */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-start pt-20 md:pt-32 pointer-events-none z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center px-6"
        >
          <h2 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter text-center leading-[0.9]">
            How it <br className="md:hidden" /><span className="text-lime-500">Works.</span>
          </h2>
          <p className="text-zinc-500 font-bold mt-4 md:mt-6 uppercase tracking-widest text-[10px] md:text-sm">Experience the magic in 4 steps</p>
        </motion.div>
      </div>

      {/* Steps Content */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {steps.map((step, index) => {
          const stepStart = index / steps.length;
          const stepEnd = (index + 1) / steps.length;
          
          const stepProgress = useTransform(
            scrollYProgress,
            [stepStart, stepEnd],
            [0, 1]
          );

          return (
            <HowItWorksStep 
              key={index} 
              step={step} 
              index={index} 
              progress={stepProgress} 
            />
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;
