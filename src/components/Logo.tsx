import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  layout?: "horizontal" | "vertical";
  showText?: boolean;
}

export default function Logo({ className = "", size = 32, layout = "horizontal", showText = true }: LogoProps) {
  const isVertical = layout === "vertical";
  
  return (
    <div className={`flex ${isVertical ? "flex-col" : "flex-row"} items-center gap-2 ${className}`}>
      <img 
        src="/logo.svg" 
        alt="Chip NG Logo" 
        className={`${isVertical ? "mb-1" : ""} text-zinc-900 dark:text-white`}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
      
      {/* Brand Name */}
      {showText && (
        <div className={`flex items-baseline tracking-tighter ${isVertical ? "text-center" : ""}`}>
          <span className="font-black text-zinc-900 dark:text-white text-lg">CHIP</span>
          <span className="font-light text-zinc-900 dark:text-white text-lg">NG</span>
        </div>
      )}
    </div>
  );
}
