import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'icon-only';
}

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 'md',
  variant = 'default'
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const iconSize = sizes[size];
  const textSize = textSizes[size];

  const Icon = () => (
    <svg 
      viewBox="0 0 100 100" 
      className={`${iconSize} fill-none stroke-current`}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Chip Body */}
      <rect x="25" y="25" width="50" height="50" rx="8" className="fill-current opacity-10" />
      <rect x="25" y="25" width="50" height="50" rx="8" strokeWidth="4" />
      
      {/* Circuit Pins */}
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
      
      {/* Abstract Core Shape - Slightly Imperfect */}
      <path 
        d="M42,42 C44,39 56,39 58,42 C61,45 61,55 58,58 C56,61 44,61 42,58 C39,55 39,45 42,42 Z" 
        className="fill-current"
      />
    </svg>
  );

  if (variant === 'icon-only') {
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
