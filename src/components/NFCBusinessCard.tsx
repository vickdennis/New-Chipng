import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'motion/react';
import { Mail, Github, Globe, Linkedin, Smartphone, Zap } from 'lucide-react';
import Logo from './Logo';

const NFCBusinessCard: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const [isFlipped, setIsFlipped] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isScanning) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);
    
    setRotateX(-y * 20); // Tilt up/down
    setRotateY(x * 20);  // Tilt left/right
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleCardClick = () => {
    if (isScanning) return;
    setIsScanning(true);
    // Trigger vibration if available
    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }
    
    setTimeout(() => {
      setIsScanning(false);
      setIsFlipped(!isFlipped);
    }, 1500);
  };

  return (
    <div className="relative h-[300px] w-[500px] perspective-1000 mt-20 mb-40 hidden md:block">
      <motion.div
        ref={cardRef}
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
        }}
        animate={{ 
          rotateY: isFlipped ? 180 : rotateY,
        }}
        transition={{ duration: 0.6, type: 'spring', damping: 20 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        className="w-full h-full relative preserve-3d transition-transform duration-200 ease-out cursor-pointer group"
      >
        {/* Front of the Card */}
        <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-8 border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden">
          {/* NFC Chip Indicator */}
          <div className="absolute top-8 right-8 flex flex-col items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
             <Smartphone className="w-5 h-5 text-lime-400" />
             <div className="w-8 h-1 bg-lime-400 rounded-full animate-pulse" />
          </div>

          <div className="flex items-center gap-4">
            <div className="rotate-3 drop-shadow-2xl">
               <Logo size="md" variant="app-icon" color="neon" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-white">Chip NG</h3>
              <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">NFC Business Card</p>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-3 text-zinc-400">
               <Mail className="w-4 h-4 text-lime-500" />
               <span className="text-sm font-medium">hello@chipng.com</span>
             </div>
             <div className="flex items-center gap-3 text-zinc-400">
               <Globe className="w-4 h-4 text-lime-500" />
               <span className="text-sm font-medium">www.chipng.com/alex</span>
             </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-lime-400 flex items-center justify-center text-[10px] font-bold text-zinc-950">
                +10k
              </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] text-zinc-600 font-mono">SERIES A-01</p>
               <p className="text-xs text-lime-400 font-bold uppercase tracking-widest">Ready to tap</p>
            </div>
          </div>

          {/* Glossy Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

          {/* Scan Simulation Overlay */}
          <AnimatePresence>
            {isScanning && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-lime-400/20 backdrop-blur-sm flex flex-col items-center justify-center z-20"
              >
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center shadow-[0_0_50_rgba(163,230,53,0.5)]"
                >
                  <Smartphone className="w-10 h-10 text-zinc-950" />
                </motion.div>
                <p className="text-lime-400 font-black mt-4 uppercase tracking-widest animate-pulse">Scanning...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back of the Card (Simplified) */}
        <div className="absolute inset-0 w-full h-full backface-hidden [transform:rotateY(180deg)] bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-[0_20px_50_rgba(0,0,0,0.5)] flex items-center justify-center">
           <div className="text-center">
              <div className="w-24 h-24 bg-white p-2 rounded-2xl mx-auto mb-4">
                 <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://chipng.com" alt="QR" className="w-full h-full" />
              </div>
              <p className="text-zinc-400 text-sm font-medium">Scan to visit profile</p>
              <div className="mt-6 flex items-center justify-center gap-2 text-lime-400 font-bold text-xs">
                <Zap className="w-3 h-3" />
                <span>CHIP TECHNOLOGY</span>
              </div>
           </div>
        </div>
      </motion.div>

      {/* Decorative shadows and glows */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-black/40 blur-2xl rounded-full -z-10" />
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-full h-full bg-lime-400/5 blur-[120px] rounded-full -z-20 animate-pulse" />
    </div>
  );
};

export default NFCBusinessCard;
