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

const SocialIcon: React.FC<SocialIconProps> = ({ 
  platform, 
  username, 
  className, 
  style = 'colored',
  asLink = true
}) => {
  const [imageError, setImageError] = React.useState(false);
  const platformKey = platform.toLowerCase();
  
  // Mapping for the extracted icons
  const iconPath = style === 'colored' 
    ? `/icons/colored/${platformKey}.png` 
    : style === 'mono' 
      ? `/icons/mono/${platformKey}.png`
      : `/icons/colored/${platformKey}.png`; // Glass uses colored PNG but with custom container style

  const getUrl = () => {
    switch (platformKey) {
      case 'instagram': return `https://instagram.com/${username}`;
      case 'twitter': 
      case 'x': return `https://twitter.com/${username}`;
      case 'facebook': return `https://facebook.com/${username}`;
      case 'youtube': return `https://youtube.com/@${username}`;
      case 'github': return `https://github.com/${username}`;
      case 'linkedin': return `https://linkedin.com/in/${username}`;
      case 'whatsapp': return `https://wa.me/${username}`;
      case 'tiktok': return `https://tiktok.com/@${username}`;
      case 'spotify': return `https://open.spotify.com/user/${username}`;
      case 'snapchat': return `https://snapchat.com/add/${username}`;
      case 'telegram': return `https://t.me/${username}`;
      default: return `https://${username}`;
    }
  };

  const BrandIcon = BrandIcons[platformKey as keyof typeof BrandIcons];

  const content = (
    <div className={cn(
      "relative transition-all duration-300 hover:scale-110 active:scale-95 group flex items-center justify-center p-2.5 rounded-2xl overflow-hidden",
      style === 'glass' && "bg-white/10 backdrop-blur-md border border-white/10 shadow-xl",
      style === 'colored' && "bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-md",
      style === 'mono' && "bg-zinc-900 dark:bg-zinc-100 border border-white/5 shadow-inner grayscale",
      className
    )}>
      {!imageError ? (
        <img 
          src={iconPath} 
          alt={platform}
          className={cn(
            "w-full h-full object-contain transition-all duration-500",
            style === 'mono' ? "opacity-90 contrast-125" : "group-hover:scale-110"
          )}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={cn(
          "w-full h-full flex items-center justify-center",
        )}>
          {BrandIcon ? (
            React.createElement(BrandIcon, { 
              className: "w-full h-full", 
              style: style === 'colored' || style === 'glass' ? { color: '#6366f1' } : { color: 'white' } 
            })
          ) : (
            <Globe className="w-1/2 h-1/2 text-zinc-400" />
          )}
        </div>
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
