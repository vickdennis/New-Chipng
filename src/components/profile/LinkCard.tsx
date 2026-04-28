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
  variant?: 'standard' | 'featured' | 'card';
}

export const LinkCard: React.FC<LinkCardProps> = ({ link, profile, onClick, index, variant = 'standard' }) => {
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
  
  const isFeatured = variant === 'featured';
  const isCard = variant === 'card';

  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.08, 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      whileHover={{ scale: isFeatured ? 1.01 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(link.id, link.url)}
      className={cn(
        "group relative w-full flex items-center justify-between",
        isFeatured ? "p-8 md:p-10 flex-col gap-6 text-center h-48 md:h-64 justify-center" : "p-4 md:p-5",
        "bg-white/10 hover:bg-white/15 backdrop-blur-xl",
        "border border-white/20 shadow-xl",
        (isCard || isFeatured) ? "shadow-2xl shadow-black/20" : "",
        "transition-all duration-300 ease-out",
        btnShape,
        !profile.textColor && theme.buttonText
      )}
      style={profile.textColor ? { color: profile.textColor } : {}}
    >
      <div className={cn(
        "flex items-center gap-4 flex-1",
        isFeatured ? "flex-col w-full" : ""
      )}>
        {/* Favicon Container */}
        <div className={cn(
          "rounded-xl bg-black/20 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-110 transition-transform",
          isFeatured ? "w-16 h-16 md:w-20 md:h-20" : "w-10 h-10"
        )}>
          <img 
            src={link.icon || getFavicon(link.url) || ''} 
            alt="" 
            className={isFeatured ? "w-10 h-10 md:w-12 md:h-12" : "w-6 h-6 object-contain"}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            referrerPolicy="no-referrer"
          />
        </div>
        
        {/* Title */}
        <span 
          className={cn(
            "font-bold tracking-tight truncate",
            !profile.textColor && "text-white",
            isFeatured ? "text-2xl md:text-3xl font-black italic" : "text-lg md:text-xl text-left pr-4"
          )}
          style={profile.textColor ? { color: profile.textColor } : {}}
        >
          {link.title}
        </span>
      </div>

      {/* Right Icon - Hide in featured */}
      {!isFeatured && (
        <div className="flex-shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
          <ChevronRight 
            className="w-6 h-6" 
            style={profile.textColor ? { color: profile.textColor } : { color: 'white' }}
          />
        </div>
      )}

      {/* Subtle Shine Effect on Hover */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
    </motion.button>
  );
};
