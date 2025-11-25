'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  className,
  orientation = 'horizontal',
}) => {
  const sizeConfig = {
    small: {
      mainFontSize: 'text-3xl',
      imageSize: 56,
      gap: 'gap-2',
    },
    medium: {
      mainFontSize: 'text-4xl',
      imageSize: 72,
      gap: 'gap-3',
    },
    large: {
      mainFontSize: 'text-5xl',
      imageSize: 88,
      gap: 'gap-4',
    },
  };

  const config = sizeConfig[size];
  const isVertical = orientation === 'vertical';

  return (
    <div 
      className={cn(
        'flex items-center',
        isVertical ? 'flex-col' : 'flex-row',
        config.gap,
        className
      )}
    >
      <h1 className={cn(
        'font-black text-foreground tracking-tight',
        config.mainFontSize
      )}>
        GENKI
      </h1>
      <Image
        src="/genki-head.png"
        alt="Genki Head"
        width={config.imageSize}
        height={config.imageSize}
        className="object-contain"
        priority
        quality={100}
        unoptimized={false}
      />
    </div>
  );
};

