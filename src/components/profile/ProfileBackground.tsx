import React from 'react';
import { User, THEMES } from '../../types';

interface ProfileBackgroundProps {
  profile: User;
}

export const ProfileBackground: React.FC<ProfileBackgroundProps> = ({ profile }) => {
  const theme = THEMES[profile.theme];
  
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base Theme Background */}
      <div className={`absolute inset-0 ${theme.background}`} />
      
      {/* Custom Image Background (Pro/Premium Feature) */}
      {profile.backgroundType === 'image' && profile.backgroundImage && (
        <div 
          className="absolute inset-0 z-10 scale-110"
          style={{ 
            backgroundImage: `url(${profile.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(20px) brightness(0.7)'
          }}
        />
      )}

      {/* Dark Gradient Overlay for Readability */}
      <div className="absolute inset-0 z-20 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      
      {/* Grainy Noise Overlay (Optional for Premium Feel) */}
      <div className="absolute inset-0 z-30 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};
