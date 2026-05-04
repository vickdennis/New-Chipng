import React from 'react';
import { cn } from '../lib/utils';
import { BrandIcons } from './icons/BrandIcons';
import { Globe } from 'lucide-react';

interface SocialIconProps {
  platform: string;
  username: string;
  className?: string;
  style?: 'colored' | 'mono' | 'glass';
  asLink?: boolean;
}

const BRAND_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#000000',
  x: '#000000',
  youtube: '#FF0000',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  whatsapp: '#25D366',
  github: '#181717',
  spotify: '#1DB954',
  snapchat: '#FFFC00',
  reddit: '#FF4500',
  discord: '#5865F2',
  telegram: '#26A5E4',
  twitch: '#9146FF',
  medium: '#000000',
  behance: '#1769FF',
  dribbble: '#EA4C89',
  threads: '#000000',
  pinterest: '#BD081C'
};

const SocialIcon: React.FC<SocialIconProps> = ({ 
  platform, 
  username, 
  className, 
  style = 'colored',
  asLink = true
}) => {
  const platformKey = platform.toLowerCase();
  const BrandIcon = BrandIcons[platformKey as keyof typeof BrandIcons];
  const brandColor = BRAND_COLORS[platformKey] || '#6366f1';

  const cleanUsername = (username || '').split('/').pop()?.replace('@', '') || '';

  const getUrl = () => {
    // If it's already a full URL, return it
    if (username && (username.startsWith('http') || username.includes('.com') || username.includes('.net'))) {
      return username;
    }

    switch (platformKey) {
      case 'instagram': return `https://instagram.com/${cleanUsername}`;
      case 'twitter': 
      case 'x': return `https://twitter.com/${cleanUsername}`;
      case 'facebook': return `https://facebook.com/${cleanUsername}`;
      case 'youtube': return `https://youtube.com/@${cleanUsername}`;
      case 'github': return `https://github.com/${cleanUsername}`;
      case 'linkedin': return `https://linkedin.com/in/${cleanUsername}`;
      case 'whatsapp': return `https://wa.me/${cleanUsername}`;
      case 'tiktok': return `https://tiktok.com/@${cleanUsername}`;
      case 'spotify': return `https://open.spotify.com/user/${cleanUsername}`;
      case 'snapchat': return `https://snapchat.com/add/${cleanUsername}`;
      case 'telegram': return `https://t.me/${cleanUsername}`;
      default: return cleanUsername.startsWith('http') ? cleanUsername : `https://${cleanUsername}`;
    }
  };

  const content = (
    <div className={cn(
      "relative transition-all duration-300 hover:scale-110 active:scale-95 group flex items-center justify-center p-2.5 rounded-2xl overflow-hidden shadow-sm border",
      style === 'glass' && "bg-white/10 backdrop-blur-md border-white/20 shadow-xl",
      style === 'colored' && "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800",
      style === 'mono' && "bg-zinc-900 dark:bg-zinc-100 border-white/5 grayscale saturate-0 shadow-inner",
      className
    )}>
      <div className="w-full h-full flex items-center justify-center">
        {BrandIcon ? (
          React.createElement(BrandIcon, { 
            className: "w-full h-full transition-all duration-300", 
            style: style === 'colored' || style === 'glass' 
              ? { color: brandColor } 
              : { color: style === 'mono' ? (platformKey === 'snapchat' ? '#000000' : '#ffffff') : '#ffffff' } 
          })
        ) : (
          <Globe className="w-1/2 h-1/2 text-zinc-400" />
        )}
      </div>
      
      {/* Premium overlay for glass effect */}
      {style === 'glass' && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
      )}
    </div>
  );

  if (asLink) {
    return (
      <a 
        href={getUrl()} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
};

export default SocialIcon;
