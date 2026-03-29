import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'icon-only' | 'app-icon' | 'favicon';
  color?: 'default' | 'neon' | 'white' | 'black';
}

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 'md',
  variant = 'default',
  color = 'default'
}) => {
  const sizes = {
    sm: variant === 'favicon' ? 'w-4 h-4' : 'w-8 h-8',
    md: variant === 'favicon' ? 'w-6 h-6' : 'w-12 h-12',
    lg: variant === 'favicon' ? 'w-12 h-12' : 'w-24 h-24',
    xl: variant === 'favicon' ? 'w-16 h-16' : 'w-32 h-32'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const colors = {
    default: 'text-current',
    neon: 'text-lime-400',
    white: 'text-white',
    black: 'text-black'
  };

  const iconSize = sizes[size];
  const textSize = textSizes[size];
  const textColor = colors[color];

  const Icon = () => (
    <div className={`relative ${iconSize} ${variant === 'app-icon' ? 'bg-zinc-900 rounded-[22%] p-[15%] flex items-center justify-center shadow-xl' : ''}`}>
      <svg 
        viewBox="0 0 100 100" 
        className={`w-full h-full fill-none ${textColor} stroke-current`}
        strokeWidth={variant === 'favicon' ? "4" : "2.5"}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Chip Body */}
        <rect x="25" y="25" width="50" height="50" rx="8" className="fill-current opacity-10" />
        <rect x="25" y="25" width="50" height="50" rx="8" strokeWidth={variant === 'favicon' ? "6" : "4"} />
        
        {/* Circuit Pins - Simplified for Favicon */}
        {variant !== 'favicon' && (
          <>
            {/* Top */}
            <line x1="35" y1="25" x2="35" y2="15" />
            <line x1="50" y1="25" x2="50" y2="15" />
            <line x1="65" y1="25" x2="65" y2="15" />
            
            {/* Bottom */}
            <line x1="35" y1="75" x2="35" y2="85" />
            <line x1="50" y1="75" x2="50" y2="85" />
            <line x1="65" y1="75" x2="65" y2="85" />
            
            {/* Left */}
            <line x1="25" y1="35" x2="15" y2="35" />
            <line x1="25" y1="50" x2="15" y2="50" />
            <line x1="25" y1="65" x2="15" y2="65" />
            
            {/* Right */}
            <line x1="75" y1="35" x2="85" y2="35" />
            <line x1="75" y1="50" x2="85" y2="50" />
            <line x1="75" y1="65" x2="85" y2="65" />
          </>
        )}

        {/* Abstract Core Shape - Slightly Imperfect */}
        <path 
          d="M42,42 C44,39 56,39 58,42 C61,45 61,55 58,58 C56,61 44,61 42,58 C39,55 39,45 42,42 Z" 
          className="fill-current"
        />
      </svg>
    </div>
  );

  if (variant === 'icon-only' || variant === 'app-icon' || variant === 'favicon') {
    return <Icon />;
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Icon />
      <div className={`flex items-center gap-1 font-sans tracking-tighter ${textSize}`}>
        <span className="font-black uppercase">Chip</span>
        <span className="font-light uppercase opacity-70">NG</span>
      </div>
    </div>
  );
};

export default Logo;
