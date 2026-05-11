import React from 'react';
import { motion } from 'motion/react';
import { User, THEMES, FontType } from '../../types';
import { VerificationBadge } from '../VerificationBadge';
import { Link2 } from 'lucide-react';

interface ProfileHeaderProps {
  profile: User;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  const theme = THEMES[profile.theme];

  const getFontFamily = (font?: FontType) => {
    switch (font) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      case 'display': return 'font-display';
      case 'modern': return 'font-sans tracking-tight';
      case 'elegant': return 'font-serif italic';
      case 'bold': return 'font-display font-black tracking-tighter uppercase';
      default: return 'font-sans';
    }
  };

  const fontFamily = getFontFamily(profile.profileFont);

  const customTextColor = profile.textColor || '';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col items-center text-center w-full mb-8 relative ${fontFamily}`}
      style={customTextColor ? { color: customTextColor } : {}}
    >
      {/* Cover Image */}
      {profile.coverImage && (
        <div className="absolute top-[-64px] left-[-24px] right-[-24px] h-64 md:h-80 z-0 overflow-hidden">
          <img 
            src={profile.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 dark:to-zinc-950" />
        </div>
      )}

      {/* Identity Placeholder Spacing (instead of avatar) */}
      <div className={profile.coverImage ? 'mt-48 md:mt-60' : 'mt-8'} />

      {/* Identity */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          {profile.displayName && (
            <h1 
              className={`text-3xl md:text-4xl font-black ${!customTextColor ? 'text-white drop-shadow-sm' : ''}`}
              style={customTextColor ? { color: customTextColor } : {}}
            >
              {profile.displayName}
            </h1>
          )}
          {profile.isVerified && (
            <VerificationBadge size={22} />
          )}
        </div>
        
        <h2 
          className={`text-lg md:text-xl font-medium ${!customTextColor ? 'text-white/80' : ''}`}
          style={customTextColor ? { color: customTextColor, opacity: 0.8 } : {}}
        >
          @{profile.username}
        </h2>
      </div>

      {/* Bio */}
      {profile.bio && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`mt-4 text-base md:text-lg max-w-sm leading-relaxed ${!customTextColor ? 'text-white/70' : ''}`}
          style={customTextColor ? { color: customTextColor, opacity: 0.7 } : {}}
        >
          {profile.bio}
        </motion.p>
      )}
    </motion.div>
  );
};
