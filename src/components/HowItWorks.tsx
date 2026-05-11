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
              <h3 className="text-3xl md:text-5xl font-display font-black tracking-tighter mb-4 leading-none text-zinc-950 dark:text-white">{step.title}</h3>
              <p className="text-zinc-500 text-sm md:text-base font-medium leading-relaxed max-w-[300px] md:max-w-sm mx-auto">{step.description}</p>
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
  return (
    <section className="relative py-32 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-8xl font-display font-black tracking-tighter text-center leading-[0.85] text-zinc-950 dark:text-white">
            How it <span className="text-lime-500">Works.</span>
          </h2>
          <p className="text-zinc-500 font-black mt-6 uppercase tracking-[0.3em] text-[10px] md:text-sm">Protocol 01: Onboarding Flow</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 p-10 flex flex-col items-center text-center gap-6 group hover:border-lime-500/30 transition-all duration-300"
            >
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl", step.color, step.shadow)}>
                 <step.icon className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-500 mb-2 block">Step 0{index + 1}</span>
                <h3 className="text-2xl font-display font-black tracking-tighter mb-4 leading-none text-zinc-950 dark:text-white">{step.title}</h3>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
