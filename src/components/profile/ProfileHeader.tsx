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
        <div className="absolute top-[-64px] left-[-24px] right-[-24px] h-48 md:h-64 z-0 overflow-hidden rounded-b-[3rem]">
          <img 
            src={profile.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </div>
      )}

      {/* Avatar with Glow Effect */}
      <div className={`relative mb-6 group ${profile.coverImage ? 'mt-32 md:mt-44' : ''}`}>
        <div className="absolute -inset-1 bg-gradient-to-r from-lime-400 to-emerald-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white inline-block shadow-2xl">
          {profile.photoURL ? (
            <img 
              src={profile.photoURL} 
              alt={profile.username} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
              <Link2 className="w-12 h-12" />
            </div>
          )}
        </div>
      </div>

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
