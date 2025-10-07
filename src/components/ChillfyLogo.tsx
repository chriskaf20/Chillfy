import React from 'react';
import Image from 'next/image';

interface ChillfyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const ChillfyLogo: React.FC<ChillfyLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeClasses: Record<string, string> = {
    sm: 'h-8',
    md: 'h-10 md:h-12',
    lg: 'h-16',
    xl: 'h-20',
  };

  const logoHeight = sizeClasses[size];

  return (
    <div className={`flex items-center group ${className}`}>
      <Image
        src="/chillfy-logo.png"
        alt="Chillfy Logo"
        width={300}
        height={80}
        className={`${logoHeight} w-auto object-contain transition-all duration-300 group-hover:scale-105`}
        priority
      />
      {showText && (
        <span className="ml-3 text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-teal-300 transition-all duration-300">
          Chillfy
        </span>
      )}
    </div>
  );
};