import React from 'react';

interface VerificationBadgeProps {
  className?: string;
  size?: number;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ className = '', size = 16 }) => {
  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title="Verified"
    >
      <svg 
        viewBox="0 0 24 24" 
        aria-label="Verified account" 
        className="w-full h-full text-[#1D9BF0] fill-current"
      >
        <g>
          <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.97-.81-4.01s-2.62-1.27-4.01-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.98-.2-4.02.81s-1.27 2.62-.81 4.01c-1.31.67-2.19 1.91-2.19 3.34s.88 2.67 2.19 3.34c-.46 1.39-.2 2.97.81 4.01s2.62 1.27 4.01.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.33-2.19c1.4.46 2.98.2 4.02-.81s1.27-2.62.81-4.01c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2l-3.54-3.54 1.41-1.41 2.13 2.12 5.13-5.13 1.41 1.41-6.54 6.55z"></path>
        </g>
      </svg>
    </div>
  );
};
