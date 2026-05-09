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
  const y = useTransform(progress, [0, 1], [100, -100]);
  const rotate = useTransform(progress, [0.4, 0.6], [0, 180]);
  const scale = useTransform(progress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const opacity = useTransform(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.div 
      style={{ y, scale, opacity }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div className="relative w-full max-w-lg aspect-[4/3] group perspective-1000">
        <motion.div 
          style={{ rotateY: rotate }}
          className="w-full h-full relative preserve-3d transition-transform duration-500"
        >
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl p-12 flex flex-col items-center text-center justify-center gap-6">
            <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl", step.color, step.shadow)}>
               <step.icon className="w-10 h-10" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-500 mb-2 block">Step 0{index + 1}</span>
              <h3 className="text-4xl font-black tracking-tighter mb-4">{step.title}</h3>
              <p className="text-zinc-500 font-medium leading-relaxed max-w-sm">{step.description}</p>
            </div>
          </div>

          {/* Back Side (Flip) */}
          <div className="absolute inset-0 backface-hidden bg-zinc-950 rounded-[3rem] p-12 flex flex-col items-center text-center justify-center gap-6 rotate-y-180">
            <div className="w-full flex flex-col gap-4">
               <div className="h-4 bg-zinc-800 rounded-full w-full animate-pulse" />
               <div className="h-4 bg-zinc-800 rounded-full w-2/3 animate-pulse" />
               <div className="h-4 bg-zinc-800 rounded-full w-1/2 animate-pulse" />
               <div className="flex gap-4 mt-8">
                  <div className="w-12 h-12 bg-white/10 rounded-xl" />
                  <div className="w-12 h-12 bg-white/10 rounded-xl" />
                  <div className="w-12 h-12 bg-white/10 rounded-xl" />
               </div>
               <div className="mt-8 text-lime-400 font-black text-xl italic group-hover:scale-110 transition-transform">Get Started Today</div>
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

  return (
    <section ref={containerRef} className="relative h-[400vh] bg-white dark:bg-zinc-950 overflow-visible">
      {/* Sticky Header */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-start pt-32 pointer-events-none z-10">
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-center px-6">
          How it <span className="text-lime-500">Works.</span>
        </h2>
        <p className="text-zinc-500 font-bold mt-4 uppercase tracking-widest text-sm">Experience the magic in 4 steps</p>
      </div>

      {/* Steps Content */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {steps.map((step, index) => {
          const stepStart = index / steps.length;
          const stepEnd = (index + 1) / steps.length;
          
          // Custom progress for each step
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
