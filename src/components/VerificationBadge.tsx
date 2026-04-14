import React from 'react';

interface VerificationBadgeProps {
  className?: string;
  size?: number;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ className = '', size = 16 }) => {
  return (
    <div 
      className={`inline-flex items-center justify-center bg-[#0095F6] rounded-full p-0.5 ${className}`}
      style={{ width: size, height: size }}
      title="Verified"
    >
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-full h-full"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
};
