import React from 'react';
import { motion } from 'motion/react';
import { User, THEMES } from '../../types';
import { VerificationBadge } from '../VerificationBadge';
import { Link2 } from 'lucide-react';

interface ProfileHeaderProps {
  profile: User;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  const theme = THEMES[profile.theme];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center w-full px-4 mb-8"
    >
      {/* Avatar with Glow Effect */}
      <div className="relative mb-6 group">
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
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            @{profile.username}
          </h1>
          {profile.isVerified && (
            <VerificationBadge size={22} />
          )}
        </div>
        {profile.displayName && (
          <h2 className="text-lg font-medium text-white/90">
            {profile.displayName}
          </h2>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-white/70 text-base md:text-lg max-w-sm leading-relaxed"
        >
          {profile.bio}
        </motion.p>
      )}
    </motion.div>
  );
};
