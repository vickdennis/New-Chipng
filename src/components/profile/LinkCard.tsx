import React from 'react';
import { motion } from 'motion/react';
import { Link, THEMES, User } from '../../types';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LinkCardProps {
  link: Link;
  profile: User;
  onClick: (id: string, url: string) => void;
  index: number;
}

export const LinkCard: React.FC<LinkCardProps> = ({ link, profile, onClick, index }) => {
  const theme = THEMES[profile.theme];
  
  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
      return null;
    }
  };

  const btnShape = profile.buttonStyle === 'pill' ? 'rounded-full' : profile.buttonStyle === 'rounded' ? 'rounded-2xl' : 'rounded-none';

  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.08, 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(link.id, link.url)}
      className={cn(
        "group relative w-full p-4 md:p-5 flex items-center justify-between",
        "bg-white/10 hover:bg-white/15 backdrop-blur-xl",
        "border border-white/20 shadow-xl",
        "transition-all duration-300 ease-out",
        btnShape,
        theme.buttonText // Usually text-white in dark mode LinkMe style
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Favicon Container */}
        <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform">
          <img 
            src={link.icon || getFavicon(link.url) || ''} 
            alt="" 
            className="w-6 h-6 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            referrerPolicy="no-referrer"
          />
        </div>
        
        {/* Title */}
        <span className="text-lg md:text-xl font-bold text-white tracking-tight text-left truncate pr-4">
          {link.title}
        </span>
      </div>

      {/* Right Icon */}
      <div className="flex-shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
        <ChevronRight className="w-6 h-6 text-white" />
      </div>

      {/* Subtle Shine Effect on Hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
    </motion.button>
  );
};
