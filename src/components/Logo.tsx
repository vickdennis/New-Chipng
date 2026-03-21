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
      {/* Microchip Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isVertical ? "mb-1" : ""}
      >
        {/* Chip Body */}
        <rect x="25" y="25" width="50" height="50" stroke="currentColor" strokeWidth="2.5" />
        
        {/* Pins - Top */}
        <line x1="35" y1="15" x2="35" y2="25" stroke="currentColor" strokeWidth="2.5" />
        <line x1="50" y1="15" x2="50" y2="25" stroke="currentColor" strokeWidth="2.5" />
        <line x1="65" y1="15" x2="65" y2="25" stroke="currentColor" strokeWidth="2.5" />
        
        {/* Pins - Bottom */}
        <line x1="35" y1="75" x2="35" y2="85" stroke="currentColor" strokeWidth="2.5" />
        <line x1="50" y1="75" x2="50" y2="85" stroke="currentColor" strokeWidth="2.5" />
        <line x1="65" y1="75" x2="65" y2="85" stroke="currentColor" strokeWidth="2.5" />
        
        {/* Pins - Left */}
        <line x1="15" y1="35" x2="25" y2="35" stroke="currentColor" strokeWidth="2.5" />
        <line x1="15" y1="50" x2="25" y2="50" stroke="currentColor" strokeWidth="2.5" />
        <line x1="15" y1="65" x2="25" y2="65" stroke="currentColor" strokeWidth="2.5" />
        
        {/* Pins - Right */}
        <line x1="75" y1="35" x2="85" y2="35" stroke="currentColor" strokeWidth="2.5" />
        <line x1="75" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="2.5" />
        <line x1="75" y1="65" x2="85" y2="65" stroke="currentColor" strokeWidth="2.5" />
        
        {/* Internal Pattern - Abstract square */}
        <rect x="35" y="35" width="30" height="30" fill="currentColor" fillOpacity="0.1" />
        <path
          d="M38 38 L42 45 L48 40 L55 50 L62 42 L60 58 L50 62 L42 55 L38 60 Z"
          fill="currentColor"
        />
      </svg>
      
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
